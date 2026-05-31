"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PostPreview {
  title: string;
  authorName: string;
  community: string;
  votes: number;
  commentCount?: number;
  createdAt?: string;
  body?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

function extractPostId(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  if (!t.includes("/") && !t.includes(" ") && t.length > 4) return t;
  const patterns = [
    /\/post\/([a-zA-Z0-9_-]+)/,
    /\/embed\/([a-zA-Z0-9_-]+)/,
    /postId=([a-zA-Z0-9_-]+)/,
    /threadId=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1];
  }
  return null;
}

// Classic checkbox toggle
function ClassicCheck({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      padding: "6px 0", cursor: "pointer", userSelect: "none",
    }}>
      <input
        type="checkbox"
        checked={on}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 3, width: 13, height: 13, cursor: "pointer", accentColor: "#336699", flexShrink: 0 }}
      />
      <span>
        <span style={{ fontSize: 13, color: "#333", fontWeight: 600, display: "block" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#888" }}>{desc}</span>
      </span>
    </label>
  );
}

// Classic radio-style pill
function RadioBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", marginLeft: 12 }}>
      <input
        type="radio"
        checked={active}
        onChange={onClick}
        style={{ cursor: "pointer", accentColor: "#336699" }}
      />
      <span style={{ fontSize: 12, color: active ? "#336699" : "#555" }}>{label}</span>
    </label>
  );
}

