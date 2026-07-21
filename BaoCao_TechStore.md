# TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN / BÁCH KHOA
## KHOA CÔNG NGHỆ THÔNG TIN
***

<br><br><br>

# BÁO CÁO ĐỒ ÁN MÔN HỌC
## XÂY DỰNG HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN THIẾT BỊ CÔNG NGHỆ TECHSTORE.VN

<br><br><br>

**Giảng viên hướng dẫn:** [Tên Giảng Viên]  
**Nhóm thực hiện:** [Tên Sinh Viên / Nhóm]  
**Mã số sinh viên:** [MSSV]  
**Lớp:** [Mã Lớp]  

<br><br><br>

---
*Thành phố Hồ Chí Minh, năm 2026*

<div style="page-break-after: always;"></div>

## MỤC LỤC

1. **CHƯƠNG 1: GIỚI THIỆU ĐỀ TÀI VÀ PHẠM VI HỆ THỐNG**
   - 1.1 Lý do chọn đề tài
   - 1.2 Mục tiêu đề tài
   - 1.3 Đối tượng sử dụng
   - 1.4 Phạm vi chức năng và giới hạn đề tài
2. **CHƯƠNG 2: PHÂN TÍCH NGHIỆP VỤ VÀ THIẾT KẾ HỆ THỐNG**
   - 2.1 Quy trình nghiệp vụ cốt lõi
     - 2.1.1 Quy trình mua hàng & thanh toán
     - 2.1.2 Quy trình xử lý đơn hàng & công nợ
     - 2.1.3 Quy trình CSKH & bảo hành
   - 2.2 Phân tích hệ thống qua sơ đồ Usecase
   - 2.3 Thiết kế Cơ sở dữ liệu (Database Design & ERD)
     - 2.3.1 Sơ đồ thực thể liên kết ERD
     - 2.3.2 Chi tiết các bảng dữ liệu
3. **CHƯƠNG 3: MÔ TẢ CHỨC NĂNG ĐÃ XÂY DỰNG VÀ MINH CHỨNG**
   - 3.1 Phân hệ khách hàng (Frontend Client)
   - 3.2 Phân hệ khách hàng thân thiết (Loyalty Customers)
   - 3.3 Phân hệ quản trị viên (Admin Panel)
   - 3.4 Các tính năng đặc biệt (Chat Widget, SEO & Tốc độ)
4. **CHƯƠNG 4: ĐÁNH GIÁ, KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**
   - 4.1 Kết quả đạt được
   - 4.2 Hạn chế của hệ thống
   - 4.3 Hướng phát triển trong tương lai
   - 4.4 Tài liệu tham khảo

<div style="page-break-after: always;"></div>

## CHƯƠNG 1: GIỚI THIỆU ĐỀ TÀI VÀ PHẠM VI HỆ THỐNG

### 1.1 Lý do chọn đề tài
Sự phát triển mạnh mẽ của thương mại điện tử (TMĐT) cùng nhu cầu mua sắm thiết bị công nghệ (điện thoại, laptop, phụ kiện) ngày càng tăng cao tại Việt Nam đòi hỏi các doanh nghiệp bán lẻ phải sở hữu một hệ thống website thông minh, trực quan và tối ưu trải nghiệm người dùng. 

Đề tài **"Xây dựng hệ thống thương mại điện tử TechStore.vn"** được lựa chọn nhằm áp dụng các công nghệ web hiện đại (Next.js, Express.js, Prisma ORM, Socket.io) vào việc giải quyết các bài toán TMĐT thực tế: nâng cao tốc độ tải trang, tối ưu hóa công cụ tìm kiếm (SEO), xử lý đồng bộ tồn kho thời gian thực, quản lý phân hạng khách hàng thân thiết và tích hợp các kênh hỗ trợ khách hàng đa dạng.

