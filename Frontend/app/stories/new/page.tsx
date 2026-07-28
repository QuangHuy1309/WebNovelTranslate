"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CreateStoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // State quản lý text input
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
  });
  
  // State quản lý file ảnh
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Khởi tạo FormData để đính kèm File
    const submitData = new FormData();
    submitData.append("Title", formData.title);
    
    if (formData.author) submitData.append("Author", formData.author);
    if (formData.description) submitData.append("Description", formData.description);
    if (coverImage) submitData.append("CoverImage", coverImage);

    try {
      // Gửi request với Header multipart/form-data
      await axios.post("http://localhost:5068/api/v1/Stories", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Thành công thì quay về trang chủ
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Lỗi khi tạo truyện:", error);
      alert("Có lỗi xảy ra khi tạo truyện!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl shadow-lg text-slate-100">
        <h1 className="text-2xl font-bold mb-6 text-white">Thêm Truyện Mới</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Tên truyện <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Đấu Phá Thương Khung"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium mb-1">
              Tác giả
            </label>
            <input
              id="author"
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Thiên Tằm Thổ Đậu"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Mô tả truyện
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập giới thiệu truyện..."
            />
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium mb-1">
              Ảnh Bìa (Tải lên từ máy)
            </label>
            <input
              id="coverImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-md font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md font-medium transition-colors"
            >
              {isLoading ? "Đang lưu..." : "Xác nhận tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}