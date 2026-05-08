import type { Metadata } from 'next';

const SITE_URL = 'https://www.northfall.blog';

const communityMeta: Record<string, { title: string; description: string; img: string; keywords: string[]; h1: string; body: string }> = {
  Unity: {
    title: 'مجتمع Unity — تعلم تطوير الألعاب بالعربي',
    description: 'مجتمع Unity العربي الأول على NorthFall — تعلم Unity 3D و Unity 2D و C# و Shader و VR و AR. شارك مشاريعك، تعلم من شروحات Unity بالعربي، وتفاعل مع مطورين عرب. دورات Unity مجانية، نصائح تطوير ألعاب، مشاريع Unity مفتوحة المصدر.',
    img: '/assets/images/unitylogo.png',
    keywords: ['Unity', 'يونيتي', 'تعلم Unity', 'Unity بالعربي', 'Unity 3D', 'Unity 2D', 'Unity C#', 'Unity shader', 'Unity VR', 'Unity AR', 'Unity tutorials arabic', 'دورة Unity', 'محرك Unity', 'Unity game engine', 'Unity developer', 'مطور Unity', 'Unity مشاريع', 'Unity UI', 'Unity mobile', 'Unity animation', 'Unity scripting', 'Unity assets', 'Unity learn', 'تطوير ألعاب Unity', 'Unity عربي'],
    h1: 'مجتمع Unity العربي — تعلم تطوير الألعاب',
    body: 'تعلم Unity بالعربي من الصفر — شروحات Unity 3D و Unity 2D و C# Scripting و Shader Programming و VR/AR Development. انضم لمجتمع مطوري Unity العرب، شارك مشاريعك، احصل على feedback من مطورين محترفين. دروس Unity مجانية، نصائح GameDev، وأحدث أخبار Unity Engine.',
  },
  Unreal: {
    title: 'مجتمع Unreal Engine — تعلم UE5 بالعربي',
    description: 'مجتمع Unreal Engine العربي الأول على NorthFall — تعلم UE5 و Blueprint و C++ و Nanite و Lumen و MetaHuman. شارك مشاريعك، تعلم من شروحات Unreal بالعربي، وتفاعل مع مطورين عرب. دورات Unreal مجانية، نصائح تطوير ألعاب AAA.',
    img: '/assets/images/unreallogo.svg',
    keywords: ['Unreal', 'Unreal Engine', 'UE5', 'UE4', 'أنريل', 'تعلم Unreal', 'Unreal بالعربي', 'Unreal Blueprint', 'Unreal C++', 'Unreal Nanite', 'Unreal Lumen', 'Unreal MetaHuman', 'Unreal tutorials arabic', 'دورة Unreal Engine', 'محرك Unreal', 'Unreal developer', 'مطور Unreal', 'Unreal مشاريع', 'Unreal 3D', 'Unreal VR', 'Unreal shader', 'Unreal visual scripting', 'تطوير ألعاب Unreal', 'Unreal عربي', 'UE5 عربي'],
    h1: 'مجتمع Unreal Engine العربي — تعلم UE5',
    body: 'تعلم Unreal Engine 5 بالعربي — شروحات Blueprint Visual Scripting و C++ Programming و Nanite و Lumen و MetaHuman. انضم لمجتمع مطوري Unreal العرب، شارك مشاريعك AAA، تعلم صناعة ألعاب احترافية. دروس UE5 مجانية، نصائح GameDev، وأحدث أخبار Unreal Engine.',
  },
  Godot: {
    title: 'مجتمع Godot — تعلم تطوير الألعاب المفتوح بالعربي',
    description: 'مجتمع Godot العربي الأول على NorthFall — تعلم Godot 4 و GDScript و 3D و 2D. محرك ألعاب مفتوح المصدر ومجاني 100%. شارك مشاريعك، تعلم من شروحات Godot بالعربي، وتفاعل مع مطورين عرب. دورات Godot مجانية، نصائح indie game dev.',
    img: '/assets/images/godotlogo.png',
    keywords: ['Godot', 'جودوت', 'تعلم Godot', 'Godot بالعربي', 'Godot 4', 'Godot 3D', 'Godot 2D', 'Godot GDScript', 'Godot open source', 'Godot مفتوح المصدر', 'Godot tutorials arabic', 'دورة Godot', 'محرك Godot', 'Godot developer', 'مطور Godot', 'Godot مشاريع', 'Godot indie', 'Godot shader', 'Godot mobile', 'Godot engine', 'تطوير ألعاب Godot', 'Godot عربي', 'Godot مجاني'],
    h1: 'مجتمع Godot العربي — محرك الألعاب المفتوح',
    body: 'تعلم Godot 4 بالعربي — محرك ألعاب مفتوح المصدر ومجاني 100%. شروحات GDScript و 3D و 2D و Shader و Mobile Development. انضم لمجتمع مطوري Godot العرب، شارك مشاريعك المستقلة، تعلم indie game development. دروس Godot مجانية، نصائح GameDev، وأحدث أخبار Godot Engine.',
  },
  Blender: {
    title: 'مجتمع Blender — تعلم النمذجة والأنيميشن بالعربي',
    description: 'مجتمع Blender العربي الأول على NorthFall — تعلم النمذجة 3D والأنيميشن والرندر والنحت باستخدام Blender. برنامج مجاني ومفتوح المصدر. شارك أعمالك الفنية، تعلم من شروحات Blender بالعربي، وتفاعل مع فنانين عرب. دورات Blender مجانية.',
    img: '/assets/images/logoblender.png',
    keywords: ['Blender', 'بلندر', 'تعلم Blender', 'Blender بالعربي', 'Blender 3D', 'Blender modeling', 'Blender نمذجة', 'Blender animation', 'Blender أنيميشن', 'Blender rendering', 'Blender render', 'Blender sculpting', 'Blender نحت', 'Blender shader', 'Blender EEVEE', 'Blender Cycles', 'Blender Geometry Nodes', 'Blender مجاني', 'Blender free', 'Blender tutorials arabic', 'دورة Blender', 'Blender artist', 'فنان Blender', 'Blender game assets', 'Blender عربي'],
    h1: 'مجتمع Blender العربي — تعلم النمذجة والأنيميشن',
    body: 'تعلم Blender بالعربي — شروحات 3D Modeling و Sculpting و Animation و Rendering و Shader Nodes و Geometry Nodes. انضم لمجتمع فناني Blender العرب، شارك أعمالك الفنية، تعلم game art و asset creation. دروس Blender مجانية، نصائح digital art، وأحدث أخبار Blender.',
  },
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
    keywords: meta.keywords,
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
        <div className="w-full max-w-2xl text-center">
          {meta && (
            <div className="mb-6">
              <img src={meta.img} alt={`${name} logo — ${meta.h1}`} className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover" width={80} height={80} />
              <h1 className="text-3xl font-bold text-white mb-2">{meta.h1}</h1>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">{meta.description}</p>
            </div>
          )}

          <a
            href={`/app?community=${name}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
          >
            افتح المجتمع في NorthFall ←
          </a>

          {/* Keyword-rich content for SEO */}
          {meta && (
            <section className="mt-10 text-right text-white/40 text-xs leading-relaxed space-y-3" aria-label="عن المجتمع">
              <p>{meta.body}</p>
              <p>انضم لأكبر مجتمع عربي لمطوري {name} — شروحات بالعربي، مشاريع مفتوحة المصدر، نقاشات تقنية، ونصائح احترافية. سواء كنت مبتدئ أو محترف، NorthFall هو مكانك.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
