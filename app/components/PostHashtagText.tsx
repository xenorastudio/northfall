"use client";

import { splitTextByHashtags } from "@/lib/hashtags";
import { cleanArabicText } from "@/lib/clean-arabic-text";
import { cn } from "@/lib/utils";

const hashtagClass = "nf-hashtag";

export default function PostHashtagText({
  text,
  className,
  onHashtagClick,
}: {
  text: string;
  className?: string;
  onHashtagClick?: (tag: string) => void;
}) {
  const segments = splitTextByHashtags(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type !== "hashtag") {
          return (
            <span key={i} className="group-hover:text-nf-accent transition-colors duration-150">
              {cleanArabicText(seg.value)}
            </span>
          );
        }

        const label = (
          <>
            <span>#</span>
            {seg.value}
          </>
        );

        if (onHashtagClick) {
          return (
            <button
              key={`${seg.value}-${i}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHashtagClick(seg.value);
              }}
              className={cn(hashtagClass)}
              dir="ltr"
            >
              {label}
            </button>
          );
        }

        return (
          <span key={`${seg.value}-${i}`} className={cn(hashtagClass)} dir="ltr">
            {label}
          </span>
        );
      })}
    </span>
  );
}
