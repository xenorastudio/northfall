"use client";

import Link from "next/link";

export function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 relative overflow-hidden bg-black">
      <div className="max-w-6xl mx-auto relative">
        {/* Badge */}
        <div className="flex justify-center mb-10">
          <a
            href="#communities"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[13px] text-white/40 hover:border-white/[0.15] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>المنصة العربية الأولى لتطوير الألعاب</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-[1.1] mb-6">
            نبني مستقبل الألعاب
            <br />
            <span className="text-white/25">العربية معاً</span>
          </h1>

          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            مجتمعات متخصصة لـ Unity و Unreal Engine و Godot و Blender.
            شارك مشروعك، تعلم من خبراء عرب، وكن جزء من أكبر مجتمع لتطوير الألعاب في العالم العربي.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/app" className="inline-flex items-center justify-center px-8 py-3 text-[15px] font-semibold bg-white text-black rounded-lg hover:bg-white/90 transition-colors">
              انضم الآن مجاناً
            </Link>
            <a href="#features" className="inline-flex items-center justify-center px-8 py-3 text-[15px] font-medium text-white/35 hover:text-white/70 transition-colors">
              اكتشف المزيد ←
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "4+", label: "مجتمعات متخصصة" },
            { value: "عربي", label: "محتوى بالعربي" },
            { value: "مجاني", label: "بدون أي رسوم" },
            { value: "24/7", label: "نقاشات مباشرة" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white/60">{stat.value}</div>
              <div className="text-xs text-white/25 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Community Cards */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { name: "Unity", desc: "تطوير ألعاب 3D و 2D", img: "/assets/images/unitylogo.png" },
            { name: "Unreal", desc: "ألعاب AAA بـ UE5", img: "/assets/images/unreallogo.svg" },
            { name: "Godot", desc: "محرك مفتوح ومجاني", img: "/assets/images/godotlogo.png" },
            { name: "Blender", desc: "نمذجة وأنيميشن 3D", img: "/assets/images/logoblender.png" },
          ].map((c) => (
            <Link
              key={c.name}
              href={`/community/${c.name}`}
              className="group p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
            >
              <img src={c.img} alt={`${c.name} — ${c.desc}`} className="w-10 h-10 rounded-lg mb-3 object-cover" width={40} height={40} />
              <h3 className="font-bold text-sm text-white/70 group-hover:text-white/90 transition-colors">{c.name}</h3>
              <p className="text-xs text-white/50 mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-white/40 mb-6">كل محركات الألعاب الرئيسية — بمكان واحد</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-30">
            {["Unity", "Unreal Engine", "Godot", "Blender", "GameDev", "تطوير ألعاب", "برمجة"].map((name) => (
              <span key={name} className="text-lg font-semibold text-white/30">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
