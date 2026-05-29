'use client';

import { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import dynamic from 'next/dynamic';
const ChatWidget = dynamic(() => import('../../../components/ChatWidget'), { ssr: false });

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProductDetailClient({ initialProduct }: { initialProduct: any }) {
  const [product, setProduct] = useState<any>(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState<any>(null);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Q&A Form state
  const [questionText, setQuestionText] = useState('');
  const [qnaError, setQnaError] = useState('');
  const [qnaSuccess, setQnaSuccess] = useState('');

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  // Fetch product detail (to refresh reviews/Q&As after submission)
  const fetchProductDetail = async () => {
    if (!product || !product.slug) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${product.slug}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!product) {
    return (
      <>
        <Header />
        <div className="text-center py-5 text-white bg-black min-vh-50 d-flex align-items-center justify-content-center">
          <div>
            <p className="fs-4 mb-3">Sản phẩm không tồn tại hoặc đã bị ẩn.</p>
            <a href="/shop" className="btn btn-primary btn-sm">Quay lại cửa hàng</a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Parse product specs
  let specs: Record<string, string> = {};
  try {
    specs = JSON.parse(product.description);
  } catch (e) {
    specs = { 'Mô tả': product.description };
  }

  const handleAddToCart = () => {
    if (product.stock <= 0) return;

    const storedCart = localStorage.getItem('cart');
    let cartItems = [];
    if (storedCart) {
      try {
        cartItems = JSON.parse(storedCart);
      } catch (err) {
        cartItems = [];
      }
    }

    const existingIndex = cartItems.findIndex((item: any) => item.productId === product.id);
    if (existingIndex > -1) {
      cartItems[existingIndex].quantity += quantity;
    } else {
      cartItems.push({
        productId: product.id,
        name: product.name,
        price: product.salePrice,
        imageUrl: product.imageUrl,
        quantity: quantity,
        maxStock: product.stock
      });
    }

    localStorage.setItem('cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cart-updated'));

    alert(`Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng thành công!`);
  };

  // Submit Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setReviewError('Bạn vui lòng đăng nhập để đánh giá sản phẩm.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          rating,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('Đăng đánh giá thành công! Cảm ơn ý kiến của bạn.');
        setReviewComment('');
        fetchProductDetail(); // Reload review history
      } else {
        setReviewError(data.message || 'Không thể đăng đánh giá.');
      }
    } catch (err) {
      setReviewError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    }
  };

  // Submit Q&A
  const handleQnaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQnaError('');
    setQnaSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setQnaError('Bạn vui lòng đăng nhập để gửi câu hỏi.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/qnas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          question: questionText
        })
      });

      const data = await res.json();
      if (res.ok) {
        setQnaSuccess('Gửi câu hỏi thành công! Cửa hàng sẽ duyệt và phản hồi bạn sớm.');
        setQuestionText('');
        fetchProductDetail();
      } else {
        setQnaError(data.message || 'Không thể gửi câu hỏi.');
      }
    } catch (err) {
      setQnaError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    }
  };

  return (
    <>
      <Header />
      <div className="bg-black text-white py-5">
        <div className="container-fluid px-md-5">
          
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/" className="text-secondary text-decoration-none">Trang chủ</a></li>
              <li className="breadcrumb-item"><a href={`/shop?category=${product.category?.slug}`} className="text-secondary text-decoration-none">{product.category?.name}</a></li>
              <li className="breadcrumb-item active text-white" aria-current="page">{product.name}</li>
            </ol>
          </nav>

          {/* Product Basic Info Row */}
          <div className="row g-5 mb-5">
            {/* Image Box */}
            <div className="col-md-6">
              <div className="bg-dark p-4 rounded border border-secondary d-flex align-items-center justify-content-center overflow-hidden position-relative" style={{ minHeight: '400px' }}>
                {product.stock === 0 && (
                  product.status === 'HOT' ? (
                    <div className="hot-sold-out-overlay fs-5 py-2 px-3">CHÁY HÀNG</div>
                  ) : (
                    <div className="sold-out-overlay fs-5 py-2 px-3" style={{ backgroundColor: '#555555' }}>HẾT HÀNG</div>
                  )
                )}
                <img 
                  src={product.imageUrl || 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore'} 
                  alt={product.name} 
                  className="img-fluid" 
                  style={{ maxHeight: '380px', objectFit: 'contain', width: 'auto' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore';
                  }}
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="col-md-6">
              <span className="badge bg-primary text-uppercase mb-2">{product.brand}</span>
              <h2 className="fw-bold mb-2">{product.name}</h2>
              
              {/* Star Rating details */}
              <div className="d-flex align-items-center gap-2 text-warning mb-3">
                <span className="fs-5">{'★'.repeat(Math.round(product.avgRating || 5)) + '☆'.repeat(5 - Math.round(product.avgRating || 5))}</span>
                <span className="text-secondary">({product.ratingsCount || 0} đánh giá)</span>
                <span className="text-secondary">|</span>
                <span className={`fw-bold ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                  {product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Hết hàng'}
                </span>
              </div>

              {/* Price Row */}
              <div className="d-flex align-items-center gap-3 bg-dark p-3 rounded mb-4 border border-secondary">
                <h3 className="text-primary m-0 fw-bold">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                </h3>
                {product.originalPrice > product.salePrice && (
                  <>
                    <span className="text-decoration-line-through text-secondary fs-5">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                    </span>
                    <span className="badge bg-danger">
                      Tiết kiệm {Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              <p className="text-secondary mb-4">{specs.detail || 'Không có mô tả chi tiết thêm.'}</p>

              {/* Add to Cart Actions */}
              {product.stock > 0 && (
                <div className="d-flex gap-3 mb-4 flex-wrap align-items-center">
                  <div className="d-flex align-items-center border border-secondary rounded bg-dark">
                    <button 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="btn text-white px-3 border-0 fs-5"
                    >-</button>
                    <span className="px-3 fw-bold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                      className="btn text-white px-3 border-0 fs-5"
                    >+</button>
                  </div>
                  <button onClick={handleAddToCart} className="btn btn-primary btn-lg px-5 rounded-pill">
                    Thêm vào giỏ hàng
                  </button>
                </div>
              )}

            </div>
          </div>

          <hr className="border-secondary my-5" />

          {/* Product Specifications & Tabs Row */}
          <div className="row g-5">
            {/* Specs Table */}
            <div className="col-lg-6">
              <h4 className="text-white text-uppercase fs-6 mb-4 border-start border-primary border-3 ps-2">Thông số kỹ thuật</h4>
              <div className="table-responsive rounded border border-secondary bg-dark">
                <table className="table table-dark table-striped table-hover m-0 fs-7">
                  <tbody>
                    {Object.keys(specs).filter(key => key !== 'detail').map((key, i) => (
                      <tr key={i}>
                        <td className="text-secondary fw-bold border-secondary py-3 ps-3" style={{ width: '150px' }}>{key}</td>
                        <td className="text-white border-secondary py-3">{specs[key]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Q&A and Reviews Section */}
            <div className="col-lg-6">
              <nav className="mb-4">
                <div className="nav nav-tabs border-secondary" id="nav-tab" role="tablist">
                  <button className="nav-link active bg-black text-white border-secondary" id="nav-reviews-tab" data-bs-toggle="tab" data-bs-target="#nav-reviews" type="button" role="tab" aria-controls="nav-reviews" aria-selected="true">
                    Đánh giá ({product.reviews?.length || 0})
                  </button>
                  <button className="nav-link bg-black text-white border-secondary" id="nav-qnas-tab" data-bs-toggle="tab" data-bs-target="#nav-qnas" type="button" role="tab" aria-controls="nav-qnas" aria-selected="false">
                    Hỏi đáp ({product.qnas?.length || 0})
                  </button>
                </div>
              </nav>

              <div className="tab-content" id="nav-tabContent">
                
                {/* 1. REVIEWS TAB */}
                <div className="tab-pane fade show active" id="nav-reviews" role="tabpanel" aria-labelledby="nav-reviews-tab">
                  {/* Write Review Form */}
                  <div className="bg-dark p-4 rounded border border-secondary mb-4">
                    <h5 className="fs-7 text-white mb-3">Viết đánh giá của bạn</h5>
                    {reviewError && <div className="alert alert-danger py-2 fs-7">{reviewError}</div>}
                    {reviewSuccess && <div className="alert alert-success py-2 fs-7">{reviewSuccess}</div>}
                    
                    <form onSubmit={handleReviewSubmit}>
                      <div className="mb-3 d-flex align-items-center gap-2">
                        <span className="fs-7 text-secondary">Số sao:</span>
                        <div className="stars text-warning fs-5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star} 
                              onClick={() => setRating(star)} 
                              className="cursor-pointer mx-1"
                            >
                              {star <= rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <textarea 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          rows={3}
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Chia sẻ nhận xét của bạn về sản phẩm này..."
                        ></textarea>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm">Gửi đánh giá</button>
                    </form>
                  </div>

                  {/* Reviews List */}
                  <div className="d-flex flex-column gap-3">
                    {(!product.reviews || product.reviews.length === 0) && (
                      <p className="text-secondary fs-7 text-center">Chưa có đánh giá nào cho sản phẩm này.</p>
                    )}
                    {product.reviews?.map((rev: any, i: number) => (
                      <div key={i} className="border-bottom border-secondary pb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <strong className="fs-7 text-white">{rev.user?.fullName}</strong>
                          <span className="text-warning fs-8">{'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}</span>
                        </div>
                        <p className="fs-7 text-secondary m-0">{rev.comment}</p>
                        <small className="text-secondary" style={{ fontSize: '0.65rem' }}>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</small>
                      </div>
                    ))}
                  </div>

                </div>

                {/* 2. QNAs TAB */}
                <div className="tab-pane fade" id="nav-qnas" role="tabpanel" aria-labelledby="nav-qnas-tab">
                  {/* Send Q&A Form */}
                  <div className="bg-dark p-4 rounded border border-secondary mb-4">
                    <h5 className="fs-7 text-white mb-3">Đặt câu hỏi về sản phẩm</h5>
                    {qnaError && <div className="alert alert-danger py-2 fs-7">{qnaError}</div>}
                    {qnaSuccess && <div className="alert alert-success py-2 fs-7">{qnaSuccess}</div>}
                    
                    <form onSubmit={handleQnaSubmit}>
                      <div className="mb-3">
                        <input 
                          type="text" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="Câu hỏi của bạn là gì? (Ví dụ: Sản phẩm có kèm sạc không?)"
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm">Gửi câu hỏi</button>
                    </form>
                  </div>

                  {/* QnA List */}
                  <div className="d-flex flex-column gap-4">
                    {(!product.qnas || product.qnas.length === 0) && (
                      <p className="text-secondary fs-7 text-center">Chưa có câu hỏi nào cho sản phẩm này.</p>
                    )}
                    {product.qnas?.map((q: any, i: number) => (
                      <div key={i} className="bg-dark p-3 rounded border border-secondary">
                        <div className="mb-2">
                          <strong className="fs-7 text-white">❓ {q.user?.fullName}:</strong>
                          <p className="fs-7 text-secondary mt-1 mb-0 ps-3">{q.question}</p>
                        </div>
                        {q.answer ? (
                          <div className="bg-black p-2 rounded mt-2 border-start border-primary border-3">
                            <strong className="fs-7 text-primary">💡 Phản hồi từ Shop:</strong>
                            <p className="fs-7 text-white mt-1 mb-0 ps-2">{q.answer}</p>
                          </div>
                        ) : (
                          <span className="badge bg-secondary fs-8 mt-1">Chờ trả lời</span>
                        )}
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
      <ChatWidget />
      <Footer />
    </>
  );
}
