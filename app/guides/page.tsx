import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'أدلة مجانية لتعلم تطوير الألعاب بالعربي',
  description: 'أدلة مجانية تتعلم منها تطوير الألعاب بالعربي — Unity و Unreal Engine و Godot و Blender. من الصفر لحد تسوي لعبتك الأولى. كل شي مجاني وبالعربي.',
  keywords: ['تعلم تطوير ألعاب', 'دليل Unity مجاني', 'دليل Unreal مجاني', 'دليل Godot مجاني', 'دليل Blender مجاني', 'تطوير ألعاب بالعربي', 'دورة مجانية', 'شروحات عربية', 'مبتدئ تطوير ألعاب', 'كيف اسوي لعبة', 'تعلم برمجة ألعاب'],
  alternates: { canonical: `${SITE_URL}/guides` },
  openGraph: {
    title: 'أدلة مجانية لتعلم تطوير الألعاب — NorthFall',
    description: 'أدلة مجانية تتعلم منها تطوير الألعاب بالعربي — من الصفر لحد تسوي لعبتك الأولى',
    url: `${SITE_URL}/guides`,
    type: 'website',
  },
};

const guides = [
  {
    slug: 'unity-beginner',
    title: 'كيف تبدأ مع Unity من الصفر',
    desc: 'لو ما عندك أي خبرة بـ Unity، هذا الدليل ياخذك خطوة بخطوة. من تنزيل المحرك لحد تسوي لعبتك الأولى.',
    tags: ['Unity', 'مبتدئ', 'C#', '3D'],
  },
  {
    slug: 'unreal-beginner',
    title: 'ابدأ مع Unreal Engine 5 — الدليل الكامل',
    desc: 'كل شي تحتاجه عشان تبدأ بـ UE5. من Blueprint لحد تسوي بيئة مفتوحة مع Nanite و Lumen.',
    tags: ['Unreal', 'UE5', 'Blueprint', 'مبتدئ'],
  },
  {
    slug: 'godot-beginner',
    title: 'تعلم Godot 4 — محرك مجاني ومفتوح المصدر',
    desc: 'Godot مجاني 100% ومفتوح المصدر. هذا الدليل يعلمك GDScript و تسوي لعبة 2D كاملة من الصفر.',
    tags: ['Godot', 'GDScript', '2D', 'مجاني'],
  },
  {
    slug: 'blender-beginner',
    title: 'ابدأ مع Blender — نمذجة وأنيميشن ورندر',
    desc: 'Blender أقوى برنامج 3D ومجاني. هنا تتعلم النمذجة والأنيميشن وتسوي أصول لألعابك.',
    tags: ['Blender', '3D', 'نمذجة', 'أنيميشن'],
  },
  {
    slug: 'first-game',
    title: 'سوّي لعبتك الأولى — دليل خطوة بخطوة',
    desc: 'ما تبي تتعلم محرك معين؟ هذا الدليل العام يعلمك شنو تحتاجه عشان تسوي لعبتك الأولى، من الفكرة للنشر.',
    tags: ['تطوير ألعاب', 'مبتدئ', 'indie', 'نشر'],
  },
  {
    slug: 'csharp-gamedev',
    title: 'تعلم C# لتطوير الألعاب',
    desc: 'C# هي لغة Unity. هذا الدليل يعلمك الأساسيات اللي تحتاجها عشان تبدأ تبرمج ألعابك.',
    tags: ['C#', 'برمجة', 'Unity', 'مبتدئ'],
  },
];

export default function GuidesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'الأدلة المجانية', item: `${SITE_URL}/guides` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'أدلة مجانية لتعلم تطوير الألعاب بالعربي',
        description: 'أدلة مجانية تتعلم منها تطوير الألعاب بالعربي — Unity و Unreal Engine و Godot و Blender',
        url: `${SITE_URL}/guides`,
        isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'ItemList',
        itemListElement: guides.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `${SITE_URL}/guides/${g.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#1e1e20] text-[#e0e0e0]" style={{ direction: 'rtl' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-4">أدلة مجانية لتعلم تطوير الألعاب</h1>
        <p className="text-white/50 mb-2 leading-relaxed">
          تبي تتعلم تطوير ألعاب بالعربي؟ هنا تلقى أدلة مجانية تأخذك من الصفر.
          سواء تبي Unity أو Unreal أو Godot أو Blender — كل شي موجود ومجاني.
        </p>
        <p className="text-white/50 mb-10 text-sm">
          زي ما نقول دايمًا: أحسن شي تسويه عشان تتعلم هو إنك تسوي شي بنفسك.
          هذي الأدلة تساعدك تبدأ، وبعدين انضم للمجتمع واسأل لو حصلت مشكلة.
        </p>

        <div className="grid gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="block p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-colors"
            >
              <h2 className="text-lg font-bold text-white mb-2">{guide.title}</h2>
              <p className="text-sm text-white/40 leading-relaxed mb-3">{guide.desc}</p>
              <div className="flex flex-wrap gap-2">
                {guide.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded text-xs bg-white/[0.06] text-white/50">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* SEO content — natural writing */}
        <section className="mt-16 text-white/50 text-sm leading-relaxed space-y-4" aria-label="عن الأدلة">
          <h2 className="text-xl font-bold text-white/50">ليش تتعلم تطوير ألعاب؟</h2>
          <p>
            تطوير الألعاب من أكثر المجالات اللي تنمو بسرعة. والشي الحلو إنك ما تحتاج شهادة ولا خبرة سابقة — بس تحتاج جهاز وإنترنت وصبر.
            المحركات زي Unity و Unreal و Godot كلها مجانية، و Blender كمان مجاني. يعني تقدر تبدأ بدون ما تدفع ريال واحد.
          </p>
          <p>
            المشكلة اللي يواجهها أكثر المطورين العرب هي إن الموارد كلها بالإنجليزي.
            هنا في NorthFall حاولنا نجمع أحسن الأدلة بالعربي عشان الكل يقدر يتعلم.
            سواء تبي تسوي لعبة 2D بسيطة أو مشروع AAA بـ Unreal — تلقى اللي تحتاجه هنا.
          </p>
          <p>
            وأحسن شي؟ لو حصلت مشكلة أو ما فهمت شي، دخّل المجتمع واسأل.
            ناس مجربين يساعدونك، ومحتوى جديد ينضاف كل فترة.
          </p>
        </section>

        {/* Internal links */}
        <nav className="mt-10 flex flex-wrap gap-4" aria-label="روابط سريعة">
          <Link href="/community/Unity" className="text-sm text-white/50 hover:text-white/60 transition-colors">مجتمع Unity</Link>
          <Link href="/community/Unreal" className="text-sm text-white/50 hover:text-white/60 transition-colors">مجتمع Unreal</Link>
          <Link href="/community/Godot" className="text-sm text-white/50 hover:text-white/60 transition-colors">مجتمع Godot</Link>
          <Link href="/community/Blender" className="text-sm text-white/50 hover:text-white/60 transition-colors">مجتمع Blender</Link>
          <Link href="/NewPage" className="text-sm text-white/50 hover:text-white/60 transition-colors">المنتدى</Link>
          <Link href="/app" className="text-sm text-white/50 hover:text-white/60 transition-colors">الرئيسية</Link>
        </nav>
      </div>
    </div>
  );
}
