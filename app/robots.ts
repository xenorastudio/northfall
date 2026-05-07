import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app?view=profile', '/app?view=settings', '/app?view=notifs', '/app?view=admin', '/app?view=edit'],
      },
    ],
    sitemap: 'https://northfall.blog/sitemap.xml',
  };
}
