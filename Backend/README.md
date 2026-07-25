# Web Novel Translation System API

Đây là hệ thống Backend tự động hóa quy trình dịch thuật truyện chữ (Web Novel) từ tiếng Anh sang tiếng Việt. Hệ thống sử dụng kiến trúc xử lý bất đồng bộ, tích hợp trí tuệ nhân tạo (Google Gemini) và quản lý hàng đợi để đảm bảo tính ổn định khi xử lý khối lượng văn bản lớn.

## 🛠️ Công nghệ sử dụng
* **Framework:** ASP.NET Core Web API (C#)
* **Database:** SQL Server & Entity Framework Core
* **Background Processing:** Hangfire
* **AI Integration:** Google Gemini API (Model: `gemini-2.5-flash`)

## ✨ Tính năng cốt lõi (Core Workflow)
Hệ thống được thiết kế với luồng xử lý chặt chẽ gồm 4 bước (APIs):

1. **Khởi tạo dữ liệu (Mock Data):**
   * `POST /api/Chapters/create-mock-data`
   * Tự động khởi tạo cấu trúc `Story` và `Chapter` chuẩn, xử lý các ràng buộc Nullable và Foreign Key trong Database để tạo bệ phóng cho luồng dịch thuật.

2. **Nạp & Phân mảnh văn bản (Ingestion):**
   * `POST /api/Chapters/{id}/ingest`
   * Tiếp nhận văn bản thô (Raw Text) tiếng Anh, tự động cắt thành các đoạn nhỏ (Segments) và đánh số thứ tự (OrderIndex). 
   * Áp dụng Unique Index để ngăn chặn tuyệt đối lỗi trùng lặp dữ liệu khi nạp lại.

3. **Dịch thuật ngầm (Background Translation):**
   * `POST /api/Chapters/{id}/translate`
   * Kích hoạt tiến trình Hangfire chạy ngầm, không gây nghẽn luồng chính (trả về HTTP 202 Accepted ngay lập tức).
   * Tự động gửi từng đoạn văn sang Google Gemini AI.
   * **Cơ chế chịu lỗi (Resilience):** Tích hợp độ trễ an toàn (`Task.Delay`) để tránh giới hạn Rate Limit của Google; tự động bắt lỗi (Exceptions) và đẩy vào hàng đợi Requeue của Hangfire để thử lại khi có sự cố mạng hoặc API.

4. **Xuất bản dịch (Export):**
   * `GET /api/Chapters/{id}/export`
   * Truy xuất toàn bộ các Segments đã được AI dịch, nối lại thành một văn bản tiếng Việt hoàn chỉnh theo đúng thứ tự logic ban đầu.

## 🗄️ Cấu trúc Database (Lõi)
* **Stories:** Quản lý thông tin bộ truyện (TitleEn bắt buộc, các thông tin phụ linh hoạt Nullable).
* **Chapters:** Quản lý chương truyện, liên kết với Stories.
* **Segments:** Đơn vị lưu trữ văn bản song ngữ nhỏ nhất. Bảo vệ dữ liệu chặt chẽ bằng `Unique Index (ChapterId, OrderIndex)`.