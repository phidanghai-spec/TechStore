# 🛒 TechStore - Website Bán Điện Thoại & Phụ Kiện

## 🌐 Link Demo
- **Website:** https://frontend-ruby-phi-14.vercel.app
- **API:** https://techstore-backend-ftzs.onrender.com

## 👤 Tài Khoản Demo
| Vai trò | Email | Mật khẩu |
|---------|-------|---------|
| Admin | admin@techstore.vn | Admin@123 |
| Bạch Kim | platinum@test.vn | Test@123 |
| Vàng | gold@test.vn | Test@123 |
| Bạc | silver@test.vn | Test@123 |

## 🛠 Tech Stack
- **Frontend:** Next.js (App Router, TypeScript) + Bootstrap 5 + Recharts + Socket.io client → **Vercel**
- **Backend:** Node.js + Express.js + TypeScript + Socket.io + Prisma ORM + Nodemailer → **Render**
- **Database:** TiDB Cloud (MySQL compatible) – Singapore region
- **Real-time:** Socket.io
- **ORM:** Prisma

## ⚠️ Lưu ý khi demo
Backend chạy trên Render free tier.
Nếu request đầu tiên chậm (~15-30 giây) là bình thường do server khởi động lại (cold start).
Sau lần đầu, tốc độ phản hồi sẽ bình thường trở lại.

---

## 🚀 Tính năng nổi bật

### Khách hàng:
- **Đăng ký/Đăng nhập (JWT):** Bảo mật, hỗ trợ đổi mật khẩu và quên mật khẩu gửi link khôi phục qua email.
- **Trang chủ động:** Hiển thị hàng HOT, Flash Sale đếm ngược thời gian thực, tự động gắn nhãn "CHÁY HÀNG" khi sản phẩm HOT hết hàng.
- **Bộ lọc nâng cao:** Lọc động theo RAM, dung lượng SSD, giá, hãng và tìm kiếm từ khóa.
- **Giỏ hàng & Đặt hàng:** Thanh toán COD, MoMo, PayPal, tích điểm thành viên thăng hạng (Bạc/Vàng/Bạch Kim), áp dụng mã giảm giá và gửi mail xác nhận.
- **Chat trực tuyến:** Widget chat Socket.io nổi hỗ trợ thời gian thực kèm chỉ báo admin đang gõ chữ.
- **Đánh giá & Hỏi đáp:** Tương tác trực tiếp trên sản phẩm (chỉ khách đã mua sản phẩm thành công mới được đánh giá).
- **Tối ưu SEO:** Đường dẫn thân thiện Việt hóa (`/san-pham/[slug]`), sinh động Open Graph và JSON-LD Schemas (Breadcrumb, Product, Organization) tự động.
- **Tốc độ vượt trội:** Compression nén gzip, Cache-Control ở API & Next.js static, Lazy dynamic loading, nén ảnh thông minh bằng Sharp.

### Admin:
- **Dashboard Thống kê:** Xuất biểu đồ đường doanh thu (Recharts), tỷ lệ COD vs Online, trạng thái đơn hàng.
- **Quản lý Hàng hóa:** CRUD sản phẩm, tự động trừ tồn kho khi đặt hàng và cộng lại khi hủy đơn, ẩn hiện sản phẩm.
- **Quản lý đơn hàng:** Duyệt đơn, phân công shipper, cập nhật trạng thái giao và thu hồi công nợ COD của shipper.
- **Quản lý người dùng:** Khóa/mở khóa tài khoản khách hàng, thêm/sửa thông tin user.
- **CSKH:** Trả lời hỏi đáp và phê duyệt ẩn/hiện đánh giá.
- **Quản lý Bảo hành:** Cấp mã bảo hành, theo dõi thời hạn và thay đổi trạng thái bảo hành thiết bị.

---

## 📁 Cấu trúc thư mục

```
TechStore/
├── backend/                   # REST API & Socket.io Server
│   ├── src/
│   │   ├── controllers/       # Logic nghiệp vụ (Auth, Product, Order, Admin, Chat)
│   │   ├── middleware/        # JWT Auth và phân quyền Admin
│   │   ├── routes/            # Routes API
│   │   ├── services/          # Mail, Socket, Prisma singleton
│   │   └── index.ts           # Server Entrypoint
│   ├── prisma/
│   │   ├── schema.prisma      # DB Schema (TiDB Cloud / MySQL compatible)
│   │   └── seed.ts            # Script Seed 75+ sản phẩm mẫu
│   ├── Dockerfile             # Multi-stage production Dockerfile
│   └── package.json
│
├── frontend/                  # Next.js App Client
│   ├── src/
│   │   ├── app/               # Pages (Home, Shop, Product, Cart, Checkout, Account, Admin, Reset-password)
│   │   ├── components/        # Components (Header, Footer, ProductCard, ChatWidget)
│   │   └── lib/               # Cấu hình API, Socket
│   ├── Dockerfile             # Multi-stage Next.js Dockerfile
│   └── package.json
│
├── docker-compose.yml         # File compose chạy local (4 services)
├── docs/                      # Tài liệu dự án và kịch bản demo
├── UIUX/                      # Mẫu giao diện ElectroStore gốc để tham khảo UI
└── README.md
```

