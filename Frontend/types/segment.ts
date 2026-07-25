export interface Segment {
  id: number;
  orderIndex: number;
  originalText: string;
  translatedText: string | null;
  editedText: string | null;
  finalText: string;
  status: string;
}

export interface EditSegmentRequest {
  editedText: string;
}