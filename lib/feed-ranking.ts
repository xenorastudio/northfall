/** خوارزمية ترتيب المنشورات — تفاعل × زمن */

import { isProfileOnlyPost } from "./post-target";

export interface RankablePost {
  id: string;
  votes?: number;
  commentCount?: number;
  createdAt?: string;
  community?: string;
  postTarget?: string;
  authorName?: string;
}

export function postAgeHours(createdAt?: string): number {
  if (!createdAt) return 24;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return 24;
  return Math.max((Date.now() - t) / 3_600_000, 0.25);
}

/** أوزان: تعليق = 2× تصويت، مع تلاشي زمني */
export function postEngagementScore(post: RankablePost): number {
  const votes = post.votes || 0;
  const comments = post.commentCount || 0;
  return votes + comments * 2;
}

export function postHotScore(post: RankablePost): number {
  const engagement = postEngagementScore(post);
  const hours = postAgeHours(post.createdAt);
  return engagement / Math.pow(hours + 2, 1.35);
}

export function postTopScore(post: RankablePost): number {
  return postEngagementScore(post);
}

export function sortPostsByMode<T extends RankablePost>(
  posts: T[],
  mode: "new" | "top" | "hot" | "comments"
): T[] {
  const copy = [...posts];
  if (mode === "new") {
    return copy.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  if (mode === "top") {
    return copy.sort((a, b) => postTopScore(b) - postTopScore(a));
  }
  if (mode === "comments") {
    return copy.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
  }
  return copy.sort((a, b) => postHotScore(b) - postHotScore(a));
}

export interface CommunityFeedMeta {
  name: string;
  communityType?: string;
  showInForum?: boolean;
}

export function buildCommunityMetaLookup(communities: CommunityFeedMeta[]): Map<string, CommunityFeedMeta> {
  const map = new Map<string, CommunityFeedMeta>();
  for (const c of communities) {
    map.set(c.name.toLowerCase(), c);
  }
  return map;
}

function resolveCommunityMeta(
  communityName: string,
  lookup: Map<string, CommunityFeedMeta>
): CommunityFeedMeta | undefined {
  const key = communityName.toLowerCase();
  if (lookup.has(key)) return lookup.get(key);
  for (const meta of lookup.values()) {
    if (meta.name.toLowerCase() === key) return meta;
  }
  return undefined;
}

/** مجتمع يظهر في الاستكشاف / الفيد العام — الخاص فقط يُستثنى (المقيد يُعرض للانتشار) */
export function isCommunityPublicForDiscovery(
  communityName: string | undefined,
  lookup: Map<string, CommunityFeedMeta>
): boolean {
  if (!communityName) return true;
  const meta = resolveCommunityMeta(communityName, lookup);
  if (!meta) return true;
  if (meta.showInForum === false) return false;
  const t = (meta.communityType || "public").toLowerCase();
  return t !== "private";
}

export function isCommunityMuted(communityName: string | undefined, mutedCommunities: string[]): boolean {
  if (!communityName || !mutedCommunities.length) return false;
  const lc = communityName.toLowerCase();
  return mutedCommunities.some((m) => m.toLowerCase() === lc);
}

/** مجتمع → وقت الكتم (ISO). مفاتيح lowercase. */
export type CommunityMutesMap = Record<string, string>;

export function parseCommunityMutesFromUser(data: {
  communityMutes?: Record<string, string>;
  mutedCommunities?: string[];
}): CommunityMutesMap {
  const mutes: CommunityMutesMap = {};
  const raw = data.communityMutes;
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string" && v) mutes[k.toLowerCase()] = v;
    }
  }
  return mutes;
}

export function getCommunityMuteAt(
  communityName: string | undefined,
  mutes: CommunityMutesMap
): string | null {
  if (!communityName) return null;
  return mutes[communityName.toLowerCase()] ?? null;
}

/** يُخفى من الفيد الرئيسي فقط إذا نُشر بعد وقت الكتم */
export function isPostHiddenByHomeMute(post: RankablePost, mutes: CommunityMutesMap): boolean {
  const mutedAt = getCommunityMuteAt(post.community, mutes);
  if (!mutedAt) return false;
  if (!post.createdAt) return true;
  const postMs = new Date(post.createdAt).getTime();
  const muteMs = new Date(mutedAt).getTime();
  if (Number.isNaN(muteMs)) return false;
  if (Number.isNaN(postMs)) return true;
  return postMs > muteMs;
}

/** الفيد الرئيسي / المتابَعة — لا يُطبَّق على صفحة المجتمع ولا الخلاصة المخصصة */
export function filterPostsForHomeFeed<T extends RankablePost>(
  posts: T[],
  mutes: CommunityMutesMap
): T[] {
  if (!Object.keys(mutes).length) return posts;
  return posts.filter((p) => !isPostHiddenByHomeMute(p, mutes));
}

/** فيد المنصة: مجتمعات عامة + منشورات البروفايل (u/) */
export function filterPostsForGlobalFeed<T extends RankablePost>(
  posts: T[],
  opts: { publicLookup: Map<string, CommunityFeedMeta> }
): T[] {
  return posts.filter((p) => {
    if (isProfileOnlyPost(p)) return true;
    return isCommunityPublicForDiscovery(p.community, opts.publicLookup);
  });
}

export function mergePostsDedup<T extends RankablePost>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((p) => p.id));
  const merged = [...existing];
  for (const p of incoming) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }
  return merged;
}

/** دمج مرشّحي Hot: حديث + تفاعل + أعلى تصويت (ضمان ظهور الرائج في الفيد) */
export function mergeGlobalHotCandidates<T extends RankablePost>(
  recent: T[],
  byVotes: T[],
  topTrending: T[] = []
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const p of [...topTrending, ...byVotes, ...recent]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }
  return merged;
}

/** إضافة منشورات جديدة في أعلى الفيد دون إعادة جلب كامل */
export function prependPostsDedup<T extends RankablePost>(incoming: T[], existing: T[]): T[] {
  const seen = new Set(incoming.map((p) => p.id));
  const out = [...incoming];
  for (const p of existing) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

/** اقتراح مجتمعات حسب تصنيفات المجتمعات المنضم إليها */
export function scoreCommunitiesByInterest(
  all: { name: string; category?: string; members?: number }[],
  joinedNames: string[],
  joinedCategories: string[]
): { name: string; score: number }[] {
  const joinedSet = new Set(joinedNames);
  const catWeight = new Map<string, number>();
  joinedCategories.forEach((c) => {
    const n = c.trim();
    if (n) catWeight.set(n, (catWeight.get(n) || 0) + 1);
  });

  return all
    .filter((c) => !joinedSet.has(c.name))
    .map((c) => {
      const cat = (c.category || "").trim();
      let score = (c.members || 0) * 0.01;
      if (cat && catWeight.has(cat)) score += (catWeight.get(cat) || 0) * 10;
      return { name: c.name, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}
