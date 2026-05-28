# TechStore - Website Thương mại Điện tử Bán Điện thoại, Laptop & Phụ kiện Công nghệ

TechStore là dự án website thương mại điện tử fullstack hiện đại, được xây dựng dựa trên mẫu giao diện ElectroStore. Dự án phục vụ bài tập lớn thực hành môn Thương mại điện tử HUFLIT nhằm đạt điểm số tối đa.

---

## 🚀 Tính năng nổi bật

### Khách hàng:
- **Đăng ký/Đăng nhập (JWT):** Bảo mật, hỗ trợ đổi mật khẩu và quên mật khẩu gửi link khôi phục qua email.
- **Trang chủ động:** Hiển thị hàng HOT, Flash Sale đếm ngược thời gian thực, tự động gắn nhãn "CHÁY HÀNG" khi sản phẩm HOT hết hàng.
- **Bộ lọc nâng cao:** Lọc động theo RAM, dung lượng SSD, giá, hãng và tìm kiếm từ khóa.
- **Giỏ hàng & Đặt hàng:** Thanh toán COD, MoMo, PayPal, tích điểm thành viên thăng hạng (Bạc/Vàng/Bạch Kim), áp dụng mã giảm giá và gửi mail xác nhận.
- **Chat trực tuyến:** Widget chat Socket.io nổi hỗ trợ thời gian thực kèm chỉ báo admin đang gõ chữ.
- **Đánh giá & Hỏi đáp:** Tương tác trực tiếp trên sản phẩm (chỉ khách đã mua sản phẩm thành công mới được đánh giá).

### Admin:
- **Dashboard Thống kê:** Xuất biểu đồ đường doanh thu (Recharts), tỷ lệ COD vs Online, trạng thái đơn hàng.
- **Quản lý Hàng hóa:** CRUD sản phẩm, tự động trừ tồn kho khi đặt hàng và cộng lại khi hủy đơn, ẩn hiện sản phẩm.
- **Quản lý đơn hàng:** Duyệt đơn, phân công shipper, cập nhật trạng thái giao và thu hồi công nợ COD của shipper.
- **Quản lý người dùng:** Khóa/mở khóa tài khoản khách hàng.
- **CSKH:** Trả lời hỏi đáp và phê duyệt ẩn/hiện đánh giá.

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router, TypeScript) + Bootstrap 5 + Recharts (biểu đồ) + Socket.io client.
- **Backend:** Node.js + Express.js + TypeScript + Socket.io (WebSocket) + Prisma ORM + Nodemailer (gửi mail).
- **Database:** PostgreSQL hoặc MySQL.
- **Docker:** Cấu hình Dockerfile & docker-compose chạy database cục bộ.

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
│   │   ├── schema.prisma      # DB Schema
│   │   └── seed.ts            # Script Seed 75 sản phẩm mẫu
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
├── frontend/                  # Next.js App Client
│   ├── src/
│   │   ├── app/               # Pages (Home, Shop, Product, Cart, Checkout, Account, Admin, Reset-password)
│   │   ├── components/        # Components (Header, Footer, ProductCard, ChatWidget)
│   │   └── lib/               # Cấu hình API, Socket
│   └── package.json
│
├── UIUX/                      # Mẫu giao diện ElectroStore gốc để tham khảo UI
└── README.md
```

---

## 💻 Hướng dẫn chạy thử nghiệm Local (Development)

### Bước 1: Khởi động Database (Docker)
Để chạy nhanh database PostgreSQL cục bộ mà không cần cài đặt rườm rà, bạn sử dụng Docker Compose.
1. Cài đặt Docker Desktop trên máy của bạn.
2. Di chuyển vào thư mục backend và khởi chạy container:
   ```bash
   cd backend
   docker-compose up -d
   ```
   *Lệnh này sẽ khởi động Database PostgreSQL (cổng 5432) và giao diện quản trị Adminer (cổng 8080).*

### Bước 2: Setup Backend & Nạp Dữ liệu mẫu (Seed Data)
1. Tạo tệp `.env` trong thư mục `backend/` dựa theo [backend/.env.example](file:///d:/TechStore.vn/backend/.env.example):
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/techstore?schema=public"
   JWT_SECRET="techstore_jwt_secret_key_for_development"
   JWT_EXPIRES_IN="30d"
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="email-cua-ban@gmail.com"
   EMAIL_PASS="mat-khau-ung-dung"
   FRONTEND_URL="http://localhost:3000"
   ```
