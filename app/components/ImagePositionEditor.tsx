"use client";

import { useCallback, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MEDIA_SCALE_MAX,
  MEDIA_SCALE_MIN,
  normalizeMediaPosition,
  type MediaPosition,
} from "@/lib/media-object-position";
import MediaCoverImage from "./MediaCoverImage";

type ImagePositionEditorProps = {
  imageUrl: string;
  position: MediaPosition;
  onPositionChange: (pos: MediaPosition) => void;
  aspectRatio?: number;
  variant?: "banner" | "avatar";
  inModal?: boolean;
  className?: string;
};

function SafeZoneOverlay() {
  const desktopY = 18;
  const desktopBottom = 18;
  const mobileX = 12;
  const mobileY = 28;

  return (
    <>
      <div className="absolute inset-x-0 top-0 bg-black/45 pointer-events-none z-[8]" style={{ height: `${desktopY}%` }} />
      <div className="absolute inset-x-0 bottom-0 bg-black/45 pointer-events-none z-[8]" style={{ height: `${desktopBottom}%` }} />
      <div
        className="absolute left-0 bg-black/45 pointer-events-none z-[8]"
        style={{ top: `${desktopY}%`, bottom: `${desktopBottom}%`, width: "4%" }}
      />
      <div
        className="absolute right-0 bg-black/45 pointer-events-none z-[8]"
        style={{ top: `${desktopY}%`, bottom: `${desktopBottom}%`, width: "4%" }}
      />

      <div
        className="absolute border-2 border-white/35 pointer-events-none z-10"
        style={{ inset: `${desktopY}% 4%` }}
      />
      <span
        className="absolute z-20 text-[9px] font-semibold text-white/75 pointer-events-none"
        style={{ left: "5%", top: `${desktopY + 1}%` }}
      >
        قابلة للعرض على أجهزة الكمبيوتر
      </span>

      <div
        className="absolute border-2 border-sky-400 pointer-events-none z-10"
        style={{
          left: `${mobileX}%`,
          right: `${mobileX}%`,
          top: `${mobileY}%`,
          bottom: `${mobileY}%`,
        }}
      />
      <span
        className="absolute z-20 text-[9px] font-bold text-sky-100 bg-black/50 px-1.5 py-0.5 rounded pointer-events-none"
        style={{ left: `${mobileX + 0.5}%`, top: `${mobileY + 1}%` }}
      >
        قابلة للعرض على كل الأجهزة
      </span>
    </>
  );
}

export default function ImagePositionEditor({
  imageUrl,
  position,
  onPositionChange,
  aspectRatio = 16 / 9,
  variant = "banner",
  inModal = false,
  className,
}: ImagePositionEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const pos = normalizeMediaPosition(position);
  const isBanner = variant === "banner";

  const update = useCallback(
    (patch: Partial<MediaPosition>) => {
      onPositionChange(normalizeMediaPosition({ ...pos, ...patch }));
    },
    [onPositionChange, pos]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imageUrl.trim()) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
      setDragging(true);
    },
    [imageUrl, pos.x, pos.y]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      const el = frameRef.current;
      if (!d || !el) return;
      const rect = el.getBoundingClientRect();
      const sens = isBanner ? 2.4 : 2;
      const dx = ((e.clientX - d.px) / Math.max(rect.width, 1)) * 100 * sens;
      const dy = ((e.clientY - d.py) / Math.max(rect.height, 1)) * 100 * sens;
      const nextX = Math.min(100, Math.max(0, d.x - dx));
      const nextY = Math.min(100, Math.max(0, d.y - dy));
      update({ x: nextX, y: nextY });
      dragRef.current = { px: e.clientX, py: e.clientY, x: nextX, y: nextY };
    },
    [isBanner, update]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!imageUrl.trim()) return;
      e.preventDefault();
      const step = e.shiftKey ? 4 : 8;
      const delta = e.deltaY > 0 ? -step : step;
      update({ scale: pos.scale + delta });
    },
    [imageUrl, pos.scale, update]
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className={cn(!inModal && "rounded-xl border border-nf-border-2 overflow-hidden bg-nf-card", className)}>
      <div
        ref={frameRef}
        className={cn(
          "relative w-full select-none touch-none overflow-hidden",
          inModal ? "bg-black rounded-lg" : "bg-nf-secondary/40",
          dragging ? "cursor-grabbing" : "cursor-grab",
          !isBanner && !inModal && "mx-auto max-w-[220px] rounded-full aspect-square border-4 border-nf-body shadow-lg my-3",
          !isBanner && inModal && "mx-auto max-w-[240px] rounded-full aspect-square border-4 border-white/20 shadow-lg my-2"
        )}
        style={isBanner ? { aspectRatio } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
      >
        <MediaCoverImage
          src={imageUrl}
          position={pos}
          className="absolute inset-0 w-full h-full"
          imgClassName="pointer-events-none"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
          }}
        />

        {isBanner && inModal && <SafeZoneOverlay />}
        {isBanner && !inModal && (
          <div className="absolute inset-0 pointer-events-none border border-nf-accent/25" />
        )}
      </div>

      <div className={cn("space-y-1", inModal ? "py-3" : "px-3 py-3 border-t border-nf-border-2/60")}>
        <div className="flex items-center gap-2">
          <ZoomOut size={12} className={cn("shrink-0", inModal ? "text-white/50" : "text-nf-dim")} />
          <input
            type="range"
            min={MEDIA_SCALE_MIN}
            max={MEDIA_SCALE_MAX}
            step={1}
            value={pos.scale}
            onChange={(e) => update({ scale: Number(e.target.value) })}
            className="flex-1 h-1.5 accent-white cursor-pointer"
          />
          <ZoomIn size={12} className={cn("shrink-0", inModal ? "text-white/50" : "text-nf-dim")} />
          <span className={cn("text-[10px] font-mono w-9 text-end tabular-nums", inModal ? "text-white/50" : "text-nf-dim")}>
            {pos.scale}%
          </span>
        </div>
        {inModal && (
          <p className="text-[10px] text-white/45 text-center">
            اسحب الصورة في أي اتجاه · عجلة الفأرة للتكبير
          </p>
        )}
      </div>
    </div>
  );
}
