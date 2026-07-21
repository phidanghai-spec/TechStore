'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import dynamic from 'next/dynamic';
const ChatWidget = dynamic(() => import('../../components/ChatWidget'), { ssr: false });

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://techstore-backend-l1zs.onrender.com';

export default function AccountPage() {
  const router = useRouter();
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [dob, setDob] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Warranties state
  const [warranties, setWarranties] = useState<any[]>([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(false);

  // Facebook Mock Login state
  const [showFacebookMock, setShowFacebookMock] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  // Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState('');

  // Logged-in Dashboard state
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'loyalty' | 'security' | 'warranties' | 'vouchers'>('profile');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Vouchers state
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal hủy đơn
  const [cancelModal, setCancelModal] = useState<{ orderId: string; open: boolean }>({ orderId: '', open: false });
  const [cancelReason, setCancelReason] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  // Profile update state
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    // Check for query parameters from Facebook OAuth redirect callback
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      const userParam = urlParams.get('user');
      const errorParam = urlParams.get('error');

      if (errorParam) {
        setAuthError(decodeURIComponent(errorParam));
        // Clean up URL
        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      } else if (tokenParam && userParam) {
        try {
          const decodedUser = decodeURIComponent(userParam);
          localStorage.setItem('token', tokenParam);
          localStorage.setItem('user', decodedUser);
          
          const parsed = JSON.parse(decodedUser);
          setUser(parsed);
          setFullName(parsed.fullName);
          setPhone(parsed.phone);
          setAddress(parsed.address);
          setAddress2(parsed.address2 || '');
          setBankAccount(parsed.bankAccount || '');
          setDob(parsed.dob ? parsed.dob.substring(0, 10) : '');
          
          setIsLoggedIn(true);
          setAuthSuccess('Đăng nhập bằng Facebook thành công!');
          window.dispatchEvent(new Event('user-logged-in')); // Notify Header
          
          // Clean up URL
          const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
          window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        } catch (e) {
          console.error('Error handling Facebook redirect parameters:', e);
          setAuthError('Không thể xử lý thông tin đăng nhập từ Facebook.');
        }
      }
    }

    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsLoggedIn(true);
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setFullName(parsed.fullName);
        setPhone(parsed.phone);
        setAddress(parsed.address);
        setAddress2(parsed.address2 || '');
        setBankAccount(parsed.bankAccount || '');
        setDob(parsed.dob ? parsed.dob.substring(0, 10) : '');
      } catch (e) {
        setIsLoggedIn(false);
      }
    }
  }, []);

  // Fetch orders history
  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${BACKEND_URL}/api/orders/my-orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMyOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'orders') {
      fetchMyOrders();
    }
    if (isLoggedIn && activeTab === 'vouchers') {
      fetchMyVouchers();
    }
  }, [isLoggedIn, activeTab]);

  const fetchMyVouchers = async () => {
    setVouchersLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/coupons/my-vouchers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyVouchers(data.vouchers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Lưu riêng phiên admin để có thể chạy song song với phiên khách hàng
        // trên cùng trình duyệt (2 tab) mà không bị ghi đè lẫn nhau
        if (data.user.role === 'ADMIN') {
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('admin_user', JSON.stringify(data.user));
        }
        setUser(data.user);
        
        // Form preset
        setFullName(data.user.fullName);
        setPhone(data.user.phone);
        setAddress(data.user.address);
        setAddress2(data.user.address2 || '');
        setBankAccount(data.user.bankAccount || '');
        setDob(data.user.dob ? data.user.dob.substring(0, 10) : '');

        setIsLoggedIn(true);
        window.dispatchEvent(new Event('user-logged-in')); // Notify Header
        setAuthSuccess('Đăng nhập thành công!');
        setEmail('');
        setPassword('');
      } else {
        setAuthError(data.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      setAuthError('Không thể kết nối đến máy chủ.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    // Frontend validation for age (min 16, max 100) using precise day comparison
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      setAuthError('Bạn phải từ 16 tuổi trở lên để đăng ký');
      return;
    }
    if (age > 100 || birthDate > today) {
      setAuthError('Năm sinh không hợp lệ');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          address,
          dob
        })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'ADMIN') {
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('admin_user', JSON.stringify(data.user));
        }
        setUser(data.user);
        setIsLoggedIn(true);
        window.dispatchEvent(new Event('user-logged-in'));
        setAuthSuccess('Đăng ký tài khoản thành công!');
        setShowRegister(false);
      } else {
        setAuthError(data.message || 'Đăng ký thất bại.');
      }
    } catch (err) {
      setAuthError('Lỗi kết nối máy chủ.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();

      if (res.ok) {
        setAuthSuccess(data.message || 'Một liên kết khôi phục đã được gửi.');
        setForgotEmail('');
        setShowForgot(false);
      } else {
        setAuthError(data.message || 'Không thể thực hiện yêu cầu.');
      }
    } catch (err) {
      setAuthError('Lỗi kết nối.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    // Frontend validation for age (min 16, max 100) using precise day comparison
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      setProfileError('Bạn phải từ 16 tuổi trở lên để cập nhật thông tin cá nhân');
      return;
    }
    if (age > 100 || birthDate > today) {
      setProfileError('Năm sinh không hợp lệ');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      // Backend handles user profile update via the customer route /api/auth/profile
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phone, address, address2, bankAccount, dob })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Update user state
        const updatedUser = data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileSuccess('Cập nhật thông tin tài khoản thành công!');
        window.dispatchEvent(new Event('user-logged-in'));
      } else {
        setProfileError(data.message || 'Lỗi cập nhật thông tin.');
      }
    } catch (err) {
      setProfileError('Không thể lưu thông tin. Lỗi kết nối.');
    }
  };

  // Fetch warranties
  const fetchMyWarranties = async () => {
    setWarrantiesLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/warranties/my-warranties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setWarranties(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWarrantiesLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'warranties') {
      fetchMyWarranties();
    }
  }, [isLoggedIn, activeTab]);

  const handleFacebookMockLogin = async (mockEmail: string) => {
    setFacebookLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockEmail, password: 'Test@123' })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'ADMIN') {
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('admin_user', JSON.stringify(data.user));
        }
        setUser(data.user);
        setFullName(data.user.fullName);
        setPhone(data.user.phone);
        setAddress(data.user.address);
        setAddress2(data.user.address2 || '');
        setBankAccount(data.user.bankAccount || '');
        setDob(data.user.dob ? data.user.dob.substring(0, 10) : '');

        setIsLoggedIn(true);
        window.dispatchEvent(new Event('user-logged-in'));
        setAuthSuccess('Đăng nhập bằng Facebook thành công!');
        setShowFacebookMock(false);
      } else {
        setAuthError(data.message || 'Facebook Login thất bại.');
      }
    } catch (e) {
      setAuthError('Không thể kết nối máy chủ.');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setSecuritySuccess('Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
      } else {
        setSecurityError(data.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err) {
      setSecurityError('Lỗi kết nối.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelModal({ orderId, open: true });
    setCancelReason('');
  };

  const confirmCancelOrder = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/cancel/${cancelModal.orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason || undefined })
      });
      const data = await res.json();
      if (res.ok) {
        setCancelModal({ orderId: '', open: false });
        fetchMyOrders();
      } else {
        alert(data.message || 'Không thể hủy đơn hàng.');
      }
    } catch (err) {
      alert('Lỗi hệ thống khi hủy đơn.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    window.dispatchEvent(new Event('user-logged-in'));
    router.push('/');
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge bg-warning text-black">Chờ duyệt</span>;
      case 'APPROVED': return <span className="badge bg-info text-black">Đã duyệt</span>;
      case 'SHIPPING': return <span className="badge bg-primary">Đang giao</span>;
      case 'DELIVERED': return <span className="badge bg-success">Đã giao thành công</span>;
      case 'CANCELLED': return <span className="badge bg-danger">Đã hủy</span>;
      default: return <span className="badge bg-secondary">Không rõ</span>;
    }
  };

  return (
    <>
      <Header />
      <div className="bg-black text-white py-5 min-vh-75">
        <div className="container-fluid px-md-5">

          {/* ==========================================
              A. GIAO DIỆN CHƯA ĐĂNG NHẬP
             ========================================== */}
          {!isLoggedIn ? (
            <div className="row justify-content-center">
              <div className="col-md-5">
                <div className="bg-dark p-4 rounded border border-secondary">
                  
                  {/* Auth alerts */}
                  {authError && <div className="alert alert-danger py-2 fs-7">{authError}</div>}
                  {authSuccess && <div className="alert alert-success py-2 fs-7">{authSuccess}</div>}

                  {/* 1. FORGOT PASSWORD FORM */}
                  {showForgot ? (
                    <form onSubmit={handleForgotSubmit}>
                      <h4 className="text-white text-uppercase fs-6 mb-4 text-center">Quên mật khẩu</h4>
                      <div className="mb-3">
                        <label className="form-label fs-7 text-secondary">Nhập email đăng ký của bạn</label>
                        <input 
                          type="email" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="example@gmail.com"
                        />
                      </div>
                      <button type="submit" className="w-100 btn btn-primary btn-sm mb-3 py-2">Gửi liên kết khôi phục</button>
                      <button type="button" onClick={() => { setShowForgot(false); setAuthError(''); }} className="w-100 btn btn-outline-secondary btn-sm py-2">Quay lại đăng nhập</button>
                    </form>
                  ) : showRegister ? (
                    
                    /* 2. REGISTER FORM */
                    <form onSubmit={handleRegisterSubmit}>
                      <h4 className="text-white text-uppercase fs-6 mb-4 text-center">Đăng ký tài khoản</h4>
                      <div className="mb-3">
                        <label className="form-label fs-7 text-secondary">Địa chỉ Email</label>
                        <input 
                          type="email" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-7 text-secondary">Mật khẩu</label>
                        <input 
                          type="password" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-7 text-secondary">Họ và tên</label>
                        <input 
                          type="text" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-7 text-secondary">Số điện thoại</label>
                        <input 
                          type="tel" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-7 text-secondary">Địa chỉ nhận hàng</label>
                        <input 
                          type="text" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label fs-7 text-secondary">Ngày sinh</label>
                        <input 
                          type="date" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          max={new Date(new Date().getFullYear() - 16, new Date().getMonth(), new Date().getDate()).toLocaleDateString('sv-SE')}
                          min="1924-01-01"
                        />
                      </div>
                      <button type="submit" className="w-100 btn btn-primary btn-sm mb-3 py-2">Đăng ký</button>
                      <p className="text-secondary fs-8 text-center m-0">
                        Đã có tài khoản?{' '}
                        <button type="button" onClick={() => { setShowRegister(false); setAuthError(''); }} className="btn btn-link p-0 fs-8 text-decoration-none">Đăng nhập</button>
                      </p>
                    </form>
                  ) : (
                    
                    /* 3. LOGIN FORM */
                    <form onSubmit={handleLoginSubmit}>
                      <h4 className="text-white text-uppercase fs-6 mb-4 text-center">Đăng nhập tài khoản</h4>
                      <div className="mb-3">
                        <label className="form-label fs-7 text-secondary">Địa chỉ Email</label>
                        <input 
                          type="email" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@gmail.com"
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <label className="form-label fs-7 text-secondary">Mật khẩu</label>
                          <button type="button" onClick={() => { setShowForgot(true); setAuthError(''); }} className="btn btn-link p-0 fs-8 text-decoration-none text-secondary">Quên mật khẩu?</button>
                        </div>
                        <input 
                          type="password" 
                          className="form-control bg-black border-secondary text-white fs-7" 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="w-100 btn btn-primary btn-sm mb-3 py-2">Đăng nhập</button>
                      
                      <div className="d-flex align-items-center my-3">
                        <hr className="flex-grow-1 border-secondary m-0" />
                        <span className="px-2 text-secondary fs-8">Hoặc</span>
                        <hr className="flex-grow-1 border-secondary m-0" />
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => {
                          setAuthError('');
                          window.location.href = `${BACKEND_URL}/api/auth/facebook`;
                        }} 
                        className="w-100 btn btn-primary btn-sm mb-2 py-2 d-flex align-items-center justify-content-center gap-2" 
                        style={{ backgroundColor: '#1877f2', borderColor: '#1877f2', color: '#fff' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-facebook" viewBox="0 0 16 16">
                          <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
                        </svg>
                        Đăng nhập bằng Facebook
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setShowFacebookMock(true)} 
                        className="w-100 btn btn-outline-secondary btn-sm mb-3 py-2 d-flex align-items-center justify-content-center gap-2 fs-8" 
                        style={{ borderStyle: 'dashed', color: '#8b9dc3' }}
                      >
                        Giả lập Facebook Login (Để chấm bài)
                      </button>

                      <p className="text-secondary fs-8 text-center m-0">
                        Chưa có tài khoản?{' '}
                        <button type="button" onClick={() => { setShowRegister(true); setAuthError(''); }} className="btn btn-link p-0 fs-8 text-decoration-none">Đăng ký ngay</button>
                      </p>
                    </form>
                  )}

                </div>
              </div>
            </div>
          ) : (
            
            /* ==========================================
                B. GIAO DIỆN ĐÃ ĐĂNG NHẬP (PROFILE DASHBOARD)
               ========================================== */
            <div className="row g-4">
              {/* Sidebar Menu */}
              <div className="col-lg-3">
                <div className="bg-dark p-4 rounded border border-secondary">
                  <div className="text-center mb-4 pb-3 border-bottom border-secondary">
                    <div className="bg-primary text-white d-inline-flex justify-content-center align-items-center rounded-circle mb-2" style={{ width: '60px', height: '60px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <h6 className="m-0 text-white fw-bold">{user?.fullName}</h6>
                    <span className="badge bg-secondary fs-9 mt-1 uppercase">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</span>
                  </div>

                  <div className="list-group list-group-flush bg-transparent">
                    <button onClick={() => setActiveTab('profile')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'profile' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                      👤 Thông tin cá nhân
                    </button>
                    {user?.role !== 'ADMIN' && (
                      <>
                        <button onClick={() => setActiveTab('orders')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'orders' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                          📦 Lịch sử mua hàng
                        </button>
                        <button onClick={() => setActiveTab('warranties')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'warranties' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                          🛡 Bảo hành sản phẩm
                        </button>
                        <button onClick={() => setActiveTab('loyalty')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'loyalty' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                          💎 Khách hàng thân thiết
                        </button>
                        <button onClick={() => setActiveTab('vouchers')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'vouchers' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                          🎟️ Voucher của tôi
                        </button>
                      </>
                    )}
                    <button onClick={() => setActiveTab('security')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'security' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                      🔑 Đổi mật khẩu / Bảo mật
                    </button>
                    <button onClick={handleLogout} className="list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 text-danger mt-3">
                      🚪 Đăng xuất
                    </button>
                  </div>

                </div>
              </div>

              {/* Main Content Area */}
              <div className="col-lg-9">
                <div className="bg-dark p-4 rounded border border-secondary h-100">

                  {/* 1. PROFILE TAB */}
                  {activeTab === 'profile' && (
                    <div>
                      <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Thông tin cá nhân của bạn</h4>
                      {profileSuccess && <div className="alert alert-success py-2 fs-7">{profileSuccess}</div>}
                      {profileError && <div className="alert alert-danger py-2 fs-7">{profileError}</div>}
                      
                      <form onSubmit={handleUpdateProfile} className="max-w-600">
                        <div className="mb-3">
                          <label className="form-label fs-7 text-secondary">Địa chỉ Email (Không thể thay đổi)</label>
                          <input type="email" className="form-control bg-black border-secondary text-secondary fs-7" disabled value={user?.email || ''} />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-7 text-secondary">Họ và tên</label>
                          <input type="text" className="form-control bg-black border-secondary text-white fs-7" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-7 text-secondary">Số điện thoại</label>
                          <input type="tel" className="form-control bg-black border-secondary text-white fs-7" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-7 text-secondary">Địa chỉ giao hàng 1 (Chính)</label>
                          <input type="text" className="form-control bg-black border-secondary text-white fs-7" required value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-7 text-secondary">Địa chỉ giao hàng 2 (Phụ)</label>
                          <input type="text" className="form-control bg-black border-secondary text-white fs-7" value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Nhập địa chỉ giao hàng dự phòng..." />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-7 text-secondary">Thông tin tài khoản ngân hàng (Không bắt buộc)</label>
                          <input type="text" className="form-control bg-black border-secondary text-white fs-7" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Ví dụ: MB Bank - 123456789 - NGUYEN VAN A" />
                        </div>
                        <div className="mb-4">
                          <label className="form-label fs-7 text-secondary">Ngày sinh</label>
                          <input 
                            type="date" 
                            className="form-control bg-black border-secondary text-white fs-7" 
                            required 
                            value={dob} 
                            onChange={(e) => setDob(e.target.value)}
                            max={new Date(new Date().getFullYear() - 16, new Date().getMonth(), new Date().getDate()).toLocaleDateString('sv-SE')}
                            min="1924-01-01"
                          />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm px-4 py-2">Lưu thay đổi</button>
                      </form>
                    </div>
                  )}

                  {/* 2. ORDERS TAB */}
                  {activeTab === 'orders' && (
                    <div>
                      <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Lịch sử và theo dõi đơn hàng</h4>
                      
                      {/* Date Filter */}
                      <div className="d-flex flex-wrap gap-2 mb-4 align-items-end">
                        <div>
                          <label className="form-label fs-8 text-secondary m-0 mb-1">Từ ngày</label>
                          <input type="date" className="form-control form-control-sm bg-black border-secondary text-white fs-8" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label fs-8 text-secondary m-0 mb-1">Đến ngày</label>
                          <input type="date" className="form-control form-control-sm bg-black border-secondary text-white fs-8" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <button onClick={fetchMyOrders} className="btn btn-primary btn-sm px-3">Lọc</button>
                      </div>

                      {ordersLoading ? (
                        <p className="text-secondary fs-7 text-center py-5">Đang tải lịch sử đơn hàng...</p>
                      ) : myOrders.length === 0 ? (
                        <p className="text-secondary fs-7 text-center py-5">Bạn chưa thực hiện đơn hàng nào.</p>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {myOrders.map((order, i) => (
                            <div key={i} className="bg-black p-3 rounded border border-secondary">
                              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                                <div>
                                  <strong className="text-white fs-7">Đơn hàng #{order.id.substring(0, 8).toUpperCase()}</strong>
                                  <small className="text-secondary ms-2" style={{ fontSize: '0.7rem' }}>Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</small>
                                </div>
                                {getOrderStatusText(order.orderStatus)}
                              </div>

                              {/* Order items list */}
                              <div className="mb-3">
                                {order.items.map((item: any, k: number) => (
                                  <div key={k} className="d-flex justify-content-between align-items-center fs-7 border-bottom border-dark py-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <img 
                                        src={item.product?.imageUrl || 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore'} 
                                        width="40" 
                                        height="40" 
                                        className="rounded" 
                                        style={{ objectFit: 'contain' }} 
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore';
                                        }}
                                      />
                                      <span className="text-secondary">{item.product?.name}</span>
                                      <span className="text-secondary fs-8">x{item.quantity}</span>
                                    </div>
                                    <span className="text-white fw-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="d-flex justify-content-between align-items-center">
                                <div className="fs-7 text-secondary">
                                  <div>Giao tới: <span className="text-white">{order.customerAddress}</span></div>
                                  <div className="mt-1">
                                    Thanh toán: <strong className="text-white">{order.paymentMethod}</strong> |{' '}
                                    <span className={order.paymentStatus === 'PAID' ? 'text-success fw-bold' : 'text-warning fw-bold'}>
                                      {order.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                    </span>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="text-end">
                                    {order.discountAmount > 0 && (
                                      <small className="text-secondary d-block">
                                        Đã giảm: <span className="text-danger fw-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discountAmount)}</span>
                                      </small>
                                    )}
                                    <span className="fs-8 text-secondary d-block">Tổng thanh toán:</span>
                                    <strong className="fs-6 text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</strong>
                                  </div>
                                  {order.orderStatus === 'PENDING' && (
                                    <button 
                                      onClick={() => handleCancelOrder(order.id)}
                                      className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                    >
                                      Hủy đơn
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Hiển thị lý do hủy nếu bị hủy */}
                              {order.orderStatus === 'CANCELLED' && order.cancelReason && (
                                <div className="mt-2 p-2 bg-black rounded border border-danger border-opacity-25">
                                  <small className="text-danger">❌ Lý do hủy: <span className="text-secondary">{order.cancelReason}</span></small>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. LOYALTY MEMBER TAB */}
                  {activeTab === 'loyalty' && (
                    <div>
                      <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Chương trình Khách hàng thân thiết TechStore</h4>
                      
                      <div className="row g-4 mb-4">
                        {/* Membership Card */}
                        <div className="col-md-6">
                          <div className="p-4 rounded-3 text-white d-flex flex-column justify-content-between" style={{
                            height: '200px',
                            background: user?.rank === 'PLATINUM' 
                              ? 'linear-gradient(135deg, #757f9a, #d7dde8)' 
                              : user?.rank === 'GOLD' 
                                ? 'linear-gradient(135deg, #f21b3f, #ff9900)' 
                                : 'linear-gradient(135deg, #3a6073, #3a7bd5)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                          }}>
                            <div>
                              <span className="fs-7 text-uppercase fw-bold opacity-75">THÀNH VIÊN TechStore</span>
                              <h4 className="fw-bold mt-1 text-black shadow-text">{user?.fullName?.toUpperCase()}</h4>
                            </div>
                            <div className="d-flex justify-content-between align-items-end">
                              <div>
                                <span className="fs-9 opacity-75">DOANH SỐ MUA TÍCH LŨY</span>
                                <h3 className="fw-bold m-0 text-black shadow-text">
                                  {new Intl.NumberFormat('vi-VN').format((user?.loyaltyPoints || 0) * 100000)}đ
                                </h3>
                              </div>
                              <span className="fs-5 fw-bold text-black border border-black px-3 py-1 rounded bg-white shadow-sm">
                                HẠNG {user?.rank === 'PLATINUM' ? 'BẠCH KIM' : user?.rank === 'GOLD' ? 'VÀNG' : 'BẠC'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Point explanation */}
                        <div className="col-md-6">
                          <div className="bg-black p-4 rounded border border-secondary h-100">
                            <h6 className="text-primary mb-2">Quy định phân hạng thành viên:</h6>
                            <ul className="fs-7 text-secondary ps-3 m-0">
                              <li className="mb-1"><strong>Tích lũy doanh số:</strong> Tự động cộng dồn giá trị tất cả đơn hàng đã giao dịch thành công.</li>
                              <li className="mb-1"><strong>Hạng Bạc:</strong> Tổng chi tiêu tích lũy dưới 50.000.000đ.</li>
                              <li className="mb-1"><strong>Hạng Vàng:</strong> Từ 50.000.000đ đến dưới 100.000.000đ (Chiết khấu trực tiếp 2% trên mỗi đơn hàng).</li>
                              <li className="mb-1"><strong>Hạng Bạch Kim:</strong> Từ 1000 điểm tương đương 100.000.000đ trở lên (Chiết khấu trực tiếp 5% trên mỗi đơn hàng).</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* 4. SECURITY TAB */}
                  {activeTab === 'security' && (
                    <div>
                      <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Đổi mật khẩu tài khoản</h4>
                      {securitySuccess && <div className="alert alert-success py-2 fs-7">{securitySuccess}</div>}
                      {securityError && <div className="alert alert-danger py-2 fs-7">{securityError}</div>}
                      
                      <form onSubmit={handleChangePassword} className="max-w-600">
                        <div className="mb-3">
                          <label className="form-label fs-7 text-secondary">Mật khẩu hiện tại</label>
                          <input type="password" className="form-control bg-black border-secondary text-white fs-7" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                        </div>
                        <div className="mb-4">
                          <label className="form-label fs-7 text-secondary">Mật khẩu mới</label>
                          <input type="password" className="form-control bg-black border-secondary text-white fs-7" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm px-4 py-2">Cập nhật mật khẩu</button>
                      </form>
                    </div>
                  )}

                  {/* 5. WARRANTIES TAB */}
                  {activeTab === 'warranties' && (
                    <div>
                      <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Thông tin bảo hành sản phẩm đã mua</h4>
                      {warrantiesLoading ? (
                        <p className="text-secondary fs-7 text-center py-5">Đang tải thông tin bảo hành...</p>
                      ) : warranties.length === 0 ? (
                        <p className="text-secondary fs-7 text-center py-5">Bạn chưa có sản phẩm nào được kích hoạt bảo hành.</p>
                      ) : (
                        <div className="table-responsive rounded border border-secondary bg-black">
                          <table className="table table-dark table-striped align-middle fs-7 m-0">
                            <thead>
                              <tr>
                                <th className="ps-3">Sản phẩm</th>
                                <th>Mã bảo hành</th>
                                <th>Thời hạn bảo hành</th>
                                <th>Trạng thái</th>
                                <th>Ghi chú sửa chữa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {warranties.map((w, i) => (
                                <tr key={i}>
                                  <td className="ps-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <img 
                                        src={w.product?.imageUrl || 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore'} 
                                        width="35" 
                                        height="35" 
                                        className="rounded" 
                                        style={{ objectFit: 'contain' }} 
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore';
                                        }}
                                      />
                                      <span className="text-white fw-bold">{w.product?.name}</span>
                                    </div>
                                  </td>
                                  <td className="fw-bold text-primary">{w.warrantyCode}</td>
                                  <td>
                                    <small className="d-block text-secondary">Kích hoạt: {new Date(w.startDate).toLocaleDateString('vi-VN')}</small>
                                    <small className="d-block text-danger fw-bold">Hết hạn: {new Date(w.endDate).toLocaleDateString('vi-VN')}</small>
                                  </td>
                                  <td>
                                    {w.status === 'ACTIVE' && <span className="badge bg-success">Đang hiệu lực</span>}
                                    {w.status === 'EXPIRED' && <span className="badge bg-danger">Hết hạn</span>}
                                    {w.status === 'CLAIMED' && <span className="badge bg-warning text-black">Đang bảo hành</span>}
                                  </td>
                                  <td>{w.notes || 'Không có ghi chú.'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. VOUCHERS TAB */}
                  {activeTab === 'vouchers' && (
                    <div>
                      <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary d-flex align-items-center gap-2">
                        🎟️ VOUCHER DÀNH RIÊNG CHO BẠN
                      </h4>
                      <p className="fs-7 text-secondary mb-4">
                        Hạng tài khoản hiện tại: <strong className="text-warning text-uppercase">{user?.rank || 'SILVER'}</strong>. Các mã giảm giá đặc quyền sẽ tự động được mở khóa theo cấp bậc của bạn!
                      </p>

                      {vouchersLoading ? (
                        <div className="text-center text-secondary py-5 fs-7">Đang tải danh sách voucher...</div>
                      ) : myVouchers.length === 0 ? (
                        <div className="text-center text-secondary py-5 fs-7 bg-black rounded border border-secondary">
                          Hiện tại chưa có voucher nào khả dụng cho tài khoản của bạn.
                        </div>
                      ) : (
                        <div className="row g-3">
                          {myVouchers.map((v: any, i: number) => {
                            const isExclusive = v.targetRank && v.targetRank !== 'ALL';
                            const rankBadge = v.targetRank === 'GOLD' ? 'Đặc quyền Vàng' : v.targetRank === 'PLATINUM' ? 'Đặc quyền Bạch Kim' : 'Đặc quyền Bạc';
                            return (
                              <div key={i} className="col-md-6">
                                <div className="p-3 bg-black rounded border border-secondary h-100 d-flex flex-column justify-content-between">
                                  <div>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <span className="fs-6 fw-bold text-white tracking-wider">{v.code}</span>
                                      {isExclusive ? (
                                        <span className="badge bg-warning text-dark fs-8">{rankBadge}</span>
                                      ) : (
                                        <span className="badge bg-secondary fs-8">Tất cả thành viên</span>
                                      )}
                                    </div>
                                    <div className="text-primary fw-bold fs-6 mb-2">
                                      {v.discountType === 'PERCENTAGE' ? `Giảm ${v.discountValue}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(v.discountValue)}đ`}
                                    </div>
                                    <div className="fs-8 text-secondary mb-3">
                                      <div>• Đơn tối thiểu: <span className="text-white">{v.minOrderAmount > 0 ? `${new Intl.NumberFormat('vi-VN').format(v.minOrderAmount)}đ` : 'Không có'}</span></div>
                                      <div>• Hạn sử dụng: <span className="text-white">{new Date(v.expiryDate).toLocaleDateString('vi-VN')}</span></div>
                                    </div>
                                  </div>
                                  <div className="d-flex justify-content-end pt-2 border-top border-secondary">
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(v.code);
                                        setCopiedCode(v.code);
                                        setTimeout(() => setCopiedCode(null), 2000);
                                      }} 
                                      className="btn btn-outline-primary btn-sm fs-8 px-3"
                                    >
                                      {copiedCode === v.code ? '✓ Đã sao chép' : 'Sao chép mã'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Facebook Mock Login Modal */}
      {showFacebookMock && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex justify-content-center align-items-center z-3">
          <div className="bg-dark p-4 rounded-3 border border-secondary text-center" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="mb-3 text-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#1877f2" className="bi bi-facebook" viewBox="0 0 16 16">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
              </svg>
            </div>
            <h5 className="text-white mb-2">Đăng nhập Facebook</h5>
            <p className="fs-8 text-secondary mb-3">Mô phỏng tích hợp SDK Đăng nhập một chạm của Facebook.</p>
            
            <div className="alert alert-info py-2 px-3 fs-8 text-start mb-3" style={{ backgroundColor: 'rgba(13,110,253,0.1)', borderColor: 'rgba(13,110,253,0.3)', color: '#9ec5fe' }}>
              💡 <strong>Lưu ý chấm bài/demo:</strong> <br />
              Tính năng này giả lập SDK Facebook để đăng nhập trực tiếp vào các tài khoản có sẵn nhằm kiểm thử tính năng **Tích lũy điểm** & **Giảm giá theo Hạng thành viên** (Bạc / Vàng / Bạch Kim) một cách thuận tiện nhất.
            </div>
            
            {facebookLoading ? (
              <div className="spinner-border text-info my-3" role="status"></div>
            ) : (
              <div className="d-flex flex-column gap-2 mb-3">
                <button onClick={() => handleFacebookMockLogin('platinum@test.vn')} className="btn btn-outline-light btn-sm text-start py-2 px-3">
                  👤 Tiếp tục dưới tên <strong>Khách hàng Platinum</strong>
                </button>
                <button onClick={() => handleFacebookMockLogin('gold@test.vn')} className="btn btn-outline-light btn-sm text-start py-2 px-3">
                  👤 Tiếp tục dưới tên <strong>Khách hàng Gold</strong>
                </button>
              </div>
            )}
            
            <button onClick={() => setShowFacebookMock(false)} className="btn btn-secondary btn-xs mt-3">Đóng</button>
          </div>
        </div>
      )}

      <ChatWidget />
      
      {/* Modal hủy đơn hàng */}
      {cancelModal.open && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border border-secondary text-white">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">❌ Hủy đơn hàng</h5>
                <button onClick={() => setCancelModal({ orderId: '', open: false })} className="btn-close btn-close-white" />
              </div>
              <div className="modal-body">
                <p className="text-secondary fs-7 mb-3">
                  Vui lòng cho biết lý do bạn muốn hủy đơn hàng này (tuỳ chọn):
                </p>
                <select
                  className="form-select bg-black border-secondary text-white mb-3 fs-7"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Tôi muốn thay đổi địa chỉ giao hàng">Muốn thay đổi địa chỉ giao hàng</option>
                  <option value="Tôi muốn thay đổi sản phẩm">Muốn thay đổi sản phẩm</option>
                  <option value="Tôi đặt nhầm sản phẩm">Đặt nhầm sản phẩm</option>
                  <option value="Tìm được nơi mua rẻ hơn">Tìm được nơi mua rẻ hơn</option>
                  <option value="Không còn nhu cầu mua">Không còn nhu cầu mua</option>
                  <option value="Khác">Khác (nhập bên dưới)</option>
                </select>
                {cancelReason === 'Khác' && (
                  <input
                    type="text"
                    className="form-control bg-black border-secondary text-white fs-7"
                    placeholder="Nhập lý do của bạn..."
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button onClick={() => setCancelModal({ orderId: '', open: false })} className="btn btn-secondary btn-sm">
                  Quay lại
                </button>
                <button onClick={confirmCancelOrder} className="btn btn-danger btn-sm px-4">
                  Xác nhận hủy đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />

      <style jsx>{`
        .max-w-600 {
          max-width: 600px;
        }
        .max-h-300 {
          max-height: 300px;
        }
        .shadow-text {
          text-shadow: 0 1px 1px rgba(255,255,255,0.3);
        }
      `}</style>
    </>
  );
}
