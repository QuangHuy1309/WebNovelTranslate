"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStories, deleteStory } from "../services/storyService"; 
import { useTheme } from "../contexts/ThemeContext";
import Image from "next/image";
// Định nghĩa Interface (Đã bổ sung coverImage và description)
interface Story {
  id: number;
  title: string;
  author: string;
  status: number | string;
  coverImage?: string;  // Thêm mới: URL ảnh bìa
  description?: string; // Thêm mới: Mô tả truyện
}

export default function Dashboard() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useTheme(); 

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
    e.preventDefault();
    e.stopPropagation();

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa truyện "${title}" không? Hành động này sẽ xóa toàn bộ chương và không thể hoàn tác!`);
    if (!confirmDelete) return;

    try {
      await deleteStory(id); 
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
                {/* 
                  Container chính của Card:
                  - overflow-hidden: Để ảnh bo góc không bị tràn ra ngoài
                  - flex-col: Sắp xếp ảnh ở trên, thông tin ở dưới
                */}
                <div className={`rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700 hover:border-blue-500" : "bg-white border-gray-200 hover:border-blue-300"}`}>
                  
                  {/* === PHẦN 1: KHU VỰC ẢNH BÌA === */}
                  <div className="relative aspect-[3/4] w-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="relative aspect-[3/4] w-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <Image 
                        src={story.coverImage || `https://placehold.co/400x600/${isDarkMode ? '1f2937/fff' : 'e5e7eb/4b5563'}/png?text=No+Cover`} 
                        alt={story.title}
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        
                        // THÊM DÒNG NÀY: Bỏ qua tối ưu hóa của Next.js nếu ảnh tải từ localhost
                        unoptimized={story.coverImage?.includes("localhost")} 
                      />
                      
                      {/* Các phần khác giữ nguyên... */}
                    </div>
                    
                    {/* Overlay: Badge ID & Nút Xóa nổi trên ảnh bìa */}
                    <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                      <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded shadow">
                        ID: {story.id}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteStory(e, story.id, story.title)}
                        className="bg-red-500/90 hover:bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded transition-colors shadow"
                        title="Xóa truyện này"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* === PHẦN 2: KHU VỰC THÔNG TIN (BOX DƯỚI) === */}
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Tên truyện */}
                    <h3 className={`text-lg font-bold mb-1 line-clamp-2 transition-colors ${isDarkMode ? "text-gray-100 group-hover:text-blue-400" : "text-gray-800 group-hover:text-blue-600"}`}>
                      {story.title}
                    </h3>
                    
                    {/* Tác giả & Tình trạng */}
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className={`font-medium truncate pr-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {story.author}
                      </span>
                      <span className="font-bold text-blue-500 shrink-0">
                        {story.status === 0 ? 'Ongoing' : story.status}
                      </span>
                    </div>

                    {/* Mô tả ngắn */}
                    <p className={`text-sm line-clamp-3 mt-auto ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {story.description || "Chưa có mô tả chi tiết cho tác phẩm này. Vui lòng cập nhật thêm thông tin."}
                    </p>
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