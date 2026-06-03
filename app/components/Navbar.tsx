"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, User, ChevronDown, X, FileText, Users, Hash, TrendingUp, Clock, ArrowUp, MessageSquare, Sparkles, RotateCcw, Flame, Settings, LogOut, Bookmark, Shield, HelpCircle, Plus, Sun, Moon } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { updateAccountCache } from "@/lib/account-switcher";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "./I18nProvider";
import { resolveCategoryDisplay } from "@/lib/community-categories";
import { fetchSearchTrending, type SearchTrendingSnapshot, type TrendingTopic } from "@/lib/search-trending";
import { textDirAttr } from "@/lib/display-text";
import { BOWIE_KNIFE_LABEL, type BowieGlitchDetail } from "@/lib/bowie-easter-egg";


const sortOptions = [
  { id: "relevance" as const, icon: Sparkles, key: "search.sortRelevance" },
  { id: "newest" as const, icon: Clock, key: "search.sortNewest" },
  { id: "top" as const, icon: Flame, key: "search.sortTop" },
];

const filterOptions = [
  { id: "all", key: "search.filterAll" },
  { id: "posts", key: "search.posts" },
  { id: "communities", key: "search.communities" },
  { id: "users", key: "search.users" },
  { id: "following", key: "search.following" },
];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-nf-accent/20 text-nf-accent rounded px-0.5 font-semibold">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function timeAgoShort(ts: any): string {
  if (!ts) return "";
  try {
    const d = typeof ts === "string" ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date(ts));
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 2592000) return `${Math.floor(s / 86400)}d`;
    return `${Math.floor(s / 2592000)}mo`;
  } catch { return ""; }
}

