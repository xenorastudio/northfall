"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { triggerBowieKnifeEasterEgg } from "@/lib/bowie-easter-egg";

const FIRST_MS = 120_000;
const MIN_GAP_MS = 240_000;
const MAX_GAP_MS = 720_000;

function randomGap() {
  return MIN_GAP_MS + Math.floor(Math.random() * (MAX_GAP_MS - MIN_GAP_MS));
}

/** يشغّل الـ easter egg تلقائياً كل فترة عشوائية (بدون نقرات أو اختصارات) */
export default function BowieEasterEggListener() {
  const pathname = usePathname();
  const timerRef = useRef<number | null>(null);

  const isEmbed =
    pathname?.startsWith("/embed") ||
    pathname === "/embed-generator" ||
    pathname?.startsWith("/feeds/");

  useEffect(() => {
    if (isEmbed) return;

    const schedule = (delay: number) => {
      timerRef.current = window.setTimeout(() => {
        triggerBowieKnifeEasterEgg();
        schedule(randomGap());
      }, delay);
    };

    schedule(FIRST_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isEmbed]);

  return null;
}