---

## 💻 Hướng dẫn chạy thử nghiệm cục bộ (Development)

### Cách 1: Khởi chạy Nhanh bằng Docker Compose (Khuyến nghị)
Bạn chỉ cần cài đặt Docker Desktop và chạy lệnh sau tại thư mục gốc:
```bash
docker-compose up --build -d
```
Lệnh này sẽ tự động khởi chạy và liên kết 4 dịch vụ:
1. **techstore_mysql (MySQL 8.0):** Cổng `3306`
2. **techstore_adminer (Quản trị DB):** Cổng `8080` (Truy cập: http://localhost:8080 để xem DB)
3. **techstore_backend (API & Socket.io):** Cổng `5000`
4. **techstore_frontend (Next.js Client):** Cổng `3000` (Truy cập: http://localhost:3000)

*Lưu ý: Sau khi container chạy thành công, bạn cần đổ dữ liệu mẫu bằng cách chạy lệnh sau:*
```bash
docker exec -it techstore_backend npx prisma db seed
```

---

### Cách 2: Khởi chạy Thủ công Từng phần
Nếu không dùng Docker Compose, bạn có thể chạy thủ công:

#### Bước 1: Khởi động Database
Khởi chạy container MySQL cục bộ hoặc kết nối TiDB Cloud.

#### Bước 2: Setup Backend & Nạp Dữ liệu mẫu (Seed Data)
1. Tạo tệp `.env` trong thư mục `backend/` dựa theo [backend/.env.example](file:///d:/TechStore.vn/backend/.env.example):
   ```env
   PORT=5000
   DATABASE_URL="mysql://root:root@localhost:3306/techstore"
   JWT_SECRET="techstore_jwt_secret_key_for_development"
   JWT_EXPIRES_IN="30d"
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="email-cua-ban@gmail.com"
   EMAIL_PASS="mat-khau-ung-dung"
   FRONTEND_URL="http://localhost:3000"
   ```
2. Cài đặt dependencies và sinh Prisma client:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   ```
3. Đổ dữ liệu mẫu (Seed Data) chứa tài khoản admin/customer mẫu và 75+ sản phẩm thực tế:
   ```bash
   npm run seed
   ```
4. Khởi chạy Backend Server:
   ```bash
   npm run dev
   ```
   *Server backend sẽ chạy tại: http://localhost:5000*

#### Bước 3: Setup Frontend Next.js
1. Di chuyển vào thư mục `frontend/`.
2. Tạo tệp `.env.local` ở thư mục `frontend/` để kết nối API backend:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   NEXT_PUBLIC_CLIENT_URL="http://localhost:3000"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
   ```
3. Cài đặt dependencies và khởi động:
   ```bash
   npm install
   npm run dev
   ```
   *Frontend sẽ chạy tại: http://localhost:3000*

---

## ☁️ Hướng dẫn Deploy lên Internet (Production)

### 1. Database: TiDB Cloud
- Đăng ký tại [TiDB Cloud](https://tidbcloud.com/) và tạo Serverless Cluster (free tier).
- Lấy connection string dạng: `mysql://user:pass@host:4000/techstore?ssl={"rejectUnauthorized":true}`
- Chạy migrate: `npx prisma db push` và seed: `npx prisma db seed`

### 2. Deploy Backend lên Render
1. Đăng ký tại [Render.com](https://render.com/).
2. **New Web Service** → Connect GitHub repo → Root Directory: `backend`
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `node dist/index.js`
5. Thiết lập các Environment Variables:
   - `DATABASE_URL`: TiDB Cloud connection string
   - `PORT`: `5000`
   - `JWT_SECRET`: Khóa bí mật JWT
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP Gmail
   - `FRONTEND_URL`: `https://frontend-ruby-phi-14.vercel.app`
   - `RENDER_URL`: `https://techstore-backend-ftzs.onrender.com`

### 3. Deploy Frontend lên Vercel
1. Đăng ký tại [Vercel](https://vercel.com/).
2. **Add New Project** → Connect GitHub → Root Directory: `frontend`
3. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://techstore-backend-ftzs.onrender.com`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://techstore-backend-ftzs.onrender.com`
   - `NEXT_PUBLIC_CLIENT_URL`: `https://frontend-ruby-phi-14.vercel.app`
4. Click **Deploy**.

---

## 🔑 Tài khoản đăng nhập kiểm thử

| Vai trò | Email | Mật khẩu | Hạng |
|---------|-------|---------|------|
| Admin | admin@techstore.vn | Admin@123 | - |
| Bạch Kim | platinum@test.vn | Test@123 | Platinum |
| Vàng | gold@test.vn | Test@123 | Gold |
| Bạc | silver@test.vn | Test@123 | Silver |
