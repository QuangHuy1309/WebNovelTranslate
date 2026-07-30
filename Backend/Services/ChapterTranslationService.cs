using System.Text;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class ChapterTranslationService : IChapterTranslationService
    {
        private readonly TranslationDbContext _context;
        private readonly ITranslationManager _translationManager;

        public ChapterTranslationService(TranslationDbContext context, ITranslationManager translationManager)
        {
            _context = context;
            _translationManager = translationManager;
        }

        public async Task TranslateChapterAsync(int chapterId, CancellationToken cancellationToken = default)
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

            // 3.5. LẤY SƠ ĐỒ TRI THỨC (KNOWLEDGE GRAPH) CỦA STORY
            var loreGraph = await _context.LoreRelationships
                .Include(r => r.SourceEntity)
                .Include(r => r.TargetEntity)
                .Where(r => r.StoryId == chapter.StoryId)
                .AsNoTracking()
                .ToListAsync();

            // 4. XÂY DỰNG SYSTEM PROMPT ĐỘNG
            var promptBuilder = new StringBuilder();
            promptBuilder.AppendLine("Bạn là một dịch giả Web Novel chuyên nghiệp.");
            promptBuilder.AppendLine("BỐI CẢNH QUAN TRỌNG: Đây là một tác phẩm tiểu thuyết giả tưởng. Mọi sự kiện, nhân vật, hành động (bao gồm cả chiến đấu, bạo lực, rùng rợn hoặc ngôn từ mạnh) đều HOÀN TOÀN KHÔNG CÓ THẬT và chỉ phục vụ mục đích kể chuyện, giải trí nghệ thuật.");
            promptBuilder.AppendLine("Yêu cầu: Hãy dịch trung thực và chính xác nội dung gốc. Giữ nguyên văn phong tiểu thuyết, mượt mà, tự nhiên và TUYỆT ĐỐI KHÔNG tự ý kiểm duyệt hay cắt bỏ nội dung.");
            
            // Ép AI tuân thủ Knowledge Graph nếu có dữ liệu
            if (loreGraph.Any())
            {
                promptBuilder.AppendLine("\nBÁCH KHOA TOÀN THƯ (KNOWLEDGE GRAPH) VỀ NHÂN VẬT & BỐI CẢNH TRONG TRUYỆN:");
                promptBuilder.AppendLine("Sử dụng thông tin dưới đây để xưng hô và hiểu thái độ của nhân vật một cách chuẩn xác nhất:");
                
                foreach (var rel in loreGraph)
                {
                    if (rel.SourceEntity != null && rel.TargetEntity != null)
                    {
                        promptBuilder.AppendLine($"- [{rel.SourceEntity.Name} ({rel.SourceEntity.EntityType})] là {rel.RelationType} của [{rel.TargetEntity.Name} ({rel.TargetEntity.EntityType})].");
                        if (!string.IsNullOrWhiteSpace(rel.Context))
                        {
                            promptBuilder.AppendLine($"  Ngữ cảnh: {rel.Context}");
                        }
                    }
                }
            }

            // Nếu truyện có thiết lập Glossary
            if (glossaries.Any())
            {
                promptBuilder.AppendLine("\nBẠN PHẢI DỊCH CHÍNH XÁC CÁC THUẬT NGỮ SAU:");
                foreach (var term in glossaries)
                {
                    promptBuilder.AppendLine($"- {term.OriginalTerm} => {term.TranslatedTerm}");
                }
            }

            string finalSystemPrompt = promptBuilder.ToString();

            // 5. Duyệt qua từng đoạn và gọi AI dịch
            foreach (var segment in pendingSegments)
            {
                cancellationToken.ThrowIfCancellationRequested();
                try
                {
                    var translatedText = await _translationManager.ExecuteTranslationAsync(segment.OriginalText, finalSystemPrompt);

                    segment.TranslatedText = translatedText;
                    await _context.SaveChangesAsync();

                    // Delay 4s để hạn chế lỗi 429
                    await Task.Delay(4000); 
                }
                catch (Exception ex)
                {
                    throw new Exception($"Lỗi trong quá trình dịch thuật: {ex.Message}");
                }
            }
        }
    }
}