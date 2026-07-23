import { MetadataRoute } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://techstore-backend-l1zs.onrender.com';
const FRONTEND_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    {
      url: FRONTEND_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${FRONTEND_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  try {
    // 1. Fetch categories dynamically
    let categoryUrls: any[] = [];
    try {
      const catRes = await fetch(`${BACKEND_URL}/api/products/categories`);
      if (catRes.ok) {
        const cats = await catRes.json();
        categoryUrls = cats.map((cat: any) => ({
          url: `${FRONTEND_URL}/shop?category=${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch categories for sitemap');
    }

    // 2. Fetch products dynamically
    let productUrls: any[] = [];
    try {
      const prodRes = await fetch(`${BACKEND_URL}/api/products?limit=150`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        productUrls = (data.products || []).map((p: any) => ({
          url: `${FRONTEND_URL}/san-pham/${p.slug}`,
          lastModified: new Date(p.updatedAt || new Date()),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch products for sitemap');
    }
    
    return [...routes, ...categoryUrls, ...productUrls];
  } catch (err) {
    console.warn('Failed to fetch products or categories for sitemap, using static routes only.');
  }

  return routes;
}
