import api from './api';
import { Segment } from '../types/segment';

export const segmentService = {
  // Lấy danh sách đoạn văn của chương
  getChapterSegments: async (chapterId: number): Promise<Segment[]> => {
    const response = await api.get<Segment[]>(`/Segments/chapter/${chapterId}`);
    return response.data;
  },

  // Cập nhật bản dịch thủ công (ĐÃ SỬA LẠI PAYLOAD)
  updateSegment: async (id: number, translatedText: string): Promise<Segment> => {
    // Đổi key thành 'editedText' để Backend nhận diện được đúng chuẩn DTO
    const response = await api.put<Segment>(`/Segments/${id}/edit`, { editedText: translatedText });
    return response.data;
  }
};