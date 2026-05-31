import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** معرّف موحّد: أحرف صغيرة إنجليزية للمقارنة (Unity = unity) */
export function normalizeCommunityNameKey(raw: string): string {
  return raw.trim().toLowerCase();
}

/** اسم مستند Firestore — lowercase لتفادي التكرار بحروف مختلفة */
export function canonicalCommunityId(raw: string): string {
  return normalizeCommunityNameKey(raw);
}

export function findCommunityIdConflict(
  raw: string,
  communities: { name: string }[]
): string | null {
  const lower = normalizeCommunityNameKey(raw);
  if (!lower) return null;
  for (const c of communities) {
    if (normalizeCommunityNameKey(c.name) === lower) return c.name;
  }
  return null;
}

export async function isCommunityNameTaken(
  raw: string,
  knownCommunities?: { name: string }[]
): Promise<{
  taken: boolean;
  existingId?: string;
}> {
  const trimmed = raw.trim();
  if (!trimmed) return { taken: false };

  const lower = normalizeCommunityNameKey(trimmed);

  const localConflict = knownCommunities
    ? findCommunityIdConflict(trimmed, knownCommunities)
    : null;
  if (localConflict) return { taken: true, existingId: localConflict };

  const idsToCheck = [...new Set([trimmed, lower, canonicalCommunityId(trimmed)])];

  for (const id of idsToCheck) {
    const snap = await getDoc(doc(db, "communities", id));
    if (snap.exists()) return { taken: true, existingId: snap.id };
  }

  try {
    const q = query(collection(db, "communities"), where("nameKey", "==", lower), limit(1));
    const qs = await getDocs(q);
    if (!qs.empty) return { taken: true, existingId: qs.docs[0].id };
  } catch {
    /* nameKey index may be missing on older projects */
  }

  return { taken: false };
}

/** اقتراحات مثل unity → unity1, unity2 … */
export function buildCommunityNameSuggestions(base: string, max = 5): string[] {
  const root =
    normalizeCommunityNameKey(base).replace(/[^a-z0-9_\u0600-\u06ff]/g, "") || "community";
  const out: string[] = [];
  for (let n = 1; out.length < max && n < 30; n++) {
    out.push(`${root}${n}`);
  }
  return out;
}

export async function firstAvailableCommunityNames(
  base: string,
  max = 5
): Promise<string[]> {
  const candidates = buildCommunityNameSuggestions(base, max + 8);
  const available: string[] = [];
  for (const c of candidates) {
    if (available.length >= max) break;
    const { taken } = await isCommunityNameTaken(c);
    if (!taken) available.push(c);
  }
  return available;
}
