'use client';

import Link from 'next/link';
import { useState } from 'react';
import { validateProductImage } from '../utils/image';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    originalPrice: number;
    salePrice: number;
    stock: number;
    status: 'HOT' | 'BEST_SELLER' | 'NORMAL';
    imageUrl: string;
    brand: string;
    avgRating?: number;
    ratingsCount?: number;
    reviewCount?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    name,
    slug,
    originalPrice,
    salePrice,
    stock,
    status,
    imageUrl,
    brand,
    avgRating = 0,
    ratingsCount = 0
  } = product;

  // Calculate discount percentage
  const discountPercent = originalPrice > salePrice 
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) 
    : 0;

  // Calculate mathematically consistent final price based on the percentage
  const discountAmount = Math.round(originalPrice * (discountPercent / 100));
  const finalPrice = discountPercent > 0 ? originalPrice - discountAmount : salePrice;

  // Image fallback state validating if it is a tech device photo
  const initialImage = validateProductImage(imageUrl, product);
  const [imgSrc, setImgSrc] = useState(initialImage);

  const reviewCount = product.reviewCount !== undefined ? product.reviewCount : product.ratingsCount;
  const hasReviews = reviewCount !== undefined && reviewCount !== null && reviewCount > 0;

  // Handle adding to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop navigation to single product page

    if (stock <= 0) return;

    // Get current cart from localStorage
    const storedCart = localStorage.getItem('cart');
    let cartItems = [];
    if (storedCart) {
      try {
        cartItems = JSON.parse(storedCart);
      } catch (err) {
        cartItems = [];
      }
    }

    // Check if product already in cart
    const existingIndex = cartItems.findIndex((item: any) => item.productId === product.id);
    if (existingIndex > -1) {
      cartItems[existingIndex].quantity += 1;
      cartItems[existingIndex].price = finalPrice; // Update to consistent finalPrice
    } else {
      cartItems.push({
        productId: product.id,
        name,
        price: finalPrice, // Save finalPrice
        imageUrl: imgSrc,
        quantity: 1,
        maxStock: stock
      });
    }

    // Save back to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));

    // Notify Header and other components
    window.dispatchEvent(new Event('cart-updated'));

    alert(`Đã thêm "${name}" vào giỏ hàng thành công!`);
  };

  return (
    <div className="col mb-4">
      <div className="product-card position-relative bg-black p-3 border border-secondary rounded d-flex flex-column h-100" style={{ overflow: 'hidden' }}>
        
        {/* Badges / Overlays */}
        <div className="position-absolute top-0 start-0 m-3 z-3 d-flex flex-column gap-1">
          {stock === 0 && (
            status === 'HOT' ? (
              <span className="badge bg-danger text-white fw-bold">CHÁY HÀNG</span>
            ) : (
              <span className="badge bg-secondary text-white fw-bold">HẾT HÀNG</span>
            )
          )}
          {status === 'HOT' && (
            <span className="badge bg-warning text-black fw-bold">HOT</span>
          )}
          {status === 'BEST_SELLER' && (
            <span className="badge bg-success text-white fw-bold">BÁN CHẠY</span>
          )}
          {discountPercent > 0 && (
            <span className="badge bg-danger text-white fw-bold">-{discountPercent}%</span>
          )}
        </div>

        {/* Product Image Link */}
        <div className="image-holder position-relative overflow-hidden rounded bg-dark d-flex align-items-center justify-content-center" style={{ height: '220px' }}>
          <Link href={`/san-pham/${slug}`} className="w-100 h-100 d-flex align-items-center justify-content-center position-relative">
            <img 
              src={imgSrc} 
              alt={name} 
              className="product-image transition-transform duration-300 hover-scale w-100 h-100"
              style={{ objectFit: 'contain', padding: '10px', position: 'absolute', top: 0, left: 0 }}
              onError={() => {
                setImgSrc('https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore');
              }}
            />
          </Link>
        </div>

        {/* Product Info */}
        <div className="product-content mt-3 d-flex flex-column flex-grow-1">
          <div>
            <span className="text-secondary fs-8 uppercase d-block">{brand}</span>
            <h6 className="fs-6 mt-1 mb-2">
              <Link href={`/san-pham/${slug}`} className="text-white text-decoration-none text-hover-primary line-clamp-2">
                {name}
              </Link>
            </h6>
            
            {/* Star ratings */}
            {!hasReviews ? (
              <div className="text-secondary fs-8 mb-2">Chưa có đánh giá</div>
            ) : (
              <div className="stars text-warning fs-8 mb-2 d-flex align-items-center gap-1" aria-label={`Đánh giá ${avgRating} trên 5 sao`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} aria-hidden="true">
                    {i < Math.round(avgRating) ? '★' : '☆'}
                  </span>
                ))}
                <span className="text-secondary ms-1">({avgRating.toFixed(1)}) • {reviewCount} đánh giá</span>
              </div>
            )}
          </div>

          {/* Price list */}
          <div className="d-flex align-items-center gap-2 my-2">
            <span className="fs-6 fw-bold text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}
            </span>
            {originalPrice > salePrice && (
              <span className="fs-8 text-decoration-line-through text-secondary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          <button 
            onClick={handleAddToCart}
            className={`w-100 btn btn-sm btn-add-to-cart rounded mt-auto ${stock <= 0 ? 'btn-secondary disabled' : 'btn-outline-primary'}`}
            disabled={stock <= 0}
          >
            {stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>

      </div>

      <style jsx>{`
        .hover-scale:hover {
          transform: scale(1.05);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