2. Cài đặt dependencies và chạy migration cơ sở dữ liệu:
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```
3. Đổ dữ liệu mẫu (Seed Data) chứa tài khoản admin/customer mẫu và 75 sản phẩm thực tế:
   ```bash
   npm run seed
   ```
4. Khởi chạy Backend Server:
   ```bash
   npm run dev
   ```
   *Server backend sẽ chạy tại: http://localhost:5000*

### Bước 3: Setup Frontend Next.js
1. Di chuyển vào thư mục `frontend/`.
2. Tạo tệp `.env.local` ở thư mục `frontend/` để kết nối API backend:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   NEXT_PUBLIC_CLIENT_URL="http://localhost:3000"
   ```
3. Cài đặt dependencies và khởi động:
   ```bash
   npm install
   npm run dev
   ```
   *Frontend sẽ chạy tại: http://localhost:3000*

---

## ☁️ Hướng dẫn Deploy lên Production

### 1. Deploy Database & Backend lên Railway.app
1. Đăng ký tài khoản trên [Railway.app](https://railway.app/).
2. Nhấn **New Project** → chọn **Provision PostgreSQL** để tạo cơ sở dữ liệu cloud.
3. Liên kết GitHub repo của bạn. Chọn thư mục nguồn là `/backend`.
4. Thiết lập các biến môi trường (Variables) trên Railway giống như file `.env`:
   - `DATABASE_URL`: Lấy trực tiếp từ biến `DATABASE_URL` của dịch vụ PostgreSQL mà Railway vừa tạo.
   - `PORT`: `5000`
   - `JWT_SECRET`: Khóa bí mật tùy chọn của bạn.
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: Dành cho gửi email.
   - `FRONTEND_URL`: Nhập URL domain frontend của bạn sau khi deploy lên Vercel.
5. Railway sẽ tự động đọc `Dockerfile` trong thư mục `/backend`, build và deploy server Node.js.

### 2. Deploy Frontend lên Vercel
1. Đăng ký tài khoản trên [Vercel](https://vercel.com/).
2. Nhấn **Add New** → **Project** và kết nối với GitHub repository của bạn.
3. Cấu hình Project Vercel:
   - **Framework Preset:** Next.js.
   - **Root Directory:** Chọn `frontend`.
   - **Environment Variables:**
     - `NEXT_PUBLIC_API_URL`: Nhập URL API backend đã deploy trên Railway (ví dụ: `https://your-backend.railway.app`).
     - `NEXT_PUBLIC_CLIENT_URL`: Nhập URL website của bạn trên Vercel.
4. Nhấn **Deploy**. Vercel sẽ tự động build và tối ưu hóa file tĩnh, cung cấp cho bạn một domain `.vercel.app` miễn phí.

---

## 🔑 Tài khoản đăng nhập kiểm thử (Seed Users)

Sau khi chạy lệnh `npm run seed`, bạn có thể dùng các tài khoản sau để test:
1. **Tài khoản Admin:**
   - Email: `admin@techstore.vn`
   - Mật khẩu: `admin123`
2. **Tài khoản Khách hàng (Hạng Bạc):**
   - Email: `silver@gmail.com`
   - Mật khẩu: `customer123`
3. **Tài khoản Khách hàng (Hạng Vàng):**
   - Email: `gold@gmail.com`
   - Mật khẩu: `customer123`
4. **Tài khoản Khách hàng (Hạng Bạch Kim):**
   - Email: `platinum@gmail.com`
   - Mật khẩu: `customer123`
