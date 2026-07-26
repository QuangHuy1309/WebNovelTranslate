using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Data;
using TranslationSystemAPI.Services;
using TranslationSystemAPI.Services.Interfaces;
using Polly;
using Polly.Extensions.Http;
using Hangfire;

var builder = WebApplication.CreateBuilder(args);

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError() // Tự động bắt các lỗi mạng 5xx hoặc 408 (Timeout)
        .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests) // Bắt thêm lỗi 429 của Gemini
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))); 
        // Thử lại tối đa 3 lần. Thời gian chờ tăng dần theo hàm mũ: Lần 1 đợi 2s, lần 2 đợi 4s, lần 3 đợi 8s.
}

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

// Đăng ký TranslationDbContext với chuỗi kết nối từ appsettings.json
builder.Services.AddDbContext<TranslationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<ITextSegmentationService, TextSegmentationService>();
builder.Services.AddScoped<IChapterIngestionService, ChapterIngestionService>();
// Đăng ký Gemini Translator với Typed HttpClient
builder.Services.AddHttpClient<IAiTranslator, GeminiTranslator>().AddPolicyHandler(GetRetryPolicy());

// Đăng ký Service dịch Chapter
builder.Services.AddScoped<IChapterTranslationService, ChapterTranslationService>();
// 1. Thêm dịch vụ Hangfire, sử dụng chung chuỗi kết nối Database hiện tại
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection"))); // Trỏ tới SQL Server của bạn

// 2. Thêm Hangfire Server (Worker chạy ngầm)
builder.Services.AddHangfireServer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJsFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Địa chỉ Frontend của bạn
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Chuyển hướng người dùng từ trang chủ sang trang Swagger
app.MapGet("/", context => {
    context.Response.Redirect("/swagger");
    return Task.CompletedTask;
});

app.UseHangfireDashboard("/hangfire");

app.UseCors("AllowNextJsFrontend");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();