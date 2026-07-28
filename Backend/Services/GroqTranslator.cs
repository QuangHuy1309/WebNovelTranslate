using System.Text;
using System.Text.Json;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class GroqTranslator : IAiTranslator
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GroqTranslator> _logger;

        public string ProviderName => "Groq (Fallback Chain)";

        // Đã bổ sung ILogger để theo dõi luồng fallback
        public GroqTranslator(HttpClient httpClient, IConfiguration configuration, ILogger<GroqTranslator> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> TranslateAsync(string sourceText, string systemPrompt)
        {
            var apiKey = _configuration["Groq:ApiKey"];
            
            // Đọc mảng FallbackModels từ appsettings. Nếu file config thiếu, dùng danh sách mặc định.
            var fallbackModels = _configuration.GetSection("Groq:FallbackModels").Get<string[]>() 
                                 ?? new[] { "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "llama-3.3-70b-versatile" };

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("Groq API Key chưa được cấu hình trong appsettings.json.");
            }

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var innerExceptions = new List<Exception>();

            // DUYỆT QUA TỪNG MODEL THEO THỨ TỰ ƯU TIÊN
            foreach (var model in fallbackModels)
            {
                try
                {
                    _logger.LogInformation($"[Groq] Đang thử dịch đoạn text bằng model: {model}");
                    
                    var requestBody = new
                    {
                        model = model,
                        messages = new[]
                        {
                            new { role = "system", content = systemPrompt },
                            new { role = "user", content = sourceText }
                        },
                        temperature = 0.3 // Nhiệt độ thấp cho dịch thuật
                    };

                    var jsonContent = new StringContent(
                        JsonSerializer.Serialize(requestBody),
                        Encoding.UTF8,
                        "application/json"
                    );

                    var response = await _httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", jsonContent);
                    var responseJson = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new Exception($"API Error ({(int)response.StatusCode}): {responseJson}");
                    }

                    using var doc = JsonDocument.Parse(responseJson);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                    {
                        var firstChoice = choices[0];
                        if (firstChoice.TryGetProperty("message", out var message) && 
                            message.TryGetProperty("content", out var content))
                        {
                            _logger.LogInformation($"[Groq] Dịch THÀNH CÔNG với model: {model}");
                            return content.GetString()?.Trim() ?? string.Empty;
                        }
                    }

                    throw new Exception($"Cấu trúc JSON từ Groq không như mong đợi:\n{responseJson}");
                }
                catch (Exception ex)
                {
                    // Lỗi model này (VD: Rate limit, context quá dài...) => Ghi log cảnh báo và TỰ ĐỘNG CHUYỂN vòng lặp sang model tiếp theo.
                    _logger.LogWarning($"[Groq] Model {model} thất bại. Lý do: {ex.Message}. Đang tự động chuyển sang model dự phòng tiếp theo...");
                    innerExceptions.Add(new Exception($"[{model}] failed: {ex.Message}"));
                }
            }

            // Nếu vòng lặp chạy hết mà không return được kết quả => Tất cả các model đều đã "gục ngã"
            throw new AggregateException("Tất cả các model fallback của Groq đều thất bại. Vui lòng kiểm tra lại API Key hoặc hệ thống Groq.", innerExceptions);
        }
    }
}