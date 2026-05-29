import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default function ProductDetailLoading() {
  return (
    <>
      <Header />
      <div className="bg-black text-white py-5 min-vh-100">
        <div className="container-fluid px-md-5">
          {/* Breadcrumbs skeleton */}
          <div className="bg-secondary rounded shimmer mb-4 animate-pulse" style={{ height: '20px', width: '300px' }}></div>

          <div className="row g-5 mb-5">
            {/* Image placeholder */}
            <div className="col-md-6">
              <div className="bg-dark rounded border border-secondary shimmer animate-pulse" style={{ height: '400px' }}></div>
            </div>

            {/* Info placeholder */}
            <div className="col-md-6 animate-pulse">
              <div className="bg-secondary rounded shimmer mb-2" style={{ height: '24px', width: '150px' }}></div>
              <div className="bg-secondary rounded shimmer mb-3" style={{ height: '36px', width: '80%' }}></div>
              <div className="bg-secondary rounded shimmer mb-3" style={{ height: '20px', width: '350px' }}></div>
              <div className="bg-dark rounded border border-secondary shimmer mb-4" style={{ height: '60px', width: '100%' }}></div>
              <div className="bg-secondary rounded shimmer mb-4" style={{ height: '80px', width: '90%' }}></div>
              <div className="bg-secondary rounded shimmer" style={{ height: '45px', width: '200px' }}></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
