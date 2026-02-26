import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_BASE_URL ?? 'https://example.com';
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/pricing', '/how-it-works', '/auth/login'], disallow: ['/app/', '/api/'] }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
