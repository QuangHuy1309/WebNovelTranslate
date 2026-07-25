using System.Text.RegularExpressions;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class TextSegmentationService : ITextSegmentationService
    {
        public IEnumerable<string> SplitTextIntoSegments(string rawText, int maxSegmentLength = 1500)
        {
            if (string.IsNullOrWhiteSpace(rawText))
            {
                yield break;
            }

            // 1. Tách theo các đoạn văn (xuống dòng)
            var paragraphs = rawText.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var paragraph in paragraphs)
            {
                var cleanPara = paragraph.Trim();
                if (string.IsNullOrEmpty(cleanPara)) continue;

                // 2. Nếu đoạn văn ngắn hơn mức cho phép, giữ nguyên
                if (cleanPara.Length <= maxSegmentLength)
                {
                    yield return cleanPara;
                }
                else
                {
                    // 3. Nếu đoạn văn quá dài, tiến hành cắt theo dấu câu (., !, ?)
                    var sentences = SplitByPunctuation(cleanPara);
                    var currentSegment = string.Empty;

                    foreach (var sentence in sentences)
                    {
                        if (currentSegment.Length + sentence.Length > maxSegmentLength && !string.IsNullOrEmpty(currentSegment))
                        {
                            yield return currentSegment.Trim();
                            currentSegment = string.Empty;
                        }
                        currentSegment += sentence + " ";
                    }

                    if (!string.IsNullOrWhiteSpace(currentSegment))
                    {
                        yield return currentSegment.Trim();
                    }
                }
            }
        }

        private IEnumerable<string> SplitByPunctuation(string text)
        {
            // Sử dụng Regex để tách câu nhưng vẫn giữ lại dấu câu ở cuối
            // Pattern này tách sau các dấu . ! ? kết hợp với khoảng trắng
            var pattern = @"(?<=[\.!\?])\s+";
            return Regex.Split(text, pattern).Where(s => !string.IsNullOrWhiteSpace(s));
        }
    }
}