function EmbedGeneratorContent() {
  const searchParams = useSearchParams();

  const [input, setInput]     = useState("");
  const [postId, setPostId]   = useState<string | null>(null);
  const [preview, setPreview] = useState<PostPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);
  const [iframeH, setIframeH] = useState(300);
  const [showCustom, setShowCustom] = useState(false);
  const [origin, setOrigin]   = useState("");
  const [codeTab, setCodeTab] = useState<"blockquote" | "iframe">("blockquote");

  const [embedDark,     setEmbedDark]     = useState(false);
  const [hideBody,      setHideBody]      = useState(false);
  const [hideUsername,  setHideUsername]  = useState(false);
  const [hideImage,     setHideImage]     = useState(false);
  const [hideFooter,    setHideFooter]    = useState(false);
  const [hideBrand,     setHideBrand]     = useState(false);
  const [hideFlair,     setHideFlair]     = useState(false);
  const [hideVotes,     setHideVotes]     = useState(false);
  const [embedWidth,    setEmbedWidth]    = useState("600");
  const [hideTime,      setHideTime]      = useState(false);
  const [hideCommunity, setHideCommunity] = useState(false);
  const [compactMode,   setCompactMode]   = useState(false);
  const [borderRadius,  setBorderRadius]  = useState("8");
  const [maxLines,      setMaxLines]      = useState("4");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    const id = searchParams.get("postId") || searchParams.get("id");
    if (id) {
      setInput(`${window.location.origin}/post/${id}`);
      loadPost(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fn = (e: MessageEvent) => {
      if (e.data?.type === "nf-embed-resize" && e.data.postId === postId)
        setIframeH(e.data.height + 2);
    };
    window.addEventListener("message", fn);
    return () => window.removeEventListener("message", fn);
  }, [postId]);

  useEffect(() => { setIframeH(300); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [embedDark, hideBody, hideUsername, hideImage, hideFooter, hideBrand, hideFlair, hideVotes, hideTime, hideCommunity, compactMode, maxLines, borderRadius]);

  const qs = (() => {
    const p = new URLSearchParams();
    if (embedDark)            p.set("theme", "dark");
    if (hideBody)             p.set("hideBody", "1");
    if (hideUsername)         p.set("hideUser", "1");
    if (hideImage)            p.set("hideImg", "1");
    if (hideFooter)           p.set("hideFooter", "1");
    if (hideBrand)            p.set("hideBrand", "1");
    if (hideFlair)            p.set("hideFlair", "1");
    if (hideVotes)            p.set("hideVotes", "1");
    if (hideTime)             p.set("hideTime", "1");
    if (hideCommunity)        p.set("hideComm", "1");
    if (compactMode)          p.set("compact", "1");
    if (borderRadius !== "8") p.set("radius", borderRadius);
    if (maxLines !== "4")     p.set("lines", maxLines);
    return p.toString();
  })();

  async function loadPost(id: string) {
    setLoading(true); setError(""); setPreview(null); setPostId(null);
    try {
      let snap = await getDoc(doc(db, "posts", id));
      if (!snap.exists()) snap = await getDoc(doc(db, "threads", id));
      if (!snap.exists()) { setError("المنشور غير موجود"); setLoading(false); return; }
      setPreview(snap.data() as PostPreview);
      setPostId(id); setIframeH(300);
    } catch { setError("خطأ في تحميل المنشور"); }
    setLoading(false);
  }

  function handleGenerate() {
    const id = extractPostId(input);
    if (!id) { setError("أدخل رابط منشور أو ID صحيح"); return; }
    loadPost(id);
  }

  const SITE_URL   = "https://www.northfall.blog";
  const embedSrc   = postId ? `${SITE_URL}/embed/${postId}${qs ? "?" + qs : ""}` : "";
  const previewSrc = postId && origin ? `${origin}/embed/${postId}${qs ? "?" + qs : ""}` : "";

  const blockquoteAttrs = [
    postId ? `data-post-id="${postId}"` : "",
    embedDark      ? `data-theme="dark"` : "",
    hideBody       ? `data-hide-body="1"` : "",
    hideUsername   ? `data-hide-user="1"` : "",
    hideImage      ? `data-hide-img="1"` : "",
    hideFooter     ? `data-hide-footer="1"` : "",
    hideBrand      ? `data-hide-brand="1"` : "",
    hideFlair      ? `data-hide-flair="1"` : "",
    hideVotes      ? `data-hide-votes="1"` : "",
    hideTime       ? `data-hide-time="1"` : "",
    hideCommunity  ? `data-hide-comm="1"` : "",
    compactMode    ? `data-compact="1"` : "",
    borderRadius !== "8" ? `data-radius="${borderRadius}"` : "",
    maxLines !== "4"     ? `data-lines="${maxLines}"` : "",
  ].filter(Boolean).join("\n  ");

  const blockquoteCode = postId
    ? `<blockquote class="northfall-embed"\n  ${blockquoteAttrs}></blockquote>\n<script src="${SITE_URL}/js/embed.js" async charset="UTF-8"><\/script>`
    : "";

  const iframeCode = postId
    ? `<iframe\n  src="${embedSrc}"\n  width="${embedWidth}"\n  height="${iframeH}"\n  style="border:none;border-radius:8px;max-width:100%;display:block;"\n></iframe>`
    : "";

  const activeCode = codeTab === "blockquote" ? blockquoteCode : iframeCode;

  function copy() {
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Shared box style ─────────────────────────────────────────────────────
  const box: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #c8c8c8",
    borderRadius: 4,
    marginBottom: 14,
  };
  const boxHead: React.CSSProperties = {
    background: "linear-gradient(to bottom, #f0f0f0, #e4e4e4)",
    borderBottom: "1px solid #c8c8c8",
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#333",
    letterSpacing: ".2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const boxBody: React.CSSProperties = {
    padding: "12px 14px",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#dce3ea",
      fontFamily: "Tahoma, Arial, 'Noto Kufi Arabic', sans-serif",
      direction: "rtl",
      fontSize: 13,
    }}>
      <style>{`
        @keyframes nf-spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        * { box-sizing: border-box; }
        input[type=text], textarea { font-family: inherit; }
        a { color: #336699; }
        a:hover { text-decoration: underline; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #e0e0e0; }
        ::-webkit-scrollbar-thumb { background: #aaa; border-radius: 2px; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        background: "linear-gradient(to bottom, #4a6fa5, #2d4f7c)",
        borderBottom: "2px solid #1a3a5c",
        padding: "0 16px",
        height: 44,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: "-.2px" }}>
          NorthFall
        </span>

      </div>

      {/* ── Page title bar ── */}
      <div style={{
        background: "linear-gradient(to bottom, #f8f8f8, #ececec)",
        borderBottom: "1px solid #c0c0c0",
        padding: "10px 20px",
      }}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#222" }}>
          إنشاء NorthFall Embed
        </h1>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#666" }}>
          الصق رابط المنشور أو الـ ID لتوليد كود التضمين لموقعك
        </p>
      </div>

      <div style={{ maxWidth: 700, margin: "18px auto", padding: "0 16px 60px" }}>

        {/* ── Step 1: Input ── */}
        <div style={box}>
          <div style={boxHead}>
            <span>الخطوة 1 — أدخل رابط المنشور</span>
          </div>
          <div style={boxBody}>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                placeholder="northfall.blog/post/abc123 أو ID المنشور"
                style={{
                  flex: 1,
                  border: "1px solid #aaa",
                  borderRadius: 3,
                  padding: "6px 10px",
                  fontSize: 13,
                  color: "#222",
                  background: "#fff",
                  outline: "none",
                  direction: "rtl",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,.1)",
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                style={{
                  padding: "6px 18px",
                  border: "1px solid #336699",
                  borderRadius: 3,
                  background: loading || !input.trim()
                    ? "#e0e0e0"
                    : "linear-gradient(to bottom, #4a7fc1, #2d5f9a)",
                  color: loading || !input.trim() ? "#999" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                  boxShadow: loading || !input.trim() ? "none" : "0 1px 2px rgba(0,0,0,.2)",
                }}
              >
                {loading && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: "nf-spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                )}
                {loading ? "جاري..." : "توليد الكود"}
              </button>
            </div>
            {error && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#cc0000" }}>
                ⚠ {error}
              </p>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {postId && preview && (
          <>
            {/* Post info */}
            <div style={{ ...box }}>
              <div style={boxHead}>
                <span>المنشور المحدد</span>
                <a href={`${SITE_URL}/post/${postId}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#336699" }}>
                  فتح المنشور ↗
                </a>
              </div>
              <div style={{ ...boxBody, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#e8edf2", border: "1px solid #c0c8d0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#336699", flexShrink: 0,
                }}>
                  {preview.community?.[0]?.toUpperCase() || "N"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>n/{preview.community}</div>
                  <div style={{ fontSize: 11, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    u/{preview.authorName} · {preview.title}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 2: Customization (collapsible) ── */}
            <div style={box}>
              <button
                onClick={() => setShowCustom(!showCustom)}
                style={{
                  ...boxHead,
                  width: "100%",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "right",
                  borderBottom: showCustom ? "1px solid #c8c8c8" : "none",
                } as React.CSSProperties}
              >
                <span>الخطوة 2 — تخصيص الـ Embed (اختياري)</span>
                <span style={{ fontSize: 11, color: "#666", fontWeight: 400 }}>
                  {showCustom ? "▲ إخفاء" : "▼ إظهار"}
                </span>
              </button>

              {showCustom && (
                <div style={boxBody}>
                  {/* Two columns of checkboxes */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 20px", marginBottom: 14 }}>
                    <ClassicCheck on={embedDark}     onChange={setEmbedDark}     label="الوضع الداكن"          desc="خلفية داكنة للـ embed" />
                    <ClassicCheck on={compactMode}   onChange={setCompactMode}   label="وضع مضغوط"             desc="حجم أصغر وأقل padding" />
                    <ClassicCheck on={hideBody}      onChange={setHideBody}      label="إخفاء نص المنشور"      desc="عرض العنوان فقط" />
                    <ClassicCheck on={hideImage}     onChange={setHideImage}     label="إخفاء الصورة"          desc="لا تعرض صورة المنشور" />
                    <ClassicCheck on={hideUsername}  onChange={setHideUsername}  label="إخفاء اسم المستخدم"    desc="لا تعرض اسم الكاتب" />
                    <ClassicCheck on={hideCommunity} onChange={setHideCommunity} label="إخفاء اسم المجتمع"     desc="لا تعرض n/community" />
                    <ClassicCheck on={hideTime}      onChange={setHideTime}      label="إخفاء الوقت"           desc="لا تعرض وقت النشر" />
                    <ClassicCheck on={hideFlair}     onChange={setHideFlair}     label="إخفاء الـ Flair"       desc="لا تعرض تصنيف المنشور" />
                    <ClassicCheck on={hideVotes}     onChange={setHideVotes}     label="إخفاء التصويت"         desc="إخفاء عداد الأصوات" />
                    <ClassicCheck on={hideFooter}    onChange={setHideFooter}    label="إخفاء أزرار التفاعل"   desc="إخفاء تعليق ومشاركة" />
                    <ClassicCheck on={hideBrand}     onChange={setHideBrand}     label="إخفاء شعار NorthFall"  desc="إخفاء الـ brand footer" />
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "10px 0" }} />

                  {/* Radius */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#333", marginLeft: 8 }}>حواف الـ embed:</span>
                    {[{ v: "0", l: "بدون" }, { v: "4", l: "خفيف" }, { v: "8", l: "عادي" }, { v: "12", l: "مدوّر" }, { v: "20", l: "كامل" }].map(o => (
                      <RadioBtn key={o.v} label={o.l} active={borderRadius === o.v} onClick={() => setBorderRadius(o.v)} />
                    ))}
                  </div>

                  {/* Lines */}
                  {!hideBody && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#333", marginLeft: 8 }}>أسطر النص:</span>
                      {[{ v: "2", l: "٢" }, { v: "3", l: "٣" }, { v: "4", l: "٤" }, { v: "6", l: "٦" }, { v: "0", l: "كامل" }].map(o => (
                        <RadioBtn key={o.v} label={o.l} active={maxLines === o.v} onClick={() => setMaxLines(o.v)} />
                      ))}
                    </div>
                  )}

                  {/* Width */}
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#333", marginLeft: 8 }}>عرض الـ iframe:</span>
                    {["400", "500", "600", "700", "100%"].map(w => (
                      <RadioBtn key={w} label={w === "100%" ? "كامل" : `${w}px`} active={embedWidth === w} onClick={() => setEmbedWidth(w)} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Step 3: Preview ── */}
            <div style={box}>
              <div style={boxHead}>
                <span>الخطوة 3 — معاينة الـ Embed</span>
              </div>
              <div style={{ padding: "12px", background: "#f4f4f4", borderBottom: "1px solid #ddd" }}>
                {previewSrc && (
                  <iframe
                    key={previewSrc}
                    src={previewSrc}
                    width="100%"
                    height={iframeH}
                    style={{ display: "block", border: "1px solid #ccc", borderRadius: 4, background: "#fff" }}
                    title="NorthFall Embed Preview"
                  />
                )}
              </div>
            </div>

            {/* ── Step 4: Code ── */}
            <div style={box}>
              <div style={boxHead}>
                <span>الخطوة 4 — انسخ الكود</span>
              </div>
              <div style={boxBody}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 0, marginBottom: 8, borderBottom: "1px solid #ccc" }}>
                  {(["blockquote", "iframe"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setCodeTab(t)}
                      style={{
                        padding: "5px 14px",
                        border: "1px solid #ccc",
                        borderBottom: codeTab === t ? "1px solid #fff" : "1px solid #ccc",
                        marginBottom: codeTab === t ? -1 : 0,
                        background: codeTab === t ? "#fff" : "#ececec",
                        color: codeTab === t ? "#222" : "#666",
                        fontSize: 12,
                        fontWeight: codeTab === t ? 700 : 400,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        borderRadius: "3px 3px 0 0",
                        marginLeft: 3,
                      }}
                    >
                      {t === "blockquote" ? "blockquote + script" : "iframe مباشر"}
                    </button>
                  ))}
                </div>

                {/* Code textarea */}
                <textarea
                  readOnly
                  value={activeCode}
                  rows={6}
                  onClick={e => (e.target as HTMLTextAreaElement).select()}
                  style={{
                    width: "100%",
                    border: "1px solid #aaa",
                    borderRadius: 3,
                    padding: "8px 10px",
                    fontSize: 11,
                    fontFamily: "'Courier New', Courier, monospace",
                    direction: "ltr",
                    textAlign: "left",
                    background: "#f8f8f8",
                    color: "#222",
                    resize: "vertical",
                    lineHeight: 1.6,
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,.08)",
                    outline: "none",
                    display: "block",
                    marginBottom: 8,
                  }}
                />

                <button
                  onClick={copy}
                  style={{
                    padding: "6px 20px",
                    border: "1px solid #336699",
                    borderRadius: 3,
                    background: copied
                      ? "linear-gradient(to bottom, #4caf50, #388e3c)"
                      : "linear-gradient(to bottom, #4a7fc1, #2d5f9a)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 1px 2px rgba(0,0,0,.2)",
                  }}
                >
                  {copied ? "✓ تم النسخ!" : "نسخ الكود"}
                </button>
                <span style={{ fontSize: 11, color: "#888", marginRight: 10 }}>
                  أو اضغط على الكود لتحديده كله
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!postId && !loading && !error && (
          <div style={{
            ...box,
            padding: "30px 20px",
            textAlign: "center",
            color: "#888",
            borderStyle: "dashed",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#555" }}>أدخل رابط منشور من NorthFall في الحقل أعلاه</p>
            <p style={{ margin: 0, fontSize: 11, color: "#999" }}>مثال: northfall.blog/post/abc123</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmbedGeneratorPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#dce3ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#555", fontSize: 13, fontFamily: "Tahoma, Arial, sans-serif" }}>جاري التحميل...</span>
      </div>
    }>
      <EmbedGeneratorContent />
    </Suspense>
  );
}
