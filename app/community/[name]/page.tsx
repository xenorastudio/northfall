import type { Metadata } from 'next';

const SITE_URL = 'https://www.northfall.blog';

const communityMeta: Record<string, { title: string; description: string; img: string; keywords: string[]; h1: string; body: string }> = {
  Unity: {
    title: 'مجتمع Unity — تعلم تطوير الألعاب بالعربي',
    description: 'تبي تتعلم Unity؟ هذا مكانك. هنا نتناقش عن Unity 3D و 2D و C# وكل شي يخص المحرك. نشارك مشاريعنا ونساعد بعض من الصفر لحد الاحتراف.',
    img: '/assets/images/unitylogo.png',
    keywords: ['Unity', 'يونيتي', 'تعلم Unity', 'Unity بالعربي', 'Unity 3D', 'Unity 2D', 'Unity C#', 'Unity shader', 'Unity VR', 'Unity AR', 'Unity tutorials arabic', 'دورة Unity', 'محرك Unity', 'Unity game engine', 'Unity developer', 'مطور Unity', 'Unity مشاريع', 'Unity UI', 'Unity mobile', 'Unity animation', 'Unity scripting', 'Unity assets', 'Unity learn', 'تطوير ألعاب Unity', 'Unity عربي'],
    h1: 'مجتمع Unity العربي',
    body: 'سواء تبي تسوي لعبتك الأولى أو عندك خبرة وتبغى تشارك — هنا تلقى ناس مثلك. شروحات Unity بالعربي، مشاريع مفتوحة المصدر، نصائح من مطورين مجربين. من C# لحد Shader Programming و VR/AR، كل شي موجود.',
  },
  Unreal: {
    title: 'مجتمع Unreal Engine — تعلم UE5 بالعربي',
    description: 'كل شي يخص Unreal Engine و UE5 هني. Blueprint و C++ و Nanite و Lumen — نتناقش ونساعد بعض. مكان محترفين ومبتدئين مع بعض.',
    img: '/assets/images/unreallogo.svg',
    keywords: ['Unreal', 'Unreal Engine', 'UE5', 'UE4', 'أنريل', 'تعلم Unreal', 'Unreal بالعربي', 'Unreal Blueprint', 'Unreal C++', 'Unreal Nanite', 'Unreal Lumen', 'Unreal MetaHuman', 'Unreal tutorials arabic', 'دورة Unreal Engine', 'محرك Unreal', 'Unreal developer', 'مطور Unreal', 'Unreal مشاريع', 'Unreal 3D', 'Unreal VR', 'Unreal shader', 'Unreal visual scripting', 'تطوير ألعاب Unreal', 'Unreal عربي', 'UE5 عربي'],
    h1: 'مجتمع Unreal Engine العربي',
    body: 'لو تبغى تسوي ألعاب AAA أو تتعلم Blueprint و C++ — هذا مكانك. نتناقش عن Nanite و Lumen و MetaHuman وكل جديد في UE5. شروحات بالعربي، مشاريع نشاركها، وناس تساعدك من البداية.',
  },
  Godot: {
    title: 'مجتمع Godot — محرك الألعاب المفتوح بالعربي',
    description: 'Godot مجاني ومفتوح المصدر 100%. هنا نتعلم GDScript و 3D و 2D مع بعض. مكان ممتاز للمطورين المستقلين واللي يبون يبدون بدون تكاليف.',
    img: '/assets/images/godotlogo.png',
    keywords: ['Godot', 'جودوت', 'تعلم Godot', 'Godot بالعربي', 'Godot 4', 'Godot 3D', 'Godot 2D', 'Godot GDScript', 'Godot open source', 'Godot مفتوح المصدر', 'Godot tutorials arabic', 'دورة Godot', 'محرك Godot', 'Godot developer', 'مطور Godot', 'Godot مشاريع', 'Godot indie', 'Godot shader', 'Godot mobile', 'Godot engine', 'تطوير ألعاب Godot', 'Godot عربي', 'Godot مجاني'],
    h1: 'مجتمع Godot العربي',
    body: 'محرك ألعاب مجاني ومفتوح المصدر — يعني تقدر تسوي لعبتك بدون ما تدفع ريال. هنا نتعلم GDScript و 3D و 2D و Shader مع بعض. مناسب للمشاريع المستقلة واللي يبون يبدون بسرعة.',
  },
  Blender: {
    title: 'مجتمع Blender — تعلم النمذجة والأنيميشن بالعربي',
    description: 'Blender مجاني وهو أقوى برنامج نمذجة 3D. هنا نتعلم النمذجة والأنيميشن والرندر مع بعض. نشارك أعمالنا ونساعد بعض نتحسن.',
    img: '/assets/images/logoblender.png',
    keywords: ['Blender', 'بلندر', 'تعلم Blender', 'Blender بالعربي', 'Blender 3D', 'Blender modeling', 'Blender نمذجة', 'Blender animation', 'Blender أنيميشن', 'Blender rendering', 'Blender render', 'Blender sculpting', 'Blender نحت', 'Blender shader', 'Blender EEVEE', 'Blender Cycles', 'Blender Geometry Nodes', 'Blender مجاني', 'Blender free', 'Blender tutorials arabic', 'دورة Blender', 'Blender artist', 'فنان Blender', 'Blender game assets', 'Blender عربي'],
    h1: 'مجتمع Blender العربي',
    body: 'من النمذجة للأنيميشن للرندر — هنا نتعلم Blender خطوة بخطوة. سواء تبي تسوي أصول لألعابك أو تتعلم Sculpting أو Shader Nodes، تلقى ناس تساعدك. البرنامج مجاني والمجتمع كمان.',
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

          {/* Content for SEO — natural human writing */}
          {meta && (
            <section className="mt-10 text-right text-white/40 text-xs leading-relaxed space-y-3" aria-label="عن المجتمع">
              <p>{meta.body}</p>
              <p>سواء مبتدئ أو محترف — هذا المجتمع مكانك. ناس تساعدك، شروحات بالعربي، ومشاريع تتعلم منها.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
