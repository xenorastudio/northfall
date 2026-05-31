"use client";

import React, { useState, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { usePathname } from "next/navigation";

/** يظهر في /app فقط — الإغلاق للجلسة الحالية؛ بعد refresh يعود */
export default function DonateBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
  });

  // Hide on embed routes, embed-generator, and feed settings
  const isEmbed = pathname?.startsWith("/embed") || pathname === "/embed-generator" || pathname?.startsWith("/feeds/");

  useEffect(() => {
    if (!dismissed && !isEmbed) {
      document.documentElement.classList.add("has-donate-banner");
    } else {
      document.documentElement.classList.remove("has-donate-banner");
    }
    return () => {
      document.documentElement.classList.remove("has-donate-banner");
    };
  }, [dismissed, isEmbed]);

  const isApp = pathname?.startsWith("/app");
  if (!isApp || dismissed || isEmbed || isStandalone) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[40px] flex items-center justify-center bg-nf-secondary border-b border-nf-border-2"
    >
      <a
        href="https://ko-fi.com/northfallcommunity"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-1.5 text-[12px] md:text-[13px] text-nf-text-2 hover:text-nf-text transition-colors duration-200 group"
      >
        <Heart size={12} className="text-nf-muted group-hover:text-nf-text shrink-0 group-hover:scale-110 transition-transform duration-200" fill="currentColor" />
        <span className="hidden md:inline text-nf-dim text-[11px]">دعمك يساعد المجتمع</span>
        <span className="hidden md:inline text-nf-border-2 mx-1.5">·</span>
        <span className="font-semibold text-nf-text group-hover:underline underline-offset-4 transition-all">
          تبرع لـ NorthFall عبر Ko-fi
        </span>
      </a>

      <button
        onClick={() => setDismissed(true)}
        className="absolute left-3 p-1.5 text-nf-dim hover:text-nf-text transition-colors duration-200"
        aria-label="إغلاق"
      >
        <X size={11} />
      </button>
    </div>
  );
}
