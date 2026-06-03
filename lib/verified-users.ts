/**
 * Verified users — accounts that show a ✓ verified badge.
 * This list is for the badge ONLY — no extra permissions are granted.
 */
const VERIFIED_UIDS: ReadonlySet<string> = new Set([
  "bn6vKOGvIeUdF91P0fzMEbFZfGr2",   // المؤسس
  "WItmZkIASkRli0TzXg68TF930hM2",   // عضو موثّق
]);

export function isVerifiedUser(uid: string | undefined | null): boolean {
  if (!uid) return false;
  return VERIFIED_UIDS.has(uid);
}
