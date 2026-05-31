import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  addUserInterests,
  categoryLabelToSlug,
  normalizeInterestTag,
  normalizeInterestTags,
} from "@/lib/user-interests";

export const INITIAL_TAG_WEIGHT = 5;

export interface OnboardingPayload {
  gender: string | null;
  categoryLabels: string[];
  feedTags: string[];
}

export interface UserOnboardingRecord {
  onboardingCompleted: boolean;
  onboardingGender: string | null;
  onboardingCategories: string[];
  onboardingTags: string[];
  interestTagWeights: Record<string, number>;
  onboardingCompletedAt?: string;
}

export function buildInterestTagWeights(feedTags: string[], categoryLabels: string[]): Record<string, number> {
  const weights: Record<string, number> = {};
  let w = INITIAL_TAG_WEIGHT;
  for (const tag of feedTags) {
    const n = normalizeInterestTag(tag);
    if (!n) continue;
    weights[n] = Math.max(weights[n] || 0, w);
    w = Math.max(1, w - 1);
  }
  for (const label of categoryLabels) {
    const slug = categoryLabelToSlug(label);
    if (!slug) continue;
    weights[slug] = Math.max(weights[slug] || 0, INITIAL_TAG_WEIGHT);
  }
  return weights;
}

export async function getOnboardingCompleted(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return false;
    const d = snap.data();
    if (d.onboardingCompleted === true) return true;
    if (d.onboardingCompleted === false) return false;
    const interests = d.userInterests;
    if (Array.isArray(interests) && interests.length > 0) return true;
    if (d.bio || d.bannerUrl || d.createdAt) return true;
    return false;
  } catch {
    return false;
  }
}

export async function completeUserOnboarding(
  uid: string,
  payload: OnboardingPayload
): Promise<UserOnboardingRecord> {
  const categoryLabels = payload.categoryLabels.slice(0, 12);
  const feedTags = payload.feedTags.slice(0, 40);
  const interestTagWeights = buildInterestTagWeights(feedTags, categoryLabels);
  const slugTags = categoryLabels.map((l) => categoryLabelToSlug(l)).filter(Boolean);
  const normalizedFeed = normalizeInterestTags(feedTags);
  const userInterests = normalizeInterestTags([
    ...normalizedFeed,
    ...slugTags,
    ...Object.keys(interestTagWeights),
  ]);

  const record: UserOnboardingRecord = {
    onboardingCompleted: true,
    onboardingGender: payload.gender,
    onboardingCategories: categoryLabels,
    onboardingTags: feedTags,
    interestTagWeights,
    onboardingCompletedAt: new Date().toISOString(),
  };

  await setDoc(
    doc(db, "users", uid),
    {
      ...record,
      userInterests,
      userInterestsUpdatedAt: record.onboardingCompletedAt,
    },
    { merge: true }
  );

  await setDoc(doc(db, "users", uid, "onboarding", "data"), record, { merge: true });
  await addUserInterests(uid, userInterests, []);
  return record;
}
