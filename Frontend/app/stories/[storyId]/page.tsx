"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";

// Định nghĩa Interface cho dữ liệu
interface Chapter {
  id: number;
  chapterNumber: number;
}

interface Story {
  id: number;
  titleEn: string;
  titleVn: string;
  author: string;
  description: string;
  coverImageUrl: string;
  chapters: Chapter[];
}

export default function StoryDetailPage({ params }: { params: Promise<{ storyId: string }> }) {
  // Un-wrap params trong Next.js 15
  const resolvedParams = use(params);
  const storyId = resolvedParams.storyId;
  
  const router = useRouter();
  
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State để ẩn/hiện form nạp chương
  const [showIngestForm, setShowIngestForm] = useState(false);
  
  // State cho form Ingest
  const [ingestData, setIngestData] = useState({
    chapterId: "",
    rawText: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data khi load trang
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await axios.get(`http://localhost:5068/api/v1/Stories/${storyId}`);
        setStory(response.data);
      } catch (error) {
        console.error("Lỗi khi tải truyện:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStory();
  }, [storyId]);

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Gọi API và hứng response trả về
      const response = await axios.post(`http://localhost:5068/api/v1/Chapters/${ingestData.chapterId}/ingest`, {
        storyId: Number(storyId),
        rawText: ingestData.rawText,
      });
      
      // 2. Lấy ID thật do Database tự sinh ra (được backend trả về qua trường chapterId)
      const realDatabaseId = response.data.chapterId;
      
      // 3. Redirect sang Editor bằng ID thật
      router.push(`/editor/${realDatabaseId}`);
      
    } catch (error) {
      console.error("Lỗi khi nạp chương:", error);
      alert("Có lỗi xảy ra khi nạp chương!");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 text-white p-10">Đang tải dữ liệu...</div>;
  if (!story) return <div className="min-h-screen bg-slate-900 text-white p-10">Không tìm thấy truyện!</div>;

  // Xử lý URL ảnh bìa (nối domain backend nếu là đường dẫn local)
  const imageUrl = story.coverImageUrl?.startsWith("http") 
    ? story.coverImageUrl 
    : `http://localhost:5068${story.coverImageUrl || "/images/default-cover.jpg"}`;

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-6 text-slate-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* CỘT TRÁI: Thông tin truyện & Danh sách chương */}
        <div className={`flex-1 flex flex-col gap-8 ${showIngestForm ? "md:w-2/3" : "w-full"}`}>
          
          {/* Box 1: Thông tin chi tiết truyện (Đã làm lớn hơn) */}
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-8 border border-slate-750">
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-lg border border-gray-700">
                <Image 
                src={imageUrl} 
                alt={story.titleEn} 
                width={288} 
                height={384} 
                className="object-cover rounded-xl shadow-lg border border-slate-700 shrink-0"
                priority
                unoptimized={imageUrl.includes("localhost")}
                />
              </div>
            </div>
            
            
            <div className="flex flex-col flex-1">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
                {story.titleEn}
              </h1>
              <p className="text-lg sm:text-xl text-blue-400 font-semibold mb-6">
                Tác giả: {story.author}
              </p>
              
              <div className="bg-slate-900/60 p-6 rounded-xl flex-1 mb-6 border border-slate-700 shadow-inner">
                <p className="text-base sm:text-lg text-slate-200 whitespace-pre-line leading-relaxed">
                  {story.description || "Chưa có mô tả cho truyện này."}
                </p>
              </div>

              {/* Nút Toggle Form Ingest */}
              <div>
                <button 
                  onClick={() => setShowIngestForm(!showIngestForm)}
                  className={`${showIngestForm ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 text-lg rounded-lg font-bold transition-colors shadow-lg`}
                >
                  {showIngestForm ? "Đóng form nạp chương" : "+ Thêm chương mới"}
                </button>
              </div>
            </div>
          </div>

          {/* Box 2: Danh sách chương */}
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-750">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Danh sách chương</h2>
            {story.chapters && story.chapters.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {story.chapters.map((chapter) => (
                  <button 
                    key={chapter.id}
                    onClick={() => router.push(`/editor/${chapter.id}`)}
                    className="p-4 bg-slate-700/50 hover:bg-slate-600 rounded-xl text-left text-lg font-medium transition-colors border border-slate-600 hover:border-blue-400 shadow-sm"
                  >
                    Chương {chapter.chapterNumber || chapter.id}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-lg italic bg-slate-900/30 p-4 rounded-lg">Truyện này chưa có chương nào.</p>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Form Nạp chương (Chỉ hiện khi bấm nút) */}
        {showIngestForm && (
          <div className="md:w-1/3 bg-slate-800 p-8 rounded-2xl shadow-xl h-fit border border-blue-800">
            <h2 className="text-2xl font-bold text-white mb-6">Nạp chương mới (Ingest)</h2>
            <form onSubmit={handleIngestSubmit} className="space-y-5">
              <div>
                <label className="block text-base font-medium mb-2 text-slate-300">Chapter ID / Number</label>
                <input
                  type="number"
                  required
                  value={ingestData.chapterId}
                  onChange={(e) => setIngestData({ ...ingestData, chapterId: e.target.value })}
                  className="w-full px-4 py-3 text-lg bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="VD: 1"
                />
              </div>
              
              <div>
                <label className="block text-base font-medium mb-2 text-slate-300">Raw Text (Tiếng Anh)</label>
                <textarea
                  required
                  rows={15}
                  value={ingestData.rawText}
                  onChange={(e) => setIngestData({ ...ingestData, rawText: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-base"
                  placeholder="Dán nội dung tiếng Anh vào đây..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg text-lg font-bold text-white transition-colors shadow-lg"
              >
                {isSubmitting ? "Đang xử lý dữ liệu..." : "Nạp dữ liệu & Mở Editor"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}