### 1.2 Mục tiêu đề tài
*   Xây dựng hoàn chỉnh ứng dụng Web thương mại điện tử Full-stack gồm giao diện khách hàng (Client) và bảng điều khiển quản trị (Admin Panel).
*   Đảm bảo các nghiệp vụ TMĐT cốt lõi: Quản lý hàng hóa, khuyến mãi, quản lý giỏ hàng, quy trình đặt hàng đồng bộ kho, quy trình thanh toán trực tuyến (MoMo/PayPal), và quản lý bảo hành.
*   Tích hợp tính năng chat Socket.io trực tuyến thời gian thực kết hợp trợ lý AI thông minh tư vấn bán hàng.
*   Tối ưu hóa SEO đạt điểm tuyệt đối trên Google PageSpeed Insights để tăng khả năng tiếp cận khách hàng tự nhiên.

### 1.3 Đối tượng sử dụng
1.  **Khách vãng lai (Guest):** Người truy cập tìm kiếm thông tin sản phẩm, so sánh thông số, đọc hỏi đáp/đánh giá, thêm sản phẩm vào giỏ hàng và tiến hành đặt hàng trực tiếp (không bắt buộc đăng ký tài khoản).
2.  **Khách hàng thân thiết (Registered Customer):** Người dùng đăng ký tài khoản, được thăng cấp thứ hạng (Bạc/Vàng/Bạch Kim) dựa vào điểm tích lũy mua sắm, nhận ưu đãi chiết khấu trực tiếp, quản lý lịch sử đơn hàng, gửi hỏi đáp, đánh giá sản phẩm và theo dõi bảo hành cá nhân.
3.  **Quản trị viên (Admin):** Người điều hành toàn bộ hệ thống, quản lý danh mục sản phẩm, duyệt đơn hàng, phân công giao hàng, theo dõi công nợ, phản hồi hỏi đáp, phê duyệt đánh giá, quản lý mã giảm giá, kích hoạt/quản lý bảo hành và xem báo cáo thống kê doanh số trực quan.

### 1.4 Phạm vi chức năng và giới hạn đề tài
*   **Phạm vi chức năng:** Hệ thống bao quát toàn bộ quy trình từ giới thiệu sản phẩm, lọc thông minh nâng cao, đặt hàng trực tuyến, tích hợp thanh toán cổng MoMo và PayPal, gửi email xác nhận tự động, chat hỗ trợ, chăm sóc khách hàng, quản lý và kích hoạt bảo hành điện tử, đến phân tích báo cáo doanh số cho admin.
*   **Giới hạn đề tài:**
    *   Hệ thống tập trung mô phỏng luồng giao nhận hàng hóa thông qua phân quyền quản trị của admin và phân công giao hàng cho shipper mẫu, chưa tích hợp trực tiếp với các đơn vị vận chuyển bên thứ ba (như GHTK, GHN).
    *   Mô phỏng cơ chế thanh toán PayPal Sandbox và MoMo thử nghiệm để minh chứng luồng nghiệp vụ.

---

## CHƯƠNG 2: PHÂN TÍCH NGHIỆP VỤ VÀ THIẾT KẾ HỆ THỐNG

### 2.1 Quy trình nghiệp vụ cốt lõi

#### 2.1.1 Quy trình mua hàng & thanh toán
```
[Khách hàng] ──> Chọn sản phẩm ──> Thêm vào giỏ ──> Áp mã giảm giá ──> Điền thông tin giao hàng
                                                                               │
[Hệ thống]   <── Gửi Email xác nhận <── Trừ kho & Tạo đơn <── Chọn PTTT (COD/MoMo/Paypal) <──┘
```
1.  Khách hàng duyệt sản phẩm, lọc theo thuộc tính và thêm vào giỏ hàng.
2.  Hệ thống kiểm tra tồn kho tại mỗi bước thay đổi số lượng.
3.  Tại trang thanh toán, hệ thống áp dụng chiết khấu tự động dựa trên thứ hạng tài khoản (Vàng -2%, Bạch Kim -5%) và kiểm tra điều kiện mã giảm giá (hạn dùng, số lần sử dụng).
4.  Khách hàng chọn phương thức thanh toán: COD, MoMo, hoặc PayPal. 
5.  Sau khi đặt hàng thành công, hệ thống trừ tồn kho của sản phẩm ngay lập tức, ghi nhận tích lũy điểm thăng hạng (nếu đã đăng nhập) và gửi email xác nhận chi tiết đơn hàng cho khách hàng qua dịch vụ email tự động SMTP.

