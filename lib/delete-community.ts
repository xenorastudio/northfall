import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BATCH_LIMIT = 450;

/** حذف مجتمع — للمالك فقط */
export async function deleteCommunityAsOwner(
  communityId: string,
  creatorUid: string,
  currentUid: string
): Promise<void> {
  if (!currentUid || currentUid !== creatorUid) {
    throw new Error("ليس لديك صلاحية حذف هذا المجتمع");
  }

  const membersSnap = await getDocs(collection(db, "communities", communityId, "members"));
  const memberUids = membersSnap.docs.map((d) => d.id);

  // حذف على دفعات (حد Firestore 500 عملية)
  let batch = writeBatch(db);
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };

  for (const uid of memberUids) {
    batch.delete(doc(db, "communities", communityId, "members", uid));
    batch.delete(doc(db, "users", uid, "communities", communityId));
    ops += 2;
    if (ops >= BATCH_LIMIT) await flush();
  }

  batch.delete(doc(db, "communities", communityId));
  ops += 1;
  await flush();
}
