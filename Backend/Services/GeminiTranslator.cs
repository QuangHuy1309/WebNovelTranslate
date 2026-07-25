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

            // Endpoint chính thức của Google Gemini REST API
            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            // Request Payload theo chuẩn JSON Schema của Gemini API
            var requestBody = new
            {
                systemInstruction = new
                {
                    parts = new[]
                    {
                        new { text = systemPrompt }
                    }
                },
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = sourceText }
                        }
                    }
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
                throw new Exception(
                    $"Status Code: {(int)response.StatusCode}\n\nResponse:\n{responseJson}");
            }

            // Parse kết quả trả về từ Gemini
            using var doc = JsonDocument.Parse(responseJson);
            var translatedText = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return translatedText?.Trim() ?? string.Empty;
        }
    }
}