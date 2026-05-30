# 🎬 TechStore - Kịch Bản Demo 10 Phút Cho Giảng Viên

## 📋 Chuẩn Bị Trước Demo (5 phút)

- Mở sẵn 3 tab browser:
  1. **Tab 1:** https://frontend-ruby-phi-14.vercel.app (trang chủ)
  2. **Tab 2:** https://frontend-ruby-phi-14.vercel.app/admin (admin dashboard)
  3. **Tab 3:** Gmail để show email xác nhận
- Ping backend trước 15 phút để tránh cold start:
  ```
  curl https://techstore-backend-ftzs.onrender.com/api/health
  ```

---

## ⏱️ Kịch Bản Demo

### 1. Trang Chủ (1 phút)

1. Mở `https://frontend-ruby-phi-14.vercel.app`
2. **Giới thiệu:**
   - "Đây là TechStore – website bán điện thoại, laptop và phụ kiện công nghệ."
   - Show banner slider → "Banner có hiệu ứng tự động chuyển slide."
3. Scroll xuống:
   - **Khu vực HOT** → "Sản phẩm HOT được gắn nhãn đỏ nổi bật."
   - **Sản phẩm CHÁY HÀNG** → "Khi stock = 0, hệ thống tự động hiển thị badge CHÁY HÀNG."
   - **Khu vực BÁN CHẠY** → Hiển thị sản phẩm best_seller
4. **Widget tra cứu bảo hành** → Nhập SĐT: `0923456789`
   - "Khách có thể tra cứu bảo hành ngay trên trang chủ."

---

### 2. Mua Hàng & Thanh Toán (2 phút)

1. Nhấn thanh tìm kiếm → gõ **"iPhone 16"**
   - Show kết quả → Lọc theo giá, hãng, danh mục
2. Click vào **iPhone 16 Pro Max** → trang chi tiết sản phẩm:
   - Hiển thị ảnh chính hãng Apple
   - Thông số kỹ thuật đầy đủ
   - Section hỏi đáp, đánh giá
3. **Thêm vào giỏ hàng** (số lượng: 1)
4. Mở giỏ hàng:
   - Nhập mã: **SALE10** → "Giảm ngay 10%"
   - Tổng tiền cập nhật đúng
5. **Đặt hàng** → Chọn COD → Nhập địa chỉ giao hàng
6. Xác nhận → Show thông báo "Đặt hàng thành công"
7. Mở Gmail → Show **email xác nhận đơn hàng**

---

### 3. Tài Khoản Khách Hàng Thân Thiết (2 phút)

1. **Đăng nhập Facebook mock** → hoặc đăng nhập:
   - Email: `platinum@test.vn` / Password: `Test@123`
2. Vào **Trang tài khoản**:
   - Show hạng **Bạch Kim** với badge vàng nổi bật
   - Doanh số tích lũy: **120,000,000 VNĐ**
   - Điểm tích lũy: **1,200 điểm**
   - **Chiết khấu tự động 5%** hiển thị rõ ràng
3. Tab **Đơn hàng của tôi:**
   - Lịch sử mua hàng đầy đủ
   - Trạng thái từng đơn hàng
   - Nút **Hủy đơn** (đơn đang chờ duyệt)
4. Tab **Bảo hành cá nhân:**
   - Danh sách thiết bị bảo hành
   - Trạng thái từng warranty
5. Tab **Đánh giá sản phẩm:**
   - Chỉ sản phẩm đã mua mới được đánh giá

---

### 4. Admin Dashboard (3 phút)

1. Đăng nhập: `admin@techstore.vn` / `Admin@123`
2. **Dashboard thống kê:**
   - Biểu đồ doanh thu 30 ngày (Recharts)
   - "Có thể lọc theo khoảng ngày tùy chọn."
   - Tỷ lệ COD vs Thanh toán online
   - Tổng đơn hàng theo trạng thái
3. **Quản lý đơn hàng:**
   - Xem tất cả đơn, lọc theo ngày/trạng thái
   - Chọn đơn → **Duyệt đơn**
   - Phân công → **Chọn shipper**
   - Xác nhận → **Giao thành công** → Bảo hành tự kích hoạt
   - Show **Thu công nợ COD** của shipper
4. **Quản lý mã khuyến mãi:**
   - Đang có: SALE10, GIAM50K, VIP15
   - Tạo mã mới → Đặt ngày hết hạn
5. **CSKH – Hỏi đáp & Đánh giá:**
   - Admin trả lời câu hỏi khách hàng
   - Duyệt/ẩn đánh giá sản phẩm
6. **Quản lý bảo hành:**
   - Xem bảo hành theo đơn hàng
   - Cập nhật trạng thái bảo hành

---

### 5. Chat & SEO (2 phút)

**Chat Real-time:**
1. Mở tab 2: đăng nhập `platinum@test.vn`
2. Nhấn **widget chat** góc phải dưới
3. Gửi tin nhắn → "Cho tôi hỏi về iPhone 16?"
4. **Auto-reply sau 1 giây** từ bot
5. Mở tab 3: Admin → Trang Chat
6. Admin thấy tin nhắn → Trả lời real-time
7. Show **chỉ báo "đang gõ..."** ở widget chat khách

**SEO:**
1. Mở: `https://frontend-ruby-phi-14.vercel.app/sitemap.xml`
   - Show cấu trúc sitemap đầy đủ
2. Dùng DevTools → Network → check API calls → tất cả trỏ về `onrender.com`
3. Mở Google PageSpeed:
   - `https://pagespeed.web.dev/analysis?url=https://frontend-ruby-phi-14.vercel.app`
   - **SEO Score: 100** ✅
   - Performance: ≥ 80 ✅

---

## 🎯 Điểm Nhấn Khi Demo

| Tính năng | Demo điểm | Điểm số |
|-----------|-----------|---------|
| Hosting thực tế | Vercel + Render đang chạy | 1đ ✅ |
| SEO 100 điểm | PageSpeed SEO = 100 | 0.5đ ✅ |
| Giao diện đẹp | UI Bootstrap 5 + animations | 0.25đ ✅ |
| Tốc độ trang | Performance ≥ 80 | 0.25đ ✅ |
| Chat real-time | Socket.io 2 chiều | Điểm+++ |

---

## 🔑 Tài Khoản Nhanh

```
Admin:    admin@techstore.vn  /  Admin@123
Platinum: platinum@test.vn    /  Test@123
Gold:     gold@test.vn        /  Test@123
Silver:   silver@test.vn      /  Test@123
```

---

## ⚠️ Lưu Ý Khi Demo

1. **Cold start Render:** Request đầu tiên có thể chậm 15-30 giây. Hãy ping trước.
2. **Self-ping:** Backend tự ping mỗi 14 phút để tránh ngủ.
3. **Email thật:** Hệ thống gửi email thật qua Gmail SMTP.
4. **Socket.io:** Chat real-time hoạt động qua WebSocket.
