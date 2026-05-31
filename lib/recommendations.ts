import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  interestTagsFromCategory,
  normalizeInterestTag,
  prioritizeInterestsForQuery,
} from "@/lib/user-interests";
import {
  addFavoriteGameWeights,
  expandInterestWeights,
  isRacingInterestSignal,
  scoreGameForRecommendation,
} from "@/lib/game-recommendation-signals";
import { resolveCategoryDisplay } from "@/lib/community-categories";
import type { Game } from "@/app/components/GamesPage";
import { GAMES } from "@/app/components/GamesPage";

export interface RecommendableCommunity {
  name: string;
  label: string;
  img: string;
  members: number;
  category?: string;
  shortDesc?: string;
}

function interestRecencyWeight(orderedInterests: string[], tag: string): number {
  const idx = orderedInterests.findIndex((t) => normalizeInterestTag(t) === tag);
  if (idx < 0) return 1;
  return Math.max(1, orderedInterests.length - idx);
}

/** جلب مجتمعات — يستخدم أحدث الاهتمامات أولاً في array-contains-any */
export async function fetchCommunitiesByInterestTags(
  orderedInterests: string[],
  joinedIds: string[],
  excludeId?: string,
  maxResults = 4
): Promise<string[]> {
  const tags = prioritizeInterestsForQuery(orderedInterests);
  if (!tags.length) return [];

  const joinedSet = new Set(joinedIds);
  try {
    const q = query(
      collection(db, "communities"),
      where("tags", "array-contains-any", tags),
      limit(24)
    );
    const snap = await getDocs(q);
    const scored: { id: string; score: number; members: number }[] = [];
    for (const d of snap.docs) {
      const id = d.data().name || d.id;
      if (joinedSet.has(id) || id === excludeId) continue;
      const data = d.data();
      const commTags = new Set(
        (Array.isArray(data.tags) ? data.tags : []).map((t: unknown) =>
          typeof t === "string" ? normalizeInterestTag(t) : ""
        )
      );
      let score = 0;
      tags.forEach((t, queryIdx) => {
        if (commTags.has(t)) score += (tags.length - queryIdx) * 12;
      });
      const catTags = interestTagsFromCategory(String(data.category || ""));
      catTags.forEach((t) => {
        if (tags.includes(t)) score += interestRecencyWeight(orderedInterests, t) * 8;
      });
      scored.push({ id, score: score || 1, members: data.memberCount || 0 });
    }
    scored.sort((a, b) => b.score - a.score || b.members - a.members);
    return scored.slice(0, maxResults).map((s) => s.id);
  } catch (e) {
    console.warn("[recommendations] Firestore tags query:", e);
    return [];
  }
}

