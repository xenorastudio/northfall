"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { COMMUNITY_CATEGORIES, categoryToStoreValue, parseStoredCategory } from "@/lib/community-categories";

const c = {
  bg: "#121214",
  card: "#1a1a1e",
  border: "#2a2a2e",
  border2: "#222226",
  text: "#e8e8ea",
  text2: "#c8c8ca",
  muted: "#88889a",
  dim: "#6a6a7a",
  accent: "#b0b0b8",
  surface: "#222226",
  hover: "rgba(255,255,255,0.05)",
  red: "#e04050",
  green: "#40c060",
  inputBg: "#16161a",
};

const input = {
  width: "100%" as const,
  background: c.inputBg,
  border: `1px solid ${c.border2}`,
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 12,
  color: c.text,
  outline: "none" as const,
  fontFamily: "inherit",
};

const btnStyle = (active: boolean) => ({
  display: "flex" as const,
  alignItems: "center" as const,
  gap: 4,
  padding: "5px 12px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  border: `1px solid ${active ? c.accent : c.border}`,
  background: active ? c.surface : "transparent",
  color: active ? c.text : c.muted,
  cursor: "pointer" as const,
  transition: "all 0.12s",
  fontFamily: "inherit",
});

const sanitizeText = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export default function EmbedCommunityEdit({ communityName }: { communityName: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [noPermission, setNoPermission] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const [shortDesc, setShortDesc] = useState("");
  const [desc, setDesc] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isMature, setIsMature] = useState(false);
  const [showInForum, setShowInForum] = useState(true);
  const [rules, setRules] = useState<string[]>([]);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [expandedRuleIdx, setExpandedRuleIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!communityName || !user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "communities", communityName));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        const d = snap.data();
        if (user.uid !== d.creatorUid) {
          const memberSnap = await getDoc(doc(db, "communities", communityName, "members", user.uid)).catch(() => null);
          const role = memberSnap?.data()?.role;
          if (role !== "admin" && role !== "moderator") { setNoPermission(true); setLoading(false); return; }
        }
        setShortDesc(d.shortDesc || "");
        setDesc(d.desc || "");
        setLogoUrl(d.img || "");
        setBannerUrl(d.banner || "");
        setCategory(parseStoredCategory(d.category).selected);
        setIsMature(!!d.isMature);
        setRules(d.rules || []);
        setShowInForum(d.showInForum !== false);
      } catch { setError("خطأ في تحميل بيانات المجتمع"); }
      setLoading(false);
    })();
  }, [communityName, user]);

  const addRule = () => {
    const ct = sanitizeText(newRuleTitle);
    const cd = sanitizeText(newRuleDesc);
    if (!ct) return;
    const combined = ct + (cd ? " || " + cd : "");
    if (rules.some(r => r.split(" || ")[0].toLowerCase() === ct.toLowerCase())) return;
    setRules([...rules, combined]);
    setNewRuleTitle(""); setNewRuleDesc("");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true); setSavedMsg("");
    try {
      await setDoc(doc(db, "communities", communityName), {
        shortDesc: sanitizeText(shortDesc), desc: sanitizeText(desc),
        img: logoUrl.trim(), banner: bannerUrl.trim(),
        category: categoryToStoreValue(category),
        isMature: !!isMature,
        rules: rules.map(sanitizeText).filter(Boolean), showInForum,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSavedMsg("✓ تم الحفظ"); setTimeout(() => setSavedMsg(""), 2000);
    } catch { setError("خطأ في الحفظ"); }
    setSaving(false);
  };

  if (loading) return <div style={{ background: c.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${c.border}`, borderTopColor: c.accent, animation: "s 0.6s linear infinite" }} />
    <style>{`@keyframes s{to{transform:rotate(360deg)}}`}</style>
  </div>;

  if (notFound) return <div style={{ background: c.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", gap: 8 }}>
    <p style={{ color: c.text, fontSize: 14, fontWeight: 700, margin: 0 }}>المجتمع غير موجود</p>
    <a href="/" style={{ color: c.accent, fontSize: 12, textDecoration: "none" }}>← الرجوع</a>
  </div>;

  if (noPermission) return <div style={{ background: c.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", gap: 8 }}>
    <p style={{ color: c.text, fontSize: 14, fontWeight: 700, margin: 0 }}>ليس لديك صلاحية</p>
    <p style={{ color: c.dim, fontSize: 11, margin: 0 }}>فقط المالك والمشرفون يمكنهم التعديل</p>
    <a href="/" style={{ color: c.accent, fontSize: 12, textDecoration: "none" }}>← الرجوع</a>
  </div>;

  return <div style={{ background: c.bg, minHeight: "100vh", direction: "rtl", fontFamily: "'Cairo',sans-serif" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:${c.bg}!important;margin:0!important}`}</style>

    <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: c.text, margin: 0, letterSpacing: "-0.3px" }}>تعديل المجتمع</h1>
          <p style={{ fontSize: 11, color: c.dim, margin: "3px 0 0" }}>/n/{communityName}</p>
        </div>
        <a href="/" style={{ fontSize: 11, color: c.accent, textDecoration: "none", padding: "4px 10px", borderRadius: 5, border: `1px solid ${c.border}`, transition: "all 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.background = c.hover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>← رجوع</a>
      </div>

      {error && <div style={{ padding: "8px 12px", borderRadius: 6, background: `${c.red}15`, color: c.red, fontSize: 11, marginBottom: 14, border: `1px solid ${c.red}25` }}>{error}</div>}
      {savedMsg && <div style={{ padding: "8px 12px", borderRadius: 6, background: `${c.green}15`, color: c.green, fontSize: 11, marginBottom: 14, border: `1px solid ${c.green}25` }}>{savedMsg}</div>}

      {/* Card */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, overflow: "hidden" }}>
        {/* Description */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>الوصف القصير</label>
          <input value={shortDesc} onChange={e => setShortDesc(e.target.value)} style={input} />
        </div>

        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>الوصف الكامل</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} style={{ ...input, resize: "none", lineHeight: 1.7 }} />
        </div>

        {/* Category */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>التصنيف</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ ...input, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236a6a7a'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "left 10px center", paddingLeft: 28 }}>
            {COMMUNITY_CATEGORIES.map((label) => (
              <option key={label} value={label} style={{ background: c.card, color: c.text }}>{label}</option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 11, color: c.muted, cursor: "pointer" }}>
            <input type="checkbox" checked={isMature} onChange={e => setIsMature(e.target.checked)} />
            مجتمع +18 (تأكيد عمر الزوار)
          </label>
        </div>

        {/* Logo */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>الشعار</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." style={{ ...input, flex: 1, fontFamily: "monospace", fontSize: 11 }} />
            {logoUrl && <img src={logoUrl} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: `1px solid ${c.border2}`, flexShrink: 0 }} onError={e => (e.currentTarget.style.display = "none")} />}
          </div>
        </div>

        {/* Banner */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>البانر</label>
          <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." style={{ ...input, fontFamily: "monospace", fontSize: 11 }} />
          {bannerUrl && <div style={{ marginTop: 6, height: 48, borderRadius: 6, overflow: "hidden", border: `1px solid ${c.border2}` }}>
            <img src={bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
          </div>}
        </div>

        {/* Rules */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>القوانين</label>
          {rules.map((rule: any, idx) => {
            const title = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[0] : rule) : (rule.title || "");
            const detail = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[1] : "") : (rule.body || "");
            const isOpen = expandedRuleIdx === idx;
            return <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `1px solid ${c.border2}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.accent, width: 14, flexShrink: 0 }}>{idx + 1}</span>
              <button onClick={() => setExpandedRuleIdx(isOpen ? null : idx)}
                style={{ flex: 1, textAlign: "right", fontSize: 12, color: c.text, border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{title}</button>
              {detail && <span style={{ fontSize: 9, color: c.dim, cursor: "pointer" }} onClick={() => setExpandedRuleIdx(isOpen ? null : idx)}>{isOpen ? "▲" : "▼"}</span>}
              <button onClick={() => setRules(rules.filter((_, i) => i !== idx))} style={{ border: "none", background: "none", cursor: "pointer", color: c.dim, padding: 0, fontSize: 11, fontFamily: "inherit" }}>✕</button>
            </div>;
          })}
          {expandedRuleIdx !== null && (() => {
            const r = rules[expandedRuleIdx] as any;
            const detail = typeof r === "string" ? (r.includes(" || ") ? r.split(" || ")[1] : "") : (r?.body || "");
            return detail ? <div style={{ padding: "4px 14px 8px", fontSize: 11, color: c.muted, lineHeight: 1.6 }}>{detail}</div> : null;
          })()}
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            <input value={newRuleTitle} onChange={e => setNewRuleTitle(e.target.value)} placeholder="عنوان القانون" style={input} />
            <textarea value={newRuleDesc} onChange={e => setNewRuleDesc(e.target.value)} placeholder="شرح القانون (اختياري)" rows={2} style={{ ...input, resize: "none", lineHeight: 1.5, fontSize: 11 }} />
            <button onClick={addRule} disabled={!newRuleTitle.trim()}
              style={{ fontSize: 11, fontWeight: 600, color: newRuleTitle.trim() ? c.accent : c.dim, border: "none", background: "none", cursor: newRuleTitle.trim() ? "pointer" : "not-allowed", padding: 0, textAlign: "right", fontFamily: "inherit" }}>
              + إضافة قانون
            </button>
          </div>
        </div>

        {/* Show in forum */}
        <div style={{ padding: "14px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: c.text, margin: 0 }}>الظهور في المنتدى</p>
            <p style={{ fontSize: 10, color: c.dim, margin: "2px 0 0" }}>يظهر في قائمة المجتمعات</p>
          </div>
          <button onClick={() => setShowInForum(p => !p)}
            style={{ position: "relative", width: 36, height: 18, borderRadius: 9, border: "none", cursor: "pointer", background: showInForum ? c.accent : c.border, transition: "background 0.15s", fontFamily: "inherit", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.15s", left: showInForum ? 20 : 2 }} />
          </button>
        </div>

        {/* Save */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${c.border2}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontSize: 11, color: c.dim, textDecoration: "none" }}>إلغاء</a>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "7px 20px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", background: c.accent, color: "#111", opacity: saving ? 0.6 : 1, fontFamily: "inherit", transition: "opacity 0.15s" }}>
            {saving ? "..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Brand */}
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: c.dim, letterSpacing: "0.5px", fontWeight: 700 }}>
        <a href="https://www.northfall.blog" style={{ color: c.dim, textDecoration: "none" }}>NORTHFALL</a>
      </div>
    </div>
  </div>;
}
