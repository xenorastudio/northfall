"use client";

import { useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

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

interface Community { name: string; img?: string; members?: number; }

export default function EmbedFeedEdit({ feedId }: { feedId: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [bannerUrl, setBannerUrl] = useState("");
  const [showBannerBg, setShowBannerBg] = useState(true);
  const [search, setSearch] = useState("");
  const [allComms, setAllComms] = useState<Community[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [editors, setEditors] = useState<{ displayName: string }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [commSearchFocused, setCommSearchFocused] = useState(false);

  const isOwner = user?.uid === ownerId;
  const filtered = search.trim()
    ? allComms.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allComms;

  useEffect(() => {
    getDocs(collection(db, "communities")).then((snap) => {
      setAllComms(snap.docs.map((d) => ({ name: d.data().name || d.id, img: d.data().img || "", members: d.data().memberCount || 0 })).sort((a, b) => (b.members || 0) - (a.members || 0)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!feedId || !user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "custom_feeds", feedId));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        const d = snap.data();
        setName(d.name || "");
        setSelected(d.communities || []);
        setIsPrivate(d.isPrivate ?? false);
        setShowOnProfile(d.showOnProfile ?? true);
        setBannerUrl(d.bannerUrl || "");
        setShowBannerBg(d.showBannerBg ?? true);
        setOwnerId(d.ownerId || "");
        if (d.editors) setEditors(d.editors.map((e: any) => typeof e === 'string' ? { displayName: e.slice(0, 8) } : { displayName: e.displayName || e.uid.slice(0, 8) }));
      } catch { setError("حدث خطأ في تحميل الفيد"); }
      setLoading(false);
    })();
  }, [feedId, user]);

  const toggle = (n: string) => setSelected((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  const save = async () => {
    if (!user || !name.trim() || !selected.length) return;
    setSaving(true); setSavedMsg("");
    try {
      const editorObjs = editors.map((e) => ({ uid: "", displayName: e.displayName, photoURL: "", permissions: { editName: true, editCommunities: true, editPrivacy: true, editAppearance: true } }));
      const editorUids: string[] = [];
      const centralData: Record<string, any> = { name: name.trim(), communities: selected, isPrivate, showOnProfile, showBannerBg, editors: editorObjs };
      if (bannerUrl.trim()) centralData.bannerUrl = bannerUrl.trim();
      await setDoc(doc(db, "custom_feeds", feedId), centralData, { merge: true });
      const allUids = [...new Set([user.uid, ...editorUids])];
      const batch = writeBatch(db);
      for (const uid of allUids) {
        batch.set(doc(db, "users", uid, "customFeeds", feedId), { id: feedId, name: name.trim(), communities: selected, isPrivate, showOnProfile, showBannerBg, ownerId, editors: editorObjs, isEditor: uid !== ownerId });
      }
      await batch.commit();
      setSavedMsg("✓ تم الحفظ"); setTimeout(() => setSavedMsg(""), 2000);
    } catch { setError("خطأ في الحفظ"); }
    setSaving(false);
  };

  const del = async () => {
    if (!user || !isOwner) return;
    try {
      const snap = await getDoc(doc(db, "custom_feeds", feedId));
      if (snap.exists()) {
        const d = snap.data();
        const batch = writeBatch(db);
        batch.delete(doc(db, "custom_feeds", feedId));
        batch.delete(doc(db, "users", user.uid, "customFeeds", feedId));
        for (const e of d.editors || []) batch.delete(doc(db, "users", (typeof e === 'string' ? e : e.uid), "customFeeds", feedId));
        await batch.commit();
      }
      window.location.href = "/";
    } catch { setError("خطأ في الحذف"); }
  };

  if (loading) return <div style={{ background: c.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${c.border}`, borderTopColor: c.accent, animation: "s 0.6s linear infinite" }} />
    <style>{`@keyframes s{to{transform:rotate(360deg)}}`}</style>
  </div>;

  if (notFound) return <div style={{ background: c.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", gap: 8 }}>
    <p style={{ color: c.text, fontSize: 14, fontWeight: 700, margin: 0 }}>الفيد غير موجود</p>
    <a href="/" style={{ color: c.accent, fontSize: 12, textDecoration: "none" }}>← الرجوع</a>
  </div>;

  const valid = name.trim().length > 0 && selected.length > 0;

  return <div style={{ background: c.bg, minHeight: "100vh", direction: "rtl", fontFamily: "'Cairo',sans-serif" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:${c.bg}!important;margin:0!important}`}</style>

    <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: c.text, margin: 0, letterSpacing: "-0.3px" }}>تعديل الفيد</h1>
          <p style={{ fontSize: 11, color: c.dim, margin: "3px 0 0" }}>/{name || feedId.slice(0, 10)}</p>
        </div>
        <a href="/" style={{ fontSize: 11, color: c.accent, textDecoration: "none", padding: "4px 10px", borderRadius: 5, border: `1px solid ${c.border}`, transition: "all 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.background = c.hover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>← رجوع</a>
      </div>

      {error && <div style={{ padding: "8px 12px", borderRadius: 6, background: `${c.red}15`, color: c.red, fontSize: 11, marginBottom: 14, border: `1px solid ${c.red}25` }}>{error}</div>}
      {savedMsg && <div style={{ padding: "8px 12px", borderRadius: 6, background: `${c.green}15`, color: c.green, fontSize: 11, marginBottom: 14, border: `1px solid ${c.green}25` }}>{savedMsg}</div>}

      {/* Card */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 8, overflow: "hidden" }}>
        {/* Name */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>الاسم</label>
          <input type="text" value={name} onChange={e => setName(e.target.value.slice(0, 40))} placeholder="اسم الفيد" maxLength={40} style={input} />
        </div>

        {/* Privacy */}
        <div style={{ padding: "14px 14px 0", display: "flex", gap: 6 }}>
          <button onClick={() => setIsPrivate(p => !p)} style={btnStyle(isPrivate)}>🔒 خاص</button>
          <button onClick={() => setShowOnProfile(p => !p)} style={btnStyle(showOnProfile)}>👤 في البروفايل</button>
        </div>

        {/* Communities */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>المجتمعات {selected.length > 0 && <span style={{ color: c.accent }}>({selected.length})</span>}</label>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث..." style={input}
            onFocus={() => setCommSearchFocused(true)} onBlur={() => setTimeout(() => setCommSearchFocused(false), 150)} />
          {commSearchFocused && search.trim() && (
            <div style={{ marginTop: 4, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 6, maxHeight: 160, overflowY: "auto" }}>
              {filtered.length === 0 ? <p style={{ padding: 12, textAlign: "center", fontSize: 11, color: c.dim }}>—</p>
                : filtered.map(comm => {
                  const sel = selected.includes(comm.name);
                  return <button key={comm.name} onMouseDown={() => toggle(comm.name)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "none", background: sel ? c.hover : "transparent", cursor: "pointer", fontSize: 11, color: sel ? c.text : c.muted, textAlign: "right", borderBottom: `1px solid ${c.border2}`, transition: "background 0.1s" }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${sel ? c.accent : c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: sel ? c.accent : "transparent" }}>
                      {sel && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                    </span>
                    {comm.img ? <img src={comm.img} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      : <span style={{ width: 18, height: 18, borderRadius: "50%", background: c.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: c.accent, flexShrink: 0 }}>n</span>}
                    <span style={{ flex: 1, textAlign: "right" }}>{comm.name}</span>
                  </button>;
                })}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {selected.map(s => (
              <button key={s} onClick={() => toggle(s)}
                style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: c.surface, color: c.muted, border: `1px solid ${c.border2}`, cursor: "pointer", fontFamily: "inherit" }}>
                {s} <span style={{ color: c.dim, fontSize: 9 }}>✕</span>
              </button>
            ))}
          </div>
        </div>

        {/* Banner */}
        <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>البانر</label>
          <input type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." maxLength={500} style={{ ...input, fontFamily: "monospace", fontSize: 11 }} />
          {bannerUrl.trim() && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, padding: "6px 10px", borderRadius: 6, border: `1px solid ${c.border2}` }}>
            <span style={{ fontSize: 11, color: c.muted }}>عرض الخلفية</span>
            <button onClick={() => setShowBannerBg(p => !p)} style={{ position: "relative", width: 28, height: 14, borderRadius: 7, border: "none", cursor: "pointer", background: showBannerBg ? c.accent : c.border, transition: "background 0.15s", fontFamily: "inherit" }}>
              <span style={{ position: "absolute", top: 2, width: 10, height: 10, borderRadius: "50%", background: "#fff", transition: "left 0.15s,right 0.15s", left: showBannerBg ? "" : 2, right: showBannerBg ? 2 : "" }} />
            </button>
          </div>}
        </div>

        {/* Editors */}
        {editors.length > 0 && <div style={{ padding: "14px 14px 0" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: c.dim, display: "block", marginBottom: 5, letterSpacing: "0.3px", textTransform: "uppercase" }}>المحررون</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {editors.map((e, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 5, border: `1px solid ${c.border2}` }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: c.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: c.accent, flexShrink: 0 }}>{e.displayName[0]}</span>
              <span style={{ fontSize: 11, color: c.text, flex: 1 }}>{e.displayName}</span>
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: c.surface, color: c.accent, fontWeight: 700 }}>محرر</span>
            </div>)}
          </div>
        </div>}

        {/* Actions */}
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${c.border2}`, marginTop: 14 }}>
          {isOwner && !confirmDelete && <button onClick={() => setConfirmDelete(true)} style={{ padding: "6px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", color: c.dim, background: "transparent", fontFamily: "inherit" }}>🗑 حذف</button>}
          {confirmDelete && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.muted }}>
            <span>متأكد؟</span>
            <button onClick={del} style={{ padding: "3px 10px", borderRadius: 4, background: `${c.red}20`, color: c.red, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>حذف</button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: "3px 10px", borderRadius: 4, background: c.surface, color: c.muted, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
          </div>}
          <div style={{ flex: 1 }} />
          <button onClick={save} disabled={!valid || saving}
            style={{ padding: "7px 20px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", cursor: valid && !saving ? "pointer" : "not-allowed", background: valid && !saving ? c.accent : c.border, color: valid && !saving ? "#111" : c.dim, opacity: saving ? 0.6 : 1, fontFamily: "inherit", transition: "opacity 0.15s" }}>
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
