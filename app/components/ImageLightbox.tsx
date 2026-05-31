"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
  allImages?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export default function ImageLightbox({ src, alt, onClose, allImages, currentIndex = 0, onNavigate }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);

  const hasMultiple = allImages && allImages.length > 1;
  const canPrev = hasMultiple && currentIndex > 0;
  const canNext = hasMultiple && currentIndex < (allImages?.length ?? 1) - 1;

  const resetView = useCallback(() => {
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  useEffect(() => {
    setLoaded(false);
    resetView();
  }, [src, resetView]);

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
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
      if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, canPrev, canNext, onNavigate, currentIndex, resetView]);

  useEffect(() => {
    const el = imageAreaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      setZoom((z) => Math.min(Math.max(z + delta, 0.5), 5));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleDownload = async (e: React.MouseEvent) => {
    stop(e);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt || "image";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[99999] flex flex-col bg-black"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-white/[0.06]"
          onClick={stop}
        >
          <p className="text-white/50 text-xs truncate max-w-[50vw]">{alt || ""}</p>
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={(e) => { stop(e); setZoom((z) => Math.max(z - 0.25, 0.5)); }} className="p-2 rounded-md text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors" title="تصغير">
              <ZoomOut size={16} />
            </button>
            <span className="text-white/45 text-[11px] font-mono w-9 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={(e) => { stop(e); setZoom((z) => Math.min(z + 0.25, 4)); }} className="p-2 rounded-md text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors" title="تكبير">
              <ZoomIn size={16} />
            </button>
            <button type="button" onClick={(e) => { stop(e); resetView(); }} className="p-2 rounded-md text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors" title="إعادة ضبط">
              <RotateCcw size={14} />
            </button>
            <button type="button" onClick={(e) => { stop(e); window.open(src, "_blank"); }} className="p-2 rounded-md text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors" title="فتح في تبويب">
              <Maximize2 size={14} />
            </button>
            <button type="button" onClick={handleDownload} className="p-2 rounded-md text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors" title="تحميل">
              <Download size={16} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button type="button" onClick={(e) => { stop(e); onClose(); }} className="p-2 rounded-md text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors" title="إغلاق">
              <X size={17} />
            </button>
          </div>
        </div>

        <div
          ref={imageAreaRef}
          className="flex-1 flex items-center justify-center overflow-hidden relative select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {canPrev && onNavigate && (
            <button
              type="button"
              onClick={(e) => { stop(e); onNavigate(currentIndex - 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 border border-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
          {canNext && onNavigate && (
            <button
              type="button"
              onClick={(e) => { stop(e); onNavigate(currentIndex + 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 border border-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}

          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            </div>
          )}

          <img
            key={src}
            src={src}
            alt={alt || ""}
            onLoad={() => setLoaded(true)}
            draggable={false}
            onClick={stop}
            className="max-w-[min(96vw,1400px)] max-h-[calc(100vh-88px)] w-auto h-auto object-contain transition-opacity duration-200"
            style={{
              opacity: loaded ? 1 : 0,
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
              transition: dragging ? "none" : "transform 0.12s ease-out, opacity 0.2s",
            }}
          />
        </div>

        {hasMultiple && (
          <div className="flex items-center justify-center gap-1.5 py-2 shrink-0" onClick={stop}>
            {allImages!.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { stop(e); onNavigate?.(i); }}
                className="transition-all duration-200"
                style={{
                  width: i === currentIndex ? 18 : 5,
                  height: 5,
                  borderRadius: 99,
                  background: i === currentIndex ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
