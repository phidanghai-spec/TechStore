import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ProductListSkeleton } from '../../components/ProductSkeleton';

export default function ShopLoading() {
  return (
    <>
      <Header />
      <div className="container-fluid px-md-5 py-5 bg-black text-white min-vh-100">
        <div className="row">
          {/* Sidebar skeleton */}
          <div className="col-lg-3 mb-4">
            <div className="bg-dark p-4 rounded border border-secondary" style={{ height: '500px' }}>
              <div className="bg-secondary rounded shimmer mb-4" style={{ height: '24px', width: '60%' }}></div>
              <div className="bg-secondary rounded shimmer mb-3" style={{ height: '36px' }}></div>
              <div className="bg-secondary rounded shimmer mb-3" style={{ height: '36px' }}></div>
              <div className="bg-secondary rounded shimmer mb-3" style={{ height: '36px' }}></div>
              <div className="bg-secondary rounded shimmer mb-3" style={{ height: '36px' }}></div>
            </div>
          </div>

          {/* Product grid skeleton */}
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
              <div className="bg-secondary rounded shimmer" style={{ height: '24px', width: '200px' }}></div>
              <div className="bg-secondary rounded shimmer" style={{ height: '18px', width: '120px' }}></div>
            </div>
            
            <ProductListSkeleton count={6} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
