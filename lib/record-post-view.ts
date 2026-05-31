import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const viewedKey = (postId: string) => `nf-viewed-${postId}`;

async function incrementViaApi(postId: string): Promise<number | null> {
  try {
    const res = await fetch("/api/post-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { views?: number };
    return typeof data.views === "number" ? data.views : null;
  } catch {
    return null;
  }
}

async function incrementViaClient(postId: string): Promise<number | null> {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const current = (snap.data()?.views as number) || 0;
  await updateDoc(ref, { views: increment(1) });
  return current + 1;
}

/** One view per browser tab session; returns updated total or null if skipped */
export async function recordPostView(
  postId: string,
  options?: { viewerUid?: string | null; authorUid?: string | null; countOwn?: boolean }
): Promise<number | null> {
  if (typeof window === "undefined" || !postId) return null;

  const { viewerUid, authorUid, countOwn = true } = options ?? {};
  if (!countOwn && viewerUid && authorUid && viewerUid === authorUid) return null;

  if (sessionStorage.getItem(viewedKey(postId))) return null;

  try {
    const viaApi = await incrementViaApi(postId);
    if (viaApi !== null) {
      sessionStorage.setItem(viewedKey(postId), "1");
      return viaApi;
    }

    const viaClient = await incrementViaClient(postId);
    if (viaClient !== null) {
      sessionStorage.setItem(viewedKey(postId), "1");
      return viaClient;
    }
    return null;
  } catch (e) {
    console.warn("[recordPostView]", postId, e);
    return null;
  }
}
