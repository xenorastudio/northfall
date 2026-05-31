import { cleanArabicText } from "@/lib/clean-arabic-text";

/** إصلاح نص UTF-8 عُرض كـ Latin-1 (Mojibake مثل Ø§Ù‚ØªØ¨Ø§Ø³ → اقتباس) */
export function repairUtf8Mojibake(text: string): string {
  if (!text || !/[ØÙÃÂ§â€]/.test(text)) return text;
  if (/[\u0600-\u06FF]/.test(text) && !/[ØÙ]/.test(text)) return text;
  try {
    const bytes = new Uint8Array([...text].map((c) => c.charCodeAt(0) & 0xff));
    const fixed = new TextDecoder("utf-8").decode(bytes);
    if (/[\u0600-\u06FF]/.test(fixed)) return fixed;
  } catch {
    /* ignore */
  }
  return text;
}

/** أقصى طول لعنوان المنشور في الفيد (العرض الكامل قد يكون أطول) */
export const FEED_TITLE_MAX_LENGTH = 300;

/** عدد أسطر العنوان في بطاقة الفيد */
export const FEED_TITLE_MAX_LINES = 2;

export function displayFeedTitle(title: string, maxLen = 180): string {
  const t = cleanArabicText(repairUtf8Mojibake((title || "").trim()));
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trimEnd()}…`;
}

/** نص إنجليزي/لاتيني غالباً — لعرضه LTR في واجهة RTL */
export function isMostlyLatin(text: string): boolean {
  const letters = (text || "").replace(/[^\p{L}]/gu, "");
  if (!letters.length) return false;
  const latin = letters.replace(/[^\u0000-\u024F]/gu, "").length;
  return latin / letters.length >= 0.55;
}

/** اتجاه النص — الإنجليزي LTR لكن بمحاذاة يمين مثل العربي في الواجهة */
export function textDirAttr(text: string): "rtl" | "ltr" | undefined {
  const t = (text || "").trim();
  if (!t) return undefined;
  if (isMostlyLatin(t)) return "ltr";
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(t)) return "rtl";
  return "rtl";
}
