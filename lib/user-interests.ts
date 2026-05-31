import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { resolveCategoryDisplay, categoryToStoreValue } from "@/lib/community-categories";

/** أقصى اهتمامات محفوظة للمستخدم */
export const MAX_USER_INTERESTS = 48;
/** حد Firestore لـ array-contains-any */
export const MAX_QUERY_INTERESTS = 10;
/** زيارات قبل إضافة اهتمام ضمني */
export const IMPLICIT_VISIT_THRESHOLD = 2;

/** تصنيف → وسوم قابلة للاستعلام (تطابق حقل tags في المجتمعات) */
const CATEGORY_SLUG: Record<string, string> = {
  "🎮 تطوير ألعاب": "gamedev",
  "🕹️ ألعاب وجيمينج": "gaming",
  "💻 برمجة وكود": "programming",
  "🤖 ذكاء اصطناعي": "ai",
  "🔐 أمن معلومات": "security",
  "🖥️ أجهزة وهاردوير": "hardware",
  "📱 تطبيقات وموبايل": "mobile",
  "🎥 صناع محتوى وستريمرز": "creators",
  "₿ عملات رقمية": "crypto",
  "🎨 فن وتصميم": "art",
  "✨ عرض مشاريع": "showcase",
  "🌸 أنمي ومانغا": "anime",
  "🎬 مونتاج وفيديو": "video",
  "📷 تصوير": "photography",
  "😂 ميمز وفكاهة": "memes",
  "🌐 تريندات ونت": "trends",
  "💬 أسئلة ونقاشات": "discussion",
  "📖 قصص وفضفضة": "stories",
  "💀 رعب وغموض": "horror",
  "🎬 أفلام ومسلسلات": "movies",
  "🧩 هوايات ومقتنيات": "hobbies",
  "📚 دراسة وتدريب": "education",
  "👔 شغل وفريلانس": "work",
  "🔬 علوم وبحوث": "science",
  "🧠 علم نفس": "psychology",
  "🚀 فضاء وفلك": "space",
  "🗣️ لغات وترجمة": "languages",
  "💰 بزنس ومال": "business",
  "🛍️ تسوق وتجارة إلكترونية": "ecommerce",
  "⚽ رياضة وكورة": "sports",
  "🏥 صحة وجيم": "health",
  "🗺️ سفر وأماكن": "travel",
  "🍕 طعام وطبخ": "food",
  "🚗 سيارات ومحركات": "cars",
};

export function normalizeInterestTag(raw: string): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizeInterestTags(tags: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    const n = normalizeInterestTag(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** أول عناصر الاهتمام (الأحدث في بداية المصفوفة) لاستعلام Firestore */
export function prioritizeInterestsForQuery(orderedInterests: string[]): string[] {
  return normalizeInterestTags(orderedInterests).slice(0, MAX_QUERY_INTERESTS);
}

export function categoryLabelToSlug(label: string): string {
  const n = resolveCategoryDisplay(label);
  if (CATEGORY_SLUG[n]) return CATEGORY_SLUG[n];
  const textOnly = n.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]?\s*/u, "").trim();
  return normalizeInterestTag(textOnly || n);
}

/** وسوم الاستعلام من تصنيف المجتمع */
export function interestTagsFromCategory(category: string | undefined): string[] {
  if (!category) return [];
  const label = resolveCategoryDisplay(categoryToStoreValue(category));
  const slug = categoryLabelToSlug(label);
  const textOnly = label.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]?\s*/u, "").trim();
  const textTag = normalizeInterestTag(textOnly);
  return normalizeInterestTags([slug, textTag, label]);
}

/** استخراج وسوم مجتمع من وثيقة Firestore (tags نصية أو {text}) */
export function interestTagsFromCommunityData(
  data: Record<string, unknown> | undefined
): string[] {
  if (!data) return [];
  const fromCategory = interestTagsFromCategory(String(data.category || ""));
  const raw = data.tags;
  if (!Array.isArray(raw)) return fromCategory;
  const fromTags = raw
    .map((t) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object" && "text" in t) return String((t as { text: string }).text);
      return "";
    })
    .filter(Boolean);
  return normalizeInterestTags([...fromCategory, ...fromTags]);
}

