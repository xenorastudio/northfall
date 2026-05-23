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

  const hasMultiple = allImages && allImages.length > 1;
  const canPrev = hasMultiple && currentIndex > 0;
  const canNext = hasMultiple && currentIndex < (allImages?.length ?? 1) - 1;

  const resetView = useCallback(() => {
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    setLoaded(false);
    resetView();
  }, [src, resetView]);

  useEffect(() => {
    // Add class to hide navbar and prevent scroll
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
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 4));
      if (e.key === "-") setZoom(z => Math.max(z - 0.25, 0.5));
      if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, canPrev, canNext, onNavigate, currentIndex, resetView]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(z => Math.min(Math.max(z + delta, 0.5), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleDownload = async () => {
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
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[99999] flex flex-col"
        style={{ background: "rgba(0,0,0,0.96)" }}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 z-10" style={{ background: "rgba(0,0,0,0.5)" }}>
          <p className="text-white/70 text-sm truncate max-w-[50vw]">{alt || ""}</p>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="تصغير (-)">
              <ZoomOut size={17} />
            </button>
            <span className="text-white/50 text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="تكبير (+)">
              <ZoomIn size={17} />
            </button>
            <button onClick={resetView} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="إعادة ضبط (0)">
              <RotateCcw size={15} />
            </button>
            <button onClick={() => window.open(src, "_blank")} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="فتح في تبويب جديد">
              <Maximize2 size={15} />
            </button>
            <button onClick={handleDownload} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="تحميل">
              <Download size={17} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button onClick={onClose} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="إغلاق (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden relative"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Prev arrow */}
          {canPrev && onNavigate && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/25 backdrop-blur-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
          {/* Next arrow */}
          {canNext && onNavigate && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/25 backdrop-blur-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}

          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}

          <motion.img
            key={src}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: loaded ? 1 : 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            src={src}
            alt={alt || ""}
            onLoad={() => setLoaded(true)}
            draggable={false}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
              transition: dragging ? "none" : "transform 0.15s ease",
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              userSelect: "none",
              borderRadius: "10px",
              boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Bottom strip: index */}
        {hasMultiple && (
          <div className="flex items-center justify-center gap-1.5 py-3 shrink-0">
            {allImages!.map((_, i) => (
              <button
                key={i}
                onClick={() => onNavigate && onNavigate(i)}
                className="transition-all duration-200"
                style={{
                  width: i === currentIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: i === currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        )}

        {/* Keyboard hint */}
        <div className="text-center text-white/20 text-[10px] pb-2 shrink-0 pointer-events-none">
          ESC للإغلاق · +/- للتكبير · تمرير الفأرة للزوم{hasMultiple ? " · ← → للتنقل" : ""}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
