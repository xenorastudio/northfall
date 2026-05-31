/** يزيل التشكيل والحركات فقط (شدة، فتحة، …) ويبقي الحروف */
const ARABIC_MARKS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g;

export function stripArabicDiacritics(text: string): string {
  return text.replace(ARABIC_MARKS, "");
}

/** للنصوص الظاهرة للمستخدم — عربي بدون تشكيل */
export function plainAr(text: string): string {
  return stripArabicDiacritics(text);
}
