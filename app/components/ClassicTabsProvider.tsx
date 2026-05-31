"use client";

/**
 * ClassicTabsProvider
 * ───────────────────
 * Minimal provider — only tracks isClassic toggle.
 * The classic theme is applied via html.classic CSS class.
 * No tab system, no extra state.
 */

import { createContext, useContext, useState, useCallback } from "react";

interface ClassicTabsCtx {
  isClassic: boolean;
  setIsClassic: (v: boolean) => void;
}

const Ctx = createContext<ClassicTabsCtx>({
  isClassic: false,
  setIsClassic: () => {},
});

export function ClassicTabsProvider({ children }: { children: React.ReactNode }) {
  const [isClassic, setIsClassicState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("nf-classic") === "true";
  });

  const setIsClassic = useCallback((v: boolean) => {
    setIsClassicState(v);
    localStorage.setItem("nf-classic", String(v));
    document.documentElement.classList.toggle("classic", v);
  }, []);

  return (
    <Ctx.Provider value={{ isClassic, setIsClassic }}>
      {children}
    </Ctx.Provider>
  );
}

export function useClassicTabs() {
  return useContext(Ctx);
}
