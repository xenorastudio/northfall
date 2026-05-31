export type NorthfallCommentSort = "new" | "recommended" | "votes" | "threads";

export type CommentContentFilter = "all" | "author" | "links" | "long";

export const NORTHFALL_COMMENT_SORT: {
  id: NorthfallCommentSort;
  labelKey: string;
  fallback: string;
}[] = [
  { id: "new", labelKey: "pd.sortNew", fallback: "جديد" },
  { id: "recommended", labelKey: "pd.sortRecommended", fallback: "مُختار" },
  { id: "votes", labelKey: "pd.sortVotes", fallback: "الأكثر دعمًا" },
  { id: "threads", labelKey: "pd.sortThreads", fallback: "أغزر نقاشًا" },
];

export const COMMENT_CONTENT_FILTERS: {
  id: CommentContentFilter;
  labelKey: string;
  fallback: string;
}[] = [
  { id: "all", labelKey: "pd.filterAll", fallback: "الكل" },
  { id: "author", labelKey: "pd.filterAuthor", fallback: "كاتب" },
  { id: "links", labelKey: "pd.filterLinks", fallback: "فيه رابط" },
  { id: "long", labelKey: "pd.filterLong", fallback: "طويل" },
];

function commentTimestamp(c: { createdAt?: string }): number {
  if (!c.createdAt) return 0;
  const n = new Date(c.createdAt).getTime();
  return Number.isFinite(n) ? n : 0;
}

export function commentHasLink(text: string): boolean {
  return /https?:\/\/\S+/i.test(text);
}

export function commentIsLong(text: string, min = 160): boolean {
  return (text || "").trim().length >= min;
}

export function sortNorthfallComments<T extends { id: string; votes?: number; replies?: unknown[]; createdAt?: string }>(
  roots: T[],
  mode: NorthfallCommentSort
): T[] {
  const list = [...roots];
  const replyCount = (c: { replies?: unknown[] }) => c.replies?.length || 0;

  if (mode === "new") {
    return list.sort((a, b) => commentTimestamp(b) - commentTimestamp(a));
  }
  if (mode === "votes") {
    return list.sort((a, b) => {
      const d = (b.votes || 0) - (a.votes || 0);
      return d !== 0 ? d : commentTimestamp(b) - commentTimestamp(a);
    });
  }
  if (mode === "threads") {
    return list.sort((a, b) => {
      const d = replyCount(b) - replyCount(a);
      return d !== 0 ? d : commentTimestamp(b) - commentTimestamp(a);
    });
  }
  return list.sort((a, b) => {
    const score = (c: typeof a) =>
      (c.votes || 0) * 4 + replyCount(c) * 2 + commentTimestamp(c) / 1e12;
    const d = score(b) - score(a);
    return d !== 0 ? d : commentTimestamp(b) - commentTimestamp(a);
  });
}

export function matchesCommentContentFilter(
  c: { text: string; authorName?: string },
  q: string,
  filter: CommentContentFilter
): boolean {
  if (filter === "author") {
    return (c.authorName || "").toLowerCase().includes(q);
  }
  if (filter === "links") {
    return commentHasLink(c.text);
  }
  if (filter === "long") {
    return commentIsLong(c.text);
  }
  return (
    c.text.toLowerCase().includes(q) ||
    (c.authorName || "").toLowerCase().includes(q)
  );
}

export function matchesCommentSearch(
  c: { text: string; authorName?: string },
  q: string,
  filter: CommentContentFilter
): boolean {
  if (!q) {
    if (filter === "links") return commentHasLink(c.text);
    if (filter === "long") return commentIsLong(c.text);
    return true;
  }
  return matchesCommentContentFilter(c, q, filter);
}
