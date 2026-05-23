"use client";

import { Home, Flame, Sparkles, TrendingUp, User, Bookmark, Bell, Settings, HelpCircle, Shield, Plus, Search, MessageSquare, Gamepad2, X, Rss, Pencil, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
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
  games: "/app?view=games",
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

export default function SidebarLeft({ onNavClick, onCommunityClick, activeNav, onCreateCommunity, onDashboardClick, onCustomFeedClick, onCreateCustomFeed, onEditCustomFeed, customFeeds, activeCustomFeedId }: {
  onNavClick: (id: string) => void;
  onCommunityClick: (name: string) => void;
  activeNav: string;
  onCreateCommunity?: () => void;
  onDashboardClick?: (name: string) => void;
  onCustomFeedClick?: (feed: CustomFeed) => void;
  onCreateCustomFeed?: () => void;
  onEditCustomFeed?: (feed: CustomFeed) => void;
  customFeeds?: CustomFeed[];
  activeCustomFeedId?: string | null;
}) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { unreadCount, communities: allComms, joinedCommunities: joinedNames } = useData();
  const [commSearch, setCommSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const createdComms = allComms.filter((c) => c.creatorUid === user?.uid);
  const joinedComms = allComms.filter((c) => joinedNames.includes(c.name) && c.creatorUid !== user?.uid);
  const filteredComms = commSearch.trim()
    ? allComms.filter(
        (c) =>
          c.name.toLowerCase().includes(commSearch.toLowerCase()) ||
          c.label.toLowerCase().includes(commSearch.toLowerCase())
      )
    : allComms;

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);  const browseItemsInner = [
    { icon: Home, labelKey: "sb.home", id: "home" },
    { icon: Flame, labelKey: "sb.popular", id: "hot" },
    { icon: Sparkles, labelKey: "fs.new", id: "new" },
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
          <div className="flex items-center justify-between px-3.5 py-2 pb-1">
            <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">فيدات مخصصة</span>
            <button
              onClick={onCreateCustomFeed}
              className="p-1 rounded text-nf-dim hover:text-nf-accent transition-colors"
              title="إنشاء فيد جديد"
            >
              <Plus size={12} />
            </button>
          </div>

          {customFeeds && customFeeds.length > 0 ? (
            customFeeds.map((feed) => {
              const isActive = activeCustomFeedId === feed.id;
              return (
                <div key={feed.id} className="relative flex items-center mx-2">
                  <button
                    onClick={() => onCustomFeedClick?.(feed)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150 pr-8",
                      isActive ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-nf-accent/15 flex items-center justify-center shrink-0">
                      <Rss size={10} className="text-nf-accent" />
                    </div>
                    <span className="truncate flex-1 text-right">{feed.name}</span>
                    <span className="text-[9px] font-medium text-nf-dim shrink-0">
                      {feed.communities.length}
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditCustomFeed?.(feed); }}
                    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded text-nf-dim hover:text-nf-accent transition-colors opacity-0 hover:opacity-100 focus:opacity-100 [.group:hover_&]:opacity-100"
                    title="تعديل"
                    style={{ pointerEvents: "auto" }}
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              );
            })
          ) : (
            <button
              onClick={onCreateCustomFeed}
              className="flex items-center gap-2 mx-2 px-2.5 py-2 rounded-lg text-[11px] text-nf-dim hover:bg-nf-hover hover:text-nf-muted transition-colors"
            >
              <Plus size={12} />
              <span>إنشاء فيد مخصص</span>
            </button>
          )}
        </div>
      )}

      {/* My Communities */}
      {user && (createdComms.length > 0 || joinedComms.length > 0) && (
        <div className="flex flex-col gap-px mb-2">
          <div className="flex items-center justify-between px-3.5 py-2 pb-1">
            <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">مجتمعاتي</span>
            <button
              onClick={() => onNavClick("manage-communities")}
              className="p-1 rounded text-nf-dim hover:text-nf-accent transition-colors"
              title="إدارة المجتمعات"
            >
              <Settings size={11} />
            </button>
          </div>
          {createdComms.map((c) => (
            <div key={c.name} className="flex items-center mx-2 group">
              <Link
                href={`/community/${encodeURIComponent(c.name)}`}
                onClick={(e) => { e.preventDefault(); onCommunityClick(c.name); }}
                className={cn(
                  "flex items-center gap-2.5 flex-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150",
                  activeNav === c.name ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                )}
              >
                {c.img ? (
                  <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-nf-accent/20 flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">n/</div>
                )}
                <span className="truncate flex-1">{c.label || `n/${c.name}`}</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-nf-accent/10 text-nf-accent font-bold shrink-0">مؤسس</span>
              </Link>
              {onDashboardClick && (
                <button onClick={() => onDashboardClick(c.name)}
                  className="p-1.5 rounded text-nf-dim opacity-0 group-hover:opacity-100 hover:text-nf-accent transition-all shrink-0"
                  title="لوحة التحكم">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {joinedComms.map((c) => (
            <Link key={c.name} href={`/community/${encodeURIComponent(c.name)}`}
              onClick={(e) => { e.preventDefault(); onCommunityClick(c.name); }}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium mx-2 transition-colors duration-150",
                activeNav === c.name ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
              )}>
              {c.img ? (
                <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-nf-secondary flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">n/</div>
              )}
              <span className="truncate">{c.label || `n/${c.name}`}</span>
            </Link>
          ))}
        </div>
      )}

      {/* All Communities */}
      <div className="flex flex-col gap-px mb-2">
        <div className="text-[10px] font-bold text-nf-dim uppercase tracking-wider px-3.5 py-2 pb-1">
          {t("sb.communities")}
        </div>
        <div className="px-3 pb-1.5">
          <div className="relative">
            <Search size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={commSearch} onChange={e => setCommSearch(e.target.value)}
              placeholder={t("sb.searchComm")}
              className="w-full !bg-nf-secondary border border-nf-border-2 rounded-lg pr-7 pl-6 py-1.5 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/50 transition-colors" />
            {commSearch && (
              <button onClick={() => setCommSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-nf-dim hover:text-nf-text">
                <X size={10} />
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {filteredComms.length === 0 ? (
            <div className="px-3.5 py-2 text-[11px] text-nf-dim text-center">لا توجد نتائج</div>
          ) : (
            filteredComms.map((c) => (
              <Link key={c.name} href={`/community/${encodeURIComponent(c.name)}`}
                onClick={(e) => { e.preventDefault(); onCommunityClick(c.name); }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium mx-2 transition-colors duration-150",
                  activeNav === c.name ? "bg-nf-hover text-nf-text" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                )}>
                {c.img ? (
                  <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 opacity-80" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-nf-secondary flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">n/</div>
                )}
                <span className="truncate">{c.label || `n/${c.name}`}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="px-3.5 pb-2">
        <button onClick={onCreateCommunity} className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-nf-border rounded-lg text-xs font-medium text-nf-muted hover:bg-nf-hover hover:text-[#999] transition-colors duration-150">
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
          { icon: Gamepad2, id: "games" },
          { icon: Bell, id: "notifs" },
          { icon: User, id: "profile" },
        ].map(item => (
          <button key={item.id} onClick={() => onNavClick(item.id)} className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 py-1", activeNav === item.id ? "text-nf-accent" : "text-nf-dim")}>
            <item.icon size={18} />
            <span className="text-[8px] font-semibold">{item.id === "home" ? t("sb.home") : item.id === "hot" ? t("sb.popular") : item.id === "games" ? "ألعاب" : item.id === "notifs" ? t("sb.notifs") : t("sb.profile")}</span>
            {item.id === "notifs" && unreadCount > 0 && <span className="absolute top-0.5 right-1/2 translate-x-2 w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>
    </nav>
    </>
  );
}
