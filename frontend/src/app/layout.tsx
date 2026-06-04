import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechStore - Siêu thị điện thoại, laptop & phụ kiện công nghệ",
  description: "TechStore cung cấp điện thoại iPhone, Samsung, Xiaomi, MacBook, laptop Dell, ASUS, tai nghe Sony, Apple Watch chính hãng với giá cả cạnh tranh và nhiều ưu đãi hấp dẫn.",
  keywords: "TechStore, điện thoại, laptop, phụ kiện công nghệ, iPhone 16, Samsung S25, MacBook, tai nghe, đồng hồ thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`}>
      <head>
        {/* Resource hints for CDN performance */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://store.storeimages.cdn-apple.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.samsung.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="stylesheet" href="/css/normalize.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/css/vendor.css" />
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body className="min-h-full bg-[#111111] text-[#eeeeee]" data-bs-theme="dark">
        {children}
        
        {/* Bootstrap 5 Bundle JS */}
        <Script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
        
        {/* Swiper JS */}
        <Script 
          src="https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
