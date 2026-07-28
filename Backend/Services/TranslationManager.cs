using TranslationSystemAPI.Exceptions;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class TranslationManager : ITranslationManager
    {
        private readonly GeminiTranslator _primaryStrategy;
        private readonly GroqTranslator _fallbackStrategy;
        private readonly ILogger<TranslationManager> _logger;

        public TranslationManager(
            GeminiTranslator primaryStrategy,
            GroqTranslator fallbackStrategy,
            ILogger<TranslationManager> logger)
        {
            _primaryStrategy = primaryStrategy;
            _fallbackStrategy = fallbackStrategy;
            _logger = logger;
        }

        public async Task<string> ExecuteTranslationAsync(string sourceText, string systemPrompt)
        {
            try
            {
                return await _primaryStrategy.TranslateAsync(sourceText, systemPrompt);
            }
            catch (ContentCensoredException ex)
            {
                _logger.LogWarning("[{Provider}] Bị chặn nội dung: {Message}. Bắt đầu Fallback sang {FallbackProvider}.", 
                    _primaryStrategy.ProviderName, ex.Message, _fallbackStrategy.ProviderName);
                
                // Tự động chuyển sang Groq
                return await _fallbackStrategy.TranslateAsync(sourceText, systemPrompt);
            }
        }
    }
}