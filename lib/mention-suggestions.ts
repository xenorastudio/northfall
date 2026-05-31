import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getPlainTextFromEditor,
  getTextOffsetBeforeSelection,
} from "@/lib/editor-hashtag";

export type MentionSuggestion = {
  uid: string;
  displayName: string;
  photoURL?: string;
};

const CACHE_MS = 120_000;
let followingCache: { uid: string; list: MentionSuggestion[]; at: number } | null = null;

function mentionHandle(name: string): string {
  return (name || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, 32);
}

export function mentionHandleFromDisplayName(name: string): string {
  const h = mentionHandle(name);
  return h || "user";
}

export async function prefetchFollowingMentions(userUid: string): Promise<MentionSuggestion[]> {
  if (followingCache && followingCache.uid === userUid && Date.now() - followingCache.at < CACHE_MS) {
    return followingCache.list;
  }

  const list: MentionSuggestion[] = [];
  try {
    const snap = await getDocs(collection(db, "users", userUid, "following"));
    await Promise.all(
      snap.docs.slice(0, 40).map(async (d) => {
        try {
          const u = await getDoc(doc(db, "users", d.id));
          if (!u.exists()) return;
          const data = u.data();
          const displayName = String(data.displayName || d.id).trim();
          if (!displayName) return;
          list.push({
            uid: d.id,
            displayName,
            photoURL: data.photoURL || undefined,
          });
        } catch {
          /* ignore */
        }
      })
    );
  } catch (e) {
    console.warn("[mention-suggestions] following:", e);
  }

  list.sort((a, b) => a.displayName.localeCompare(b.displayName, "ar"));
  followingCache = { uid: userUid, list, at: Date.now() };
  return list;
}

export function filterMentionSuggestions(
  pool: MentionSuggestion[],
  prefix: string,
  max = 8
): MentionSuggestion[] {
  const p = prefix.toLowerCase().trim();
  if (!p) return pool.slice(0, max);

  const score = (name: string) => {
    const dn = name.toLowerCase();
    if (dn.startsWith(p)) return 0;
    const words = dn.split(/\s+/);
    if (words.some((w) => w.startsWith(p))) return 1;
    if (dn.includes(p)) return 2;
    return 3;
  };

  return [...pool]
    .filter((u) => score(u.displayName) < 3)
    .sort((a, b) => score(a.displayName) - score(b.displayName) || a.displayName.localeCompare(b.displayName, "ar"))
    .slice(0, max);
}

async function searchUsersByPrefix(prefix: string, max = 8): Promise<MentionSuggestion[]> {
  const p = prefix.toLowerCase().trim();
  if (p.length < 1) return [];

  try {
    const snap = await getDocs(
      query(collection(db, "users"), orderBy("displayName"), limit(80))
    );
    const out: MentionSuggestion[] = [];
    snap.docs.forEach((d) => {
      const data = d.data();
      const displayName = String(data.displayName || "").trim();
      if (!displayName) return;
      const dn = displayName.toLowerCase();
      const words = dn.split(/\s+/);
      if (dn.startsWith(p) || words.some((w) => w.startsWith(p)) || dn.includes(p)) {
        out.push({
          uid: d.id,
          displayName,
          photoURL: data.photoURL || undefined,
        });
      }
    });
    out.sort((a, b) => {
      const as = a.displayName.toLowerCase().startsWith(p) ? 0 : 1;
      const bs = b.displayName.toLowerCase().startsWith(p) ? 0 : 1;
      return as - bs || a.displayName.localeCompare(b.displayName, "ar");
    });
    return out.slice(0, max);
  } catch {
    return [];
  }
}

export async function getMentionSuggestions(
  prefix: string,
  currentUid?: string
): Promise<MentionSuggestion[]> {
  const pool = currentUid ? await prefetchFollowingMentions(currentUid) : [];
  const fromFollowing = filterMentionSuggestions(pool, prefix, 8);
  if (fromFollowing.length >= 5 || prefix.length < 2) {
    return fromFollowing.length ? fromFollowing : filterMentionSuggestions(pool, "", 8);
  }

  const searched = await searchUsersByPrefix(prefix, 8);
  const seen = new Set<string>();
  const merged: MentionSuggestion[] = [];
  for (const u of [...fromFollowing, ...searched]) {
    if (seen.has(u.uid)) continue;
    seen.add(u.uid);
    merged.push(u);
    if (merged.length >= 8) break;
  }
  return merged;
}

/** استعلام @ عند المؤشر */
export function getMentionQueryAtCursor(
  text: string,
  cursor: number
): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;

  const queryText = before.slice(at + 1);
  if (!/^[\p{L}\p{N}_-]*$/u.test(queryText)) return null;

  if (at > 0) {
    const prev = before[at - 1];
    if (/[\p{L}\p{N}_]/u.test(prev)) return null;
  }

  return { start: at, query: queryText };
}

export function getMentionQueryAtEditor(root: HTMLElement): {
  start: number;
  query: string;
  cursor: number;
} | null {
  const cursor = getTextOffsetBeforeSelection(root);
  if (cursor < 0) return null;
  const plain = getPlainTextFromEditor(root);
  const info = getMentionQueryAtCursor(plain, cursor);
  if (!info) return null;
  return { ...info, cursor };
}
