"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, Users, Star, Settings2, Plus, Shield } from "lucide-react";

interface Community {
  name: string;
  img: string;
  members: number;
  desc: string;
  isOwner: boolean;
  isMod: boolean;
  isFavorite: boolean;
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
    // Load favorites from localStorage
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
        // Get user's role in each joined community
        const list: Community[] = [];
        for (const c of allComms) {
          const isJoined = joinedNames.includes(c.name) || c.creatorUid === user.uid;
          if (!isJoined) continue;

          const isOwner = c.creatorUid === user.uid;
          let isMod = false;
          if (!isOwner) {
            try {
              const memberSnap = await getDoc(doc(db, "communities", c.name, "members", user.uid));
              if (memberSnap.exists()) {
                const role = memberSnap.data().role;
                isMod = role === "admin" || role === "moderator";
              }
            } catch {}
          }

          // Get community desc
          let desc = "";
          try {
            const commSnap = await getDoc(doc(db, "communities", c.name));
            if (commSnap.exists()) desc = commSnap.data().shortDesc || commSnap.data().desc || "";
          } catch {}

          list.push({
            name: c.name,
            img: c.img || "",
            members: c.members || 0,
            desc,
            isOwner,
            isMod,
            isFavorite: favorites.has(c.name),
          });
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
      if (next.has(name)) next.delete(name);
      else next.add(name);
      if (user) localStorage.setItem(`nf-fav-comms-${user.uid}`, JSON.stringify([...next]));
      return next;
    });
    setCommunities(prev => prev.map(c => c.name === name ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const filtered = communities
    .filter(c => tab === "favorites" ? c.isFavorite : true)
    .filter(c => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full max-w-[900px] mx-auto" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
          <ChevronRight size={18} />
        </button>
        <div>
          <h1 className="text-[22px] font-black text-nf-text">إدارة مجتمعاتي</h1>
          <p className="text-[12px] text-nf-dim mt-0.5">{communities.length} مجتمع</p>
        </div>
        <div className="flex-1" />
        <button onClick={onCreateCommunity}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nf-accent text-white text-[12px] font-bold hover:opacity-90 transition-opacity">
          <Plus size={14} /> إنشاء مجتمع
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في مجتمعاتك..."
              className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-10 pl-4 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
          </div>

          {/* Communities list */}
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-nf-secondary/20 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users size={32} className="text-nf-dim/20 mx-auto mb-3" />
              <p className="text-[14px] font-bold text-nf-muted mb-1">
                {tab === "favorites" ? "لا توجد مجتمعات مفضلة" : "لا توجد مجتمعات"}
              </p>
              <p className="text-[12px] text-nf-dim">
                {tab === "favorites" ? "اضغط ★ على أي مجتمع لإضافته للمفضلة" : "انضم لمجتمعات لتظهر هنا"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(c => (
                <div key={c.name}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-nf-border-2/40 bg-nf-secondary/10 hover:bg-nf-secondary/30 hover:border-nf-border-2 transition-all group cursor-pointer"
                  onClick={() => onCommunityClick(c.name)}>
                  {/* Avatar */}
                  {c.img
                    ? <img src={c.img} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-nf-border-2/50" />
                    : <div className="w-10 h-10 rounded-full bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center text-[10px] text-nf-accent font-bold shrink-0">n/</div>
                  }

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-nf-text">n/{c.name}</span>
                      {c.isOwner && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent border border-nf-accent/20">مؤسس</span>
                      )}
                      {c.isMod && !c.isOwner && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20 flex items-center gap-0.5">
                          <Shield size={8} /> ناظم
                        </span>
                      )}
                    </div>
                    {c.desc ? (
                      <p className="text-[11px] text-nf-dim truncate">{c.desc}</p>
                    ) : (
                      <p className="text-[11px] text-nf-dim/50">{c.members.toLocaleString()} عضو</p>
                    )}
                  </div>

                  {/* Members count */}
                  <div className="text-center shrink-0 hidden sm:block">
                    <p className="text-[13px] font-bold text-nf-text">{c.members.toLocaleString()}</p>
                    <p className="text-[10px] text-nf-dim">عضو</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {/* Favorite */}
                    <button onClick={() => toggleFavorite(c.name)}
                      className={cn("p-1.5 rounded-lg transition-colors",
                        c.isFavorite ? "text-yellow-400" : "text-nf-dim hover:text-yellow-400 opacity-0 group-hover:opacity-100")}>
                      <Star size={14} fill={c.isFavorite ? "currentColor" : "none"} />
                    </button>

                    {/* Dashboard (owner only) */}
                    {c.isOwner && (
                      <button onClick={() => onDashboardClick(c.name)}
                        className="p-1.5 rounded-lg text-nf-dim hover:text-nf-accent hover:bg-nf-accent/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="لوحة التحكم">
                        <Settings2 size={14} />
                      </button>
                    )}

                    {/* Joined badge */}
                    <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-nf-border-2 text-nf-dim bg-nf-secondary">
                      عضو
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[220px] shrink-0 sticky top-[calc(var(--nav-total-height)+16px)]">
          {/* Filter tabs */}
          <div className="rounded-xl border border-nf-border-2/50 overflow-hidden mb-3">
            <div className="px-3 py-2.5 border-b border-nf-border-2/30">
              <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">عرض</p>
            </div>
            {[
              { id: "all" as const, label: "كل المجتمعات", count: communities.length },
              { id: "favorites" as const, label: "المفضلة", count: communities.filter(c => c.isFavorite).length },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-medium transition-colors text-right",
                  tab === t.id ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover/50")}>
                <span>{t.label}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  tab === t.id ? "bg-nf-accent/15 text-nf-accent" : "bg-nf-secondary text-nf-dim")}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-nf-border-2/50 p-3 space-y-2">
            <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-2">إحصائيات</p>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-nf-dim">مجتمعات أسستها</span>
              <span className="font-bold text-nf-text">{communities.filter(c => c.isOwner).length}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-nf-dim">مجتمعات انضممت</span>
              <span className="font-bold text-nf-text">{communities.filter(c => !c.isOwner).length}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-nf-dim">مفضلة</span>
              <span className="font-bold text-nf-text">{communities.filter(c => c.isFavorite).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
