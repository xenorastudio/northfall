import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.northfall.blog';

const COMMUNITIES = ['Unity', 'Unreal', 'Godot', 'Blender'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Main sections — highest priority
  const mainPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/app`, lastModified: now, changeFrequency: 'always', priority: 1.0 },
    { url: `${SITE_URL}/forum`, lastModified: now, changeFrequency: 'always', priority: 0.9 },
  ];

  // Communities — high priority
  const communities: MetadataRoute.Sitemap = COMMUNITIES.map(name => ({
    url: `${SITE_URL}/community/${name}`,
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
