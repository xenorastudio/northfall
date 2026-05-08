"use client";

import { Flame, Sparkles, TrendingUp, Hash, ChevronDown, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "./I18nProvider";

const trendingTags = ["#Unity", "#Unreal", "#Godot", "#Blender", "#GameDev", "#UE5", "#3D", "#IndieDev", "#CSharp", "#OpenSource"];

interface FeedSortProps {
  onSortChange?: (sort: string) => void;
  onTagClick?: (tag: string) => void;
  tagFilter?: string | null;
  feedMode?: "all" | "following";
  onFeedModeChange?: (mode: "all" | "following") => void;
  requireAuth?: (action: () => void) => void;
}

export default function FeedSort({ onSortChange, onTagClick, tagFilter, feedMode = "all", onFeedModeChange, requireAuth }: FeedSortProps) {
  const { t, lang } = useI18n();
  const [active, setActive] = useState("hot");
  const [showTrending, setShowTrending] = useState(false);

  const sortOptions = [
    { icon: Flame, label: t("fs.hot"), id: "hot" },
    { icon: Sparkles, label: t("fs.new"), id: "new" },
    { icon: TrendingUp, label: t("fs.top"), id: "top" },
  ];

  return (
    <div className="bg-nf-secondary/30 border border-nf-border-2/50 rounded-xl px-2 py-1.5 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Feed mode: الكل / المتابَعين */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onFeedModeChange?.("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
              feedMode === "all" ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted"
            )}
          >
            {t("gen.all")}
          </button>
          <button
            onClick={() => requireAuth ? requireAuth(() => onFeedModeChange?.("following")) : onFeedModeChange?.("following")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
              feedMode === "following" ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted"
            )}
          >
            {t("gen.following")}
          </button>
        </div>

        <div className="h-4 w-px bg-nf-border-2" />

        {/* Sort buttons */}
        <div className="flex items-center gap-0.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setActive(opt.id); onSortChange?.(opt.id); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
                active === opt.id
                  ? "bg-nf-accent/15 text-nf-accent"
                  : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted"
              )}
            >
              <opt.icon size={14} />
              <span>{opt.label}</span>
            </button>
          ))}

          {/* Trending dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTrending(!showTrending)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
                showTrending ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted"
              )}
            >
              <Hash size={14} />
              <span>{t("fs.trending")}</span>
              <ChevronDown size={12} className={cn("transition-transform", showTrending && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showTrending && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border rounded-lg p-3 shadow-xl z-20 min-w-[200px]"
                >
                  <div className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-2">{t("fs.topNow")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => { onTagClick?.(tag.replace("#", "")); setShowTrending(false); }}
                        className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                          tagFilter === tag.replace("#", "") ? "bg-nf-accent/20 text-nf-accent" : "bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-white")}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Active tag filter */}
        {tagFilter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-nf-accent/15 text-nf-accent text-[11px] font-bold"
          >
            <Hash size={12} />
            {tagFilter}
            <button onClick={() => onTagClick?.(tagFilter)} className="hover:text-white transition-colors mr-0.5">
              <X size={10} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
