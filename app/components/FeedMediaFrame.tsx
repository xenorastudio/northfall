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

/** إطار وسائط — صورة نظيفة بدون blur */
export default function FeedMediaFrame({
  src,
  alt = "",
  className,
  imgClassName,
  maxHeight = "min(520px, 72vh)",
  onImageClick,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-[var(--bg-secondary)]",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onClick={onImageClick}
        style={{ maxHeight }}
        className={cn(
          "w-full h-auto block object-contain mx-auto",
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
