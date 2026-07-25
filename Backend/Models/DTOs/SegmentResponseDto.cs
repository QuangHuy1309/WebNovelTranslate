namespace TranslationSystemAPI.DTOs
{
    public class SegmentResponseDto
    {
        public int Id { get; set; }
        public int OrderIndex { get; set; }
        public string OriginalText { get; set; } = string.Empty;
        public string? TranslatedText { get; set; }
        public string? EditedText { get; set; }

        // Logic tự động chọn bản text cuối cùng để hiển thị trên UI cho độc giả
        public string FinalText => !string.IsNullOrWhiteSpace(EditedText) 
            ? EditedText 
            : (TranslatedText ?? string.Empty);

        // Trạng thái của segment này (giúp Frontend hiển thị màu sắc/icon tương ứng)
        public string Status 
        {
            get 
            {
                if (!string.IsNullOrWhiteSpace(EditedText)) return "Edited"; // Đã được người dùng sửa
                if (!string.IsNullOrWhiteSpace(TranslatedText)) return "Translated"; // Đã được AI dịch
                return "Pending"; // Đang chờ Hangfire/Gemini xử lý
            }
        }
    }
}