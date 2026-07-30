using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TranslationSystemAPI.Models.Enums;

namespace TranslationSystemAPI.Models.Entities
{
    public class Story
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(255)]
        public string? TitleEn { get; set; }

        [MaxLength(255)]
        public string? TitleVn { get; set; }

        [MaxLength(100)]
        public string? Author { get; set; }

        public string? Description { get; set; }

        public string? CoverImageUrl { get; set; }

        public StoryStatus Status { get; set; } = StoryStatus.Ongoing;

        public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
        public ICollection<Glossary> Glossaries { get; set; } = new List<Glossary>();
        public ICollection<LoreEntity> LoreEntities { get; set; } = new List<LoreEntity>();
        public ICollection<LoreRelationship> LoreRelationships { get; set; } = new List<LoreRelationship>();
    }
}