"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── All world languages ──────────────────────────────────────────────────────
export function langBadge(id: string): string {
  if (id === "zh-TW") return "TW";
  if (id.length <= 3) return id.toUpperCase();
  return id.slice(0, 2).toUpperCase();
}

export const ALL_LANGS = [
  { id: "ar", flag: "🇸🇦", label: "العربية" },
  { id: "en", flag: "🇺🇸", label: "English" },
  { id: "fr", flag: "🇫🇷", label: "Français" },
  { id: "de", flag: "🇩🇪", label: "Deutsch" },
  { id: "es", flag: "🇪🇸", label: "Español" },
  { id: "pt", flag: "🇧🇷", label: "Português" },
  { id: "it", flag: "🇮🇹", label: "Italiano" },
  { id: "nl", flag: "🇳🇱", label: "Nederlands" },
  { id: "pl", flag: "🇵🇱", label: "Polski" },
  { id: "ru", flag: "🇷🇺", label: "Русский" },
  { id: "uk", flag: "🇺🇦", label: "Українська" },
  { id: "cs", flag: "🇨🇿", label: "Čeština" },
  { id: "sk", flag: "🇸🇰", label: "Slovenčina" },
  { id: "ro", flag: "🇷🇴", label: "Română" },
  { id: "hu", flag: "🇭🇺", label: "Magyar" },
  { id: "bg", flag: "🇧🇬", label: "Български" },
  { id: "hr", flag: "🇭🇷", label: "Hrvatski" },
  { id: "sr", flag: "🇷🇸", label: "Српски" },
  { id: "sl", flag: "🇸🇮", label: "Slovenščina" },
  { id: "lt", flag: "🇱🇹", label: "Lietuvių" },
  { id: "lv", flag: "🇱🇻", label: "Latviešu" },
  { id: "et", flag: "🇪🇪", label: "Eesti" },
  { id: "fi", flag: "🇫🇮", label: "Suomi" },
  { id: "sv", flag: "🇸🇪", label: "Svenska" },
  { id: "no", flag: "🇳🇴", label: "Norsk" },
  { id: "da", flag: "🇩🇰", label: "Dansk" },
  { id: "is", flag: "🇮🇸", label: "Íslenska" },
  { id: "el", flag: "🇬🇷", label: "Ελληνικά" },
  { id: "tr", flag: "🇹🇷", label: "Türkçe" },
  { id: "az", flag: "🇦🇿", label: "Azərbaycan" },
  { id: "ka", flag: "🇬🇪", label: "ქართული" },
  { id: "hy", flag: "🇦🇲", label: "Հայերեն" },
  { id: "he", flag: "🇮🇱", label: "עברית" },
  { id: "fa", flag: "🇮🇷", label: "فارسی" },
  { id: "ur", flag: "🇵🇰", label: "اردو" },
  { id: "hi", flag: "🇮🇳", label: "हिन्दी" },
  { id: "bn", flag: "🇧🇩", label: "বাংলা" },
  { id: "pa", flag: "🇮🇳", label: "ਪੰਜਾਬੀ" },
  { id: "gu", flag: "🇮🇳", label: "ગુજરાતી" },
  { id: "mr", flag: "🇮🇳", label: "मराठी" },
  { id: "ta", flag: "🇮🇳", label: "தமிழ்" },
  { id: "te", flag: "🇮🇳", label: "తెలుగు" },
  { id: "kn", flag: "🇮🇳", label: "ಕನ್ನಡ" },
  { id: "ml", flag: "🇮🇳", label: "മലയാളം" },
  { id: "si", flag: "🇱🇰", label: "සිංහල" },
  { id: "ne", flag: "🇳🇵", label: "नेपाली" },
  { id: "id", flag: "🇮🇩", label: "Indonesia" },
  { id: "ms", flag: "🇲🇾", label: "Melayu" },
  { id: "tl", flag: "🇵🇭", label: "Filipino" },
  { id: "th", flag: "🇹🇭", label: "ภาษาไทย" },
  { id: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
  { id: "km", flag: "🇰🇭", label: "ខ្មែរ" },
  { id: "lo", flag: "🇱🇦", label: "ລາວ" },
  { id: "my", flag: "🇲🇲", label: "မြန်မာ" },
  { id: "ja", flag: "🇯🇵", label: "日本語" },
  { id: "ko", flag: "🇰🇷", label: "한국어" },
  { id: "zh", flag: "🇨🇳", label: "中文 (简体)" },
  { id: "zh-TW", flag: "🇹🇼", label: "中文 (繁體)" },
  { id: "mn", flag: "🇲🇳", label: "Монгол" },
  { id: "kk", flag: "🇰🇿", label: "Қазақша" },
  { id: "uz", flag: "🇺🇿", label: "O'zbek" },
  { id: "ky", flag: "🇰🇬", label: "Кыргызча" },
  { id: "tg", flag: "🇹🇯", label: "Тоҷикӣ" },
  { id: "tk", flag: "🇹🇲", label: "Türkmen" },
  { id: "sw", flag: "🇰🇪", label: "Kiswahili" },
  { id: "am", flag: "🇪🇹", label: "አማርኛ" },
  { id: "so", flag: "🇸🇴", label: "Soomaali" },
  { id: "ha", flag: "🇳🇬", label: "Hausa" },
  { id: "yo", flag: "🇳🇬", label: "Yorùbá" },
  { id: "ig", flag: "🇳🇬", label: "Igbo" },
  { id: "zu", flag: "🇿🇦", label: "isiZulu" },
  { id: "af", flag: "🇿🇦", label: "Afrikaans" },
  { id: "xh", flag: "🇿🇦", label: "isiXhosa" },
  { id: "st", flag: "🇱🇸", label: "Sesotho" },
  { id: "sn", flag: "🇿🇼", label: "Shona" },
  { id: "mg", flag: "🇲🇬", label: "Malagasy" },
  { id: "ny", flag: "🇲🇼", label: "Chichewa" },
  { id: "rw", flag: "🇷🇼", label: "Kinyarwanda" },
  { id: "lg", flag: "🇺🇬", label: "Luganda" },
  { id: "eo", flag: "🌍", label: "Esperanto" },
  { id: "la", flag: "🏛️", label: "Latina" },
  { id: "cy", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", label: "Cymraeg" },
  { id: "ga", flag: "🇮🇪", label: "Gaeilge" },
  { id: "eu", flag: "🇪🇸", label: "Euskara" },
  { id: "ca", flag: "🇪🇸", label: "Català" },
  { id: "gl", flag: "🇪🇸", label: "Galego" },
  { id: "sq", flag: "🇦🇱", label: "Shqip" },
  { id: "mk", flag: "🇲🇰", label: "Македонски" },
  { id: "bs", flag: "🇧🇦", label: "Bosanski" },
  { id: "mt", flag: "🇲🇹", label: "Malti" },
  { id: "lb", flag: "🇱🇺", label: "Lëtzebuergesch" },
];

export function getTranslateLang(): string {
  if (typeof window === "undefined") return "ar";
  return localStorage.getItem("nf-translate-lang") || "ar";
}

interface TranslateLangPickerProps {
  className?: string;
  /** If true, shows as a full-width selector (for Settings page) */
  fullWidth?: boolean;
}

export default function TranslateLangPicker({ className, fullWidth }: TranslateLangPickerProps) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(getTranslateLang);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 220 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Listen for external changes
  useEffect(() => {
    const h = (e: Event) => setLang((e as CustomEvent).detail);
    window.addEventListener("nf-translate-lang-change", h);
    return () => window.removeEventListener("nf-translate-lang-change", h);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      const updatePos = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        const menuWidth = 220;
        const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
        const top = Math.min(rect.bottom + 6, window.innerHeight - 12);
        setMenuPos({ top, left, width: menuWidth });
      };
      updatePos();
      setTimeout(() => searchRef.current?.focus(), 50);
      window.addEventListener("resize", updatePos);
      window.addEventListener("scroll", updatePos, true);
      return () => {
        window.removeEventListener("resize", updatePos);
        window.removeEventListener("scroll", updatePos, true);
      };
    }
  }, [open]);

  const current = ALL_LANGS.find(l => l.id === lang) || ALL_LANGS[0];

  const filtered = search.trim()
    ? ALL_LANGS.filter(l =>
        l.label.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_LANGS;

  const pick = (id: string) => {
    setLang(id);
    localStorage.setItem("nf-translate-lang", id);
    setOpen(false);
    setSearch("");
    window.dispatchEvent(new CustomEvent("nf-translate-lang-change", { detail: id }));
  };

  if (fullWidth) {
    // Settings page — full width button
    return (
      <div className={cn("relative", className)} ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all border bg-nf-secondary/30 border-nf-border/10 hover:border-nf-border/25"
        >
          <span className="w-7 h-7 rounded-md bg-nf-secondary/60 border border-nf-border-2/50 flex items-center justify-center text-[10px] font-bold text-nf-muted uppercase shrink-0">
            {langBadge(current.id)}
          </span>
          <span className="flex-1 text-right text-nf-text">{current.label}</span>
          <span className="text-[10px] text-nf-dim/50 font-mono uppercase">{current.id}</span>
          <ChevronDown size={12} className={cn("shrink-0 opacity-40 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-nf-border-2 shadow-xl overflow-hidden"
            style={{ background: "var(--bg-primary, #18181a)" }}
          >
            {/* Search */}
            <div className="px-3 py-2 border-b border-nf-border-2/40">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن لغة..."
                className="w-full bg-transparent text-[11px] text-nf-text placeholder:text-nf-dim outline-none"
              />
            </div>
            <div className="max-h-[260px] overflow-y-auto py-1">
              {filtered.map(l => (
                <button
                  key={l.id}
                  onClick={() => pick(l.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-[11px] transition-colors",
                    l.id === lang ? "bg-nf-accent/10 text-nf-accent" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                  )}
                >
                  <span className="w-6 h-6 rounded-md bg-nf-secondary/50 border border-nf-border-2/40 flex items-center justify-center text-[9px] font-bold text-nf-dim uppercase shrink-0">
                    {langBadge(l.id)}
                  </span>
                  <span className="flex-1 text-right">{l.label}</span>
                  <span className="text-[9px] font-mono opacity-30 uppercase">{l.id}</span>
                  {l.id === lang && <Check size={10} className="text-nf-accent shrink-0" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-[11px] text-nf-dim py-4">لا توجد نتائج</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline mini picker (next to translate button)
  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-semibold text-nf-muted hover:text-nf-text transition-colors"
        title={`لغة الترجمة: ${current.label}`}
        aria-label={`لغة الترجمة: ${current.label}`}
      >
        <span className="uppercase tracking-wide">{langBadge(current.id)}</span>
        <ChevronDown size={9} className={cn("opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[1200]"
          onMouseDown={() => { setOpen(false); setSearch(""); }}
        >
          <div
            className="absolute rounded-xl border border-nf-border-2 shadow-2xl overflow-hidden bg-nf-primary"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width, maxHeight: 320 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search */}
            <div className="px-3 py-2 border-b border-nf-border-2/40 bg-nf-secondary/20">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full bg-transparent text-[11px] text-nf-text placeholder:text-nf-dim outline-none"
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 256 }}>
              {filtered.map(l => (
                <button
                  key={l.id}
                  onClick={() => pick(l.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] transition-colors",
                    l.id === lang ? "bg-nf-accent/12 text-nf-accent" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                  )}
                >
                  <span className="w-5 h-5 rounded bg-nf-secondary/50 border border-nf-border-2/40 flex items-center justify-center text-[8px] font-bold text-nf-dim uppercase shrink-0">
                    {langBadge(l.id)}
                  </span>
                  <span className="flex-1 text-right">{l.label}</span>
                  {l.id === lang && <Check size={9} className="text-nf-accent shrink-0" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-[11px] text-nf-dim py-3">لا توجد نتائج</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
