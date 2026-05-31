/** هل يوجد نص حقيقي للمعاينة (ليس خط فاصل فقط ولا هاشتاغ وحده) */
export function hasMeaningfulPreviewBody(body: string | undefined | null): boolean {
  const raw = (body || "").trim();
  if (!raw) return false;

  const withoutRules = raw.replace(/^---+$/gm, "").replace(/^\*\*\*+$/gm, "").replace(/^___+$/gm, "").trim();
  if (!withoutRules) return false;

  const withoutTags = withoutRules.replace(/#[\p{L}\p{N}_][\p{L}\p{N}_-]*/gu, "").trim();
  if (!withoutTags) return false;

  return true;
}
