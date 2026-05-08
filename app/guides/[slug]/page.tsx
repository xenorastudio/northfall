import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'كيف تبدأ مع Unity من الصفر — دليل مجاني بالعربي',
  description: 'تبي تتعلم Unity؟ هذا الدليل ياخذك من الصفر لحد تسوي لعبتك الأولى. تنزيل المحرك، تتعلم C#، وتسوي مشروع حقيقي. كل شي بالعربي ومجاني.',
  keywords: ['تعلم Unity بالعربي', 'Unity مبتدئ', 'كيف اتعلم Unity', 'دليل Unity مجاني', 'Unity من الصفر', 'Unity 3D مبتدئ', 'Unity C# مبتدئ', 'تطوير ألعاب Unity', 'اول لعبة Unity', 'Unity tutorial عربي'],
  alternates: { canonical: `${SITE_URL}/guides/unity-beginner` },
  openGraph: {
    title: 'كيف تبدأ مع Unity من الصفر — NorthFall',
    description: 'دليل مجاني بالعربي ياخذك من الصفر لحد تسوي لعبتك الأولى بـ Unity',
    url: `${SITE_URL}/guides/unity-beginner`,
    type: 'article',
  },
};

export default function UnityBeginnerGuide() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'الأدلة', item: `${SITE_URL}/guides` },
          { '@type': 'ListItem', position: 3, name: 'دليل Unity للمبتدئين', item: `${SITE_URL}/guides/unity-beginner` },
        ],
      },
      {
        '@type': 'Article',
        headline: 'كيف تبدأ مع Unity من الصفر — دليل مجاني بالعربي',
        description: 'دليل مجاني بالعربي ياخذك من الصفر لحد تسوي لعبتك الأولى بـ Unity',
        url: `${SITE_URL}/guides/unity-beginner`,
        author: { '@type': 'Organization', name: 'NorthFall' },
        publisher: { '@type': 'Organization', name: 'NorthFall', logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/images/logo.png` } },
        datePublished: '2025-05-01',
        dateModified: '2026-05-08',
        mainEntityOfPage: `${SITE_URL}/guides/unity-beginner`,
      },
      {
        '@type': 'HowTo',
        name: 'كيف تبدأ مع Unity من الصفر',
        description: 'دليل خطوة بخطوة عشان تتعلم Unity وتسوي لعبتك الأولى',
        step: [
          { '@type': 'HowToStep', name: 'نزّل Unity Hub', text: 'روح لموقع Unity ونزّل Unity Hub. هذا البرنامج يخليك تتحكم بإصدارات Unity ومشاريعك.' },
          { '@type': 'HowToStep', name: 'سوي حساب مجاني', text: 'سوي حساب على Unity — الشخصي مجاني ويكفي للمبتدئين.' },
          { '@type': 'HowToStep', name: 'نزّل آخر إصدار LTS', text: 'من Unity Hub نزّل آخر إصدار LTS (Long Term Support). هذي أكتر إصدار مستقر.' },
          { '@type': 'HowToStep', name: 'سوي مشروع جديد', text: 'اختر 3D أو 2D وحط اسم مشروعك. خلّي Template على Core عشان تبدأ بسرعة.' },
          { '@type': 'HowToStep', name: 'تعرّف على الواجهة', text: 'الواجهة فيها عدة أجزاء: Scene (تشوف اللعبة)، Game (تختبرها)، Hierarchy (كل الأشياء)، Inspector (تفاصيل الشي المختار).' },
          { '@type': 'HowToStep', name: 'تعلّم أساسيات C#', text: 'C# هي لغة البرمجة اللي تستخدمها في Unity. تتعلم المتغيرات والشروط والحلقات — مو محتاج شي معقد.' },
          { '@type': 'HowToStep', name: 'سوي أول Script', text: 'سوي C# Script جديد وحطه على مكعب. خليه يتحرك يمين ويسار بالأسهم. هذا أول شي تتعلمه!' },
          { '@type': 'HowToStep', name: 'سوي لعبة بسيطة', text: 'ابدأ بلعبة بسيطة زي Pong أو لعبة تجنب المكعبات. لا تبتدي بمشروع كبير — الصغار يتعلمونك أكثر.' },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#1e1e20] text-[#e0e0e0]" style={{ direction: 'rtl' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/guides" className="text-sm text-white/30 hover:text-white/60 mb-6 inline-block">← رجوع للأدلة</Link>

        <h1 className="text-3xl font-bold text-white mb-4">كيف تبدأ مع Unity من الصفر</h1>
        <p className="text-white/40 mb-8">
          آخر تحديث: مايو 2026 — هذا الدليل مجاني وبالعربي وياخذك خطوة بخطوة من ما تعرف شي عن Unity لحد تسوي لعبتك الأولى.
        </p>

        <div className="space-y-8 text-white/60 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">1. نزّل Unity Hub</h2>
            <p>
              أول شي تسويه هو إنك تنزّل Unity Hub من موقع Unity الرسمي.
              هذا البرنامج هو مركز التحكم — من خلاله تقدر تنزّل إصدارات مختلفة من المحرك وتتحكم بمشاريعك.
              <br /><br />
              نزّله من: <a href="https://unity.com/download" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">unity.com/download</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">2. سوي حساب مجاني</h2>
            <p>
              بعد ما تنزّل Unity Hub، سوي حساب. الخطة الشخصية (Personal) مجانية تمامًا
              وتكفيك لبدايتك. ما تحتاج تدفع شي إلا لو صار مشروعك يكسب أكثر من 100 ألف دولار — وذي مشكلة حلوة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">3. نزّل آخر إصدار LTS</h2>
            <p>
              من داخل Unity Hub، روح لـ Installs واضغط على Install Editor.
              اختر آخر إصدار LTS (Long Term Support) — هذي الإصدارات أكتر استقرارًا
              وفيها أقل مشاكل. لا تختار أحدث إصدار عادي لأنه ممكن يكون فيه bugs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">4. سوي مشروعك الأول</h2>
            <p>
              افتح Unity Hub واختر New Project. لو تبي لعبة ثلاثية الأبعاد اختر 3D Core،
              ولو تبي ثنائية اختر 2D Core. حط اسم لمشروعك واضغط Create Project.
              <br /><br />
              أول ما يفتح، بتشوف واجهة فيها كذا جزء. لا تخاف — كل شي له معنى:
            </p>
            <ul className="list-disc mr-6 mt-2 space-y-1 text-sm">
              <li><strong className="text-white/70">Scene</strong> — هني تشوف وتعدل اللعبة</li>
              <li><strong className="text-white/70">Game</strong> — هني تختبر اللعبة كأنك تلعبها</li>
              <li><strong className="text-white/70">Hierarchy</strong> — كل الأشياء اللي في المشهد</li>
              <li><strong className="text-white/70">Inspector</strong> — تفاصيل الشي المختار (مكانه، حجمه، الخ)</li>
              <li><strong className="text-white/70">Project</strong> — ملفاتك (سكربتات، صور، أصوات)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">5. تعلّم أساسيات C#</h2>
            <p>
              C# هي لغة البرمجة اللي تستخدمها في Unity. مو محتاج تتعلم كل اللغة — بس الأساسيات:
            </p>
            <ul className="list-disc mr-6 mt-2 space-y-1 text-sm">
              <li>المتغيرات (Variables) — تخزن بيانات زي الأرقام والنصوص</li>
              <li>الشروط (If/Else) — تخلي اللعبة تاخذ قرارات</li>
              <li>الحلقات (Loops) — تعيد شي معين عدة مرات</li>
              <li>الدوال (Functions) — تجمع كود في مكان واحد عشان تستخدمه أكثر من مرة</li>
            </ul>
            <p className="mt-2">
              لو ما تعرف تبرمج أصلاً، لا تخاف — C# سهلة وبتتعلمها بسرعة.
              بس ابدأ بالأساسيات وخليك تطبق كل شي تتعلمه.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">6. سوي أول Script</h2>
            <p>
              في مجلد Project، كليك يمين واختر Create → C# Script.
              سمّه شي زي PlayerMovement. افتحه واكتب كود يخلي مكعب يتحرك بالأسهم.
              <br /><br />
              بعدين اسحب السكربت على مكعب في المشهد واضغط Play.
              لو كل شي صح، المكعب بيتحرك! مبروك — أول كود كتبته في Unity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">7. سوّي لعبة بسيطة</h2>
            <p>
              أهم نصيحة: لا تبتدي بمشروع كبير. كثير ناس يحلمون بلعبة RPG ضخمة أول شي وبعدين يملون.
              ابدأ بلعبة بسيطة:
            </p>
            <ul className="list-disc mr-6 mt-2 space-y-1 text-sm">
              <li>لعبة Pong — تتعلم حركة الكرة والتصادم</li>
              <li>لعبة تجنب المكعبات — تتعلم Spawn والسرعة</li>
              <li>لعبة منصة بسيطة — تتعلم القفز والجاذبية</li>
            </ul>
            <p className="mt-2">
              كل لعبة صغيرة تتعلم منها شي جديد. وبعدين تقدر تبني عليها وتسوي شي أكبر.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white/80 mb-3">8. انضم للمجتمع</h2>
            <p>
              أحسن شي تسويه بعد ما تتعلم الأساسيات هو إنك تنضم لمجتمع.
              في NorthFall تلقى ناس يتناقشون عن Unity بالعربي، يشاركون مشاريعهم، ويساعدون بعض.
              <br /><br />
              لو حصلت مشكلة أو ما فهمت شي — اسأل. كلنا كنا مبتدئين مرة.
            </p>
            <Link
              href="/community/Unity"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-white/90 transition-colors mt-4"
            >
              افتح مجتمع Unity ←
            </Link>
          </section>
        </div>

        {/* Internal links */}
        <nav className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4" aria-label="روابط سريعة">
          <Link href="/guides" className="text-sm text-white/30 hover:text-white/60 transition-colors">كل الأدلة</Link>
          <Link href="/guides/unreal-beginner" className="text-sm text-white/30 hover:text-white/60 transition-colors">دليل Unreal Engine</Link>
          <Link href="/guides/godot-beginner" className="text-sm text-white/30 hover:text-white/60 transition-colors">دليل Godot</Link>
          <Link href="/guides/blender-beginner" className="text-sm text-white/30 hover:text-white/60 transition-colors">دليل Blender</Link>
          <Link href="/community/Unity" className="text-sm text-white/30 hover:text-white/60 transition-colors">مجتمع Unity</Link>
          <Link href="/app" className="text-sm text-white/30 hover:text-white/60 transition-colors">الرئيسية</Link>
        </nav>
      </article>
    </div>
  );
}
