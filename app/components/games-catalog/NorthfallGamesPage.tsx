"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Crown,
  Dice5,
  ExternalLink,
  Filter,
  Flame,
  Gamepad2,
  Grid3X3,
  Heart,
  LayoutList,
  LogOut,
  Monitor,
  Search,
  Star,
  TrendingUp,
  User,
  X,
  Zap,
  Bookmark,
  Bell,
  Settings,
  HelpCircle,
  Plus,
  Calendar,
  Users,
} from "lucide-react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { GAMES, type Game } from "@/app/components/GamesPage";
import { db } from "@/lib/firebase";
import { trackImplicitInterest } from "@/lib/implicit-interest";
import GamesCatalogNavSidebar from "./GamesCatalogNavSidebar";
import { useData } from "@/app/components/DataProvider";
import { recommendGames } from "@/lib/recommendations";
import {
  addUserInterests,
  interestTagsFromGameGenres,
  mergeInterestsOrdered,
  normalizeInterestTags,
} from "@/lib/user-interests";
import { useAuth } from "@/app/components/AuthProvider";
import { cn } from "@/lib/utils";
import { goToAppView } from "@/lib/nav-app";
import DonateSupportPopup from "@/app/components/DonateSupportPopup";

type SortBy = "name" | "rating" | "year" | "oldest";
type ActiveTab = "all" | "followed" | "trending" | "new" | "best" | "hot";
type LayoutMode = "grid" | "list";

const platformShort: Record<string, string> = {
  PC: "PC",
  PS: "PS",
  PS5: "PS5",
  "Xbox Series": "XS",
  Xbox: "XB",
  Switch: "SW",
  Mobile: "MO",
  Wii: "WII",
};

function platformBadges(platforms: string[]) {
  const seen = new Set<string>();
  const badges: string[] = [];
  for (const p of platforms) {
    const label = platformShort[p] || p.slice(0, 3).toUpperCase();
    if (!seen.has(label)) {
      seen.add(label);
      badges.push(label);
    }
  }
  return badges.slice(0, 5);
}

function formatReleaseDate(year: number) {
  return `1 يناير ${year}`;
}

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function gameMatchesQuery(g: Game, raw: string) {
  const q = normalizeQuery(raw);
  if (!q) return true;
  return (
    g.name.toLowerCase().includes(q) ||
    g.developer.toLowerCase().includes(q) ||
    g.publisher.toLowerCase().includes(q) ||
    g.description.toLowerCase().includes(q) ||
    g.genre.some((gen) => gen.toLowerCase().includes(q)) ||
    g.platforms.some((p) => p.toLowerCase().includes(q))
  );
}

function buildSearchSuggestions(query: string, games: Game[], genres: string[]) {
  const q = normalizeQuery(query);
  if (!q) return { games: [] as Game[], genres: [] as string[], developers: [] as string[] };

  const matchedGames = games
    .filter((g) => gameMatchesQuery(g, q))
    .sort((a, b) => b.rating - a.rating || b.releaseYear - a.releaseYear)
    .slice(0, 8);

  const matchedGenres = genres.filter((g) => g.toLowerCase().includes(q)).slice(0, 8);

  const devSet = new Set<string>();
  for (const g of games) {
    if (g.developer.toLowerCase().includes(q)) devSet.add(g.developer);
    if (g.publisher.toLowerCase().includes(q)) devSet.add(g.publisher);
  }
  const developers = [...devSet].slice(0, 5);

  return { games: matchedGames, genres: matchedGenres, developers };
}

