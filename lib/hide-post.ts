import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { categoryDocId, resolvePostCategory, type PostCategorySource } from "@/lib/post-category";

export interface HiddenPostRecord extends PostCategorySource {
  id: string;
}

export async function hidePostFromFeed(
  userId: string,
  post: HiddenPostRecord,
  communityCategories?: Map<string, string>
): Promise<{ category: string; signalId: string }> {
  const category = resolvePostCategory(post, communityCategories);
  const now = new Date().toISOString();

  const signalRef = await addDoc(collection(db, "users", userId, "negativeSignals"), {
    category,
    postId: post.id,
    timestamp: now,
  });

  await setDoc(doc(db, "users", userId, "hiddenPosts", post.id), {
    postId: post.id,
    category,
    hiddenAt: now,
    signalId: signalRef.id,
    community: post.community || null,
    flair: post.flair || null,
  });

  return { category, signalId: signalRef.id };
}

export async function undoHidePost(userId: string, postId: string): Promise<void> {
  const hiddenRef = doc(db, "users", userId, "hiddenPosts", postId);
  const hiddenSnap = await getDoc(hiddenRef);
  const signalId = hiddenSnap.data()?.signalId as string | undefined;

  await deleteDoc(hiddenRef).catch(() => {});

  if (signalId) {
    await deleteDoc(doc(db, "users", userId, "negativeSignals", signalId)).catch(() => {});
  }
}

export async function bumpCategoryAffinity(
  userId: string,
  post: PostCategorySource,
  communityCategories?: Map<string, string>
): Promise<void> {
  const category = resolvePostCategory(post, communityCategories);
  const affId = categoryDocId(category);
  const affRef = doc(db, "users", userId, "categoryAffinities", affId);
  const now = new Date().toISOString();
  try {
    await updateDoc(affRef, {
      category,
      score: increment(1),
      updatedAt: now,
    });
  } catch {
    await setDoc(affRef, {
      category,
      score: 1,
      updatedAt: now,
    });
  }
}
