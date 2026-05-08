const SITE_URL = 'https://www.northfall.blog';

export async function GET() {
  const txt = `User-agent: *
Allow: /
Disallow: /app?view=profile
Disallow: /app?view=settings
Disallow: /app?view=notifs
Disallow: /app?view=admin
Disallow: /app?view=edit

Sitemap: ${SITE_URL}/sitemap.xml`;

  return new Response(txt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
