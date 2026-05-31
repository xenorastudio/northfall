"use client";

import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

type Props = {
  blurred: boolean;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  onReveal?: () => void;
  className?: string;
  children: React.ReactNode;
};

/** ضباب NSFW/Spoiler مثل Reddit */
export default function NsfwMediaCover({
  blurred,
  isNsfw,
  isSpoiler,
  onReveal,
  className,
  children,
}: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-black/90", className)}>
      <div className={cn(blurred && "nf-nsfw-blurred")}>{children}</div>
      {blurred && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReveal?.();
          }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-sm cursor-pointer hover:bg-black/45 transition-colors"
        >
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-white tracking-wide">
            {isNsfw ? "NSFW" : "SPOILER"}
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-white/85 font-medium">
            <Eye size={14} />
            اضغط للعرض
          </span>
        </button>
      )}
      {isSpoiler && !blurred && (
        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[9px] font-bold bg-black/50 text-white/80">
          Spoiler
        </span>
      )}
    </div>
  );
}
