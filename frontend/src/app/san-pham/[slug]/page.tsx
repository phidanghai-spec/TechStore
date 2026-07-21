import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://techstore-backend-l1zs.onrender.com';

const MOCK_PRODUCTS = [
  { id: '1', name: 'iPhone 16 Pro Max 256GB', slug: 'iphone-16-pro-max-256gb', originalPrice: 34990000, salePrice: 33990000, stock: 12, status: 'HOT', imageUrl: 'https://images.unsplash.com/photo-1727371754854-47702de29202?w=800&auto=format&fit=crop&q=80', brand: 'Apple', avgRating: 5, ratingsCount: 28, category: { name: 'Điện thoại', slug: 'dien-thoai' }, description: '{"ram":"8 GB","storage":"256 GB","detail":"iPhone 16 Pro Max thiết kế titan sa mạc cực chất."}', reviews: [], qnas: [] },
  { id: '2', name: 'Samsung Galaxy S25 Ultra 512GB', slug: 'samsung-galaxy-s25-ultra-512gb', originalPrice: 34990000, salePrice: 31990000, stock: 0, status: 'HOT', imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80', brand: 'Samsung', avgRating: 4.8, ratingsCount: 42, category: { name: 'Điện thoại', slug: 'dien-thoai' }, description: '{"ram":"12 GB","storage":"512 GB","detail":"Samsung Galaxy S25 Ultra màn hình siêu phẳng."}', reviews: [], qnas: [] },
  { id: '3', name: 'MacBook Pro 16" M4 Pro 24GB/512GB', slug: 'macbook-pro-16-inch-m4-pro-24gb-512gb', originalPrice: 75990000, salePrice: 72990000, stock: 5, status: 'HOT', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80', brand: 'Apple', avgRating: 5, ratingsCount: 15, category: { name: 'Laptop', slug: 'laptop' }, description: '{"ram":"24 GB","storage":"512 GB","detail":"MacBook Pro M4 Pro xử lý mượt mà tác vụ nặng."}', reviews: [], qnas: [] },
  { id: '4', name: 'iPhone 15 Pro Max 256GB', slug: 'iphone-15-pro-max-256gb', originalPrice: 30990000, salePrice: 28990000, stock: 25, status: 'BEST_SELLER', imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', brand: 'Apple', avgRating: 4.9, ratingsCount: 120, category: { name: 'Điện thoại', slug: 'dien-thoai' }, description: '{"ram":"8 GB","storage":"256 GB","detail":"iPhone 15 Pro Max thời trang và mạnh mẽ."}', reviews: [], qnas: [] },
  { id: '5', name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', originalPrice: 8490000, salePrice: 7490000, stock: 18, status: 'HOT', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80', brand: 'Sony', avgRating: 4.7, ratingsCount: 56, category: { name: 'Tai nghe', slug: 'tai-nghe' }, description: '{"detail":"Tai nghe chống ồn Sony WH-1000XM5 đỉnh cao."}', reviews: [], qnas: [] },
  { id: '6', name: 'Logitech MX Master 3S', slug: 'logitech-mx-master-3s', originalPrice: 2490000, salePrice: 2190000, stock: 45, status: 'BEST_SELLER', imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', brand: 'Logitech', avgRating: 4.9, ratingsCount: 88, category: { name: 'Phụ kiện', slug: 'phu-kien' }, description: '{"detail":"Chuột công thái học cao cấp Logitech MX Master 3S."}', reviews: [], qnas: [] }
];

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching product at server:', err);
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const product = await getProduct(slug) || MOCK_PRODUCTS.find(p => p.slug === slug);

  if (!product) {
    return {
      title: 'Sản Phẩm Không Tồn Tại | TechStore',
      description: 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.'
    };
  }

  const title = `${product.name} | Giá rẻ, chính hãng tại TechStore.vn`;
  let specsDetail = '';
  try {
    const parsed = JSON.parse(product.description);
    specsDetail = parsed.detail || product.description;
  } catch (e) {
    specsDetail = product.description;
  }
  const description = `Mua ${product.name} chính hãng ${product.brand} giá cực tốt tại TechStore.vn. Giá bán: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}. Trả góp 0%, hỗ trợ giao hàng nhanh 2h.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://techstore.vercel.app/san-pham/${slug}`,
      siteName: 'TechStore',
      images: [
        {
          url: product.imageUrl || 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore',
          width: 800,
          height: 800,
          alt: product.name,
        }
      ],
      type: 'article',
    }
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const product = await getProduct(slug) || MOCK_PRODUCTS.find(p => p.slug === slug);

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

  // 1. Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": "https://techstore.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product.category?.name || "Danh mục",
        "item": `https://techstore.vercel.app/shop?category=${product.category?.slug || "all"}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://techstore.vercel.app/san-pham/${product.slug}`
      }
    ]
  };

  // 2. Product Schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl || "https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore",
    "description": product.name + " chính hãng hãng " + product.brand,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "url": `https://techstore.vercel.app/san-pham/${product.slug}`,
      "priceCurrency": "VND",
      "price": product.salePrice,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "aggregateRating": product.ratingsCount ? {
      "@type": "AggregateRating",
      "ratingValue": product.avgRating || 5,
      "reviewCount": product.ratingsCount
    } : undefined
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
