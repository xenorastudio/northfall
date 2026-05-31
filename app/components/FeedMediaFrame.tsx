"use client";

import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  maxHeight?: string;
  onImageClick?: () => void;
  children?: React.ReactNode;
};

/** إطار وسائط مع ضباب الجوانب مثل Reddit */
export default function FeedMediaFrame({
  src,
  alt = "",
  className,
  imgClassName,
  maxHeight = "min(480px, 72vh)",
  onImageClick,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "nf-feed-media-frame relative overflow-hidden rounded-lg bg-[var(--bg-secondary)]",
        className
      )}
    >
      <img
        src={src}
        alt=""
        aria-hidden
        className="nf-feed-media-backdrop absolute inset-0 w-full h-full object-cover scale-[1.15] pointer-events-none select-none"
        loading="lazy"
        draggable={false}
      />
      <div className="absolute inset-0 bg-black/45 pointer-events-none" aria-hidden />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onClick={onImageClick}
        style={{ maxHeight }}
        className={cn(
          "relative z-[1] w-full h-auto block object-contain mx-auto",
          onImageClick && "cursor-zoom-in",
          imgClassName
        )}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      {children}
    </div>
  );
}
