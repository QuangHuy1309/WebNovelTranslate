"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { chapterService, Chapter } from "../services/chapterService";
import { useTheme } from "../contexts/ThemeContext"; // Import hook

export default function Dashboard() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useTheme(); // Lấy state Sáng/Tối

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const data = await chapterService.getAllChapters();
        setChapters(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách chương:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, []);

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900 text-gray-400" : "text-gray-500"}`}>Đang tải...</div>;

  return (
    <div className={`min-h-screen transition-colors duration-300 p-8 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Quản lý Bản dịch</h1>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-lg text-sm font-bold shadow transition-all ${isDarkMode ? "bg-yellow-500 text-gray-900" : "bg-gray-800 text-white"}`}
            >
              {isDarkMode ? "☀️ Sáng" : "🌙 Tối"}
            </button>
            <Link href="/ingest">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow transition-colors">
                + Nạp chương mới
              </button>
            </Link>
          </div>
        </div>

        {chapters.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Chưa có dữ liệu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {chapters.map((chapter) => (
              <Link href={`/editor/${chapter.id}`} key={chapter.id}>
                <div className={`p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${isDarkMode ? "bg-gray-800 border-gray-700 hover:border-blue-500" : "bg-white border-gray-200 hover:border-blue-300"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xl font-bold transition-colors ${isDarkMode ? "text-gray-100 group-hover:text-blue-400" : "text-gray-800 group-hover:text-blue-600"}`}>
                      Chương {chapter.id}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
                      ID: {chapter.id}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}