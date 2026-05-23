import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NorthfallBot/1.0; +https://northfall.gg)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);
    const html = await res.text();

    // Extract og: tags and fallback to <title> / <meta description>
    const getMeta = (prop: string) => {
      const re = new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
      const m = html.match(re);
      if (m) return m[1];
      // Try reversed order: content before property
      const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
      const m2 = html.match(re2);
      return m2 ? m2[1] : null;
    };

    const title = getMeta("og:title") || getMeta("twitter:title") || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || null;
    const description = getMeta("og:description") || getMeta("twitter:description") || getMeta("description") || null;
    const image = getMeta("og:image") || getMeta("twitter:image") || null;
    const siteName = getMeta("og:site_name") || null;
    const favicon = getMeta("og:image") ? null : html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']*)["']/i)?.[1] || null;

    // Resolve relative URLs
    const resolve = (u: string | null) => {
      if (!u) return null;
      try {
        return new URL(u, url).href;
      } catch {
        return u;
      }
    };

    return NextResponse.json({
      title: title?.slice(0, 200) || null,
      description: description?.slice(0, 300) || null,
      image: resolve(image),
      siteName: siteName?.slice(0, 50) || null,
      favicon: resolve(favicon),
      domain: (() => { try { return new URL(url).hostname.replace("www.", ""); } catch { return url; } })(),
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
