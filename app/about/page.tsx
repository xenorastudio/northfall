import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://northfall.blog';

export const metadata: Metadata = {
  title: 'عن NorthFall',
  description: 'تعرف على NorthFall - منصة المجتمعات العربية الأولى للألعاب والتقنية. مهمتنا جمع المطورين والفنانين العرب في مكان واحد.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'عن NorthFall — منصة المجتمعات العربية',
    description: 'تعرف على NorthFall - منصة المجتمعات العربية الأولى للألعاب والتقنية.',
    url: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        name: 'عن NorthFall',
        url: `${SITE_URL}/about`,
        mainEntity: {
          '@type': 'Organization',
          name: 'NorthFall',
          alternateName: 'نورث فول',
          url: SITE_URL,
          logo: `${SITE_URL}/assets/images/logo.png`,
          description: 'منصة المجتمعات العربية الأولى للألعاب والتقنية',
          foundingDate: '2025',
          founder: {
            '@type': 'Organization',
            name: 'Xenora Studio',
            url: 'https://github.com/xenorastudio',
          },
          sameAs: [
            'https://twitter.com/NorthFall_',
            'https://github.com/xenorastudio/northfall',
            'https://discord.gg/northfall',
          ],
          numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 10 },
          knowsAbout: ['Game Development', 'Unity', 'Unreal Engine', 'Godot', 'Blender', 'Arabic Gaming Community'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'عن NorthFall', item: `${SITE_URL}/about` },
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

      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-white mb-6">عن NorthFall</h1>

        <div className="space-y-6 text-white/70 text-[15px] leading-relaxed">
          <p>
            <strong className="text-white">NorthFall</strong> هي منصة المجتمعات العربية الأولى المخصصة للألعاب والتقنية.
            نؤمن إن المجتمع العربي يستحق منصة خاصة تجمع مطوري الألعاب والفنانين واللاعبين في مكان واحد.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10">مهمتنا</h2>
          <p>تمكين المطورين والفنانين العرب من التواصل والتعلم والمشاركة في بيئة عربية داعمة ومحفزة.</p>

          <h2 className="text-2xl font-bold text-white mt-10">المجتمعات</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { name: 'Unity', desc: 'تطوير ألعاب 2D و 3D', path: '/community/Unity' },
              { name: 'Unreal Engine', desc: 'ألعاب AAA ورسوميات متقدمة', path: '/community/Unreal' },
              { name: 'Godot', desc: 'محرك ألعاب مفتوح المصدر', path: '/community/Godot' },
              { name: 'Blender', desc: 'نمذجة وأنيميشن ثلاثية الأبعاد', path: '/community/Blender' },
            ].map((c) => (
              <Link key={c.name} href={c.path} className="block bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] transition-colors">
                <h3 className="font-bold text-white text-sm">{c.name}</h3>
                <p className="text-white/40 text-xs mt-1">{c.desc}</p>
              </Link>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mt-10">الأرقام</h2>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">4+</div>
              <div className="text-white/40 text-xs mt-1">مجتمعات</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">عربي</div>
              <div className="text-white/40 text-xs mt-1">محتوى بالعربي</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">مجاني</div>
              <div className="text-white/40 text-xs mt-1">للجميع</div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors">
            انضم الآن ←
          </Link>
        </div>
      </div>
    </article>
  );
}
