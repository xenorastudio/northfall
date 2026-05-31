"use client";

import { useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";

// ─── URL Parser ───────────────────────────────────────────────────────────────
export interface VideoInfo {
  type: "youtube" | "direct";
  id?: string;
  embedUrl: string;
  thumbnailUrl: string;
}

export function parseVideoUrl(url: string): VideoInfo | null {
  if (!url?.trim()) return null;
  const s = url.trim();

  // YouTube: watch?v=, youtu.be/, shorts/, embed/
  const yt = s.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (yt) {
    const id = yt[1];
    return {
      type: "youtube",
      id,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    };
  }

  // Direct video file
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(s)) {
    return { type: "direct", embedUrl: s, thumbnailUrl: "" };
  }

  return null;
}

// ─── VideoPlayer ──────────────────────────────────────────────────────────────
interface VideoPlayerProps {
  url: string;
  compact?: boolean;
  className?: string;
}

export default function VideoPlayer({ url, compact = false, className = "" }: VideoPlayerProps) {
  const [active, setActive] = useState(false);
  const info = parseVideoUrl(url);
  if (!info) return null;

  // ── Active: show iframe / video ──────────────────────────────────────────
  if (active) {
    if (info.type === "direct") {
      return (
        <div className={`w-full aspect-video bg-black overflow-hidden rounded-xl ${className}`}>
          <video src={info.embedUrl} autoPlay controls className="w-full h-full object-contain" />
        </div>
      );
    }
    return (
      <div className={`w-full aspect-video bg-black overflow-hidden rounded-xl ${className}`}>
        <iframe
          src={info.embedUrl}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          title="video"
        />
      </div>
    );
  }

  // ── Poster card ──────────────────────────────────────────────────────────
  return (
    <button
      onClick={() => setActive(true)}
      className={`relative w-full aspect-video overflow-hidden rounded-xl cursor-pointer block group ${className}`}
      style={{ background: "#0a0a0a" }}
      aria-label="تشغيل الفيديو"
    >
      {/* Thumbnail */}
      {info.thumbnailUrl && (
        <img
          src={info.thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          draggable={false}
        />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200" />

      {/* Play button — centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`
          flex items-center justify-center rounded-full
          bg-white/90 group-hover:bg-white group-hover:scale-110
          transition-all duration-200 shadow-lg
          ${compact ? "w-10 h-10" : "w-14 h-14"}
        `}>
          <Play
            size={compact ? 14 : 20}
            fill="#111"
            strokeWidth={0}
            className="translate-x-0.5"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
        {info.type === "youtube" && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
              <path d="M9.545 15.568V8.432L15.818 12z" fill="white"/>
            </svg>
            <span className="text-[10px] text-white/80 font-medium">YouTube</span>
          </div>
        )}
        <div className="mr-auto text-[10px] text-white/50 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm">
          اضغط للتشغيل
        </div>
      </div>
    </button>
  );
}
