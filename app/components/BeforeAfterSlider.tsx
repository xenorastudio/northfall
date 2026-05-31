"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

export interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  onClose: () => void;
  authorName?: string;
  authorPhoto?: string;
  title?: string;
}

function fitFrame(naturalW: number, naturalH: number) {
  const maxW = Math.min(typeof window !== "undefined" ? window.innerWidth * 0.96 : 900, 900);
  const maxH = Math.min(typeof window !== "undefined" ? window.innerHeight * 0.78 : 680, 680);
  const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
  return {
    w: Math.max(1, Math.round(naturalW * scale)),
    h: Math.max(1, Math.round(naturalH * scale)),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load failed"));
    img.src = src;
  });
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "قبل",
  afterLabel = "بعد",
  onClose,
  authorName,
  authorPhoto,
  title,
}: BeforeAfterSliderProps) {
  const [pct, setPct] = useState(50);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const showMeta = !!(authorName?.trim() || title?.trim());
  const shortTitle = (() => {
    const t = title?.trim();
    if (!t) return "";
    const max = 56;
    return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
  })();

  const calc = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPct(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  useEffect(() => {
    setReady(false);
    setFrame(null);
    setPct(50);
  }, [before, after]);

  useEffect(() => {
    let cancelled = false;
    loadImage(after)
      .then((img) => {
        if (cancelled) return;
        setFrame(fitFrame(img.naturalWidth, img.naturalHeight));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [after, before]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragging.current) calc(e.clientX);
    };
    const touch = (e: TouchEvent) => {
      if (dragging.current) calc(e.touches[0].clientX);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", touch, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", touch);
      window.removeEventListener("touchend", up);
    };
  }, [calc]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setPct((p) => Math.max(0, p - 3));
      if (e.key === "ArrowRight") setPct((p) => Math.min(100, p + 3));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-black"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {showMeta ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/15 bg-white/5">
              {authorPhoto ? (
                <img src={authorPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">
                  <User size={16} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-right max-w-[min(100%,520px)]">
              {authorName?.trim() && (
                <p className="text-[11px] font-medium text-white/55 truncate">
                  u/{authorName.trim()}
                </p>
              )}
              {shortTitle && (
                <p className="text-[12px] font-normal text-white/40 leading-snug line-clamp-1 mt-0.5">
                  {shortTitle}
                </p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-white/35 tabular-nums">
            {beforeLabel}
            <span className="mx-1.5 text-white/20">/</span>
            {afterLabel}
          </span>
        )}
      </div>

      <div
        className="flex-1 flex items-center justify-center min-h-0 px-3 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!ready || !frame ? (
          <div className="w-7 h-7 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
        ) : (
          <div
            ref={containerRef}
            className="relative cursor-col-resize select-none overflow-hidden bg-black leading-[0]"
            style={{ width: frame.w, height: frame.h }}
            onMouseDown={(e) => {
              dragging.current = true;
              calc(e.clientX);
            }}
            onTouchStart={(e) => {
              dragging.current = true;
              calc(e.touches[0].clientX);
            }}
          >
            <img
              src={after}
              alt={afterLabel}
              draggable={false}
              className="absolute inset-0 block w-full h-full object-cover object-center pointer-events-none"
            />

            <div
              className="absolute top-0 left-0 bottom-0 overflow-hidden pointer-events-none"
              style={{ width: `${pct}%` }}
            >
              <img
                src={before}
                alt={beforeLabel}
                draggable={false}
                className="absolute top-0 left-0 block h-full max-w-none object-cover object-center pointer-events-none"
                style={{ width: frame.w }}
              />
            </div>

            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-10"
              style={{ left: `${pct}%`, marginLeft: -1 }}
            />

            <div
              className="absolute top-1/2 z-10 pointer-events-none flex items-center justify-center w-8 h-8 rounded-full bg-white text-neutral-500 shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
              style={{ left: `${pct}%`, transform: "translate(-50%, -50%)" }}
            >
              <ChevronLeft size={13} strokeWidth={2.5} className="-mr-1.5" />
              <ChevronRight size={13} strokeWidth={2.5} className="-ml-1.5" />
            </div>

            <span className="absolute bottom-2 left-2 z-10 pointer-events-none text-[10px] text-white/65 px-2 py-0.5 rounded-full bg-black/50">
              {beforeLabel}
            </span>
            <span className="absolute bottom-2 right-2 z-10 pointer-events-none text-[10px] text-white/65 px-2 py-0.5 rounded-full bg-black/50">
              {afterLabel}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
