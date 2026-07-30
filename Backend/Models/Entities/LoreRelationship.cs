using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TranslationSystemAPI.Models.Entities
{
    public class LoreRelationship
    {
        [Key]
        public int Id { get; set; }

        // Gắn trực tiếp StoryId để sau này truy vấn toàn bộ Graph của 1 truyện siêu nhanh
        public int StoryId { get; set; }
        [ForeignKey(nameof(StoryId))]
        public Story? Story { get; set; }

        public int SourceEntityId { get; set; }
        [ForeignKey(nameof(SourceEntityId))]
        public LoreEntity? SourceEntity { get; set; }

        public int TargetEntityId { get; set; }
        [ForeignKey(nameof(TargetEntityId))]
        public LoreEntity? TargetEntity { get; set; }

        [Required]
        [MaxLength(100)]
        public string RelationType { get; set; } = string.Empty; // VD: ENEMY_OF, MASTER_OF

        public string? Context { get; set; } // Trích dẫn ngữ cảnh giải thích
    }
}