"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { cn } from "@/lib/utils";
import { Search, Star, Settings2, Plus, Shield, ArrowRight } from "lucide-react";

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
  const { communities: allComms, joinedCommunities: joinedNames, favoriteCommunities } = useData();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const favorites = new Set(favoriteCommunities);

  useEffect(() => {
    if (!user || allComms.length === 0) {
      setLoading(false);
      return;
    }
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
          let desc = c.shortDesc || "";
          if (!desc) {
            const commSnap = await getDoc(doc(db, "communities", c.name)).catch(() => null);
            if (commSnap?.exists()) desc = commSnap.data().shortDesc || "";
          }
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
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          if (a.isOwner && !b.isOwner) return -1;
          if (!a.isOwner && b.isOwner) return 1;
          return (b.members || 0) - (a.members || 0);
        });
        setCommunities(list);
      } catch {
        /* silent */
      }
      setLoading(false);
    })();
  }, [user, allComms, joinedNames, favoriteCommunities]);

  const toggleFavorite = async (name: string) => {
    if (!user) return;
    const next = !favorites.has(name);
    setCommunities((prev) => prev.map((c) => (c.name === name ? { ...c, isFavorite: next } : c)));
    try {
      const ref = doc(db, "users", user.uid, "communities", name);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { isFavorite: next });
      } else {
        await setDoc(ref, { name, joinedAt: new Date().toISOString(), isFavorite: next });
      }
    } catch {
      /* silent */
    }
  };

  const filtered = communities
    .filter((c) => (tab === "favorites" ? c.isFavorite : true))
    .filter((c) => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full max-w-[960px] mx-auto" style={{ direction: "rtl" }}>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-text mb-4 transition-colors"
      >
        <ArrowRight size={14} />
        العودة
      </button>

      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-[20px] font-bold text-nf-text tracking-tight">إدارة المجتمعات</h1>
        <button
          type="button"
          onClick={onCreateCommunity}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-nf-text text-nf-body text-[13px] font-bold hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={14} />
          إنشاء مجتمع
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="relative mb-5">
            <Search size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="تصفية مجتمعاتك..."
              className="w-full rounded-full border border-nf-border-2 bg-transparent py-2.5 pr-11 pl-4 text-[14px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[72px] bg-nf-secondary/15 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-nf-dim">
              <p className="text-[15px] font-medium mb-1">
                {tab === "favorites" ? "لا توجد مجتمعات مفضلة" : "لا توجد مجتمعات منضم إليها"}
              </p>
              <p className="text-[12px]">انضم لمجتمع أو أنشئ واحداً جديداً</p>
            </div>
          ) : (
            <div className="divide-y divide-nf-border-2/25">
              {filtered.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-4 py-4 px-1 group cursor-pointer hover:bg-nf-secondary/10 rounded-lg transition-colors"
                  onClick={() => onCommunityClick(c.name)}
                >
                  {c.img ? (
                    <img src={c.img} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-[11px] text-nf-accent font-bold shrink-0">
                      n/
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <span className="text-[15px] font-semibold text-nf-text">n/{c.name}</span>
                      {c.isOwner && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-nf-accent/10 text-nf-accent">مؤسس</span>
                      )}
                      {c.isMod && !c.isOwner && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 flex items-center gap-0.5">
                          <Shield size={8} /> ناظم
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-nf-dim truncate mt-0.5 max-w-md mr-auto">
                      {c.desc || `${c.members.toLocaleString()} عضو`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(c.name)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        c.isFavorite ? "text-yellow-400" : "text-nf-dim hover:text-yellow-400"
                      )}
                      aria-label="مفضلة"
                    >
                      <Star size={18} fill={c.isFavorite ? "currentColor" : "none"} strokeWidth={c.isFavorite ? 0 : 1.5} />
                    </button>
                    {c.isOwner && (
                      <button
                        type="button"
                        onClick={() => onDashboardClick(c.name)}
                        className="p-2 rounded-lg text-nf-dim hover:text-nf-accent transition-colors"
                        title="لوحة التحكم"
                      >
                        <Settings2 size={16} />
                      </button>
                    )}
                    <span className="px-4 py-1.5 rounded-full text-[12px] font-semibold border border-nf-border-2 text-nf-muted min-w-[72px] text-center">
                      منضم
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="w-[220px] shrink-0 sticky top-[calc(var(--nav-total-height)+16px)] hidden sm:block">
          <nav className="rounded-xl border border-nf-border-2/40 overflow-hidden bg-nf-secondary/10">
            {[
              { id: "all" as const, label: "كل المجتمعات" },
              { id: "favorites" as const, label: "المفضلة" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "w-full text-right px-4 py-3 text-[14px] transition-colors border-b border-nf-border-2/20 last:border-0",
                  tab === t.id ? "bg-nf-hover text-nf-text font-bold" : "text-nf-muted hover:bg-nf-hover/60"
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>

      <div className="flex sm:hidden gap-2 mt-4">
        {[
          { id: "all" as const, label: "الكل" },
          { id: "favorites" as const, label: "المفضلة" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-2 rounded-lg text-[12px] font-medium border",
              tab === t.id ? "bg-nf-hover border-nf-border-2 text-nf-text" : "border-nf-border-2/40 text-nf-dim"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
