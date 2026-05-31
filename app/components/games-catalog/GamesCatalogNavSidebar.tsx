"use client";

import {
  Calendar,
  ChevronDown,
  Crown,
  Flame,
  FolderOpen,
  Gamepad2,
  Monitor,
  RotateCcw,
  Star,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type ActiveTab = "all" | "followed" | "trending" | "new" | "best" | "hot";

const TAB_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: "new", label: "جديد", icon: <Flame size={16} /> },
  { id: "trending", label: "رائج", icon: <TrendingUp size={16} /> },
  { id: "best", label: "الأفضل", icon: <Crown size={16} /> },
  { id: "hot", label: "شائع", icon: <Star size={16} /> },
  { id: "followed", label: "مفضلتي", icon: <Star size={16} className="fill-current" /> },
  { id: "all", label: "كل الألعاب", icon: <Gamepad2 size={16} /> },
];

function NavRow({
  active,
  onClick,
  icon,
  label,
  trailing,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full py-2 text-[13px] font-medium transition-colors text-right",
        active ? "text-white" : "text-white/50 hover:text-white/85"
      )}
    >
      <span className={cn("shrink-0 opacity-80", active && "opacity-100 text-white")}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide py-2">{children}</p>
  );
}

export default function GamesCatalogNavSidebar({
  activeTab,
  onTabChange,
  genreFilter,
  onGenreFilter,
  platformFilter,
  onPlatformFilter,
  topGenres,
  platformOptions,
}: {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  genreFilter: string | null;
  onGenreFilter: (genre: string | null) => void;
  platformFilter: string | null;
  onPlatformFilter: (platform: string | null) => void;
  topGenres: string[];
  platformOptions: string[];
}) {
  const [browseOpen, setBrowseOpen] = useState(true);
  const tabActive = (id: ActiveTab) => activeTab === id && !genreFilter && !platformFilter;

  return (
    <aside className="hidden lg:flex w-[200px] xl:w-[220px] shrink-0 flex-col pt-8 pb-12 ps-5 pe-4 xl:pe-5 border-s border-white/[0.06]">
      <nav className="w-full">
        <SectionLabel>تصفح الكتالوج</SectionLabel>

        <div className="space-y-0.5 mb-1">
          {TAB_ITEMS.map((tab) => (
            <NavRow
              key={tab.id}
              active={tabActive(tab.id)}
              onClick={() => onTabChange(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
          <NavRow
            active={false}
            onClick={() => onTabChange("new")}
            icon={<Calendar size={16} />}
            label="إصدارات حديثة"
          />
        </div>

        <div className="h-px bg-white/[0.06] my-3" />

        <SectionLabel>تصفية</SectionLabel>
        <NavRow
          active={false}
          onClick={() => setBrowseOpen((o) => !o)}
          icon={<FolderOpen size={16} />}
          label="النوع والمنصة"
          trailing={
            <ChevronDown size={14} className={cn("text-white/35 shrink-0", browseOpen && "rotate-180")} />
          }
        />

        {browseOpen && (
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-[9px] font-semibold text-white/25 mb-1.5">النوع</p>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {topGenres.slice(0, 10).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      onGenreFilter(genreFilter === g ? null : g);
                      onPlatformFilter(null);
                    }}
                    className={cn(
                      "text-[11px] font-medium transition-colors py-0.5 border-b-2 border-transparent",
                      genreFilter === g
                        ? "text-white border-white/70"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-semibold text-white/25 mb-1.5">المنصة</p>
              <div className="space-y-0.5">
                {platformOptions.slice(0, 6).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onPlatformFilter(platformFilter === p ? null : p);
                      onGenreFilter(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full py-1.5 text-[12px] font-medium transition-colors",
                      platformFilter === p ? "text-white" : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {p === "PC" ? <Monitor size={13} /> : <Gamepad2 size={13} />}
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(genreFilter || platformFilter || activeTab !== "all") && (
          <>
            <div className="h-px bg-white/[0.06] my-3" />
            <button
              type="button"
              onClick={() => {
                onGenreFilter(null);
                onPlatformFilter(null);
                onTabChange("all");
              }}
              className="flex items-center gap-2 w-full py-2 text-[12px] font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              <RotateCcw size={13} />
              مسح الفلاتر
            </button>
          </>
        )}
      </nav>
    </aside>
  );
}
