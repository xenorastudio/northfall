export function Discussions() {
  return (
    <section id="discussions" className="py-24 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Visual */}
          <div className="order-2 lg:order-1 relative">
            <div className="border border-white/[0.06] rounded-2xl bg-[#111] overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 border-b border-white/[0.04] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.03] flex items-center justify-center font-medium text-white/40">
                    A
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white/70">ahmad_dev</p>
                    <p className="text-xs text-white/25">Posted 2 hours ago</p>
                  </div>
                </div>
              </div>

              {/* Thread Content */}
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-3 text-white/80">
                  Best approach for Arabic text rendering in Unity?
                </h3>
                <p className="text-white/35 text-sm mb-4 leading-relaxed">
                  I&apos;m working on an Arabic visual novel and the text keeps disconnecting.
                  What are your recommendations for proper RTL support?
                </p>

                {/* Code Block */}
                <div className="rounded-lg bg-white/[0.06] text-white/60 p-4 font-mono text-xs mb-4 overflow-x-auto border border-white/[0.04]">
                  <pre>{`// Current approach
TextMeshPro txt = GetComponent<TMP_Text>();
txt.isRightToLeftText = true;
txt.font = arabicFont;`}</pre>
                </div>

                {/* Engagement */}
                <div className="flex items-center gap-4 text-sm text-white/25">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
                    </svg>
                    234
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    47 replies
                  </span>
                </div>
              </div>

              {/* Replies */}
              <div className="border-t border-white/[0.04]">
                {[
                  { user: "sara_builds", avatar: "S", reply: "Use the ArabicSupport plugin from the Asset Store. It handles ligatures properly.", time: "1h ago", votes: 89 },
                  { user: "kareem_gd", avatar: "K", reply: "I wrote a custom shader for this. Happy to share the repo.", time: "45m ago", votes: 56 },
                ].map((reply, i) => (
                  <div key={i} className="p-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.03] flex items-center justify-center text-sm font-medium flex-shrink-0 text-white/40">
                        {reply.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white/60">{reply.user}</span>
                          <span className="text-xs text-white/20">{reply.time}</span>
                        </div>
                        <p className="text-sm text-white/35">{reply.reply}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-white/20">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {reply.votes}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight tracking-[-0.02em]">
              Conversations that
              <br />
              <span className="text-white/25">drive engagement</span>
            </h2>
            <p className="text-white/30 text-base mb-8 leading-relaxed">
              Threaded discussions with rich formatting, code highlighting, and real-time
              updates. Make every conversation count.
            </p>

            <div className="space-y-4">
              {[
                { label: "Markdown & code blocks", desc: "Full formatting support for technical content" },
                { label: "Threaded replies", desc: "Organized conversations at any depth" },
                { label: "Real-time updates", desc: "See new posts and replies instantly" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[14px] text-white/80">{item.label}</p>
                    <p className="text-[13px] text-white/25">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a href="/app" className="inline-flex items-center gap-2 mt-8 text-[13px] font-medium text-white/40 hover:text-white/70 hover:gap-3 transition-all">
              Explore discussion features
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
