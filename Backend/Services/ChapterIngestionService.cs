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