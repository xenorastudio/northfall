import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://northfall.blog';

export const metadata: Metadata = {
  title: 'الألعاب',
  description: 'اكتشف أحدث الألعاب والمشاريع على NorthFall - تصفح ألعاب من مجتمعات Unity و Unreal و Godot و Blender العربية',
  alternates: { canonical: `${SITE_URL}/games` },
  openGraph: {
    title: 'الألعاب — NorthFall',
    description: 'اكتشف أحدث الألعاب والمشاريع على NorthFall',
    url: `${SITE_URL}/games`,
  },
};

export default function GamesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'ألعاب NorthFall',
        description: 'اكتشف أحدث الألعاب والمشاريع على NorthFall',
        url: `${SITE_URL}/games`,
        isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'الألعاب', item: `${SITE_URL}/games` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'أقسام الألعاب على NorthFall',
        numberOfItems: 4,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ألعاب Unity', url: `${SITE_URL}/community/Unity` },
          { '@type': 'ListItem', position: 2, name: 'ألعاب Unreal Engine', url: `${SITE_URL}/community/Unreal` },
          { '@type': 'ListItem', position: 3, name: 'ألعاب Godot', url: `${SITE_URL}/community/Godot` },
          { '@type': 'ListItem', position: 4, name: 'مشاريع Blender', url: `${SITE_URL}/community/Blender` },
        ],
      },
    ],
  };

  return (
    <article className="min-h-screen bg-[#1e1e20] text-[#e0e0e0]" style={{ direction: 'rtl' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-white mb-4">الألعاب والمشاريع</h1>
        <p className="text-white/50 text-[15px] mb-10">اكتشف أحدث الألعاب والمشاريع من مجتمعات NorthFall</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Unity', emoji: '🎮', desc: 'ألعاب 2D و 3D', path: '/community/Unity' },
            { name: 'Unreal', emoji: '🔥', desc: 'ألعاب AAA', path: '/community/Unreal' },
            { name: 'Godot', emoji: '🚀', desc: 'مفتوح المصدر', path: '/community/Godot' },
            { name: 'Blender', emoji: '🎨', desc: 'نمذجة وأنيميشن', path: '/community/Blender' },
          ].map((c) => (
            <Link key={c.name} href={c.path} className="block bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] transition-colors text-center">
              <div className="text-3xl mb-3">{c.emoji}</div>
              <h2 className="font-bold text-white text-sm">{c.name}</h2>
              <p className="text-white/40 text-xs mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/app?view=games" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors">
            تصفح كل الألعاب ←
          </Link>
        </div>
      </div>
    </article>
  );
}
