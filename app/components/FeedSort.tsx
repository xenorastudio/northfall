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
  "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors duration-150";
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
    <div className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2 overflow-visible">
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

      <div className="rounded-lg border border-nf-border-2/55 px-1.5 sm:px-2 py-1.5">
        <div className="flex items-center gap-1 flex-wrap">
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
              requireAuth
                ? requireAuth(() => onFeedModeChange?.("following"))
                : onFeedModeChange?.("following")
            }
            className={cn(tabBase, feedMode === "following" ? tabActive : tabIdle)}
          >
            {t("gen.following")}
          </button>

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

          <div className="relative z-50 overflow-visible" ref={trendingRef}>
            <button
              type="button"
              onClick={() => setShowTrending(!showTrending)}
              className={cn(
                tabBase,
                showTrending || tagFilter ? tabActive : tabIdle,
                tagFilter && "ring-1 ring-nf-accent/35"
              )}
              title={tagFilter ? `#${tagFilter.replace(/^#+/, "")}` : undefined}
            >
              <Hash size={13} className="opacity-70" />
              <span>{t("fs.trending")}</span>
              <ChevronDown
                size={11}
                className={cn("opacity-60 transition-transform", showTrending && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {showTrending && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full mt-1 right-0 bg-nf-card border border-nf-border-2 rounded-lg p-2.5 shadow-xl z-[200] min-w-[220px] max-w-[min(320px,calc(100vw-2rem))]"
                >
                  {trendingLoading && trendingTopics.length === 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-7 w-14 rounded-lg bg-nf-secondary/50 animate-pulse" />
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
                              "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                              activeTag
                                ? "bg-nf-accent/15 text-nf-accent"
                                : "bg-nf-secondary/60 text-nf-muted hover:bg-nf-hover"
                            )}
                          >
                            {topic.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-nf-dim py-0.5">
                      لا توجد هاشتاقات بعد — استخدم #في منشورك
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
