"use client";

import { Home, Flame, Sparkles, TrendingUp, User, Bookmark, Bell, Settings, HelpCircle, Shield, Plus, Search, MessageSquare, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const communities = [
  { name: "Unity", label: "n/Unity", img: "/assets/images/unitylogo.png" },
  { name: "Unreal", label: "n/Unreal", img: "/assets/images/unreallogo.svg" },
  { name: "Godot", label: "n/Godot", img: "/assets/images/godotlogo.png" },
  { name: "Blender", label: "n/Blender", img: "/assets/images/logoblender.png" },
];

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
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            "relative flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium mx-2 transition-colors duration-150",
            active === item.id
              ? "bg-nf-hover text-white"
              : "text-nf-muted hover:bg-nf-hover hover:text-white"
          )}
        >
          <item.icon size={18} className={cn("shrink-0", active === item.id ? "opacity-100" : "opacity-50")} />
          <span>{t(item.labelKey)}</span>
          {badges && badges[item.id] > 0 && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-nf-accent text-white text-[9px] font-bold min-w-[18px] text-center">{badges[item.id] > 99 ? "99+" : badges[item.id]}</span>
          )}
          {active === item.id && (
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-nf-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

export default function SidebarLeft({ onNavClick, onCommunityClick, activeNav }: {
  onNavClick: (id: string) => void;
  onCommunityClick: (name: string) => void;
  activeNav: string;
}) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [commSearch, setCommSearch] = useState("");
  const [joinedComms, setJoinedComms] = useState<{ name: string; label: string; img: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const filteredComms = commSearch.trim() ? communities.filter(c => c.name.toLowerCase().includes(commSearch.toLowerCase()) || c.label.toLowerCase().includes(commSearch.toLowerCase())) : communities;

  // Fetch joined communities from Firebase
  useEffect(() => {
    if (!user) { setJoinedComms([]); return; }
    async function fetchJoined() {
      try {
        const snap = await getDocs(collection(db, "users", user!.uid, "communities"));
        const commImgMap: Record<string, string> = {
          Unity: "/assets/images/unitylogo.png",
          Unreal: "/assets/images/unreallogo.svg",
          Godot: "/assets/images/godotlogo.png",
          Blender: "/assets/images/logoblender.png",
        };
        const items = snap.docs.map(d => {
          const name = d.data().name || d.id;
          return { name, label: `n/${name}`, img: commImgMap[name] || "" };
        });
        setJoinedComms(items);
      } catch (e) { console.error(e); }
    }
    fetchJoined();
  }, [user]);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    async function fetchUnread() {
      try {
        const q = query(collection(db, "users", user!.uid, "notifications"), where("read", "==", false));
        const snap = await getDocs(q);
        setUnreadCount(snap.size);
      } catch (e) { console.error(e); }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const browseItemsInner = [
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
    <aside className="hidden md:flex fixed top-12 bottom-0 w-[260px] overflow-y-auto bg-nf-nav border-r border-nf-border-subtle py-2 flex-col z-100" style={{ left: 0 }}>
      <NavSection title={t("sb.browse")} items={browseItemsInner} active={activeNav} onSelect={onNavClick} />

      <div className="h-px bg-nf-border-subtle mx-3 my-1" />

      <NavSection title={t("sb.personal")} items={personalItemsInner} active={activeNav} onSelect={onNavClick} badges={{ notifs: unreadCount }} />

      <div className="h-px bg-nf-border-subtle mx-3 my-1" />

      {/* Joined Communities */}
      {user && joinedComms.length > 0 && (
        <div className="flex flex-col gap-px mb-2">
          <div className="text-[10px] font-bold text-nf-accent uppercase tracking-wider px-3.5 py-2 pb-1">
            {t("gen.myCommunities")}
          </div>
          {joinedComms.map((c) => (
            <button
              key={c.name}
              onClick={() => onCommunityClick(c.name)}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium mx-2 transition-colors duration-150",
                activeNav === c.name
                  ? "bg-nf-hover text-white"
                  : "text-nf-muted hover:bg-nf-hover hover:text-white"
              )}
            >
              {c.img ? (
                <img src={c.img} alt="" className="w-[18px] h-[18px] rounded-full opacity-80" />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full bg-nf-accent/20 flex items-center justify-center text-[8px] text-nf-accent font-bold">n/</div>
              )}
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Communities */}
      <div className="flex flex-col gap-px mb-2">
        <div className="text-[10px] font-bold text-nf-dim uppercase tracking-wider px-3.5 py-2 pb-1">
          {t("sb.communities")}
        </div>
        <div className="px-3.5 pb-1.5">
          <div className="relative">
            <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-nf-dim" />
            <input type="text" value={commSearch} onChange={(e) => setCommSearch(e.target.value)} placeholder={t("sb.searchComm")} className="w-full bg-nf-secondary border border-nf-border-2 rounded-md pr-7 pl-2 py-1 text-[11px] text-white placeholder:text-nf-dim outline-none focus:border-white/20 transition-colors" />
            {commSearch && <button onClick={() => setCommSearch("")} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-nf-dim hover:text-white text-[10px]">✕</button>}
          </div>
        </div>
        {filteredComms.map((c) => (
          <button
            key={c.name}
            onClick={() => onCommunityClick(c.name)}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium mx-2 transition-colors duration-150",
              activeNav === c.name
                ? "bg-nf-hover text-white"
                : "text-nf-muted hover:bg-nf-hover hover:text-white"
            )}
          >
            <img src={c.img} alt="" className="w-[18px] h-[18px] rounded-full opacity-60" />
            <span>{c.label}</span>
          </button>
        ))}
        {filteredComms.length === 0 && <div className="px-3.5 py-2 text-[11px] text-nf-dim text-center">{t("search.noResults")}</div>}
      </div>

      <div className="px-3.5 pb-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-nf-border rounded-lg text-xs font-medium text-nf-muted hover:bg-nf-hover hover:text-[#999] transition-colors duration-150">
          <Plus size={14} />
          <span>{t("sb.createCommunity")}</span>
        </button>
      </div>

      <NavSection title={t("sb.system")} items={systemItems} active={activeNav} onSelect={onNavClick} />

      {/* Footer */}
      <div className="mt-auto px-4 py-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-nf-dim mb-2">
          <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px] font-mono">⌘K</kbd> بحث</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px] font-mono">⌘N</kbd> منشور جديد</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px] text-nf-muted">
          <a href="#" className="hover:text-white">{t("sr.privacy")}</a>
          <span className="text-nf-dim">•</span>
          <a href="#" className="hover:text-white">{t("sr.terms")}</a>
        </div>
        <p className="text-[11px] text-nf-dim mt-1.5">© 2026 NorthFall. {t("gen.allRightsReserved")}</p>
      </div>
    </aside>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[1001] bg-nf-nav/95 backdrop-blur-xl border-t border-nf-border-subtle safe-area-bottom">
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
