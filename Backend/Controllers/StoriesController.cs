using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Models.Entities;
using TranslationSystemAPI.Models.Enums;

namespace TranslationSystemAPI.Controllers
{   [ApiController]
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
                .Select(s => new { s.Id, title = s.TitleEn, s.Author, s.Status }) // Lấy các trường cơ bản
                .ToListAsync();
            return Ok(stories);
        }

        // GET: api/v1/Stories/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStory(int id)
        {
            var story = await _context.Stories
                // Bao gồm luôn danh sách chương để hiển thị ở trang Detail
                .Include(s => s.Chapters) 
                .FirstOrDefaultAsync(s => s.Id == id);

            if (story == null) return NotFound();
            return Ok(story);
        }

        // POST: api/v1/Stories
        [HttpPost]
        public async Task<IActionResult> CreateStory([FromBody] CreateStoryDto dto)
        {
            var story = new Story
            {
                TitleEn = dto.Title,
                TitleVn = dto.Title, // Tạm thời đặt TitleVn giống TitleEn, có thể chỉnh sửa sau
                Author = dto.Author,
                Description = dto.Description,
                Status = StoryStatus.Ongoing
            };
            _context.Stories.Add(story);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetStory), new { id = story.Id }, story);
        }
    }

    public class CreateStoryDto
    {
        public string? Title { get; set; }
        public string? Author { get; set; }
        public string? Description { get; set; }
    }
}
