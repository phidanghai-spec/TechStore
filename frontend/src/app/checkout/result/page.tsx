'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://techstore-backend-l1zs.onrender.com';

function CheckoutResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const momoOrderId = searchParams.get('orderId') || '';
    const pendingOrderId = localStorage.getItem('pendingOrderId') || '';

    // Kiểm tra từ MoMo redirect
    if (resultCode !== null) {
      if (resultCode === '0') {
        setStatus('success');
        setOrderId(pendingOrderId || momoOrderId);
        setMessage('Thanh toán MoMo thành công! Đơn hàng của bạn đang được xử lý.');
        localStorage.removeItem('pendingOrderId');
      } else {
        setStatus('failed');
        setMessage('Thanh toán MoMo thất bại hoặc đã bị hủy. Đơn hàng vẫn được ghi nhận — bạn có thể thanh toán COD khi nhận hàng.');
        setOrderId(pendingOrderId || momoOrderId);
        localStorage.removeItem('pendingOrderId');
      }
    } else {
      // Không có params → redirect về trang chủ
      router.push('/');
    }
  }, [searchParams]);

  return (
    <>
      <Header />
      <div className="bg-black text-white min-vh-100 d-flex align-items-center justify-content-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="bg-dark p-5 rounded-3 border border-secondary text-center">

                {status === 'loading' && (
                  <>
                    <div className="spinner-border text-primary mb-4" style={{ width: '3rem', height: '3rem' }} />
                    <h4 className="text-white">Đang xác nhận thanh toán...</h4>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div className="text-success mb-4" style={{ fontSize: '4rem' }}>✅</div>
                    <h3 className="text-white fw-bold mb-2">Thanh toán thành công!</h3>
                    {orderId && (
                      <p className="text-secondary mb-3">
                        Mã đơn hàng: <strong className="text-primary">#{orderId.substring(0, 8).toUpperCase()}</strong>
                      </p>
                    )}
                    <p className="text-secondary fs-7 mb-4">{message}</p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                      <Link href="/account" className="btn btn-primary rounded-pill px-4">
                        Xem đơn hàng của tôi
                      </Link>
                      <Link href="/" className="btn btn-outline-secondary rounded-pill px-4">
                        Về trang chủ
                      </Link>
                    </div>
                  </>
                )}

                {status === 'failed' && (
                  <>
                    <div className="text-warning mb-4" style={{ fontSize: '4rem' }}>⚠️</div>
                    <h3 className="text-white fw-bold mb-2">Thanh toán không thành công</h3>
                    {orderId && (
                      <p className="text-secondary mb-3">
                        Mã đơn hàng: <strong className="text-primary">#{orderId.substring(0, 8).toUpperCase()}</strong>
                      </p>
                    )}
                    <p className="text-secondary fs-7 mb-4">{message}</p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                      <Link href="/account" className="btn btn-warning text-dark rounded-pill px-4">
                        Xem đơn hàng
                      </Link>
                      <Link href="/" className="btn btn-outline-secondary rounded-pill px-4">
                        Về trang chủ
                      </Link>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={
      <div className="bg-black min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" />
      </div>
    }>
      <CheckoutResultContent />
    </Suspense>
  );
}
