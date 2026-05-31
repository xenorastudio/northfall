"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  count: number;
  myVote: -1 | 0 | 1;
  onUp: () => void;
  onDown: () => void;
  size?: "sm" | "md";
  variant?: "icons" | "text";
  className?: string;
};

export default function VotePill({
  count,
  myVote,
  onUp,
  onDown,
  size = "md",
  variant = "icons",
  className,
}: Props) {
  const icon = size === "sm" ? 12 : 14;
  const displayCount = Math.max(0, count);
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  if (variant === "text") {
    return (
      <div
        className={cn("inline-flex items-center gap-1.5", className)}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUp();
          }}
          className={cn(
            textSize,
            "font-medium transition-colors",
            myVote === 1 ? "text-nf-accent" : "text-nf-dim hover:text-nf-muted"
          )}
        >
          تصويت
        </button>
        <span
          dir="ltr"
          className={cn(
            textSize,
            "font-bold tabular-nums",
            myVote === 1 ? "text-nf-accent" : myVote === -1 ? "text-nf-muted" : displayCount > 0 ? "text-nf-text" : "text-nf-dim"
          )}
        >
          {displayCount}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 bg-transparent border border-nf-border-2/50 rounded-full px-1.5 py-0.5", className)}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUp();
        }}
        className={cn(
          "p-1 rounded-md transition-colors duration-150 flex items-center justify-center",
          myVote === 1 ? "text-nf-accent" : "text-nf-dim hover:text-nf-muted"
        )}
        aria-label="أعجبني"
      >
        <ThumbsUp size={icon} />
      </button>
      <span
        dir="ltr"
        className={cn(
          "font-bold tabular-nums text-center leading-none flex items-center justify-center unicode-bidi-plaintext",
          size === "sm" ? "min-w-[16px] text-[11px]" : "min-w-[20px] text-xs",
          myVote === 1 ? "text-nf-accent" : myVote === -1 ? "text-nf-muted" : displayCount > 0 ? "text-nf-text" : "text-nf-dim"
        )}
      >
        {displayCount}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDown();
        }}
        className={cn(
          "p-1 rounded-md transition-colors duration-150 flex items-center justify-center",
          myVote === -1 ? "text-nf-muted" : "text-nf-dim hover:text-nf-muted"
        )}
        aria-label="لم يعجبني"
      >
        <ThumbsDown size={icon} />
      </button>
    </div>
  );
}
