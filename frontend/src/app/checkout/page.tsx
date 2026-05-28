'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ChatWidget from '../../components/ChatWidget';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'MOMO' | 'PAYPAL'>('COD');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Submit Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Membership Rank Discount
  const [userRank, setUserRank] = useState<'SILVER' | 'GOLD' | 'PLATINUM' | null>(null);
  const [rankDiscount, setRankDiscount] = useState(0);

  useEffect(() => {
    // 1. Load cart
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart);
        if (parsed.length === 0) {
          router.push('/cart');
          return;
        }
        setCartItems(parsed);
        const total = parsed.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
        setTotalAmount(total);
      } catch (e) {
        router.push('/cart');
      }
    } else {
      router.push('/cart');
    }

    // 2. Load User Profile if logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCustomerName(user.fullName || '');
        setCustomerPhone(user.phone || '');
        setCustomerEmail(user.email || '');
        setCustomerAddress(user.address || '');
        setUserRank(user.rank || null);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (userRank === 'GOLD') {
      setRankDiscount(totalAmount * 0.02);
    } else if (userRank === 'PLATINUM') {
      setRankDiscount(totalAmount * 0.05);
    } else {
      setRankDiscount(0);
    }
  }, [totalAmount, userRank]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    setDiscountAmount(0);
    setAppliedCoupon(null);

    if (!couponCode.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons/validate/${couponCode.toUpperCase()}`);
      const data = await res.json();

      if (res.ok) {
        setAppliedCoupon(data.coupon);
        setCouponSuccess(`Áp dụng mã thành công!`);
        
        // Calculate discount
        if (data.coupon.discountType === 'PERCENTAGE') {
          const discount = (totalAmount * data.coupon.discountValue) / 100;
          setDiscountAmount(discount);
        } else {
          setDiscountAmount(data.coupon.discountValue);
        }
      } else {
        setCouponError(data.message || 'Mã giảm giá không hợp lệ.');
      }
    } catch (err) {
      setCouponError('Không thể kết nối đến hệ thống kiểm tra mã giảm giá.');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const orderData = {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      paymentMethod,
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      couponCode: appliedCoupon ? appliedCoupon.code : undefined
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (res.ok) {
        // Clear Cart
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cart-updated')); // Update header

        // Redirect to success page or show alert
        alert(`Đặt hàng thành công! Mã đơn hàng: #${data.orderId.toUpperCase()}. Email xác nhận đã được gửi.`);
        router.push('/');
      } else {
        setOrderError(data.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại.');
      }
    } catch (err) {
      setOrderError('Lỗi kết nối máy chủ khi gửi đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalPayable = Math.max(0, totalAmount - discountAmount - rankDiscount);

  return (
    <>
      <Header />
      <div className="bg-black text-white py-5 min-vh-75">
        <div className="container-fluid px-md-5">
          <h2 className="text-uppercase mb-5 pb-2 border-bottom border-secondary">Thanh toán đơn hàng</h2>

          {orderError && <div className="alert alert-danger mb-4">{orderError}</div>}

          <div className="row g-5">
            
            {/* Delivery Info Form */}
            <div className="col-lg-7">
              <div className="bg-dark p-4 rounded border border-secondary">
                <h5 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Thông tin giao nhận hàng</h5>
                
                <form id="checkoutForm" onSubmit={handlePlaceOrder}>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-7 text-secondary">Họ và tên người nhận</label>
                      <input 
                        type="text" 
                        className="form-control bg-black border-secondary text-white fs-7" 
                        required 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-7 text-secondary">Số điện thoại</label>
                      <input 
                        type="tel" 
                        className="form-control bg-black border-secondary text-white fs-7" 
                        required 
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0901234567"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-7 text-secondary">Email nhận thông báo</label>
                      <input 
                        type="email" 
                        className="form-control bg-black border-secondary text-white fs-7" 
                        required 
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="example@gmail.com"
                      />
                    </div>
                    <div className="col-md-12 mb-4">
                      <label className="form-label fs-7 text-secondary">Địa chỉ giao hàng chi tiết</label>
                      <textarea 
                        className="form-control bg-black border-secondary text-white fs-7" 
                        rows={3}
                        required 
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      ></textarea>
                    </div>
                  </div>

                  {/* Payment Method Option */}
                  <h5 className="text-white text-uppercase fs-6 mb-3 pb-2 border-bottom border-secondary">Phương thức thanh toán</h5>
                  <div className="d-flex flex-column gap-3 mb-3">
                    <label className="d-flex align-items-center gap-2 p-3 bg-black border border-secondary rounded cursor-pointer">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                      />
                      <div>
                        <span className="fw-bold fs-7 d-block">COD - Thanh toán khi nhận hàng</span>
                        <small className="text-secondary fs-8">Giao hàng tận nơi, kiểm tra hàng rồi thanh toán tiền mặt.</small>
                      </div>
                    </label>

                    <label className="d-flex align-items-center gap-2 p-3 bg-black border border-secondary rounded cursor-pointer">
                      <input 
                        type="radio" 
                        name="payment"
                        checked={paymentMethod === 'MOMO'}
                        onChange={() => setPaymentMethod('MOMO')}
                      />
                      <div>
                        <span className="fw-bold fs-7 d-block">Ví điện tử MoMo (Online)</span>
                        <small className="text-secondary fs-8">Thanh toán nhanh chóng qua ví điện tử MoMo của bạn.</small>
                      </div>
                    </label>

                    <label className="d-flex align-items-center gap-2 p-3 bg-black border border-secondary rounded cursor-pointer">
                      <input 
                        type="radio" 
                        name="payment"
                        checked={paymentMethod === 'PAYPAL'}
                        onChange={() => setPaymentMethod('PAYPAL')}
                      />
                      <div>
                        <span className="fw-bold fs-7 d-block">Thẻ quốc tế PayPal (Online)</span>
                        <small className="text-secondary fs-8">Thanh toán an toàn qua cổng PayPal quốc tế.</small>
                      </div>
                    </label>
                  </div>
                </form>

              </div>
            </div>

            {/* Checkout Invoice summary */}
            <div className="col-lg-5">
              
              {/* Promo Coupon Form */}
              <div className="bg-dark p-4 rounded border border-secondary mb-4">
                <h5 className="text-white text-uppercase fs-6 mb-3 pb-2 border-bottom border-secondary">Áp dụng mã giảm giá</h5>
                {couponError && <div className="alert alert-danger py-2 fs-7">{couponError}</div>}
                {couponSuccess && <div className="alert alert-success py-2 fs-7">{couponSuccess}</div>}
                
                <form onSubmit={handleApplyCoupon} className="d-flex gap-2">
                  <input 
                    type="text" 
                    placeholder="MÃ GIẢM GIÁ" 
                    className="form-control bg-black border-secondary text-white fs-7 uppercase"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm px-4">Áp dụng</button>
                </form>
              </div>

              {/* Order Invoice info */}
              <div className="bg-dark p-4 rounded border border-secondary">
                <h5 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Hóa đơn thanh toán</h5>
                
                {/* List Items */}
                <div className="mb-4 d-flex flex-column gap-3 max-h-300 overflow-y-auto">
                  {cartItems.map((item, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center fs-7">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary">{item.quantity}</span>
                        <span className="text-white text-truncate" style={{ maxWidth: '200px' }}>{item.name}</span>
                      </div>
                      <span className="text-secondary">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <hr className="border-secondary mb-4" />

                <div className="d-flex justify-content-between mb-2 text-secondary fs-7">
                  <span>Tổng tiền sản phẩm:</span>
                  <span className="text-white">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-secondary fs-7">
                    <span>Mã giảm giá (Coupon):</span>
                    <span className="text-danger fw-bold">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                    </span>
                  </div>
                )}

                {rankDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-secondary fs-7">
                    <span>Ưu đãi thành viên ({userRank === 'PLATINUM' ? 'Bạch Kim -5%' : 'Vàng -2%'}):</span>
                    <span className="text-danger fw-bold">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rankDiscount)}
                    </span>
                  </div>
                )}

                <div className="d-flex justify-content-between mb-4 fs-7 text-secondary">
                  <span>Phí vận chuyển:</span>
                  <span className="text-success fw-bold">Miễn phí</span>
                </div>

                <hr className="border-secondary mb-4" />

                <div className="d-flex justify-content-between mb-4 align-items-baseline">
                  <span className="fs-6 fw-bold">Tổng thanh toán:</span>
                  <span className="fs-4 fw-bold text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPayable)}
                  </span>
                </div>

                <button 
                  type="submit" 
                  form="checkoutForm" 
                  className="w-100 btn btn-primary py-3 rounded-pill text-uppercase fw-bold fs-7"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang xử lý đặt hàng...' : 'Đặt hàng ngay'}
                </button>

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
