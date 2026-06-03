"use client";

import { db } from "./firebase";
import { getEditorUidsFromFeedData } from "./custom-feed-access";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  writeBatch,
  query,
  where,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────

export interface SharedFeed {
  id: string;
  ownerId: string;
  editors: string[];
  communities: string[];
  name: string;
  createdAt: Timestamp;
  isPrivate: boolean;
  showOnProfile: boolean;
  bannerUrl?: string;
  bannerPosition?: string;
  iconUrl?: string;
  showBannerBg?: boolean;
}

export type CreateSharedFeedData = {
  name: string;
  communities: string[];
  editors?: string[];
  isPrivate?: boolean;
  showOnProfile?: boolean;
  bannerUrl?: string;
  bannerPosition?: string;
  iconUrl?: string;
  showBannerBg?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────

const FEEDS_COL = "custom_feeds";

function feedDoc(feedId: string) {
  return doc(db, FEEDS_COL, feedId);
}

function userFeedDoc(uid: string, feedId: string) {
  return doc(db, "users", uid, "customFeeds", feedId);
}

// ─── Following check ──────────────────────────────────────────────

export async function isUserFollowing(ownerUid: string, targetUid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "users", ownerUid, "following", targetUid));
    return snap.exists();
  } catch { return false; }
}

// ─── Create feed ──────────────────────────────────────────────────