#### 2.1.2 Quy trình xử lý đơn hàng & công nợ
1.  Đơn hàng mới tạo có trạng thái mặc định là `PENDING` (Chờ duyệt).
2.  Admin kiểm tra thông tin và nhấn duyệt đơn (`APPROVED`).
3.  Admin gán nhân viên vận chuyển (shipper) và chuyển trạng thái sang `SHIPPING` (Đang giao).
4.  Khi shipper giao thành công, Admin cập nhật trạng thái đơn thành `DELIVERED` (Đã giao thành công).
    *   Nếu thanh toán trực tuyến (MoMo/PayPal): Cập nhật đơn hàng thành công và hệ thống tự động sinh bản ghi bảo hành thiết bị.
    *   Nếu thanh toán COD: Hệ thống kiểm tra điều kiện nợ tiền công nợ. Nếu khách hàng có tài khoản ký quỹ (deposit) lớn hơn hoặc bằng giá trị hóa đơn, hệ thống cho phép ghi nhận công nợ (`isDebt = true`) và shipper giao hàng trước thu tiền sau. Nếu không, shipper bắt buộc thu tiền mặt và Admin nhấn "Thu tiền công nợ" để cập nhật đơn sang trạng thái đã thanh toán (`PAID`).
5.  Trường hợp đơn hàng bị hủy (`CANCELLED`), hệ thống tự động cộng hoàn lại số lượng tồn kho sản phẩm vào cơ sở dữ liệu.

#### 2.1.3 Quy trình CSKH & bảo hành
*   **Hỏi đáp:** Khách hàng đặt câu hỏi công khai trên sản phẩm -> Trạng thái ẩn chờ duyệt -> Admin trả lời và duyệt hiển thị trong trang quản trị -> Hiển thị công khai đáp án cho toàn bộ người dùng.
*   **Đánh giá:** Chỉ khách hàng đã mua sản phẩm đó thành công và đơn hàng có trạng thái `DELIVERED` mới được cấp quyền viết đánh giá kèm số sao (1-5★). Admin kiểm soát duyệt hiển thị/ẩn đánh giá.
*   **Bảo hành điện tử:** Khi đơn hàng giao thành công (`DELIVERED`), hệ thống tự động tạo mã bảo hành duy nhất và kích hoạt thời hạn 12 tháng. Khách hàng và admin có thể tra cứu hạn bảo hành bất cứ lúc nào qua số điện thoại hoặc mã bảo hành ngay trên trang chủ.

### 2.2 Phân tích hệ thống qua sơ đồ Usecase

Dưới đây là sơ đồ Usecase biểu diễn quyền tác động của các tác nhân (Actor) lên hệ thống TechStore.vn:

