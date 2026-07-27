"use client";
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoryById } from '@/services/storyService';
import { chapterService } from '@/services/chapterService';
import Link from 'next/link';

// 1. Định nghĩa Interface cho Chương
interface Chapter {
  id: number;
  chapterNumber: number;
}

// 2. Định nghĩa Interface cho Chi tiết Truyện (có chứa mảng Chapter)
interface StoryDetail {
  id: number;
  title: string;
  author: string;
  chapters: Chapter[];
}

export default function StoryDetailPage({ params }: { params: Promise<{ storyId: string }> }) {
  const router = useRouter();
  
  // Unwrap params bằng hook React.use() (Chuẩn Next.js 15)
  const resolvedParams = use(params);
  const storyId = resolvedParams.storyId;

  const [story, setStory] = useState<StoryDetail | null>(null);
  
  // State cho Form Ingest
  const [chapterId, setChapterId] = useState('');
  const [rawText, setRawText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStory = async () => {
      try {
        // Sử dụng biến storyId đã được unwrap ở trên
        const res = await getStoryById(Number(storyId));
        if (isMounted) {
          setStory(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải thông tin truyện:", error);
      }
    };

    fetchStory();

    return () => {
      isMounted = false;
    };
  }, [storyId]); // Phụ thuộc vào storyId mới

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterId || !rawText) return;
    
    setIsIngesting(true);
    try {
      await chapterService.ingestChapter(Number(chapterId), Number(storyId), rawText);
      router.push(`/editor/${chapterId}`);
    } catch (error) {
      alert("Lỗi khi nạp chương!");
      console.error(error);
    } finally {
      setIsIngesting(false);
    }
  };

  if (!story) return <div className="p-8 text-white min-h-screen bg-[#111827]">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen bg-[#111827] text-white">
      {/* Cột 1: Thông tin truyện & Danh sách chương */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{story.title}</h1>
        <p className="text-gray-400 mb-6">Tác giả: {story.author}</p>
        
        <h3 className="text-xl font-semibold mb-4">Danh sách chương</h3>
        <ul className="space-y-2">
          {story.chapters?.map((chap) => (
            <li key={chap.id} className="border border-gray-700 p-3 rounded flex justify-between items-center bg-[#1f2937]">
              <span className="font-medium text-gray-200">Chương {chap.chapterNumber}</span>
              <Link href={`/editor/${chap.id}`} className="text-blue-400 hover:underline">
                Mở Editor
              </Link>
            </li>
          ))}
          {(!story.chapters || story.chapters.length === 0) && (
            <li className="text-gray-500 italic">Truyện này chưa có chương nào.</li>
          )}
        </ul>
      </div>

      {/* Cột 2: Form Ingest */}
      <div className="bg-[#1f2937] p-6 rounded-lg border border-gray-700 h-fit">
        <h3 className="text-xl font-semibold mb-4">Nạp chương mới (Ingest)</h3>
        <form onSubmit={handleIngest} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-300">Chapter ID / Number</label>
            <input 
              type="number" 
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded" 
              required 
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-300">Raw Text (Tiếng Anh)</label>
            <textarea 
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded h-64 font-mono text-sm" 
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isIngesting}
            className="bg-blue-600 text-white p-3 rounded font-bold disabled:bg-gray-600 hover:bg-blue-500 transition"
          >
            {isIngesting ? 'Đang xử lý...' : 'Nạp dữ liệu & Mở Editor'}
          </button>
        </form>
      </div>
    </div>
  );
}