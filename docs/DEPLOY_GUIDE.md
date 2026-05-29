# 🚀 HƯỚNG DẪN DEPLOY TECHSTORE LÊN INTERNET

Tài liệu này hướng dẫn chi tiết từng bước deploy Backend (Node.js/Express) + Database (MySQL) lên **Railway** và Frontend (Next.js) lên **Vercel**.

---

## 🛠️ PHẦN 1: DEPLOY BACKEND LÊN RAILWAY

### Bước 1: Đăng ký & Đăng nhập Railway
1. Truy cập vào trang chủ: [https://railway.app](https://railway.app).
2. Click **Login** ở góc trên cùng bên phải.
3. Chọn **Login with GitHub** và xác nhận ủy quyền (Authorize) cho Railway kết nối vào tài khoản GitHub của bạn.

### Bước 2: Tạo Project mới & Thêm Cơ sở dữ liệu MySQL
1. Tại màn hình Dashboard, chọn **New Project**.
2. Từ menu thả xuống, chọn **Provision MySQL**.
3. Đợi vài giây để Railway tự động khởi tạo một instance CSDL MySQL. Khi hoàn tất, bạn sẽ thấy ô **MySQL** xuất hiện trên giao diện Canvas.

### Bước 3: Thêm Backend Service từ GitHub
1. Trên cùng màn hình dự án, click nút **+ New** (hoặc nút **New** màu đỏ).
2. Chọn **GitHub Repo**.
3. Chọn Repository **TechStore** của bạn từ danh sách (nếu không thấy, bạn có thể cấu hình cấp quyền truy cập GitHub cho Railway).
4. **Quan trọng:** Khi được hỏi thư mục ROOT, hãy chọn thư mục **ROOT** của dự án (không chọn `/backend` ở bước này, ta sẽ cấu hình ở bước sau).

### Bước 4: Cấu hình Backend Service
1. Click vào Service **TechStore** (Service chứa mã nguồn vừa import).
2. Chuyển sang tab **Settings**:
   - Tìm mục **Root Directory**, điền: `backend` (để báo cho Railway chạy build trong thư mục `/backend`).
3. Chuyển sang tab **Variables** và nhấn **Add Variable** (hoặc **Raw Editor** để dán nhanh) để cấu hình các biến môi trường sau:

| Tên biến | Giá trị | Giải thích |
| :--- | :--- | :--- |
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` | *Tham chiếu tự động đến CSDL MySQL vừa tạo trên* |
| `PORT` | `5000` | *Cổng chạy API server* |
| `NODE_ENV` | `production` | *Môi trường chạy ứng dụng* |
| `JWT_SECRET` | `techstore_super_secret_jwt_2026` | *Mã khóa bảo mật JWT* |
| `FRONTEND_URL` | `https://techstore-xxx.vercel.app` | *Tạm thời điền một URL Vercel mẫu hoặc cập nhật sau* |
| `EMAIL_HOST` (hoặc `SMTP_HOST`) | `smtp.gmail.com` | *Địa chỉ máy chủ SMTP gửi mail* |
| `EMAIL_PORT` (hoặc `SMTP_PORT`) | `587` | *Cổng SMTP gửi mail (thường là 587)* |
| `EMAIL_USER` (hoặc `SMTP_USER`) | `your_email@gmail.com` | *Địa chỉ Gmail của bạn* |
| `EMAIL_PASS` (hoặc `SMTP_PASS`) | `xxxx xxxx xxxx xxxx` | *Mật khẩu ứng dụng (App Password) gồm 16 ký tự* |

> [!NOTE]
> Hệ thống mail của TechStore đã được cải tiến để tương thích hoàn toàn với cả 2 cách đặt tên biến `EMAIL_*` và `SMTP_*`.

### Bước 5: Kích hoạt Deploy
1. Sau khi cấu hình biến môi trường và Root Directory xong, Railway sẽ tự động trigger quá trình build và deploy.
2. Bạn có thể theo dõi tiến trình build trong tab **Deployments**.
3. Sau khi build thành công, vào tab **Settings** -> **Environment** -> **Generate Domain** để nhận đường dẫn API công khai có dạng: `https://techstore-production.up.railway.app` (Hãy copy URL này để cấu hình ở phần Frontend).

---

## ⚡ PHẦN 2: DEPLOY FRONTEND LÊN VERCEL

### Bước 1: Đăng ký & Đăng nhập Vercel
1. Truy cập trang chủ: [https://vercel.com](https://vercel.com).
2. Click **Sign Up** -> Chọn **Continue with GitHub** để đăng nhập bằng tài khoản chứa repository TechStore.

### Bước 2: Import Project
1. Tại Dashboard Vercel, chọn **Add New** -> **Project**.
2. Chọn repository **TechStore** từ danh sách GitHub của bạn và click **Import**.
3. Cấu hình các thông số dự án:
   - **Framework Preset**: Chọn **Next.js** (Hệ thống thường tự động nhận diện).
   - **Root Directory**: Click **Edit** và chọn thư mục `frontend`.

### Bước 3: Cấu hình Biến môi trường (Environment Variables)
Mở rộng phần **Environment Variables** và điền 3 biến sau:

| Tên biến | Giá trị | Ví dụ thực tế |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL API của Railway | `https://techstore-production.up.railway.app` |
| `NEXT_PUBLIC_SOCKET_URL` | URL API của Railway | `https://techstore-production.up.railway.app` |
| `NEXT_PUBLIC_CLIENT_URL` | URL Vercel của chính Frontend | `https://techstore.vercel.app` (Nhập URL dự kiến của bạn) |

### Bước 4: Deploy & Nhận link hoạt động
1. Nhấn nút **Deploy** và đợi khoảng 2 - 3 phút để Vercel build Next.js.
2. Sau khi build thành công, bạn sẽ nhận được màn hình pháo hoa chúc mừng và link trang web chính thức, ví dụ: `https://techstore-deploy.vercel.app`.

---

## 🔄 PHẦN 3: LIÊN KẾT CHÉO SAU KHI DEPLOY (QUAN TRỌNG)

Để tính năng Đặt hàng gửi mail và Real-time Chat Socket.io hoạt động ổn định giữa Frontend và Backend, bạn cần thực hiện liên kết chéo như sau:

1. Quay trở lại **Railway.app** -> Chọn service **backend** -> Vào tab **Variables**.
2. Cập nhật giá trị của biến `FRONTEND_URL` thành domain Vercel thật vừa nhận được (Ví dụ: `https://techstore-deploy.vercel.app`).
3. Railway sẽ tự động redeploy lại Backend để áp dụng CORS mới. Sau khi redeploy thành công, hệ thống đã hoàn toàn sẵn sàng vận hành thực tế!

---

## 👤 TÀI KHOẢN ĐĂNG NHẬP KIỂM THỬ (DEMO)

Sử dụng các tài khoản mẫu sau để chấm điểm và demo các tính năng phân hạng thành viên, ký quỹ, COD:

| Vai trò | Email đăng nhập | Mật khẩu | Đặc trưng phân quyền & test case |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@techstore.vn` | `Admin@123` | Quản lý sản phẩm, đơn hàng, chat trực tuyến, xem dashboard |
| **Bạch Kim** | `platinum@test.vn` | `Test@123` | VIP Platinum, giảm 5% đơn hàng, có ký quỹ 25.000.000đ |
| **Vàng** | `gold@test.vn` | `Test@123` | VIP Gold, giảm 2% đơn hàng, có ký quỹ 10.000.000đ |
| **Bạc** | `silver@test.vn` | `Test@123` | Thành viên Silver thông thường, có ký quỹ 5.000.000đ |