```mermaid
usecaseDiagram
    %% Tác nhân khách vãng lai
    rect rgb(20, 20, 20)
        Khách_Vãng_Lai --> (Xem sản phẩm & danh mục)
        Khách_Vãng_Lai --> (Tìm kiếm nâng cao & bộ lọc)
        Khách_Vãng_Lai --> (Quản lý giỏ hàng)
        Khách_Vãng_Lai --> (Đặt hàng & Thanh toán)
        Khách_Vãng_Lai --> (Tra cứu bảo hành công khai)
        Khách_Vãng_Lai --> (Đăng ký tài khoản)
    end

    %% Tác nhân khách hàng thân thiết (Kế thừa và mở rộng)
    rect rgb(30, 30, 30)
        Khách_Hàng_Thân_Thiết --> (Xem sản phẩm & danh mục)
        Khách_Hàng_Thân_Thiết --> (Tìm kiếm nâng cao & bộ lọc)
        Khách_Hàng_Thân_Thiết --> (Đặt hàng & Thanh toán)
        Khách_Hàng_Thân_Thiết --> (Đổi mật khẩu & Cập nhật Profile)
        Khách_Hàng_Thân_Thiết --> (Nhận ưu đãi giảm giá phân hạng)
        Khách_Hàng_Thân_Thiết --> (Theo dõi đơn hàng & Hủy đơn)
        Khách_Hàng_Thân_Thiết --> (Gửi hỏi đáp sản phẩm)
        Khách_Hàng_Thân_Thiết --> (Đánh giá sản phẩm đã mua)
        Khách_Hàng_Thân_Thiết --> (Chat trực tuyến AI & Admin)
    end

    %% Tác nhân Admin quản trị
    rect rgb(40, 40, 40)
        Admin --> (Đăng nhập quản trị)
        Admin --> (Xem biểu đồ thống kê doanh thu)
        Admin --> (Quản lý sản phẩm CRUD)
        Admin --> (Duyệt đơn & phân công giao hàng)
        Admin --> (Thu hồi công nợ COD)
        Admin --> (Quản lý mã giảm giá CRUD)
        Admin --> (Quản lý tài khoản & Khóa người dùng)
        Admin --> (Trả lời hỏi đáp & Duyệt đánh giá)
        Admin --> (Quản lý trạng thái bảo hành)
        Admin --> (Chat thời gian thực hỗ trợ khách hàng)
    end
```

### 2.3 Thiết kế Cơ sở dữ liệu (Database Design & ERD)

#### 2.3.1 Sơ đồ thực thể liên kết ERD
Dữ liệu hệ thống được thiết kế theo cấu trúc chuẩn hóa quan hệ (RDBMS), biểu diễn thông qua sơ đồ ERD dưới đây:

```mermaid
erDiagram
    Category ||--o{ Product : "chứa"
    User ||--o{ Order : "đặt"
    User ||--o{ ProductReview : "viết"
    User ||--o{ ProductQna : "hỏi"
    User ||--o{ ChatMessage : "gửi/nhận"
    User ||--o{ Warranty : "sở hữu"
    Product ||--o{ OrderItem : "gồm trong"
    Product ||--o{ ProductReview : "nhận"
    Product ||--o{ ProductQna : "có"
    Product ||--o{ Warranty : "được bảo hành"
    Order ||--o{ OrderItem : "bao gồm"
    Order ||--o{ Warranty : "phát sinh"

    User {
        string id PK
        string email UNIQUE
        string fullName
        string phone
        string password
        string address
        string address2
        string bankAccount
        float deposit
        datetime dob
        enum role
        int loyaltyPoints
        enum rank
        boolean isLocked
        datetime createdAt
    }

    Category {
        string id PK
        string name UNIQUE
        string slug UNIQUE
    }

    Product {
        string id PK
        string categoryId FK
        string name
        string slug UNIQUE
        float originalPrice
        float salePrice
        int stock
        enum status
        string imageUrl
        string description
        string brand
        string tags
        boolean isVisible
        datetime createdAt
    }

    Order {
        string id PK
        string userId FK
        string customerName
        string customerPhone
        string customerEmail
        string customerAddress
        enum paymentMethod
        enum paymentStatus
        enum orderStatus
        float totalAmount
        float discountAmount
        boolean isDebt
        string deliveryStaff
        datetime createdAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        float price
    }

    Coupon {
        string id PK
        string code UNIQUE
        enum discountType
        float discountValue
        int maxUsage
        int usedCount
        datetime expiryDate
        datetime createdAt
    }

    ProductReview {
        string id PK
        string userId FK
        string productId FK
        int rating
        string comment
        boolean isApproved
        datetime createdAt
    }

    ProductQna {
        string id PK
        string userId FK
        string productId FK
        string question
        string answer
        boolean isApproved
        datetime createdAt
    }

    ChatMessage {
        string id PK
        string senderId FK
        string receiverId FK
        string message
        datetime createdAt
    }

    Warranty {
        string id PK
        string orderId FK
        string productId FK
        string userId FK
        string customerName
        string customerPhone
        string warrantyCode UNIQUE
        int durationMonths
        datetime startDate
        datetime endDate
        enum status
        string notes
        datetime createdAt
    }
```

