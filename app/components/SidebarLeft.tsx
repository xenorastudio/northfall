"use client";

import { Home, Flame, Clock, TrendingUp, User, Bookmark, Bell, Settings, HelpCircle, Shield, Plus, Search, MessageSquare, Gamepad2, X, Rss, Pencil, ChevronDown, ChevronUp, Settings2, Star } from "lucide-react";
import { setCommunityFavorite } from "@/lib/user-community-prefs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CustomFeed } from "./CustomFeedModal";

const navHrefMap: Record<string, string> = {
  home: "/app",
  hot: "/app?view=hot",
  new: "/app?view=new",
  top: "/app?view=top",
  forums: "/forum",
  games: "/games",
  profile: "/app?view=profile",
  saved: "/app?view=saved",
  notifs: "/app?view=notifs",
  settings: "/app?view=settings",
  help: "/app?view=help",
  rules: "/app?view=rules",
};

function NavSection({ title, items, active, onSelect, badges }: {
  title: string;
  items: { icon: typeof Home; labelKey: string; id: string }[];
  active: string;
  onSelect: (id: string) => void;
  badges?: Record<string, number>;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-px mb-2">
      <div className="text-[10px] font-bold text-nf-dim uppercase tracking-wider px-3.5 py-2 pb-1">
        {title}
      </div>
      {items.map((item) => {
        const href = navHrefMap[item.id];
        const isActive = active === item.id;
        const label = t(item.labelKey);
        const inner = (
          <>
            <item.icon size={18} className={cn("shrink-0", isActive ? "opacity-100" : "opacity-50")} />
            <span>{label}</span>
            {badges && badges[item.id] > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-nf-accent text-nf-primary text-[9px] font-bold min-w-[18px] text-center">{badges[item.id] > 99 ? "99+" : badges[item.id]}</span>
            )}
            {isActive && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-nf-accent rounded-full" />
            )}
          </>
        );
        if (item.id === "games" && href) {
          return (
            <a
              key={item.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "relative flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium mx-2 transition-colors duration-150",
                "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
              )}
              aria-label={label}
            >
              {inner}
            </a>
          );
        }
        return href ? (
          <Link
            key={item.id}
            href={href}
            onClick={(e) => { e.preventDefault(); onSelect(item.id); }}
            className={cn(
              "relative flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium mx-2 transition-colors duration-150",
              isActive
                ? "bg-nf-hover text-nf-text"
                : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
            )}
            aria-label={label}
          >
            {inner}
          </Link>
        ) : (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "relative flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium mx-2 transition-all duration-200",
              isActive
                ? "bg-nf-hover text-nf-text shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-nf-muted hover:bg-nf-hover hover:text-nf-text hover:translate-x-0.5"
            )}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export default function SidebarLeft({ onNavClick, onCommunityClick, activeNav, onCreateCommunity, onDashboardClick, onCustomFeedClick, onCreateCustomFeed, customFeeds, activeCustomFeedId }: {
  onNavClick: (id: string) => void;
  onCommunityClick: (name: string) => void;
  activeNav: string;
  onCreateCommunity?: () => void;
  onDashboardClick?: (name: string) => void;
  onCustomFeedClick?: (feed: CustomFeed) => void;
  onCreateCustomFeed?: () => void;
  customFeeds?: CustomFeed[];
  activeCustomFeedId?: string | null;
}) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { unreadCount, communities: allComms, joinedCommunities: joinedNames, favoriteCommunities } = useData();
  const [commSearch, setCommSearch] = useState("");
  const [commSectionOpen, setCommSectionOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const favSet = new Set(favoriteCommunities);
  const sortByFavorite = (list: typeof allComms) =>
    [...list].sort((a, b) => {
      const af = favSet.has(a.name) ? 0 : 1;
      const bf = favSet.has(b.name) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.name.localeCompare(b.name, "ar");
    });
  const myCommunities = sortByFavorite(
    allComms.filter((c) => joinedNames.includes(c.name))
  );
  const toggleSidebarFavorite = async (name: string) => {
    if (!user) return;
    const next = !favSet.has(name);
    try {
      await setCommunityFavorite(user.uid, name, next);
    } catch { /* silent */ }
  };
  const filteredComms = commSearch.trim()
    ? allComms.filter(
        (c) =>
          c.name.toLowerCase().includes(commSearch.toLowerCase()) ||
          c.label.toLowerCase().includes(commSearch.toLowerCase())
      )
    : allComms;
  const displayedMyCommunities = commSearch.trim()
    ? myCommunities.filter(
        (c) =>
          c.name.toLowerCase().includes(commSearch.toLowerCase()) ||
          c.label.toLowerCase().includes(commSearch.toLowerCase())
      )
    : myCommunities;

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);  const browseItemsInner = [
    { icon: Home, labelKey: "sb.home", id: "home" },
    { icon: Flame, labelKey: "sb.popular", id: "hot" },
    { icon: Clock, labelKey: "fs.new", id: "new" },
    { icon: TrendingUp, labelKey: "fs.top", id: "top" },
    { icon: MessageSquare, labelKey: "المنتدى", id: "forums" },
    { icon: Gamepad2, labelKey: "ألعاب", id: "games" },
  ];
  const personalItemsInner = [
    { icon: User, labelKey: "sb.profile", id: "profile" },
    { icon: Bookmark, labelKey: "sb.saved", id: "saved" },
    { icon: Bell, labelKey: "sb.notifs", id: "notifs" },
  ];
  const systemItems = [
    { icon: Settings, labelKey: "sb.settings", id: "settings" },
    { icon: HelpCircle, labelKey: "sb.help", id: "help" },
    { icon: Shield, labelKey: "sb.rules", id: "rules" },
  ];

  return (
    <>
    <aside className="hidden md:flex fixed bottom-0 w-[260px] overflow-y-auto bg-nf-nav border-r border-nf-border-subtle py-2 flex-col z-100" style={{ left: 0, top: "var(--nav-total-height)" }}>
      <nav aria-label="التنقل الرئيسي">
      <NavSection title={t("sb.browse")} items={browseItemsInner} active={activeNav} onSelect={onNavClick} />

      <div className="h-px bg-nf-border-subtle mx-3 my-1" />

      <NavSection title={t("sb.personal")} items={personalItemsInner} active={activeNav} onSelect={onNavClick} badges={{ notifs: unreadCount }} />

      <div className="h-px bg-nf-border-subtle mx-3 my-1" />

      {/* Custom Feeds */}
      {user && (
        <div className="flex flex-col gap-px mb-2">
          <div className="px-3.5 py-2 pb-1">
            <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">فيدات مخصصة</span>
          </div>

          {customFeeds && customFeeds.length > 0 ? (
            customFeeds.map((feed) => {
              const isActive = activeCustomFeedId === feed.id;
              return (
                <div key={feed.id} className="relative flex items-center mx-2 group/feed">
                  <button
                    onClick={() => onCustomFeedClick?.(feed)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150",
                      isActive ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                    )}
                  >
                    {feed.iconUrl ? (
                      <img src={feed.iconUrl} alt="" className={cn("w-5 h-5 rounded-full object-cover shrink-0", !isActive && "opacity-70")} />
                    ) : (
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 bg-nf-accent/15 text-nf-accent", !isActive && "opacity-60")}>
                        {feed.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate flex-1 text-right">{feed.name}</span>
                  </button>
                  <a
                    href={`/feeds/${feed.id}/settings`}
                    onClick={(e) => { e.stopPropagation(); }}
                    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded text-nf-dim opacity-0 group-hover/feed:opacity-100 hover:text-nf-accent transition-all"
                    title="إعدادات الفيد"
                  >
                    <Pencil size={10} />
                  </a>
                </div>
              );
            })
          ) : null}

          <div className="px-3.5 pb-2">
            <button
              type="button"
              onClick={onCreateCustomFeed}
              className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-nf-border rounded-lg text-xs font-medium text-nf-muted hover:bg-nf-hover hover:text-[#999] transition-colors duration-150"
            >
              <Plus size={14} />
              <span>إنشاء فيد مخصص</span>
            </button>
          </div>
        </div>
      )}

      {/* Communities — Reddit style */}
      {user && (
        <div className="flex flex-col gap-px mb-2">
          <div className="px-3.5 py-2 pb-1">
            <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">{t("sb.communities")}</span>
          </div>
          {commSectionOpen && (
            <>
              <div className="px-3 pb-1.5">
                <div className="relative">
                  <Search size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
                  <input
                    type="text"
                    value={commSearch}
                    onChange={(e) => setCommSearch(e.target.value)}
                    placeholder={t("sb.searchComm")}
                    className="w-full bg-transparent border border-nf-border-2 rounded-lg pr-7 pl-6 py-1.5 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-border-2"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavClick("manage-communities")}
                className={cn(
                  "flex items-center gap-2.5 mx-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                  activeNav === "manage-communities" ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                )}
              >
                <Settings2 size={16} className="opacity-60 shrink-0" />
                <span>إدارة المجتمعات</span>
              </button>
              {displayedMyCommunities.map((c) => (
                <div key={c.name} className="flex items-center mx-2 group/comm">
                  <Link
                    href={`/community/${encodeURIComponent(c.name)}`}
                    onClick={(e) => { e.preventDefault(); onCommunityClick(c.name); }}
                    className={cn(
                      "flex items-center gap-2.5 flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                      activeNav === c.name ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                    )}
                  >
                    {c.img ? (
                      <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-nf-secondary flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">n/</div>
                    )}
                    <span className="truncate">{c.label || `n/${c.name}`}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); toggleSidebarFavorite(c.name); }}
                    className={cn(
                      "p-1 shrink-0 rounded transition-colors",
                      favSet.has(c.name) ? "text-yellow-400" : "text-nf-dim opacity-0 group-hover/comm:opacity-100 hover:text-yellow-400"
                    )}
                    aria-label="مفضلة"
                  >
                    <Star size={12} fill={favSet.has(c.name) ? "currentColor" : "none"} />
                  </button>
                </div>
              ))}
              {commSearch.trim() && (
              <div className="max-h-[140px] overflow-y-auto">
                {filteredComms
                  .filter((c) => !myCommunities.some((m) => m.name === c.name))
                  .slice(0, 30)
                  .map((c) => (
                    <Link
                      key={`disc-${c.name}`}
                      href={`/community/${encodeURIComponent(c.name)}`}
                      onClick={(e) => { e.preventDefault(); onCommunityClick(c.name); }}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium mx-2 text-nf-dim hover:bg-nf-hover hover:text-nf-muted transition-colors",
                        activeNav === c.name && "bg-nf-hover text-nf-text"
                      )}
                    >
                      {c.img ? (
                        <img src={c.img} alt="" className="w-4 h-4 rounded-full object-cover shrink-0 opacity-70" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-nf-secondary shrink-0" />
                      )}
                      <span className="truncate">{c.label}</span>
                    </Link>
                  ))}
              </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="px-3.5 pb-2">
        <button
          type="button"
          onClick={onCreateCommunity}
          className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-nf-border rounded-lg text-xs font-medium text-nf-muted hover:bg-nf-hover hover:text-[#999] transition-colors duration-150"
        >
          <Plus size={14} />
          <span>{t("sb.createCommunity")}</span>
        </button>
      </div>

      <NavSection title={t("sb.system")} items={systemItems} active={activeNav} onSelect={onNavClick} />
      </nav>

      {/* Footer */}
      <footer className="mt-auto px-4 py-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-nf-dim mb-2">
          <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px] font-mono">⌘K</kbd> بحث</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px] font-mono">⌘N</kbd> منشور جديد</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px] text-nf-muted">
          <a href="#" className="hover:text-nf-text">{t("sr.privacy")}</a>
          <span className="text-nf-dim">•</span>
          <a href="#" className="hover:text-nf-text">{t("sr.terms")}</a>
        </div>
        <p className="text-[11px] text-nf-dim mt-1.5">© 2026 NorthFall. {t("gen.allRightsReserved")}</p>
      </footer>
    </aside>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[1001] bg-nf-nav border-t border-nf-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {[
          { icon: Home, id: "home" },
          { icon: Flame, id: "hot" },
          { icon: Bell, id: "notifs" },
          { icon: User, id: "profile" },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 py-1", activeNav === item.id ? "text-nf-accent" : "text-nf-dim")}
          >
            <item.icon size={18} />
            <span className="text-[8px] font-semibold">{item.id === "home" ? t("sb.home") : item.id === "hot" ? t("sb.popular") : item.id === "notifs" ? t("sb.notifs") : t("sb.profile")}</span>
            {item.id === "notifs" && unreadCount > 0 && <span className="absolute top-0.5 right-1/2 translate-x-2 w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>
    </nav>
    </>
  );
}
