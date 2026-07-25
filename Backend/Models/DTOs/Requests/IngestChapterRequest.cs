namespace TranslationSystemAPI.Models.DTOs.Requests
{
    public class IngestChapterRequest
    {
        // Yêu cầu Client gửi kèm nội dung tiếng Anh của chương truyện
        public string RawText { get; set; } = string.Empty;
    }
}