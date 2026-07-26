using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Models.Entities;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class ChapterIngestionService : IChapterIngestionService
    {
        private readonly TranslationDbContext _context;

        public ChapterIngestionService(TranslationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Segment>> ProcessAndSaveSegmentsAsync(int chapterId, string rawText)
        {
            // 1. DỌN DẸP DỮ LIỆU CŨ: Xóa các segment cũ nếu người dùng bấm Ingest lại chương này
            // Điều này giúp tránh lỗi Duplicate Key (trùng lặp ID) trong SQL Server
            var existingSegments = await _context.Segments.Where(s => s.ChapterId == chapterId).ToListAsync();
            if (existingSegments.Any())
            {
                _context.Segments.RemoveRange(existingSegments);
                await _context.SaveChangesAsync();
            }

            // 1. Kiểm tra xem Chương này đã tồn tại trong Database chưa
            var chapter = await _context.Chapters.FindAsync(chapterId);

            // 2. Nếu chưa tồn tại, tự động tạo mới Chapter
            if (chapter == null)
            {
                // --- BƯỚC BỔ SUNG: XỬ LÝ KHÓA NGOẠI TRUYỆN (STORY) ---
                // Giả sử chúng ta dùng Truyện có ID = 1 làm truyện mặc định để test
                int defaultStoryId = 1;
                var story = await _context.Stories.FindAsync(defaultStoryId);
                
                // Nếu Truyện ID 1 chưa tồn tại, tự động tạo nó luôn
                if (story == null)
                {
                    story = new Story
                    {
                        // Bảng Stories của bạn vẫn đang dùng tự động tăng (IDENTITY), 
                        // nên ta KHÔNG gán Id ở đây, SQL sẽ tự cấp phát.
                        TitleEn = "Default Test Story",
                        Status = 0 
                    };
                    _context.Stories.Add(story);
                    await _context.SaveChangesAsync(); // Lưu để lấy ID thật do SQL cấp
                    
                    defaultStoryId = story.Id; // Cập nhật lại ID mới nhất
                }
                // ---------------------------------------------------

                chapter = new Chapter
                {
                    Id = chapterId, // ID 162 mà bạn nhập trên web
                    StoryId = defaultStoryId, // Gán ID truyện vào để thỏa mãn khóa ngoại!
                    ChapterNumber = chapterId
                };

                _context.Chapters.Add(chapter);
                await _context.SaveChangesAsync();
            }

            // 2. CHIA KHỐI VĂN BẢN (CHUNKING)
            // Giới hạn khoảng 4000 ký tự mỗi Segment để tối ưu AI Quota
            var chunks = ChunkText(rawText, 4000);

            var segments = new List<Segment>();
            int orderIndex = 1;

            // 3. LƯU VÀO DATABASE
            foreach (var chunk in chunks)
            {
                segments.Add(new Segment
                {
                    ChapterId = chapterId,
                    OriginalText = chunk,
                    OrderIndex = orderIndex++
                });
            }

            _context.Segments.AddRange(segments);
            await _context.SaveChangesAsync();

            return segments;
        }

        // HÀM BỔ TRỢ: Thuật toán gom đoạn văn
        private List<string> ChunkText(string rawText, int maxChunkLength)
        {
            var chunks = new List<string>();
            
            // Tách theo dấu xuống dòng để không bao giờ cắt đứt đôi một câu thoại
            var paragraphs = rawText.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);

            string currentChunk = "";

            foreach (var p in paragraphs)
            {
                // Nếu cộng thêm đoạn mới mà vượt giới hạn -> Đóng gói khối cũ, mở khối mới
                if ((currentChunk.Length + p.Length) > maxChunkLength)
                {
                    if (!string.IsNullOrWhiteSpace(currentChunk))
                    {
                        chunks.Add(currentChunk.Trim());
                    }
                    currentChunk = p + "\n\n"; 
                }
                else
                {
                    // Nếu chưa vượt giới hạn -> Tiếp tục cộng dồn đoạn văn vào khối hiện tại
                    currentChunk += p + "\n\n";
                }
            }

            // Đóng gói khối cuối cùng nếu còn sót lại chữ
            if (!string.IsNullOrWhiteSpace(currentChunk))
            {
                chunks.Add(currentChunk.Trim());
            }

            return chunks;
        }
    }
}