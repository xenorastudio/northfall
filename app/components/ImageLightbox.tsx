"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
  allImages?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export default function ImageLightbox({ src, onClose, allImages, currentIndex = 0, onNavigate }: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false);

  const hasMultiple = allImages && allImages.length > 1;
  const canPrev = hasMultiple && currentIndex > 0;
  const canNext = hasMultiple && currentIndex < (allImages?.length ?? 1) - 1;

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
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 left-3 z-30 px-3 py-1.5 text-[12px] font-semibold text-white/70 hover:text-white transition-colors"
        >
          إغلاق
        </button>

        {canPrev && onNavigate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 text-white/60 hover:text-white text-2xl font-light"
          >
            ›
          </button>
        )}
        {canNext && onNavigate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 text-white/60 hover:text-white text-2xl font-light"
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
          alt=""
          onLoad={() => setLoaded(true)}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          className="max-w-[min(98vw,1600px)] max-h-[96vh] w-auto h-auto object-contain transition-opacity duration-200"
          style={{ opacity: loaded ? 1 : 0 }}
        />

        {hasMultiple && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30" onClick={(e) => e.stopPropagation()}>
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
