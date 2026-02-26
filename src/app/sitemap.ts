import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL ?? 'https://example.com';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 }
  ];
}
