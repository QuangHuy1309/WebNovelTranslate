import api from './api';

export interface Chapter {
  id: number;
  // Nếu sau này bạn có thêm cột Name, Title ở database thì khai báo thêm ở đây
}

export const chapterService = {
  // Hàm lấy danh sách toàn bộ chương
  getAllChapters: async (): Promise<Chapter[]> => {
    const response = await api.get<Chapter[]>('/Chapters');
    return response.data;
  },
  // Nạp dữ liệu văn bản thô của một chương để hệ thống chunking
  ingestChapter: async (chapterId: number, originalText: string): Promise<void> => {
    // Thay đổi route thành '/Chapters...' hoặc 'http://localhost:5068/api/Chapters...' 
    // tùy thuộc vào cách bạn đã fix lỗi 404 vừa nãy nhé.
    await api.post(`/Chapters/${chapterId}/ingest`, {
      originalText: originalText
    });
  }
};