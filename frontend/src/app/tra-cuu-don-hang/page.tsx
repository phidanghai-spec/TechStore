'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import dynamic from 'next/dynamic';
const ChatWidget = dynamic(() => import('../../components/ChatWidget'), { ssr: false });

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// Ánh xạ trạng thái đơn hàng sang nhãn tiếng Việt và màu sắc hiển thị
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:   { label: '⏳ Chờ duyệt',        color: 'warning' },
  APPROVED:  { label: '✅ Đã duyệt',          color: 'info' },
  SHIPPING:  { label: '🚚 Đang giao hàng',    color: 'primary' },
  DELIVERED: { label: '📦 Đã giao hàng',      color: 'success' },
  CANCELLED: { label: '❌ Đã hủy',            color: 'danger' },
};

/**
 * Trang Tra cứu đơn hàng công khai (Không cần đăng nhập)
 * Khách hàng nhập Mã đơn hoặc Số điện thoại để tìm lịch sử đơn hàng
 */
export default function TraCuuDonHangPage() {
  // Biến lưu từ khóa tìm kiếm (Mã đơn hoặc SĐT)
  const [query, setQuery] = useState('');
  // Danh sách các đơn hàng tìm thấy
  const [orders, setOrders] = useState<any[]>([]);
  // Trạng thái đang tải dữ liệu
  const [loading, setLoading] = useState(false);
  // Trạng thái đã bấm tìm kiếm hay chưa
  const [searched, setSearched] = useState(false);
  // Thông báo lỗi nếu có
  const [error, setError] = useState('');

  /**
   * Xử lý gọi API tra cứu đơn hàng từ backend
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      // Gọi API tra cứu công khai: GET /api/orders/track?query=...
      const res = await fetch(`${BACKEND_URL}/api/orders/track?query=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Lỗi máy chủ');
      const data = await res.json();
      setOrders(data);
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-black text-white py-5 min-vh-75">
        <div className="container-fluid px-md-5">

          {/* Page heading */}
          <div className="mb-5">
            <h1 className="text-uppercase fw-bold mb-2" style={{ fontSize: '1.6rem', letterSpacing: '0.05em' }}>
              🔍 Tra cứu đơn hàng
            </h1>
            <p className="text-secondary fs-7 m-0">
              Nhập mã đơn hàng hoặc số điện thoại để xem trạng thái giao hàng
            </p>
          </div>

          {/* Search box */}
          <div className="row justify-content-center mb-5">
            <div className="col-lg-6">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-lg bg-dark border-secondary text-white"
                    placeholder="Nhập mã đơn hàng hoặc số điện thoại..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ borderRadius: '12px 0 0 12px' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={loading}
                    style={{ borderRadius: '0 12px 12px 0', minWidth: '130px' }}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    ) : '🔍 Tra cứu'}
                  </button>
                </div>
                <small className="text-secondary ms-1" style={{ fontSize: '0.72rem' }}>
                  Ví dụ: <span className="text-primary">0901234567</span> hoặc <span className="text-primary">A1B2C3D4</span> (8 ký tự đầu của mã đơn)
                </small>
              </form>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger text-center mb-4">{error}</div>
          )}

          {/* Results */}
          {searched && !loading && (
            <>
              {orders.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '3rem' }}>📭</div>
                  <p className="text-secondary mt-3 fs-7">
                    Không tìm thấy đơn hàng nào với từ khóa <strong className="text-white">"{query}"</strong>
                  </p>
                  <small className="text-secondary">
                    Hãy kiểm tra lại mã đơn hàng hoặc số điện thoại đã đặt hàng.
                  </small>
                </div>
              ) : (
                <div>
                  <p className="text-secondary fs-7 mb-4">
                    Tìm thấy <strong className="text-white">{orders.length}</strong> đơn hàng
                  </p>
                  <div className="d-flex flex-column gap-4">
                    {orders.map((order) => {
                      const status = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: 'secondary' };
                      return (
                        <div key={order.id} className="bg-dark border border-secondary rounded-3 p-4">
                          {/* Order header */}
                          <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
                            <div>
                              <h5 className="fw-bold text-white mb-1" style={{ fontSize: '1rem' }}>
                                Đơn hàng #{order.id.substring(0, 8).toUpperCase()}
                              </h5>
                              <small className="text-secondary">
                                Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
                              </small>
                            </div>
                            <span className={`badge bg-${status.color} fs-7 px-3 py-2`}>
                              {status.label}
                            </span>
                          </div>

                          {/* Customer info */}
                          <div className="row g-2 mb-3 fs-7">
                            <div className="col-sm-6">
                              <span className="text-secondary">Người nhận: </span>
                              <strong className="text-white">{order.customerName}</strong>
                            </div>
                            <div className="col-sm-6">
                              <span className="text-secondary">SĐT: </span>
                              <strong className="text-white">{order.customerPhone}</strong>
                            </div>
                            <div className="col-12">
                              <span className="text-secondary">Địa chỉ: </span>
                              <span className="text-white">{order.customerAddress}</span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="mb-3">
                            {order.items?.map((item: any, k: number) => (
                              <div key={k} className="d-flex justify-content-between align-items-center fs-7 py-2 border-bottom border-dark">
                                <div className="d-flex align-items-center gap-2">
                                  <img
                                    src={item.product?.imageUrl || 'https://placehold.co/600x600/1a1a1a/ffffff?text=SP'}
                                    width="36" height="36"
                                    className="rounded"
                                    style={{ objectFit: 'contain' }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/1a1a1a/999?text=SP'; }}
                                    alt={item.product?.name}
                                  />
                                  <span className="text-secondary">{item.product?.name}</span>
                                  <span className="badge bg-secondary">x{item.quantity}</span>
                                </div>
                                <span className="text-white fw-bold">{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div className="fs-7 text-secondary">
                              Thanh toán: <strong className="text-white">{order.paymentMethod}</strong>
                              {' '}|{' '}
                              <span className={order.paymentStatus === 'PAID' ? 'text-success fw-bold' : 'text-warning fw-bold'}>
                                {order.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                              </span>
                            </div>
                            <div className="text-end">
                              {order.discountAmount > 0 && (
                                <small className="text-secondary d-block">
                                  Đã giảm: <span className="text-danger">-{formatCurrency(order.discountAmount)}</span>
                                </small>
                              )}
                              <span className="fs-7 text-secondary">Tổng: </span>
                              <strong className="fs-5 text-primary">{formatCurrency(order.totalAmount)}</strong>
                            </div>
                          </div>

                          {/* Cancel reason if cancelled */}
                          {order.orderStatus === 'CANCELLED' && order.cancelReason && (
                            <div className="mt-3 p-2 bg-black rounded border border-danger border-opacity-25">
                              <small className="text-danger">
                                ❌ Lý do hủy: <span className="text-secondary">{order.cancelReason}</span>
                              </small>
                            </div>
                          )}

                          {/* Delivery staff */}
                          {order.deliveryStaff && (
                            <div className="mt-2">
                              <small className="text-secondary">
                                🚚 Nhân viên giao hàng: <span className="text-white">{order.deliveryStaff}</span>
                              </small>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state on first load */}
          {!searched && (
            <div className="text-center py-5 text-secondary">
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📦</div>
              <p className="fs-6">Nhập mã đơn hàng hoặc số điện thoại để bắt đầu tra cứu</p>
            </div>
          )}

        </div>
      </div>
      <ChatWidget />
      <Footer />
    </>
  );
}
