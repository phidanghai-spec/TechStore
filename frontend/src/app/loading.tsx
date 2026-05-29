import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Loading() {
  return (
    <>
      <Header />
      <div className="bg-black text-white min-vh-100 d-flex flex-column align-items-center justify-content-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="fs-5 text-secondary">Đang tải trang chủ TechStore.vn...</p>
      </div>
      <Footer />
    </>
  );
}
