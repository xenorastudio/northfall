export const TAB_BRAND = "NorthFall";

/** عنوان تبويب المتصفح — بسيط وواضح (مثل Google Gemini) */
export function setDocumentTitle(label?: string | null): void {
  if (typeof document === "undefined") return;
  const trimmed = label?.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === TAB_BRAND.toLowerCase() ||
    trimmed === "Northfall"
  ) {
    document.title = TAB_BRAND;
    return;
  }
  document.title = `${trimmed} · ${TAB_BRAND}`;
}

export function truncateTabLabel(text: string, max = 42): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
