import { useState } from "react";
import { Segment } from "../types/segment";
import { segmentService } from "../services/segmentService";

interface Props {
  segment: Segment;
  isDarkMode: boolean; // Khai báo nhận prop mới
  fontSize: number;    // Khai báo nhận prop mới
}

export default function SegmentEditor({ segment, isDarkMode, fontSize }: Props) {
  const [text, setText] = useState(segment.finalText);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return; 
    
    setIsSaving(true);
    setIsSuccess(false);
    
    try {
      await segmentService.updateSegment(segment.id, text);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (error) {
      alert("Lỗi khi lưu bản dịch!");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        style={{ fontSize: `${fontSize}px` }} // Kích hoạt thay đổi cỡ chữ động
        className={`w-full p-4 rounded border shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[120px] leading-relaxed transition-colors
          ${isSuccess ? "border-green-500" : (isDarkMode ? "border-gray-600 focus:border-blue-400" : "border-gray-300 focus:border-blue-500")}
          ${isDarkMode ? "bg-gray-700 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500"}
        `}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập bản dịch tại đây..."
      />
      
      <div className="absolute bottom-3 right-3 flex items-center gap-3">
        {isSuccess && <span className="text-sm text-green-500 font-bold">Đã lưu ✔</span>}
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`text-sm px-4 py-1.5 rounded shadow transition-colors text-white ${
            isSaving 
              ? "bg-gray-500 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSaving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
} 