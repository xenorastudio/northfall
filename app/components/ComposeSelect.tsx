"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import "./rich-editor.css";

type Option<T extends string> = { value: T; label: string };

export default function ComposeSelect<T extends string>({
  value,
  onChange,
  options,
  id,
  className,
  size = "sm",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  id?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "nf-compose-field nf-compose-field--select w-full flex items-center justify-between gap-2 text-nf-text",
          size === "sm" ? "text-[11px]" : "text-[12px]"
        )}
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown size={12} className={cn("shrink-0 opacity-45 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="listbox"
          className="nf-compose-select-menu absolute z-50 top-full mt-1 min-w-full rounded-lg overflow-hidden shadow-lg"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "nf-compose-select-option w-full text-right px-3 py-2 font-medium transition-colors",
                size === "sm" ? "text-[11px]" : "text-[12px]",
                value === opt.value ? "nf-compose-select-option--active" : "nf-compose-select-option--idle"
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
