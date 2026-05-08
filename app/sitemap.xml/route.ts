const SITE_URL = 'https://www.northfall.blog';

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/app</loc><changefreq>always</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/games</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/NewPage</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/community/Unity</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/community/Unreal</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/community/Godot</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/community/Blender</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
