/** Like toggles on; dislike only removes a like — no downvote score below zero. */
export function getVoteTransition(
  current: -1 | 0 | 1,
  dir: 1 | -1
): { next: -1 | 0 | 1; diff: number } | null {
  const normalized = current < 0 ? 0 : current;
  if (dir === 1) {
    if (normalized === 1) return null;
    return { next: 1, diff: 1 - normalized };
  }
  if (normalized === 0) return null;
  if (normalized === 1) return { next: 0, diff: -1 };
  return null;
}

export function normalizeStoredVote(dir: number): -1 | 0 | 1 {
  if (dir === 1) return 1;
  return 0;
}
