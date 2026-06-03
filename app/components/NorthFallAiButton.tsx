"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type MenuItem = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type Props = {
  open: boolean;
  onToggle: () => void;
  loading?: boolean;
  menuItems: MenuItem[];
  className?: string;
};

/** زر أدوات AI — نفس أسلوب رد / ترجمة في التعليقات */
export default function NorthFallAiButton({ open, onToggle, loading, menuItems, className }: Props) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors disabled:opacity-40",
          open && "bg-nf-hover text-nf-text"
        )}
        aria-expanded={open}
      >
        {loading ? (
          <span className="w-3 h-3 border border-nf-dim border-t-transparent rounded-full animate-spin" />
        ) : (
          <Sparkles size={11} />
        )}
        <span>أدوات</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[148px] py-1 rounded-lg border border-nf-border-2/50 shadow-xl backdrop-blur-xl"
          style={{ background: "color-mix(in srgb, var(--bg-body) 80%, transparent)" }}
          role="menu"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={item.onClick}
              className="w-full text-right px-3 py-2 text-[11px] text-nf-text hover:bg-nf-hover disabled:opacity-40 transition-colors"
              role="menuitem"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
