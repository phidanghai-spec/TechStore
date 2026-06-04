'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import dynamic from 'next/dynamic';
const ChatWidget = dynamic(() => import('../../components/ChatWidget'), { ssr: false });
import ProductCard from '../../components/ProductCard';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const removeAccents = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

// Fallback Mock Data
const MOCK_PRODUCTS = [
  // Phones
  { id: '1', name: 'iPhone 16 Pro Max 256GB', slug: 'iphone-16-pro-max-256gb', originalPrice: 34990000, salePrice: 33990000, stock: 12, status: 'HOT' as const, imageUrl: 'https://images.unsplash.com/photo-1727371754854-47702de29202?w=800&auto=format&fit=crop&q=80', brand: 'Apple', avgRating: 5, category: { name: 'Điện thoại', slug: 'dien-thoai' }, description: '{"ram":"8 GB","storage":"256 GB"}' },
  { id: '2', name: 'Samsung Galaxy S25 Ultra 512GB', slug: 'samsung-galaxy-s25-ultra-512gb', originalPrice: 34990000, salePrice: 31990000, stock: 0, status: 'HOT' as const, imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80', brand: 'Samsung', avgRating: 4.8, category: { name: 'Điện thoại', slug: 'dien-thoai' }, description: '{"ram":"12 GB","storage":"512 GB"}' },
  { id: '3', name: 'MacBook Pro 16" M4 Pro 24GB/512GB', slug: 'macbook-pro-16-inch-m4-pro-24gb-512gb', originalPrice: 75990000, salePrice: 72990000, stock: 5, status: 'HOT' as const, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80', brand: 'Apple', avgRating: 5, category: { name: 'Laptop', slug: 'laptop' }, description: '{"ram":"24 GB","storage":"512 GB"}' },
  { id: '4', name: 'iPhone 15 Pro Max 256GB', slug: 'iphone-15-pro-max-256gb', originalPrice: 30990000, salePrice: 28990000, stock: 25, status: 'BEST_SELLER' as const, imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', brand: 'Apple', avgRating: 4.9, category: { name: 'Điện thoại', slug: 'dien-thoai' }, description: '{"ram":"8 GB","storage":"256 GB"}' },
  { id: '5', name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', originalPrice: 8490000, salePrice: 7490000, stock: 18, status: 'HOT' as const, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80', brand: 'Sony', avgRating: 4.7, category: { name: 'Tai nghe', slug: 'tai-nghe' }, description: '{}' },
  { id: '6', name: 'Logitech MX Master 3S', slug: 'logitech-mx-master-3s', originalPrice: 2490000, salePrice: 2190000, stock: 45, status: 'BEST_SELLER' as const, imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', brand: 'Logitech', avgRating: 4.9, category: { name: 'Phụ kiện', slug: 'phu-kien' }, description: '{}' }
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters State
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Active Filter state
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [activeBrand, setActiveBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/products/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        setCategories([
          { name: 'Điện thoại', slug: 'dien-thoai' },
          { name: 'Laptop', slug: 'laptop' },
          { name: 'Tai nghe', slug: 'tai-nghe' },
          { name: 'Đồng hồ', slug: 'dong-ho' },
          { name: 'Phụ kiện', slug: 'phu-kien' },
          { name: 'Linh kiện', slug: 'linh-kien' }
        ]);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products based on filters
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const cat = searchParams.get('category') || '';
      const brd = searchParams.get('brand') || '';
      const srch = searchParams.get('search') || '';
      const stat = searchParams.get('status') || '';
      
      if (cat) params.append('category', cat);
      if (brd) params.append('brand', brd);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (ram) params.append('ram', ram);
      if (storage) params.append('storage', storage);
      if (srch) params.append('search', srch);
      if (stat) params.append('status', stat);

      const res = await fetch(`${BACKEND_URL}/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        fallbackFiltering(cat, brd, srch, stat);
      }
    } catch (err) {
      fallbackFiltering();
    } finally {
      setIsLoading(false);
    }
  };

  // Sync state with URL search params and load products when URL updates
  useEffect(() => {
    setActiveCategory(searchParams.get('category') || '');
    setActiveBrand(searchParams.get('brand') || '');
    setSearchVal(searchParams.get('search') || '');
    setStatusFilter(searchParams.get('status') || '');
    
    loadProducts();
  }, [searchParams]);

  // Handle client-side fallback filtering
  const fallbackFiltering = (cat?: string, brd?: string, srch?: string, stat?: string) => {
    let filtered = MOCK_PRODUCTS;

    const finalCat = cat !== undefined ? cat : activeCategory;
    const finalBrd = brd !== undefined ? brd : activeBrand;
    const finalSrch = srch !== undefined ? srch : searchVal;
    const finalStat = stat !== undefined ? stat : statusFilter;

    if (finalCat) {
      filtered = filtered.filter(p => p.category.slug === finalCat);
    }
    if (finalBrd) {
      filtered = filtered.filter(p => p.brand.toLowerCase() === finalBrd.toLowerCase());
    }
    if (finalStat) {
      filtered = filtered.filter(p => p.status === finalStat);
    }
    if (finalSrch) {
      const searchClean = removeAccents(finalSrch.toLowerCase());
      filtered = filtered.filter(p => removeAccents(p.name.toLowerCase()).includes(searchClean));
    }
    if (minPrice) {
      filtered = filtered.filter(p => p.salePrice >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(p => p.salePrice <= parseFloat(maxPrice));
    }

    setProducts(filtered);
  };

  const handleCategoryChange = (val: string) => {
    setActiveCategory(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('category', val);
    else params.delete('category');
    router.push(`/shop?${params.toString()}`);
  };

  const handleBrandChange = (val: string) => {
    setActiveBrand(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('brand', val);
    else params.delete('brand');
    router.push(`/shop?${params.toString()}`);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('status', val);
    else params.delete('status');
    router.push(`/shop?${params.toString()}`);
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleResetFilter = () => {
    setActiveCategory('');
    setActiveBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRam('');
    setStorage('');
    setSearchVal('');
    setStatusFilter('');
    router.push('/shop');
  };

  return (
    <div className="container-fluid px-md-5 py-5 bg-black text-white">
      <div className="row">
        
        {/* Sidebar Filters */}
        <div className="col-lg-3 mb-4">
          <div className="bg-dark p-4 rounded border border-secondary">
            <h5 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Bộ lọc tìm kiếm</h5>
            
            <form onSubmit={handleApplyFilter}>
              {/* Keyword Search */}
              <div className="mb-3">
                <label className="form-label fs-7 text-secondary">Từ khóa</label>
                <input 
                  type="text" 
                  className="form-control bg-black border-secondary text-white fs-7" 
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="iPhone, S25, sạc..."
                />
              </div>

              {/* Category */}
              <div className="mb-3">
                <label className="form-label fs-7 text-secondary">Danh mục</label>
                <select 
                  className="form-select bg-black border-secondary text-white fs-7"
                  value={activeCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat, i) => (
                    <option key={i} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="mb-3">
                <label className="form-label fs-7 text-secondary">Hãng sản xuất</label>
                <select 
                  className="form-select bg-black border-secondary text-white fs-7"
                  value={activeBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                >
                  <option value="">Tất cả hãng</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="OPPO">OPPO</option>
                  <option value="Sony">Sony</option>
                  <option value="Dell">Dell</option>
                  <option value="ASUS">ASUS</option>
                  <option value="Logitech">Logitech</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-3">
                <label className="form-label fs-7 text-secondary">Khoảng giá (VNĐ)</label>
                <div className="d-flex gap-2">
                  <input 
                    type="number" 
                    className="form-control bg-black border-secondary text-white fs-7" 
                    placeholder="Từ" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input 
                    type="number" 
                    className="form-control bg-black border-secondary text-white fs-7" 
                    placeholder="Đến" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* RAM & Storage for Phone/Laptop */}
              {(activeCategory === 'dien-thoai' || activeCategory === 'laptop') && (
                <>
                  <div className="mb-3">
                    <label className="form-label fs-7 text-secondary">Dung lượng RAM</label>
                    <select 
                      className="form-select bg-black border-secondary text-white fs-7"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                    >
                      <option value="">Tất cả RAM</option>
                      <option value="8 GB">8 GB</option>
                      <option value="12 GB">12 GB</option>
                      <option value="16 GB">16 GB</option>
                      <option value="24 GB">24 GB</option>
                      <option value="32 GB">32 GB</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fs-7 text-secondary">Bộ nhớ trong / SSD</label>
                    <select 
                      className="form-select bg-black border-secondary text-white fs-7"
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                    >
                      <option value="">Tất cả bộ nhớ</option>
                      <option value="128 GB">128 GB</option>
                      <option value="256 GB">256 GB</option>
                      <option value="512 GB">512 GB</option>
                      <option value="1 TB">1 TB</option>
                    </select>
                  </div>
                </>
              )}

              {/* Status */}
              <div className="mb-4">
                <label className="form-label fs-7 text-secondary">Phân loại sản phẩm</label>
                <select 
                  className="form-select bg-black border-secondary text-white fs-7"
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="">Mặc định</option>
                  <option value="HOT">Hàng HOT</option>
                  <option value="BEST_SELLER">Bán chạy</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="w-100 btn btn-primary btn-sm py-2">Áp dụng</button>
                <button type="button" onClick={handleResetFilter} className="w-100 btn btn-outline-secondary btn-sm py-2">Xóa lọc</button>
              </div>
            </form>

          </div>
        </div>

        {/* Product Grid */}
        <div className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
            <h4 className="text-white text-uppercase fs-6 m-0">Sản phẩm cửa hàng</h4>
            <span className="text-secondary fs-8">{products.length} sản phẩm được tìm thấy</span>
          </div>

          {isLoading ? (
            <p className="text-center py-5 text-secondary">Đang tải danh sách sản phẩm...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary fs-5 mb-3">Không tìm thấy sản phẩm nào khớp với bộ lọc.</p>
              <button onClick={handleResetFilter} className="btn btn-primary btn-sm">Quay lại cửa hàng</button>
            </div>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 g-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="text-center py-5 text-white">Đang tải cửa hàng TechStore...</div>}>
        <ShopContent />
      </Suspense>
      <ChatWidget />
      <Footer />
    </>
  );
}
