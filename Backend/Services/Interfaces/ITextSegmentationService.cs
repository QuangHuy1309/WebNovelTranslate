namespace TranslationSystemAPI.Services.Interfaces
{
    public interface ITextSegmentationService
    {
        /// <summary>
        /// Cắt văn bản thô thành các đoạn nhỏ tối ưu cho AI Translation.
        /// </summary>
        IEnumerable<string> SplitTextIntoSegments(string rawText, int maxSegmentLength = 1500);
    }
}