"use client";

import { cn } from "@/lib/utils";
import { mediaCoverStyle, type MediaPosition } from "@/lib/media-object-position";

type MediaCoverImageProps = {
  src: string;
  alt?: string;
  position?: Partial<MediaPosition> | string | null;
  scale?: number;
  className?: string;
  imgClassName?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
};

export default function MediaCoverImage({
  src,
  alt = "",
  position,
  scale,
  className,
  imgClassName,
  onError,
}: MediaCoverImageProps) {
  if (!src.trim()) return null;
  return (
    <div className={cn("overflow-hidden", className)}>
      <img
        src={src.trim()}
        alt={alt}
        draggable={false}
        className={cn("w-full h-full object-cover", imgClassName)}
        style={mediaCoverStyle(position, scale)}
        onError={onError}
      />
    </div>
  );
}
