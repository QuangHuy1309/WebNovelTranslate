using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TranslationSystemAPI.Models.Enums;

namespace TranslationSystemAPI.Models.Entities
{
    public class Glossary
    {
        [Key]
        public int Id { get; set; }

        public int StoryId { get; set; }

        [Required, MaxLength(100)]
        public string OriginalTerm { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string TranslatedTerm { get; set; } = string.Empty;

        public TermType Type { get; set; } = TermType.Misc;

        [ForeignKey("StoryId")]
        public Story? Story { get; set; }
    }
}