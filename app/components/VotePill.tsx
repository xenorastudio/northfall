"use client";

import { ThumbsUp, ThumbsDown, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerVoteFeedback } from "@/lib/vote-feedback";

type Props = {
  count: number;
  myVote: -1 | 0 | 1;
  onUp: () => void;
  onDown: () => void;
  size?: "sm" | "md";
  className?: string;
};

const countSpring = { type: "spring" as const, stiffness: 480, damping: 16 };

function VoteSideBtn({
  icon: Icon,
  iconSize,
  active,
  tone,
  label,
  onClick,
}: {
  icon: LucideIcon;
  iconSize: number;
  active: boolean;
  tone: "up" | "down";
  label: string;
  onClick: () => void;
}) {
  const isUp = tone === "up";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    triggerVoteFeedback(tone, e.currentTarget);
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative size-7 rounded-full inline-flex items-center justify-center",
        active && isUp && "text-blue-400 bg-blue-500/10",
        active && !isUp && "text-red-400 bg-red-500/10",
        !active && isUp && "text-nf-dim hover:text-blue-400 hover:bg-blue-500/8",
        !active && !isUp && "text-nf-dim hover:text-red-400 hover:bg-red-500/8"
      )}
      style={{ transition: "color 0.15s ease, background-color 0.15s ease" }}
      aria-label={label}
    >
      <Icon size={iconSize} fill={active ? "currentColor" : "none"} strokeWidth={2.25} className="block" />
    </button>
  );
}

export default function VotePill({ count, myVote, onUp, onDown, size = "md", className }: Props) {
  const icon = size === "sm" ? 12 : 14;
  const displayCount = Math.max(0, count);

  return (
    <div
      className={cn(
        "nf-post-action inline-flex items-center gap-0 border border-nf-border-2/50 rounded-full px-0.5 py-0 bg-transparent",
        className
      )}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <VoteSideBtn
        icon={ThumbsUp}
        iconSize={icon}
        active={myVote === 1}
        tone="up"
        label="أعجبني"
        onClick={onUp}
      />

      <motion.span
        dir="ltr"
        key={`${displayCount}-${myVote}`}
        initial={{ scale: 0.88, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={countSpring}
        className={cn(
          "font-bold tabular-nums text-center leading-none flex items-center justify-center unicode-bidi-plaintext min-w-[20px] px-0.5",
          size === "sm" ? "text-[11px] min-w-[16px]" : "text-xs",
          myVote === 1
            ? "text-blue-400"
            : myVote === -1
              ? "text-red-400"
              : displayCount > 0
                ? "text-nf-text"
                : "text-nf-dim"
        )}
      >
        {displayCount}
      </motion.span>

      <VoteSideBtn
        icon={ThumbsDown}
        iconSize={icon}
        active={myVote === -1}
        tone="down"
        label="لم يعجبني"
        onClick={onDown}
      />
    </div>
  );
}
