export function Features() {
  const features = [
    {
      title: "Real-time Discussions",
      description: "Engage in live conversations with instant updates. No refresh needed.",
      icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      color: "from-blue-500/30 to-blue-600/10",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10"
    },
    {
      title: "Smart Moderation",
      description: "AI-powered tools to keep your community safe and welcoming.",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      color: "from-emerald-500/30 to-emerald-600/10",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10"
    },
    {
      title: "Rich Media",
      description: "Share images, videos, code snippets, and files seamlessly.",
      icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      color: "from-purple-500/30 to-purple-600/10",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10"
    },
    {
      title: "Arabic-First",
      description: "Full RTL support, Arabic UI, and content designed for Arab developers.",
      icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
      color: "from-orange-500/30 to-orange-600/10",
      iconColor: "text-orange-400",
      iconBg: "bg-orange-500/10"
    },
    {
      title: "Community Analytics",
      description: "Track engagement, growth, and community health metrics.",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      color: "from-cyan-500/30 to-cyan-600/10",
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10"
    },
    {
      title: "Engine Integrations",
      description: "Dedicated spaces for every game engine and tool with tailored features.",
      icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
      color: "from-pink-500/30 to-pink-600/10",
      iconColor: "text-pink-400",
      iconBg: "bg-pink-500/10"
    }
  ];

  return (
    <section id="features" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/images/BackgroundBl.jpg"
          alt="ميزات NorthFall — مجتمعات تطوير الألعاب العربية"
          className="w-full h-full object-cover blur-2xl scale-110"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 shadow-[inset_0_80px_80px_-40px_rgba(0,0,0,0.6)]" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white tracking-[-0.02em]">
              Everything you need to build community
            </h2>
            <p className="text-white/35 text-lg max-w-2xl mx-auto leading-relaxed">
              Powerful features designed for Arab game developers to create, grow, and manage thriving communities.
            </p>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
              <div key={index} className="p-6 border border-white/[0.06] rounded-2xl bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04] group">
                <div className={`w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <svg className={`w-5 h-5 ${feature.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-[15px] mb-1.5 text-white/90">{feature.title}</h3>
                <p className="text-white/30 text-[13px] leading-relaxed">{feature.description}</p>
              </div>
          ))}
        </div>
      </div>
    </section>
  );
}