#### 2.3.2 Chi tiết các bảng dữ liệu
1.  **User (Người dùng):** Lưu trữ thông tin định danh, phân quyền vai trò (Role: Customer/Admin), tích lũy hạng thẻ (Rank: Silver/Gold/Platinum), quản lý trạng thái tài khoản (khóa/mở khóa) và thông tin ký quỹ ngân hàng.
2.  **Category (Danh mục):** Phân loại sản phẩm (Điện thoại, Laptop, Phụ kiện...).
3.  **Product (Sản phẩm):** Chứa thông tin chi tiết thiết bị, trạng thái kinh doanh (Status: NORMAL/HOT/BEST_SELLER), tồn kho thực và mô tả thông số định dạng chuỗi JSON.
4.  **Order (Đơn hàng) & OrderItem (Chi tiết đơn hàng):** Quản lý trạng thái giao nhận (orderStatus), trạng thái thanh toán (paymentStatus), thông tin người nhận, ghi nhận shipper giao hàng và nợ tiền.
5.  **Coupon (Mã giảm giá):** Thiết lập giá trị chiết khấu, số lượt dùng tối đa, lượt đã dùng và thời hạn kết thúc của mã khuyến mãi.
6.  **ProductReview & ProductQna:** Quản trị tương tác phản hồi hỏi đáp và đánh giá chất lượng sản phẩm từ khách hàng.
7.  **ChatMessage:** Lưu lịch sử các đoạn hội thoại tư vấn phục vụ live chat thời gian thực.
8.  **Warranty (Bảo hành):** Quản lý mã bảo hành điện tử kích hoạt tự động sau bán hàng, thời hạn bắt đầu, kết thúc và trạng thái xử lý lỗi thiết bị.

---

## CHƯƠNG 3: MÔ TẢ CHỨC NĂNG ĐÃ XÂY DỰNG VÀ MINH CHỨNG

### 3.1 Phân hệ khách hàng (Frontend Client)
*   **Trang chủ động:** Tích hợp banner chạy mượt mà, hiển thị danh mục sản phẩm trực quan, các khu vực Flash Sale có bộ đếm ngược thời gian thực, tự động gán overlay **"CHÁY HÀNG"** trên ảnh sản phẩm HOT khi tồn kho bằng 0.
*   **Tìm kiếm & Bộ lọc thông minh:** Hỗ trợ lọc đa tiêu chí (hãng, khoảng giá, dung lượng RAM, dung lượng SSD). Thanh tìm kiếm trên Header tích hợp tính năng **AutocompleteSuggestions** tự động hiển thị ảnh, tên và giá sản phẩm khớp ngay khi khách hàng gõ từ khóa.
*   **Giỏ hàng & Đặt hàng:** Lưu trạng thái giỏ hàng. Trang thanh toán pre-fill dữ liệu người dùng, hiển thị chi tiết hóa đơn, cho phép khách hàng áp mã giảm giá và chọn phương thức thanh toán thích hợp.
*   **Minh chứng chức năng (Hướng dẫn chèn ảnh):**
    > **[HÌNH 3.1: Giao diện trang chủ TechStore.vn và Widget tra cứu bảo hành]**  
    > *(Hãy chụp màn hình trang chủ bao gồm banner slider, khu vực hàng HOT nổi bật và widget tra cứu bảo hành ở phía dưới dán vào đây)*
    
    > **[HÌNH 3.2: Giao diện tìm kiếm sản phẩm nâng cao & bộ lọc thông số tại trang cửa hàng]**  
    > *(Hãy chụp màn hình trang cửa hàng /shop khi tích chọn lọc hãng Apple, tầm giá và hiển thị kết quả lọc dán vào đây)*
    
    > **[HÌNH 3.3: Trang giỏ hàng và màn hình thanh toán đơn hàng]**  
    > *(Hãy chụp ảnh màn hình trang /cart và trang /checkout khi nhập mã giảm giá và chọn PTTT qua Ví MoMo dán vào đây)*

