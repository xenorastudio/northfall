export type EmbedSkin = "dark" | "light" | "midnight" | "ocean" | "sunset" | "minimal";

export type EmbedThemeTokens = {
  id: EmbedSkin;
  label: string;
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  muted: string;
  dim: string;
  accent: string;
  accentSoft: string;
  surface: string;
  hoverBg: string;
  upColor: string;
  downColor: string;
  shimBase: string;
  shimHigh: string;
};

export const EMBED_SKINS: { id: EmbedSkin; label: string }[] = [
  { id: "dark", label: "داكن" },
  { id: "light", label: "فاتح" },
  { id: "midnight", label: "منتصف الليل" },
  { id: "ocean", label: "محيط" },
  { id: "sunset", label: "غروب" },
  { id: "minimal", label: "بسيط" },
];

export function resolveEmbedSkin(themeParam: string | null, skinParam?: string | null): EmbedSkin {
  const skin = (skinParam || "").toLowerCase();
  if (EMBED_SKINS.some((s) => s.id === skin)) return skin as EmbedSkin;
  const t = (themeParam || "").toLowerCase();
  if (EMBED_SKINS.some((s) => s.id === t)) return t as EmbedSkin;
  if (t === "light") return "light";
  return "dark";
}

export function getEmbedTheme(skin: EmbedSkin): EmbedThemeTokens {
  switch (skin) {
    case "light":
      return {
        id: "light",
        label: "فاتح",
        bg: "#f3f4f6",
        cardBg: "#ffffff",
        border: "rgba(0,0,0,0.08)",
        text: "#0a0a0a",
        muted: "#52525b",
        dim: "#71717a",
        accent: "#2563eb",
        accentSoft: "rgba(37,99,235,0.12)",
        surface: "rgba(0,0,0,0.04)",
        hoverBg: "rgba(0,0,0,0.05)",
        upColor: "#ea580c",
        downColor: "#6366f1",
        shimBase: "#ececec",
        shimHigh: "#f8f8f8",
      };
    case "midnight":
      return {
        id: "midnight",
        label: "منتصف الليل",
        bg: "#070b14",
        cardBg: "#0f1629",
        border: "rgba(99,102,241,0.18)",
        text: "#eef2ff",
        muted: "#a5b4fc",
        dim: "#818cf8",
        accent: "#818cf8",
        accentSoft: "rgba(129,140,248,0.16)",
        surface: "rgba(99,102,241,0.08)",
        hoverBg: "rgba(99,102,241,0.12)",
        upColor: "#fb923c",
        downColor: "#a5b4fc",
        shimBase: "#111827",
        shimHigh: "#1e293b",
      };
    case "ocean":
      return {
        id: "ocean",
        label: "محيط",
        bg: "#041016",
        cardBg: "#0a1a22",
        border: "rgba(45,212,191,0.16)",
        text: "#ecfeff",
        muted: "#99f6e4",
        dim: "#5eead4",
        accent: "#2dd4bf",
        accentSoft: "rgba(45,212,191,0.14)",
        surface: "rgba(45,212,191,0.07)",
        hoverBg: "rgba(45,212,191,0.1)",
        upColor: "#fbbf24",
        downColor: "#67e8f9",
        shimBase: "#0f172a",
        shimHigh: "#134e4a",
      };
    case "sunset":
      return {
        id: "sunset",
        label: "غروب",
        bg: "#140a08",
        cardBg: "#1f100d",
        border: "rgba(251,146,60,0.18)",
        text: "#fff7ed",
        muted: "#fdba74",
        dim: "#fb923c",
        accent: "#fb923c",
        accentSoft: "rgba(251,146,60,0.14)",
        surface: "rgba(251,146,60,0.08)",
        hoverBg: "rgba(251,146,60,0.1)",
        upColor: "#f97316",
        downColor: "#fbbf24",
        shimBase: "#1c1917",
        shimHigh: "#292524",
      };
    case "minimal":
      return {
        id: "minimal",
        label: "بسيط",
        bg: "#fafafa",
        cardBg: "#ffffff",
        border: "rgba(0,0,0,0.06)",
        text: "#171717",
        muted: "#737373",
        dim: "#a3a3a3",
        accent: "#171717",
        accentSoft: "rgba(0,0,0,0.06)",
        surface: "rgba(0,0,0,0.03)",
        hoverBg: "rgba(0,0,0,0.04)",
        upColor: "#404040",
        downColor: "#737373",
        shimBase: "#f0f0f0",
        shimHigh: "#fafafa",
      };
    default:
      return {
        id: "dark",
        label: "داكن",
        bg: "#0b0b0c",
        cardBg: "#141416",
        border: "rgba(255,255,255,0.08)",
        text: "#f4f4f5",
        muted: "#a1a1aa",
        dim: "#71717a",
        accent: "#60a5fa",
        accentSoft: "rgba(96,165,250,0.14)",
        surface: "rgba(255,255,255,0.04)",
        hoverBg: "rgba(255,255,255,0.06)",
        upColor: "#fb7185",
        downColor: "#94a3b8",
        shimBase: "#1a1a1d",
        shimHigh: "#242428",
      };
  }
}
