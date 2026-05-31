import { collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export function getEditorUidsFromFeedData(data: Record<string, unknown> | undefined): string[] {
  if (!data) return [];
  if (Array.isArray(data.editorUids) && data.editorUids.length > 0) {
    return data.editorUids.filter((u): u is string => typeof u === "string");
  }
  const editors = data.editors;
  if (!Array.isArray(editors)) return [];
  return editors
    .map((e) => (typeof e === "string" ? e : (e as { uid?: string })?.uid))
    .filter((u): u is string => !!u);
}

export async function canUserAccessFeed(feedId: string, uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "custom_feeds", feedId));
    if (!snap.exists()) return false;
    const d = snap.data()!;
    if (d.ownerId === uid) return true;
    return getEditorUidsFromFeedData(d).includes(uid);
  } catch {
    return false;
  }
}

/** يزيل من users/{uid}/customFeeds أي فيد لم يعد للمستخدم صلاحية عليه */
export async function pruneStaleUserFeedRefs(uid: string): Promise<void> {
  const snap = await getDocs(collection(db, "users", uid, "customFeeds"));
  await Promise.all(
    snap.docs.map(async (d) => {
      const allowed = await canUserAccessFeed(d.id, uid);
      if (!allowed) {
        try {
          await deleteDoc(d.ref);
        } catch {
          /* ignore */
        }
      }
    })
  );
}
