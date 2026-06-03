import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COMMUNITY_CATEGORIES } from "@/lib/community-categories";
import { extractHashtagsFromPost } from "@/lib/hashtags";
import { interestTagsFromCategory, normalizeInterestTag } from "@/lib/user-interests";
import { isMeaningfulWord, isStopWord } from "@/lib/stop-words";

const CACHE_MS = 120_000;
const POSTS_SCAN_LIMIT = 200;

export type HashtagSuggestion = {
  tag: string;
  count: number;
};

let poolCache: { entries: HashtagSuggestion[]; at: number } | null = null;

function categoryHashtagPool(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const cat of COMMUNITY_CATEGORIES) {
    for (const t of interestTagsFromCategory(cat)) {
      const n = normalizeInterestTag(t);
      if (n && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    const label = cat.replace(/^[^\s]+\s/, "").trim();
    const words = label.split(/\s+/).filter((w) => w.length >= 3);
    for (const w of words) {
      const n = normalizeInterestTag(w);
      if (n && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
  }
  return out;
}

async function loadPostsHashtagCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    const snap = await getDocs(
      query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(POSTS_SCAN_LIMIT))
    );
    snap.docs.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      const tags = extractHashtagsFromPost({
        title: String(data.title || ""),
        body: String(data.body || ""),
        hashtags: Array.isArray(data.hashtags) ? (data.hashtags as string[]) : [],
      });
      tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
  } catch (e) {
    console.warn("[hashtag-suggestions] posts:", e);
  }
  return counts;
}

export async function prefetchHashtagPool(): Promise<HashtagSuggestion[]> {
  if (poolCache && Date.now() - poolCache.at < CACHE_MS) {
    return poolCache.entries;
  }

  const counts = await loadPostsHashtagCounts();
  for (const t of categoryHashtagPool()) {
    if (!counts.has(t)) counts.set(t, 0);
  }

  const entries = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ar"));

  poolCache = { entries, at: Date.now() };
  return entries;
}

export function filterHashtagSuggestions(
  pool: HashtagSuggestion[],
  prefix: string,
  max = 8
): HashtagSuggestion[] {
  const p = normalizeInterestTag(prefix);
  if (!p) return pool.slice(0, max);

  const starts = pool.filter((e) => e.tag.startsWith(p));
  const contains = pool.filter((e) => !e.tag.startsWith(p) && e.tag.includes(p));
  return [...starts, ...contains]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ar"))
    .slice(0, max);
}

/**
 * استخراج الكلمات المفتاحية الأكثر تكراراً من نص المنشور لاقتراحها كهاشتاغات.
 * تُصفّى كلمات التوقف (stop words) أولاً قبل احتساب التكرار.
 * @param text - النص الكامل للمنشور (body + title)
 * @param prefix - بادئة الهاشتاغ التي يكتبها المستخدم حالياً (للفلترة)
 * @param max - أقصى عدد للنتائج
 */
export function extractKeywordSuggestions(
  text: string,
  prefix?: string,
  max: number = 8
): HashtagSuggestion[] {
  if (!text || !text.trim()) return [];

  const clean = text.replace(/#[\p{L}\p{N}_-]+/gu, "");

  const tokens = clean
    .toLowerCase()
    .split(/[\s،,.;:!؟?()\[\]{}""'‘’“”\n\r\t—\-_@]+/)
    .map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);

  const words = tokens.filter((t) => isMeaningfulWord(t));

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  let entries = Array.from(freq.entries());
  if (prefix) {
    const p = prefix.toLowerCase();
    entries = entries.filter(([word]) => word.startsWith(p) || word.includes(p));
  }

  entries.sort(
    (a, b) =>
      b[1] - a[1] ||
      b[0].length - a[0].length ||
      a[0].localeCompare(b[0], "ar")
  );

  return entries.slice(0, max).map(([tag]) => ({ tag, count: 0 }));
}

export function isPoolTagValid(tag: string): boolean {
  if (!tag || tag.length < 2) return false;
  const segments = tag.split(/[-_]/);
  return segments.every((s) => isMeaningfulWord(s));
}

export async function getHashtagSuggestions(
  prefix: string,
  contextText?: string
): Promise<HashtagSuggestion[]> {
  const contentBased = contextText
    ? extractKeywordSuggestions(contextText, prefix, 4)
    : [];

  const pool = await prefetchHashtagPool();
  const poolBased = filterHashtagSuggestions(pool, prefix, 8);
  const filteredPool = poolBased.filter((item) => isPoolTagValid(item.tag));

  const seen = new Set<string>();
  const merged: HashtagSuggestion[] = [];

  for (const item of contentBased) {
    if (!seen.has(item.tag)) {
      seen.add(item.tag);
      merged.push(item);
    }
  }

  for (const item of filteredPool) {
    if (!seen.has(item.tag)) {
      seen.add(item.tag);
      merged.push(item);
      if (merged.length >= 8) break;
    }
  }

  return merged;
}

/** موضع استعلام الهاشتاغ عند المؤشر — يدعم #tag1#tag2#tag3 */
export function getHashtagQueryAtCursor(
  text: string,
  cursor: number
): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const hash = before.lastIndexOf("#");
  if (hash === -1) return null;

  const query = before.slice(hash + 1);
  if (!/^[\p{L}\p{N}_-]*$/u.test(query)) return null;

  if (hash > 0) {
    const prev = before[hash - 1];
    if (/[\p{L}\p{N}_]/u.test(prev)) return null;
  }

  return { start: hash, query };
}
