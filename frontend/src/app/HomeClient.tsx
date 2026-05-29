'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import dynamic from 'next/dynamic';
const ChatWidget = dynamic(() => import('../components/ChatWidget'), { ssr: false });
import ProductCard from '../components/ProductCard';
import Image from 'next/image';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fallback Mock Data in case Backend API is down/offline
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'iPhone 16 Pro Max 256GB',
    slug: 'iphone-16-pro-max-256gb',
    originalPrice: 34990000,
    salePrice: 33990000,
    stock: 12,
    status: 'HOT' as const,
    imageUrl: 'https://images.unsplash.com/photo-1727371754854-47702de29202?w=800&auto=format&fit=crop&q=80',
    brand: 'Apple',
    avgRating: 5,
    ratingsCount: 28
  },
  {
    id: '2',
    name: 'Samsung Galaxy S25 Ultra 512GB',
    slug: 'samsung-galaxy-s25-ultra-512gb',
    originalPrice: 34990000,
    salePrice: 31990000,
    stock: 0, // Out of stock to test "CHÁY HÀNG" status
    status: 'HOT' as const,
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
    brand: 'Samsung',
    avgRating: 4.8,
    ratingsCount: 42
  },
  {
    id: '3',
    name: 'MacBook Pro 16" M4 Pro 24GB/512GB',
    slug: 'macbook-pro-16-inch-m4-pro-24gb-512gb',
    originalPrice: 75990000,
    salePrice: 72990000,
    stock: 5,
    status: 'HOT' as const,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    brand: 'Apple',
    avgRating: 5,
    ratingsCount: 15
  },
  {
    id: '4',
    name: 'iPhone 15 Pro Max 256GB',
    slug: 'iphone-15-pro-max-256gb',
    originalPrice: 30990000,
    salePrice: 28990000,
    stock: 25,
    status: 'BEST_SELLER' as const,
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    brand: 'Apple',
    avgRating: 4.9,
    ratingsCount: 120
  },
  {
    id: '5',
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    originalPrice: 8490000,
    salePrice: 7490000,
    stock: 18,
    status: 'HOT' as const,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    brand: 'Sony',
    avgRating: 4.7,
    ratingsCount: 56
  },
  {
    id: '6',
    name: 'Logitech MX Master 3S',
    slug: 'logitech-mx-master-3s',
    originalPrice: 2490000,
    salePrice: 2190000,
    stock: 45,
    status: 'BEST_SELLER' as const,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    brand: 'Logitech',
    avgRating: 4.9,
    ratingsCount: 88
  },
  {
    id: '7',
    name: 'AirPods Pro 2 USB-C',
    slug: 'airpods-pro-2-usb-c',
    originalPrice: 6990000,
    salePrice: 6490000,
    stock: 50,
    status: 'HOT' as const,
    imageUrl: 'https://images.unsplash.com/photo-1588449668338-d1345b11a4f1?w=800&auto=format&fit=crop&q=80',
    brand: 'Apple',
    avgRating: 4.9,
    ratingsCount: 94
  },
  {
    id: '8',
    name: 'Apple Watch Series 10 GPS 46mm',
    slug: 'apple-watch-series-10-gps-46mm',
    originalPrice: 12490000,
    salePrice: 11990000,
    stock: 9,
    status: 'HOT' as const,
    imageUrl: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&auto=format&fit=crop&q=80',
    brand: 'Apple',
    avgRating: 4.8,
    ratingsCount: 19
  }
];

