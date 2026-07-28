namespace TranslationSystemAPI.Services.Interfaces
{
    public interface IChapterTranslationService
    {
        /// <summary>
        /// Kích hoạt tiến trình dịch cho toàn bộ các Segment của một Chapter
        /// </summary>
        Task TranslateChapterAsync(int chapterId, CancellationToken cancellationToken = default);
    }
}