"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { chapterService } from "../../services/chapterService";
import { useTheme } from "../../contexts/ThemeContext";

export default function IngestPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const [chapterId, setChapterId] = useState("");
  const [storyId, setStoryId] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterId || isNaN(Number(chapterId)) || !storyId || isNaN(Number(storyId)) || !originalText.trim()) {
      setMessage({ type: "error", text: "Vui lòng điền đủ ID hợp lệ và nội dung." });
      return;
    }
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await chapterService.ingestChapter(Number(chapterId), Number(storyId), originalText);
      setMessage({ type: "success", text: "Thành công! Đang chuyển hướng..." });
      setTimeout(() => router.push(`/editor/${chapterId}`), 1500);
    } catch (error: unknown) {
      setMessage({ type: "error", text: "Đã xảy ra lỗi khi nạp dữ liệu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen py-10 px-4 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`max-w-4xl mx-auto rounded-xl shadow-md border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"}`}>
          <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Nạp Chương Mới</h1>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className={`px-3 py-1 rounded text-sm shadow ${isDarkMode ? "bg-yellow-500 text-gray-900" : "bg-gray-800 text-white"}`}>
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <Link href="/" className="text-sm font-medium text-blue-500 hover:text-blue-400">← Quay lại</Link>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thêm khối Input cho Story ID này vào */}
            <div>
                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                    ID Truyện (Story ID)
                </label>
                <input 
                    type="number" 
                    value={storyId}
                    onChange={(e) => setStoryId(e.target.value)}
                    className="w-full border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700" 
                    placeholder="Ví dụ: 1"
                    required 
                />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>ID Chương</label>
              <input type="number" className={`w-full md:w-1/3 p-3 border rounded-lg outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} value={chapterId} onChange={(e) => setChapterId(e.target.value)} disabled={isSubmitting} />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Nội dung tiếng Anh</label>
              <textarea rows={15} className={`w-full p-4 border rounded-lg outline-none resize-y ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} value={originalText} onChange={(e) => setOriginalText(e.target.value)} disabled={isSubmitting} />
            </div>
            {message.text && <div className={`p-4 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{message.text}</div>}
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={isSubmitting} className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${isSubmitting ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"}`}>{isSubmitting ? "Đang xử lý..." : "Nạp & Phân Mảnh"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}