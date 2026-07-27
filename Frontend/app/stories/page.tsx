"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStories, createStory } from '@/services/storyService';

// 1. Định nghĩa cấu trúc dữ liệu cho Truyện
interface Story {
  id: number;
  title: string;
  author: string;
  status: number | string; // Backend có thể trả về kiểu số (Enum) hoặc chuỗi
}

export default function StoriesDashboard() {
  // 2. Ép kiểu cho state là một mảng các Story (Story[])
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialStories = async () => {
      try {
        const res = await getStories();
        if (isMounted) {
          setStories(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách truyện:", error);
      }
    };

    loadInitialStories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async () => {
    const title = prompt("Nhập tên truyện mới:");
    if (!title) return;
    
    try {
      await createStory({ title, author: "Unknown" });
      const res = await getStories();
      setStories(res.data);
    } catch (error) {
      console.error("Lỗi khi tạo truyện:", error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách Truyện</h1>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">
          + Thêm Truyện Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 3. Bỏ `: unknown` đi. Nhờ useState<Story[]>, TypeScript đã tự hiểu 'story' là kiểu Story */}
        {stories.map((story) => (
          <Link href={`/stories/${story.id}`} key={story.id}>
            <div className="border rounded-lg p-6 hover:shadow-lg transition bg-white cursor-pointer h-full">
              <h2 className="text-xl font-bold text-gray-800">{story.title}</h2>
              <p className="text-gray-500 mt-2">Tác giả: {story.author}</p>
              <span className="inline-block mt-4 text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                {story.status === 0 ? 'Ongoing' : story.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}