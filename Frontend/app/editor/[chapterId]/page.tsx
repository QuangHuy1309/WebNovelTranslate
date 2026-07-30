"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { segmentService } from "../../../services/segmentService";
import { Segment } from "../../../types/segment";
import { useTheme } from "@/contexts/ThemeContext";
import { chapterService } from '@/services/chapterService';
import axios from "axios"; 

export default function EditorPage() {
  const params = useParams();
  const chapterId = Number(params.chapterId);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  
  // State mới để lưu thông tin Chương (Hiển thị Header)
  const [chapterInfo, setChapterInfo] = useState<{ chapterNumber?: number; title?: string } | null>(null);
  
  // State quản lý Modal Xuất bản dịch
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode, fontSize, setFontSize } = useTheme();

  useEffect(() => {
    if (!chapterId) return;

    let isMounted = true;

    const loadChapterData = async () => {
      try {
        // 1. Lấy thông tin chapter (Bọc try-catch riêng để nếu lỗi 404 thì vẫn chạy tiếp)
        try {
          const chapterRes = await axios.get(`http://localhost:5068/api/v1/Chapters/${chapterId}`);
          if (isMounted) setChapterInfo(chapterRes.data);
        } catch (chapterErr) {
          console.warn("Không tìm thấy thông tin chi tiết của Chương (API 404). Hiển thị ID mặc định.");
          // Bỏ qua lỗi này để code chạy tiếp xuống phần tải Segment
        }

        // 2. Lấy danh sách Segments (Phần quan trọng nhất)
        const segmentsData = await segmentService.getChapterSegments(chapterId);

        if (isMounted) {
          setSegments(segmentsData);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Đã xảy ra lỗi khi tải dữ liệu."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChapterData();

    return () => {
      isMounted = false;
    };
  }, [chapterId]); 

  // 2. Hàm kích hoạt Hangfire AI dịch cả chương
  const handleTranslateAll = async () => {
    try {
      setIsTranslating(true);
      await chapterService.translateChapter(chapterId);
      alert("🎉 Đã đưa tác vụ dịch vào hàng đợi (chạy ngầm). Vui lòng chờ ít phút và tải lại trang để xem kết quả!");
    } catch (error) {
      console.error("Lỗi dịch AI:", error);
      alert("Đã xảy ra lỗi khi gọi AI dịch.");
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. Hàm xử lý khi người dùng gõ phím vào khung Textarea
  const handleTranslationChange = (id: number, newText: string) => {
    setSegments((prevSegments) =>
      prevSegments.map((seg) =>
        seg.id === id ? { ...seg, translatedText: newText } : seg
      )
    );
  };

  // 4. Hàm Lưu bản dịch thủ công (ĐÃ FIX)
  const handleSaveSegment = async (segmentId: number, translatedText: string | null) => {
    try {
      // Đã chuyển sang dùng segmentService thay vì gọi axios chay (để ăn theo cấu hình api.ts)
      await segmentService.updateSegment(segmentId, translatedText || "");
      alert("Đã lưu bản dịch thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu đoạn:", error);
      alert("Có lỗi xảy ra khi lưu! Vui lòng kiểm tra Console.");
    }
  };

  // 5. Hàm Copy toàn bộ bản dịch vào Clipboard
  const handleCopyFullText = () => {
    const fullText = segments.map(s => s.translatedText || "").join("\n\n");
    navigator.clipboard.writeText(fullText);
    alert("Đã sao chép toàn bộ bản dịch vào bộ nhớ tạm!");
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu chương...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi: {error}</div>;

  // Xác định tên hiển thị trên Header (Ưu tiên ChapterNumber -> Title -> ID)
  const headerDisplayName = chapterInfo?.chapterNumber 
    ? `Chương ${chapterInfo.chapterNumber}` 
    : (chapterInfo?.title || `Chapter ${chapterId}`);

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      
      {/* Header Bar */}
      <header className={`border-b px-6 py-4 flex justify-between items-center shadow-sm z-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-6">
          <h1 className={`text-xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
            Translation Editor - {headerDisplayName}
          </h1>
          <div className="flex items-center gap-2">
            <label htmlFor="fontSizeInput" className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Cỡ chữ:
            </label>
            <input
              id="fontSizeInput"
              type="number"
              min="12"
              max="32"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className={`w-16 px-2 py-1 border rounded outline-none transition-colors focus:ring-2 focus:ring-blue-500
                ${isDarkMode 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
            />
            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>px</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {segments.length} Segments
          </span>
          <button 
            onClick={toggleDarkMode}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow transition-all ${
              isDarkMode ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400" : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            {isDarkMode ? "☀️ Sáng" : "🌙 Tối"}
          </button>
          
          {/* NÚT MỚI: XUẤT TOÀN BỘ BẢN DỊCH */}
          <button 
            onClick={() => setShowExportModal(true)}
            className="font-semibold py-1.5 px-4 rounded shadow-lg transition-all text-sm bg-green-600 hover:bg-green-700 text-white"
          >
            📄 Xuất Toàn Bộ
          </button>

          <button 
            onClick={handleTranslateAll}
            disabled={isTranslating}
            className={`font-semibold py-1.5 px-4 rounded shadow-lg transition-all text-sm ${
              isTranslating ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            {isTranslating ? '⏳ Đang xử lý...' : '✨ Dịch AI Toàn Bộ'}
          </button>
        </div>
      </header>

      {/* Workspace: Split-view */}
      <main className="flex-1 overflow-hidden flex">
        
        {/* Cột trái: Tiếng Anh (Original) */}
        <section className={`w-1/2 h-full overflow-y-auto border-r transition-colors duration-300 relative ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="sticky top-0 z-10 bg-slate-900 py-3 px-6 border-b border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Nguồn (Tiếng Anh)
            </h2>
          </div>
          <div className="space-y-6 p-6">
            {segments.map((seg) => (
              <div 
                key={`orig-${seg.id}`} 
                style={{ fontSize: `${fontSize}px` }}
                className={`p-4 rounded border leading-relaxed min-h-[120px] transition-colors ${
                  isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                {seg.originalText}
              </div>
            ))}
          </div>
        </section>

        {/* CỘT PHẢI: Khung nhập bản dịch */}
        <div className="flex-1 h-full overflow-y-auto bg-slate-800 relative">
          <div className="sticky top-0 z-10 bg-slate-800 py-3 px-6 border-b border-slate-700 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Bản dịch (Tiếng Việt)
            </h2>
          </div>

          <div className="space-y-6 p-6">
            {segments.map((segment) => (
              <div key={segment.id} className="relative group">
                <textarea
                  rows={12}
                  style={{ fontSize: `${fontSize}px` }} // Đồng bộ cỡ chữ cho textarea
                  className="w-full min-h-[300px] p-5 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y leading-snug shadow-inner"
                  placeholder="Nhập bản dịch tại đây..."
                  value={segment.translatedText || ""}
                  onChange={(e) => handleTranslationChange(segment.id, e.target.value)}
                />
                
                <button 
                  onClick={() => handleSaveSegment(segment.id, segment.translatedText)}
                  className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium shadow-md transition-colors"
                >
                  Lưu
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* === MODAL XUẤT TOÀN BỘ BẢN DỊCH === */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
            
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                Văn bản hoàn chỉnh - {headerDisplayName}
              </h2>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 p-6 overflow-hidden">
              <textarea
                readOnly
                value={segments.map(s => s.translatedText || "").join("\n\n")}
                className={`w-full h-full p-4 rounded-lg resize-none outline-none leading-relaxed ${
                  isDarkMode 
                    ? "bg-gray-900 text-gray-200 border-gray-700" 
                    : "bg-gray-50 text-gray-800 border-gray-300"
                } border focus:ring-2 focus:ring-blue-500`}
                style={{ fontSize: `${fontSize}px` }}
              />
            </div>

            <div className={`px-6 py-4 border-t flex justify-end gap-4 ${isDarkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50 rounded-b-xl"}`}>
              <button 
                onClick={() => setShowExportModal(false)}
                className={`px-6 py-2 rounded font-medium transition-colors ${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                Đóng
              </button>
              <button 
                onClick={handleCopyFullText}
                className="px-6 py-2 rounded font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2"
              >
                📋 Sao chép
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}