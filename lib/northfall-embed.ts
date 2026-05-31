/** كود تضمين منشور NorthFall — blockquote + سكربت (متوافق مع /embed-generator) */
export function buildNorthfallEmbedCode(
  postId: string,
  siteOrigin = "https://www.northfall.blog"
): string {
  const base = siteOrigin.replace(/\/$/, "");
  return (
    `<blockquote class="northfall-embed" data-post-id="${postId}"></blockquote>\n` +
    `<script src="${base}/js/embed.js" async charset="UTF-8"></script>`
  );
}

export function buildNorthfallEmbedIframe(
  postId: string,
  siteOrigin = "https://www.northfall.blog",
  width = "600",
  height = "400"
): string {
  const base = siteOrigin.replace(/\/$/, "");
  return `<iframe src="${base}/embed/${postId}" width="${width}" height="${height}" style="border:none;border-radius:8px;max-width:100%;display:block;" title="NorthFall"></iframe>`;
}
