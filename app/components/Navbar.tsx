"use client";

import { Search, Bell, User, ChevronDown, X, FileText, Users, Hash, TrendingUp, Clock, ArrowUp, MessageSquare, Sparkles, RotateCcw, Flame, Settings, LogOut, Bookmark, Shield, HelpCircle, Plus } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy, limit, where, onSnapshot, getCountFromServer } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "./I18nProvider";

const knownCommunities = ["Unity", "Unreal", "Godot", "Blender", "عام"];

const communityImages: Record<string, string> = {
  Unity: "/assets/images/unitylogo.png",
  Unreal: "/assets/images/unreallogo.svg",
  Godot: "/assets/images/godotlogo.png",
  Blender: "/assets/images/logoblender.png",
};

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
      <mark className="bg-nf-accent/30 text-white rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
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

export default function Navbar({ onProfileClick, onLoginClick, onCommunityClick, onPostClick, onNotifsClick, onSettingsClick, onCreateClick, onAdminClick }: {
  onProfileClick: () => void;
  onLoginClick: () => void;
  onCommunityClick?: (name: string) => void;
  onPostClick?: (id: string) => void;
  onNotifsClick?: () => void;
  onSettingsClick?: () => void;
  onCreateClick?: () => void;
  onAdminClick?: () => void;
}) {
  const { user } = useAuth();
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  // Real-time unread count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const q2 = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q2, (snap) => {
      setUnreadCount(snap.docs.filter(d => !d.data().read).length);
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
    try { await signOut(auth); } catch {}
    setShowUserMenu(false);
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const qLower = searchQuery.toLowerCase();

        const postsQuery = searchSort === "top"
          ? query(collection(db, "posts"), orderBy("votes", "desc"), limit(15))
          : query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(15));
        const snap = await getDocs(postsQuery);

        let postResults = snap.docs
          .map((d) => ({ id: d.id, ...d.data(), _type: "post" as const }))
          .filter((d: any) =>
            d.title?.toLowerCase().includes(qLower) ||
            d.body?.toLowerCase().includes(qLower) ||
            d.community?.toLowerCase().includes(qLower) ||
            d.authorName?.toLowerCase().includes(qLower)
          );

        if (searchSort === "relevance") {
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

        // Community matches with member counts
        const commNames = knownCommunities.filter(c => c.toLowerCase().includes(qLower));
        const commMatches = await Promise.all(commNames.map(async c => {
          let members = 0;
          try {
            const mSnap = await getCountFromServer(collection(db, "communityMembers", c, "members"));
            members = mSnap.data().count;
          } catch {}
          return { id: `comm-${c}`, name: c, _type: "community" as const, members };
        }));

        // User matches
        const userMap = new Map<string, any>();
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
        const userResults = Array.from(userMap.values());

        let results: any[] = [];
        if (searchFilter === "following" && user) {
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
  }, [searchQuery, searchFilter, searchSort, user]);

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
    else if (r._type === "user") onProfileClick();
    else if (r._type === "post") onPostClick?.(r.id);
    else if (r._type === "history") { setSearchQuery(r.text); return; }
    addHistory(searchQuery);
    setShowDropdown(false);
    setSearchQuery("");
  };

  const trendingTags = ["#Unity", "#Unreal", "#Godot", "#Blender", "#GameDev"];

  return (
    <nav className="fixed top-0 left-0 right-0 h-12 bg-nf-nav/80 backdrop-blur-xl border-b border-nf-border-subtle z-[1001] flex items-center px-4" style={{ direction: "rtl" }}>
      {/* Logo */}
      <div className="w-[260px] flex items-center shrink-0 cursor-pointer" onClick={() => onCommunityClick?.("")}>
        <span className="font-inter text-[15px] font-bold text-white tracking-tight">NorthFall</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-[560px] mx-auto relative z-10" ref={searchRef} style={{ direction: "rtl" }}>
        <div className={cn(
          "group flex items-center h-10 rounded-xl px-4 gap-2.5 transition-all border",
          showDropdown
            ? "bg-nf-primary border-nf-border rounded-b-none shadow-lg shadow-black/20"
            : "bg-nf-secondary/60 border-nf-border-2/50 hover:bg-nf-secondary focus-within:bg-nf-primary focus-within:border-nf-accent/30 focus-within:shadow-lg focus-within:shadow-black/20"
        )}>
          <Search size={16} className={cn("shrink-0 transition-colors", showDropdown ? "text-nf-accent" : "text-nf-dim group-focus-within:text-nf-accent")} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("nav.search")}
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-white placeholder:text-nf-dim/70 py-1"
          />
          {searching && <div className="w-4 h-4 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin shrink-0" />}
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }} className="text-nf-dim hover:text-white transition-colors shrink-0 p-0.5">
              <X size={14} />
            </button>
          )}
          {!searchQuery && !showDropdown && (
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-nf-secondary/60 text-[10px] text-nf-dim font-mono border border-nf-border-2">⌘K</kbd>
          )}
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.1 }}
              className="absolute mt-0 left-0 right-0 bg-nf-primary border border-t-0 border-nf-border-2 rounded-b-xl overflow-hidden shadow-xl shadow-black/30"
            >
              {/* Filter tabs */}
              <div className="flex items-center border-b border-nf-border-2/50">
                {filterOptions.map((f) => (
                  <button key={f.id} onClick={() => setSearchFilter(f.id)}
                    className={cn("px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors",
                      searchFilter === f.id ? "text-nf-accent border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
                    {t(f.key)}
                  </button>
                ))}
              </div>
              {/* Sort row */}
              <div className="flex items-center gap-1 px-3 py-1 border-b border-nf-border-2/30 bg-nf-secondary/10">
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
                <div className="py-1.5">
                  {searchHistory.length > 0 && (
                    <div className="px-3 py-1.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-bold text-nf-dim uppercase tracking-wider">{t("search.recent")}</span>
                        <button onClick={clearHistory} className="text-[11px] text-nf-dim hover:text-nf-accent transition-colors flex items-center gap-1">
                          <RotateCcw size={10} />{t("search.clearHistory")}
                        </button>
                      </div>
                      {searchHistory.map((h, i) => (
                        <button key={h} onClick={() => setSearchQuery(h)}
                          className={cn("flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] transition-colors",
                            selectedIdx === i ? "bg-nf-hover text-white" : "text-nf-muted hover:bg-nf-hover")}>
                          <Clock size={13} className="text-nf-dim shrink-0" />
                          <span className="flex-1 text-right truncate">{h}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="px-3 py-1.5 border-t border-nf-border-2/30">
                    <span className="text-[12px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">{t("search.trending")}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingTags.map(tag => (
                        <button key={tag} onClick={() => setSearchQuery(tag.replace("#", ""))}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-nf-secondary/40 text-[12px] text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 transition-all">
                          <TrendingUp size={11} className="text-nf-accent" />{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div ref={resultsRef} className="py-1 max-h-[320px] overflow-y-auto">
                  {/* Communities */}
                  {searchResults.filter(r => r._type === "community").length > 0 && (
                    <>
                      <div className="px-3 pt-1.5 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">{t("search.communities")}</span></div>
                      {searchResults.filter(r => r._type === "community").map((r: any) => {
                        const globalIdx = searchResults.indexOf(r);
                        const img = communityImages[r.name];
                        return (
                          <button key={r.id} onClick={() => handleResultClick(r)} onMouseEnter={() => setSelectedIdx(globalIdx)}
                            className={cn("flex items-center gap-3 w-full px-3 py-2.5 transition-colors", selectedIdx === globalIdx ? "bg-nf-hover" : "hover:bg-nf-hover/50")}>
                            {img ? (
                              <img src={img} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-nf-border-2" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0 border border-nf-border-2"><Hash size={14} className="text-nf-accent" /></div>
                            )}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-[13px] font-bold text-white"><Highlight text={`n/${r.name}`} query={searchQuery} /></p>
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
                              <img src={r.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-nf-border-2" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0 border border-nf-border-2">{(r.name || "U")[0]}</div>
                            )}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-[13px] font-bold text-white"><Highlight text={r.name} query={searchQuery} /></p>
                              <span className="text-[11px] text-nf-dim">u/{r.name}{r.karma ? ` · ${r.karma} ${t("search.karmaCount")}` : ""}</span>
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
                        const commImg = communityImages[r.community];
                        return (
                          <button key={r.id} onClick={() => handleResultClick(r)} onMouseEnter={() => setSelectedIdx(globalIdx)}
                            className={cn("flex items-start gap-3 w-full px-3 py-2.5 transition-colors", selectedIdx === globalIdx ? "bg-nf-hover" : "hover:bg-nf-hover/50")}>
                            {r.imageUrl ? (
                              <img src={r.imageUrl} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0 border border-nf-border-2" />
                            ) : commImg ? (
                              <img src={commImg} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-nf-border-2" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-nf-secondary flex items-center justify-center shrink-0 border border-nf-border-2"><FileText size={14} className="text-nf-dim" /></div>
                            )}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-[13px] font-bold text-white leading-snug"><Highlight text={r.title} query={searchQuery} /></p>
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
                <div className="p-6 text-center">
                  <Search size={18} className="mx-auto text-nf-dim/30 mb-2" />
                  <p className="text-[12px] text-nf-muted">{t("search.noResults")}</p>
                  <p className="text-[10px] text-nf-dim mt-1">"{searchQuery}"</p>
                </div>
              ) : null}

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-nf-border-2/30 bg-nf-secondary/20">
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

      {/* Actions - icons then account on far right */}
      <div className="w-[260px] flex items-center justify-end gap-1.5 shrink-0" style={{ direction: "ltr" }}>
        <button onClick={onNotifsClick} className="w-8 h-8 flex items-center justify-center rounded-lg text-nf-dim hover:bg-nf-hover hover:text-white transition-colors relative">
          <Bell size={15} />
          {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center px-0.5">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </button>
        <button onClick={onCreateClick} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-nf-dim hover:bg-nf-hover hover:text-nf-muted transition-all duration-200">
          <Plus size={12} /> {t("pc.createPlaceholder")}
        </button>
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-nf-hover transition-colors border border-transparent hover:border-nf-border-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover border border-nf-border-2" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center border border-nf-border-2"><User size={13} className="text-nf-muted" /></div>
              )}
              <ChevronDown size={10} className={cn("text-nf-dim shrink-0 transition-transform", showUserMenu && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.1 }} className="absolute top-full mt-1 left-0 w-[240px] bg-nf-primary border border-nf-border-2 rounded-lg z-50 overflow-hidden" style={{ direction: "rtl" }}>
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-nf-border-2">
                    <div className="flex items-center gap-2.5">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-nf-border-2" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center border border-nf-border-2"><User size={18} className="text-nf-muted" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white truncate">{user.displayName || t("gen.user")}</p>
                        <p className="text-[10px] text-nf-dim truncate">{user.email || ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-nf-dim"><span className="text-white font-bold">1</span> {t("pp.karma")}</span>
                      <span className="text-[10px] text-green-400 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />متصل</span>
                    </div>
                  </div>
                  {/* Menu items */}
                  <div className="py-0.5">
                    {[
                      { icon: User, label: t("nav.profile"), action: () => { onProfileClick(); setShowUserMenu(false); } },
                      { icon: Bookmark, label: t("sb.saved"), action: () => { onProfileClick(); setShowUserMenu(false); } },
                      { icon: Bell, label: t("nav.notifs"), action: () => { onNotifsClick?.(); setShowUserMenu(false); } },
                      { icon: Plus, label: t("pc.createPlaceholder"), action: () => { onCreateClick?.(); setShowUserMenu(false); } },
                      { icon: Settings, label: t("nav.settings"), action: () => { onSettingsClick?.(); setShowUserMenu(false); } },
                      ...(user?.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2" || user?.uid === "OUJAuK34FoTpFyJqgOVjCH9c4Kf1" ? [{ icon: Shield, label: "لوحة الإشراف", action: () => { onAdminClick?.(); setShowUserMenu(false); } }] : []),
                      { icon: HelpCircle, label: t("sb.help"), action: () => { setShowUserMenu(false); } },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action} className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
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
      </div>
    </nav>
  );
}
