using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TranslationSystemAPI.Models.Entities
{
    public class Segment
    {
        [Key]
        public int Id { get; set; }

        public int ChapterId { get; set; }

        public int OrderIndex { get; set; } 

        [Required]
        public string? OriginalText { get; set; }

        public string? TranslatedText { get; set; } 

        public string? EditedText { get; set; }     

        [ForeignKey("ChapterId")]
        public Chapter? Chapter { get; set; }
    }
}