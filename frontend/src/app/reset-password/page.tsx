'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://techstore-backend-l1zs.onrender.com';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Mã xác thực khôi phục mật khẩu không hợp lệ hoặc đã thiếu.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Thiếu mã token xác thực.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Đặt lại mật khẩu mới thành công!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.push('/account');
        }, 3000);
      } else {
        setError(data.message || 'Không thể khôi phục mật khẩu.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="bg-dark p-4 rounded border border-secondary">
          <h4 className="text-white text-uppercase fs-6 mb-4 text-center">Đặt lại mật khẩu mới</h4>
          
          {error && <div className="alert alert-danger py-2 fs-7">{error}</div>}
          {success && <div className="alert alert-success py-2 fs-7">{success}</div>}

          {!success && token && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fs-7 text-secondary">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-control bg-black border-secondary text-white fs-7" 
                  required 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div className="mb-4">
                <label className="form-label fs-7 text-secondary">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-control bg-black border-secondary text-white fs-7" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <button 
                type="submit" 
                className="w-100 btn btn-primary btn-sm py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </form>
          )}

          {success && (
            <div className="text-center mt-3">
              <p className="fs-8 text-secondary">Hệ thống đang chuyển hướng bạn về trang đăng nhập...</p>
              <a href="/account" className="btn btn-outline-primary btn-sm px-4">Đăng nhập ngay</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <div className="bg-black text-white py-5 min-vh-75 d-flex align-items-center">
        <div className="container-fluid px-md-5">
          <Suspense fallback={<div className="text-center text-white py-5">Đang xác thực thông tin...</div>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}
