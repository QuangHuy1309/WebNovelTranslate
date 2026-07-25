import api from './api';
import { Segment } from '../types/segment';

export const segmentService = {
  // Lấy danh sách đoạn văn của chương
  getChapterSegments: async (chapterId: number): Promise<Segment[]> => {
    const response = await api.get<Segment[]>(`/Segments/chapter/${chapterId}`);
    return response.data;
  },

  // Cập nhật bản dịch thủ công
  updateSegment: async (id: number, editedText: string): Promise<Segment> => {
    const response = await api.put<Segment>(`/Segments/${id}/edit`, { editedText });
    return response.data;
  }
};