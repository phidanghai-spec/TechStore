'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import dynamic from 'next/dynamic';
const ChatWidget = dynamic(() => import('../../components/ChatWidget'), { ssr: false });

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Load cart from localStorage
  const loadCart = () => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setCartItems(parsedCart);
        calculateTotal(parsedCart);
      } catch (e) {
        setCartItems([]);
      }
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotalPrice(total);
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const updated = cartItems.map(item => {
      if (item.productId === productId) {
        // Cap quantity at maxStock
        const cappedQty = Math.max(1, Math.min(item.maxStock || 99, newQty));
        return { ...item, quantity: cappedQty };
      }
      return item;
    });

    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    calculateTotal(updated);
    window.dispatchEvent(new Event('cart-updated')); // Notify Header
  };

  const handleRemoveItem = (productId: string) => {
    const filtered = cartItems.filter(item => item.productId !== productId);
    setCartItems(filtered);
    localStorage.setItem('cart', JSON.stringify(filtered));
    calculateTotal(filtered);
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <>
      <Header />
      <div className="bg-black text-white py-5 min-vh-75">
        <div className="container-fluid px-md-5">
          <h2 className="text-uppercase mb-4 pb-2 border-bottom border-secondary">Giỏ hàng của bạn</h2>

          {cartItems.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-secondary mb-4">Giỏ hàng của bạn hiện đang trống.</h5>
              <Link href="/shop" className="btn btn-primary px-4 rounded-pill">Tiếp tục mua sắm</Link>
            </div>
          ) : (
            <div className="row g-5">
              {/* Product List Table */}
              <div className="col-lg-8">
                <div className="table-responsive rounded border border-secondary bg-dark">
                  <table className="table table-dark table-striped table-hover m-0 align-middle fs-7">
                    <thead>
                      <tr className="bg-black">
                        <th className="py-3 ps-3" style={{ width: '100px' }}>Ảnh</th>
                        <th className="py-3">Sản phẩm</th>
                        <th className="py-3" style={{ width: '130px' }}>Giá</th>
                        <th className="py-3 text-center" style={{ width: '150px' }}>Số lượng</th>
                        <th className="py-3 text-right" style={{ width: '130px' }}>Tổng</th>
                        <th className="py-3 text-center" style={{ width: '80px' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, i) => (
                        <tr key={i}>
                          {/* Image */}
                          <td className="ps-3 py-3">
                            <div className="bg-black p-1 rounded d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px' }}>
                              <img 
                                src={item.imageUrl || 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore'} 
                                alt={item.name} 
                                className="img-fluid max-h-100" 
                                style={{ objectFit: 'contain' }} 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore';
                                }}
                              />
                            </div>
                          </td>
                          {/* Name */}
                          <td>
                            <strong className="text-white fs-7 d-block">{item.name}</strong>
                            <small className="text-secondary fs-9">Kho còn lại: {item.maxStock}</small>
                          </td>
                          {/* Price */}
                          <td>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                          </td>
                          {/* Quantity Action */}
                          <td className="text-center">
                            <div className="d-inline-flex align-items-center border border-secondary rounded bg-black">
                              <button 
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                className="btn text-white py-1 px-3 border-0 fs-6"
                              >-</button>
                              <span className="px-2 fw-bold">{item.quantity}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                className="btn text-white py-1 px-3 border-0 fs-6"
                              >+</button>
                            </div>
                          </td>
                          {/* Subtotal */}
                          <td className="text-right fw-bold text-primary">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                          </td>
                          {/* Delete */}
                          <td className="text-center">
                            <button 
                              onClick={() => handleRemoveItem(item.productId)}
                              className="btn btn-link text-danger p-0"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary box */}
              <div className="col-lg-4">
                <div className="bg-dark p-4 rounded border border-secondary">
                  <h5 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Tóm tắt đơn hàng</h5>
                  
                  <div className="d-flex justify-content-between mb-3 text-secondary fs-7">
                    <span>Tổng tiền sản phẩm:</span>
                    <span className="text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between mb-4 fs-7">
                    <span>Phí vận chuyển:</span>
                    <span className="text-success fw-bold">Miễn phí</span>
                  </div>

                  <hr className="border-secondary mb-4" />

                  <div className="d-flex justify-content-between mb-4 align-items-baseline">
                    <span className="fs-6 fw-bold">Tổng thanh toán:</span>
                    <span className="fs-4 fw-bold text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                    </span>
                  </div>

                  <Link href="/checkout" className="w-100 btn btn-primary py-3 rounded-pill text-uppercase fw-bold fs-7 mb-2">
                    Tiến hành thanh toán
                  </Link>
                  <Link href="/shop" className="w-100 btn btn-outline-secondary py-2 rounded-pill fs-7">
                    Tiếp tục mua hàng
                  </Link>

                </div>
              </div>

            </div>
          )}

        </div>
      </div>
      <ChatWidget />
      <Footer />
    </>
  );
}
