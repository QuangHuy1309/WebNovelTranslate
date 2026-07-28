using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Models.DTOs.Requests; // Bạn có thể giữ lại dòng này cho các API khác
using TranslationSystemAPI.Models.Entities;
using TranslationSystemAPI.Services.Interfaces;
using Hangfire;

namespace TranslationSystemAPI.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ChaptersController : ControllerBase
    {
        private readonly IChapterIngestionService _ingestionService;
        private readonly IChapterTranslationService _translationService;
        private readonly TranslationDbContext _context;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public ChaptersController(
            IChapterIngestionService ingestionService,
            IChapterTranslationService translationService,
            TranslationDbContext context,
            IBackgroundJobClient backgroundJobClient)
        {
            _ingestionService = ingestionService;
            _translationService = translationService;
            _context = context;
            _backgroundJobClient = backgroundJobClient;
        }

        // 1. CHỈNH SỬA DTO: Thêm dấu ? để cho phép Null. 
        // Việc này ngăn ASP.NET Core tự động quăng lỗi 400 nếu lỡ Frontend gửi thiếu trường.
        public class IngestRequestDto
        {
            public int? StoryId { get; set; }
            public string? RawText { get; set; }
        }

        // 2. CHỈNH SỬA ROUTE: Giữ nguyên tên tham số là {id} để khớp hoàn hảo với route Next.js
        [HttpPost("{id}/ingest")]
        public async Task<IActionResult> IngestChapter([FromRoute] int id, [FromBody] IngestRequestDto request)
        {
            // --- TỰ TAY BẮT LỖI ĐỂ IN RA CONSOLE CHÍNH XÁC NGUYÊN NHÂN ---
            if (request == null) 
                return BadRequest("Payload từ Next.js gửi lên bị rỗng hoàn toàn.");
                
            if (!request.StoryId.HasValue || request.StoryId <= 0) 
                return BadRequest($"Lỗi StoryId: Frontend đang gửi lên StoryId = {request.StoryId}");
                
            if (string.IsNullOrWhiteSpace(request.RawText)) 
                return BadRequest("Lỗi RawText: Dữ liệu văn bản bị trống.");
            // -------------------------------------------------------------

            // 3. Xử lý Database
            var storyExists = await _context.Stories.AnyAsync(s => s.Id == request.StoryId.Value);
            if (!storyExists)
                return NotFound($"Không tìm thấy Story có ID = {request.StoryId.Value}");

            // Tìm Chapter dựa vào StoryId và ChapterNumber (chính là biến id từ URL)
            var chapter = await _context.Chapters
                .FirstOrDefaultAsync(c => c.StoryId == request.StoryId.Value && c.ChapterNumber == id);

            if (chapter == null)
            {
                chapter = new Chapter
                {
                    StoryId = request.StoryId.Value,
                    ChapterNumber = id 
                    // BỎ QUA TRƯỜNG Id: Không gán chapter.Id = id nữa để DB tự sinh!
                };
                _context.Chapters.Add(chapter);
                await _context.SaveChangesAsync();
            }

            // 4. Gọi Service cắt đoạn (Truyền chapter.Id thực tế do DB vừa sinh ra)
            var segments = await _ingestionService.ProcessAndSaveSegmentsAsync(chapter.Id, request.RawText);
            
            return Ok(new { 
                Message = "Ingested successfully", 
                ChapterId = chapter.Id, 
                TotalSegments = segments.Count() 
            });
        }
        // ====================================================================
        // CÁC API DƯỚI ĐÂY GIỮ NGUYÊN HOÀN TOÀN CODE CỦA BẠN
        // ====================================================================

        // 2. Kích hoạt AI dịch từng đoạn của Chapter
        [HttpPost("{id}/translate")]
        public IActionResult TranslateChapter(int id)
        {
            var jobId = _backgroundJobClient.Enqueue<IChapterTranslationService>(service => service.TranslateChapterAsync(id));

            return Accepted(new 
            { 
                Message = "Translation process has been queued in the background.",
                JobId = jobId 
            });
        }
        
        // 3. Xuất toàn bộ nội dung tiếng Việt đã ráp nối hoàn chỉnh
        [HttpGet("{id}/export")]
        public async Task<IActionResult> ExportTranslatedChapter(int id)
        {
            var segments = await _context.Segments
                .Where(s => s.ChapterId == id)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync();

            if (!segments.Any())
                return NotFound("No segments found for this chapter.");

            var fullTranslatedText = string.Join("\n\n", segments.Select(s => s.TranslatedText ?? "[Đoạn này chưa dịch]"));

            return Ok(new
            {
                ChapterId = id,
                TranslatedContent = fullTranslatedText
            });
        }

        // API dùng để tạo dữ liệu mồi test hệ thống
        [HttpPost("create-mock-data")]
        public async Task<IActionResult> CreateMockData()
        {
            var story = new Models.Entities.Story
            {
                TitleEn = "The Beginning After The End" 
            };
            
            _context.Stories.Add(story);
            await _context.SaveChangesAsync();

            var chapter = new Models.Entities.Chapter 
            { 
                StoryId = story.Id
            };
            
            _context.Chapters.Add(chapter);
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                Message = "Tạo dữ liệu mồi thành công!", 
                StoryId = story.Id, 
                ChapterId = chapter.Id 
            });
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllChapters(CancellationToken cancellationToken)
        {
            var chapters = await _context.Chapters
                .AsNoTracking()
                .OrderByDescending(c => c.Id) 
                .Select(c => new
                {
                    Id = c.Id,
                })
                .ToListAsync(cancellationToken);

            return Ok(chapters);
        }
    }
}