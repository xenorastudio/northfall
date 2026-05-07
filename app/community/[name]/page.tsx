import type { Metadata } from 'next';

const SITE_URL = 'https://northfall.blog';

const communityMeta: Record<string, { title: string; description: string; img: string }> = {
  Unity: { title: 'مجتمع Unity', description: 'انضم لمجتمع Unity على NorthFall - تعلم تطوير الألعاب باستخدام Unity، شارك مشاريعك، وتفاعل مع المطورين العرب', img: '/assets/images/unitylogo.png' },
  Unreal: { title: 'مجتمع Unreal Engine', description: 'انضم لمجتمع Unreal Engine على NorthFall - تعلم تطوير الألعاب باستخدام Unreal، شارك مشاريعك، وتفاعل مع المطورين العرب', img: '/assets/images/unreallogo.svg' },
  Godot: { title: 'مجتمع Godot', description: 'انضم لمجتمع Godot على NorthFall - تعلم تطوير الألعاب باستخدام Godot، شارك مشاريعك، وتفاعل مع المطورين العرب', img: '/assets/images/godotlogo.png' },
  Blender: { title: 'مجتمع Blender', description: 'انضم لمجتمع Blender على NorthFall - تعلم النمذجة والأنيميشن باستخدام Blender، شارك أعمالك، وتفاعل مع الفنانين العرب', img: '/assets/images/logoblender.png' },
};

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const meta = communityMeta[name];

  if (!meta) {
    return { title: 'مجتمع غير موجود', description: 'هذا المجتمع غير موجود على NorthFall' };
  }

  const url = `${SITE_URL}/community/${name}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${meta.title} — NorthFall`,
      description: meta.description,
      url,
      type: 'website',
      images: [{ url: `${SITE_URL}${meta.img}`, width: 200, height: 200 }],
    },
  };
}

export default async function CommunityPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const meta = communityMeta[name];
  const url = `${SITE_URL}/community/${name}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: `n/${name}`, item: url },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: meta?.title || name,
        description: meta?.description || '',
        url,
        isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#1e1e20] text-[#e0e0e0]" style={{ direction: 'rtl' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <div className="w-full max-w-lg text-center">
          {meta && (
            <div className="mb-6">
              <img src={meta.img} alt={name} className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover" />
              <h1 className="text-2xl font-bold text-white">{meta.title}</h1>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">{meta.description}</p>
            </div>
          )}

          <a
            href={`/app?community=${name}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
          >
            افتح المجتمع في NorthFall ←
          </a>
        </div>
      </div>
    </div>
  );
}
