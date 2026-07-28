namespace TranslationSystemAPI.Exceptions
{
    public class ContentCensoredException : Exception
    {
        public ContentCensoredException(string message) : base(message) { }
    }
}