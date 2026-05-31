"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/components/AuthProvider";
import AuthProvider from "@/app/components/AuthProvider";
import { I18nProvider } from "@/app/components/I18nProvider";
import ToastProvider from "@/app/components/ToastProvider";
import { COMMUNITY_CATEGORIES, categoryToStoreValue, parseStoredCategory } from "@/lib/community-categories";

const bg       = "#dce3ea";
const white    = "#ffffff";
const border   = "#c8c8c8";
const border2  = "#aaa";
const headBg   = "linear-gradient(to bottom, #f0f0f0, #e4e4e4)";
const blue     = "#336699";
const blueBg   = "linear-gradient(to bottom, #4a7fc1, #2d5f9a)";
const red      = "#cc0000";
const dimText  = "#666";
const darkText = "#222";
const mutedText = "#888";
const labelText = "#333";

const box: React.CSSProperties = { background: white, border: `1px solid ${border}`, borderRadius: 4, marginBottom: 14 };
const boxHead: React.CSSProperties = { background: headBg, borderBottom: `1px solid ${border}`, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: labelText, letterSpacing: ".2px", display: "flex", alignItems: "center", justifyContent: "space-between" };
const boxBody: React.CSSProperties = { padding: "12px 14px" };
const inp: React.CSSProperties = { width: "100%", border: `1px solid ${border2}`, borderRadius: 3, padding: "6px 10px", fontSize: 12, color: darkText, background: white, outline: "none", fontFamily: "inherit", boxShadow: "inset 0 1px 3px rgba(0,0,0,.08)" };

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: darkText, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: dimText, marginBottom: 6, lineHeight: 1.5 }}>{hint}</div>
      {children}
    </div>
  );
}

const TAG_COLORS = [
  { bg: "#c8d8f0", text: "#1a3a6b" },
  { bg: "#f8c8c8", text: "#7a1a1a" },
  { bg: "#d8c8f0", text: "#3a1a7a" },
  { bg: "#fce8b8", text: "#7a4a00" },
  { bg: "#c8f0d8", text: "#1a6b3a" },
  { bg: "#f0e8c8", text: "#6b5a1a" },
  { bg: "#f0c8e8", text: "#6b1a4a" },
];

interface Tag  { text: string; color: number; }
interface Rule { title: string; body: string; }

