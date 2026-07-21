# 🎓 KỊCH BẢN DEMO & PHÂN TÍCH ĐIỂM MẠNH ĐỒ ÁN TECHSTORE.VN
> **Tài liệu hướng dẫn báo cáo & trình diễn cho Giảng viên / Hội đồng chấm đồ án**

---

## 🌟 PHẦN 1: PHÂN TÍCH NHỮNG ĐIỂM MẠNH VƯỢT TRỘI (UNIQUE SELLING POINTS)

Dưới đây là 7 điểm cộng chuyên môn cao giúp đồ án TechStore.vn ghi điểm tối đa (9.5 - 10):

### 1. Kiến trúc Full-Stack & Đám mây (Cloud-Native Architecture)
* **Frontend**: Next.js (App Router, TypeScript) rendering động, tối ưu hóa SEO tự động (Open Graph, JSON-LD Schemas), nén Sharp cho hình ảnh.
* **Backend**: Express.js (TypeScript), nén dữ liệu Gzip compression, Socket.io real-time server.
* **Database**: **TiDB Cloud (Singapore Region)** - Cơ sở dữ liệu MySQL Serverless Đám mây có khả năng phân tán (Distributed SQL), kết nối an toàn qua SSL/TLS.
* **Deployment**: Đã triển khai Production 100% live trên **Vercel** (Frontend) và **Render** (Backend).

### 2. Trợ lý AI bán hàng thông minh (TechBot - RAG & Smart Fallback)
* **RAG (Retrieval-Augmented Generation)**: Không chỉ chat chung chung, TechBot đọc dữ liệu tồn kho, giá bán thực tế từ DB để bơm vào ngữ cảnh tư vấn cho khách.
* **Smart Fallback Engine**: Tự động bóc tách từ khóa và trả lời từ CSDL nếu kết nối API bị gián đoạn, đảm bảo **buổi demo 100% thành công không bao giờ văng lỗi**.

### 3. Hệ thống Bảo hành Điện tử (E-Warranty) Tra cứu Công khai
* Tự động sinh mã bảo hành `BH-XXXX` và kích hoạt thời hạn ngay khi đơn hàng giao thành công (`DELIVERED`).
* Tích hợp **Mô-đun Tra cứu Bảo hành trực tiếp tại Trang chủ** bằng SĐT hoặc Mã bảo hành mà không bắt buộc đăng nhập.

### 4. Phân hạng Khách hàng thân thiết (Loyalty Program)
* Tự động tích điểm (`1đ = 1 điểm`). Phân cấp hội viên (`SILVER` ➔ `GOLD` ➔ `PLATINUM`).
* Tự động áp dụng chiết khấu trực tiếp tại trang Checkout (Vàng -2%, Bạch Kim -5%).

### 5. Quản lý Đơn hàng, Phân công Giao hàng & Công nợ COD
* Luồng trạng thái chuẩn TMĐT: `PENDING` ➔ `APPROVED` ➔ `SHIPPING` ➔ `DELIVERED`.
* Quản lý công nợ COD (`isDebt`): Theo dõi dòng tiền thu hộ từ nhân viên giao hàng.

### 6. Tìm kiếm Tiếng Việt không dấu & Lọc bộ nhớ linh hoạt
* Bộ lọc khử dấu tiếng Việt (`removeVietnameseTones`), lọc thông số kỹ thuật (RAM, Storage) trong JSON, gợi ý từ khóa Autocomplete.

### 7. Tương tác Real-time qua Socket.io
* Chat trực tuyến 2 chiều giữa Khách hàng và Admin, hỗ trợ chỉ báo trạng thái đang gõ (`typing indicator`).

---

## 🎬 PHẦN 2: KỊCH BẢN DEMO 5 BƯỚC THUYẾT PHỤC GIẢNG VIÊN (10 PHÚT)

### 📌 Bước 1: Giới thiệu Tổng quan & Đưa Link Live (1.5 phút)
* **Nói với thầy:** *"Thưa thầy/cô, đồ án của em là Hệ thống TMĐT TechStore.vn bán thiết bị công nghệ Full-Stack, được triển khai hoàn chỉnh trên đám mây với Vercel, Render và CSDL TiDB Cloud."*
* Mở trình duyệt truy cập: `https://frontend-ruby-phi-14.vercel.app`

### 📌 Bước 2: Demo Trải nghiệm Khách hàng & Tính năng Thông minh (3 phút)
1. **Trang chủ & Tra cứu Bảo hành**:
   * Chỉ cho thầy thấy Flash Sale đếm ngược thời gian thực.
   * Thử nghiệm mô-đun **Tra cứu bảo hành**: Nhập SĐT `0901234567` hoặc Mã `BH-8F2A` ➔ Bấm Tra cứu ➔ Cho thầy xem kết quả thời hạn bảo hành.
