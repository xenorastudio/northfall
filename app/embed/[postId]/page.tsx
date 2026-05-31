"use client";

import { useEffect, useState, Suspense } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useSearchParams } from "next/navigation";
import { flairBadgeStyle } from "@/lib/flair-badge";
import { getEmbedTheme, resolveEmbedSkin } from "@/lib/embed-themes";

interface PostData {
  title: string;
  body?: string;
  authorName: string;
  authorPhoto?: string;
  community: string;
  votes: number;
  commentCount?: number;
  imageUrl?: string;
  imageUrls?: string[];
  linkUrl?: string;
  createdAt?: string;
  flair?: string;
  flairBg?: string | null;
  flairTextColor?: string | null;
  hashtags?: string[];
  postType?: string;
  views?: number;
}

function getTimeAgo(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `منذ ${Math.floor(s / 60)} د`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} س`;
  if (s < 604800) return `منذ ${Math.floor(s / 86400)} ي`;
  return `منذ ${Math.floor(s / 604800)} أ`;
}

function readTime(body?: string): string {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return "";
  return `${Math.max(1, Math.ceil(words / 180))} د`;
}

function extractDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

function EmbedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.postId as string;

  const skin = resolveEmbedSkin(searchParams.get("theme"), searchParams.get("skin"));
  const theme = getEmbedTheme(skin);
  const hideBody   = searchParams.get("hideBody") === "1";
  const hideUser   = searchParams.get("hideUser") === "1";
  const hideImg    = searchParams.get("hideImg") === "1";
  const hideFooter = searchParams.get("hideFooter") === "1";
  const hideBrand  = searchParams.get("hideBrand") === "1";
  const hideFlair  = searchParams.get("hideFlair") === "1";
  const hideVotes  = searchParams.get("hideVotes") === "1";
  const hideTime   = searchParams.get("hideTime") === "1";
  const hideComm   = searchParams.get("hideComm") === "1";
  const compact    = searchParams.get("compact") === "1";
  const radius     = searchParams.get("radius") || "12";
  const lines      = searchParams.get("lines") || "4";

  const [post, setPost]       = useState<PostData | null>(null);
  const [commImg, setCommImg] = useState("");
  const [error, setError]     = useState("");
  const [imgIdx, setImgIdx]   = useState(0);

  useEffect(() => {
    if (!postId) { setError("لم يتم تحديد المنشور"); return; }
    (async () => {
      try {
        let snap = await getDoc(doc(db, "posts", postId));
        if (!snap.exists()) snap = await getDoc(doc(db, "threads", postId));
        if (!snap.exists()) { setError("المنشور غير موجود"); return; }
        const data = snap.data() as PostData;
        setPost(data);
        if (data.community) {
          const cs = await getDoc(doc(db, "communities", data.community));
          if (cs.exists()) setCommImg(cs.data().img || "");
        }
      } catch { setError("خطأ في تحميل المنشور"); }
    })();
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    const notify = () => {
      const h = document.body.scrollHeight;
      window.parent.postMessage({ type: "nf-embed-resize", height: h, postId }, "*");
    };
    notify();
    setTimeout(notify, 300);
    setTimeout(notify, 800);
  }, [post, postId, imgIdx, hideBody, hideImg, hideFooter]);

  const siteUrl = "https://www.northfall.blog";
  const postUrl = `${siteUrl}/post/${postId}`;

  const { bg, cardBg, border, text, muted, dim, accent, accentSoft, surface, hoverBg, upColor, downColor, shimBase, shimHigh } = theme;

  if (error) return (
    <div style={{
      padding: "28px 16px", textAlign: "center", fontFamily: "'Cairo',sans-serif",
      background: bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      <p style={{ fontSize: 13, color: muted, margin: 0 }}>{error}</p>
    </div>
  );

  if (!post) return (
    <div style={{ padding: "14px 16px", fontFamily: "'Cairo',sans-serif", background: bg }}>
      <style>{`@keyframes sh{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: cardBg, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundImage: `linear-gradient(90deg,${shimBase} 25%,${shimHigh} 50%,${shimBase} 75%)`, backgroundSize: "200% 100%", animation: "sh 1.4s infinite" }} />
          <div style={{ height: 10, width: 120, borderRadius: 5, backgroundImage: `linear-gradient(90deg,${shimBase} 25%,${shimHigh} 50%,${shimBase} 75%)`, backgroundSize: "200% 100%", animation: "sh 1.4s infinite" }} />
        </div>
        {[90, 100, 70].map((w, i) => (
          <div key={i} style={{ height: i === 0 ? 16 : 11, width: `${w}%`, marginBottom: 8, borderRadius: 6, backgroundImage: `linear-gradient(90deg,${shimBase} 25%,${shimHigh} 50%,${shimBase} 75%)`, backgroundSize: "200% 100%", animation: "sh 1.4s infinite" }} />
        ))}
      </div>
    </div>
  );

  const images    = post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];
  const bodyClamp = lines === "0" ? "unset" : lines;
  const vPad      = compact ? "10px 14px 0" : "12px 14px 0";
  const titleSz   = compact ? "15px" : "17px";
  const bodySz    = compact ? "12px" : "13px";
  const footerPad = compact ? "6px 12px 10px" : "8px 12px 12px";
  const flairStyle = post.flair ? flairBadgeStyle(post.flair, post.flairBg, post.flairTextColor) : null;
  const isDark = skin !== "light" && skin !== "minimal";
  const rt = readTime(post.body);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{overflow:hidden!important;background:${bg}!important;margin:0!important;padding:0!important;width:100%!important}
        body{font-family:'Cairo',sans-serif;color:${text};-webkit-font-smoothing:antialiased}
        body>*:not(#nf-root){display:none!important}
        #nf-root{display:block!important;padding:2px}
        a{text-decoration:none;color:inherit}

        .nf-card{background:${cardBg};border:1px solid ${border};border-radius:${radius}px;overflow:hidden;transition:border-color .15s,box-shadow .15s;position:relative;border-inline-start:3px solid ${accent}}
        .nf-card:hover{border-color:${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)"};box-shadow:0 8px 28px ${isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.08)"}}

        .nf-header{display:flex;align-items:center;gap:8px;padding:${vPad};flex-wrap:wrap}
        .nf-user{display:flex;align-items:center;gap:8px;min-width:0}
        .nf-avatar{width:${compact ? 28 : 32}px;height:${compact ? 28 : 32}px;border-radius:50%;background:${surface};border:2px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"};overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${accent}}
        .nf-avatar img{width:100%;height:100%;object-fit:cover}
        .nf-comm-img{width:18px;height:18px;border-radius:5px;object-fit:cover;flex-shrink:0}
        .nf-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
        .nf-comm{font-weight:700;font-size:12px;color:${accent};letter-spacing:-.1px}
        .nf-comm:hover{text-decoration:underline}
        .nf-sep{width:3px;height:3px;border-radius:50%;background:${dim};flex-shrink:0}
        .nf-author{font-size:12px;color:${muted};font-weight:600}
        .nf-author:hover{color:${text};text-decoration:underline}
        .nf-time{font-size:11px;color:${dim}}
        .nf-flair{font-size:10px;font-weight:700;border-radius:999px;padding:2px 8px;white-space:nowrap;line-height:1.4}

        .nf-body{padding:${compact ? "6px 14px 0" : "8px 14px 0"}}
        .nf-title{font-size:${titleSz};font-weight:800;color:${text};line-height:1.45;display:block;margin-bottom:5px;letter-spacing:-.25px}
        .nf-title:hover{color:${accent}}
        .nf-text{font-size:${bodySz};color:${muted};line-height:1.75;display:-webkit-box;-webkit-line-clamp:${bodyClamp};-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap}

        .nf-stats{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px 0}
        .nf-stat{font-size:10px;font-weight:700;color:${dim};background:${surface};border:1px solid ${border};border-radius:999px;padding:3px 8px}
        .nf-tags{display:flex;flex-wrap:wrap;gap:5px;padding:6px 14px 0}
        .nf-tag{font-size:10px;font-weight:700;color:${accent};background:${accentSoft};border-radius:999px;padding:2px 8px}

        .nf-img-wrap{margin:10px 14px 0;border-radius:10px;position:relative;overflow:hidden;background:${surface}}
        .nf-img-wrap img{width:100%;height:auto;max-height:${compact ? 260 : 420}px;object-fit:cover;display:block}
        .nf-img-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.6);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}
        .nf-img-btn.prev{right:8px}.nf-img-btn.next{left:8px}

        .nf-link{margin:10px 14px 0;border:1px solid ${border};border-radius:10px;overflow:hidden;background:${surface};display:flex;align-items:stretch}
        .nf-link-body{padding:10px 12px;flex:1;min-width:0}
        .nf-link-domain{font-size:10px;color:${accent};margin-bottom:3px;font-weight:700}
        .nf-link-title{font-size:12px;font-weight:600;color:${text};line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

        .nf-footer{display:flex;align-items:center;gap:6px;padding:${footerPad};flex-wrap:wrap;border-top:1px solid ${border};margin-top:8px}
        .nf-votes{display:inline-flex;align-items:center;gap:2px;background:${surface};border-radius:999px;border:1px solid ${border};padding:2px}
        .nf-vote{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:999px;color:${muted};font-size:11px;font-weight:700;text-decoration:none;transition:background .15s,color .15s}
        .nf-vote:hover{background:${hoverBg}}
        .nf-vote--up:hover{color:${upColor}}
        .nf-vote--down:hover{color:${downColor}}
        .nf-vcount{font-size:12px;font-weight:800;color:${text};padding:0 4px;min-width:22px;text-align:center}
        .nf-action{display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;border:none;background:transparent;color:${muted};font-family:'Cairo',sans-serif;font-size:11px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap}
        .nf-action:hover{background:${hoverBg};color:${text}}

        .nf-brand{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 14px 10px;text-decoration:none;opacity:.75}
        .nf-brand:hover{opacity:1}
        .nf-brand-dot{width:6px;height:6px;border-radius:50%;background:${accent}}
        .nf-brand-text{font-size:10px;font-weight:800;color:${dim};letter-spacing:.4px}
      `}</style>

      <div id="nf-root">
        <div className="nf-card">
          <div className="nf-header">
            <div className="nf-user">
              {!hideUser && (
                <div className="nf-avatar">
                  {post.authorPhoto ? (
                    <img src={post.authorPhoto} alt="" />
                  ) : (
                    (post.authorName?.[0] || "U").toUpperCase()
                  )}
                </div>
              )}
              <div className="nf-meta">
                {!hideUser && (
                  <a className="nf-author" href={postUrl} target="_blank" rel="noopener noreferrer">
                    u/{post.authorName}
                  </a>
                )}
                {!hideComm && (
                  <>
                    {!hideUser && <span className="nf-sep" />}
                    {commImg ? <img className="nf-comm-img" src={commImg} alt="" /> : null}
                    <a className="nf-comm" href={postUrl} target="_blank" rel="noopener noreferrer">
                      n/{post.community || "عام"}
                    </a>
                  </>
                )}
                {!hideTime && post.createdAt && (
                  <>
                    <span className="nf-sep" />
                    <span className="nf-time">{getTimeAgo(post.createdAt)}</span>
                  </>
                )}
                {post.flair && !hideFlair && (
                  <span
                    className="nf-flair"
                    style={flairStyle ? { background: String(flairStyle.background), color: String(flairStyle.color) } : undefined}
                  >
                    {post.flair}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="nf-body">
            <a className="nf-title" href={postUrl} target="_blank" rel="noopener noreferrer">
              {post.title}
            </a>
            {!hideBody && post.body && <p className="nf-text">{post.body}</p>}
          </div>

          <div className="nf-stats">
            {!hideVotes && <span className="nf-stat">{post.votes ?? 0} دعم</span>}
            <span className="nf-stat">{post.commentCount ?? 0} تعليق</span>
            {rt && <span className="nf-stat">{rt} قراءة</span>}
            {post.linkUrl && <span className="nf-stat">رابط</span>}
            {images.length > 0 && <span className="nf-stat">صورة</span>}
            {post.postType === "poll" && <span className="nf-stat">استطلاع</span>}
          </div>

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="nf-tags">
              {post.hashtags.slice(0, 4).map((tag) => (
                <span key={tag} className="nf-tag">#{tag.replace(/^#/, "")}</span>
              ))}
            </div>
          )}

          {!hideImg && images.length > 0 && (
            <div className="nf-img-wrap">
              <img src={images[imgIdx]} alt="" />
              {images.length > 1 && (
                <>
                  <button type="button" className="nf-img-btn prev" onClick={() => setImgIdx((i) => Math.min(i + 1, images.length - 1))}>‹</button>
                  <button type="button" className="nf-img-btn next" onClick={() => setImgIdx((i) => Math.max(i - 1, 0))}>›</button>
                </>
              )}
            </div>
          )}

          {post.linkUrl && (
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="nf-link">
              <div className="nf-link-body">
                <div className="nf-link-domain">{extractDomain(post.linkUrl)}</div>
                <div className="nf-link-title">{post.linkUrl}</div>
              </div>
            </a>
          )}

          {!hideFooter && (
            <div className="nf-footer">
              {!hideVotes && (
                <div className="nf-votes">
                  <a className="nf-vote nf-vote--up" href={postUrl} target="_blank" rel="noopener noreferrer" aria-label="أعجبني">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                  </a>
                  <span className="nf-vcount">{post.votes ?? 0}</span>
                  <a className="nf-vote nf-vote--down" href={postUrl} target="_blank" rel="noopener noreferrer" aria-label="لم يعجبني">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                  </a>
                </div>
              )}
              <a className="nf-action" href={postUrl} target="_blank" rel="noopener noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>{post.commentCount ?? 0}</span>
              </a>
              <a className="nf-action" href={postUrl} target="_blank" rel="noopener noreferrer">
                <span>فتح في NorthFall</span>
              </a>
            </div>
          )}
        </div>

        {!hideBrand && (
          <a className="nf-brand" href={siteUrl} target="_blank" rel="noopener noreferrer">
            <span className="nf-brand-dot" />
            <span className="nf-brand-text">NorthFall</span>
          </a>
        )}
      </div>
    </>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0b0b0c", minHeight: "100vh" }} />}>
      <EmbedContent />
    </Suspense>
  );
}
