using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Models.Entities;
using TranslationSystemAPI.Services.Interfaces;

namespace TranslationSystemAPI.Services
{
    public class LoreExtractionService : ILoreExtractionService
    {
        private readonly TranslationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public LoreExtractionService(TranslationDbContext context, IConfiguration configuration, HttpClient httpClient)
        {
            _context = context;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task ExtractGraphAsync(int chapterId, CancellationToken cancellationToken = default)
        {
            // 1. Lấy toàn bộ Text của chương
            var chapter = await _context.Chapters
                .Include(c => c.Segments)
                .FirstOrDefaultAsync(c => c.Id == chapterId, cancellationToken);

            if (chapter == null || !chapter.Segments.Any()) return;

            // Nối các đoạn lại (Giới hạn khoảng 20,000 ký tự để tránh vượt context window nếu chương quá dài)
            var fullText = string.Join("\n", chapter.Segments.OrderBy(s => s.OrderIndex).Select(s => s.OriginalText));
            if (fullText.Length > 20000) fullText = fullText.Substring(0, 20000);

            // 2. Chuẩn bị gọi API Groq (Llama 3)
            var apiKey = _configuration["Groq:ApiKey"]; // Đảm bảo bạn đã khai báo API Key trong appsettings.json
            if (string.IsNullOrEmpty(apiKey)) throw new Exception("Thiếu Groq API Key.");

            var requestBody = new
            {
                model = "llama3-70b-8192", // Dùng bản 70b cho logic JSON phức tạp
                messages = new[]
                {
                    new { role = "system", content = GetSystemPrompt() },
                    new { role = "user", content = $"Extract Knowledge Graph from this text:\n\n{fullText}" }
                },
                response_format = new { type = "json_object" }, // Bắt buộc trả về JSON chuẩn
                temperature = 0.1 // Temp thấp để model không sáng tạo linh tinh
            };

            var requestContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", requestContent, cancellationToken);
            response.EnsureSuccessStatusCode();

            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);
            var groqResponse = JsonSerializer.Deserialize<GroqResponse>(responseString);
            var jsonResult = groqResponse?.Choices?.FirstOrDefault()?.Message?.Content;

            if (string.IsNullOrEmpty(jsonResult)) return;

            var graphData = JsonSerializer.Deserialize<GraphExtractionResult>(jsonResult);
            if (graphData == null) return;

            // 3. LƯU VÀO DATABASE VÀ XỬ LÝ TRÙNG LẶP (ENTITY RESOLUTION)
            var existingEntities = await _context.LoreEntities
                .Where(e => e.StoryId == chapter.StoryId)
                .ToListAsync(cancellationToken);

            var idMapping = new Dictionary<string, int>(); // Map ID từ JSON sang ID của Database

            foreach (var extEntity in graphData.Entities)
            {
                // THUẬT TOÁN CHỐNG TRÙNG LẶP CƠ BẢN: Kiểm tra tên có chứa nhau không (vd: "Samael Kaizer" chứa "Samael")
                var match = existingEntities.FirstOrDefault(e => 
                    e.Name.Equals(extEntity.Name, StringComparison.OrdinalIgnoreCase) ||
                    e.Name.Contains(extEntity.Name, StringComparison.OrdinalIgnoreCase) ||
                    extEntity.Name.Contains(e.Name, StringComparison.OrdinalIgnoreCase));

                if (match != null)
                {
                    // Đã có trong DB -> Cập nhật tên đầy đủ nhất (nếu tên mới dài hơn)
                    if (extEntity.Name.Length > match.Name.Length) match.Name = extEntity.Name;
                    idMapping[extEntity.Id] = match.Id;
                }
                else
                {
                    // Tạo mới
                    var newEntity = new LoreEntity
                    {
                        StoryId = chapter.StoryId,
                        Name = extEntity.Name,
                        EntityType = extEntity.Type,
                        Description = extEntity.Description
                    };
                    _context.LoreEntities.Add(newEntity);
                    await _context.SaveChangesAsync(cancellationToken); // Save ngay để lấy ID sinh tự động
                    
                    existingEntities.Add(newEntity); // Cập nhật danh sách local
                    idMapping[extEntity.Id] = newEntity.Id;
                }
            }

            // 4. Lưu Relationships
            var existingRelationships = await _context.LoreRelationships
                .Where(r => r.StoryId == chapter.StoryId)
                .ToListAsync(cancellationToken);

            foreach (var extRel in graphData.Relationships)
            {
                if (idMapping.TryGetValue(extRel.Source, out int sourceDbId) && 
                    idMapping.TryGetValue(extRel.Target, out int targetDbId))
                {
                    // Kiểm tra xem quan hệ này đã tồn tại chưa để tránh bị lặp
                    var isDuplicate = existingRelationships.Any(r => 
                        r.SourceEntityId == sourceDbId && 
                        r.TargetEntityId == targetDbId && 
                        r.RelationType == extRel.Relation);

                    if (!isDuplicate)
                    {
                        _context.LoreRelationships.Add(new LoreRelationship
                        {
                            StoryId = chapter.StoryId,
                            SourceEntityId = sourceDbId,
                            TargetEntityId = targetDbId,
                            RelationType = extRel.Relation,
                            Context = extRel.Context
                        });
                    }
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        private string GetSystemPrompt()
        {
            return @"You are an expert NLP system specialized in extracting Knowledge Graphs from fantasy web novels. 
Extract entities (Character, Location, Faction, Concept, Item) and directed relationships (ENEMY_OF, MASTER_OF, MEMBER_OF, BELONGS_TO, HAS_FEELINGS_FOR, etc.).
Maintain the original names. You MUST output STRICTLY in valid JSON format.
EXPECTED JSON SCHEMA:
{
  ""entities"": [
    { ""id"": ""E1"", ""name"": ""Entity Name"", ""type"": ""Character"", ""description"": ""Short description"" }
  ],
  ""relationships"": [
    { ""source"": ""E1"", ""target"": ""E2"", ""relation"": ""ENEMY_OF"", ""context"": ""Reason"" }
  ]
}";
        }

        // Cấu trúc DTO để map JSON trả về từ Groq
        private class GroqResponse { [JsonPropertyName("choices")] public List<Choice>? Choices { get; set; } }
        private class Choice { [JsonPropertyName("message")] public Message? Message { get; set; } }
        private class Message { [JsonPropertyName("content")] public string? Content { get; set; } }

        // Cấu trúc DTO Knowledge Graph
        private class GraphExtractionResult
        {
            [JsonPropertyName("entities")] public List<ExtractedEntity> Entities { get; set; } = new();
            [JsonPropertyName("relationships")] public List<ExtractedRelationship> Relationships { get; set; } = new();
        }
        private class ExtractedEntity
        {
            [JsonPropertyName("id")] public string Id { get; set; } = "";
            [JsonPropertyName("name")] public string Name { get; set; } = "";
            [JsonPropertyName("type")] public string Type { get; set; } = "";
            [JsonPropertyName("description")] public string Description { get; set; } = "";
        }
        private class ExtractedRelationship
        {
            [JsonPropertyName("source")] public string Source { get; set; } = "";
            [JsonPropertyName("target")] public string Target { get; set; } = "";
            [JsonPropertyName("relation")] public string Relation { get; set; } = "";
            [JsonPropertyName("context")] public string Context { get; set; } = "";
        }
    }
}