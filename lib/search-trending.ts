/**
 * مواضيع ومنشورات «الأكثر رواجاً» في البحث — تفاعل × زمن (نفس منطق feed-ranking)
 */

import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { postHotScore, type RankablePost } from "@/lib/feed-ranking";
import { interestTagsFromCommunityData } from "@/lib/user-interests";

const CACHE_MS = 90_000;
const RECENT_LIMIT = 100;
const VOTES_LIMIT = 35;

let cacheKey = "";
let cacheAt = 0;
let cacheData: SearchTrendingSnapshot | null = null;

export type TrendingTopic = {
  key: string;
  label: string;
  score: number;
  kind: "hashtag" | "community" | "category" | "title";
};

export type TrendingPostItem = {
  id: string;
  title: string;
  community: string;
  hotScore: number;
  votes: number;
  commentCount: number;
};

export type SearchTrendingSnapshot = {
  topics: TrendingTopic[];
  posts: TrendingPostItem[];
};

type CommMeta = { name: string; members?: number; category?: string; label?: string };

const AR_STOP = new Set([
  "من", "في", "على", "إلى", "عن", "مع", "هذا", "هذه", "ذلك", "التي", "الذي", "كان", "كانت",
  "ما", "لم", "لن", "قد", "أو", "و", "ف", "ب", "ل", "ك", "هو", "هي", "هم", "أن", "إن",
  "كل", "بعض", "عند", "بعد", "قبل", "حتى", "بدون", "بد", "شيء", "شي", "لي", "لك",
]);

const EN_STOP = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was",
  "one", "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new",
  "now", "old", "see", "two", "way", "who", "boy", "did", "she", "use", "her", "that",
  "this", "with", "from", "have", "been", "what", "when", "your", "will", "more", "about",
]);

function extractHashtags(text: string): string[] {
  const out: string[] = [];
  const re = /#([\p{L}\p{N}_]{2,32})/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1].toLowerCase());
  }
  return out;
}

