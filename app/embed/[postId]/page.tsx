"use client";

import { useEffect, useState, Suspense } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useSearchParams } from "next/navigation";

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
}

function getTimeAgo(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `منذ ${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} ساعة`;
  if (s < 604800) return `منذ ${Math.floor(s / 86400)} يوم`;
  return `منذ ${Math.floor(s / 604800)} أسبوع`;
}

function extractDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

function EmbedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.postId as string;

  const isDark     = searchParams.get("theme") === "dark";
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
  const radius     = searchParams.get("radius") || "8";
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

  // ── NorthFall palette ────────────────────────────────────────────────────
  // Dark mode  → site's actual dark theme colors
  // Light mode → clean white card
  const bg          = isDark ? "#1a1a1d" : "#ffffff";
  const cardBg      = isDark ? "#222225" : "#ffffff";
  const border      = isDark ? "#3a3a3d" : "#e2e5e9";
  const border2     = isDark ? "#323235" : "#e8eaed";
  const text        = isDark ? "#ffffff"  : "#0a0a0a";
  const text2       = isDark ? "#e8e8e8"  : "#1c1c1c";
  const muted       = isDark ? "#a8aaac"  : "#2d3748";
  const dim         = isDark ? "#9a9d9f"  : "#4a5568";
  const surface     = isDark ? "#2a2a2d"  : "#f0f2f5";
  const accent      = isDark ? "#c0c0c0"  : "#111111";
  const voteBg      = isDark ? "#2a2a2d"  : "#f0f2f5";
  const hoverBg     = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const shimBase    = isDark ? "#222225"  : "#efefef";
  const shimHigh    = isDark ? "#2a2a2d"  : "#f8f8f8";
  const brandBg     = isDark ? "#1a1a1d"  : "#fafafa";
  const brandBorder = isDark ? "#2a2a2d"  : "#f0f0f0";
  const linkBg      = isDark ? "#2a2a2d"  : "#f7f8fa";

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      padding: "32px 20px", textAlign: "center", fontFamily: "'Cairo',sans-serif",
      background: bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%", background: surface,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dim} strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p style={{ fontSize: 13, color: muted, margin: 0 }}>{error}</p>
    </div>
  );

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (!post) return (
    <div style={{ padding: "14px 16px", fontFamily: "'Cairo',sans-serif", background: bg }}>
      <style>{`@keyframes sh{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundImage: `linear-gradient(90deg,${shimBase} 25%,${shimHigh} 50%,${shimBase} 75%)`, backgroundSize: "200% 100%", animation: "sh 1.4s infinite" }} />
        <div style={{ height: 11, width: 90, borderRadius: 5, backgroundImage: `linear-gradient(90deg,${shimBase} 25%,${shimHigh} 50%,${shimBase} 75%)`, backgroundSize: "200% 100%", animation: "sh 1.4s infinite" }} />
      </div>
      {[85, 100, 65].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? 15 : 11, width: `${w}%`, marginBottom: 9, borderRadius: 5, backgroundImage: `linear-gradient(90deg,${shimBase} 25%,${shimHigh} 50%,${shimBase} 75%)`, backgroundSize: "200% 100%", animation: "sh 1.4s infinite" }} />
      ))}
    </div>
  );

  const images    = post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];
  const bodyClamp = lines === "0" ? "unset" : lines;
  const vPad      = compact ? "10px 14px 0" : "13px 14px 0";
  const titleSz   = compact ? "14px" : "16px";
  const bodySz    = compact ? "12px" : "13px";
  const footerPad = compact ? "5px 10px 8px" : "7px 10px 10px";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{overflow:hidden!important;background:${bg}!important;margin:0!important;padding:0!important;width:100%!important}
        body{font-family:'Cairo',sans-serif;color:${text};-webkit-font-smoothing:antialiased}
        body>*:not(#nf-root){display:none!important}
        #nf-root{display:block!important}
        a{text-decoration:none;color:inherit}

        .nf-card{background:${cardBg};border:1px solid ${border2};border-radius:${radius}px;overflow:hidden;transition:border-color .15s}
        .nf-card:hover{border-color:${border}}

        .nf-header{display:flex;align-items:center;gap:7px;padding:${vPad};flex-wrap:wrap}
        .nf-avatar{width:${compact ? 22 : 26}px;height:${compact ? 22 : 26}px;border-radius:50%;background:${surface};border:1px solid ${border2};overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:${accent}}
        .nf-avatar img{width:100%;height:100%;object-fit:cover}
        .nf-comm{font-weight:700;font-size:12px;color:${text};letter-spacing:-.1px}
        .nf-comm:hover{color:${accent};text-decoration:underline}
        .nf-sep{width:3px;height:3px;border-radius:50%;background:${dim};flex-shrink:0}
        .nf-author{font-size:11px;color:${muted};font-weight:500}
        .nf-author:hover{color:${text};text-decoration:underline}
        .nf-time{font-size:11px;color:${dim}}
        .nf-flair{font-size:10px;font-weight:600;color:${accent};background:${surface};border:1px solid ${border2};border-radius:4px;padding:1px 7px;white-space:nowrap}

        .nf-body{padding:${compact ? "5px 14px 0" : "7px 14px 0"}}
        .nf-title{font-size:${titleSz};font-weight:700;color:${text};line-height:1.5;display:block;margin-bottom:4px;letter-spacing:-.2px}
        .nf-title:hover{opacity:.8}
        .nf-text{font-size:${bodySz};color:${text2};line-height:1.75;display:-webkit-box;-webkit-line-clamp:${bodyClamp};-webkit-box-orient:vertical;overflow:hidden}

        .nf-img-wrap{margin:10px 0 0;position:relative;overflow:hidden;background:${surface}}
        .nf-img-wrap img{width:100%;height:auto;max-height:${compact ? 280 : 460}px;object-fit:cover;display:block}
        .nf-img-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.55);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:background .15s}
        .nf-img-btn:hover{background:rgba(0,0,0,.75)}
        .nf-img-btn.prev{right:8px}.nf-img-btn.next{left:8px}
        .nf-img-dots{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);display:flex;gap:4px}
        .nf-img-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.35)}
        .nf-img-dot.on{background:#fff}

        .nf-link{margin:10px 14px 0;border:1px solid ${border2};border-radius:8px;overflow:hidden;background:${linkBg};display:flex;align-items:stretch;transition:border-color .15s}
        .nf-link:hover{border-color:${border}}
        .nf-link-body{padding:9px 12px;flex:1;min-width:0}
        .nf-link-domain{font-size:10px;color:${dim};margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px}
        .nf-link-title{font-size:12px;font-weight:600;color:${text2};line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .nf-link-icon{width:42px;background:${surface};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${dim}}

        .nf-footer{display:flex;align-items:center;gap:2px;padding:${footerPad};flex-wrap:wrap}
        .nf-votes{display:flex;align-items:center;background:${voteBg};border-radius:8px;overflow:hidden}
        .nf-vbtn{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;background:transparent;cursor:pointer;color:${muted};transition:color .15s,background .15s;text-decoration:none}
        .nf-vbtn:hover{color:${text};background:${hoverBg}}
        .nf-vcount{font-size:12px;font-weight:700;color:${text};padding:0 4px;min-width:24px;text-align:center;font-family:'Cairo',sans-serif}
        .nf-action{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:7px;border:none;background:transparent;color:${muted};font-family:'Cairo',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:background .15s,color .15s;text-decoration:none;white-space:nowrap}
        .nf-action:hover{background:${hoverBg};color:${text}}

        .nf-brand{display:flex;align-items:center;justify-content:center;gap:5px;padding:6px 14px;background:${brandBg};border-top:1px solid ${brandBorder};text-decoration:none;transition:opacity .15s}
        .nf-brand:hover{opacity:.7}
        .nf-brand-text{font-size:10px;font-weight:700;color:${dim};letter-spacing:.3px}
      `}</style>

      <div id="nf-root">
        <div className="nf-card">

          {/* Header */}
          <div className="nf-header">
            <div className="nf-avatar">
              {commImg ? <img src={commImg} alt="" /> : (post.community?.[0] || "N").toUpperCase()}
            </div>
            {!hideComm && (
              <a className="nf-comm" href={postUrl} target="_blank" rel="noopener noreferrer">
                n/{post.community || "عام"}
              </a>
            )}
            {!hideUser && (
              <>
                <span className="nf-sep" />
                <a className="nf-author" href={postUrl} target="_blank" rel="noopener noreferrer">
                  u/{post.authorName}
                </a>
              </>
            )}
            {!hideTime && post.createdAt && (
              <>
                <span className="nf-sep" />
                <span className="nf-time">{getTimeAgo(post.createdAt)}</span>
              </>
            )}
            {post.flair && !hideFlair && <span className="nf-flair">{post.flair}</span>}
          </div>

          {/* Title + Body */}
          <div className="nf-body">
            <a className="nf-title" href={postUrl} target="_blank" rel="noopener noreferrer">
              {post.title}
            </a>
            {!hideBody && post.body && <p className="nf-text">{post.body}</p>}
          </div>

          {/* Images */}
          {!hideImg && images.length > 0 && (
            <div className="nf-img-wrap">
              <img src={images[imgIdx]} alt="" />
              {images.length > 1 && (
                <>
                  <button className="nf-img-btn prev" onClick={() => setImgIdx(i => Math.min(i + 1, images.length - 1))}>‹</button>
                  <button className="nf-img-btn next" onClick={() => setImgIdx(i => Math.max(i - 1, 0))}>›</button>
                  <div className="nf-img-dots">
                    {images.map((_, i) => <div key={i} className={`nf-img-dot${i === imgIdx ? " on" : ""}`} />)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Link */}
          {post.linkUrl && (
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="nf-link">
              <div className="nf-link-body">
                <div className="nf-link-domain">{extractDomain(post.linkUrl)}</div>
                <div className="nf-link-title">{post.linkUrl}</div>
              </div>
              <div className="nf-link-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
            </a>
          )}

          {/* Footer */}
          {!hideFooter && (
            <div className="nf-footer">
              {!hideVotes && (
                <div className="nf-votes">
                  <a className="nf-vbtn" href={postUrl} target="_blank" rel="noopener noreferrer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 5-7 7h4v7h6v-7h4z"/></svg>
                  </a>
                  <span className="nf-vcount">{post.votes ?? 0}</span>
                  <a className="nf-vbtn" href={postUrl} target="_blank" rel="noopener noreferrer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 19 7-7h-4V5H9v7H5z"/></svg>
                  </a>
                </div>
              )}
              <a className="nf-action" href={postUrl} target="_blank" rel="noopener noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>{post.commentCount ?? 0} تعليق</span>
              </a>
              <a className="nf-action" href={postUrl} target="_blank" rel="noopener noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                <span>مشاركة</span>
              </a>
            </div>
          )}
        </div>

        {/* Brand */}
        {!hideBrand && (
          <a className="nf-brand" href={siteUrl} target="_blank" rel="noopener noreferrer">
            <span className="nf-brand-text">NorthFall</span>
          </a>
        )}
      </div>
    </>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div style={{ background: "#1a1a1d", minHeight: "100vh" }} />}>
      <EmbedContent />
    </Suspense>
  );
}
