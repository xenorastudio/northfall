"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommentToolbarSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value)?.label || options[0]?.label;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-medium text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-nf-dim text-[11px]">{label}</span>
        <span className="text-nf-text">{current}</span>
        <ChevronDown size={14} className={cn("text-nf-dim transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-full mt-1 start-0 z-50 min-w-[168px] rounded-xl bg-nf-card shadow-[0_12px_40px_rgba(0,0,0,0.35)] py-1 overflow-hidden"
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={value === opt.id}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={cn(
                "w-full text-right px-3 py-2 text-[12px] transition-colors",
                value === opt.id
                  ? "bg-nf-hover text-nf-text font-semibold"
                  : "text-nf-muted hover:bg-nf-hover/70 hover:text-nf-text"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
