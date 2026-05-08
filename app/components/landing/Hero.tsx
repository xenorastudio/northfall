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
            <span>منصة مطوري الألعاب العرب</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-[1.1] mb-6">
            مجتمع مطوري الألعاب العرب
            <br />
            <span className="text-white/25">زي ريدت بس للعرب</span>
          </h1>

          <p className="text-base sm:text-lg text-white/30 max-w-lg mx-auto mb-10 leading-relaxed">
            مكان واحد تناقش فيه عن Unity و Unreal و Godot و Blender.
            تشارك مشروعك، تتعلم من الناس، وتلقى مساعدة. كل شي بالعربي.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/app" className="inline-flex items-center justify-center px-6 py-2.5 text-[14px] font-semibold bg-white text-black rounded-lg hover:bg-white/90 transition-colors">
              ابدأ مجاناً
            </Link>
            <a href="#features" className="inline-flex items-center justify-center px-6 py-2.5 text-[14px] font-medium text-white/35 hover:text-white/70 transition-colors">
              شوف الميزات ←
            </a>
          </div>
        </div>

        {/* Forum Preview Mockup */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />

          <div className="border border-white/[0.06] rounded-2xl bg-[#111] shadow-2xl shadow-black/40 overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white/[0.04] text-xs text-white/30 font-mono">
                  northfall.app/c/unreal
                </div>
              </div>
            </div>

            {/* Forum Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="hidden lg:block space-y-4">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    <h3 className="font-medium text-sm mb-3 text-white/50">Your Communities</h3>
                    <div className="space-y-2">
                      {[
                        { name: "Unity", color: "from-gray-600/30 to-gray-700/10" },
                        { name: "Unreal", color: "from-blue-600/30 to-blue-700/10" },
                        { name: "Godot", color: "from-blue-500/30 to-blue-400/10" },
                        { name: "Blender", color: "from-orange-600/30 to-orange-500/10" },
                      ].map((c) => (
                        <div key={c.name} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors">
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${c.color} flex items-center justify-center text-xs font-medium text-white/60`}>
                            {c.name[0]}
                          </div>
                          <span className="text-sm text-white/40">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Feed */}
                <div className="lg:col-span-3 space-y-4">
                  {[
                    {
                      title: "How do you handle LOD in large open worlds with Unreal Engine 5?",
                      author: "ahmad_dev",
                      votes: 847,
                      comments: 234,
                      tag: "Unreal",
                    },
                    {
                      title: "I built an Arabic localization plugin for Unity — open source",
                      author: "sara_builds",
                      votes: "1.2k",
                      comments: 89,
                      tag: "Unity",
                    },
                    {
                      title: "Godot 4.4 shader tutorial for beginners (Arabic)",
                      author: "kareem_gamedev",
                      votes: 634,
                      comments: 156,
                      tag: "Godot",
                    },
                  ].map((post, i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] transition-colors cursor-pointer group">
                      <div className="flex gap-4">
                        {/* Vote buttons */}
                        <div className="flex flex-col items-center gap-1 text-white/15">
                          <button type="button" className="p-1 hover:text-yellow-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <span className="text-sm font-medium text-white/40">{post.votes}</span>
                          <button type="button" className="p-1 hover:text-blue-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/[0.06] text-white/40">
                              {post.tag}
                            </span>
                            <span className="text-xs text-white/20">Posted by u/{post.author}</span>
                          </div>
                          <h3 className="font-medium text-base text-white/60 group-hover:text-white/80 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-3 text-sm text-white/15">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {post.comments} comments
                            </span>
                            <span>Share</span>
                            <span>Save</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-white/20 mb-6">مجتمع GameDev العرب — كل المحركات بمكان واحد</p>
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
