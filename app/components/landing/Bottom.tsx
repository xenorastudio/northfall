import Link from "next/link";

export function Testimonials() {
  const testimonials = [
    {
      quote: "NorthFall gave the Arab game dev scene a home. No more building in silence.",
      author: "Ahmad K.",
      role: "Unity Developer",
      color: "bg-white text-black",
    },
    {
      quote: "Finally a platform where I can discuss Unreal Engine in Arabic with people who get it.",
      author: "Sara M.",
      role: "Unreal Engine Artist",
      color: "bg-yellow-500 text-black",
    },
    {
      quote: "The Godot community here helped me ship my first game. Real support, real people.",
      author: "Kareem R.",
      role: "Indie Game Dev",
      color: "bg-emerald-500 text-black",
    },
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/images/Background.png"
          alt=""
          className="w-full h-full object-cover blur-2xl scale-110"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 shadow-[inset_0_80px_80px_-40px_rgba(0,0,0,0.6)]" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white tracking-[-0.02em]">
            Loved by Arab game devs
          </h2>
          <p className="text-white/35 text-lg max-w-2xl mx-auto leading-relaxed">
            Join developers who trust NorthFall to power their game dev conversations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((testimonial, index) => (
          <div key={index} className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all hover:border-white/[0.15] hover:bg-white/[0.05]">
            <blockquote className="text-lg font-semibold leading-relaxed mb-6 text-white/75">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.03] flex items-center justify-center border border-white/[0.06]">
                <span className="text-[13px] font-bold text-white/40">{testimonial.author[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-[13px] text-white/60">{testimonial.author}</p>
                <p className="text-[12px] text-white/25">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-28 px-6 lg:px-8 bg-black text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-[1.1] tracking-[-0.02em]">
          مستعد تنضم لمجتمع مطوري الألعاب العرب؟
        </h2>
        <p className="text-base text-white/25 mb-10 max-w-xl mx-auto leading-relaxed">
          ابدأ مجاناً. بدون بطاقة ائتمان. فقط أنت، محركك، وناسك.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/app" className="inline-flex items-center justify-center px-6 py-2.5 text-[14px] font-semibold bg-white text-black rounded-lg hover:bg-white/90 transition-colors">
            ابدأ مجاناً
          </Link>
          <a href="#features" className="inline-flex items-center justify-center px-6 py-2.5 text-[14px] font-medium text-white/30 hover:text-white/60 transition-colors">
            اعرف أكثر ←
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const footerSections = [
    {
      title: "المنتج",
      links: [
        { label: "المميزات", href: "/#features" },
        { label: "المجتمعات", href: "/#communities" },
        { label: "النقاشات", href: "/#discussions" },
        { label: "الألعاب", href: "/app?view=games" },
      ],
    },
    {
      title: "المجتمعات",
      links: [
        { label: "Unity", href: "/app?community=Unity" },
        { label: "Unreal", href: "/app?community=Unreal" },
        { label: "Godot", href: "/app?community=Godot" },
        { label: "Blender", href: "/app?community=Blender" },
      ],
    },
    {
      title: "الشركة",
      links: [
        { label: "عن NorthFall", href: "/#features" },
        { label: "المنتدى", href: "/NewPage" },
        { label: "تواصل معنا", href: "/app" },
      ],
    },
    {
      title: "قانوني",
      links: [
        { label: "الخصوصية", href: "/app?view=settings" },
        { label: "الشروط", href: "/app?view=settings" },
        { label: "الأمان", href: "/app?view=settings" },
      ],
    },
  ];

  const navSchema = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: ['الرئيسية', 'المجتمع', 'الألعاب', 'المنتدى', 'المميزات', 'المجتمعات'],
    url: [
      'https://northfall.blog',
      'https://northfall.blog/app',
      'https://northfall.blog/app?view=games',
      'https://northfall.blog/NewPage',
      'https://northfall.blog/#features',
      'https://northfall.blog/#communities',
    ],
  };

  return (
    <footer className="py-16 px-6 lg:px-8 bg-black border-t border-white/[0.08]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(navSchema) }} />
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="font-bold text-[16px] tracking-tight text-white mb-4 block">
              NorthFall
            </Link>
            <p className="text-[13px] text-white/25 max-w-xs leading-relaxed">
              منصة المجتمعات العربية للألعاب والتقنية. صُنع منّا لأجلنا.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-[13px] mb-4 text-white/60">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-white/25 hover:text-white/50 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex items-center justify-between">
          <p className="text-[13px] text-white/20">
            &copy; 2026 NorthFall. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/app?view=settings" className="text-[13px] text-white/20 hover:text-white/40 transition-colors">الخصوصية</Link>
            <Link href="/app?view=settings" className="text-[13px] text-white/20 hover:text-white/40 transition-colors">الشروط</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
