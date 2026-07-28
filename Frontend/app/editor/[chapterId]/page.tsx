"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { segmentService } from "../../../services/segmentService";
import { Segment } from "../../../types/segment";
import { useTheme } from "@/contexts/ThemeContext";
import { chapterService } from '@/services/chapterService';
import axios from "axios"; // Đừng quên import axios

export default function EditorPage() {
  const params = useParams();
  const chapterId = Number(params.chapterId);
  const [isTranslating, setIsTranslating] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode, fontSize, setFontSize } = useTheme();

  // 1. Dùng useCallback để bọc hàm fetchSegments lại và thêm chapterId vào mảng dependency
  const fetchSegments = useCallback(async () => {
    try {
      const data = await segmentService.getChapterSegments(chapterId);
      setSegments(data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Đã xảy ra lỗi khi tải dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  // 2. Khai báo useEffect an toàn với mảng dependency đầy đủ
  useEffect(() => {
    if (chapterId) {
      // Để tránh cảnh báo của linter về việc gọi trực tiếp hàm chứa setState trong effect,
      // ta có thể khởi chạy nó thông qua một hàm ẩn danh bất đồng bộ (IIFE) 
      // hoặc đơn giản là truyền callback đã được memoize vào.
      const initFetch = async () => {
        await fetchSegments();
      };
      
      initFetch();
    }
  }, [chapterId, fetchSegments]);

  // 2. Hàm kích hoạt Hangfire AI dịch cả chương
  const handleTranslateAll = async () => {
    try {
      setIsTranslating(true);
      await chapterService.translateChapter(Number(params.chapterId));
      alert("🎉 Đã đưa tác vụ dịch vào hàng đợi (chạy ngầm). Vui lòng chờ ít phút và tải lại trang để xem kết quả!");
    } catch (error) {
      console.error("Lỗi dịch AI:", error);
      alert("Đã xảy ra lỗi khi gọi AI dịch.");
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. Hàm xử lý khi người dùng gõ phím vào khung Textarea (Fix lỗi số 2)
  const handleTranslationChange = (id: number, newText: string) => {
    setSegments((prevSegments) =>
      prevSegments.map((seg) =>
        seg.id === id ? { ...seg, translatedText: newText } : seg
      )
    );
  };

  // 4. Hàm Lưu bản dịch thủ công khi bấm nút Lưu
  const handleSaveSegment = async (segmentId: number, translatedText: string | null) => {
    try {
      // Gọi API cập nhật của bạn
      await axios.put(`http://localhost:5068/api/v1/Segments/${segmentId}/edit`, {
        translatedText: translatedText || ""
      });
      alert("Đã lưu bản dịch thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu đoạn:", error);
      alert("Có lỗi xảy ra khi lưu!");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu chương...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi: {error}</div>;

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header Bar */}
      <header className={`border-b px-6 py-4 flex justify-between items-center shadow-sm z-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-6">
          <h1 className={`text-xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
            Translation Editor - Chapter {chapterId}
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
            {isDarkMode ? "☀️ Chế độ Sáng" : "🌙 Chế độ Tối"}
          </button>
          <button 
            onClick={handleTranslateAll}
            disabled={isTranslating}
            className={`ml-4 font-semibold py-1.5 px-4 rounded shadow-lg transition-all text-sm ${
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
                  className="w-full min-h-[300px] p-5 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y text-lg leading-snug shadow-inner"
                  placeholder="Nhập bản dịch tại đây..."
                  value={segment.translatedText || ""} /* Fix lỗi số 1: Thêm || "" để tránh truyền null */
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
    </div>
  );
}