function GamesSearchBox({
  inputRef,
  draft,
  applied,
  onDraftChange,
  onApply,
  onPickGenre,
  allGenres,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  draft: string;
  applied: string;
  onDraftChange: (v: string) => void;
  onApply: (v: string) => void;
  onPickGenre: (genre: string) => void;
  allGenres: string[];
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const suggestions = useMemo(
    () => buildSearchSuggestions(draft, GAMES, allGenres),
    [draft, allGenres]
  );

  const flatItems = useMemo(() => {
    const items: { kind: "genre" | "dev" | "game"; label: string; game?: Game }[] = [];
    suggestions.genres.forEach((g) => items.push({ kind: "genre", label: g }));
    suggestions.developers.forEach((d) => items.push({ kind: "dev", label: d }));
    suggestions.games.forEach((g) => items.push({ kind: "game", label: g.name, game: g }));
    return items;
  }, [suggestions]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pickItem = (item: (typeof flatItems)[number]) => {
    if (item.kind === "genre") {
      onPickGenre(item.label);
      onDraftChange("");
      onApply("");
    } else {
      onApply(item.kind === "game" && item.game ? item.game.name : item.label);
      onDraftChange(item.kind === "game" && item.game ? item.game.name : item.label);
    }
    setOpen(false);
    setActiveIdx(-1);
  };

  const q = draft.trim();
  const showPanel = open && q.length > 0;
  const totalHits =
    suggestions.games.length + suggestions.genres.length + suggestions.developers.length;

  return (
    <div ref={boxRef} className="relative w-full games-search-bar">
      <div
        className={cn(
          "games-search-bar-inner flex items-center gap-2.5 h-11 w-full rounded-full overflow-hidden",
          "bg-white/[0.05] border border-white/[0.08]",
          "hover:bg-white/[0.07] hover:border-white/[0.11]",
          showPanel && "border-white/[0.14] bg-[#1a1a1a]",
          "focus-within:border-white/[0.14] focus-within:bg-[#1a1a1a] focus-within:ring-1 focus-within:ring-white/[0.06]"
        )}
      >
        <Search size={17} className="shrink-0 ms-3 text-white/40" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(e) => {
            onDraftChange(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, -1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (activeIdx >= 0 && flatItems[activeIdx]) pickItem(flatItems[activeIdx]);
              else if (q) {
                onApply(q);
                onDraftChange(q);
                setOpen(false);
              }
            } else if (e.key === "Escape") {
              onDraftChange("");
              onApply("");
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="ابحث عن لعبة، نوع، أو مطور..."
          className="flex-1 min-w-0 h-full py-0 pe-2 text-[15px] text-white placeholder:text-white/35 outline-none ring-0 border-0 shadow-none"
        />
        {applied && !draft && (
          <span className="shrink-0 max-w-[100px] truncate text-[10px] font-semibold text-white/45 me-1">
            {applied}
          </span>
        )}
        {draft ? (
          <button
            type="button"
            onClick={() => {
              onDraftChange("");
              onApply("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="shrink-0 me-2 p-1 rounded-md text-white/45 hover:text-white transition-colors"
            aria-label="مسح البحث"
          >
            <X size={15} />
          </button>
        ) : (
          <span className="hidden sm:inline shrink-0 me-3 text-[10px] font-medium text-white/30 tabular-nums">
            Ctrl+K
          </span>
        )}
      </div>

      {showPanel && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[60] rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.65)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
            <span className="text-[11px] font-bold text-white/40">اقتراحات</span>
            {totalHits > 0 && (
              <span className="text-[10px] text-white/30">{totalHits} نتيجة</span>
            )}
          </div>

          <div className="max-h-[min(360px,55vh)] overflow-y-auto p-1.5">
            {flatItems.length === 0 && (
              <p className="px-3 py-8 text-[13px] text-white/40 text-center">لا توجد نتائج</p>
            )}

            {flatItems.map((item, idx) => (
              <button
                key={`${item.kind}-${item.game?.id ?? item.label}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickItem(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-start transition-colors",
                  activeIdx === idx ? "bg-white/10" : "hover:bg-white/[0.04]"
                )}
              >
                {item.kind === "game" && item.game ? (
                  <>
                    <div className="w-9 h-12 shrink-0 rounded-md overflow-hidden bg-black/50">
                      <img src={item.game.cover} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">{item.game.name}</p>
                      <p className="text-[11px] text-white/40 truncate">{item.game.genre.join(" · ")}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-amber-400/90">{item.game.rating.toFixed(1)}</span>
                  </>
                ) : (
                  <>
                    <span
                      className={cn(
                        "shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                        item.kind === "genre" ? "bg-emerald-500/15 text-emerald-400/90" : "bg-white/8 text-white/50"
                      )}
                    >
                      {item.kind === "genre" ? "نوع" : "استوديو"}
                    </span>
                    <span className="flex-1 text-[13px] font-semibold text-white/85 truncate">{item.label}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onApply(q);
              onDraftChange(q);
              setOpen(false);
            }}
            className="w-full px-4 py-3 text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/[0.04] border-t border-white/5 transition-colors"
          >
            عرض كل النتائج ({totalHits || "—"})
          </button>
        </div>
      )}
    </div>
  );
}

function GameCardMetaPanel({
  game,
  rank,
  onShowSimilar,
}: {
  game: Game;
  rank: number;
  onShowSimilar: (genre: string) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%-4px)] z-50 rounded-b-lg bg-nf-card border border-nf-border-2 border-t-0 shadow-lg p-3 pt-2 space-y-2.5 text-[12px] select-text">
      <p className="text-[11px] text-nf-muted leading-relaxed line-clamp-2">{game.description}</p>

      <div className="grid grid-cols-1 gap-2 text-[11px]">
        <div>
          <span className="text-nf-dim block mb-0.5">تاريخ الإصدار</span>
          <span className="text-nf-text font-semibold">{formatReleaseDate(game.releaseYear)}</span>
        </div>
        <div>
          <span className="text-nf-dim block mb-1">الأنواع</span>
          <div className="flex flex-wrap gap-1">
            {game.genre.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded-md bg-nf-secondary text-nf-text text-[10px] font-semibold border border-nf-border-2/60">
                {g}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-nf-dim block mb-0.5">المطور</span>
          <span className="text-nf-text">{game.developer}</span>
        </div>
        <div>
          <span className="text-nf-dim block mb-0.5">الناشر</span>
          <span className="text-nf-text">{game.publisher}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-nf-dim">الترتيب: <span className="text-nf-text font-semibold">#{rank}</span></span>
          <span className="text-nf-dim">التقييم: <span className="text-amber-500 font-semibold">{game.rating.toFixed(1)}</span></span>
          <span className="text-nf-dim">اللاعبون: <span className="text-nf-text">{game.players}</span></span>
        </div>
        <div>
          <span className="text-nf-dim block mb-1">المنصات</span>
          <div className="flex flex-wrap gap-1">
            {game.platforms.map((p) => (
              <span key={p} className="px-1.5 py-0.5 rounded bg-nf-secondary text-[10px] text-nf-muted font-bold border border-nf-border-2/40">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {game.steamUrl && (
        <a
          href={game.steamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-nf-muted hover:text-nf-text transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} /> صفحة Steam
        </a>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onShowSimilar(game.genre[0]);
        }}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-nf-secondary hover:bg-nf-hover text-[12px] font-semibold text-nf-text transition-colors border border-nf-border-2/50"
      >
        عرض ألعاب مشابهة
        <ChevronLeft size={14} className="opacity-60" />
      </button>
    </div>
  );
}

function GameCover({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("w-full h-auto block select-none pointer-events-none", className)}
      loading="lazy"
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function dropItemCls(active: boolean) {
  return cn(
    "w-full text-start px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors",
    active ? "bg-white/10 text-white" : "text-nf-dim hover:bg-nf-hover hover:text-nf-text"
  );
}

function GamesFilterDropdown({
  label,
  open,
  onToggle,
  onClose,
  children,
  active,
}: {
  label: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-semibold transition-colors border",
          active
            ? "bg-white/10 text-white border-white/20"
            : "bg-nf-secondary/80 text-nf-muted hover:bg-nf-hover hover:text-nf-text border-nf-border-2"
        )}
      >
        {label}
        <ChevronDown size={14} className={cn("opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full end-0 mt-1 min-w-[160px] max-h-[260px] overflow-y-auto rounded-lg bg-nf-primary border border-nf-border-2 shadow-2xl z-50 p-1.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GamesProfileMenu({
  user,
  loading,
  favoriteCount,
  onSignIn,
  onLogout,
}: {
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  favoriteCount: number;
  onSignIn: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [userKarma, setUserKarma] = useState(0);
  const [userXp, setUserXp] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!user) {
      setUserKarma(0);
      setUserXp(0);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserKarma(snap.data().karma || 0);
        setUserXp(snap.data().xp || 0);
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="hidden sm:flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-nf-secondary animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={onSignIn}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/55 hover:bg-white/8 hover:text-white transition-colors"
      >
        تسجيل الدخول
      </button>
    );
  }

  const name = user.displayName || user.email?.split("@")[0] || "مستخدم";
  const verified = user.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2";

  const uid = user.uid;
  const goApp = (view: string, extra: Record<string, string> = {}) => {
    setOpen(false);
    goToAppView(view, { uid, ...extra });
  };

  const menuItems = [
    { icon: User, label: "البروفايل", action: () => goApp("profile") },
    { icon: Gamepad2, label: "ألعابي", action: () => goApp("profile", { tab: "games" }) },
    { icon: Bookmark, label: "المحفوظات", action: () => goApp("profile", { tab: "saved" }) },
    { icon: Bell, label: "الإشعارات", action: () => goApp("notifs") },
    { icon: Plus, label: "إنشاء منشور", action: () => goApp("create") },
    { icon: Settings, label: "الإعدادات", action: () => goApp("settings") },
    { icon: HelpCircle, label: "المساعدة", action: () => goApp("help") },
  ];

  return (
    <div ref={ref} className="relative hidden sm:flex items-center gap-1.5">
      {favoriteCount > 0 && (
        <button
          type="button"
          onClick={() => goApp("profile", { tab: "games" })}
          title="ألعابي المفضلة"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/55 hover:bg-white/8 hover:text-white transition-colors"
        >
          <Heart size={15} className="text-red-400" fill="currentColor" />
          <span className="absolute top-0.5 start-0.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center px-0.5">
            {favoriteCount > 99 ? "99+" : favoriteCount}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/8 transition-colors border border-transparent hover:border-white/10"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={name} className="w-7 h-7 rounded-full object-cover border border-nf-border-2" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center border border-nf-border-2">
            <User size={13} className="text-nf-muted" />
          </div>
        )}
        <ChevronDown size={10} className={cn("text-nf-dim shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1 end-0 w-[260px] bg-[#202020] border border-white/10 rounded-lg z-[100] overflow-hidden shadow-xl"
            dir="rtl"
          >
            <div className="px-3 py-2.5 border-b border-nf-border-2">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-nf-border-2" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center border border-nf-border-2">
                    <User size={18} className="text-nf-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-nf-text truncate flex items-center gap-1">
                    {name}
                    {verified && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[12px] h-[12px] inline" />}
                  </p>
                  <p className="text-[10px] text-nf-dim truncate">{user.email || ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-nf-dim">
                  <span className="text-nf-text font-bold">{Math.max(0, Math.round(userKarma))}</span> صيت
                </span>
                <span className="text-[10px] text-nf-dim">
                  <span className="text-amber-400 font-bold">{userXp}</span> XP
                </span>
                {favoriteCount > 0 && (
                  <span className="text-[10px] text-nf-dim">
                    <span className="text-red-400 font-bold">{favoriteCount}</span>/20 ألعاب
                  </span>
                )}
              </div>
            </div>

            <div className="py-0.5">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors text-right"
                >
                  <item.icon size={14} className="shrink-0 text-nf-dim" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-nf-border-2 py-0.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-red-400 hover:bg-red-400/5 transition-colors"
              >
                <LogOut size={14} className="shrink-0" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GamesCatalogCard({
  game,
  rank,
  isFav,
  onFav,
  onShowSimilar,
  onEngage,
  layout,
}: {
  game: Game;
  rank: number;
  isFav: boolean;
  onFav: () => void;
  onShowSimilar: (genre: string) => void;
  onEngage?: () => void;
  layout: LayoutMode;
}) {
  const [hovered, setHovered] = useState(false);
  const badges = platformBadges(game.platforms);

  if (layout === "list") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-nf-card hover:bg-nf-secondary transition-colors border border-transparent hover:border-white/5">
        <div className="w-[72px] shrink-0 rounded-md overflow-hidden bg-[#1a1a1a]">
          <GameCover src={game.cover} alt={game.name} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-white truncate">{game.name}</p>
          <p className="text-[12px] text-white/45 mt-0.5">{game.developer} · {game.releaseYear}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {game.genre.slice(0, 3).map((g) => (
              <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/55">{g}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-[12px] text-amber-400 font-semibold">
            <Star size={12} className="fill-amber-400" /> {game.rating.toFixed(1)}
          </span>
          <button
            type="button"
            onClick={onFav}
            className={cn(
              "p-2 rounded-md transition-colors",
              isFav ? "text-red-400 bg-red-500/10" : "text-white/35 hover:text-red-400 hover:bg-white/5"
            )}
            aria-label={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
          </button>
          {game.steamUrl && (
            <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md text-white/35 hover:text-white hover:bg-white/5" aria-label="صفحة Steam">
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn("relative rounded-lg transition-all duration-200 select-none", hovered && "z-40")}
      onMouseEnter={() => {
        setHovered(true);
        onEngage?.();
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "bg-nf-card rounded-lg overflow-hidden transition-all duration-200 border border-transparent",
          hovered && "border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
        )}
      >
      <div className="relative bg-[#0f0f0f]">
        <GameCover src={game.cover} alt={game.name} className={cn("transition-transform duration-300", hovered && "scale-[1.01]")} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          className={cn(
            "absolute top-2 start-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg",
            isFav
              ? "bg-red-500 text-white opacity-100"
              : "bg-black/55 text-white/70 opacity-0 hover:bg-red-500 hover:text-white",
              (hovered || isFav) && "opacity-100"
          )}
          aria-label={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          <Heart size={15} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {badges.map((label) => (
            <span
              key={label}
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-nf-secondary text-[9px] font-bold text-nf-muted border border-nf-border-2/40"
            >
              {label}
            </span>
          ))}
        </div>

        <h3 className="text-[15px] font-bold text-nf-text leading-snug line-clamp-2 mb-1.5">{game.name}</h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {game.genre.map((g) => (
            <span key={g} className="text-[9px] px-1.5 py-0.5 rounded bg-nf-secondary text-nf-muted font-semibold border border-nf-border-2/50">
              {g}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFav();
            }}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-semibold transition-colors border border-nf-border-2/40",
              isFav
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-nf-secondary text-nf-text hover:bg-nf-hover"
            )}
          >
            <Heart size={13} fill={isFav ? "currentColor" : "none"} />
            {isFav ? "في المفضلة" : "أضف للمفضلة"}
          </button>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-nf-secondary text-[12px] font-semibold text-nf-text border border-nf-border-2/40">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            {game.rating.toFixed(1)}
          </span>
        </div>
      </div>
      </div>

      {hovered && <GameCardMetaPanel game={game} rank={rank} onShowSimilar={onShowSimilar} />}
    </article>
  );
}

function RandomGameModal({
  game,
  isFav,
  onClose,
  onPickAnother,
  onToggleFav,
}: {
  game: Game;
  isFav: boolean;
  onClose: () => void;
  onPickAnother: () => void;
  onToggleFav: () => void;
}) {
  const ratingColor =
    game.rating >= 4.5 ? "text-emerald-400" : game.rating >= 4.0 ? "text-amber-400" : "text-nf-dim";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-nf-primary border border-nf-border-2 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-[#0f0f0f] max-h-[280px] overflow-hidden">
          <GameCover src={game.cover} alt={game.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-nf-primary via-nf-primary/20 to-transparent pointer-events-none" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 start-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-nf-muted hover:text-nf-text transition-colors"
          >
            <X size={14} />
          </button>
          <span className="absolute top-2 end-2 text-[9px] px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-sm text-white font-bold border border-white/20">
            عشوائي
          </span>
          <button
            type="button"
            onClick={onToggleFav}
            className={cn(
              "absolute bottom-2 start-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-sm transition-colors",
              isFav ? "bg-red-500/90 text-white" : "bg-black/50 text-nf-text hover:bg-red-500/80 hover:text-white"
            )}
          >
            <Heart size={12} fill={isFav ? "currentColor" : "none"} />
            {isFav ? "في المفضلة" : "أضف للمفضلة"}
          </button>
        </div>

        <div className="p-4 -mt-2 relative">
          <h3 className="text-[17px] font-bold text-nf-text mb-1 leading-snug">{game.name}</h3>
          <p className="text-[11px] text-nf-dim mb-3">
            {game.developer} · {game.publisher}
          </p>

          <p className="text-[12px] text-nf-muted leading-relaxed mb-3 line-clamp-4">{game.description}</p>

          <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
            <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-nf-secondary/80 border border-nf-border-2">
              <Star size={12} className={cn("fill-current shrink-0", ratingColor)} />
              <span className={cn("font-bold", ratingColor)}>{game.rating.toFixed(1)}</span>
              <span className="text-nf-dim">تقييم</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-nf-secondary/80 border border-nf-border-2 text-nf-dim">
              <Calendar size={12} className="shrink-0" />
              <span className="text-nf-text font-semibold">{game.releaseYear}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-nf-secondary/80 border border-nf-border-2 text-nf-dim">
              <Users size={12} className="shrink-0" />
              <span className="text-nf-text font-semibold">{game.players}</span>
              <span>لاعب</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-nf-secondary/80 border border-nf-border-2 text-nf-dim">
              <Monitor size={12} className="shrink-0" />
              <span className="text-nf-text font-semibold truncate">{game.platforms.slice(0, 2).join("، ")}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {game.genre.map((g) => (
              <span key={g} className="text-[10px] px-2 py-0.5 rounded-lg bg-nf-secondary border border-nf-border-2 text-nf-text font-semibold">
                {g}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {game.steamUrl && (
              <a
                href={game.steamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/12 text-white text-[12px] font-bold hover:bg-white/18 transition-colors border border-white/10"
              >
                <ExternalLink size={12} /> صفحة Steam
              </a>
            )}
            <button
              type="button"
              onClick={onPickAnother}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/8 text-white/90 text-[12px] font-bold hover:bg-white/12 transition-colors border border-white/10"
            >
              <Dice5 size={12} /> لعبة أخرى
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function NorthfallGamesPage() {
  const { user, loading, signIn, logout } = useAuth();
  const { userInterests } = useData();
  const searchRef = useRef<HTMLInputElement>(null);

  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavModal, setShowFavModal] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("rating");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [randomGame, setRandomGame] = useState<Game | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [showGenreDrop, setShowGenreDrop] = useState(false);
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [showSortDrop, setShowSortDrop] = useState(false);

  const allGenres = useMemo(
    () => [...new Set(GAMES.flatMap((g) => g.genre))].sort((a, b) => a.localeCompare(b, "ar")),
    []
  );
  const allPlatforms = useMemo(
    () => [...new Set(GAMES.flatMap((g) => g.platforms))].sort(),
    []
  );

  const topGenres = useMemo(() => {
    const counts = new Map<string, number>();
    GAMES.forEach((g) => g.genre.forEach((gen) => counts.set(gen, (counts.get(gen) || 0) + 1)));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([name]) => name);
  }, []);

  const ratingRank = useMemo(() => {
    const sorted = [...GAMES].sort((a, b) => b.rating - a.rating || b.releaseYear - a.releaseYear);
    const map = new Map<string, number>();
    sorted.forEach((g, i) => map.set(g.id, i + 1));
    return map;
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "users", user.uid, "games", "favorites"),
      (s) => setFavoriteIds(s.exists() ? s.data().ids || [] : []),
      () => setFavoriteIds([])
    );
    return () => unsub();
  }, [user]);

  const effectiveInterests = useMemo(() => {
    const fromFavorites = favoriteIds.flatMap((id) => {
      const g = GAMES.find((x) => x.id === id);
      return g ? interestTagsFromGameGenres(g.genre) : [];
    });
    return normalizeInterestTags([...fromFavorites, ...userInterests]);
  }, [favoriteIds, userInterests]);

  const forYouGames = useMemo(() => {
    if (favoriteIds.length === 0) return [];
    return recommendGames(effectiveInterests, {
      maxResults: 6,
      favoriteIds,
      excludeIds: [],
    });
  }, [effectiveInterests, favoriteIds]);

  const trackGameEngage = useCallback(
    (game: Game) => {
      if (!user) return;
      trackImplicitInterest("game", game.id, interestTagsFromGameGenres(game.genre), user.uid);
    },
    [user]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const saveFavorites = async (ids: string[]) => {
    if (!user) return;
    setFavoriteIds(ids);
    try {
      await setDoc(doc(db, "users", user.uid, "games", "favorites"), { ids });
    } catch (e) {
      console.error("[NorthfallGamesPage] Save error:", e);
    }
  };

  const toggleFavorite = (gameId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    const game = GAMES.find((g) => g.id === gameId);
    if (favoriteIds.includes(gameId)) {
      const next = favoriteIds.filter((id) => id !== gameId);
      setFavoriteIds(next);
      void saveFavorites(next);
    } else {
      if (favoriteIds.length >= 20) {
        setShowFavModal(true);
        return;
      }
      const next = [...favoriteIds, gameId];
      setFavoriteIds(next);
      void saveFavorites(next);
      if (game) {
        const tags = interestTagsFromGameGenres(game.genre);
        void addUserInterests(user.uid, tags, mergeInterestsOrdered(userInterests, tags));
      }
    }
  };

  const filtered = useMemo(() => {
    return GAMES.filter((g) => {
      const ms = gameMatchesQuery(g, searchApplied);
      const mg = !genreFilter || g.genre.includes(genreFilter);
      const mp = !platformFilter || g.platforms.includes(platformFilter);
      const mf = !showFavOnly || favoriteIds.includes(g.id);
      const mt =
        activeTab === "all"
          ? true
          : activeTab === "followed"
            ? favoriteIds.includes(g.id)
            : activeTab === "trending"
              ? g.rating >= 4.5
              : activeTab === "new"
                ? g.releaseYear >= 2022
                : activeTab === "best"
                  ? g.rating >= 4.7
                  : activeTab === "hot"
                    ? g.rating >= 4.3 && g.releaseYear >= 2020
                    : true;
      return ms && mg && mp && mf && mt;
    }).sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating || b.releaseYear - a.releaseYear;
      if (sortBy === "year") return b.releaseYear - a.releaseYear;
      if (sortBy === "oldest") return a.releaseYear - b.releaseYear;
      return a.name.localeCompare(b.name, "ar");
    });
  }, [searchApplied, genreFilter, platformFilter, showFavOnly, favoriteIds, activeTab, sortBy]);

  const pickRandomGame = () => {
    const pool = filtered.length > 0 ? filtered : GAMES;
    setRandomGame(pool[Math.floor(Math.random() * pool.length)]);
  };

  const sortOptions: { id: SortBy; label: string }[] = [
    { id: "rating", label: "التقييم" },
    { id: "name", label: "الاسم" },
    { id: "year", label: "الأحدث" },
    { id: "oldest", label: "الأقدم" },
  ];

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "all", label: "الكل", icon: <Gamepad2 size={12} />, count: GAMES.length },
    { id: "followed", label: "المفضلة", icon: <Heart size={12} />, count: favoriteIds.length },
    { id: "trending", label: "رائج", icon: <TrendingUp size={12} />, count: GAMES.filter((g) => g.rating >= 4.5).length },
    { id: "new", label: "جديد", icon: <Zap size={12} />, count: GAMES.filter((g) => g.releaseYear >= 2022).length },
    { id: "best", label: "الأفضل", icon: <Crown size={12} />, count: GAMES.filter((g) => g.rating >= 4.7).length },
    { id: "hot", label: "شائع", icon: <Flame size={12} />, count: GAMES.filter((g) => g.rating >= 4.3 && g.releaseYear >= 2020).length },
  ];

  const closeAllDropdowns = () => {
    setShowGenreDrop(false);
    setShowPlatformDrop(false);
    setShowSortDrop(false);
  };

  return (
    <div className="min-h-screen bg-nf-body text-nf-text font-sans" dir="rtl">
      <DonateSupportPopup />
      <header className="sticky top-0 z-50 bg-nf-body border-b border-nf-border-2/60">
        <div className="flex items-center gap-4 px-4 lg:px-6 h-14">
          <a href="/games" className="shrink-0 flex flex-col items-start leading-none gap-0.5 hover:opacity-90 transition-opacity">
            <span className="text-[9px] font-bold text-nf-dim tracking-wide">ألعاب</span>
            <span className="font-en text-[18px] font-bold text-nf-text tracking-tight">NorthFall</span>
          </a>

          <div className="flex-1 max-w-3xl mx-auto">
            <GamesSearchBox
              inputRef={searchRef}
              draft={searchDraft}
              applied={searchApplied}
              onDraftChange={setSearchDraft}
              onApply={setSearchApplied}
              onPickGenre={(g) => {
                setGenreFilter(g);
                setSearchDraft("");
                setSearchApplied("");
              }}
              allGenres={allGenres}
            />
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <GamesProfileMenu
              user={user}
              loading={loading}
              favoriteCount={favoriteIds.length}
              onSignIn={() => signIn()}
              onLogout={() => logout()}
            />
          </div>
        </div>
      </header>

      <div className="flex w-full max-w-[100vw]">
        <GamesCatalogNavSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setGenreFilter(null);
            setPlatformFilter(null);
          }}
          genreFilter={genreFilter}
          onGenreFilter={setGenreFilter}
          platformFilter={platformFilter}
          onPlatformFilter={setPlatformFilter}
          topGenres={topGenres}
          platformOptions={allPlatforms}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-8 max-w-[min(100%,1400px)]">
        <div className="mb-6">
          <h1 className="text-[32px] lg:text-[40px] font-bold text-nf-text tracking-tight leading-tight">
            جديد ورائج
          </h1>
          <p className="text-[14px] text-nf-dim mt-1">
            {filtered.length} لعبة
            {searchApplied ? ` · نتائج «${searchApplied}»` : " · بناءً على التقييم وتاريخ الإصدار"}
          </p>
        </div>

        {favoriteIds.length > 0 && forYouGames.length > 0 && (
          <section className="mb-10 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-white">مقترح لك</h2>
                <p className="text-[12px] text-white/40 mt-0.5">مبني على ألعابك المفضلة</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
                <Heart size={12} className="text-red-400" fill="currentColor" />
                {favoriteIds.length} مفضلة
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-start">
              {forYouGames.map((game) => (
                <GamesCatalogCard
                  key={`foryou-${game.id}`}
                  game={game}
                  rank={ratingRank.get(game.id) || 0}
                  isFav={favoriteIds.includes(game.id)}
                  onFav={() => toggleFavorite(game.id)}
                  onShowSimilar={(genre) => {
                    setGenreFilter(genre);
                    closeAllDropdowns();
                  }}
                  onEngage={() => trackGameEngage(game)}
                  layout="grid"
                />
              ))}
            </div>
          </section>
        )}

        <div className="mb-5">
          <p className="text-[12px] font-bold text-nf-dim mb-2">تصفح حسب النوع</p>
          <div className="flex flex-wrap gap-1.5">
            {topGenres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenreFilter(genreFilter === g ? null : g)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors",
                  genreFilter === g
                    ? "bg-nf-accent/15 text-nf-text border-nf-accent/30"
                    : "bg-nf-secondary text-nf-muted border-nf-border-2 hover:bg-nf-hover hover:text-nf-text"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border",
                activeTab === tab.id
                  ? "bg-nf-accent/15 text-nf-text border-nf-accent/30"
                  : "bg-nf-secondary/60 text-nf-muted border-nf-border-2 hover:bg-nf-hover hover:text-nf-text"
              )}
            >
              {tab.icon}
              {tab.label}
              <span className="text-[10px] opacity-50">{tab.count}</span>
            </button>
          ))}
          <div className="h-5 w-px bg-nf-border-2 mx-1 shrink-0" />
          <button
            type="button"
            onClick={pickRandomGame}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-nf-secondary/60 text-nf-muted border border-nf-border-2 hover:bg-nf-hover hover:text-nf-text transition-colors"
          >
            <Dice5 size={12} /> عشوائي
          </button>
          {favoriteIds.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFavOnly(!showFavOnly)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
                showFavOnly
                  ? "bg-red-500/15 text-red-400 border border-red-500/25"
                  : "bg-nf-secondary/60 text-nf-muted border border-nf-border-2 hover:bg-nf-hover hover:text-nf-text"
              )}
            >
              <Heart size={12} fill={showFavOnly ? "currentColor" : "none"} /> المفضلة فقط
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <GamesFilterDropdown
              label={
                <>
                  <Filter size={13} /> {genreFilter || "النوع"}
                </>
              }
              open={showGenreDrop}
              active={!!genreFilter}
              onToggle={() => {
                setShowGenreDrop(!showGenreDrop);
                setShowPlatformDrop(false);
                setShowSortDrop(false);
              }}
              onClose={() => setShowGenreDrop(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setGenreFilter(null);
                  setShowGenreDrop(false);
                }}
                className={dropItemCls(!genreFilter)}
              >
                كل الأنواع
              </button>
              {allGenres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGenreFilter(genreFilter === g ? null : g);
                    setShowGenreDrop(false);
                  }}
                  className={dropItemCls(genreFilter === g)}
                >
                  {g}
                </button>
              ))}
            </GamesFilterDropdown>

            <GamesFilterDropdown
              label={
                <>
                  <Monitor size={13} /> {platformFilter || "المنصة"}
                </>
              }
              open={showPlatformDrop}
              active={!!platformFilter}
              onToggle={() => {
                setShowPlatformDrop(!showPlatformDrop);
                setShowGenreDrop(false);
                setShowSortDrop(false);
              }}
              onClose={() => setShowPlatformDrop(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setPlatformFilter(null);
                  setShowPlatformDrop(false);
                }}
                className={dropItemCls(!platformFilter)}
              >
                كل المنصات
              </button>
              {allPlatforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatformFilter(platformFilter === p ? null : p);
                    setShowPlatformDrop(false);
                  }}
                  className={dropItemCls(platformFilter === p)}
                >
                  {p}
                </button>
              ))}
            </GamesFilterDropdown>

            <GamesFilterDropdown
              label={<>ترتيب: {sortOptions.find((s) => s.id === sortBy)?.label}</>}
              open={showSortDrop}
              onToggle={() => {
                setShowSortDrop(!showSortDrop);
                setShowGenreDrop(false);
                setShowPlatformDrop(false);
              }}
              onClose={() => setShowSortDrop(false)}
            >
              {sortOptions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSortBy(s.id);
                    setShowSortDrop(false);
                  }}
                  className={dropItemCls(sortBy === s.id)}
                >
                  {s.label}
                </button>
              ))}
            </GamesFilterDropdown>

            {(genreFilter || platformFilter) && (
              <div className="flex items-center gap-1.5">
                {genreFilter && (
                  <button
                    type="button"
                    onClick={() => setGenreFilter(null)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[11px] text-white/80"
                  >
                    {genreFilter} <X size={10} />
                  </button>
                )}
                {platformFilter && (
                  <button
                    type="button"
                    onClick={() => setPlatformFilter(null)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[11px] text-white/80"
                  >
                    {platformFilter} <X size={10} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setGenreFilter(null);
                    setPlatformFilter(null);
                  }}
                  className="text-[11px] text-white/40 hover:text-red-400"
                >
                  مسح الكل
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-white/40">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={cn("p-2 rounded transition-colors", layout === "grid" ? "bg-[#202020] text-white" : "hover:bg-[#202020]")}
              aria-label="عرض شبكي"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              className={cn("p-2 rounded transition-colors", layout === "list" ? "bg-[#202020] text-white" : "hover:bg-[#202020]")}
              aria-label="عرض قائمة"
            >
              <LayoutList size={16} />
            </button>
          </div>
        </div>

        {layout === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-start">
            {filtered.map((game) => (
              <GamesCatalogCard
                key={game.id}
                game={game}
                rank={ratingRank.get(game.id) || 0}
                isFav={favoriteIds.includes(game.id)}
                onFav={() => toggleFavorite(game.id)}
                onShowSimilar={(genre) => {
                  setGenreFilter(genre);
                  closeAllDropdowns();
                }}
                onEngage={() => trackGameEngage(game)}
                layout="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((game) => (
              <GamesCatalogCard
                key={game.id}
                game={game}
                rank={ratingRank.get(game.id) || 0}
                isFav={favoriteIds.includes(game.id)}
                onFav={() => toggleFavorite(game.id)}
                onShowSimilar={(genre) => setGenreFilter(genre)}
                onEngage={() => trackGameEngage(game)}
                layout="list"
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#202020] flex items-center justify-center mx-auto mb-4">
              <Gamepad2 size={28} className="text-white/25" />
            </div>
            <p className="text-[15px] font-bold text-white/70">لا توجد نتائج</p>
            <p className="text-[12px] text-white/35 mt-1 mb-4">جرّب تغيير الفلاتر أو كلمات البحث</p>
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                setSearchApplied("");
                setGenreFilter(null);
                setPlatformFilter(null);
                setActiveTab("all");
                setShowFavOnly(false);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-[12px] font-semibold hover:bg-white/15"
            >
              مسح الفلاتر
            </button>
          </div>
        )}
      </main>
      </div>

      <AnimatePresence>
        {randomGame && (
          <RandomGameModal
            game={randomGame}
            isFav={favoriteIds.includes(randomGame.id)}
            onClose={() => setRandomGame(null)}
            onPickAnother={pickRandomGame}
            onToggleFav={() => toggleFavorite(randomGame.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFavModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFavModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-nf-primary border border-nf-border-2 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <Heart size={24} className="text-red-400" />
              </div>
              <h3 className="text-[15px] font-bold text-nf-text mb-1">وصلت للحد الأقصى</h3>
              <p className="text-[12px] text-nf-muted mb-4">يمكنك اختيار 20 لعبة فقط في بروفايلك. أزل واحدة أولاً ثم أضف الجديدة.</p>
              <button
                type="button"
                onClick={() => setShowFavModal(false)}
                className="px-5 py-2 rounded-xl bg-nf-accent text-white text-[12px] font-bold hover:opacity-90 transition-opacity"
              >
                فهمت
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-nf-card border border-white/10 rounded-2xl p-6 max-w-xs w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-white/70" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1">سجّل دخولك</h3>
              <p className="text-[12px] text-white/50 mb-4">استخدم نفس حساب NorthFall لحفظ الألعاب في بروفايلك.</p>
              <button
                type="button"
                onClick={async () => {
                  await signIn();
                  setShowLoginPrompt(false);
                }}
                className="w-full px-5 py-2.5 rounded-lg bg-white text-black text-[12px] font-bold hover:bg-white/90 mb-2"
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="text-[12px] text-white/40 hover:text-white"
              >
                إلغاء
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
