using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Models.DTOs.Requests;
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

        // 1. Tiếp nhận text thô và cắt đoạn
        [HttpPost("{id}/ingest")]
        public async Task<IActionResult> IngestChapter(int id, [FromBody] IngestChapterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RawText))
                return BadRequest("Raw text cannot be empty.");

            var segments = await _ingestionService.ProcessAndSaveSegmentsAsync(id, request.RawText);
            return Ok(new { Message = "Ingested successfully", TotalSegments = segments.Count() });
        }

        // 2. Kích hoạt AI dịch từng đoạn của Chapter
        [HttpPost("{id}/translate")]
        public IActionResult TranslateChapter(int id)
        {
            // Thay vì dùng await _translationService.TranslateChapterAsync(id);
            // Ta đưa tác vụ này cho Hangfire xử lý ngầm:
            var jobId = _backgroundJobClient.Enqueue<IChapterTranslationService>(service => service.TranslateChapterAsync(id));

            // Trả về ngay lập tức HTTP 202 Accepted (Yêu cầu đã được chấp nhận và đang xử lý)
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

            // Ráp các đoạn TranslatedText lại với nhau, phân cách bằng dấu xuống dòng
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
            // 1. Tạo Story (Chỉ cần điền TitleEn vì nó là bắt buộc)
            var story = new Models.Entities.Story
            {
                TitleEn = "The Beginning After The End" // TRƯỜNG BẮT BUỘC
            };
            
            _context.Stories.Add(story);
            await _context.SaveChangesAsync();

            // 2. Tạo Chapter
            var chapter = new Models.Entities.Chapter 
            { 
                StoryId = story.Id
                // Lưu ý: Nếu Entity Chapter của bạn cũng có trường nào bắt buộc (Ví dụ: Name, TitleEn...), 
                // hãy chắc chắn bạn cũng điền nó vào đây nhé!
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
        /// <summary>
        /// Lấy danh sách toàn bộ các chương truyện
        /// </summary>
        /// <param name="cancellationToken">Token hủy request</param>
        /// <returns>Danh sách chương</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllChapters(CancellationToken cancellationToken)
        {
            // Tạm thời trả về object ẩn danh (anonymous object) để code nhanh.
            // Nếu Entity Chapter của bạn có thêm trường như Name, Title, Status... 
            // bạn có thể thêm vào khối Select bên dưới.
            var chapters = await _context.Chapters
                .AsNoTracking()
                .OrderByDescending(c => c.Id) // Sắp xếp chương mới nhất lên đầu
                .Select(c => new
                {
                    Id = c.Id,
                    // Thêm các trường khác nếu entity của bạn có, ví dụ:
                    // Name = c.Name, 
                })
                .ToListAsync(cancellationToken);

            return Ok(chapters);
        }
    }
}