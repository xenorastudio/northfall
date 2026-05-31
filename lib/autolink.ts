const BARE_URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

function stripTrailingPunct(url: string): { href: string; trailing: string } {
  let href = url;
  let trailing = "";
  while (href.length > 0 && /[.,;:!?)]+$/.test(href.slice(-1))) {
    trailing = href.slice(-1) + trailing;
    href = href.slice(0, -1);
  }
  return { href, trailing };
}

function isInsideExistingLink(before: string): boolean {
  const lastOpen = before.lastIndexOf("<a");
  const lastClose = before.lastIndexOf("</a>");
  if (lastOpen > lastClose) return true;
  if (/href\s*=\s*["'][^"']*$/i.test(before)) return true;
  if (/\]\($/.test(before.slice(-2))) return true;
  return false;
}

/** Turn plain https://… into clickable anchors (after markdown [t](url) is applied). */
export function autolinkBareUrls(html: string): string {
  return html.replace(BARE_URL_RE, (url, offset) => {
    const before = html.slice(0, offset);
    if (isInsideExistingLink(before)) return url;
    const { href, trailing } = stripTrailingPunct(url);
    if (!href) return url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="nf-md-link">${href}</a>${trailing}`;
  });
}