### 3.2 Phân hệ khách hàng thân thiết (Loyalty Customers)
*   **Hạng thành viên & Ưu đãi:** Phân hạng tự động dựa trên hóa đơn tích lũy. Trang tài khoản hiển thị rõ cấp độ thẻ kèm tỷ lệ ưu đãi chiết khấu trực tiếp (Vàng -2%, Bạch Kim -5%) được trừ trực tiếp tại hóa đơn thanh toán tiếp theo.
*   **Lịch sử đơn & Hủy đơn:** Khách hàng xem lịch sử toàn bộ đơn hàng. Hỗ trợ nút "Hủy đơn hàng" trực tiếp cho các đơn hàng đang ở trạng thái `PENDING` và hệ thống tự động hoàn kho.
*   **Quản lý bảo hành cá nhân:** Hiển thị danh sách thiết bị đang được kích hoạt bảo hành, thời gian hết hạn và trạng thái hiệu lực.
*   **Đánh giá có điều kiện:** Kiểm tra quyền khách hàng. Hệ thống chặn không cho đánh giá nếu khách chưa từng mua và nhận sản phẩm thành công.
*   **Minh chứng chức năng (Hướng dẫn chèn ảnh):**
    > **[HÌNH 3.4: Bảng điều khiển tài khoản khách hàng thân thiết hạng Bạch Kim]**  
    > *(Hãy đăng nhập tài khoản platinum@test.vn, vào trang cá nhân /account chụp lại màn hình hiển thị số điểm tích lũy 1,200 điểm và ưu đãi 5% dán vào đây)*

### 3.3 Phân hệ quản trị viên (Admin Panel)
*   **Dashboard thống kê:** Hiển thị tổng quan doanh số bán hàng dưới dạng biểu đồ trực quan (Recharts), thống kê tỷ trọng phương thức thanh toán (COD vs Online) và tình hình đơn hàng.
*   **Quản lý sản phẩm & danh mục:** CRUD sản phẩm, ẩn/hiện sản phẩm nhanh, thay đổi trạng thái bán chạy hoặc HOT.
*   **Duyệt đơn & gán giao hàng:** Xem chi tiết thông tin đơn hàng, nhấn duyệt đơn, chọn tên shipper bàn giao vận chuyển và xác nhận thanh toán/công nợ COD.
*   **Quản lý mã giảm giá:** Thêm mới mã giảm giá, cấu hình lượng giảm, loại giảm (phần trăm hoặc tiền mặt), số lượt giới hạn và hạn sử dụng.
*   **Chăm sóc khách hàng & Bảo hành:** Phê duyệt ẩn hiện review sản phẩm, gõ phản hồi câu hỏi Q&A và theo dõi danh sách bảo hành toàn hệ thống.
*   **Minh chứng chức năng (Hướng dẫn chèn ảnh):**
    > **[HÌNH 3.5: Trang tổng quan Dashboard phân tích doanh thu của Admin]**  
    > *(Hãy đăng nhập admin@techstore.vn / Admin@123, vào trang /admin chụp lại biểu đồ doanh thu dạng hình cột hoặc đường cột dán vào đây)*

    > **[HÌNH 3.6: Giao diện quản lý và xử lý đơn hàng của Admin]**  
    > *(Hãy chụp màn hình bảng quản lý đơn hàng khi thực hiện duyệt và gán nhân viên giao hàng dán vào đây)*