export default function HomeClient() {
  const [hotProducts, setHotProducts] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Warranty Track State
  const [warrantyQuery, setWarrantyQuery] = useState('');
  const [warrantyResults, setWarrantyResults] = useState<any[] | null>(null);
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [warrantyError, setWarrantyError] = useState('');

  const handleTrackWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarrantyError('');
    setWarrantyResults(null);
    if (!warrantyQuery.trim()) return;

    setWarrantyLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/warranties/track?query=${warrantyQuery.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setWarrantyResults(data);
        if (data.length === 0) {
          setWarrantyError('Không tìm thấy thông tin bảo hành cho số điện thoại hoặc mã bảo hành này.');
        }
      } else {
        setWarrantyError(data.message || 'Lỗi tra cứu bảo hành.');
      }
    } catch (err) {
      setWarrantyError('Lỗi kết nối máy chủ.');
    } finally {
      setWarrantyLoading(false);
    }
  };
  
  // Custom Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: "Apple iPhone 16 Series cực đỉnh",
      subtitle: "Bứt phá giới hạn công nghệ với nút Camera Control và khung Titan sa mạc đẳng cấp.",
      image: "/images/banner-large-1.jpg",
      link: "/shop?category=dien-thoai&brand=Apple"
    },
    {
      title: "MacBook Pro M4 Pro chuyên nghiệp",
      subtitle: "Chip M4 thế hệ mới, màn hình Liquid Retina XDR và pin lên tới 24h hoạt động.",
      image: "/images/banner-large-2.jpg",
      link: "/shop?category=laptop&brand=Apple"
    },
    {
      title: "Samsung Galaxy S25 Series thông minh",
      subtitle: "Quyền năng Galaxy AI, mắt thần bóng đêm 200MP và thiết kế tinh tế.",
      image: "/images/banner-large-3.jpg",
      link: "/shop?category=dien-thoai&brand=Samsung"
    }
  ];

  // Countdown timer (Flash Sale)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // 1. Fetch products from API
    const fetchProducts = async () => {
      try {
        const [hotRes, bestRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/products?status=HOT&limit=8`),
          fetch(`${BACKEND_URL}/api/products?status=BEST_SELLER&limit=8`)
        ]);

        if (hotRes.ok && bestRes.ok) {
          const hotData = await hotRes.json();
          const bestData = await bestRes.json();
          setHotProducts(hotData.products || []);
          setBestSellers(bestData.products || []);
        } else {
          // fallback to mock data
          setHotProducts(MOCK_PRODUCTS.filter(p => p.status === 'HOT'));
          setBestSellers(MOCK_PRODUCTS.filter(p => p.status === 'BEST_SELLER'));
        }
      } catch (err) {
        console.warn('Backend is offline, using mock data.');
        setHotProducts(MOCK_PRODUCTS.filter(p => p.status === 'HOT'));
        setBestSellers(MOCK_PRODUCTS.filter(p => p.status === 'BEST_SELLER'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    // 2. Banner Auto-slide
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    // 3. Countdown timer logic (Count down to 23:59:59 every day)
    const timerInterval = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => {
      clearInterval(slideInterval);
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <>
      <Header />

      {/* 1. Custom Hero Slider */}
      <section className="position-relative overflow-hidden bg-black" style={{ height: '70vh' }}>
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`position-absolute w-100 h-100 transition-opacity duration-1000 d-flex align-items-center ${index === activeSlide ? 'opacity-100 z-2' : 'opacity-0 z-1'}`}
          >
            {/* Optimized background image */}
            <div className="position-absolute w-100 h-100 top-0 start-0 z-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                className="opacity-50"
              />
            </div>
            <div className="container px-md-5 z-3 position-relative">
              <div className="row">
                <div className="col-md-8 text-white">
                  <h1 className="display-3 fw-bold mb-3 animate-slide-up">{slide.title}</h1>
                  <p className="fs-5 text-gray mb-4 animate-slide-up">{slide.subtitle}</p>
                  <Link href={slide.link} className="btn btn-primary btn-lg rounded-pill px-4 py-2 text-uppercase fs-7 animate-slide-up">
                    Mua Ngay
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Slider Controls */}
        <div className="position-absolute bottom-0 start-50 translate-middle-x z-3 mb-4 d-flex gap-2">
          {slides.map((_, index) => (
            <button 
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`border-0 rounded-circle ${index === activeSlide ? 'bg-primary' : 'bg-secondary'}`}
              style={{ width: '12px', height: '12px' }}
            />
          ))}
        </div>
      </section>

      {/* 2. Features Info bar */}
      <section className="py-4 bg-dark text-white border-bottom border-secondary">
        <div className="container-lg">
          <div className="row text-center g-3">
            <div className="col-md-3">
              <div className="p-3 border-end border-secondary">
                <h6 className="text-uppercase m-0">✈ Giao hàng nhanh 2h</h6>
                <small className="text-secondary">Áp dụng nội thành TP.HCM</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border-end border-secondary">
                <h6 className="text-uppercase m-0">🛡 Bảo hành chính hãng</h6>
                <small className="text-secondary">Cam kết 100% chính hãng</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 border-end border-secondary">
                <h6 className="text-uppercase m-0">🔄 Đổi trả 1-1 nhanh chóng</h6>
                <small className="text-secondary">Trong vòng 30 ngày lỗi NSX</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3">
                <h6 className="text-uppercase m-0">🎁 Tích lũy điểm vàng</h6>
                <small className="text-secondary">Thăng hạng nhận ưu đãi khủng</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5. Warranty tracking public section */}
      <section className="py-5 bg-black border-bottom border-secondary">
        <div className="container-fluid px-md-5">
          <div className="bg-dark p-4 rounded-3 border border-secondary">
            <div className="row align-items-center g-4">
              <div className="col-lg-5">
                <h4 className="text-uppercase text-white mb-2 border-start border-primary border-4 ps-3">Tra cứu bảo hành sản phẩm</h4>
                <p className="text-secondary fs-7 mb-0">Nhập Số điện thoại hoặc Mã bảo hành (ví dụ: BH-XXXX) để kiểm tra thời hạn và trạng thái bảo hành thiết bị của bạn.</p>
              </div>
              <div className="col-lg-7">
                <form onSubmit={handleTrackWarranty} className="d-flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nhập số điện thoại mua hàng hoặc mã bảo hành..." 
                    className="form-control bg-black border-secondary text-white fs-7" 
                    value={warrantyQuery}
                    onChange={(e) => setWarrantyQuery(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={warrantyLoading}>
                    {warrantyLoading ? 'Đang tra...' : 'Tra cứu'}
                  </button>
                </form>

                {warrantyError && <div className="text-danger fs-8 mt-2">{warrantyError}</div>}
                
                {warrantyResults && warrantyResults.length > 0 && (
                  <div className="table-responsive rounded border border-secondary mt-3 bg-black" style={{ maxHeight: '250px' }}>
                    <table className="table table-dark table-striped align-middle fs-8 m-0">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Mã bảo hành</th>
                          <th>Thời hạn bảo hành</th>
                          <th>Trạng thái</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warrantyResults.map((w, idx) => (
                          <tr key={idx}>
                            <td>{w.product?.name} ({w.product?.brand})</td>
                            <td className="fw-bold text-primary">{w.warrantyCode}</td>
                            <td>
                              <span className="text-secondary d-block">Kích hoạt: {new Date(w.startDate).toLocaleDateString('vi-VN')}</span>
                              <span className="text-danger fw-bold">Hết hạn: {new Date(w.endDate).toLocaleDateString('vi-VN')}</span>
                            </td>
                            <td>
                              {w.status === 'ACTIVE' && <span className="badge bg-success">Đang hiệu lực</span>}
                              {w.status === 'EXPIRED' && <span className="badge bg-danger">Hết hạn</span>}
                              {w.status === 'CLAIMED' && <span className="badge bg-warning text-black">Đang bảo hành</span>}
                            </td>
                            <td>{w.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Grid */}
      <section className="py-5 bg-black">
        <div className="container-fluid px-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="text-uppercase m-0 text-white border-start border-primary border-4 ps-3">Danh mục sản phẩm</h4>
          </div>
          <div className="row g-4 row-cols-2 row-cols-md-3 row-cols-lg-6">
            {[
              { name: 'Điện thoại', slug: 'dien-thoai', img: '/images/category-thumb-1.jpg' },
              { name: 'Laptop', slug: 'laptop', img: '/images/category-thumb-2.jpg' },
              { name: 'Tai nghe', slug: 'tai-nghe', img: '/images/category-thumb-3.jpg' },
              { name: 'Đồng hồ', slug: 'dong-ho', img: '/images/category-thumb-4.jpg' },
              { name: 'Phụ kiện', slug: 'phu-kien', img: '/images/product-small-1.jpg' },
              { name: 'Linh kiện', slug: 'linh-kien', img: '/images/product-small-3.jpg' }
            ].map((cat, i) => (
              <div key={i} className="col">
                <Link href={`/shop?category=${cat.slug}`} className="text-decoration-none text-white text-center d-block bg-dark p-3 rounded hover-border-primary border border-secondary transition-all">
                  <div className="ratio ratio-1x1 mb-3 bg-black rounded overflow-hidden position-relative">
                    <Image 
                      src={cat.img} 
                      alt={cat.name} 
                      fill
                      sizes="(max-width: 768px) 33vw, 15vw"
                      className="p-2" 
                      style={{ objectFit: 'contain' }} 
                    />
                  </div>
                  <h6 className="m-0 fs-7">{cat.name}</h6>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Flash Sale Countdown */}
      <section className="py-5 bg-dark">
        <div className="container-fluid px-md-5">
          <div className="bg-black p-4 rounded border border-danger d-flex flex-wrap justify-content-between align-items-center g-3">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <h3 className="text-danger fw-bold m-0 text-uppercase tracking-wider">⚡ Flash Sale Hôm nay</h3>
              <div className="d-flex gap-2">
                <div className="countdown-box">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-white fs-3 my-auto">:</div>
                <div className="countdown-box">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-white fs-3 my-auto">:</div>
                <div className="countdown-box">{String(timeLeft.seconds).padStart(2, '0')}</div>
              </div>
            </div>
            <Link href="/shop" className="btn btn-danger btn-sm text-uppercase px-4 rounded-pill">
              Xem toàn bộ Flash Sale
            </Link>
          </div>
        </div>
      </section>

      {/* 5. HOT PRODUCTS Section */}
      <section className="py-5 bg-black">
        <div className="container-fluid px-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="text-uppercase m-0 text-white border-start border-primary border-4 ps-3">HÀNG HOT NỔI BẬT</h4>
            <Link href="/shop?status=HOT" className="text-primary text-decoration-none fs-7 hover-underline">Xem thêm →</Link>
          </div>

          {isLoading ? (
            <p className="text-center py-5 text-secondary">Đang tải sản phẩm hot...</p>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
              {hotProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. BEST SELLERS Section */}
      <section className="py-5 bg-dark">
        <div className="container-fluid px-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="text-uppercase m-0 text-white border-start border-primary border-4 ps-3">SẢN PHẨM BÁN CHẠY</h4>
            <Link href="/shop?status=BEST_SELLER" className="text-primary text-decoration-none fs-7 hover-underline">Xem thêm →</Link>
          </div>

          {isLoading ? (
            <p className="text-center py-5 text-secondary">Đang tải sản phẩm bán chạy...</p>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ChatWidget />
      <Footer />

      <style jsx global>{`
        .animate-slide-up {
          animation: slideUp 0.8s ease forwards;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hover-border-primary:hover {
          border-color: #0d6efd !important;
        }
        .text-hover-primary:hover {
          color: #0d6efd !important;
        }
      `}</style>
    </>
  );
}
