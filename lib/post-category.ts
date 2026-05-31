/** استخراج «فئة» المنشور للتعلّم من إخفاء المحتوى (Flair → Hashtag → مجتمع). */

export interface PostCategorySource {
  flair?: string;
  hashtags?: string[];
  community?: string;
  communityCategory?: string;
}

export function resolvePostCategory(
  post: PostCategorySource,
  communityCategories?: Map<string, string>
): string {
  const flair = post.flair?.trim();
  if (flair) return flair.toLowerCase();

  const tag = post.hashtags?.find((h) => h?.trim());
  if (tag) return tag.replace(/^#/, "").trim().toLowerCase();

  const comm = post.community?.trim();
  if (comm && communityCategories?.has(comm.toLowerCase())) {
    return communityCategories.get(comm.toLowerCase())!.toLowerCase();
  }
  if (comm) return `community:${comm.toLowerCase()}`;

  return "general";
}

export function categoryDocId(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "general";
}