### 3.4 Các tính năng đặc biệt (Chat Widget, SEO & Tốc độ)
*   **Chat 2 chế độ:** Widget chat nổi ở góc dưới màn hình. Khách có thể chat với AI tư vấn (phản hồi sau 1 giây) hoặc chat với Admin qua Socket.io. Khi Admin trả lời từ trang quản trị chat, giao diện của khách hàng hiển thị chỉ báo động `"Admin đang nhập..."` thời gian thực.
*   **SEO và Sitemap:** Inject dynamic JSON-LD Schema (Breadcrumbs & Product schema) ngay trong mã nguồn. Khai báo Sitemap cấu trúc XML tự động cập nhật sản phẩm mới và cấu hình Robots.txt chuẩn chỉ.
*   **Tốc độ:** Tối ưu hóa Next.js dynamic import và cơ chế nén, tải trang nhanh đạt điểm số tối ưu trên Google Lighthouse.
*   **Minh chứng chức năng (Hướng dẫn chèn ảnh):**
    > **[HÌNH 3.7: Cửa sổ Chat thời gian thực Socket.io hai chiều giữa Khách hàng và Admin]**  
    > *(Chụp màn hình chia đôi: Một bên là khung chat widget của khách hàng có dòng chữ "Đang nhập...", một bên là giao diện chat admin đang gõ phản hồi dán vào đây)*

    > **[HÌNH 3.8: Dữ liệu cấu trúc JSON-LD Schema và kết quả đo Google Lighthouse/PageSpeed]**  
    > *(Chụp lại kết quả kiểm tra SEO đạt 100 điểm trên Google PageSpeed Insights dán vào đây)*

---

## CHƯƠNG 4: ĐẠN GIÁ, KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 4.1 Kết quả đạt được
*   Hệ thống TechStore.vn được xây dựng hoàn chỉnh, chạy ổn định cả ở môi trường cục bộ (qua Docker Compose) lẫn môi trường internet thực tế (triển khai trên Vercel, Render và TiDB Cloud).
*   Đáp ứng trọn vẹn và tối ưu các luồng nghiệp vụ TMĐT khép kín từ khâu đặt hàng, đồng bộ kho, thăng hạng loyalty, gửi email tự động xác nhận đơn, kích hoạt bảo hành điện tử, đến hỗ trợ tư vấn khách hàng qua Chat Socket.io/AI.
*   Thiết kế giao diện hiện đại, nâng cao trải nghiệm người dùng với bố cục Dark mode thời thượng và tối ưu SEO vượt trội.

### 4.2 Hạn chế của hệ thống
*   Hệ thống chat AI sử dụng API ở phiên bản thử nghiệm nên thỉnh thoảng phản hồi bị trễ nếu lượng câu hỏi quá dồn dập cùng lúc.
*   Chưa tích hợp tự động hóa tính toán phí ship động dựa theo tọa độ bản đồ API Google Maps của khách hàng.

### 4.3 Hướng phát triển trong tương lai
*   Nghiên cứu tích hợp các đơn vị chuyển phát nhanh hàng đầu Việt Nam như Giao Hàng Tiết Kiệm (GHTK) hoặc Viettel Post để tự động hóa khâu giao nhận.
*   Phát triển thêm ứng dụng di động dành riêng cho nhân viên giao hàng (Shipper App) để cập nhật trạng thái đơn hàng tức thời qua định vị GPS.
*   Nâng cấp trợ lý AI chatbot sử dụng RAG kết nối dữ liệu kho hàng thực tế để tư vấn chính xác thông số kỹ thuật từng mã máy cho người mua.

### 4.4 Tài liệu tham khảo
1.  Prisma ORM Documentation: https://www.prisma.io/docs
2.  Next.js 14 App Router Reference: https://nextjs.org/docs
3.  Socket.io Real-time Application Framework: https://socket.io/docs
4.  Schema.org Structured Data Specifications: https://schema.org
5.  Bootstrap 5 Front-end Toolkit: https://getbootstrap.com/docs/5.3
