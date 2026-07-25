using TranslationSystemAPI.Models.Entities;

namespace TranslationSystemAPI.Services.Interfaces
{
    public interface IChapterIngestionService
    {
        Task<IEnumerable<Segment>> ProcessAndSaveSegmentsAsync(int chapterId, string rawText);
    }
}