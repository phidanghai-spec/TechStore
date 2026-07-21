import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Component hiển thị màn hình chờ (Loading) khi trang web đang tải dữ liệu
 */
export default function Loading() {
  return (
    <>
      <Header />
      <div className="bg-black text-white min-vh-100 d-flex flex-column align-items-center justify-content-center">
        {/* Biểu tượng vòng xoay loading */}
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Đang tải...</span>
        </div>
        {/* Dòng chữ thông báo đang tải */}
        <p className="fs-5 text-secondary">Đang tải trang chủ TechStore.vn...</p>
      </div>
      <Footer />
    </>
  );
}
