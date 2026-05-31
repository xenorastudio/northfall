import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Server-side post vote total (source of truth after optimistic UI). */
export async function readPostVoteCount(postId: string): Promise<number> {
  const snap = await getDoc(doc(db, "posts", postId));
  if (!snap.exists()) return 0;
  return Math.max(0, Number(snap.data()?.votes) || 0);
}
