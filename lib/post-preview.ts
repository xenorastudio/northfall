/** Plain-text excerpt for feed cards (no code blocks / markdown UI). */

export function postBodyPreviewText(body: string, maxLen = 280): string {
  if (!body?.trim()) return "";
  let s = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/#{1,6}(?=\S)/g, "")
    .replace(/>![\s\S]+?!</g, " ")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|[^|\n]+\|/g, " ")
    .replace(/[#*_~^]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}