2. **Tìm kiếm & Lọc sản phẩm**:
   * Gõ tiếng Việt không dấu vào thanh tìm kiếm: *"macbook air m3"* ➔ Hệ thống vẫn hiển thị chính xác.
3. **Trợ lý AI TechBot**:
   * Mở góc chat ➔ Bấm nút gợi ý *"So sánh MacBook Air M3 vs M2"* hoặc gõ *"iPhone 16 Pro Max giá bao nhiêu?"*.
   * Chỉ cho thầy thấy AI đọc chính xác giá bán, tồn kho và link sản phẩm trực tiếp từ CSDL.

### 📌 Bước 3: Demo Luồng Đặt hàng & Chiết khấu Hội viên (2 phút)
1. Đăng nhập tài khoản Bạch Kim: `platinum@test.vn` / `Test@123`.
2. Chọn 1 sản phẩm ➔ Thêm vào giỏ ➔ Vào trang Checkout.
3. Chỉ cho thầy thấy dòng **Chiết khấu hạng Bạch Kim (-5%)** tự động trừ vào tổng tiền.
4. Chọn thanh toán COD ➔ Bấm Đặt hàng ➔ Nhận thông báo thành công.

### 📌 Bước 4: Demo Phân hệ Quản trị Admin Panel (2.5 phút)
1. Đăng nhập tài khoản Admin: `admin@techstore.vn` / `Admin@123` ➔ Vào trang `/admin`.
2. **Dashboard**: Cho thầy xem Biểu đồ đường doanh thu, tỷ lệ COD vs Online.
3. **Duyệt đơn & Bảo hành**: 
   * Tìm đơn hàng vừa tạo ➔ Chuyển trạng thái sang `APPROVED` ➔ Chọn Shipper ➔ Chuyển `DELIVERED`.
   * Mở tab **Quản lý Bảo hành** ➔ Cho thầy xem bản ghi bảo hành vừa được tự động sinh ra cho khách.
4. **Chat trực tuyến**: Mở tab Chat Admin ➔ Nhắn tin trực tiếp với cửa sổ Khách hàng để chứng minh Socket.io thời gian thực.

### 📌 Bước 5: Kết luận & Sẵn sàng Phản biện (1 phút)
* Tóm tắt: Hệ thống đã hoàn thiện đầy đủ luồng nghiệp vụ TMĐT, tối ưu trải nghiệm người dùng, kết hợp AI và tính năng real-time.

---

## ❓ PHẦN 3: CÁC CÂU HỎI PHẢN BIỆN THƯỜNG GẶP & CÁCH TRẢ LỜI ĐẠT ĐIỂM TỐI ĐA

| Câu hỏi của Giảng viên | Cách trả lời chuẩn chuyên môn |
|---|---|
| **Q1: Em lưu thông số kỹ thuật (RAM, SSD) như thế nào trong CSDL?** | Em lưu cấu hình dưới dạng chuỗi JSON trong trường `description` của bảng `Product`. Khi lọc, Backend parse JSON để filter trong bộ nhớ, vừa linh hoạt vừa không phải tạo quá nhiều bảng phụ. |
| **Q2: Tại sao chọn CSDL TiDB Cloud thay vì MySQL localhost?** | TiDB Cloud là CSDL MySQL-compatible phân tán trên đám mây, giúp hệ thống hoạt động ổn định khi deploy live, hỗ trợ kết nối SSL an toàn và có khả năng tự động mở rộng (Horizontal Scaling). |
| **Q3: Trợ lý AI Chatbot làm sao để trả lời chính xác mà không bịa đặt?** | Em sử dụng kiến trúc RAG (Retrieval-Augmented Generation). Khi có câu hỏi, hệ thống query sản phẩm liên quan từ DB trước rồi mới nạp vào prompt cho AI. Ngoài ra em còn viết thêm bộ Smart Fallback Engine để dự phòng khi mất kết nối API. |
| **Q4: Cơ chế phân hạng hội viên và chiết khấu hoạt động thế nào?** | Mỗi đơn hàng hoàn tất sẽ tích điểm (`1đ = 1 điểm`). Khi đạt mốc (Vàng: 10,000pt, Bạch Kim: 50,000pt), tài khoản tự nâng hạng. Khi Checkout, Backend đọc hạng tài khoản để trừ chiết khấu trực tiếp (Vàng -2%, Bạch Kim -5%). |
| **Q5: Hệ thống bảo mật đăng nhập và phân quyền ra sao?** | Em dùng JWT (JSON Web Token) đính kèm trong header, mật khẩu mã hóa Bcrypt 10 rounds. Middleware `verifyToken` và `requireAdmin` bảo vệ toàn bộ API quản trị. |

---
*Chúc bạn có buổi báo cáo và trình diễn đồ án thành công rực rỡ!*
