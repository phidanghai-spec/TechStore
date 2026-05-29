import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'TechStore - Điện Thoại & Phụ Kiện Chính Hãng Giá Tốt',
  description: 'TechStore.vn - Hệ thống bán lẻ điện thoại di động, laptop, tai nghe, đồng hồ thông minh và phụ kiện công nghệ chính hãng giá rẻ nhất. Trả góp 0%, giao hàng nhanh 2h.',
  keywords: 'techstore, điện thoại chính hãng, laptop giá rẻ, phụ kiện công nghệ, apple, samsung, xiaomi',
  openGraph: {
    title: 'TechStore - Điện Thoại & Phụ Kiện Chính Hãng Giá Tốt',
    description: 'Hệ thống bán lẻ thiết bị công nghệ chính hãng hàng đầu Việt Nam. Trả góp 0%, giao hàng nhanh 2h.',
    url: 'https://techstore.vercel.app',
    siteName: 'TechStore',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1727371754854-47702de29202?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'TechStore Banner',
      },
    ],
    type: 'website',
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TechStore.vn",
    "url": "https://techstore.vercel.app",
    "logo": "https://techstore.vercel.app/logo.png",
    "description": "TechStore.vn - Hệ thống bán lẻ điện thoại di động, laptop, tai nghe, đồng hồ và phụ kiện công nghệ chính hãng.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+84-123-456-789",
      "contactType": "customer service",
      "areaServed": "VN",
      "availableLanguage": "Vietnamese"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