function RichPreview({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const boldRe = new RegExp("\\*\\*(.+?)\\*\\*", "g");
  const linkRe = new RegExp("\\[(.+?)\\]\\((https?:\\/\\/[^\\s)]+)\\)", "g");
  const combined = new RegExp("\\*\\*(.+?)\\*\\*|\\[(.+?)\\]\\((https?:\\/\\/[^\\s)]+)\\)", "g");
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = combined.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    if (m[1] !== undefined) parts.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2] && m[3]) parts.push(<a key={k++} href={m[3]} target="_blank" rel="noopener noreferrer" style={{ color: blue, textDecoration: "underline" }}>{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

function RuleEditor({ onChange }: { onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const savedRange = useRef<Range | null>(null);
  const tooLong = false;
  const tooShort = false;

  const syncOut = () => {
    const el = ref.current; if (!el) return;
    let result = "";
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) { result += node.textContent; return; }
      const e = node as HTMLElement; const t = e.tagName?.toLowerCase();
      if (t === "b" || t === "strong") { result += "**"; e.childNodes.forEach(walk); result += "**"; }
      else if (t === "a") { result += "[" + e.textContent + "](" + (e.getAttribute("href") || "") + ")"; }
      else if (t === "br") { result += "\n"; }
      else if (t === "ul" || t === "ol") {
        if (result && !result.endsWith("\n")) result += "\n";
        e.childNodes.forEach(walk);
      }
      else if (t === "li") {
        const isOl = e.parentElement?.tagName.toLowerCase() === "ol";
        if (isOl) {
          const idx = Array.from(e.parentElement?.children || []).indexOf(e) + 1;
          result += `${idx}. `;
        } else {
          result += "• ";
        }
        e.childNodes.forEach(walk);
        result += "\n";
      }
      else if (t === "div" || t === "p") { if (result && !result.endsWith("\n")) result += "\n"; e.childNodes.forEach(walk); }
      else { e.childNodes.forEach(walk); }
    };
    el.childNodes.forEach(walk);
    const text = result.trim();
    onChange(text);
    const charsPerLine = 80;
    const textLines = text.split("\n");
    let totalLines = 0;
    textLines.forEach(line => {
      if (line.length === 0) totalLines += 1;
      else totalLines += Math.ceil(line.length / charsPerLine);
    });
    setLines(totalLines);
  };

  const doBold = () => { ref.current?.focus(); document.execCommand("bold"); syncOut(); };
  
  const doBullets = () => { ref.current?.focus(); document.execCommand("insertUnorderedList"); syncOut(); };

  const doNumbers = () => { ref.current?.focus(); document.execCommand("insertOrderedList"); syncOut(); };

  const openLink = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      alert("حدد كلمة او نصا اولا ثم اضغط رابط");
      return;
    }
    savedRange.current = sel.getRangeAt(0).cloneRange();
    setLinkUrl("https://");
    setShowLinkInput(true);
  };

  const insertLink = () => {
    if (!linkUrl.trim() || !savedRange.current) { setShowLinkInput(false); return; }
    ref.current?.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange.current);
    const linkText = savedRange.current.toString();
    document.execCommand("insertHTML", false,
      "<a href=\"" + linkUrl + "\" target=\"_blank\" style=\"color:" + blue + ";text-decoration:underline\">" + linkText + "</a>"
    );
    setShowLinkInput(false);
    syncOut();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
        <button type="button" onMouseDown={e => { e.preventDefault(); doBold(); }}
          style={{ padding: "2px 10px", border: "1px solid " + border, borderRadius: 3, background: white, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "serif", color: darkText }}
          title="عريض (Bold)">B</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); doBullets(); }}
          style={{ padding: "2px 8px", border: "1px solid " + border, borderRadius: 3, background: white, fontSize: 13, cursor: "pointer", color: darkText }}
          title="قائمة نقطية (•)">•</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); doNumbers(); }}
          style={{ padding: "2px 8px", border: "1px solid " + border, borderRadius: 3, background: white, fontSize: 11, cursor: "pointer", fontWeight: 600, color: darkText }}
          title="قائمة رقمية (123)">123</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); openLink(); }}
          style={{ padding: "2px 10px", border: "1px solid " + border, borderRadius: 3, background: white, fontSize: 11, cursor: "pointer", fontFamily: "inherit", color: blue, fontWeight: 600 }}>رابط</button>
        <span style={{ fontSize: 10, color: mutedText, marginRight: "auto" }}>
          {lines} سطر
        </span>
      </div>
      {showLinkInput && (
        <div style={{ display: "flex", gap: 6, marginBottom: 6, padding: "6px 8px", background: "#eef4fb", border: "1px solid #c0d4e8", borderRadius: 3, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: darkText, whiteSpace: "nowrap", fontWeight: 600 }}>URL:</span>
          <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && insertLink()}
            autoFocus placeholder="https://..."
            style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: 11 }} />
          <button type="button" onClick={insertLink}
            style={{ padding: "4px 12px", border: "none", borderRadius: 3, background: blueBg, color: white, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>ادراج</button>
          <button type="button" onClick={() => setShowLinkInput(false)}
            style={{ padding: "4px 8px", border: "1px solid " + border, borderRadius: 3, background: white, color: mutedText, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>x</button>
        </div>
      )}
      <div ref={ref} contentEditable suppressContentEditableWarning
        data-placeholder="اكتب شرح القانون..."
        onInput={syncOut}
        onKeyDown={e => {
          if (e.key === "Enter") {
            const inList = document.queryCommandState("insertUnorderedList") || document.queryCommandState("insertOrderedList");
            if (!inList) {
              e.preventDefault();
              document.execCommand("insertLineBreak");
              syncOut();
            }
          }
        }}
        style={{
          minHeight: 120, maxHeight: 320, overflowY: "auto",
          border: "1px solid " + (tooLong ? red : border2), borderRadius: 3,
          padding: "7px 10px", fontSize: 12, color: darkText, background: white,
          outline: "none", lineHeight: 1.8, direction: "rtl", textAlign: "right",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,.08)",
        }}
      />
      <div style={{ fontSize: 10, color: dimText, marginTop: 3 }}>
        حدد نصاً ثم اضغط <strong>B</strong> لتغليظه. حدد نصاً واضغط <strong>•</strong> أو <strong>123</strong> لقائمة نقطية/رقمية. حدد كلمة ثم اضغط <strong>رابط</strong> لتحويلها لرابط أزرق.
      </div>
    </div>
  );
}

function sanitize(v: string): string {
  return v.replace(new RegExp("<[^>]*>", "g"), "").replace(new RegExp("\\s+", "g"), " ").trim();
}

function isUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function EditCommunityContent() {
  const params = useParams();
  const communityName = decodeURIComponent(params.name as string);
  const { user } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savedMsg, setSavedMsg]     = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [notFound, setNotFound]     = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const [shortDesc, setShortDesc]   = useState("");
  const [desc, setDesc]             = useState("");
  const [logoUrl, setLogoUrl]       = useState("");
  const [bannerUrl, setBannerUrl]   = useState("");
  const [category, setCategory]     = useState("");
  const [isMature, setIsMature]     = useState(false);

  const [rules, setRules]           = useState<Rule[]>([]);
  const [newTitle, setNewTitle]     = useState("");
  const [newBody, setNewBody]       = useState("");
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  const [tags, setTags]             = useState<Tag[]>([]);
  const [newTagText, setNewTagText] = useState("");
  const [newTagColor, setNewTagColor] = useState(0);

  const [bookmarks, setBookmarks]   = useState<{ label: string; url: string }[]>([]);
  const [bmLabel, setBmLabel]       = useState("");
  const [bmUrl, setBmUrl]           = useState("");

  const [usefulLinks, setUsefulLinks] = useState<{ label: string; url: string }[]>([]);
  const [ulLabel, setUlLabel]       = useState("");
  const [ulUrl, setUlUrl]           = useState("");

  // Draft Cache states
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [flatSidebar, setFlatSidebar] = useState(false);
  const [communityType, setCommunityType] = useState<string>("public");

  const openPreview = () => {
    localStorage.setItem("nf-community-preview", JSON.stringify({
      name: communityName, shortDesc, desc, logoUrl, bannerUrl, category, communityType,
      rules, tags, bookmarks, usefulLinks, flatSidebar, isPreview: true, timestamp: Date.now()
    }));
    window.open("/app?community=" + encodeURIComponent(communityName) + "&preview=true", "_blank");
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "communities", communityName));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        const d = snap.data();
        if (user.uid !== d.creatorUid) {
          const mSnap = await getDoc(doc(db, "communities", communityName, "members", user.uid)).catch(() => null);
          const role = mSnap?.data()?.role;
          const perms = mSnap?.data()?.permissions || {};
          const canManageSettings =
            role === "admin" ||
            role === "moderator" ||
            role === "owner" ||
            perms.manageSettings === true;
          if (!canManageSettings) { setLoading(false); return; }
        }
        setAuthorized(true);
        setShortDesc(d.shortDesc || ""); setDesc(d.desc || "");
        setLogoUrl(d.img || ""); setBannerUrl(d.banner || "");
        
        setCategory(parseStoredCategory(d.category).selected);
        setIsMature(!!d.isMature);
        
        const loadedCType = d.communityType || (d.modLevel === "restrict" ? "private" : d.modLevel === "moderate" ? "restricted" : "public");
        setCommunityType(loadedCType);
        
        const rawRules = d.rules || [];
        setRules(rawRules.map((r: any) => {
          if (typeof r === "string") {
            const parts = r.includes(" || ") ? r.split(" || ") : [r, ""];
            return { title: parts[0], body: parts[1] || "" };
          }
          return { title: r.title || "", body: r.body || "" };
        }));
        const rawTags = d.tags || [];
        setTags(rawTags.map((t: any, i: number) => {
          if (typeof t === "string") return { text: t, color: i % TAG_COLORS.length };
          return { text: t.text || t, color: t.color ?? (i % TAG_COLORS.length) };
        }));
        setBookmarks(d.bookmarks || []);
        setUsefulLinks(d.usefulLinks || []);
        setFlatSidebar(d.flatSidebar || false);

        setIsLoaded(true);

        const draft = localStorage.getItem("nf-community-edit-draft-" + communityName);
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            const dbRules = (d.rules || []).map((r: any) => {
              if (typeof r === "string") {
                const parts = r.includes(" || ") ? r.split(" || ") : [r, ""];
                return { title: parts[0], body: parts[1] || "" };
              }
              return { title: r.title || "", body: r.body || "" };
            });
            const dbTags = (d.tags || []).map((t: any, i: number) => {
              if (typeof t === "string") return { text: t, color: i % TAG_COLORS.length };
              return { text: t.text || t, color: t.color ?? (i % TAG_COLORS.length) };
            });
            const dbBookmarks = d.bookmarks || [];
            const dbUsefulLinks = d.usefulLinks || [];
            
            const hasDiff = 
              parsed.shortDesc !== (d.shortDesc || "") ||
              parsed.desc !== (d.desc || "") ||
              parsed.logoUrl !== (d.img || "") ||
              parsed.bannerUrl !== (d.banner || "") ||
              parsed.category !== (d.category || "gaming") ||
              parsed.communityType !== (d.communityType || "public") ||
              parsed.flatSidebar !== (d.flatSidebar || false) ||
              JSON.stringify(parsed.rules) !== JSON.stringify(dbRules) ||
              JSON.stringify(parsed.tags) !== JSON.stringify(dbTags) ||
              JSON.stringify(parsed.bookmarks) !== JSON.stringify(dbBookmarks) ||
              JSON.stringify(parsed.usefulLinks) !== JSON.stringify(dbUsefulLinks);
              
            if (hasDiff) {
              setDraftData(parsed);
              setShowDraftModal(true);
            }
          } catch (e) {
            console.error("Error loading draft", e);
          }
        }
      } catch { setErrorMsg("خطا في تحميل بيانات المجتمع"); }
      setLoading(false);
    })();
  }, [communityName, user]);

  useEffect(() => {
    if (!isLoaded) return;
    const draftObj = { shortDesc, desc, logoUrl, bannerUrl, category, rules, tags, bookmarks, usefulLinks, flatSidebar, communityType, isMature };
    localStorage.setItem("nf-community-edit-draft-" + communityName, JSON.stringify(draftObj));
  }, [isLoaded, shortDesc, desc, logoUrl, bannerUrl, category, rules, tags, bookmarks, usefulLinks, flatSidebar, communityName, communityType, isMature]);

  const restoreDraft = () => {
    if (draftData) {
      setShortDesc(draftData.shortDesc || "");
      setDesc(draftData.desc || "");
      setLogoUrl(draftData.logoUrl || "");
      setBannerUrl(draftData.bannerUrl || "");
      const draftParsed = parseStoredCategory(draftData.category);
      setCategory(draftParsed.selected);
      if (typeof draftData.isMature === "boolean") setIsMature(draftData.isMature);
      setCommunityType(draftData.communityType || "public");
      setRules(draftData.rules || []);
      setTags(draftData.tags || []);
      setBookmarks(draftData.bookmarks || []);
      setUsefulLinks(draftData.usefulLinks || []);
      setFlatSidebar(draftData.flatSidebar || false);
    }
    setShowDraftModal(false);
  };

  const discardDraft = () => {
    localStorage.removeItem("nf-community-edit-draft-" + communityName);
    setShowDraftModal(false);
  };

  const addRule = () => {
    if (!newTitle.trim() || rules.length >= 6) return;
    setRules(prev => [...prev, { title: newTitle.trim(), body: newBody }]);
    setNewTitle(""); setNewBody(""); setErrorMsg("");
  };

  const addTag = () => {
    if (!newTagText.trim() || tags.length >= 7) return;
    setTags(prev => [...prev, { text: newTagText.trim(), color: newTagColor }]);
    setNewTagText(""); setNewTagColor(c => (c + 1) % TAG_COLORS.length);
  };

  const missingRules = rules.length < 6;
  const missingTags  = tags.length === 0;
  const missingDesc  = !shortDesc.trim();
  const canSave = !missingRules && !missingTags && !missingDesc;

  const save = async () => {
    if (!user || !authorized || !canSave) return;
    setSaving(true); setSavedMsg(""); setErrorMsg("");
    try {
      await setDoc(doc(db, "communities", communityName), {
        shortDesc: sanitize(shortDesc), desc: sanitize(desc),
        img: logoUrl.trim(), banner: bannerUrl.trim(), 
        category: categoryToStoreValue(category),
        isMature: !!isMature,
        communityType,
        modLevel: communityType === "private" ? "restrict" : communityType === "restricted" ? "moderate" : "open",
        rules: rules.map(r => ({ title: r.title.trim(), body: r.body })).filter(r => r.title),
        tags: tags.map(t => ({ text: t.text, color: t.color })).filter(t => t.text),
        bookmarks: bookmarks.map(b => ({ label: sanitize(b.label), url: b.url.trim() })).filter(b => b.label && isUrl(b.url)),
        usefulLinks: usefulLinks.map(b => ({ label: sanitize(b.label), url: b.url.trim() })).filter(b => b.label && isUrl(b.url)),
        flatSidebar,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      localStorage.removeItem("nf-community-edit-draft-" + communityName);
      setSavedMsg("تم النشر بنجاح");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e: any) { setErrorMsg("خطا: " + (e?.message || "حاول مرة اخرى")); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes nf-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2.5" style={{ animation: "nf-spin .7s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    </div>
  );
  if (notFound) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: darkText, margin: 0 }}>المجتمع غير موجود</p>
      <a href="/app" style={{ color: blue, fontSize: 12 }}>رجوع</a>
    </div>
  );
  if (!authorized) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: red, margin: 0 }}>ليس لديك صلاحية لتعديل هذا المجتمع</p>
      <a href="/app" style={{ color: blue, fontSize: 12 }}>رجوع</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "Tahoma, Arial, 'Noto Kufi Arabic', sans-serif", direction: "rtl", fontSize: 13 }}>
      <style>{`
        @keyframes nf-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box} input,textarea,select{font-family:inherit}
        ::-webkit-scrollbar{width:8px} ::-webkit-scrollbar-track{background:#e0e0e0} ::-webkit-scrollbar-thumb{background:#aaa;border-radius:2px}
        select option{background:#fff;color:#222}
        [contenteditable]:empty:before{content:attr(data-placeholder);color:#bbb;pointer-events:none;display:block}
        [contenteditable] ul { list-style-type: disc !important; padding-right: 24px !important; margin: 8px 0 !important; }
        [contenteditable] ol { list-style-type: decimal !important; padding-right: 24px !important; margin: 8px 0 !important; }
        [contenteditable] li { display: list-item !important; margin-bottom: 4px !important; }
      `}</style>

      <div style={{ background: "linear-gradient(to bottom, #4a6fa5, #2d4f7c)", borderBottom: "2px solid #1a3a5c", padding: "0 16px", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: white }}>NorthFall</span>
        <a href="/app" style={{ fontSize: 11, color: "rgba(255,255,255,.75)", textDecoration: "none" }}>رجوع للتطبيق</a>
      </div>

      <div style={{ background: "linear-gradient(to bottom, #f8f8f8, #ececec)", borderBottom: "1px solid #c0c0c0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: darkText }}>تعديل المجتمع — n/{communityName}</h1>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: dimText }}>اضغط معاينة لرؤية الموقع كما سيظهر للناس (انت فقط تشوفه)</p>
        </div>
        <button onClick={openPreview}
          style={{ padding: "6px 16px", border: "1px solid " + blue, borderRadius: 3, background: blueBg, color: white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          معاينة
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: "18px auto", padding: "0 16px 60px" }}>
        {savedMsg && <div style={{ padding: "8px 12px", borderRadius: 4, background: "#e8f5e9", color: "#2e7d32", fontSize: 12, marginBottom: 12, border: "1px solid #a5d6a7" }}>{savedMsg}</div>}
        {errorMsg && <div style={{ padding: "8px 12px", borderRadius: 4, background: "#ffebee", color: red, fontSize: 12, marginBottom: 12, border: "1px solid #ffcdd2" }}>{errorMsg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={box}>
              <div style={boxHead}><span>الوصف والتصنيف</span></div>
              <div style={boxBody}>
                <Field label="الوصف القصير" hint="جملة واحدة تظهر تحت اسم المجتمع في القوائم.">
                  <input type="text" value={shortDesc} onChange={e => setShortDesc(e.target.value)} maxLength={300} placeholder="مثال: مجتمع لمطوري الالعاب العرب" style={inp} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: mutedText }}>{shortDesc.length} / 300</span>
                  </div>
                </Field>
                <Field label="الوصف الكامل" hint="يظهر في صفحة المجتمع. اشرح ما يدور فيه ومن هو الجمهور.">
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5} maxLength={3000} placeholder="اكتب وصفا تفصيليا..." style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: mutedText }}>{desc.length} / 3000</span>
                  </div>
                </Field>
                <Field label="التصنيف" hint="يساعد الناس على اكتشاف مجتمعك.">
                  <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
                    {COMMUNITY_CATEGORIES.map((label) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="مجتمع مخصص لفئة +18" hint="سيُطلب من الزوار تأكيد العمر قبل الدخول أو التفاعل.">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: darkText, cursor: "pointer" }}>
                    <input type="checkbox" checked={isMature} onChange={e => setIsMature(e.target.checked)} />
                    تفعيل محتوى للبالغين (+18)
                  </label>
                </Field>

                <Field label="خصوصية المجتمع" hint="يحدد من يمكنه النشر ورؤية محتويات المجتمع.">
                  <select value={communityType} onChange={e => setCommunityType(e.target.value)} style={inp}>
                    <option value="public">🔓 عام (Public) - الكل يرى وينشر</option>
                    <option value="restricted">🔒 شبه خاص (Restricted) - الكل يرى والمشرفين ينشرون</option>
                    <option value="private">👁️ خاص (Private) - الأعضاء المعتمدون فقط يرون وينشرون</option>
                  </select>
                </Field>
              </div>
            </div>

            <div style={box}>
              <div style={boxHead}><span>الهوية البصرية</span></div>
              <div style={boxBody}>
                <Field label="رابط الشعار" hint="صورة دائرية تظهر بجانب اسم المجتمع.">
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" style={{ ...inp, fontFamily: "monospace", fontSize: 11 }} />
                    {logoUrl.trim() && <img src={logoUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "1px solid " + border, flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                  </div>
                </Field>
                <Field label="رابط البانر" hint="صورة عريضة في اعلى صفحة المجتمع.">
                  <input type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://example.com/banner.jpg" style={{ ...inp, fontFamily: "monospace", fontSize: 11 }} />
                  {bannerUrl.trim() && <div style={{ marginTop: 6, height: 48, borderRadius: 3, overflow: "hidden", border: "1px solid " + border }}><img src={bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /></div>}
                </Field>

              </div>
            </div>

            <div style={box}>
              <div style={boxHead}><span>روابط المجتمع (Bookmarks)</span></div>
              <div style={boxBody}>
                <div style={{ fontSize: 11, color: dimText, marginBottom: 10 }}>روابط تظهر في الشريط الجانبي للمجتمع.</div>
                {bookmarks.map((bm, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderBottom: "1px solid #f0f0f0", background: idx % 2 === 0 ? "#fafafa" : white }}>
                    <span style={{ fontSize: 12, color: blue, fontWeight: 600, flex: 1 }}>{bm.label}</span>
                    <button onClick={() => setBookmarks(p => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: mutedText, fontSize: 12, padding: "0 4px", fontFamily: "inherit" }}>x</button>
                  </div>
                ))}
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 6 }}>
                  <input type="text" value={bmLabel} onChange={e => setBmLabel(e.target.value)} placeholder="اسم الرابط" style={inp} />
                  <input type="text" value={bmUrl} onChange={e => setBmUrl(e.target.value)} placeholder="https://..." style={{ ...inp, fontFamily: "monospace", fontSize: 11 }} />
                </div>
                <button onClick={() => { if (bmLabel.trim() && isUrl(bmUrl)) { setBookmarks(p => [...p, { label: sanitize(bmLabel), url: bmUrl.trim() }]); setBmLabel(""); setBmUrl(""); } }} disabled={!bmLabel.trim() || !isUrl(bmUrl)}
                  style={{ marginTop: 6, padding: "4px 14px", border: "1px solid " + blue, borderRadius: 3, background: "transparent", color: blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: bmLabel.trim() && isUrl(bmUrl) ? 1 : 0.4 }}>
                  اضافة رابط مجتمع
                </button>
              </div>
            </div>

            <div style={box}>
              <div style={boxHead}><span>روابط مفيدة (Useful Links)</span></div>
              <div style={boxBody}>
                <div style={{ fontSize: 11, color: dimText, marginBottom: 10 }}>روابط تظهر في قسم الروابط المفيدة.</div>
                {usefulLinks.map((bm, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderBottom: "1px solid #f0f0f0", background: idx % 2 === 0 ? "#fafafa" : white }}>
                    <span style={{ fontSize: 12, color: blue, fontWeight: 600, flex: 1 }}>{bm.label}</span>
                    <button onClick={() => setUsefulLinks(p => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: mutedText, fontSize: 12, padding: "0 4px", fontFamily: "inherit" }}>x</button>
                  </div>
                ))}
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 6 }}>
                  <input type="text" value={ulLabel} onChange={e => setUlLabel(e.target.value)} placeholder="اسم الرابط" style={inp} />
                  <input type="text" value={ulUrl} onChange={e => setUlUrl(e.target.value)} placeholder="https://..." style={{ ...inp, fontFamily: "monospace", fontSize: 11 }} />
                </div>
                <button onClick={() => { if (ulLabel.trim() && isUrl(ulUrl)) { setUsefulLinks(p => [...p, { label: sanitize(ulLabel), url: ulUrl.trim() }]); setUlLabel(""); setUlUrl(""); } }} disabled={!ulLabel.trim() || !isUrl(ulUrl)}
                  style={{ marginTop: 6, padding: "4px 14px", border: "1px solid " + blue, borderRadius: 3, background: "transparent", color: blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: ulLabel.trim() && isUrl(ulUrl) ? 1 : 0.4 }}>
                  اضافة رابط مفيد
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={box}>
              <div style={boxHead}>
                <span>قوانين المجتمع</span>
                <span style={{ fontSize: 11, color: blue, fontWeight: 700 }}>{rules.length}</span>
              </div>
              <div style={boxBody}>
                <div style={{ fontSize: 11, color: dimText, marginBottom: 10, lineHeight: 1.6 }}>
                  اكتب عنواناً وشرحاً لكل قانون.
                </div>
                {rules.map((rule, idx) => (
                  <div key={idx} style={{ border: "1px solid " + border, borderRadius: 3, marginBottom: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#f5f5f5", cursor: "pointer" }}
                      onClick={() => setExpandedRule(expandedRule === idx ? null : idx)}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: blue, minWidth: 20 }}>{idx + 1}.</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: darkText }}>{rule.title}</span>
                      {rule.body && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 0.2s",
                          transform: expandedRule === idx ? "rotate(180deg)" : "rotate(0deg)",
                          width: 16,
                          height: 16
                        }}>
                          <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L4 4L7 1" stroke={mutedText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                      <button onClick={e => { e.stopPropagation(); setRules(prev => prev.filter((_, i) => i !== idx)); if (expandedRule === idx) setExpandedRule(null); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: mutedText, fontSize: 12, padding: "0 4px", fontFamily: "inherit" }}>x</button>
                    </div>
                    {expandedRule === idx && rule.body && (
                      <div style={{ padding: "8px 10px", fontSize: 11, color: dimText, lineHeight: 1.7, background: white, borderTop: "1px solid " + border }}>
                        <RichPreview text={rule.body} />
                      </div>
                    )}
                  </div>
                ))}
                {rules.length < 6 ? (
                  <div style={{ border: "1px dashed " + border, borderRadius: 3, padding: "10px 12px", background: "#fafafa" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: labelText, marginBottom: 6 }}>قانون {rules.length + 1} من 6</div>
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="عنوان القانون" style={{ ...inp, marginBottom: 8 }} />
                    <div style={{ fontSize: 11, color: dimText, marginBottom: 4 }}>الشرح (اختياري)</div>
                    <RuleEditor onChange={setNewBody} />
                    <button onClick={addRule} disabled={!newTitle.trim()}
                      style={{ marginTop: 8, padding: "5px 16px", border: "1px solid " + blue, borderRadius: 3, background: newTitle.trim() ? blueBg : "#e0e0e0", color: newTitle.trim() ? white : "#999", fontSize: 12, fontWeight: 700, cursor: newTitle.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                      اضافة القانون
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "8px 10px", background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 3, fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>
                    تم اضافة 6 قوانين
                  </div>
                )}
              </div>
            </div>

            <div style={box}>
              <div style={boxHead}>
                <span>الوسوم (Flairs)</span>
                <span style={{ fontSize: 11, color: tags.length === 0 ? red : tags.length >= 7 ? "#2e7d32" : blue, fontWeight: 700 }}>{tags.length} / 7 {tags.length === 0 ? "(مطلوب)" : ""}</span>
              </div>
              <div style={boxBody}>
                <div style={{ fontSize: 11, color: dimText, marginBottom: 10, lineHeight: 1.6 }}>
                  الوسوم تظهر عند انشاء منشور. الاعضاء يجب ان يختاروا وسما قبل النشر. الحد الاقصى 7 وسوم.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: tags.length > 0 ? 12 : 0 }}>
                  {tags.map((tag, idx) => {
                    const c = TAG_COLORS[tag.color % TAG_COLORS.length];
                    return (
                      <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text }}>
                        {tag.text}
                        <button onClick={() => setTags(p => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: 12, padding: 0, fontFamily: "inherit", opacity: 0.6 }}>x</button>
                      </span>
                    );
                  })}
                </div>
                {tags.length < 7 ? (
                  <div style={{ border: "1px dashed " + border, borderRadius: 3, padding: "10px 12px", background: "#fafafa" }}>
                    <input type="text" value={newTagText} onChange={e => setNewTagText(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder="اسم الوسم" maxLength={30} style={{ ...inp, marginBottom: 8 }} />
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      {TAG_COLORS.map((c, i) => (
                        <button key={i} onClick={() => setNewTagColor(i)} style={{ width: 26, height: 26, borderRadius: 13, border: newTagColor === i ? "3px solid " + darkText : "2px solid transparent", background: c.bg, cursor: "pointer", outline: "none" }} />
                      ))}
                    </div>
                    {newTagText.trim() && (
                  <div style={{ marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, background: TAG_COLORS[newTagColor].bg, color: TAG_COLORS[newTagColor].text }}>{newTagText}</span>
                      </div>
                    )}
                    <button onClick={addTag} disabled={!newTagText.trim()}
                      style={{ padding: "5px 16px", border: "1px solid " + blue, borderRadius: 3, background: newTagText.trim() ? blueBg : "#e0e0e0", color: newTagText.trim() ? white : "#999", fontSize: 12, fontWeight: 700, cursor: newTagText.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                      اضافة الوسم
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "8px 10px", background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 3, fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>تم اضافة 7 وسوم</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          <button onClick={save} disabled={saving || !canSave} style={{ padding: "7px 24px", border: "1px solid " + (canSave ? blue : border), borderRadius: 3, background: canSave && !saving ? blueBg : "#e0e0e0", color: canSave && !saving ? white : "#999", fontSize: 13, fontWeight: 700, cursor: canSave && !saving ? "pointer" : "not-allowed", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: canSave && !saving ? "0 1px 2px rgba(0,0,0,.2)" : "none" }}>
            {saving && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "nf-spin .7s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>

          <button type="button" onClick={() => {
            const draftObj = { shortDesc, desc, logoUrl, bannerUrl, category, rules, tags, bookmarks, usefulLinks, flatSidebar, communityType, isMature };
            localStorage.setItem("nf-community-edit-draft-" + communityName, JSON.stringify(draftObj));
            alert("تم حفظ المسودة محلياً بنجاح!");
          }}
            style={{ padding: "7px 16px", border: "1px solid " + border, borderRadius: 3, background: white, color: darkText, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
            حفظ المسودة
          </button>
          
          <button type="button" onClick={() => {
            const saved = localStorage.getItem("nf-community-edit-draft-" + communityName);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                setDraftData(parsed);
                setShowDraftModal(true);
              } catch {
                alert("فشل في تحميل المسودة");
              }
            } else {
              alert("لا توجد مسودة محفوظة لهذا المجتمع");
            }
          }}
            style={{ padding: "7px 16px", border: "1px solid " + border, borderRadius: 3, background: white, color: dimText, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
            استعادة المسودة
          </button>

          {!canSave && !saving && (
            <span style={{ fontSize: 11, color: red }}>
              {missingDesc ? "الوصف القصير مطلوب" : missingRules ? "يجب اضافة " + (6 - rules.length) + " قانون اخر" : missingTags ? "اضف وسما واحدا على الاقل" : ""}
            </span>
          )}
          {savedMsg && <span style={{ fontSize: 12, color: "#2e7d32", fontWeight: 600 }}>{savedMsg}</span>}
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: mutedText, letterSpacing: ".5px", fontWeight: 700 }}>
          <a href="https://www.northfall.blog" style={{ color: mutedText, textDecoration: "none" }}>NORTHFALL</a>
        </div>
      </div>
      {showDraftModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#121314", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", direction: "rtl", textAlign: "right" }}>
            <h3 style={{ fontSize: 14, fontWeight: "bold", color: "#ffffff", marginBottom: 8, marginTop: 0 }}>استعادة التعديلات غير المحفوظة</h3>
            <p style={{ fontSize: 12, color: "#a8aaac", lineHeight: 1.6, marginBottom: 24 }}>
              لقد وجدت مسودة لتعديلات سابقة قمت بها على مجتمع <strong>n/{communityName}</strong> ولم تنشر بعد. هل ترغب في استعادة هذه التعديلات ومواصلة العمل عليها؟
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={discardDraft} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: "bold", color: "#9a9d9f", border: "none", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontFamily: "inherit" }}>
                تجاهل والبدء من جديد
              </button>
              <button onClick={restoreDraft} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: "bold", background: "#336699", color: "#ffffff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                استعادة المسودة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditCommunityPage() {
  return (
    <AuthProvider><I18nProvider><ToastProvider>
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#dce3ea", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#555", fontSize: 13, fontFamily: "Tahoma, Arial, sans-serif" }}>جاري التحميل...</span></div>}>
        <EditCommunityContent />
      </Suspense>
    </ToastProvider></I18nProvider></AuthProvider>
  );
}

export default EditCommunityPage;
