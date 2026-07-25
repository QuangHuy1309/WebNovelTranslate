"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { segmentService } from "../../../services/segmentService";
import { Segment } from "../../../types/segment";
import SegmentEditor from "../../../components/SegmentEditor";
import { useTheme } from "@/contexts/ThemeContext";

export default function EditorPage() {
  const params = useParams();
  const chapterId = Number(params.chapterId);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode, fontSize, setFontSize } = useTheme();

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await segmentService.getChapterSegments(chapterId);
        setSegments(data);
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Đã xảy ra lỗi khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchSegments();
    }
  }, [chapterId]);

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
          
          {/* Thanh nhập số: Chỉnh cỡ chữ (Đảm bảo tương phản màu sắc) */}
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
          
          {/* Nút Toggle Sáng/Tối */}
          <button 
            onClick={toggleDarkMode}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow transition-all ${
              isDarkMode 
                ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400" 
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            {isDarkMode ? "☀️ Chế độ Sáng" : "🌙 Chế độ Tối"}
          </button>
        </div>
      </header>

      {/* Workspace: Split-view */}
      <main className="flex-1 overflow-hidden flex">
        
        {/* Cột trái: Tiếng Anh (Original) */}
        <section className={`w-1/2 h-full overflow-y-auto border-r p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider mb-6 sticky top-0 pb-2 z-10 ${isDarkMode ? "text-gray-400 bg-gray-900" : "text-gray-400 bg-white"}`}>
            Nguồn (Tiếng Anh)
          </h2>
          <div className="space-y-6">
            {segments.map((seg) => (
              <div 
                key={`orig-${seg.id}`} 
                style={{ fontSize: `${fontSize}px` }} // Áp dụng cỡ chữ
                className={`p-4 rounded border leading-relaxed min-h-[120px] transition-colors ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 text-gray-300" 
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                {seg.originalText}
              </div>
            ))}
          </div>
        </section>

        {/* Cột phải: Tiếng Việt (Bản dịch / Chỉnh sửa) */}
        <section className={`w-1/2 h-full overflow-y-auto p-6 transition-colors duration-300 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider mb-6 sticky top-0 pb-2 z-10 ${isDarkMode ? "text-gray-400 bg-gray-800" : "text-gray-400 bg-gray-100"}`}>
            Bản Dịch (Tiếng Việt)
          </h2>
          <div className="space-y-6">
            {segments.map((seg) => (
              <SegmentEditor 
                key={`trans-${seg.id}`} 
                segment={seg} 
                isDarkMode={isDarkMode} // Truyền trạng thái màu sắc xuống component con
                fontSize={fontSize}     // Truyền cỡ chữ xuống component con
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}