export async function createSharedFeed(
  ownerId: string,
  data: CreateSharedFeedData,
  editorProfiles?: { uid: string; displayName: string; photoURL: string }[]
): Promise<string> {
  const id = `sf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = Timestamp.now();
  const editorUids = data.editors ?? [];
  const feed = {
    ownerId,
    editors: editorUids,
    editorUids,
    communities: data.communities ?? [],
    name: data.name,
    createdAt: now,
    isPrivate: data.isPrivate ?? false,
    showOnProfile: data.showOnProfile ?? true,
    bannerUrl: data.bannerUrl ?? null,
    bannerPosition: data.bannerPosition ?? null,
    iconUrl: data.iconUrl ?? null,
    showBannerBg: data.showBannerBg ?? true,
  };
  const ownerEditorObjs = editorProfiles?.map((e) => ({ uid: e.uid, displayName: e.displayName, photoURL: e.photoURL })) ?? [];

  // Batch: central doc + owner's personal copy + each editor's ref doc
  const batch = writeBatch(db);
  batch.set(feedDoc(id), feed);
  batch.set(userFeedDoc(ownerId, id), { ...feed, editors: ownerEditorObjs, isEditor: false });
  for (const editorUid of editorUids) {
    batch.set(userFeedDoc(editorUid, id), {
      name: feed.name, communities: feed.communities, iconUrl: feed.iconUrl,
      ownerId, editors: editorUids, editorUids, isEditor: true,
      isPrivate: feed.isPrivate, showOnProfile: feed.showOnProfile,
      bannerUrl: feed.bannerUrl, bannerPosition: feed.bannerPosition, showBannerBg: feed.showBannerBg, createdAt: now,
    });
  }
  await batch.commit();

  return id;
}

// ─── Editor ref helpers ───────────────────────────────────────────

export async function createEditorRef(feedId: string, editorUid: string) {
  const snap = await getDoc(feedDoc(feedId));
  if (!snap.exists()) return;
  const data = snap.data()!;
  await setDoc(userFeedDoc(editorUid, feedId), {
    name: data.name,
    communities: data.communities,
    iconUrl: data.iconUrl,
    ownerId: data.ownerId,
    editors: data.editors ?? [],
    isEditor: true,
    isPrivate: data.isPrivate,
    showOnProfile: data.showOnProfile,
    bannerUrl: data.bannerUrl,
    showBannerBg: data.showBannerBg,
    createdAt: data.createdAt,
  });
}

export async function removeEditorRef(feedId: string, editorUid: string) {
  try { await deleteDoc(userFeedDoc(editorUid, feedId)); } catch { /* ignore */ }
}

// ─── Add editor ──────────────────────────────────────────────────

export async function addEditor(
  feedId: string,
  ownerUid: string,
  editorUid: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const snap = await getDoc(feedDoc(feedId));
    if (!snap.exists()) return { success: false, error: "الخلاصة غير موجودة" };
    const data = snap.data()!;
    if (data.ownerId !== ownerUid)
      return { success: false, error: "أنت لست مالك الخلاصة" };
    const existing = getEditorUidsFromFeedData(data);
    if (existing.includes(editorUid))
      return { success: false, error: "هذا المستخدم محرر بالفعل" };
    const following = await isUserFollowing(ownerUid, editorUid);
    if (!following)
      return { success: false, error: "لا يمكنك إضافة هذا المستخدم ما لم تقم بمتابعته أولاً" };

    const batch = writeBatch(db);
    batch.update(feedDoc(feedId), {
      editors: arrayUnion(editorUid),
      editorUids: arrayUnion(editorUid),
    });
    batch.set(userFeedDoc(editorUid, feedId), {
      name: data.name,
      communities: data.communities,
      iconUrl: data.iconUrl,
      ownerId: data.ownerId,
      editors: [...existing, editorUid],
      editorUids: [...existing, editorUid],
      isEditor: true,
      isPrivate: data.isPrivate,
      showOnProfile: data.showOnProfile,
      bannerUrl: data.bannerUrl,
      showBannerBg: data.showBannerBg,
      createdAt: data.createdAt,
    });
    await batch.commit();

    return { success: true };
  } catch (err) {
    return { success: false, error: "حدث خطأ أثناء إضافة المحرر" };
  }
}

// ─── Remove editor ───────────────────────────────────────────────

export async function removeEditor(
  feedId: string,
  ownerUid: string,
  editorUid: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const snap = await getDoc(feedDoc(feedId));
    if (!snap.exists()) return { success: false, error: "الخلاصة غير موجودة" };
    const data = snap.data()!;
    if (data.ownerId !== ownerUid)
      return { success: false, error: "أنت لست مالك الخلاصة" };

    const batch = writeBatch(db);
    batch.update(feedDoc(feedId), {
      editors: arrayRemove(editorUid),
      editorUids: arrayRemove(editorUid),
    });
    batch.delete(userFeedDoc(editorUid, feedId));
    await batch.commit();

    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء إزالة المحرر" };
  }
}

// ─── Update feed (owner or editor) ────────────────────────────────

export async function updateFeedSections(
  feedId: string,
  currentUid: string,
  communities: string[]
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const snap = await getDoc(feedDoc(feedId));
    if (!snap.exists()) return { success: false, error: "الخلاصة غير موجودة" };
    const data = snap.data()!;
    const isOwner = data.ownerId === currentUid;
    const editorUids = getEditorUidsFromFeedData(data);
    if (!isOwner && !editorUids.includes(currentUid))
      return { success: false, error: "ليس لديك صلاحية لتعديل هذه الخلاصة" };

    await updateDoc(feedDoc(feedId), { communities });
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء تحديث الأقسام" };
  }
}

export async function updateSharedFeed(
  feedId: string,
  currentUid: string,
  updates: Partial<CreateSharedFeedData>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const snap = await getDoc(feedDoc(feedId));
    if (!snap.exists()) return { success: false, error: "الخلاصة غير موجودة" };
    const data = snap.data()!;
    const isOwner = data.ownerId === currentUid;
    const editorUids = getEditorUidsFromFeedData(data);
    if (!isOwner && !editorUids.includes(currentUid))
      return { success: false, error: "ليس لديك صلاحية لتعديل هذه الخلاصة" };

    // Owner can update everything; editor can only update specific fields
    if (!isOwner && editorUids.includes(currentUid)) {
      const allowed = ["communities", "bannerUrl", "bannerPosition", "iconUrl", "showBannerBg", "name", "isPrivate", "showOnProfile"];
      for (const key of Object.keys(updates)) {
        if (!allowed.includes(key)) {
          return { success: false, error: "ليس لديك صلاحية لتعديل هذا الحقل" };
        }
      }
    }

    const batch = writeBatch(db);
    batch.update(feedDoc(feedId), updates as any);

    // Also update owner's personal copy (best effort)
    try { batch.update(userFeedDoc(data.ownerId, feedId), updates as any); } catch { /* ignore */ }

    await batch.commit();
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء تحديث الخلاصة" };
  }
}

// ─── Delete feed ─────────────────────────────────────────────────

export async function deleteSharedFeed(
  feedId: string,
  currentUid: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const snap = await getDoc(feedDoc(feedId));
    if (!snap.exists()) return { success: false, error: "الخلاصة غير موجودة" };
    const data = snap.data()!;
    if (data.ownerId !== currentUid)
      return { success: false, error: "أنت لست مالك الخلاصة" };

    // Delete central doc and owner's personal copy
    const batch = writeBatch(db);
    batch.delete(feedDoc(feedId));
    batch.delete(userFeedDoc(currentUid, feedId));
    // Delete editor refs
    for (const editorUid of getEditorUidsFromFeedData(data)) {
      batch.delete(userFeedDoc(editorUid, feedId));
    }
    await batch.commit();

    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حذف الخلاصة" };
  }
}

// ─── Read helpers ────────────────────────────────────────────────

export async function getSharedFeed(feedId: string): Promise<SharedFeed | null> {
  try {
    const snap = await getDoc(feedDoc(feedId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as SharedFeed;
  } catch { return null; }
}

/** Returns all feeds where the given user is owner or editor. */
export async function getUserSharedFeeds(uid: string): Promise<SharedFeed[]> {
  try {
    const [ownedSnap, editorSnap] = await Promise.all([
      getDocs(query(collection(db, FEEDS_COL), where("ownerId", "==", uid))),
      getDocs(query(collection(db, FEEDS_COL), where("editors", "array-contains", uid))),
    ]);
    const map = new Map<string, SharedFeed>();
    ownedSnap.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as SharedFeed));
    editorSnap.forEach((d) => { if (!map.has(d.id)) map.set(d.id, { id: d.id, ...d.data() } as SharedFeed); });
    return Array.from(map.values());
  } catch { return []; }
}
