import type { RankablePost } from "./feed-ranking";
import { resolvePostCategory, type PostCategorySource } from "./post-category";
import { categoryLabelToSlug, normalizeInterestTag } from "./user-interests";

function postTagSet(post: BoostablePost, communityCategories?: Map<string, string>): Set<string> {
  const set = new Set<string>();
  const cat = resolvePostCategory(post, communityCategories);
  if (cat) {
    set.add(cat.toLowerCase());
    set.add(normalizeInterestTag(cat));
    set.add(categoryLabelToSlug(cat));
  }
  if (post.community) set.add(normalizeInterestTag(post.community));
  for (const h of post.hashtags || []) {
    const n = normalizeInterestTag(String(h).replace(/^#/, ""));
    if (n) set.add(n);
  }
  return set;
}

type BoostablePost = RankablePost &
  PostCategorySource & { hashtags?: string[]; community?: string; title?: string; body?: string };

export function interestBoostForPost(
  post: BoostablePost,
  weights: Record<string, number>,
  communityCategories?: Map<string, string>
): number {
  if (!weights || !Object.keys(weights).length) return 0;
  const tags = postTagSet(post, communityCategories);
  let boost = 0;
  for (const [tag, w] of Object.entries(weights)) {
    const n = normalizeInterestTag(tag);
    if (!n || !Number.isFinite(w)) continue;
    if (tags.has(n) || tags.has(tag.toLowerCase())) boost += w * 2;
    else {
      const titleBody = `${(post.title || "").toLowerCase()} ${(post.body || "").toLowerCase()}`;
      if (titleBody.includes(n.replace(/-/g, " ")) || titleBody.includes(n)) boost += w * 0.75;
    }
  }
  return boost;
}

export function applyInterestBoostToPosts<T extends BoostablePost>(
  posts: T[],
  weights: Record<string, number>,
  communityCategories?: Map<string, string>
): T[] {
  if (!posts.length || !Object.keys(weights).length) return posts;
  return [...posts]
    .map((p, i) => ({ p, i, boost: interestBoostForPost(p, weights, communityCategories) }))
    .sort((a, b) => (b.boost !== a.boost ? b.boost - a.boost : a.i - b.i))
    .map((x) => x.p);
}