function titleKeywords(title: string): string[] {
  const cleaned = title
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^\p{L}\p{N}\s#]/gu, " ")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const keys: string[] = [];
  for (const w of words) {
    const bare = w.replace(/^#/, "").toLowerCase();
    if (bare.length < 3 || bare.length > 28) continue;
    if (/^\d+$/.test(bare)) continue;
    if (AR_STOP.has(bare) || EN_STOP.has(bare)) continue;
    keys.push(bare);
  }
  return keys;
}

function bumpTopic(
  map: Map<string, TrendingTopic>,
  key: string,
  label: string,
  kind: TrendingTopic["kind"],
  delta: number
) {
  const k = key.toLowerCase();
  const prev = map.get(k);
  if (prev) {
    prev.score += delta;
    return;
  }
  map.set(k, { key: k, label, score: delta, kind });
}

function postToRankable(id: string, data: Record<string, unknown>): RankablePost & { title?: string } {
  return {
    id,
    votes: Number(data.votes) || 0,
    commentCount: Number(data.commentCount) || 0,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
    community: typeof data.community === "string" ? data.community : undefined,
    title: typeof data.title === "string" ? data.title : "",
  };
}

export async function fetchSearchTrending(
  communities: CommMeta[],
  scopeCommunity?: string
): Promise<SearchTrendingSnapshot> {
  const key = `${scopeCommunity || "global"}:${communities.length}`;
  if (cacheData && cacheKey === key && Date.now() - cacheAt < CACHE_MS) {
    return cacheData;
  }

  const topicMap = new Map<string, TrendingTopic>();
  const postMap = new Map<string, TrendingPostItem & RankablePost>();

  try {
    const recentQ = scopeCommunity
      ? query(
          collection(db, "posts"),
          where("community", "==", scopeCommunity),
          orderBy("createdAt", "desc"),
          limit(60)
        )
      : query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(RECENT_LIMIT));

    const votesQ = scopeCommunity
      ? query(
          collection(db, "posts"),
          where("community", "==", scopeCommunity),
          orderBy("votes", "desc"),
          limit(25)
        )
      : query(collection(db, "posts"), orderBy("votes", "desc"), limit(VOTES_LIMIT));

    const snaps = await Promise.all([
      getDocs(recentQ).catch(() => null),
      getDocs(votesQ).catch(() => null),
    ]);

    for (const snap of snaps) {
      if (!snap) continue;
      snap.docs.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        const p = postToRankable(d.id, data);
        if (!p.title?.trim()) return;
        const hot = postHotScore(p);
        const existing = postMap.get(d.id);
        if (!existing || hot > postHotScore(existing)) {
          postMap.set(d.id, {
            ...p,
            title: p.title || "",
            community: p.community || "",
            hotScore: hot,
            votes: p.votes || 0,
            commentCount: p.commentCount || 0,
          });
        }

        const weight = hot + 0.15;
        const body = typeof data.body === "string" ? data.body : "";
        const text = `${p.title} ${body}`;

        for (const tag of extractHashtags(text)) {
          bumpTopic(topicMap, tag, `#${tag}`, "hashtag", weight * 1.4);
        }
        for (const kw of titleKeywords(p.title || "")) {
          bumpTopic(topicMap, `kw:${kw}`, kw, "title", weight * 0.35);
        }
        if (p.community) {
          const comm = communities.find((c) => c.name === p.community);
          const label = comm?.label || p.community;
          bumpTopic(topicMap, `c:${p.community}`, `n/${p.community}`, "community", weight * 1.1);
          if (comm?.category) {
            const cat = comm.category.replace(/^[^\s]+\s/, "").trim();
            if (cat.length >= 2) {
              bumpTopic(topicMap, `cat:${cat}`, cat, "category", weight * 0.9);
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn("[search-trending] posts:", e);
  }

  // دفعة مجتمعات نشطة (منشورات حديثة × أعضاء)
  const commByPosts = new Map<string, number>();
  postMap.forEach((p) => {
    if (!p.community) return;
    commByPosts.set(p.community, (commByPosts.get(p.community) || 0) + p.hotScore);
  });
  communities.forEach((c) => {
    const activity = commByPosts.get(c.name) || 0;
    const memberBoost = Math.log10(Math.max(c.members || 1, 1)) * 0.4;
    const tags = interestTagsFromCommunityData({ category: c.category || "", tags: [] });
    const base = activity + memberBoost;
    if (base > 0.2) {
      bumpTopic(topicMap, `c:${c.name}`, `n/${c.name}`, "community", base);
    }
    tags.slice(0, 2).forEach((t) => {
      bumpTopic(topicMap, t, t, "category", base * 0.5);
    });
  });

  let topics = Array.from(topicMap.values())
    .filter((t) => t.score > 0.15)
    .sort((a, b) => b.score - a.score);

  // تنويع: لا نكرر نفس المجتمع بوسوم متعددة
  const seenComm = new Set<string>();
  topics = topics.filter((t) => {
    if (t.kind === "community") {
      if (seenComm.has(t.key)) return false;
      seenComm.add(t.key);
    }
    return true;
  });

  topics = topics.slice(0, 8);

  if (topics.length < 4) {
    communities
      .slice()
      .sort((a, b) => (b.members || 0) - (a.members || 0))
      .slice(0, 6 - topics.length)
      .forEach((c) => {
        const k = `c:${c.name}`;
        if (!topicMap.has(k)) {
          topics.push({
            key: k,
            label: `n/${c.name}`,
            score: Math.log10(Math.max(c.members || 1, 1)),
            kind: "community",
          });
        }
      });
  }

  const posts = Array.from(postMap.values())
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 5)
    .map(({ id, title, community, hotScore, votes, commentCount }) => ({
      id,
      title,
      community,
      hotScore,
      votes,
      commentCount,
    }));

  const snapshot: SearchTrendingSnapshot = { topics: topics.slice(0, 8), posts };
  cacheKey = key;
  cacheAt = Date.now();
  cacheData = snapshot;
  return snapshot;
}

/** إبطال الكاش بعد نشر منشور جديد (اختياري) */
export function invalidateSearchTrendingCache(): void {
  cacheAt = 0;
  cacheData = null;
}
