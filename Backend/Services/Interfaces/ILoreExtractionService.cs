namespace TranslationSystemAPI.Services.Interfaces
{
    public interface ILoreExtractionService
    {
        Task ExtractGraphAsync(int chapterId, CancellationToken cancellationToken = default);
    }
}