"use client";

import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

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

export default function NorthFallAiButton({ open, onToggle, loading, menuItems, className }: Props) {
  return (
    <div className={cn("nf-ai-btn-wrapper relative", className)}>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        className={cn("nf-ai-btn", open && "nf-ai-btn--open", loading && "nf-ai-btn--loading")}
        aria-expanded={open}
      >
        <BookOpen size={13} className="nf-ai-btn-icon" strokeWidth={2} />
        <span className="nf-ai-btn-label">أدوات</span>
      </button>
      {open && (
        <div className="nf-ai-menu absolute right-0 top-full mt-1 z-50 min-w-[152px] py-0.5 overflow-hidden">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={item.onClick}
              className="nf-ai-menu-item w-full text-right px-2.5 py-1.5 text-[10px] disabled:opacity-40"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
