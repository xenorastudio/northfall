import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.northfall.blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Main sections — highest priority
  const mainPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/app`, lastModified: now, changeFrequency: 'always', priority: 1.0 },
    { url: `${SITE_URL}/forum`, lastModified: now, changeFrequency: 'always', priority: 0.9 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  // Communities — high priority
  const communities: MetadataRoute.Sitemap = ['Unity', 'Unreal', 'Godot', 'Blender', 'عام'].map(name => ({
    url: `${SITE_URL}/community/${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  // Static/utility pages — medium priority
  const utilityPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/app?view=help`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/app?view=rules`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  return [...mainPages, ...communities, ...utilityPages];
}
