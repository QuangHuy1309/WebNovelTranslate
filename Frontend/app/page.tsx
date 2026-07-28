"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStories, deleteStory } from "../services/storyService"; 
import { useTheme } from "../contexts/ThemeContext"; // Import hook

// Định nghĩa Interface
interface Story {
  id: number;
  title: string;
  author: string;
  status: number | string;
}

export default function Dashboard() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useTheme(); // Lấy state Sáng/Tối

  useEffect(() => {
    let isMounted = true;

    const fetchInitialStories = async () => {
      try {
        const res = await getStories();
        if (isMounted) {
          setStories(res.data);
          setLoading(false); 
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách truyện:", error);
        if (isMounted) setLoading(false); 
      }
    };

    fetchInitialStories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteStory = async (e: React.MouseEvent, id: number, title: string) => {
    // 1. Chặn sự kiện click truyền ra ngoài thẻ Link (tránh bị chuyển trang khi bấm Xóa)
    e.preventDefault();
    e.stopPropagation();

    // 2. Hiển thị hộp thoại xác nhận
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa truyện "${title}" không? Hành động này sẽ xóa toàn bộ chương và không thể hoàn tác!`);
    if (!confirmDelete) return;

    try {
      // 3. Gọi API xóa
      await deleteStory(id); 
      
      // 4. Cập nhật lại danh sách truyện ngay lập tức mà không cần tải lại trang
      setStories(prevStories => prevStories.filter(story => story.id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa truyện:", error);
      alert("Đã xảy ra lỗi khi xóa truyện. Vui lòng kiểm tra lại Backend.");
    }
  };

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
            
            {/* Nút thêm Truyện */}
            <Link 
              href="/stories/new" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              + Thêm Truyện mới
            </Link>
          </div>
        </div>

        {stories.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Chưa có dữ liệu truyện.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {stories.map((story) => (
              <Link href={`/stories/${story.id}`} key={story.id}>
                <div className={`p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[140px] ${isDarkMode ? "bg-gray-800 border-gray-700 hover:border-blue-500" : "bg-white border-gray-200 hover:border-blue-300"}`}>
                  
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xl font-bold transition-colors line-clamp-2 ${isDarkMode ? "text-gray-100 group-hover:text-blue-400" : "text-gray-800 group-hover:text-blue-600"}`}>
                      {story.title}
                    </span>
                    
                    {/* KHU VỰC ĐÃ SỬA: Đưa ID và Nút Xóa vào chung 1 góc */}
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
                        ID: {story.id}
                      </span>
                      {/* Nút Xóa Truyện đã được chuyển vào đây */}
                      <button 
                        onClick={(e) => handleDeleteStory(e, story.id, story.title)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors shadow-sm relative z-10"
                        title="Xóa truyện này"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {story.author}
                    </span>
                    <span className="text-sm font-bold text-blue-500">
                      {story.status === 0 ? 'Ongoing' : story.status}
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