using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TranslationSystemAPI.Models.Entities
{
    public class LoreEntity
    {
        [Key]
        public int Id { get; set; }

        public int StoryId { get; set; }
        [ForeignKey(nameof(StoryId))]
        public Story? Story { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string EntityType { get; set; } = string.Empty; // VD: Character, Location, Item

        public string? Description { get; set; }

        // Navigation properties để EF Core tự mapping các mối quan hệ (Node-Edge)
        public ICollection<LoreRelationship> OutgoingRelationships { get; set; } = new List<LoreRelationship>();
        public ICollection<LoreRelationship> IncomingRelationships { get; set; } = new List<LoreRelationship>();
    }
}