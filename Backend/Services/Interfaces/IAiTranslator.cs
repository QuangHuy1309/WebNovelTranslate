namespace TranslationSystemAPI.Services.Interfaces
{
    public interface IAiTranslator
    {
        string ProviderName { get; }
        
        /// <summary>
        /// Gửi text thô sang AI và nhận về kết quả tiếng Việt.
        /// </summary>
        /// <param name="sourceText">Đoạn text tiếng Anh cần dịch</param>
        /// <param name="systemPrompt">Câu lệnh hướng dẫn AI (VD: "Bạn là dịch giả Web Novel...")</param>
        Task<string> TranslateAsync(string sourceText, string systemPrompt);
    }
}