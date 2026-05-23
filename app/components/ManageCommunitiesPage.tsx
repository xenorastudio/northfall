"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { cn } from "@/lib/utils";
import { Search, Star, Settings2, Plus, Shield } from "lucide-react";

interface Community {
  name: string; img: string; members: number; desc: string;
  isOwner: boolean; isMod: boolean; isFavorite: boolean;
}

interface Props {
  onBack: () => void;
  onCommunityClick: (name: string) => void;
  onCreateCommunity: () => void;
  onDashboardClick: (name: string) => void;
}

export default function ManageCommunitiesPage({ onBack, onCommunityClick, onCreateCommunity, onDashboardClick }: Props) {
  const { user } = useAuth();
  const { communities: allComms, joinedCommunities: joinedNames } = useData();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`nf-fav-comms-${user.uid}`);
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user || allComms.length === 0) return;
    (async () => {
      setLoading(true);
      try {
        const list: Community[] = [];
        for (const c of allComms) {
          const isJoined = joinedNames.includes(c.name) || c.creatorUid === user.uid;
          if (!isJoined) continue;
          const isOwner = c.creatorUid === user.uid;
          let isMod = false;
          if (!isOwner) {
            const memberSnap = await getDoc(doc(db, "communities", c.name, "members", user.uid)).catch(() => null);
            if (memberSnap?.exists()) {
              const role = memberSnap.data().role;
              isMod = role === "admin" || role === "moderator";
            }
          }
          let desc = "";
          const commSnap = await getDoc(doc(db, "communities", c.name)).catch(() => null);
          if (commSnap?.exists()) desc = commSnap.data().shortDesc || "";
          list.push({ name: c.name, img: c.img || "", members: c.members || 0, desc, isOwner, isMod, isFavorite: favorites.has(c.name) });
        }
        list.sort((a, b) => {
          if (a.isOwner && !b.isOwner) return -1;
          if (!a.isOwner && b.isOwner) return 1;
          if (a.isMod && !b.isMod) return -1;
          if (!a.isMod && b.isMod) return 1;
          return (b.members || 0) - (a.members || 0);
        });
        setCommunities(list);
      } catch {}
      setLoading(false);
    })();
  }, [user, allComms, joinedNames, favorites]);

  const toggleFavorite = (name: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      if (user) localStorage.setItem(`nf-fav-comms-${user.uid}`, JSON.stringify([...next]));
      return next;
    });
    setCommunities(prev => prev.map(c => c.name === name ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const filtered = communities
    .filter(c => tab === "favorites" ? c.isFavorite : true)
    .filter(c => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full max-w-[860px]" style={{ direction: "rtl" }}>

      {/* Reddit-style header — simple title + create button */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-bold text-nf-text">إدارة المجتمعات</h1>
        <button onClick={onCreateCommunity}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-nf-accent text-white text-[13px] font-bold hover:opacity-90 transition-opacity">
          <Plus size={14} /> إنشاء مجتمع
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Search — Reddit style */}
          <div className="relative mb-4">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في مجتمعاتك..."
              className="w-full bg-nf-secondary/50 border border-nf-border-2/50 rounded-xl pr-10 pl-4 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 focus:bg-nf-secondary transition-all" />
          </div>

          {loading ? (
            <div className="space-y-px">{[1,2,3,4].map(i => <div key={i} className="h-[68px] bg-nf-secondary/20 animate-pulse rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-nf-dim">
              <p className="text-[14px] font-medium mb-1">{tab === "favorites" ? "لا توجد مجتمعات مفضلة" : "لا توجد مجتمعات"}</p>
              <p className="text-[12px]">{tab === "favorites" ? "اضغط ★ لإضافة مجتمع للمفضلة" : "انضم لمجتمعات لتظهر هنا"}</p>
            </div>
          ) : (
            <div>
              {filtered.map((c, idx) => (
                <div key={c.name}>
                  {idx > 0 && <div className="h-px bg-nf-border-2/20 mx-1" />}
                  <div className="flex items-center gap-3.5 px-2 py-3.5 rounded-lg hover:bg-nf-secondary/25 transition-colors group cursor-pointer"
                    onClick={() => onCommunityClick(c.name)}>
                    {/* Avatar */}
                    {c.img
                      ? <img src={c.img} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-nf-secondary flex items-center justify-center text-[10px] text-nf-accent font-bold shrink-0">n/</div>
                    }
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-nf-text">n/{c.name}</span>
                        {c.isOwner && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent">مؤسس</span>}
                        {c.isMod && !c.isOwner && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-400/10 text-blue-400 flex items-center gap-0.5">
                            <Shield size={8} /> ناظم
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-nf-dim truncate mt-0.5">{c.desc || `${c.members.toLocaleString()} عضو`}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleFavorite(c.name)}
                        className={cn("p-1.5 rounded-lg transition-colors",
                          c.isFavorite ? "text-yellow-400" : "text-nf-dim opacity-0 group-hover:opacity-100 hover:text-yellow-400")}>
                        <Star size={14} fill={c.isFavorite ? "currentColor" : "none"} />
                      </button>
                      {c.isOwner && (
                        <button onClick={() => onDashboardClick(c.name)}
                          className="p-1.5 rounded-lg text-nf-dim opacity-0 group-hover:opacity-100 hover:text-nf-accent transition-colors"
                          title="لوحة التحكم">
                          <Settings2 size={14} />
                        </button>
                      )}
                      <span className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-nf-border-2/50 text-nf-dim">
                        عضو ✓
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — Reddit style */}
        <div className="w-[200px] shrink-0 sticky top-[calc(var(--nav-total-height)+16px)]">
          <div className="rounded-xl overflow-hidden border border-nf-border-2/40">
            {[
              { id: "all" as const, label: "كل المجتمعات" },
              { id: "favorites" as const, label: "المفضلة" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("w-full text-right px-4 py-3 text-[13px] font-medium transition-colors border-b border-nf-border-2/20 last:border-0",
                  tab === t.id ? "bg-nf-hover text-nf-text font-bold" : "text-nf-muted hover:bg-nf-hover/50")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