export function scoreCommunitiesByUserInterests(
  all: RecommendableCommunity[],
  orderedInterests: string[],
  joinedIds: string[],
  excludeId?: string,
  maxResults = 4
): string[] {
  const tags = prioritizeInterestsForQuery(orderedInterests);
  if (!tags.length) return [];

  const tagSet = new Set(tags);
  const joinedSet = new Set(joinedIds);
  const scored = all
    .filter((c) => !joinedSet.has(c.name) && c.name !== excludeId)
    .map((c) => {
      const commTags = new Set(interestTagsFromCategory(c.category || ""));
      let score = 0;
      tags.forEach((t) => {
        if (commTags.has(t)) score += interestRecencyWeight(orderedInterests, t) * 12;
      });
      const cat = resolveCategoryDisplay(c.category || "");
      if (cat) {
        tagSet.forEach((t) => {
          if (normalizeInterestTag(cat).includes(t) || cat.toLowerCase().includes(t)) {
            score += interestRecencyWeight(orderedInterests, t) * 6;
          }
        });
      }
      return { name: c.name, score, members: c.members || 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.members - a.members);

  return scored.slice(0, maxResults).map((s) => s.name);
}

export function popularCommunityIds(
  all: RecommendableCommunity[],
  joinedIds: string[],
  excludeId?: string,
  maxResults = 4
): string[] {
  const joinedSet = new Set(joinedIds);
  return [...all]
    .filter((c) => !joinedSet.has(c.name) && c.name !== excludeId)
    .sort((a, b) => (b.members || 0) - (a.members || 0))
    .slice(0, maxResults)
    .map((c) => c.name);
}

export async function resolveRecommendedCommunityIds(
  orderedInterests: string[],
  all: RecommendableCommunity[],
  joinedIds: string[],
  excludeId?: string,
  maxResults = 4
): Promise<string[]> {
  const fromQuery = await fetchCommunitiesByInterestTags(
    orderedInterests,
    joinedIds,
    excludeId,
    maxResults
  );
  if (fromQuery.length >= maxResults) return fromQuery;

  const need = maxResults - fromQuery.length;
  const used = new Set([...fromQuery, ...joinedIds]);
  const fromCache = scoreCommunitiesByUserInterests(
    all.filter((c) => !used.has(c.name)),
    orderedInterests,
    [...joinedIds, ...fromQuery],
    excludeId,
    need
  );

  const combined = [...fromQuery, ...fromCache];
  if (combined.length >= maxResults) return combined.slice(0, maxResults);

  const still = maxResults - combined.length;
  const fallback = popularCommunityIds(
    all.filter((c) => !combined.includes(c.name)),
    [...joinedIds, ...combined],
    excludeId,
    still
  );
  const result = [...combined, ...fallback].slice(0, maxResults);
  if (result.length > 0) return result;

  return [...all]
    .filter((c) => c.name !== excludeId)
    .sort((a, b) => (b.members || 0) - (a.members || 0))
    .slice(0, maxResults)
    .map((c) => c.name);
}

export interface RecommendGamesOptions {
  maxResults?: number;
  excludeIds?: string[];
  favoriteIds?: string[];
}

/** ألعاب مقترحة — تطابق اهتمامات + مفضلة، بدون حشو RPG عند وجود تطابق */
export function recommendGames(
  orderedInterests: string[],
  maxResultsOrOptions: number | RecommendGamesOptions = 6,
  legacyExcludeIds: string[] = []
): Game[] {
  const opts: RecommendGamesOptions =
    typeof maxResultsOrOptions === "number"
      ? { maxResults: maxResultsOrOptions, excludeIds: legacyExcludeIds, favoriteIds: [] }
      : maxResultsOrOptions;
  const maxResults = opts.maxResults ?? 6;
  const exclude = new Set(opts.excludeIds ?? []);
  const favoriteIds = opts.favoriteIds ?? [];

  const weights = expandInterestWeights(orderedInterests);
  addFavoriteGameWeights(weights, favoriteIds, GAMES);

  const scored = GAMES.filter((g) => !exclude.has(g.id))
    .map((game) => ({
      game,
      score: scoreGameForRecommendation(game, weights),
    }))
    .sort((a, b) => b.score - a.score || b.game.rating - a.game.rating);

  const matched = scored.filter((x) => x.score > 0);

  if (matched.length > 0) {
    const racingMode = isRacingInterestSignal(weights);
    const pool = racingMode
      ? matched.filter((x) => scoreGameForRecommendation(x.game, new Map([["cars", 10], ["سباق", 10]])) > 0)
      : matched;
    const use = pool.length >= Math.min(3, maxResults) ? pool : matched;
    return use.slice(0, maxResults).map((x) => x.game);
  }

  if (favoriteIds.length > 0) {
    const fromFavs = favoriteIds
      .map((id) => GAMES.find((g) => g.id === id))
      .filter((g): g is Game => !!g && !exclude.has(g.id));
    if (fromFavs.length > 0) {
      const favGenres = new Set(fromFavs.flatMap((g) => g.genre));
      const similar = GAMES.filter(
        (g) =>
          !exclude.has(g.id) &&
          !fromFavs.some((f) => f.id === g.id) &&
          g.genre.some((gen) => favGenres.has(gen))
      ).sort((a, b) => b.rating - a.rating);
      return [...fromFavs, ...similar].slice(0, maxResults);
    }
  }

  return [...GAMES]
    .filter((g) => !exclude.has(g.id))
    .sort((a, b) => b.rating - a.rating || b.releaseYear - a.releaseYear)
    .slice(0, maxResults);
}
