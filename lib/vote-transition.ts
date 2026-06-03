export function getVoteTransition(
  current: -1 | 0 | 1,
  dir: 1 | -1
): { next: -1 | 0 | 1; diff: number } | null {
  if (dir === 1) {
    if (current === 1) return { next: 0, diff: -1 };
    if (current === 0) return { next: 1, diff: 1 };
    if (current === -1) return { next: 1, diff: 2 };
  }
  if (dir === -1) {
    if (current === -1) return { next: 0, diff: 1 };
    if (current === 0) return { next: -1, diff: -1 };
    if (current === 1) return { next: -1, diff: -2 };
  }
  return null;
}

export function normalizeStoredVote(dir: number): -1 | 0 | 1 {
  if (dir === 1) return 1;
  if (dir === -1) return -1;
  return 0;
}
