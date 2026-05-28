import { MetadataRoute } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
    {
      url: `${FRONTEND_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${FRONTEND_URL}/account`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  try {
    // Fetch products list for dynamic sitemap url mapping
    const res = await fetch(`${BACKEND_URL}/api/products?limit=100`);
    if (res.ok) {
      const data = await res.json();
      const productUrls = (data.products || []).map((p: any) => ({
        url: `${FRONTEND_URL}/product/${p.slug}`,
        lastModified: new Date(p.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
      
      return [...routes, ...productUrls];
    }
  } catch (err) {
    console.warn('Failed to fetch products for sitemap, using static routes only.');
  }

  return routes;
}