function LogoBrand() {
  const [label, setLabel] = useState("NorthFall");
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const onGlitch = (e: Event) => {
      const d = (e as CustomEvent<BowieGlitchDetail>).detail;
      if (d.phase === "done") {
        setGlitching(false);
        setLabel("NorthFall");
        return;
      }
      setGlitching(true);
      setLabel(d.label || BOWIE_KNIFE_LABEL);
    };
    window.addEventListener("nf-bowie-glitch", onGlitch);
    return () => window.removeEventListener("nf-bowie-glitch", onGlitch);
  }, []);

  return (
    <Link
      href="/app"
      className="hidden md:flex w-[260px] items-center justify-end shrink-0"
      aria-label="NorthFall - الصفحة الرئيسية"
    >
      <span
        className={cn(
          "font-inter text-[15px] font-bold text-nf-text tracking-tight max-w-[240px] truncate",
          glitching && "nf-brand-glitch"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export default function Navbar({ onProfileClick, onLoginClick, onCommunityClick, onPostClick, onNotifsClick, onSettingsClick, onCreateClick, onAdminClick, onSeoClick, activeCommunity, activeCommunityImg, topOffset = 40 }: {
  onProfileClick: (uid?: string) => void;
  onLoginClick: () => void;
  onCommunityClick?: (name: string) => void;
  onPostClick?: (id: string) => void;
  onNotifsClick?: () => void;
  onSettingsClick?: () => void;
  onCreateClick?: () => void;
  onAdminClick?: () => void;
  onSeoClick?: () => void;
  activeCommunity?: string;
  activeCommunityImg?: string;
  topOffset?: number;
}) {
  const router = useRouter();
  const { user, linkedAccounts, switchingUid, switchAccount, addAccount, removeAccount } = useAuth();
  const { t, lang } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState("all");
  const [searchSort, setSearchSort] = useState<"relevance" | "newest" | "top">("relevance");
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nf-dark");
      if (saved !== null) return saved === "true";
    }
    return true;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [searchTrending, setSearchTrending] = useState<SearchTrendingSnapshot | null>(null);
  const [trendingLoading, setTrendingLoading] = useState(false);

  const MAX_ACCOUNTS = 4;
  const [userKarma, setUserKarma] = useState(0);
  const [userXp, setUserXp] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("nf-dark", String(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("light", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    try {
      const h = localStorage.getItem("nf-search-history");
      if (h) setSearchHistory(JSON.parse(h).slice(0, 5));
    } catch {}
  }, []);

  const addHistory = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...searchHistory.filter(h => h !== q)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem("nf-search-history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("nf-search-history");
  };

  // Real-time unread count (from DataProvider)
  const { unreadCount, communities: allComms } = useData();

  // Fetch real karma from Firestore + cache for account picker
  useEffect(() => {
    if (!user) { setUserKarma(0); return; }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const karma = snap.data().karma || 0;
        const xp = snap.data().xp || 0;
        setUserKarma(karma);
        setUserXp(xp);
        updateAccountCache(user.uid, { xp, karma });
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    try { await signOut(auth); router.refresh(); } catch {}
    setShowUserMenu(false);
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  useEffect(() => {
    if (!showDropdown || searchQuery.trim()) return;
    let cancelled = false;
    setTrendingLoading(true);
    fetchSearchTrending(
      allComms.map((c) => ({
        name: c.name,
        members: c.members,
        category: c.category,
        label: c.label,
      })),
      activeCommunity
    )
      .then((data) => {
        if (!cancelled) setSearchTrending(data);
      })
      .finally(() => {
        if (!cancelled) setTrendingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showDropdown, searchQuery, activeCommunity, allComms]);

  const applyTrendingTopic = (topic: TrendingTopic) => {
    if (topic.kind === "community") {
      const name = topic.key.replace(/^c:/, "");
      addHistory(name);
      onCommunityClick?.(name);
      setShowDropdown(false);
      setSearchQuery("");
      return;
    }
    const q = topic.label.replace(/^#/, "").trim();
    setSearchQuery(q);
    inputRef.current?.focus();
  };

  // Search logic (debounced 300ms, limited results)
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const qLower = searchQuery.toLowerCase();

        // Fetch limited posts for search — scope to community if active
        let postsQuery;
        if (activeCommunity) {
          // No orderBy to avoid composite index requirement — sort client-side
          postsQuery = query(
            collection(db, "posts"),
            where("community", "==", activeCommunity),
            limit(30)
          );
        } else {
          postsQuery = searchSort === "top"
            ? query(collection(db, "posts"), orderBy("votes", "desc"), limit(10))
            : query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10));
        }
        const snap = await getDocs(postsQuery);

        let postResults = snap.docs
          .map((d) => {
            const data = d.data();
            return { id: d.id, title: data.title, body: data.body, community: data.community, authorName: data.authorName, authorUid: data.authorUid, votes: data.votes, createdAt: data.createdAt, _type: "post" as const };
          })
          .filter((d) => {
            if (activeCommunity) {
              // In community scope — filter by search text across title, body, author
              if (!qLower.trim()) return true;
              return d.title?.toLowerCase().includes(qLower) ||
                d.body?.toLowerCase().includes(qLower) ||
                d.authorName?.toLowerCase().includes(qLower);
            }
            return d.title?.toLowerCase().includes(qLower) ||
              d.community?.toLowerCase().includes(qLower) ||
              d.authorName?.toLowerCase().includes(qLower);
          });

        // Sort client-side for community scope
        if (activeCommunity) {
          if (searchSort === "top") {
            postResults.sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0));
          } else if (searchSort === "relevance" && qLower.trim()) {
            postResults.sort((a: any, b: any) => {
              let sa = 0, sb = 0;
              if (a.title?.toLowerCase().includes(qLower)) sa += 3;
              if (b.title?.toLowerCase().includes(qLower)) sb += 3;
              if (a.authorName?.toLowerCase().includes(qLower)) sa += 1;
              if (b.authorName?.toLowerCase().includes(qLower)) sb += 1;
              sa += (a.votes || 0) * 0.01;
              sb += (b.votes || 0) * 0.01;
              return sb - sa;
            });
          } else {
            postResults.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          }
        } else if (searchSort === "relevance") {
          postResults.sort((a: any, b: any) => {
            let sa = 0, sb = 0;
            if (a.title?.toLowerCase().includes(qLower)) sa += 3;
            if (b.title?.toLowerCase().includes(qLower)) sb += 3;
            if (a.community?.toLowerCase().includes(qLower)) sa += 2;
            if (b.community?.toLowerCase().includes(qLower)) sb += 2;
            if (a.authorName?.toLowerCase().includes(qLower)) sa += 1;
            if (b.authorName?.toLowerCase().includes(qLower)) sb += 1;
            sa += (a.votes || 0) * 0.01;
            sb += (b.votes || 0) * 0.01;
            return sb - sa;
          });
        }

        // Community matches — only show when NOT in community scope
        const commMatches = activeCommunity ? [] : allComms
          .filter(c => {
            const cat = resolveCategoryDisplay(c.category || "").toLowerCase();
            const desc = (c.shortDesc || "").toLowerCase();
            return c.name.toLowerCase().includes(qLower)
              || c.label.toLowerCase().includes(qLower)
              || cat.includes(qLower)
              || desc.includes(qLower);
          })
          .map(c => ({
            id: `comm-${c.name}`,
            name: c.name,
            img: c.img,
            category: resolveCategoryDisplay(c.category || ""),
            _type: "community" as const,
            members: c.members || 0
          }));

        // User matches — in community scope, only members of this community
        const userMap = new Map<string, any>();
        if (activeCommunity) {
          // Extract authors from the community posts we already fetched
          snap.docs.forEach(d => {
            const data = d.data();
            if (data.authorUid && !userMap.has(data.authorUid)) {
              const nameMatch = !qLower.trim() || data.authorName?.toLowerCase().includes(qLower);
              if (nameMatch) {
                userMap.set(data.authorUid, {
                  id: `user-${data.authorUid}`,
                  uid: data.authorUid,
                  name: data.authorName,
                  photo: data.authorPhoto || "",
                  _type: "user" as const
                });
              }
            }
          });
        } else {
          try {
            const uSnap = await getDocs(query(collection(db, "users"), limit(15)));
            uSnap.docs.forEach(d => {
              const data = d.data();
              if (data.displayName?.toLowerCase().includes(qLower) && !userMap.has(d.id)) {
                userMap.set(d.id, { id: `user-${d.id}`, uid: d.id, name: data.displayName, photo: data.photoURL || "", karma: data.karma || 0, _type: "user" as const });
              }
            });
          } catch {}
          snap.docs.forEach(d => {
            const data = d.data();
            if (data.authorUid && data.authorName?.toLowerCase().includes(qLower) && !userMap.has(data.authorUid)) {
              userMap.set(data.authorUid, { id: `user-${data.authorUid}`, uid: data.authorUid, name: data.authorName, photo: data.authorPhoto || "", _type: "user" as const });
            }
          });
        }
        const userResults = Array.from(userMap.values());

        let results: any[] = [];
        if (activeCommunity) {
          // Community scope — only posts and members of this community
          if (searchFilter === "posts") {
            results = postResults;
          } else if (searchFilter === "users") {
            results = userResults;
          } else {
            // "all" or "following" — posts first, then members
            results = [...postResults, ...userResults];
          }
        } else if (searchFilter === "following" && user) {
          try {
            const fSnap = await getDocs(collection(db, "users", user.uid, "following"));
            const followingIds = fSnap.docs.map(d => d.id);
            postResults = postResults.filter((p: any) => followingIds.includes(p.authorUid));
          } catch {}
          results = [...commMatches, ...userResults, ...postResults];
        } else if (searchFilter === "all") {
          results = [...commMatches, ...userResults, ...postResults];
        } else if (searchFilter === "posts") {
          results = postResults;
        } else if (searchFilter === "communities") {
          results = commMatches;
        } else if (searchFilter === "users") {
          results = userResults;
        }

        setSearchResults(results.slice(0, 15));
        setShowDropdown(true);
        setSelectedIdx(-1);
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter, searchSort, user, activeCommunity]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown" && searchHistory.length > 0) setShowDropdown(true);
      return;
    }
    const total = searchResults.length || searchHistory.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      const allItems = searchResults.length > 0 ? searchResults : searchHistory.map(h => ({ id: h, _type: "history" as const, text: h }));
      const item = allItems[selectedIdx];
      if (item) handleResultClick(item);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (selectedIdx >= 0 && resultsRef.current) {
      const el = resultsRef.current.children[selectedIdx] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  const handleResultClick = (r: any) => {
    if (r._type === "community") onCommunityClick?.(r.name);
    else if (r._type === "user") onProfileClick(r.uid);
    else if (r._type === "post") onPostClick?.(r.id);
    else if (r._type === "history") { setSearchQuery(r.text); return; }
    addHistory(searchQuery);
    setShowDropdown(false);
    setSearchQuery("");
  };

  return (
    <nav className="fixed left-0 right-0 h-12 border-b border-nf-border z-[1001] flex items-center px-4 gap-3 transition-top duration-300" style={{ direction: "rtl", top: "var(--navbar-top)", backgroundColor: "var(--bg-nav)", borderBottomColor: "var(--border-subtle)" }}>
      {/* Actions — يمين الشريط في RTL */}
      <div className="md:w-[260px] flex items-center justify-start gap-1.5 shrink-0">
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-nf-hover transition-colors border border-transparent hover:border-nf-border-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="صورة المستخدم" className="w-7 h-7 rounded-full object-cover border border-nf-border-2" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center border border-nf-border-2"><User size={13} className="text-nf-muted" /></div>
              )}
              <ChevronDown size={10} className={cn("text-nf-dim shrink-0 transition-transform", showUserMenu && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.1 }} className="absolute top-full mt-1 right-0 w-[260px] bg-nf-body border border-nf-border-2 rounded-lg z-50 overflow-hidden" style={{ direction: "rtl" }}>
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-nf-border-2">
                    <div className="flex items-center gap-2.5">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="صورة المستخدم" className="w-10 h-10 rounded-full object-cover border border-nf-border-2" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center border border-nf-border-2"><User size={18} className="text-nf-muted" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-nf-text truncate flex items-center gap-1">{user.displayName || t("gen.user")}{(user.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[12px] h-[12px] inline" />}</p>
                        <p className="text-[10px] text-nf-dim truncate">{user.email || ""}</p>
                      </div>
                      <button
                        onClick={() => setShowAccountSwitcher(p => !p)}
                        className="p-1 rounded-md text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors shrink-0"
                        title="تبديل الحسابات"
                      >
                        <ChevronDown size={12} className={cn("transition-transform", showAccountSwitcher && "rotate-180")} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-nf-dim"><span className="text-nf-text font-bold">{Math.max(0, Math.round(userKarma))}</span> صيت</span>
                      <span className="text-[10px] text-nf-dim"><span className="text-amber-400 font-bold">{userXp}</span> XP</span>
                      <span className="text-[10px] text-green-400 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />متصل</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {showAccountSwitcher && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden border-b border-nf-border-2"
                      >
                        <div className="px-3 py-2 space-y-1">
                          <p className="text-[9px] font-bold text-nf-dim uppercase tracking-wider mb-1.5">الحسابات المربوطة ({linkedAccounts.length}/{MAX_ACCOUNTS})</p>
                          {linkedAccounts.map(acc => (
                            <div key={acc.uid}
                              className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group", acc.uid === user.uid ? "bg-nf-accent/10" : "hover:bg-nf-hover cursor-pointer")}
                              onClick={() => acc.uid !== user.uid && !switchingUid && switchAccount(acc.uid)}>
                              <div className="relative shrink-0">
                                {acc.photoURL
                                  ? <img src={acc.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
                                  : <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center"><User size={12} className="text-nf-muted" /></div>
                                }
                                {switchingUid === acc.uid && (
                                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-nf-text truncate">{acc.displayName || "مستخدم"}</p>
                                <p className="text-[9px] text-nf-dim truncate">{acc.email}</p>
                              </div>
                              {acc.uid === user.uid
                                ? <span className="text-[9px] text-nf-accent font-bold shrink-0">نشط</span>
                                : <div className="flex items-center gap-1 shrink-0">
                                    {!switchingUid && <span className="text-[9px] text-nf-dim opacity-0 group-hover:opacity-100 transition-opacity">تبديل</span>}
                                    <button onClick={(e) => { e.stopPropagation(); removeAccount(acc.uid); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-nf-dim hover:text-red-400 transition-all"><X size={10} /></button>
                                  </div>
                              }
                            </div>
                          ))}
                          {linkedAccounts.length < MAX_ACCOUNTS && (
                            <button onClick={addAccount} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] text-nf-dim hover:bg-nf-hover hover:text-nf-accent transition-colors border border-dashed border-nf-border-2 mt-1">
                              <Plus size={11} />
                              <span>إضافة حساب جديد</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="py-0.5">
                    {[
                      { icon: User, label: t("nav.profile"), action: () => { onProfileClick(); setShowUserMenu(false); } },
                      { icon: Bookmark, label: t("sb.saved"), action: () => { onProfileClick(); setShowUserMenu(false); } },
                      { icon: Bell, label: t("nav.notifs"), action: () => { onNotifsClick?.(); setShowUserMenu(false); } },
                      { icon: Plus, label: t("pc.createPlaceholder"), action: () => { onCreateClick?.(); setShowUserMenu(false); } },
                      { icon: Settings, label: t("nav.settings"), action: () => { onSettingsClick?.(); setShowUserMenu(false); } },
                      ...(user?.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2" ? [{ icon: Shield, label: "لوحة الإشراف", action: () => { onAdminClick?.(); setShowUserMenu(false); } }] : []),
                      ...(user?.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2" ? [{ icon: Search, label: "أدوات SEO", action: () => { onSeoClick?.(); setShowUserMenu(false); } }] : []),
                      { icon: HelpCircle, label: t("sb.help"), action: () => { setShowUserMenu(false); } },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action} className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
                        <item.icon size={14} className="shrink-0 text-nf-dim" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-nf-border-2 py-0.5">
                    <button onClick={handleSignOut} className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-red-400 hover:bg-red-400/5 transition-colors">
                      <LogOut size={14} className="shrink-0" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button onClick={onLoginClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-nf-dim hover:bg-nf-hover hover:text-nf-muted transition-all duration-200">
            {t("nav.login")}
          </button>
        )}
        <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-lg text-nf-dim hover:bg-nf-hover hover:text-nf-text transition-colors" title={darkMode ? "الوضع المضيء" : "الوضع الداكن"}>
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button onClick={onNotifsClick} className="w-8 h-8 flex items-center justify-center rounded-lg text-nf-dim hover:bg-nf-hover hover:text-nf-text transition-colors relative">
          <Bell size={15} />
          {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center px-0.5">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </button>
        <button type="button" onClick={() => onCreateClick?.()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-nf-dim hover:bg-nf-hover hover:text-nf-text transition-all duration-200 whitespace-nowrap">
          <Plus size={14} /> <span className="hidden xs:inline">{t("pc.createPlaceholder")}</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-[560px] mx-auto relative z-10" ref={searchRef} style={{ direction: "rtl" }}>
        <div
          className={cn(
            "group flex items-center h-10 rounded-full px-4 gap-2.5 transition-all border",
            "bg-nf-input/80 border-nf-border-2/60",
            "hover:bg-nf-hover hover:border-nf-border-2",
            "focus-within:bg-nf-card focus-within:border-nf-border-2 focus-within:ring-1 focus-within:ring-nf-border-2/80",
            activeCommunity && "border-nf-accent/35 bg-nf-accent/[0.06]"
          )}
        >
          <Search
            size={16}
            className={cn(
              "shrink-0 transition-colors text-nf-dim",
              "group-focus-within:text-nf-accent",
              activeCommunity && "text-nf-accent/80"
            )}
          />
          {/* Community scope chip — shown when inside a community */}
          {activeCommunity && (() => {
            const commImg = allComms.find(c => c.name.toLowerCase() === activeCommunity.toLowerCase())?.img || "";
            return (
              <div className="flex items-center gap-1 bg-white/[0.06] border border-nf-accent/30 rounded-full px-2 py-0.5 shrink-0 max-w-[140px]">
                {commImg ? (
                  <img src={commImg} alt={activeCommunity} className="w-3.5 h-3.5 rounded-sm object-cover shrink-0" />
                ) : (
                  <Hash size={10} className="text-nf-accent shrink-0" />
                )}
                <span className="text-[11px] font-semibold text-nf-text truncate">n/{activeCommunity}</span>
                <button
                  onClick={() => { setSearchQuery(""); setShowDropdown(false); }}
                  className="text-nf-dim hover:text-nf-text transition-colors shrink-0"
                  title="بحث عام"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })()}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={activeCommunity ? `ابحث في n/${activeCommunity}...` : t("nav.search")}
            className="flex-1 min-w-0 !bg-transparent border-none outline-none text-[14px] text-nf-text placeholder:text-nf-dim py-1"
          />
          {searching && <div className="w-4 h-4 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin shrink-0" />}
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }} className="text-nf-dim hover:text-nf-text transition-colors shrink-0 p-0.5">
              <X size={14} />
            </button>
          )}
          {!searchQuery && !showDropdown && (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-nf-secondary/60 text-[10px] text-nf-dim font-mono border border-nf-border-2/50">
              ⌘K
            </kbd>
          )}
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.1 }}
              className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl bg-nf-card border border-nf-border-2 overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.18)] min-h-[min(480px,72vh)] flex flex-col"
            >
              {/* Filter tabs — in community scope, hide communities/users tabs */}
              <div className="flex items-center border-b border-nf-border-2/60 bg-nf-secondary/25">
                {filterOptions
                  .filter(f => !activeCommunity || !["communities", "users"].includes(f.id))
                  .map((f) => (
                  <button key={f.id} onClick={() => setSearchFilter(f.id)}
                    className={cn("px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors",
                      searchFilter === f.id ? "text-nf-accent border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
                    {t(f.key)}
                  </button>
                ))}
              </div>
              {/* Sort row */}
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-nf-border-2/60">
                {activeCommunity && (
                  <span className="flex items-center gap-1 text-[11px] text-nf-accent font-semibold mr-auto">
                    <Hash size={10} />
                    n/{activeCommunity}
                  </span>
                )}
                <span className="text-[11px] text-nf-dim ml-1">{t("search.sortBy")}:</span>
                {sortOptions.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => setSearchSort(s.id)}
                      className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all",
                        searchSort === s.id ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-nf-muted hover:bg-nf-hover")}>
                      <Icon size={11} />{t(s.key)}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              {!searchQuery.trim() ? (
                <div className="flex-1 overflow-y-auto py-2 min-h-[300px]">
                  {searchHistory.length > 0 && (
                    <div className="px-3 pb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-bold text-nf-dim uppercase tracking-wider">{t("search.recent")}</span>
                        <button onClick={clearHistory} className="text-[11px] text-nf-dim hover:text-nf-accent transition-colors flex items-center gap-1">
                          <RotateCcw size={10} />{t("search.clearHistory")}
                        </button>
                      </div>
                      {searchHistory.map((h, i) => (
                        <button key={h} onClick={() => setSearchQuery(h)}
                          className={cn("flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] transition-colors",
                            selectedIdx === i ? "bg-nf-hover text-nf-text font-semibold" : "text-nf-muted hover:bg-nf-hover")}
                        >
                          <Clock size={13} className="text-nf-dim shrink-0" />
                          <span className="flex-1 text-right truncate">{h}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={cn("px-3", searchHistory.length > 0 && "pt-2 mt-1 border-t border-nf-border-2/40")}>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame size={13} className="text-nf-accent shrink-0" />
                      <span className="text-[12px] font-bold text-nf-dim uppercase tracking-wider">{t("search.trending")}</span>
                      {trendingLoading && (
                        <div className="w-3.5 h-3.5 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin ms-auto" />
                      )}
                    </div>

                    {trendingLoading && !searchTrending ? (
                      <div className="space-y-2 py-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-9 rounded-xl bg-nf-secondary/40 animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <>
                        {(searchTrending?.topics.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {searchTrending!.topics.map((topic) => (
                              <button
                                key={topic.key}
                                type="button"
                                onClick={() => applyTrendingTopic(topic)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-nf-secondary/50 border border-nf-border-2/60 text-[12px] text-nf-muted hover:text-nf-accent hover:border-nf-accent/30 hover:bg-nf-accent/10 transition-all max-w-full"
                              >
                                {topic.kind === "community" ? (
                                  <Hash size={11} className="text-nf-accent shrink-0" />
                                ) : (
                                  <TrendingUp size={11} className="text-nf-accent shrink-0" />
                                )}
                                <span className="truncate">{topic.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-nf-dim py-2">{t("search.noResults")}</p>
                        )}

                        {(searchTrending?.posts.length ?? 0) > 0 && (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider px-0.5 block mb-1">
                              منشورات رائجة
                            </span>
                            {searchTrending!.posts.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  addHistory(p.title);
                                  onPostClick?.(p.id);
                                  setShowDropdown(false);
                                  setSearchQuery("");
                                }}
                                className="flex items-start gap-2.5 w-full px-2 py-2 rounded-xl hover:bg-nf-hover/60 transition-colors text-right"
                              >
                                <div className="w-8 h-8 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <Flame size={14} className="text-nf-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-[13px] font-semibold text-nf-text nf-bidi-text line-clamp-2 leading-snug"
                                    dir={textDirAttr(p.title || "")}
                                  >
                                    {p.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {p.community && (
                                      <span className="text-[10px] text-nf-accent">n/{p.community}</span>
                                    )}
                                    <span className="text-[10px] text-nf-dim">
                                      <ArrowUp size={9} className="inline text-green-400" />
                                      {p.votes}
                                    </span>
                                    <span className="text-[10px] text-nf-dim">
                                      <MessageSquare size={9} className="inline" />
                                      {p.commentCount}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div ref={resultsRef} className="py-1 flex-1 overflow-y-auto max-h-[min(400px,55vh)]">
                  {/* Communities */}
                  {searchResults.filter(r => r._type === "community").length > 0 && (
                    <>
                      <div className="px-3 pt-1.5 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">{t("search.communities")}</span></div>
                      {searchResults.filter(r => r._type === "community").map((r: any) => {
                        const globalIdx = searchResults.indexOf(r);
                        const img = r.img || allComms.find(c => c.name.toLowerCase() === (r.name || "").toLowerCase())?.img || "";
                        return (
                          <button key={r.id} onClick={() => handleResultClick(r)} onMouseEnter={() => setSelectedIdx(globalIdx)}
                            className={cn("flex items-center gap-3 w-full px-3 py-2.5 transition-colors", selectedIdx === globalIdx ? "bg-nf-hover" : "hover:bg-nf-hover/50")}>
                            {img ? (
                              <img src={img} alt={`مجتمع ${r.name}`} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-nf-border-2" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0 border border-nf-border-2"><Hash size={14} className="text-nf-accent" /></div>
                            )}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-[13px] font-bold text-nf-text"><Highlight text={`n/${r.name}`} query={searchQuery} /></p>
                              <span className="text-[11px] text-nf-dim"><Users size={10} className="inline ml-0.5" /> {r.members || 0} {t("search.memberCount")}</span>
                            </div>
                            <ChevronDown size={14} className="text-nf-dim -rotate-90 shrink-0" />
                          </button>
                        );
                      })}
                    </>
                  )}
                  {/* Users */}
                  {searchResults.filter(r => r._type === "user").length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">{t("search.users")}</span></div>
                      {searchResults.filter(r => r._type === "user").map((r: any) => {
                        const globalIdx = searchResults.indexOf(r);
                        return (
                          <button key={r.id} onClick={() => handleResultClick(r)} onMouseEnter={() => setSelectedIdx(globalIdx)}
                            className={cn("flex items-center gap-3 w-full px-3 py-2.5 transition-colors", selectedIdx === globalIdx ? "bg-nf-hover" : "hover:bg-nf-hover/50")}>
                            {r.photo ? (
                              <img src={r.photo} alt={`صورة ${r.name}`} className="w-9 h-9 rounded-full object-cover shrink-0 border border-nf-border-2" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0 border border-nf-border-2">{(r.name || "U")[0]}</div>
                            )}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-[13px] font-bold text-nf-text"><Highlight text={r.name} query={searchQuery} /></p>
                              <span className="text-[11px] text-nf-dim">u/{r.name}{r.karma ? ` · ${Math.max(0, Math.round(r.karma))} ${t("search.karmaCount")}` : ""}</span>
                            </div>
                            <User size={14} className="text-nf-dim shrink-0" />
                          </button>
                        );
                      })}
                    </>
                  )}
                  {/* Posts */}
                  {searchResults.filter(r => r._type === "post").length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">{t("search.posts")}</span></div>
                      {searchResults.filter(r => r._type === "post").map((r: any) => {
                        const globalIdx = searchResults.indexOf(r);
                        const commImg = allComms.find(c => c.name.toLowerCase() === (r.community || "").toLowerCase())?.img || "";
                        return (
                          <button key={r.id} onClick={() => handleResultClick(r)} onMouseEnter={() => setSelectedIdx(globalIdx)}
                            className={cn("flex items-start gap-3 w-full px-3 py-2.5 transition-colors", selectedIdx === globalIdx ? "bg-nf-hover" : "hover:bg-nf-hover/50")}>
                            {r.imageUrl ? (
                              <img src={r.imageUrl} alt="صورة المنشور" className="w-11 h-11 rounded-lg object-cover shrink-0 border border-nf-border-2" />
                            ) : commImg ? (
                              <img src={commImg} alt={`مجتمع ${r.community}`} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-nf-border-2" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-nf-secondary flex items-center justify-center shrink-0 border border-nf-border-2"><FileText size={14} className="text-nf-dim" /></div>
                            )}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-[13px] font-bold text-nf-text leading-snug"><Highlight text={r.title} query={searchQuery} /></p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {r.community && <span className="text-[11px] text-nf-accent bg-nf-accent/10 px-2 py-0.5 rounded">n/{r.community}</span>}
                                <span className="text-[11px] text-nf-dim">{r.authorName || t("gen.user")}</span>
                                <span className="text-[11px] text-nf-dim"><ArrowUp size={9} className="inline text-green-400" />{r.votes || 0}</span>
                                <span className="text-[11px] text-nf-dim"><MessageSquare size={9} className="inline" />{r.commentCount || 0}</span>
                                {r.createdAt && <span className="text-[11px] text-nf-dim">{timeAgoShort(r.createdAt)}</span>}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              ) : !searching ? (
                <div className="p-6 text-center flex-1 flex flex-col justify-center min-h-[200px]">
                  <Search size={18} className="mx-auto text-nf-dim/30 mb-2" />
                  <p className="text-[12px] text-nf-muted">
                    {activeCommunity ? `لا نتائج في n/${activeCommunity}` : t("search.noResults")}
                  </p>
                  <p className="text-[10px] text-nf-dim mt-1">"{searchQuery}"</p>
                </div>
              ) : null}

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3 text-[11px] text-nf-dim">
                  <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[10px]">↵</kbd> {t("search.open")}</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[10px]">↑↓</kbd> {t("search.navigate")}</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[10px]">esc</kbd> {t("search.close")}</span>
                </div>
                <span className="text-[11px] text-nf-dim">{searchResults.length} {t("search.results")}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logo — يسار الشريط في RTL */}
      <LogoBrand />
    </nav>
  );
}
