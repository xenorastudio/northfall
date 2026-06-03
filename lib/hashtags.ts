/**
 * استخراج وعرض الهاشتاغات وربطها باهتمامات المستخدم
 */

import { normalizeInterestTag, normalizeInterestTags } from "@/lib/user-interests";

const MAX_TAG_LEN = 32;
const TAG_START_RE = /[\p{L}\p{N}_]/u;
const TAG_PART_RE = /[\p{L}\p{N}_-]/u;

/** يمسح هاشتاغاً يبدأ عند index لرمز # */
function scanHashtagAt(
  text: string,
  hashIndex: number
): { raw: string; end: number } | null {
  let j = hashIndex + 1;
  if (j >= text.length || !TAG_START_RE.test(text[j])) return null;
  j += 1;
  while (j < text.length && TAG_PART_RE.test(text[j]) && j - hashIndex - 1 < MAX_TAG_LEN) {
    j += 1;
  }
  const raw = text.slice(hashIndex + 1, j);
  return raw ? { raw, end: j } : null;
}

/** مرادفات هاشتاغ → وسوم اهتمام (للاقتراحات والألعاب) */
const HASHTAG_INTEREST_MAP: Record<string, string[]> = {
  gaming: ["gaming"],
  gamedev: ["gamedev"],
  gamedevelopment: ["gamedev"],
  "تطوير-ألعاب": ["gamedev"],
  "تطوير_ألعاب": ["gamedev"],
  unity: ["gamedev", "programming"],
  unreal: ["gamedev"],
  godot: ["gamedev"],
  programming: ["programming"],
  code: ["programming"],
  برمجة: ["programming"],
  cars: ["cars"],
  car: ["cars"],
  racing: ["cars"],
  سيارات: ["cars"],
  سباق: ["cars"],
  carx: ["cars"],
  forza: ["cars"],
  fps: ["gaming"],
  rpg: ["gaming"],
  horror: ["horror"],
  anime: ["anime"],
  ai: ["ai"],
  crypto: ["crypto"],
  indie: ["gamedev"],
  indiedev: ["gamedev"],
};

function isValidTag(normalized: string): boolean {
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return false;
  if (/^[-_]+$/.test(normalized)) return false;
  return true;
}

export function extractHashtagsFromText(...parts: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part || !part.includes("#")) continue;
    let i = 0;
    while (i < part.length) {
      const hash = part.indexOf("#", i);
      if (hash === -1) break;
      const scanned = scanHashtagAt(part, hash);
      if (!scanned) {
        i = hash + 1;
        continue;
      }
      const n = normalizeInterestTag(scanned.raw);
      if (isValidTag(n) && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
      i = scanned.end;
    }
  }
  return out.slice(0, 12);
}

export function extractHashtagsFromPost(post: {
  title?: string;
  body?: string;
  hashtags?: string[];
}): string[] {
  const fromField = normalizeInterestTags((post.hashtags || []).map(String));
  const fromText = extractHashtagsFromText(post.title, post.body);
  const merged = [...fromField];
  const seen = new Set(fromField);
  for (const t of fromText) {
    if (!seen.has(t)) {
      seen.add(t);
      merged.push(t);
    }
  }
  return merged.slice(0, 12);
}

/** وسوم اهتمام عند النقر على هاشتاغ */
export function interestTagsFromHashtag(raw: string): string[] {
  const n = normalizeInterestTag(raw.replace(/^#/, ""));
  if (!n) return [];
  const mapped = HASHTAG_INTEREST_MAP[n];
  if (mapped?.length) return normalizeInterestTags(mapped);
  return [n];
}

/** هل النص يحتوي هاشتاغاً للعرض التفاعلي */
export function textHasHashtags(text: string | undefined | null): boolean {
  if (!text || !text.includes("#")) return false;
  let i = 0;
  while (i < text.length) {
    const hash = text.indexOf("#", i);
    if (hash === -1) return false;
    const scanned = scanHashtagAt(text, hash);
    if (scanned) return true;
    i = hash + 1;
  }
  return false;
}

export function formatHashtagLabel(tag: string): string {
  const n = normalizeInterestTag(tag);
  return n ? `#${n}` : "";
}

export function postMatchesHashtag(
  post: { title?: string; body?: string; hashtags?: string[]; community?: string },
  filterTag: string
): boolean {
  const tag = normalizeInterestTag(filterTag);
  if (!tag) return true;
  const postTags = extractHashtagsFromPost(post);
  if (postTags.includes(tag)) return true;
  const body = (post.body || "").toLowerCase();
  const title = (post.title || "").toLowerCase();
  return body.includes(`#${tag}`) || title.includes(`#${tag}`);
}

/** تقسيم نص إلى مقاطع عادية وهاشتاغات للعرض التفاعلي */
export type TextSegment =
  | { type: "text"; value: string }
  | { type: "hashtag"; value: string; label: string };

export function splitTextByHashtags(text: string): TextSegment[] {
  if (!text) return [];
  if (!text.includes("#")) return [{ type: "text", value: text }];

  const segments: TextSegment[] = [];
  let i = 0;

  while (i < text.length) {
    const hash = text.indexOf("#", i);
    if (hash === -1) {
      segments.push({ type: "text", value: text.slice(i) });
      break;
    }
    if (hash > i) {
      segments.push({ type: "text", value: text.slice(i, hash) });
    }
    const scanned = scanHashtagAt(text, hash);
    if (!scanned) {
      segments.push({ type: "text", value: text[hash] });
      i = hash + 1;
      continue;
    }
    const n = normalizeInterestTag(scanned.raw);
    if (n) {
      segments.push({ type: "hashtag", value: n, label: `#${scanned.raw}` });
    } else {
      segments.push({ type: "text", value: text.slice(hash, scanned.end) });
    }
    i = scanned.end;
  }

  return segments.length ? segments : [{ type: "text", value: text }];
}
