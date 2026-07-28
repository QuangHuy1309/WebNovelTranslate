using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Models.Entities;
using TranslationSystemAPI.Models.Enums;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace TranslationSystemAPI.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class StoriesController : ControllerBase
    {
        private readonly TranslationDbContext _context;

        public StoriesController(TranslationDbContext context)
        {
            _context = context;
        }

        // GET: api/v1/Stories
        [HttpGet]
        public async Task<IActionResult> GetStories()
        {
            var stories = await _context.Stories
                .Select(s => new { s.Id, title = s.TitleEn, s.Author, s.Status })
                .ToListAsync();
            return Ok(stories);
        }

        // GET: api/v1/Stories/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStory(int id)
        {
            var story = await _context.Stories
                .Include(s => s.Chapters) 
                .FirstOrDefaultAsync(s => s.Id == id);

            if (story == null) return NotFound();
            return Ok(story);
        }

        // POST: api/v1/Stories
        // Đổi [FromBody] thành [FromForm] để nhận file từ Client
        [HttpPost]
        public async Task<IActionResult> CreateStory([FromForm] CreateStoryDto dto)
        {
            var finalTitle = !string.IsNullOrWhiteSpace(dto.Title) ? dto.Title : "Truyện chưa đặt tên";
            string coverImageUrl = "/images/default-cover.jpg"; // Ảnh mặc định

            // Logic xử lý lưu file ảnh tải lên
            if (dto.CoverImage != null && dto.CoverImage.Length > 0)
            {
                var SystemPath = Directory.GetCurrentDirectory();
                var uploadsFolder = Path.Combine(SystemPath, "wwwroot", "uploads");
                
                // Tạo thư mục nếu chưa có
                if (!Directory.Exists(uploadsFolder)) 
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Tạo tên file độc nhất để tránh bị trùng
                var uniqueFileName = Guid.NewGuid().ToString() + "_" + dto.CoverImage.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.CoverImage.CopyToAsync(fileStream);
                }
                
                // Đường dẫn lưu vào DB để Frontend có thể lấy ảnh
                coverImageUrl = "/uploads/" + uniqueFileName;
            }

            var story = new Story
            {
                TitleEn = finalTitle, 
                TitleVn = finalTitle, 
                Author = dto.Author ?? "Tác giả chưa đặt tên",
                Description = dto.Description,
                CoverImageUrl = coverImageUrl,
                Status = StoryStatus.Ongoing
            };
            
            _context.Stories.Add(story);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetStory), new { id = story.Id }, story);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStory(int id)
        {
            var story = await _context.Stories.FindAsync(id);
            if (story == null) return NotFound("Không tìm thấy truyện cần xóa.");

            _context.Stories.Remove(story);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Xóa truyện thành công." });
        }
    }

    // Đã sửa đổi DTO: Đổi CoverImageUrl thành CoverImage với kiểu IFormFile
    public class CreateStoryDto
    {
        public string? Title { get; set; }
        public string? Author { get; set; }
        public string? Description { get; set; }
        public IFormFile? CoverImage { get; set; } 
    }
}