/** وسوم اهتمام من أنواع ألعاب (genre) */
export function interestTagsFromGameGenres(genres: string[]): string[] {
  const out = new Set<string>(["gaming"]);
  for (const g of genres) {
    const lower = g.toLowerCase();
    const norm = normalizeInterestTag(g);
    out.add(norm);
    if (/سباق|racing|drift|قيادة|forza|nfs|carx|assetto|beamng|f1|formula|motorsport|driving/i.test(lower)) {
      out.add("cars");
      out.add("سباق");
      out.add("racing");
    }
    if (/رياضة|sports|football|fifa/i.test(lower)) out.add("sports");
    if (/rpg|شوتر|battle|أكشن|بقاء|رعب|استراتيج|roguelike|تسلل|مغامرة|اجتماعي|تنافس|تكتيك|horror|fps|mmo/i.test(lower)) {
      out.add("gaming");
    }
    if (/محاكاة|simulation|sim/i.test(lower) && /سباق|سيار|قيادة|truck|car/i.test(lower)) {
      out.add("cars");
    }
    if (/صندوق|sandbox|إبداع|مود|indie|unity|unreal|godot|dev|برمجة/i.test(lower)) {
      out.add("gamedev");
    }
    if (/برمجة|code|csharp/i.test(lower)) out.add("programming");
  }
  return normalizeInterestTags([...out]);
}

/** دمج وسوم مجتمع لحقل tags عند الحفظ */
export function buildCommunityTagsField(
  category: string,
  userTags: string[] = []
): string[] {
  const base = interestTagsFromCategory(category);
  const custom = userTags.map((t) => normalizeInterestTag(t)).filter(Boolean);
  return normalizeInterestTags([...base, ...custom]).slice(0, 30);
}

export async function getUserInterests(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return [];
    const list = snap.data().userInterests;
    return Array.isArray(list) ? normalizeInterestTags(list.map(String)) : [];
  } catch {
    return [];
  }
}

/** تحديث فوري لواجهة التطبيق (يستمع له DataProvider) */
export function notifyPushUserInterests(tags: string[]): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeInterestTags(tags);
  if (!normalized.length) return;
  window.dispatchEvent(new CustomEvent("nf-push-interests", { detail: normalized }));
}

/** دمج فوري (أحدث الوسوم في البداية) — للواجهة قبل Firestore */
export function mergeInterestsOrdered(existing: string[], newTags: string[]): string[] {
  const normalized = normalizeInterestTags(newTags);
  if (!normalized.length) return existing;
  let ordered = normalizeInterestTags(existing);
  for (const t of normalized) {
    ordered = [t, ...ordered.filter((x) => x !== t)];
  }
  return ordered.slice(0, MAX_USER_INTERESTS);
}

export async function addUserInterests(
  uid: string,
  newTags: string[],
  knownCurrent?: string[]
): Promise<string[]> {
  const normalized = normalizeInterestTags(newTags);
  if (!normalized.length || !uid) return knownCurrent || [];

  const ref = doc(db, "users", uid);
  let ordered = knownCurrent ? normalizeInterestTags(knownCurrent) : [];

  if (!knownCurrent) {
    const snap = await getDoc(ref);
    ordered = snap.exists()
      ? normalizeInterestTags((snap.data().userInterests || []).map(String))
      : [];
  }

  const final = mergeInterestsOrdered(ordered, normalized);
  notifyPushUserInterests(normalized);
  const payload = { userInterests: final, userInterestsUpdatedAt: new Date().toISOString() };

  if (knownCurrent) {
    void setDoc(ref, payload, { merge: true }).catch((e) => console.error("[userInterests] update:", e));
    return final;
  }

  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, payload, { merge: true });
  }
  return final;
}

/** طريقة 1: اختيار صريح من شاشة إنشاء المجتمع */
export async function saveExplicitInterestsFromCategory(
  uid: string,
  categoryLabel: string
): Promise<void> {
  await addUserInterests(uid, interestTagsFromCategory(categoryLabel));
}

/** طريقة 3: اشتراك في مجتمع */
export async function saveSubscriptionInterests(
  uid: string,
  communityData: Record<string, unknown> | undefined,
  knownCurrent?: string[]
): Promise<void> {
  const tags = interestTagsFromCommunityData(communityData);
  await addUserInterests(uid, tags, knownCurrent);
}
