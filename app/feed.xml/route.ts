import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SITE_URL = 'https://northfall.blog';

export async function GET() {
  let items = '';
  try {
    const snap = await getDocs(query(collection(db, 'threads'), orderBy('createdAt', 'desc'), limit(50)));
    items = snap.docs.map((d) => {
      const p = d.data();
      const pubDate = p.createdAt ? new Date(p.createdAt).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title><![CDATA[${p.title || ''}]]></title>
      <link>${SITE_URL}/post/${d.id}</link>
      <guid isPermaLink="true">${SITE_URL}/post/${d.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${(p.body || '').slice(0, 300)}]]></description>
      ${p.community ? `<category>${p.community}</category>` : ''}
      ${p.imageUrl ? `<enclosure url="${p.imageUrl}" type="image/jpeg" />` : ''}
    </item>`;
    }).join('\n');
  } catch {
    items = '';
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NorthFall — منصة المجتمعات العربية</title>
    <link>${SITE_URL}</link>
    <description>أحدث المنشورات والنقاشات على NorthFall - منصة المجتمعات العربية للألعاب والتقنية</description>
    <language>ar</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
