import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function ensureUserDoc(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { mutedCommunities: [] }, { merge: true });
  }
  return ref;
}

export async function setCommunityFavorite(uid: string, communityName: string, isFavorite: boolean) {
  const ref = doc(db, "users", uid, "communities", communityName);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(ref, { isFavorite }, { merge: true });
  } else {
    await setDoc(ref, {
      name: communityName,
      joinedAt: new Date().toISOString(),
      isFavorite,
    });
  }
}

export async function setCommunityMuted(uid: string, communityName: string, muted: boolean) {
  const userRef = await ensureUserDoc(uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};
  const list: string[] = [...(data.mutedCommunities || [])];
  const mutes: Record<string, string> = { ...(data.communityMutes || {}) };

  const nextList = list.filter((n) => n.toLowerCase() !== communityName.toLowerCase());
  const nextMutes: Record<string, string> = {};
  for (const [k, v] of Object.entries(mutes)) {
    if (k.toLowerCase() !== communityName.toLowerCase()) nextMutes[k] = v;
  }

  if (muted) {
    nextList.push(communityName);
    nextMutes[communityName] = new Date().toISOString();
  }

  await setDoc(
    userRef,
    { mutedCommunities: nextList, communityMutes: nextMutes },
    { merge: true }
  );
}

/** مزامنة مصفوفة المجتمعات في custom_feeds + users/{uid}/customFeeds */
async function syncFeedCommunities(uid: string, feedId: string, communities: string[]) {
  await setDoc(doc(db, "custom_feeds", feedId), { communities }, { merge: true });
  await setDoc(doc(db, "users", uid, "customFeeds", feedId), { communities }, { merge: true });
}

export async function addCommunityToCustomFeed(uid: string, feedId: string, communityName: string): Promise<"added" | "exists" | "missing"> {
  const feedRef = doc(db, "users", uid, "customFeeds", feedId);
  const snap = await getDoc(feedRef);
  if (!snap.exists()) return "missing";

  const comms: string[] = [...(snap.data().communities || [])];
  if (comms.some(c => c.toLowerCase() === communityName.toLowerCase())) return "exists";

  const next = [...comms, communityName];
  await syncFeedCommunities(uid, feedId, next);
  return "added";
}

export async function removeCommunityFromCustomFeed(uid: string, feedId: string, communityName: string) {
  const feedRef = doc(db, "users", uid, "customFeeds", feedId);
  const snap = await getDoc(feedRef);
  if (!snap.exists()) return;
  const next = (snap.data().communities || []).filter((c: string) => c !== communityName);
  await syncFeedCommunities(uid, feedId, next);
}
