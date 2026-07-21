'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  // Trạng thái tìm kiếm tự động gợi ý (Autocomplete)
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Khởi tạo thông tin người dùng và số lượng giỏ hàng khi component mount
  useEffect(() => {
    const checkAuthAndCart = () => {
      // Xác thực thông tin người dùng từ localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      // Đếm tổng số lượng sản phẩm trong giỏ hàng
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        try {
          const cartItems = JSON.parse(storedCart);
          const totalQty = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
          setCartCount(totalQty);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    checkAuthAndCart();

    // Lắng nghe sự thay đổi của bộ nhớ trình duyệt và các sự kiện giỏ hàng / đăng nhập
    window.addEventListener('storage', checkAuthAndCart);
    window.addEventListener('cart-updated', checkAuthAndCart);
    window.addEventListener('user-logged-in', checkAuthAndCart);

    return () => {
      window.removeEventListener('storage', checkAuthAndCart);
      window.removeEventListener('cart-updated', checkAuthAndCart);
      window.removeEventListener('user-logged-in', checkAuthAndCart);
    };
  }, []);

  // Xử lý sự kiện click ra ngoài menu gợi ý để ẩn danh sách tìm kiếm
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Gọi API lấy gợi ý tìm kiếm sản phẩm với độ trễ (debounce) 300ms
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/products/suggestions?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Lỗi khi tải gợi ý tìm kiếm:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('user-logged-in'));
    router.push('/');
  };

  return (
    <>
      {/* SVG Sprites from template for icons */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <defs>
          <symbol id="heart" viewBox="0 0 24 24">
            <path fill="currentColor" d="M20.16 4.61A6.27 6.27 0 0 0 12 4a6.27 6.27 0 0 0-8.16 9.48l7.45 7.45a1 1 0 0 0 1.42 0l7.45-7.45a6.27 6.27 0 0 0 0-8.87Zm-1.41 7.46L12 18.81l-6.75-6.74a4.28 4.28 0 0 1 3-7.3a4.25 4.25 0 0 1 3 1.25a1 1 0 0 0 1.42 0a4.27 4.27 0 0 1 6 6.05Z" />
          </symbol>
          <symbol id="cart" viewBox="0 0 24 24">
            <path fill="currentColor" d="M8.5 19a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8.5 19ZM19 16H7a1 1 0 0 1 0-2h8.491a3.013 3.013 0 0 0 2.885-2.176l1.585-5.55A1 1 0 0 0 19 5H6.74a3.007 3.007 0 0 0-2.82-2H3a1 1 0 0 0 0 2h.921a1.005 1.005 0 0 1 .962.725l.155.545v.005l1.641 5.742A3 3 0 0 0 7 18h12a1 1 0 0 0 0-2Zm-1.326-9l-1.22 4.274a1.005 1.005 0 0 1-.963.726H8.754l-.255-.892L7.326 7ZM16.5 19a1.5 1.5 0 1 0 1.5 1.5a1.5 1.5 0 0 0-1.5-1.5Z" />
          </symbol>
          <symbol id="search" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 7-7a7 7 0 0 1-7 7Z" />
          </symbol>
          <symbol id="user" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.71 12.71a6 6 0 1 0-7.42 0a10 10 0 0 0-6.22 8.18a1 1 0 0 0 2 .22a8 8 0 0 1 15.9 0a1 1 0 0 0 1 .89h.11a1 1 0 0 0 .88-1.1a10 10 0 0 0-6.25-8.19ZM12 12a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" />
          </symbol>
        </defs>
      </svg>

      <nav className="navbar navbar-expand-lg text-white text-uppercase fs-7 ls-1 py-4 align-items-center bg-black border-bottom border-secondary">
        <div className="container-fluid px-md-5">
          <div className="row align-items-center w-100">
            {/* Logo */}
            <div className="col-8 col-md-3">
              <Link className="navbar-brand d-flex align-items-center" href="/">
                <span className="fs-3 fw-bold text-white ls-0">Tech<span className="text-primary">Store</span></span>
              </Link>
            </div>

            {/* Menu */}
            <div className="col-1 col-md-6 d-md-flex justify-content-center">
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"
                aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>

              <div className="collapse navbar-collapse justify-content-center" id="navbarContent">
                <ul className="navbar-nav gap-1 gap-md-4 pe-3">
                  <li className="nav-item">
                    <Link className="nav-link text-white" href="/">Trang chủ</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-white" href="/shop">Cửa hàng</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-white" href="/shop?category=dien-thoai">Điện thoại</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-white" href="/shop?category=laptop">Laptop</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-white" href="/shop?category=phu-kien">Phụ kiện</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-white" href="/shop?category=dong-ho">Đồng hồ</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Icons Search / Cart / User */}
            <div className="col-3 col-md-3 text-md-end">
              <ul className="list-unstyled d-flex justify-content-end align-items-center m-0 gap-3">
                {/* Search Bar Form */}
                <li className="d-none d-lg-block">
                  <form onSubmit={handleSearchSubmit} className="d-flex align-items-center position-relative">
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm..." 
                      aria-label="Tìm kiếm sản phẩm"
                      className="form-control rounded-pill bg-dark border-secondary text-white pe-5 fs-7 py-1 px-3"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                    />
                    <button type="submit" aria-label="Tìm kiếm" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-secondary p-0 pe-3">
                      <svg width="18" height="18"><use xlinkHref="#search"></use></svg>
                    </button>
                    
                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div ref={dropdownRef} className="position-absolute bg-dark border border-secondary rounded shadow-lg w-100 mt-1 z-3" style={{ top: '100%', left: 0, minWidth: '320px' }}>
                        <div className="d-flex flex-column p-2 gap-1">
                          {suggestions.map((item) => (
                            <Link 
                              key={item.id} 
                              href={`/san-pham/${item.slug}`} 
                              onClick={() => setShowSuggestions(false)}
                              className="suggestion-item d-flex align-items-center gap-2 p-2 rounded text-decoration-none text-white border-bottom border-secondary"
                              style={{ transition: 'background 0.2s', borderBottomColor: 'rgba(255,255,255,0.05) !important' }}
                            >
                              <img 
                                src={item.image || 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore'} 
                                width="40" 
                                height="40" 
                                className="rounded" 
                                style={{ objectFit: 'contain' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore';
                                }}
                              />
                              <div className="flex-grow-1 overflow-hidden text-start">
                                <div className="fs-8 fw-bold text-truncate text-white">{item.name}</div>
                                <div className="fs-9 text-primary">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                </div>
                              </div>
                            </Link>
                          ))}
                          <Link 
                            href={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                            onClick={() => setShowSuggestions(false)}
                            className="text-center py-2 fs-8 text-primary fw-bold text-decoration-none hover-underline"
                          >
                            {"Xem tất cả kết quả cho \"" + searchQuery + "\""}
                          </Link>
                        </div>
                      </div>
                    )}
                  </form>
                </li>

                {/* Cart Icon */}
                <li className="position-relative">
                  <Link href="/cart" aria-label="Giỏ hàng" className="mx-1 text-white position-relative">
                    <svg width="24" height="24" viewBox="0 0 24 24"><use xlinkHref="#cart"></use></svg>
                    {cartCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '0.65rem' }}>
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </li>

                {/* User Dropdown */}
                <li>
                  {user ? (
                    <div className="dropdown">
                      <a className="text-white dropdown-toggle d-flex align-items-center gap-1 cursor-pointer" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                        <svg width="24" height="24" viewBox="0 0 24 24"><use xlinkHref="#user"></use></svg>
                        <span className="d-none d-md-inline fs-8 text-lowercase">{user.fullName.split(' ').pop()}</span>
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary" aria-labelledby="userMenu">
                        <li>
                          <Link className="dropdown-item text-white" href="/account">Tài khoản của tôi</Link>
                        </li>
                        {user.role === 'ADMIN' && (
                          <li>
                            <Link className="dropdown-item text-primary fw-bold" href="/admin">Trang quản trị</Link>
                          </li>
                        )}
                        <li><hr className="dropdown-divider border-secondary" /></li>
                        <li>
                          <button onClick={handleLogout} className="dropdown-item text-danger w-100 text-start">Đăng xuất</button>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <Link href="/account" className="mx-1 text-white d-flex align-items-center gap-1" title="Đăng nhập / Đăng ký">
                      <svg width="24" height="24" viewBox="0 0 24 24"><use xlinkHref="#user"></use></svg>
                      <span className="d-none d-md-inline fs-8 text-capitalize" style={{ fontSize: '0.75rem' }}>Đăng nhập</span>
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      <style jsx>{`
        .suggestion-item:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .hover-underline:hover {
          text-decoration: underline !important;
        }
      `}</style>
    </>
  );
}
