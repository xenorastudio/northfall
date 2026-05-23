"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, limit as fLimit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function Communities() {
  const [comms, setComms] = useState<{ name: string; members: number; posts: number }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "communities"), fLimit(6)));
        setComms(snap.docs.map(d => ({ name: d.id, members: d.data().memberCount || 0, posts: d.data().postCount || 0 })));
      } catch {}
    })();
  }, []);
  const totalMembers = comms.reduce((s, c) => s + c.members, 0);

  return (
    <section id="communities" className="py-24 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight tracking-[-0.02em]">
              Build spaces where
              <br />
              <span className="text-white/25">Arab devs belong</span>
            </h2>
            <p className="text-white/30 text-base mb-8 leading-relaxed">
              Dedicated communities for every engine. Arabic-first experience, custom roles, and
              everything you need to foster meaningful connections.
            </p>

            <div className="space-y-4">
              {[
                { label: "مجتمعك الخاص", desc: "أنشئ مجتمعك الخاص لمحرك اللعبة أو الموضوع اللي تحبه" },
                { label: "محتوى عربي", desc: "نقاشات وشروحات ومشاريع بالعربي" },
                { label: "تواصل مباشر", desc: "ناقش وشارك وتعلم من مطورين عرب زيك" },
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
              Explore communities
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="border border-white/[0.06] rounded-2xl bg-[#111] p-6">
              <div className="space-y-3">
                {comms.length === 0 ? (
                  <div className="p-4 text-center text-white/30 text-sm">Loading communities...</div>
                ) : comms.map((community, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group bg-white/[0.02] hover:bg-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-semibold text-lg text-white/50">
                        {community.name[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white/70 group-hover:text-white transition-colors">{community.name}</h4>
                        <p className="text-sm text-white/30">{community.members} members</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-400">{community.posts}</p>
                        <p className="text-xs text-white/20">posts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white/80">{totalMembers.toLocaleString()}</p>
                  <p className="text-xs text-white/20">Total Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/80">{comms.length}</p>
                  <p className="text-xs text-white/20">Communities</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/80">99.9%</p>
                  <p className="text-xs text-white/20">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
