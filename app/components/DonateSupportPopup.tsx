"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const KO_FI = "https://ko-fi.com/northfallcommunity";
const INTRO_KEY = "nf-donate-intro-v1";
const INTRO_DELAY_MS = 4_000;
const RETURN_MIN_MS = 35_000;
const RETURN_MAX_MS = 90_000;
const DISPLAY_MS = 50_000;

type PopupVariant = "donate" | "splash";

const COPY: Record<
  PopupVariant,
  { tag: string; title: string; lines: string[]; btn: string; href: string; external?: boolean }
> = {
  donate: {
    tag: "دعم",
    title: "ادعمنا",
    lines: ["لسا منبني الموقع. التبرع يساعدنا نواصل."],
    btn: "تبرع",
    href: KO_FI,
    external: true,
  },
  splash: {
    tag: "حساب",
    title: "شاشة الإقلاع",
    lines: ["من الإعدادات تقدر تفعل اختيار الحساب لما تفتح الموقع."],
    btn: "الإعدادات",
    href: "/app?view=settings",
  },
};

function returnDelay() {
  return RETURN_MIN_MS + Math.floor(Math.random() * (RETURN_MAX_MS - RETURN_MIN_MS));
}

function useLightTheme() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains("light"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isLight;
}

export default function DonateSupportPopup() {
  const pathname = usePathname();
  const isLight = useLightTheme();
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<PopupVariant>("donate");
  const timerRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);
  const variantRef = useRef<PopupVariant>("donate");
  const isEmbed =
    pathname?.startsWith("/embed") ||
    pathname === "/embed-generator" ||
    pathname?.startsWith("/feeds/");

  const clearHideTimer = useCallback(() => {
    if (hideRef.current) window.clearTimeout(hideRef.current);
    hideRef.current = null;
  }, []);

  const scheduleNextRef = useRef<() => void>(() => {});

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideRef.current = window.setTimeout(() => {
      clearHideTimer();
      setVisible(false);
      scheduleNextRef.current();
    }, DISPLAY_MS);
  }, [clearHideTimer]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const next: PopupVariant = Math.random() < 0.55 ? "donate" : "splash";
      variantRef.current = next;
      setVariant(next);
      setVisible(true);
      scheduleHide();
    }, returnDelay());
  }, [scheduleHide]);

  scheduleNextRef.current = scheduleNext;

  useEffect(() => {
    if (isEmbed) return;

    const introDone =
      typeof window !== "undefined" && localStorage.getItem(INTRO_KEY) === "1";

    if (!introDone) {
      variantRef.current = "donate";
      setVariant("donate");
      const t = window.setTimeout(() => {
        setVisible(true);
        scheduleHide();
      }, INTRO_DELAY_MS);
      return () => window.clearTimeout(t);
    }

    scheduleNext();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      clearHideTimer();
    };
  }, [isEmbed, scheduleNext, scheduleHide, clearHideTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k") return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable) return;

      e.preventDefault();
      if (timerRef.current) window.clearTimeout(timerRef.current);

      const next = variantRef.current === "donate" ? "splash" : "donate";
      variantRef.current = next;
      setVariant(next);
      setVisible(true);
      scheduleHide();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scheduleHide]);

  const dismiss = () => {
    if (typeof window !== "undefined" && !localStorage.getItem(INTRO_KEY)) {
      localStorage.setItem(INTRO_KEY, "1");
    }
    clearHideTimer();
    setVisible(false);
    scheduleNext();
  };

  if (isEmbed) return null;

  const copy = COPY[variant];
  const isDonate = variant === "donate";

  /** ثيم داكن للموقع → بطاقة بيضاء | ثيم فاتح → بطاقة سوداء */
  const cardBg = isLight ? "#0a0a0a" : "#ffffff";
  const ink = isLight ? "#f5f5f5" : "#111111";
  const mutedInk = isLight ? "#a3a3a3" : "#525252";
  const borderInk = isLight ? "#f5f5f5" : "#111111";
  const shadow = isLight ? "6px 6px 0 rgba(0,0,0,0.45)" : "6px 6px 0 #111111";
  const btnBg = isDonate ? "#fde047" : isLight ? "#262626" : "#e5e5e5";
  const btnInk = isDonate ? "#111111" : isLight ? "#f5f5f5" : "#111111";
  const tagBg = isDonate ? "#fde047" : isLight ? "#262626" : "#f3f4f6";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={variant}
          initial={{ opacity: 0, x: 40, scale: 0.9, rotate: 2 }}
          animate={{ opacity: 1, x: 0, scale: 1, rotate: -1.5 }}
          exit={{ opacity: 0, x: 28, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-5 right-4 z-[9998] w-[min(100vw-2rem,268px)]"
          dir="rtl"
        >
          <div
            className="relative rounded-[1.6rem] border-[4px] p-4 pt-5"
            style={{
              backgroundColor: cardBg,
              borderColor: borderInk,
              boxShadow: shadow,
              color: ink,
            }}
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-2 left-2.5 w-7 h-7 rounded-xl text-[17px] font-black leading-none flex items-center justify-center border-[2.5px] transition-transform active:scale-90"
              style={{ borderColor: borderInk, color: ink, backgroundColor: cardBg }}
              aria-label="إغلاق"
            >
              ×
            </button>

            <span
              className="inline-block px-3 py-1 rounded-xl text-[11px] font-black mb-2.5 border-[2.5px] -rotate-1"
              style={{
                borderColor: borderInk,
                color: ink,
                backgroundColor: tagBg,
              }}
            >
              {copy.tag}
            </span>

            <h3 className="text-[18px] font-black leading-tight mb-2 pr-1" style={{ color: ink }}>
              {copy.title}
            </h3>

            {copy.lines.length > 0 && (
              <p className="text-[12px] leading-relaxed font-medium mb-4 pr-0.5" style={{ color: mutedInk }}>
                {copy.lines.join(" ")}
              </p>
            )}

            <a
              href={copy.href}
              target={copy.external ? "_blank" : undefined}
              rel={copy.external ? "noopener noreferrer" : undefined}
              onClick={dismiss}
              className="block w-full py-3 rounded-2xl text-center text-[13px] font-black border-[3px] transition-transform active:scale-[0.97] active:translate-y-0.5"
              style={{
                borderColor: borderInk,
                color: btnInk,
                backgroundColor: btnBg,
                boxShadow: isLight ? "3px 3px 0 rgba(0,0,0,0.5)" : "3px 3px 0 #111111",
              }}
            >
              {copy.btn}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
