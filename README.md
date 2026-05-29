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
- **Tối ưu SEO:** Đường dẫn thân thiện Việt hóa (`/san-pham/[slug]`), sinh động Open Graph và JSON-LD Schemas (Breadcrumb, Product, Organization) tự động.
- **Tốc độ vượt trội:** Compression nén gzip, Cache-Control ở API & Next.js static, Lazy dynamic loading, nén ảnh thông minh bằng Sharp.

### Admin:
- **Dashboard Thống kê:** Xuất biểu đồ đường doanh thu (Recharts), tỷ lệ COD vs Online, trạng thái đơn hàng.
- **Quản lý Hàng hóa:** CRUD sản phẩm, tự động trừ tồn kho khi đặt hàng và cộng lại khi hủy đơn, ẩn hiện sản phẩm.
- **Quản lý đơn hàng:** Duyệt đơn, phân công shipper, cập nhật trạng thái giao và thu hồi công nợ COD của shipper.
- **Quản lý người dùng:** Khóa/mở khóa tài khoản khách hàng.
- **CSKH:** Trả lời hỏi đáp và phê duyệt ẩn/hiện đánh giá.
- **Quản lý Bảo hành:** Cấp mã bảo hành, theo dõi thời hạn và thay đổi trạng thái bảo hành thiết bị.

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router, TypeScript) + Bootstrap 5 + Recharts (biểu đồ) + Socket.io client.
- **Backend:** Node.js + Express.js + TypeScript + Socket.io (WebSocket) + Prisma ORM + Nodemailer (gửi mail).
- **Database:** MySQL 8.0.
- **Docker:** Cấu hình multi-stage Dockerfile cho frontend/backend & docker-compose chạy 4 services.

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
│   │   ├── schema.prisma      # DB Schema (MySQL)
│   │   └── seed.ts            # Script Seed 75 sản phẩm mẫu
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
├── docker-compose.yml         # File compose gốc chạy 4 services
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

#### Bước 1: Khởi động MySQL Database
Khởi chạy container database độc lập hoặc cài MySQL cục bộ trên cổng `3306` với mật khẩu root là `root`.

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

### 1. Deploy Database & Backend lên Railway.app
1. Đăng ký tài khoản trên [Railway.app](https://railway.app/).
2. Nhấn **New Project** → chọn **Provision MySQL** để tạo cơ sở dữ liệu MySQL cloud.
3. Liên kết GitHub repo của bạn. Chọn thư mục nguồn là `/backend`.
4. Thiết lập các biến môi trường (Variables) trên Railway giống như file `.env`:
   - `DATABASE_URL`: Lấy trực tiếp từ dịch vụ MySQL mà Railway vừa tạo (định dạng `mysql://user:pass@host:port/db`).
   - `PORT`: `5000`
   - `JWT_SECRET`: Khóa bí mật JWT bảo mật của bạn.
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USER`: Gmail của bạn.
   - `EMAIL_PASS`: Mật khẩu ứng dụng Gmail (2FA App Password).
   - `FRONTEND_URL`: Nhập URL domain frontend của bạn sau khi deploy lên Vercel (ví dụ: `https://techstore.vercel.app`).
5. Railway sẽ tự động đọc `Dockerfile` trong thư mục `/backend`, build và deploy server Node.js.
6. Chạy migrate và seed trên Railway bằng cách tích hợp lệnh vào start command hoặc chạy thông qua CLI:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### 2. Deploy Frontend lên Vercel
1. Đăng ký tài khoản trên [Vercel](https://vercel.com/).
2. Nhấn **Add New** → **Project** và kết nối với GitHub repository của bạn.
3. Cấu hình Project Vercel:
   - **Framework Preset:** Next.js.
   - **Root Directory:** Chọn `frontend`.
   - **Environment Variables:**
     - `NEXT_PUBLIC_API_URL`: Nhập URL API backend đã deploy trên Railway (ví dụ: `https://techstore-backend.up.railway.app`).
     - `NEXT_PUBLIC_SOCKET_URL`: Nhập cùng URL backend trên (ví dụ: `https://techstore-backend.up.railway.app`).
     - `NEXT_PUBLIC_CLIENT_URL`: Nhập URL website của bạn trên Vercel sau khi deploy.
4. Nhấn **Deploy**. Vercel sẽ tự động build tối ưu hóa và xuất bản trang web với tên miền miễn phí `.vercel.app`.

---

## 🔑 Tài khoản đăng nhập kiểm thử (Seed Users)

Sau khi chạy lệnh seed dữ liệu, bạn có thể dùng các tài khoản sau để kiểm thử hệ thống:
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
