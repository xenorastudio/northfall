import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";

const BATCH_LIMIT = 450;

async function commitDeletes(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/** حذف المنشور وتعليقاته وأصواته من Firestore */
export async function deletePostCompletely(postId: string): Promise<void> {
  const toDelete: DocumentReference[] = [];

  const commentsSnap = await getDocs(collection(db, "posts", postId, "comments"));
  for (const c of commentsSnap.docs) {
    const commentVotes = await getDocs(
      collection(db, "posts", postId, "comments", c.id, "votes")
    );
    commentVotes.docs.forEach((v) => toDelete.push(v.ref));
    toDelete.push(c.ref);
  }

  const postVotes = await getDocs(collection(db, "posts", postId, "votes"));
  postVotes.docs.forEach((v) => toDelete.push(v.ref));

  toDelete.push(doc(db, "posts", postId));
  await commitDeletes(toDelete);
}

/** حذف تعليق وأصواته من Firestore */
export async function deleteCommentCompletely(
  postId: string,
  commentId: string
): Promise<void> {
  const toDelete: DocumentReference[] = [];
  const votesSnap = await getDocs(
    collection(db, "posts", postId, "comments", commentId, "votes")
  );
  votesSnap.docs.forEach((v) => toDelete.push(v.ref));
  toDelete.push(doc(db, "posts", postId, "comments", commentId));
  await commitDeletes(toDelete);
}
