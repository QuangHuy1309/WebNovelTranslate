using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TranslationSystemAPI.Models.Enums;

namespace TranslationSystemAPI.Models.Entities
{
    public class Chapter
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // Đảm bảo rằng Id được tự động tăng
        public int Id { get; set; }

        public int StoryId { get; set; }

        public double ChapterNumber { get; set; } 

        [MaxLength(255)]
        public string? TitleEn { get; set; }

        [MaxLength(255)]
        public string? TitleVn { get; set; }

        public TranslationStatus Status { get; set; } = TranslationStatus.Pending;

        [ForeignKey("StoryId")]
        public Story? Story { get; set; }
        
        public ICollection<Segment> Segments { get; set; } = new List<Segment>();
    }
}