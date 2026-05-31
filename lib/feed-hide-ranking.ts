/**
 * خوارزمية Feed — down-ranking حسب إشارات Hide (Firestore، ليس Prisma).
 * PostScore = (Upvotes × 1.5) − (NegativeSignalsForCategory × 3)
 * + عقوبة 80% إذا 3 إخفاءات لنفس الفئة خلال 24 ساعة.
 */

import { postHotScore, postTopScore, type RankablePost } from "./feed-ranking";
import { resolvePostCategory, type PostCategorySource } from "./post-category";

export interface NegativeSignal {
  category: string;
  timestamp: string;
  postId?: string;
}

export interface FeedHideContext {
  negativeSignals: NegativeSignal[];
  categoryAffinities?: Map<string, number>;
  communityCategories?: Map<string, string>;
}

export function countSignalsByCategory(
  signals: NegativeSignal[],
  withinDays: number
): Map<string, number> {
  const cutoff = Date.now() - withinDays * 24 * 3_600_000;
  const map = new Map<string, number>();
  for (const s of signals) {
    const t = new Date(s.timestamp).getTime();
    if (!Number.isFinite(t) || t < cutoff) continue;
    const cat = s.category.toLowerCase();
    map.set(cat, (map.get(cat) || 0) + 1);
  }
  return map;
}

export function computePostHideScore(
  post: RankablePost & PostCategorySource,
  ctx: FeedHideContext
): number {
  const category = resolvePostCategory(post, ctx.communityCategories);
  const neg7d = countSignalsByCategory(ctx.negativeSignals, 7);
  const neg24h = countSignalsByCategory(ctx.negativeSignals, 1);
  const upvotes = post.votes || 0;
  const negCount = neg7d.get(category) || 0;
  let score = upvotes * 1.5 - negCount * 3;

  const hides24h = neg24h.get(category) || 0;
  if (hides24h >= 3) score *= 0.2;

  const affinity = ctx.categoryAffinities?.get(category) || 0;
  score += affinity * 1.5;

  return score;
}

export function rankPostsWithHideLearning<T extends RankablePost & PostCategorySource>(
  posts: T[],
  ctx: FeedHideContext,
  mode: "hot" | "new" | "top" = "hot"
): T[] {
  if (!posts.length) return posts;

  const neg7d = countSignalsByCategory(ctx.negativeSignals, 7);
  const hasSignals = neg7d.size > 0 || (ctx.categoryAffinities?.size ?? 0) > 0;

  if (!hasSignals) {
    if (mode === "new") {
      return [...posts].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
    if (mode === "top") {
      return [...posts].sort((a, b) => postTopScore(b) - postTopScore(a));
    }
    return [...posts].sort((a, b) => postHotScore(b) - postHotScore(a));
  }

  const scored = posts.map((p) => {
    const hideScore = computePostHideScore(p, ctx);
    let blend = hideScore;
    if (mode === "hot") blend += postHotScore(p) * 0.35;
    else if (mode === "top") blend += postTopScore(p) * 0.25;
    else blend += new Date(p.createdAt || 0).getTime() / 1e15;
    return { p, blend };
  });

  return scored.sort((a, b) => b.blend - a.blend).map((x) => x.p);
}
