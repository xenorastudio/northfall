"use client";

import type { DeviceSpecs } from "@/lib/deviceSpecs";

interface DeviceSpecsBoxProps {
  specs: DeviceSpecs;
}

export default function DeviceSpecsBox({ specs }: DeviceSpecsBoxProps) {
  const gpuLine = specs.vram ? `${specs.gpu} — VRAM: ${specs.vram}` : specs.gpu;

  return (
    <div
      dir="ltr"
      className="mt-2 rounded-lg border border-nf-border-2/40 overflow-hidden text-left antialiased subpixel-antialiased"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-nf-border-2/30" style={{ backgroundColor: "var(--bg-primary)" }}>
        <p className="font-sans font-semibold text-xs tracking-wide text-nf-muted">
          Reviewer's PC Specs
        </p>
      </div>

      {/* Specs rows */}
      <div className="px-3 py-2.5 flex flex-col gap-1 leading-relaxed">
        {[
          specs.os,
          `CPU: ${specs.cpu}`,
          `RAM: ${specs.ram}`,
          gpuLine,
          `Screen: ${specs.screen}`,
        ].map((line, i) => (
          <p
            key={i}
            className="font-sans font-normal text-xs sm:text-sm leading-relaxed antialiased text-nf-muted"
          >
            {line}
          </p>
        ))}
        {specs.browser && (
          <p
            className="font-sans font-normal text-xs leading-relaxed antialiased mt-0.5 text-nf-dim"
          >
            {specs.browser}
          </p>
        )}
      </div>
    </div>
  );
}
