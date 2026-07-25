namespace TranslationSystemAPI.Models.Enums
{
    public enum StoryStatus
    {
        Ongoing = 0,
        Completed = 1,
        Paused = 2
    }

    public enum TranslationStatus
    {
        Pending = 0,
        Translating = 1,
        NeedsReview = 2,
        Published = 3
    }

    public enum TermType
    {
        Character = 0,
        Location = 1,
        Skill = 2,
        Item = 3,
        Misc = 4
    }
}