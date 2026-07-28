namespace TranslationSystemAPI.Services.Interfaces
{
    public interface ITranslationManager
    {
        Task<string> ExecuteTranslationAsync(string sourceText, string systemPrompt);
    }
}