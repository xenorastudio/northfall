import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceSpecs } from "@/lib/deviceSpecs";

interface Props {
  specs: DeviceSpecs;
  className?: string;
}

export default function DeviceSpecsTooltip({ specs, className }: Props) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updatePos = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.top, left: r.left });
  };

  const gpuLine = specs.vram ? `${specs.gpu} — VRAM: ${specs.vram}` : specs.gpu;

  const rows = [
    specs.os,
    `CPU: ${specs.cpu}`,
    `RAM: ${specs.ram}`,
    gpuLine,
    `Screen: ${specs.screen}`,
  ];

  const tooltipContent = show && (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        top: pos.top + window.scrollY + 22,
        left: pos.left + window.scrollX,
        transform: "translateX(-50%)",
      }}
    >
      <div
        className="rounded-lg border border-nf-border-2/60 shadow-xl overflow-hidden"
        style={{ minWidth: 220, maxWidth: 300, backgroundColor: "var(--bg-primary)" }}
      >
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-nf-border-2/30 flex items-center gap-1.5" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <Monitor size={10} className="text-nf-dim/50" />
          <span className="text-[10px] font-semibold text-nf-muted tracking-wide">PC Specs</span>
        </div>
        {/* Rows */}
        <div className="px-3 py-2 flex flex-col gap-0.5" dir="ltr">
          {rows.map((line, i) => (
            <p key={i} className="text-[11px] text-nf-dim leading-relaxed font-mono">{line}</p>
          ))}
          {specs.browser && (
            <p className="text-[10px] text-nf-dim/40 mt-0.5 font-mono">{specs.browser}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <button
        ref={ref}
        onMouseEnter={() => { updatePos(); setShow(true); }}
        onMouseLeave={() => setShow(false)}
        className="flex items-center justify-center w-5 h-5 rounded text-nf-dim/40 hover:text-nf-dim/80 transition-colors"
        tabIndex={-1}
        aria-label="مواصفات الجهاز"
      >
        <Monitor size={11} />
      </button>

      {mounted && typeof document !== "undefined" && createPortal(tooltipContent, document.body)}
    </span>
  );
}
