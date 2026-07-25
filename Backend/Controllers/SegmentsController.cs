using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data; // Thay bằng namespace DbContext của bạn
using TranslationSystemAPI.DTOs;
using TranslationSystemAPI.DTOs.Requests;

namespace TranslationSystemAPI.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")] // Thêm versioning v1 là một thói quen tốt
    public class SegmentsController : ControllerBase
    {
        private readonly TranslationDbContext _context;
        private readonly ILogger<SegmentsController> _logger;

        public SegmentsController(TranslationDbContext context, ILogger<SegmentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy toàn bộ các đoạn văn bản của một chương cụ thể
        /// </summary>
        /// <param name="chapterId">ID của chương</param>
        /// <param name="cancellationToken">Token hủy request</param>
        /// <returns>Danh sách các segment đã sắp xếp theo thứ tự</returns>
        [HttpGet("chapter/{chapterId}")]
        [ProducesResponseType(typeof(IEnumerable<SegmentResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetChapterSegments(int chapterId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Đang truy xuất dữ liệu segments cho ChapterId: {ChapterId}", chapterId);

            var segments = await _context.Segments
                .AsNoTracking() // Tối ưu hóa performance cho Read-Only
                .Where(s => s.ChapterId == chapterId)
                .OrderBy(s => s.OrderIndex)
                .Select(s => new SegmentResponseDto
                {
                    Id = s.Id,
                    OrderIndex = s.OrderIndex,
                    OriginalText = s.OriginalText,
                    TranslatedText = s.TranslatedText,
                    EditedText = s.EditedText
                })
                .ToListAsync(cancellationToken);

            if (segments.Count == 0)
            {
                _logger.LogWarning("Không tìm thấy segment nào cho ChapterId: {ChapterId}", chapterId);
                return NotFound(new { Message = $"Không tìm thấy dữ liệu nội dung cho chương có ID {chapterId}." });
            }

            return Ok(segments);
        }
        /// <summary>
        /// Cập nhật bản dịch thủ công cho một đoạn văn bản (Segment)
        /// </summary>
        /// <param name="id">ID của đoạn văn bản cần sửa</param>
        /// <param name="request">Nội dung bản dịch mới</param>
        /// <param name="cancellationToken">Token hủy request</param>
        /// <returns>Thông tin đoạn văn bản sau khi cập nhật</returns>
        [HttpPut("{id}/edit")]
        [ProducesResponseType(typeof(SegmentResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateEditedText(int id, [FromBody] EditSegmentRequest request, CancellationToken cancellationToken)
        {
            // 1. Validation cơ bản
            if (string.IsNullOrWhiteSpace(request.EditedText))
            {
                _logger.LogWarning("Thất bại: Nội dung cập nhật bị trống cho SegmentId: {SegmentId}", id);
                return BadRequest(new { Message = "Nội dung bản dịch không được để trống." });
            }

            // 2. Tìm Segment trong Database
            var segment = await _context.Segments.FindAsync(new object[] { id }, cancellationToken);

            if (segment == null)
            {
                _logger.LogWarning("Không tìm thấy SegmentId: {SegmentId} để cập nhật.", id);
                return NotFound(new { Message = $"Không tìm thấy đoạn văn bản với ID {id}." });
            }

            // 3. Thực hiện cập nhật logic nghiệp vụ
            segment.EditedText = request.EditedText;
            
            // 4. Lưu thay đổi vào Database
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Đã cập nhật thành công EditedText cho SegmentId: {SegmentId}", id);

            // 5. Trả về DTO mới nhất để Frontend có thể update lại UI ngay lập tức mà không cần gọi lại API Get
            var responseDto = new SegmentResponseDto
            {
                Id = segment.Id,
                OrderIndex = segment.OrderIndex,
                OriginalText = segment.OriginalText,
                TranslatedText = segment.TranslatedText,
                EditedText = segment.EditedText
            };

            return Ok(responseDto);
        }
    }
}