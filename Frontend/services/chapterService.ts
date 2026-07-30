import api from "./api";

// Khai báo interface Chapter ngay tại đây
export interface Chapter {
  id: number;
  storyId?: number;
  // Bạn có thể thêm các trường khác sau này nếu cần (ví dụ: title, status...)
}

export const chapterService = {
  // Hàm lấy danh sách chương
  getAllChapters: async (): Promise<Chapter[]> => {
    const response = await api.get('/Chapters');
    return response.data;
  },

  // Hàm nạp chương mới (Thêm tham số autoExtractLore)
  ingestChapter: async (chapterId: number, storyId: number, originalText: string, autoExtractLore: boolean = false): Promise<void> => {
    await api.post(`/Chapters/${chapterId}/ingest`, {
      rawText: originalText,
      storyId: storyId,
      autoExtractLore: autoExtractLore // Truyền cờ này xuống Backend
    });
  },

  translateChapter: async (chapterId: number): Promise<void> => {
    await api.post(`/Chapters/${chapterId}/translate`);
  }
};