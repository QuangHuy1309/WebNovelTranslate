namespace TranslationSystemAPI.DTOs.Requests
{
    public class EditSegmentRequest
    {
        // Yêu cầu Frontend phải gửi nội dung, không được để trống
        public string EditedText { get; set; } = string.Empty;
    }
}