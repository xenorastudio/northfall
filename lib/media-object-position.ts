/** موضع وتكبير الصورة داخل object-cover (نسب مئوية) */
export type MediaPosition = { x: number; y: number; scale: number };

export const DEFAULT_MEDIA_POSITION: MediaPosition = { x: 50, y: 50, scale: 100 };

export const MEDIA_SCALE_MIN = 100;
export const MEDIA_SCALE_MAX = 320;

export function positionToCss(pos: Pick<MediaPosition, "x" | "y">): string {
  const x = Math.min(100, Math.max(0, Math.round(pos.x)));
  const y = Math.min(100, Math.max(0, Math.round(pos.y)));
  return `${x}% ${y}%`;
}

export function normalizeMediaPosition(
  pos?: Partial<MediaPosition> | null,
  scaleFallback?: number
): MediaPosition {
  return {
    x: clampPct(pos?.x ?? 50),
    y: clampPct(pos?.y ?? 50),
    scale: clampScale(pos?.scale ?? scaleFallback ?? 100),
  };
}

export function parseMediaPosition(value?: string | null, scaleFallback?: number): MediaPosition {
  if (!value || typeof value !== "string") {
    return normalizeMediaPosition(null, scaleFallback);
  }
  const match = value.trim().match(/^([\d.]+)\s*%?\s+([\d.]+)\s*%?$/);
  if (match) {
    return normalizeMediaPosition(
      { x: parseFloat(match[1]), y: parseFloat(match[2]) },
      scaleFallback
    );
  }
  const v = value.toLowerCase();
  if (v.includes("22%") || v.includes("top")) return normalizeMediaPosition({ x: 50, y: 22 }, scaleFallback);
  if (v.includes("78%") || v.includes("bottom")) return normalizeMediaPosition({ x: 50, y: 78 }, scaleFallback);
  return normalizeMediaPosition(null, scaleFallback);
}

/** أنماط object-cover + تكبير — نفس المنطق في كل مكان بالموقع */
export function mediaCoverStyle(
  position?: Partial<MediaPosition> | string | null,
  scaleFromDb?: number
): { objectPosition: string; transform?: string; transformOrigin?: string } {
  const pos =
    typeof position === "string"
      ? parseMediaPosition(position, scaleFromDb)
      : normalizeMediaPosition(position, scaleFromDb);
  const scale = pos.scale / 100;
  const cssPos = positionToCss(pos);
  if (scale === 1) {
    return { objectPosition: cssPos };
  }
  return {
    objectPosition: cssPos,
    transform: `scale(${scale})`,
    transformOrigin: cssPos,
  };
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function clampScale(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(MEDIA_SCALE_MAX, Math.max(MEDIA_SCALE_MIN, Math.round(n)));
}
