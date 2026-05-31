import type { Game } from "@/app/components/GamesPage";
import { interestTagsFromGameGenres, normalizeInterestTag } from "@/lib/user-interests";

/** مرادفات الاهتمام → كلمات تطابق في genre/اسم اللعبة */
export const INTEREST_GAME_ALIASES: Record<string, string[]> = {
  cars: ["cars", "سيارات", "محركات", "سباق", "racing", "driving", "drift", "قيادة", "formula", "f1", "forza", "nfs", "carx", "assetto", "beamng", "محاكاة"],
  sports: ["sports", "رياضة", "سباق", "football", "fifa", "كورة"],
  gaming: ["gaming", "ألعاب", "game"],
  gamedev: ["gamedev", "indie", "unity", "unreal"],
  horror: ["horror", "رعب", "survival"],
  rpg: ["rpg", "أدوار"],
  programming: ["programming", "code", "برمجة"],
  سيارات: ["cars", "racing", "driving"],
  تطوير: ["gamedev"],
  unity3d: ["gamedev", "programming"],
};

export function expandInterestWeights(orderedInterests: string[]): Map<string, number> {
  const weights = new Map<string, number>();
  orderedInterests.forEach((raw, index) => {
    const tag = normalizeInterestTag(raw);
    if (!tag) return;
    const recencyBoost = Math.max(1, orderedInterests.length - index);
    const base = recencyBoost * 10;
    weights.set(tag, (weights.get(tag) || 0) + base);
    const aliases = INTEREST_GAME_ALIASES[tag] || [];
    for (const alias of aliases) {
      const a = normalizeInterestTag(alias);
      if (a) weights.set(a, (weights.get(a) || 0) + base * 0.85);
    }
  });
  return weights;
}

export function addFavoriteGameWeights(
  weights: Map<string, number>,
  favoriteIds: string[],
  games: Game[]
): void {
  for (const id of favoriteIds) {
    const game = games.find((g) => g.id === id);
    if (!game) continue;
    const tags = interestTagsFromGameGenres(game.genre);
    for (const tag of tags) {
      weights.set(tag, (weights.get(tag) || 0) + 55);
    }
    for (const genre of game.genre) {
      const g = normalizeInterestTag(genre);
      if (g) weights.set(g, (weights.get(g) || 0) + 45);
    }
  }
}

export function scoreGameForRecommendation(game: Game, weights: Map<string, number>): number {
  if (!weights.size) return 0;
  let score = 0;
  const genreNorm = game.genre.map((g) => normalizeInterestTag(g));
  const gameTags = new Set(interestTagsFromGameGenres(game.genre));
  const nameNorm = normalizeInterestTag(game.name);

  for (const [tag, weight] of weights) {
    if (gameTags.has(tag)) score += weight;
    if (genreNorm.some((g) => g === tag || g.includes(tag) || tag.includes(g))) score += weight * 1.2;
    if (nameNorm.includes(tag) || tag.includes(nameNorm)) score += weight * 0.4;
    const aliases = INTEREST_GAME_ALIASES[tag] || [];
    for (const alias of aliases) {
      const a = normalizeInterestTag(alias);
      if (!a) continue;
      if (gameTags.has(a)) score += weight * 0.9;
      if (genreNorm.some((g) => g.includes(a) || a.includes(g))) score += weight;
    }
  }
  return score;
}

export function isRacingInterestSignal(weights: Map<string, number>): boolean {
  const racingKeys = ["cars", "سباق", "racing", "sports", "قيادة", "محاكاة", "drift"];
  for (const k of weights.keys()) {
    if (racingKeys.some((r) => k.includes(r) || r.includes(k))) return true;
  }
  return false;
}
