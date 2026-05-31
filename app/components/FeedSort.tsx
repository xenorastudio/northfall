"use client";

import { Flame, Clock, TrendingUp, Hash, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "./I18nProvider";
import { useData } from "./DataProvider";
import { fetchSearchTrending } from "@/lib/search-trending";
import type { TrendingTopic } from "@/lib/search-trending";
import { normalizeInterestTag } from "@/lib/user-interests";

interface FeedSortProps {
  onSortChange?: (sort: string) => void;
  onTagClick?: (tag: string) => void;
  tagFilter?: string | null;
  onTagFilterClear?: () => void;
  feedMode?: "all" | "following";
  onFeedModeChange?: (mode: "all" | "following") => void;
  requireAuth?: (action: () => void) => void;
}

const tabBase =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-150";
const tabActive = "bg-nf-secondary text-nf-text";
const tabIdle = "text-nf-dim hover:bg-nf-hover hover:text-nf-muted";

export default function FeedSort({
  onSortChange,
  onTagClick,
  tagFilter,
  onTagFilterClear,
  feedMode = "all",
  onFeedModeChange,
  requireAuth,
}: FeedSortProps) {
  const { t } = useI18n();
  const { communities } = useData();
  const [active, setActive] = useState("hot");
  const [showTrending, setShowTrending] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const trendingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTrending) return;
    const onDoc = (e: MouseEvent) => {
      if (trendingRef.current?.contains(e.target as Node)) return;
      setShowTrending(false);
    };
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [showTrending]);

  const sortOptions = [
    { icon: Flame, label: t("fs.hot"), id: "hot" },
    { icon: Clock, label: t("fs.new"), id: "new" },
    { icon: TrendingUp, label: t("fs.top"), id: "top" },
  ];

  useEffect(() => {
    if (!showTrending) return;
    let cancelled = false;
    setTrendingLoading(true);
    fetchSearchTrending(
      communities.map((c) => ({
        name: c.name,
        members: c.members,
        category: c.category,
        label: c.label,
      }))
    )
      .then((snap) => {
        if (!cancelled) setTrendingTopics(snap.topics);
      })
      .finally(() => {
        if (!cancelled) setTrendingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showTrending, communities]);

  const pickTopic = (topic: TrendingTopic) => {
    const tag =
      topic.kind === "community"
        ? normalizeInterestTag(topic.key.replace(/^c:/, ""))
        : normalizeInterestTag(topic.label.replace(/^#/, ""));
    if (tag) onTagClick?.(tag);
    setShowTrending(false);
  };

  return (
    <div className="mb-3 space-y-2">
      {tagFilter && (
        <div className="flex items-center justify-between border border-nf-border-2/40 rounded-lg px-3 py-2 bg-nf-hover/30">
          <span className="text-[12px] text-nf-text font-semibold">#{tagFilter.replace(/^#+/, "")}</span>
          <button
            type="button"
            onClick={() => onTagFilterClear?.()}
            className="text-[11px] text-nf-accent hover:underline font-bold"
          >
            إلغاء
          </button>
        </div>
      )}
    <div className="px-0.5 py-1.5 border-b border-nf-border-2/25">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onFeedModeChange?.("all")}
            className={cn(tabBase, feedMode === "all" ? tabActive : tabIdle)}
          >
            {t("gen.all")}
          </button>
          <button
            type="button"
            onClick={() =>
              requireAuth ? requireAuth(() => onFeedModeChange?.("following")) : onFeedModeChange?.("following")
            }
            className={cn(tabBase, feedMode === "following" ? tabActive : tabIdle)}
          >
            {t("gen.following")}
          </button>
        </div>

        <div className="h-4 w-px bg-nf-border-2/50" />

        <div className="flex items-center gap-0.5 flex-wrap">
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setActive(opt.id);
                onSortChange?.(opt.id);
              }}
              className={cn(tabBase, active === opt.id ? tabActive : tabIdle)}
            >
              <opt.icon size={13} className="opacity-70" />
              <span>{opt.label}</span>
            </button>
          ))}

          <div className="relative z-30" ref={trendingRef}>
            <button
              type="button"
              onClick={() => setShowTrending(!showTrending)}
              className={cn(tabBase, showTrending || tagFilter ? tabActive : tabIdle, tagFilter && "ring-1 ring-nf-accent/35")}
              title={tagFilter ? `#${tagFilter.replace(/^#+/, "")}` : undefined}
            >
              <Hash size={13} className="opacity-70" />
              <span>{t("fs.trending")}</span>
              <ChevronDown size={11} className={cn("opacity-60 transition-transform", showTrending && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showTrending && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full mt-1 right-0 bg-nf-card border border-nf-border-2 rounded-xl p-3 shadow-xl z-[100] min-w-[240px] max-w-[320px]"
                >
                  <div className="text-[10px] font-semibold text-nf-dim mb-2 flex items-center gap-2">
                    {t("fs.topNow")}
                    {trendingLoading && (
                      <span className="w-3 h-3 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" />
                    )}
                  </div>
                  {trendingLoading && trendingTopics.length === 0 ? (
                    <div className="space-y-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-7 rounded-lg bg-nf-secondary/50 animate-pulse" />
                      ))}
                    </div>
                  ) : trendingTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {trendingTopics.map((topic) => {
                        const tagKey =
                          topic.kind === "community"
                            ? topic.key.replace(/^c:/, "")
                            : topic.label.replace(/^#/, "");
                        const activeTag = tagFilter === normalizeInterestTag(tagKey);
                        return (
                          <button
                            key={topic.key}
                            type="button"
                            onClick={() => pickTopic(topic)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                              activeTag
                                ? "bg-nf-accent/15 text-nf-accent border border-nf-accent/30"
                                : "bg-nf-secondary/60 text-nf-muted hover:bg-nf-hover border border-transparent"
                            )}
                          >
                            {topic.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-nf-dim py-1">لا توجد هاشتاقات رائجة بعد — انشر بوسم #في منشورك</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
