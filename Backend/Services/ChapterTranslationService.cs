using System.Text;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class ChapterTranslationService : IChapterTranslationService
    {
        private readonly TranslationDbContext _context;
        private readonly IAiTranslator _aiTranslator;

        public ChapterTranslationService(TranslationDbContext context, IAiTranslator aiTranslator)
        {
            _context = context;
            _aiTranslator = aiTranslator;
        }

        public async Task TranslateChapterAsync(int chapterId)
        {
            // 1. Lấy thông tin Chapter để biết nó thuộc Story nào
            var chapter = await _context.Chapters
                .FirstOrDefaultAsync(c => c.Id == chapterId);

            if (chapter == null)
            {
                throw new ArgumentException($"Chapter with ID {chapterId} not found.");
            }

            // 2. Tìm các Segment CHƯA DỊCH
            var pendingSegments = await _context.Segments
                .Where(s => s.ChapterId == chapterId && string.IsNullOrEmpty(s.TranslatedText))
                .OrderBy(s => s.OrderIndex)
                .ToListAsync();

            if (!pendingSegments.Any())
            {
                return; // Không có gì để dịch
            }

            // 3. LẤY TỪ ĐIỂN THUẬT NGỮ (GLOSSARY) CỦA STORY
            var glossaries = await _context.Glossaries
                .Where(g => g.StoryId == chapter.StoryId)
                .ToListAsync();

            // 4. XÂY DỰNG SYSTEM PROMPT ĐỘNG
            var promptBuilder = new StringBuilder();
            promptBuilder.AppendLine("Bạn là một dịch giả Web Novel chuyên nghiệp.");
            promptBuilder.AppendLine("Hãy dịch đoạn truyện chữ sau từ tiếng Anh sang tiếng Việt. Giữ nguyên văn phong tiểu thuyết, mượt mà và tự nhiên.");
            
            // Nếu truyện này có thiết lập Glossary, ép AI phải tuân thủ
            if (glossaries.Any())
            {
                promptBuilder.AppendLine("\nYÊU CẦU BẮT BUỘC - BẠN PHẢI DỊCH CHÍNH XÁC CÁC THUẬT NGỮ SAU:");
                foreach (var term in glossaries)
                {
                    promptBuilder.AppendLine($"- {term.OriginalTerm} => {term.TranslatedTerm}");
                }
            }

            string finalSystemPrompt = promptBuilder.ToString();

            // 5. Duyệt qua từng đoạn và gọi AI dịch
            foreach (var segment in pendingSegments)
            {
                try
                {
                    // Gửi text kèm theo Prompt chứa Glossary
                    var translatedText = await _aiTranslator.TranslateAsync(segment.OriginalText, finalSystemPrompt);

                    segment.TranslatedText = translatedText;
                    await _context.SaveChangesAsync();

                    // Delay để không dính lỗi quá tải request (429) của Gemini Free Tier
                    await Task.Delay(4000); 
                }
                catch (Exception ex)
                {
                    // Ghi log lỗi tại đây nếu cần
                    throw new Exception($"Gemini API Error: {ex.Message}");
                }
            }
        }
    }
}