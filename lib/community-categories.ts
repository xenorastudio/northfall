/** تصنيفات المجتمعات — 34 تصنيفاً (إيموجي واحد في بداية النص فقط) */

export const COMMUNITY_CATEGORIES = [
  "🎮 تطوير ألعاب",
  "🕹️ ألعاب وجيمينج",
  "💻 برمجة وكود",
  "🤖 ذكاء اصطناعي",
  "🔐 أمن معلومات",
  "🖥️ أجهزة وهاردوير",
  "📱 تطبيقات وموبايل",
  "🎥 صناع محتوى وستريمرز",
  "₿ عملات رقمية",
  "🎨 فن وتصميم",
  "✨ عرض مشاريع",
  "🌸 أنمي ومانغا",
  "🎬 مونتاج وفيديو",
  "📷 تصوير",
  "😂 ميمز وفكاهة",
  "🌐 تريندات ونت",
  "💬 أسئلة ونقاشات",
  "📖 قصص وفضفضة",
  "💀 رعب وغموض",
  "🎬 أفلام ومسلسلات",
  "🧩 هوايات ومقتنيات",
  "📚 دراسة وتدريب",
  "👔 شغل وفريلانس",
  "🔬 علوم وبحوث",
  "🧠 علم نفس",
  "🚀 فضاء وفلك",
  "🗣️ لغات وترجمة",
  "💰 بزنس ومال",
  "🛍️ تسوق وتجارة إلكترونية",
  "⚽ رياضة وكورة",
  "🏥 صحة وجيم",
  "🗺️ سفر وأماكن",
  "🍕 طعام وطبخ",
  "🚗 سيارات ومحركات",
] as const;

export type CommunityCategoryValue = (typeof COMMUNITY_CATEGORIES)[number];

const STANDARD_SET = new Set<string>(COMMUNITY_CATEGORIES);

/** تعيين التصنيفات القديمة (slug أو نص مرقم) */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  gamedev: "🎮 تطوير ألعاب",
  gaming: "🕹️ ألعاب وجيمينج",
  programming: "💻 برمجة وكود",
  ai: "🤖 ذكاء اصطناعي",
  security: "🔐 أمن معلومات",
  hardware: "🖥️ أجهزة وهاردوير",
  tech: "🖥️ أجهزة وهاردوير",
  mobile: "📱 تطبيقات وموبايل",
  art3d: "🎨 فن وتصميم",
  showcase: "✨ عرض مشاريع",
  anime: "🌸 أنمي ومانغا",
  memes: "😂 ميمز وفكاهة",
  discussion: "💬 أسئلة ونقاشات",
  movies: "🎬 أفلام ومسلسلات",
  books: "📚 دراسة وتدريب",
  finance: "💰 بزنس ومال",
  sports: "⚽ رياضة وكورة",
  science: "🔬 علوم وبحوث",
  space: "🚀 فضاء وفلك",
  music: "🎥 صناع محتوى وستريمرز",
  photography: "📷 تصوير",
  health: "🏥 صحة وجيم",
  travel: "🗺️ سفر وأماكن",
  food: "🍕 طعام وطبخ",
  writing: "📖 قصص وفضفضة",
  tutorial: "📚 دراسة وتدريب",
  news: "🌐 تريندات ونت",
  animation: "🎬 مونتاج وفيديو",
  other: "🌐 تريندات ونت",
};

/** إزالة البادئة الرقمية القديمة مثل "1. 🎮 ..." */
export function normalizeCategoryLabel(stored: string): string {
  const trimmed = (stored || "").trim();
  if (!trimmed) return "";
  const numbered = trimmed.match(/^\d+\.\s*(.+)$/);
  const base = numbered ? numbered[1].trim() : trimmed;
  if (STANDARD_SET.has(base)) return base;
  if (LEGACY_CATEGORY_MAP[trimmed]) return LEGACY_CATEGORY_MAP[trimmed];
  if (LEGACY_CATEGORY_MAP[base]) return LEGACY_CATEGORY_MAP[base];
  return base;
}

export function isStandardCategoryValue(value: string): boolean {
  const n = normalizeCategoryLabel(value);
  return STANDARD_SET.has(n);
}

export function resolveCategoryDisplay(stored: string | undefined): string {
  return normalizeCategoryLabel(stored || "");
}

/** @deprecated استخدم resolveCategoryDisplay */
export const normalizeCategoryDisplay = resolveCategoryDisplay;

export function parseStoredCategory(stored: string | undefined): { selected: string } {
  const selected = normalizeCategoryLabel(stored || "");
  if (STANDARD_SET.has(selected)) return { selected };
  return { selected: COMMUNITY_CATEGORIES[0] };
}

export function categoryToStoreValue(selected: string): string {
  const n = normalizeCategoryLabel(selected);
  if (STANDARD_SET.has(n)) return n;
  if (LEGACY_CATEGORY_MAP[selected]) return LEGACY_CATEGORY_MAP[selected];
  return n || COMMUNITY_CATEGORIES[0];
}

export function categoryMatchesFilter(stored: string | undefined, filter: string): boolean {
  if (!stored || !filter) return false;
  const display = resolveCategoryDisplay(stored);
  const f = filter.trim();
  if (display === f) return true;
  return display.toLowerCase().includes(f.toLowerCase());
}
