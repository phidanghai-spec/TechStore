import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const FRONTEND_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/account'],
    },
    sitemap: `${FRONTEND_URL}/sitemap.xml`,
  };
}
