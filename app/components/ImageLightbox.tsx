"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
  allImages?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  authorName?: string;
  authorPhoto?: string;
  title?: string;
}

export default function ImageLightbox({
  src,
  onClose,
  allImages,
  currentIndex = 0,
  onNavigate,
  authorName,
  authorPhoto,
  title,
}: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false);

  const hasMultiple = allImages && allImages.length > 1;
  const canPrev = hasMultiple && currentIndex > 0;
  const canNext = hasMultiple && currentIndex < (allImages?.length ?? 1) - 1;
  const showMeta = !!(authorName?.trim() || title?.trim());

  const shortTitle = (() => {
    const t = title?.trim();
    if (!t) return "";
    const max = 56;
    return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
  })();

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    document.documentElement.classList.add("lightbox-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.classList.remove("lightbox-open");
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && canPrev && onNavigate) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && canNext && onNavigate) onNavigate(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, canPrev, canNext, onNavigate, currentIndex]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[99999] flex flex-col bg-black"
        onClick={onClose}
        dir="rtl"
      >
        <div
          className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 shrink-0 z-30"
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
                  <p
                    className="text-[12px] font-normal text-white/40 leading-snug line-clamp-1 mt-0.5"
                    title={title?.trim()}
                  >
                    {shortTitle}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        <div
          className="relative flex-1 flex items-center justify-center min-h-0 w-full px-2 pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          {canPrev && onNavigate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex - 1);
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/60 hover:text-white text-2xl font-light"
            >
              ›
            </button>
          )}
          {canNext && onNavigate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex + 1);
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/60 hover:text-white text-2xl font-light"
            >
              ‹
            </button>
          )}

          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-7 h-7 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            </div>
          )}

          <img
            key={src}
            src={src}
            alt={title || ""}
            onLoad={() => setLoaded(true)}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "max-w-[min(98vw,1600px)] max-h-full w-auto h-auto object-contain transition-opacity duration-200"
            )}
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </div>

        {hasMultiple && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            {allImages!.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate?.(i)}
                className="transition-all duration-200"
                style={{
                  width: i === currentIndex ? 16 : 5,
                  height: 5,
                  borderRadius: 99,
                  background: i === currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
