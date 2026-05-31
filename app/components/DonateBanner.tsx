"use client";

import React, { useState, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DonateBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
  });

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
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[40px] flex items-center justify-center bg-nf-card border-b border-nf-border-2">
      <p className="text-[11px] md:text-[12px] text-nf-muted text-center px-10 leading-snug">
        <span className="font-bold text-nf-text">NorthFall Beta</span>
        {" "}
        المنصة لسا قيد التطوير والصيانة، دعمك يساعدنا نكملها
        {" "}
        <a
          href="https://ko-fi.com/northfallcommunity"
          target="_blank"
          rel="noopener noreferrer"
          className="text-nf-text font-semibold hover:underline underline-offset-2 inline-flex items-center gap-1"
        >
          <Heart size={10} className="text-nf-muted shrink-0" fill="currentColor" />
          تبرع عبر Ko-fi
        </a>
      </p>

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
