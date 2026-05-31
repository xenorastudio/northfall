/**
 * إزالة التشكيل والحركات العربية (فتحة، ضمة، كسرة، سكون، تنوين، شدة، إلخ)
 * لنص يبدو طبيعياً كما يكتبه المستخدم.
 */
const ARABIC_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

export function cleanArabicText(text: string): string {
  if (!text) return "";
  return text.replace(ARABIC_DIACRITICS, "").replace(/\s{2,}/g, " ").trim();
}

/** تنظيف مع الحفاظ على الأسطر في النصوص متعددة الفقرات */
export function cleanArabicTextPreserveLines(text: string): string {
  if (!text) return "";
  return text
    .split("\n")
    .map((line) => cleanArabicText(line))
    .join("\n");
}
