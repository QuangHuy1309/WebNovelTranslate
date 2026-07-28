using System.Text;
using System.Text.Json;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class GeminiTranslator : IAiTranslator
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GeminiTranslator(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> TranslateAsync(string sourceText, string systemPrompt)
        {
            var apiKey = _configuration["Gemini:ApiKey"];
            var model = _configuration["Gemini:Model"] ?? "gemini-3.5-flash";

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("Gemini API Key chưa được cấu hình trong appsettings.json.");
            }

            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            // Request Payload đã được thêm safetySettings để không bị chặn khi dịch truyện
            var requestBody = new
            {
                systemInstruction = new
                {
                    parts = new[] { new { text = systemPrompt } }
                },
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = sourceText } }
                    }
                },
                safetySettings = new[]
                {
                    new { category = "HARM_CATEGORY_HARASSMENT", threshold = "BLOCK_NONE" },
                    new { category = "HARM_CATEGORY_HATE_SPEECH", threshold = "BLOCK_NONE" },
                    new { category = "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold = "BLOCK_NONE" },
                    new { category = "HARM_CATEGORY_DANGEROUS_CONTENT", threshold = "BLOCK_NONE" }
                }
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(endpoint, jsonContent);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // Bắt lỗi chuẩn từ JSON của Gemini (nếu có) thay vì chỉ in ra Status Code
                using var errorDoc = JsonDocument.Parse(responseJson);
                if (errorDoc.RootElement.TryGetProperty("error", out var errorElement) && 
                    errorElement.TryGetProperty("message", out var messageElement))
                {
                    throw new Exception($"Gemini API Error ({(int)response.StatusCode}): {messageElement.GetString()}");
                }
                
                throw new Exception($"Status Code: {(int)response.StatusCode}\n\nResponse:\n{responseJson}");
            }

            // Bóc tách JSON an toàn bằng TryGetProperty
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            // 1. Kiểm tra xem có kết quả (candidates) không
            if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                
                // Kiểm tra xem đoạn này có bị Gemini đánh dấu là vi phạm an toàn không
                if (firstCandidate.TryGetProperty("finishReason", out var finishReason) && finishReason.GetString() == "SAFETY")
                {
                    throw new Exception("Đoạn text bị Gemini chặn do vi phạm Safety Ratings (finishReason: SAFETY).");
                }

                if (firstCandidate.TryGetProperty("content", out var content) && 
                    content.TryGetProperty("parts", out var parts) && 
                    parts.GetArrayLength() > 0 &&
                    parts[0].TryGetProperty("text", out var textElement))
                {
                    return textElement.GetString()?.Trim() ?? string.Empty;
                }
            }

            // 2. Nếu request bị chặn toàn bộ (Thường do Prompt)
            if (root.TryGetProperty("promptFeedback", out var feedback))
            {
                throw new Exception($"Request bị Gemini chặn ở promptFeedback. Raw: {responseJson}");
            }

            // 3. Fallback: Nếu JSON không có cấu trúc như dự đoán
            throw new Exception($"Cấu trúc JSON từ Gemini không như mong đợi:\n{responseJson}");
        }
    }
}