import type { CSSProperties } from "react";

export function flairBadgeStyle(
  flair: string,
  flairBg?: string | null,
  flairTextColor?: string | null
): CSSProperties {
  if (flairBg || flairTextColor) {
    return {
      background: flairBg || "color-mix(in srgb, var(--accent) 24%, transparent)",
      color: flairTextColor || "var(--accent)",
    };
  }
  let h = 0;
  for (let i = 0; i < flair.length; i++) h = flair.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return {
    background: `hsla(${hue}, 58%, 46%, 0.32)`,
    color: `hsl(${hue}, 82%, 74%)`,
  };
}
