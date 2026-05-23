import { db } from "@/lib/firebase";
import {
  collection, getDocs, query, orderBy, limit, addDoc, doc,
  updateDoc, deleteDoc, increment, getDoc, where
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────
export interface ForumThread {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorUid: string;
  authorPhoto?: string;
  community: string;
  pinned?: boolean;
  locked?: boolean;
  solved?: boolean;
  replyCount: number;
  views: number;
  votes: number;
  createdAt: string;
  tags?: string[];
  type?: string;
  lastReplyAt?: string;
  lastReplyBy?: string;
}

export interface ReplyData {
  id: string;
  text: string;
  authorName: string;
  authorUid: string;
  authorPhoto?: string;
  createdAt: string;
  votes: number;
  edited?: boolean;
  quotedThreadId?: string;
}

export interface UserProfile {
  name: string;
  photo?: string;
  role: string;
  bio?: string;
  posts?: number;
  joinDate?: string;
  bannerUrl?: string;
  socialLinks?: Record<string, string>;
  isOnline?: boolean;
  karma?: number;
  followerCount?: number;
  followingCount?: number;
}

// ─── In-memory caches (reduce reads) ──────────────────────────────
const profileCache = new Map<string, UserProfile>();
const followerCache = new Map<string, { followers: number; following: number }>();

// ─── Threads ──────────────────────────────────────────────────────

/** Fetch threads for a single community (limit 50, ordered by newest) */
export async function fetchCommunityThreads(community: string): Promise<ForumThread[]> {
  const q = query(collection(db, "forums", community, "threads"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumThread));
}

/** Fetch latest threads across all communities (limit per community) */
export async function fetchAllCommunityThreads(
  communities: { name: string }[],
  perCommunity = 5
): Promise<ForumThread[]> {
  const all: ForumThread[] = [];
  // Parallel fetch with Promise.all for speed
  const results = await Promise.allSettled(
    communities.map(async (comm) => {
      const q2 = query(collection(db, "forums", comm.name, "threads"), orderBy("createdAt", "desc"), limit(perCommunity));
      const snap = await getDocs(q2);
      return snap.docs.map(d => ({ id: `${comm.name}-${d.id}`, ...d.data(), community: comm.name } as ForumThread));
    })
  );
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return all;
}

/** Fetch threads by a specific user across communities */
export async function fetchUserThreads(
  uid: string,
  communities: { name: string }[],
  perCommunity = 10
): Promise<ForumThread[]> {
  const all: ForumThread[] = [];
  const results = await Promise.allSettled(
    communities.map(async (comm) => {
      const tq = query(
        collection(db, "forums", comm.name, "threads"),
        where("authorUid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(perCommunity)
      );
      const ts = await getDocs(tq);
      return ts.docs.map(d => ({ id: d.id, ...d.data() } as ForumThread));
    })
  );
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return all.slice(0, 15);
}

// ─── Replies ──────────────────────────────────────────────────────

/** Fetch replies for a thread */
export async function fetchReplies(community: string, threadId: string): Promise<ReplyData[]> {
  const q = query(
    collection(db, "forums", community, "threads", threadId, "replies"),
    orderBy("createdAt", "asc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReplyData));
}

// ─── Write operations ─────────────────────────────────────────────

/** Create a new thread */
export async function createThread(
  community: string,
  data: Omit<ForumThread, "id">
): Promise<string> {
  const docRef = await addDoc(collection(db, "forums", community, "threads"), data);
  // Update user stats
  if (data.authorUid) {
    await updateDoc(doc(db, "users", data.authorUid), {
      postCount: increment(1),
    }).catch(() => {});
  }
  return docRef.id;
}

/** Add a reply to a thread */
export async function addReply(
  community: string,
  threadId: string,
  reply: { text: string; authorName: string; authorUid: string; authorPhoto?: string; createdAt: string; votes: number }
): Promise<void> {
  await addDoc(collection(db, "forums", community, "threads", threadId, "replies"), reply);
  await updateDoc(doc(db, "forums", community, "threads", threadId), {
    replyCount: increment(1),
    lastReplyAt: new Date().toISOString(),
    lastReplyBy: reply.authorName,
  });
  // Update user comment count
  if (reply.authorUid) {
    await updateDoc(doc(db, "users", reply.authorUid), {
      commentCount: increment(1),
    }).catch(() => {});
  }
}

/** Update a reply */
export async function updateReply(
  community: string,
  threadId: string,
  replyId: string,
  text: string
): Promise<void> {
  await updateDoc(doc(db, "forums", community, "threads", threadId, "replies", replyId), {
    text,
    edited: true,
  });
}

/** Delete a reply */
export async function deleteReply(
  community: string,
  threadId: string,
  replyId: string
): Promise<void> {
  await deleteDoc(doc(db, "forums", community, "threads", threadId, "replies", replyId));
  await updateDoc(doc(db, "forums", community, "threads", threadId), {
    replyCount: increment(-1),
  });
}

/** Delete a thread and all its replies */
export async function deleteThread(
  community: string,
  threadId: string
): Promise<void> {
  // Batch-delete replies
  const repliesSnap = await getDocs(collection(db, "forums", community, "threads", threadId, "replies"));
  await Promise.all(repliesSnap.docs.map(r => deleteDoc(r.ref)));
  await deleteDoc(doc(db, "forums", community, "threads", threadId));
}

/** Vote on a thread (up/down) */
export async function voteThread(
  community: string,
  threadId: string,
  delta: number
): Promise<void> {
  await updateDoc(doc(db, "forums", community, "threads", threadId), {
    votes: increment(delta),
  });
}

/** Increment view count (call once per session) */
export async function incrementViews(
  community: string,
  threadId: string
): Promise<void> {
  await updateDoc(doc(db, "forums", community, "threads", threadId), {
    views: increment(1),
  });
}

// ─── User profiles ────────────────────────────────────────────────

/** Fetch user profile with caching */
export async function fetchUserProfile(uid: string, fallbackName?: string, fallbackPhoto?: string): Promise<UserProfile> {
  // Check cache first
  if (profileCache.has(uid)) return profileCache.get(uid)!;

  const snap = await getDoc(doc(db, "users", uid));
  let profile: UserProfile = { name: fallbackName || "مستخدم", photo: fallbackPhoto, role: "عضو" };

  if (snap.exists()) {
    const d = snap.data();
    profile = {
      name: d.displayName || fallbackName || "مستخدم",
      photo: d.photoURL || fallbackPhoto,
      role: d.role || "عضو",
      bio: d.bio || "",
      posts: d.postCount || 0,
      joinDate: d.createdAt || "",
      bannerUrl: d.bannerUrl || "",
      socialLinks: d.socialLinks || {},
      isOnline: d.lastSeen ? (Date.now() - new Date(d.lastSeen).getTime()) < 600000 : false,
    };
  }

  // Fetch follower/following counts (with cache)
  if (!followerCache.has(uid)) {
    try {
      const [fSnap, f2Snap] = await Promise.all([
        getDocs(collection(db, "users", uid, "followers")),
        getDocs(collection(db, "users", uid, "following")),
      ]);
      followerCache.set(uid, { followers: fSnap.size, following: f2Snap.size });
    } catch {
      followerCache.set(uid, { followers: 0, following: 0 });
    }
  }
  const fc = followerCache.get(uid)!;
  profile.followerCount = fc.followers;
  profile.followingCount = fc.following;

  profileCache.set(uid, profile);
  return profile;
}

/** Save user profile edits */
export async function saveUserProfile(
  uid: string,
  data: { bio?: string; bannerUrl?: string; socialLinks?: Record<string, string> }
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
  // Update cache
  const cached = profileCache.get(uid);
  if (cached) {
    Object.assign(cached, data);
  }
}

/** Search for a user by display name (optimized: uses where clause instead of full scan) */
export async function searchUserByName(name: string): Promise<{ uid: string; name: string; photo?: string; role: string; bio: string; bannerUrl?: string; posts: number; socialLinks: Record<string, string> } | null> {
  // Try exact match first (much cheaper than full scan)
  try {
    const exactQ = query(collection(db, "users"), where("displayName", "==", name));
    const exactSnap = await getDocs(exactQ);
    if (!exactSnap.empty) {
      const d = exactSnap.docs[0].data();
      return {
        uid: exactSnap.docs[0].id,
        name: d.displayName || name,
        photo: d.photoURL || "",
        role: d.role || "عضو",
        bio: d.bio || "",
        bannerUrl: d.bannerUrl || "",
        posts: d.postCount || 0,
        socialLinks: d.socialLinks || {},
      };
    }
  } catch {}

  // Fallback: case-insensitive partial match (still cheaper than full collection scan)
  try {
    const lowerName = name.toLowerCase();
    // Use prefix match with lowercase field if available, otherwise scan
    const allSnap = await getDocs(query(collection(db, "users"), limit(50)));
    const found = allSnap.docs.find(d => {
      const dn = (d.data().displayName || "").toLowerCase();
      return dn.includes(lowerName);
    });
    if (found) {
      const d = found.data();
      return {
        uid: found.id,
        name: d.displayName || name,
        photo: d.photoURL || "",
        role: d.role || "عضو",
        bio: d.bio || "",
        bannerUrl: d.bannerUrl || "",
        posts: d.postCount || 0,
        socialLinks: d.socialLinks || {},
      };
    }
  } catch {}

  return null;
}

/** Fetch community stats */
export async function fetchCommunityStats(community: string): Promise<{ threadCount: number; replyCount: number }> {
  const tSnap = await getDocs(collection(db, "forums", community, "threads"));
  let replyCount = 0;
  // Only count replies for a sample to reduce reads
  const sampleThreads = tSnap.docs.slice(0, 20);
  const replyCounts = await Promise.allSettled(
    sampleThreads.map(t => getDocs(collection(db, "forums", community, "threads", t.id, "replies")))
  );
  for (const r of replyCounts) {
    if (r.status === "fulfilled") replyCount += r.value.size;
  }
  // Extrapolate if there are more threads
  if (tSnap.size > sampleThreads.length && sampleThreads.length > 0) {
    const avgReplies = replyCount / sampleThreads.length;
    replyCount = Math.round(avgReplies * tSnap.size);
  }
  return { threadCount: tSnap.size, replyCount };
}

/** Clear profile cache (call when profile is updated) */
export function clearProfileCache(uid?: string) {
  if (uid) {
    profileCache.delete(uid);
    followerCache.delete(uid);
  } else {
    profileCache.clear();
    followerCache.clear();
  }
}
