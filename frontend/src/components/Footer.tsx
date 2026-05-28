import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="footer" className="bg-black text-secondary py-5 mt-auto border-top border-secondary">
      <div className="container-fluid px-md-5">
        <div className="row d-flex flex-wrap justify-content-between py-4 g-4">
          
          {/* Intro Shop */}
          <div className="col-md-3 col-sm-6">
            <div className="footer-menu">
              <div className="footer-intro mb-4">
                <Link href="/" className="fs-3 fw-bold text-white">
                  Tech<span className="text-primary">Store</span>
                </Link>
              </div>
              <p className="text-gray fs-7">
                TechStore là siêu thị bán lẻ điện thoại, laptop, đồng hồ thông minh và phụ kiện công nghệ chính hãng hàng đầu Việt Nam. Cam kết chất lượng, bảo hành uy tín.
              </p>
              <div className="social-links mt-3">
                <ul className="list-unstyled d-flex gap-3">
                  <li><a href="#" className="text-secondary"><i className="bi bi-facebook"></i> Facebook</a></li>
                  <li><a href="#" className="text-secondary"><i className="bi bi-youtube"></i> YouTube</a></li>
                  <li><a href="#" className="text-secondary"><i className="bi bi-tiktok"></i> TikTok</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-2 col-sm-6">
            <div className="footer-menu">
              <h5 className="widget-title text-white text-uppercase fs-6 mb-4">Danh mục</h5>
              <ul className="menu-list list-unstyled fs-7">
                <li className="menu-item mb-2">
                  <Link href="/shop?category=dien-thoai" className="text-secondary text-decoration-none">Điện thoại di động</Link>
                </li>
                <li className="menu-item mb-2">
                  <Link href="/shop?category=laptop" className="text-secondary text-decoration-none">Laptop & MacBook</Link>
                </li>
                <li className="menu-item mb-2">
                  <Link href="/shop?category=tai-nghe" className="text-secondary text-decoration-none">Tai nghe bluetooth</Link>
                </li>
                <li className="menu-item mb-2">
                  <Link href="/shop?category=dong-ho" className="text-secondary text-decoration-none">Đồng hồ thông minh</Link>
                </li>
                <li className="menu-item mb-2">
                  <Link href="/shop?category=phu-kien" className="text-secondary text-decoration-none">Phụ kiện & Linh kiện</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Support Policy */}
          <div className="col-md-2 col-sm-6">
            <div className="footer-menu">
              <h5 className="widget-title text-white text-uppercase fs-6 mb-4">Hỗ trợ khách hàng</h5>
              <ul className="menu-list list-unstyled fs-7">
                <li className="menu-item mb-2">
                  <a href="#" className="text-secondary text-decoration-none">Chính sách bảo hành</a>
                </li>
                <li className="menu-item mb-2">
                  <a href="#" className="text-secondary text-decoration-none">Chính sách đổi trả 1-1</a>
                </li>
                <li className="menu-item mb-2">
                  <a href="#" className="text-secondary text-decoration-none">Chính sách giao hàng tận nơi</a>
                </li>
                <li className="menu-item mb-2">
                  <a href="#" className="text-secondary text-decoration-none">Tích lũy điểm thành viên</a>
                </li>
                <li className="menu-item mb-2">
                  <a href="#" className="text-secondary text-decoration-none">Câu hỏi thường gặp (FAQs)</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="col-md-3 col-sm-6">
            <div className="footer-menu">
              <h5 className="widget-title text-white text-uppercase fs-6 mb-4">Thông tin liên hệ</h5>
              <ul className="menu-list list-unstyled fs-7 text-secondary">
                <li className="mb-2">
                  <strong className="text-white">Hotline hỗ trợ:</strong> 1900 360 360 (8h00 - 22h00)
                </li>
                <li className="mb-2">
                  <strong className="text-white">Địa chỉ:</strong> 828 Sư Vạn Hạnh, Phường 13, Quận 10, TP.HCM
                </li>
                <li className="mb-2">
                  <strong className="text-white">Email:</strong> support@techstore.vn
                </li>
              </ul>
              <div className="payment-gateways mt-4 d-flex gap-2">
                <img src="/images/visa-card.png" width="40" height="25" alt="visa" />
                <img src="/images/master-card.png" width="40" height="25" alt="master" />
                <img src="/images/paypal-card.png" width="40" height="25" alt="paypal" />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="border-top border-secondary pt-4 text-center fs-8 text-gray">
          <p className="m-0">
            © {new Date().getFullYear()} TechStore. Tất cả quyền được bảo lưu. Thiết kế lấy cảm hứng từ TemplatesJungle.
          </p>
          <p className="mt-1" style={{ fontSize: '0.7rem', color: '#555' }}>
            Đề tài môn học Thương mại điện tử HUFLIT.
          </p>
        </div>
      </div>
    </footer>
  );
}
