import { MetadataRoute } from 'next';

const SITE_URL = 'https://northfall.blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '/', priority: 1.0, changeFreq: 'daily' as const },
    { path: '/app', priority: 0.9, changeFreq: 'always' as const },
    { path: '/app?view=games', priority: 0.8, changeFreq: 'weekly' as const },
    { path: '/app?view=feed', priority: 0.8, changeFreq: 'always' as const },
    { path: '/NewPage', priority: 0.7, changeFreq: 'weekly' as const },
    { path: '/app?community=Unity', priority: 0.7, changeFreq: 'daily' as const },
    { path: '/app?community=Unreal', priority: 0.7, changeFreq: 'daily' as const },
    { path: '/app?community=Godot', priority: 0.7, changeFreq: 'daily' as const },
    { path: '/app?community=Blender', priority: 0.7, changeFreq: 'daily' as const },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
}
