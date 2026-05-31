"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  onSnapshot, writeBatch, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { canUserAccessFeed, getEditorUidsFromFeedData } from "@/lib/custom-feed-access";
import { useAuth } from "@/app/components/AuthProvider";
import AuthProvider from "@/app/components/AuthProvider";
import { I18nProvider } from "@/app/components/I18nProvider";
import ToastProvider, { useToast } from "@/app/components/ToastProvider";

// ── Shared palette (same as embed-generator) ──────────────────────────────
const bg      = "#dce3ea";
const white   = "#ffffff";
const border  = "#c8c8c8";
const border2 = "#aaa";
const headBg  = "linear-gradient(to bottom, #f0f0f0, #e4e4e4)";
const blue    = "#336699";
const blueBg  = "linear-gradient(to bottom, #4a7fc1, #2d5f9a)";
const red     = "#cc0000";
const green   = "linear-gradient(to bottom, #4caf50, #388e3c)";
const inputBg = "#fff";
const dimText = "#666";
const darkText= "#222";
const mutedText="#888";
const labelText="#333";

const box: React.CSSProperties = {
  background: white, border: `1px solid ${border}`, borderRadius: 4, marginBottom: 14,
};
const boxHead: React.CSSProperties = {
  background: headBg, borderBottom: `1px solid ${border}`,
  padding: "7px 12px", fontSize: 12, fontWeight: 700, color: labelText,
  letterSpacing: ".2px", display: "flex", alignItems: "center", justifyContent: "space-between",
};
const boxBody: React.CSSProperties = { padding: "12px 14px" };

const inp: React.CSSProperties = {
  width: "100%", border: `1px solid ${border2}`, borderRadius: 3,
  padding: "6px 10px", fontSize: 12, color: darkText, background: inputBg,
  outline: "none", fontFamily: "inherit", boxShadow: "inset 0 1px 3px rgba(0,0,0,.08)",
};

// ── Types ─────────────────────────────────────────────────────────────────
interface Community { name: string; img?: string; members?: number; }
interface Permissions { editName: boolean; editCommunities: boolean; editPrivacy: boolean; editAppearance: boolean; }
interface Editor { uid: string; displayName: string; photoURL: string; permissions: Permissions; }
const defaultPerms = (): Permissions => ({ editName: true, editCommunities: true, editPrivacy: true, editAppearance: true });
const permLabels: { key: keyof Permissions; label: string; desc: string }[] = [
  { key: "editName",        label: "الاسم",        desc: "تعديل اسم الفيد المخصص" },
  { key: "editCommunities", label: "المجتمعات",    desc: "إضافة وحذف المجتمعات من الفيد" },
  { key: "editPrivacy",     label: "الخصوصية",     desc: "تغيير إعدادات الخصوصية والظهور" },
  { key: "editAppearance",  label: "المظهر",       desc: "تعديل البانر والأيقونة" },
];

// ── Toggle (classic checkbox style) ──────────────────────────────────────
function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} type="button" style={{
      position: "relative", width: 36, height: 18, borderRadius: 9,
      border: "none", cursor: disabled ? "not-allowed" : "pointer",
      background: on ? blue : "#ccc", transition: "background .15s",
      opacity: disabled ? 0.45 : 1, flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2, width: 14, height: 14, borderRadius: "50%",
        background: white, boxShadow: "0 1px 2px rgba(0,0,0,.3)",
        transition: "left .15s, right .15s",
        left: on ? "" : 2, right: on ? 2 : "",
      }} />
    </button>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────
function Av({ src, name }: { src?: string; name: string }) {
  const s: React.CSSProperties = {
    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, fontWeight: 700, color: blue,
    background: "#e8edf2", border: `1px solid #c0c8d0`, overflow: "hidden",
  };
  if (src) return <img src={src} alt="" style={{ ...s, objectFit: "cover" }} />;
  return <div style={s}>{(name[0] || "?").toUpperCase()}</div>;
}

// ── Main content ──────────────────────────────────────────────────────────
function FeedSettingsContent() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const feedId = params.feedId as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [savedMsg, setSavedMsg]       = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const [confirmDel, setConfirmDel]   = useState(false);
  const [deleting, setDeleting]       = useState(false);

  // Feed fields
  const [name, setName]               = useState("");
  const [communities, setCommunities] = useState<string[]>([]);
  const [isPrivate, setIsPrivate]     = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [bannerUrl, setBannerUrl]     = useState("");
  const [iconUrl, setIconUrl]         = useState("");
  const [showBannerBg, setShowBannerBg] = useState(true);
  const [ownerId, setOwnerId]         = useState("");
  const [editors, setEditors]         = useState<Editor[]>([]);

  // Community picker
  const [allComms, setAllComms]       = useState<Community[]>([]);
  const [commSearch, setCommSearch]   = useState("");
  const [commFocused, setCommFocused] = useState(false);

  // Editor search
  const [edSearch, setEdSearch]       = useState("");
  const [edResults, setEdResults]     = useState<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const [edSearching, setEdSearching] = useState(false);
  const [edError, setEdError]         = useState("");
  const [expandedEd, setExpandedEd]   = useState<string | null>(null);
  const followedProfiles = useRef<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const edTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const isLocalSave = useRef(false);
  const loadedEditorUids = useRef<string[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  const isOwner = !!(user && ownerId && user.uid === ownerId);
  const myEntry = editors.find(e => e.uid === user?.uid);
  const myPerms: Permissions = isOwner
    ? { editName: true, editCommunities: true, editPrivacy: true, editAppearance: true }
    : (myEntry?.permissions || defaultPerms());
  const canEdit = (p: keyof Permissions) => isOwner || myPerms[p];

  const resolveEd = (e: any): Editor => {
    if (typeof e === "string") {
      const p = followedProfiles.current.find(x => x.uid === e);
      return { uid: e, displayName: p?.displayName || e.slice(0, 8), photoURL: p?.photoURL || "", permissions: defaultPerms() };
    }
    return { uid: e.uid, displayName: e.displayName || e.uid?.slice(0, 8) || "?", photoURL: e.photoURL || "", permissions: e.permissions || defaultPerms() };
  };

  // ── Load communities (doc id = المعرّف الموحّد) ───────────────────────
  useEffect(() => {
    getDocs(collection(db, "communities")).then(snap => {
      setAllComms(
        snap.docs
          .map(d => ({
            name: d.id,
            img: d.data().img || "",
            members: d.data().memberCount || 0,
          }))
          .sort((a, b) => (b.members || 0) - (a.members || 0))
      );
    }).catch(() => {});
  }, []);

  // ── Load followed profiles ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "following"));
        const uids = snap.docs.map(d => d.id);
        if (!uids.length) { followedProfiles.current = []; return; }
        const profiles: { uid: string; displayName: string; photoURL: string }[] = [];
        for (let i = 0; i < uids.length; i += 10) {
          const chunk = uids.slice(i, i + 10);
          const snaps = await Promise.all(chunk.map(uid => getDoc(doc(db, "users", uid)).catch(() => null)));
          for (const s of snaps) if (s?.exists()) profiles.push({ uid: s.id, displayName: s.data().displayName || s.id, photoURL: s.data().photoURL || "" });
        }
        if (!cancelled) { followedProfiles.current = profiles; setEditors(prev => prev.map(resolveEd)); }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // ── Real-time onSnapshot ─────────────────────────────────────────────────
  useEffect(() => {
    if (!feedId || !user) return;
    let cancelled = false;
    void canUserAccessFeed(feedId, user.uid).then((allowed) => {
      if (!cancelled && !allowed) setAccessDenied(true);
    });
    const unsub = onSnapshot(doc(db, "custom_feeds", feedId), snap => {
      if (!snap.exists()) { setNotFound(true); setPageLoading(false); return; }
      if (isLocalSave.current) return;
      const d = snap.data();
      const uids = getEditorUidsFromFeedData(d);
      if (user.uid !== d.ownerId && !uids.includes(user.uid)) {
        setAccessDenied(true);
        setPageLoading(false);
        return;
      }
      setAccessDenied(false);
      setName(d.name || "");
      setCommunities(d.communities || []);
      setIsPrivate(d.isPrivate ?? false);
      setShowOnProfile(d.showOnProfile ?? true);
      setBannerUrl(d.bannerUrl || "");
      setIconUrl(d.iconUrl || "");
      setShowBannerBg(d.showBannerBg ?? true);
      setOwnerId(d.ownerId || "");
      setEditors(d.editors ? d.editors.map(resolveEd) : []);
      loadedEditorUids.current = uids;
      setPageLoading(false);
    }, () => { setNotFound(true); setPageLoading(false); });
    return () => { cancelled = true; unsub(); };
  }, [feedId, user]);

  // ── Editor search ────────────────────────────────────────────────────────
  useEffect(() => {
    const q = edSearch.trim().toLowerCase();
    if (q.length < 1) { setEdResults([]); return; }
    setEdSearching(true);
    clearTimeout(edTimer.current);
    edTimer.current = setTimeout(() => {
      setEdResults(followedProfiles.current.filter(p => p.displayName.toLowerCase().includes(q)).slice(0, 8));
      setEdSearching(false);
    }, 200);
    return () => clearTimeout(edTimer.current);
  }, [edSearch]);

  const filteredComms = commSearch.trim()
    ? allComms.filter(c => c.name.toLowerCase().includes(commSearch.toLowerCase()))
    : allComms.slice(0, 40);

  const isCommSelected = (id: string) => communities.some(c => c.toLowerCase() === id.toLowerCase());

  const toggleComm = async (n: string) => {
    if (!user || !canEdit("editCommunities")) return;
    const next = isCommSelected(n)
      ? communities.filter(x => x.toLowerCase() !== n.toLowerCase())
      : [...communities.filter(x => x.toLowerCase() !== n.toLowerCase()), n];
    setCommunities(next);
    isLocalSave.current = true;
    try {
      await setDoc(doc(db, "custom_feeds", feedId), { communities: next }, { merge: true });
      await setDoc(doc(db, "users", user.uid, "customFeeds", feedId), { communities: next }, { merge: true });
    } catch {
      setErrorMsg("تعذّر تحديث المجتمعات");
    } finally {
      setTimeout(() => { isLocalSave.current = false; }, 400);
    }
  };

  const addEditor = async (target: { uid: string; displayName: string; photoURL: string }) => {
    if (editors.some(e => e.uid === target.uid)) { setEdError("هذا المستخدم مضاف مسبقاً"); return; }
    if (target.uid === user?.uid) { setEdError("لا يمكنك إضافة نفسك"); return; }
    setEdError("");
    try {
      const snap = await getDoc(doc(db, "users", user!.uid, "following", target.uid));
      if (!snap.exists()) { setEdError("يجب أن تتابع هذا المستخدم أولاً"); return; }
    } catch { setEdError("خطأ في التحقق من المتابعة"); return; }
    setEditors(prev => [...prev, { ...target, permissions: defaultPerms() }]);
    setEdSearch(""); setEdResults([]);
  };

  const removeEditor = async (uid: string) => {
    if (!isOwner) return;
    const next = editors.filter((e) => e.uid !== uid);
    setEditors(next);
    const editorObjs = next.map((e) => ({
      uid: e.uid,
      displayName: e.displayName,
      photoURL: e.photoURL,
      permissions: e.permissions,
    }));
    const editorUids = next.map((e) => e.uid);
    isLocalSave.current = true;
    try {
      await setDoc(
        doc(db, "custom_feeds", feedId),
        { editors: editorObjs, editorUids },
        { merge: true }
      );
      await deleteDoc(doc(db, "users", uid, "customFeeds", feedId));
    } catch {
      setErrorMsg("تعذّر إزالة المحرر من الفيد");
    } finally {
      setTimeout(() => { isLocalSave.current = false; }, 400);
    }
  };
  const togglePerm = (uid: string, key: keyof Permissions) =>
    setEditors(prev => prev.map(e => e.uid === uid ? { ...e, permissions: { ...e.permissions, [key]: !e.permissions[key] } } : e));

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!user || !name.trim() || !communities.length) return;
    isLocalSave.current = true;
    setSaving(true); setSavedMsg(""); setErrorMsg("");
    try {
      const editorObjs = editors.map(e => ({ uid: e.uid, displayName: e.displayName, photoURL: e.photoURL, permissions: e.permissions }));
      const editorUids = editors.map(e => e.uid);
      const centralData: Record<string, any> = { editors: editorObjs, editorUids };
      if (canEdit("editName")) centralData.name = name.trim();
      if (canEdit("editCommunities")) centralData.communities = communities;
      if (canEdit("editPrivacy")) { centralData.isPrivate = isPrivate; centralData.showOnProfile = showOnProfile; }
      if (canEdit("editAppearance")) { centralData.showBannerBg = showBannerBg; centralData.bannerUrl = bannerUrl.trim() || null; centralData.iconUrl = iconUrl.trim() || null; }
      await setDoc(doc(db, "custom_feeds", feedId), centralData, { merge: true });
      const allUids = [...new Set([ownerId, ...editorUids])].filter(Boolean);
      const batch = writeBatch(db);
      for (const uid of allUids) {
        const refData: Record<string, any> = { id: feedId, name: name.trim(), communities, isPrivate, showOnProfile, showBannerBg, ownerId, editors: editorObjs, editorUids, isEditor: uid !== ownerId };
        if (bannerUrl.trim()) refData.bannerUrl = bannerUrl.trim();
        if (iconUrl.trim()) refData.iconUrl = iconUrl.trim();
        batch.set(doc(db, "users", uid, "customFeeds", feedId), refData, { merge: true });
      }
      for (const uid of loadedEditorUids.current) {
        if (!allUids.includes(uid)) {
          batch.delete(doc(db, "users", uid, "customFeeds", feedId));
        }
      }
      loadedEditorUids.current = editorUids;
      await batch.commit();
      setSavedMsg("✓ تم الحفظ بنجاح");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e: any) {
      setErrorMsg(`خطأ في الحفظ: ${e?.message || "حاول مرة أخرى"}`);
    } finally {
      setSaving(false);
      setTimeout(() => { isLocalSave.current = false; }, 500);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const del = async () => {
    if (!user || !isOwner) return;
    setDeleting(true);
    try {
      const snap = await getDoc(doc(db, "custom_feeds", feedId));
      const batch = writeBatch(db);
      batch.delete(doc(db, "custom_feeds", feedId));
      batch.delete(doc(db, "users", user.uid, "customFeeds", feedId));
      if (snap.exists()) {
        for (const uid of getEditorUidsFromFeedData(snap.data())) {
          batch.delete(doc(db, "users", uid, "customFeeds", feedId));
        }
      }
      await batch.commit();
      window.location.href = "/app";
    } catch (e: any) {
      setErrorMsg(`خطأ في الحذف: ${e?.message}`);
      setDeleting(false);
    }
  };

  const valid = name.trim().length > 0 && communities.length > 0;

  // ── Loading / Not found ───────────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Tahoma, Arial, sans-serif" }}>
      <style>{`@keyframes nf-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2.5" style={{ animation: "nf-spin .7s linear infinite" }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: darkText, margin: 0 }}>الفيد غير موجود</p>
      <a href="/app" style={{ color: blue, fontSize: 12 }}>← الرجوع للرئيسية</a>
    </div>
  );

  if (accessDenied) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "Tahoma, Arial, sans-serif", direction: "rtl" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: darkText, margin: 0 }}>لم يعد لديك صلاحية على هذا الفيد</p>
      <a href="/app" style={{ color: blue, fontSize: 12 }}>← الرجوع للرئيسية</a>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "Tahoma, Arial, 'Noto Kufi Arabic', sans-serif", direction: "rtl", fontSize: 13 }}>
      <style>{`
        @keyframes nf-spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        * { box-sizing: border-box; }
        input[type=text], input[type=url], textarea { font-family: inherit; }
        a { color: ${blue}; }
        a:hover { text-decoration: underline; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #e0e0e0; }
        ::-webkit-scrollbar-thumb { background: #aaa; border-radius: 2px; }
      `}</style>

      {/* ── Top bar (identical to embed-generator) ── */}
      <div style={{ background: "linear-gradient(to bottom, #4a6fa5, #2d4f7c)", borderBottom: "2px solid #1a3a5c", padding: "0 16px", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: white, letterSpacing: "-.2px" }}>NorthFall</span>
        <a href="/app" style={{ fontSize: 11, color: "rgba(255,255,255,.75)", textDecoration: "none" }}>← رجوع للتطبيق</a>
      </div>

      {/* ── Page title bar (identical to embed-generator) ── */}
      <div style={{ background: "linear-gradient(to bottom, #f8f8f8, #ececec)", borderBottom: "1px solid #c0c0c0", padding: "10px 20px" }}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: darkText }}>إعدادات الفيد المخصص</h1>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: dimText }}>
          التعديلات تُحفظ فوراً وتظهر لجميع المحررين في نفس اللحظة — الفيد: <strong>{name || feedId.slice(0, 12)}</strong>
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: "18px auto", padding: "0 16px 60px" }}>

        {/* ── Messages ── */}
        {savedMsg && <div style={{ padding: "8px 12px", borderRadius: 4, background: "#e8f5e9", color: "#2e7d32", fontSize: 12, marginBottom: 12, border: "1px solid #a5d6a7" }}>{savedMsg}</div>}
        {errorMsg && <div style={{ padding: "8px 12px", borderRadius: 4, background: "#ffebee", color: red, fontSize: 12, marginBottom: 12, border: "1px solid #ffcdd2" }}>⚠ {errorMsg}</div>}

        {/* ── Two-column grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* ════ LEFT COLUMN ════ */}
          <div>

            {/* ── Box 1: Basic Info ── */}
            <div style={box}>
              <div style={boxHead}><span>الاسم والخصوصية</span></div>
              <div style={boxBody}>
                {/* Name */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelText, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".3px" }}>اسم الفيد</label>
                  <input
                    type="text" value={name} maxLength={40}
                    onChange={e => setName(e.target.value.slice(0, 40))}
                    readOnly={!canEdit("editName")}
                    placeholder="اسم الفيد المخصص"
                    style={{ ...inp, opacity: canEdit("editName") ? 1 : 0.5, cursor: canEdit("editName") ? "text" : "not-allowed" }}
                  />
                  <span style={{ fontSize: 10, color: mutedText }}>{name.length}/40</span>
                </div>

                {/* Privacy */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelText, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".3px" }}>الخصوصية</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", border: `1px solid ${border}`, borderRadius: 3, background: "#fafafa" }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: darkText, display: "block" }}>خاص</span>
                        <span style={{ fontSize: 10, color: dimText }}>يظهر لك ولمحرريك فقط</span>
                      </div>
                      <Toggle on={isPrivate} onClick={() => canEdit("editPrivacy") && setIsPrivate(p => !p)} disabled={!canEdit("editPrivacy")} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", border: `1px solid ${border}`, borderRadius: 3, background: "#fafafa" }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: darkText, display: "block" }}>عرض في البروفايل</span>
                        <span style={{ fontSize: 10, color: dimText }}>يظهر للآخرين في صفحتك</span>
                      </div>
                      <Toggle on={showOnProfile} onClick={() => canEdit("editPrivacy") && setShowOnProfile(p => !p)} disabled={!canEdit("editPrivacy")} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Box 2: Appearance ── */}
            <div style={{ ...box, opacity: canEdit("editAppearance") ? 1 : 0.55, pointerEvents: canEdit("editAppearance") ? "auto" : "none" }}>
              <div style={boxHead}><span>المظهر — بانر وأيقونة</span></div>
              <div style={boxBody}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelText, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".3px" }}>رابط البانر</label>
                  <input type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://example.com/banner.jpg" style={{ ...inp, fontFamily: "monospace", fontSize: 11 }} />
                  {bannerUrl.trim() && (
                    <div style={{ marginTop: 6, height: 52, borderRadius: 3, overflow: "hidden", border: `1px solid ${border}` }}>
                      <img src={bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelText, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".3px" }}>رابط الأيقونة</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="text" value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://example.com/icon.png" style={{ ...inp, fontFamily: "monospace", fontSize: 11 }} />
                    {iconUrl.trim() && <img src={iconUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `1px solid ${border}`, flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                  </div>
                </div>
                {bannerUrl.trim() && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", border: `1px solid ${border}`, borderRadius: 3, background: "#fafafa" }}>
                    <span style={{ fontSize: 12, color: darkText }}>عرض البانر كخلفية للفيد</span>
                    <Toggle on={showBannerBg} onClick={() => setShowBannerBg(p => !p)} />
                  </div>
                )}
              </div>
            </div>

          </div>
          {/* ════ END LEFT COLUMN ════ */}

          {/* ════ RIGHT COLUMN ════ */}
          <div>

            {/* ── Box 3: Communities ── */}
            <div style={{ ...box, opacity: canEdit("editCommunities") ? 1 : 0.55, pointerEvents: canEdit("editCommunities") ? "auto" : "none" }}>
              <div style={boxHead}>
                <span>المجتمعات</span>
                {communities.length > 0 && <span style={{ fontSize: 11, color: blue, fontWeight: 700 }}>{communities.length} مختار</span>}
              </div>
              <div style={boxBody}>
                {/* Search input */}
                <input
                  type="text" value={commSearch}
                  onChange={e => setCommSearch(e.target.value)}
                  onFocus={() => setCommFocused(true)}
                  onBlur={() => setTimeout(() => setCommFocused(false), 150)}
                  placeholder="ابحث عن مجتمع..."
                  style={{ ...inp, marginBottom: 6 }}
                />

                {/* Dropdown results */}
                {(commFocused || commSearch.trim()) && (
                  <div style={{ border: `1px solid ${border}`, borderRadius: 3, maxHeight: 180, overflowY: "auto", marginBottom: 8, background: white }}>
                    {filteredComms.length === 0
                      ? <p style={{ padding: 10, textAlign: "center", fontSize: 11, color: mutedText, margin: 0 }}>لا توجد نتائج</p>
                      : filteredComms.map(c => {
                          const sel = isCommSelected(c.name);
                          return (
                            <button key={c.name} type="button" onMouseDown={(e) => { e.preventDefault(); toggleComm(c.name); }} style={{
                              display: "flex", alignItems: "center", gap: 8, width: "100%",
                              padding: "6px 10px", border: "none", borderBottom: `1px solid #f0f0f0`,
                              background: sel ? "#eef4fb" : white, cursor: "pointer",
                              fontSize: 12, color: sel ? blue : darkText, textAlign: "right",
                              fontFamily: "inherit", transition: "background .1s",
                            }}>
                              <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${sel ? blue : "#bbb"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: sel ? blue : "transparent" }}>
                                {sel && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                              </span>
                              {c.img
                                ? <img src={c.img} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                : <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#e8edf2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: blue, flexShrink: 0 }}>n</span>
                              }
                              <span style={{ flex: 1, textAlign: "right" }}>{c.name}</span>
                              {(c.members || 0) > 0 && <span style={{ fontSize: 10, color: mutedText, flexShrink: 0 }}>{c.members?.toLocaleString()}</span>}
                            </button>
                          );
                        })
                    }
                  </div>
                )}

                {/* Selected chips */}
                {communities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {communities.map(s => (
                      <button key={s} type="button" onClick={() => toggleComm(s)} style={{
                        display: "flex", alignItems: "center", gap: 3, padding: "3px 8px",
                        borderRadius: 3, fontSize: 11, fontWeight: 600,
                        background: "#eef4fb", color: blue, border: `1px solid #c0d4e8`,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        n/{s} <span style={{ color: "#999", fontSize: 9 }}>✕</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Box 4: Editors ── */}
            <div style={box}>
              <div style={boxHead}>
                <span>المحررون المشاركون</span>
                {editors.length > 0 && <span style={{ fontSize: 11, color: blue, fontWeight: 700 }}>{editors.length} محرر</span>}
              </div>
              <div style={boxBody}>

                {/* Owner row */}
                {ownerId && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 3, marginBottom: 6, background: "#fffbf0" }}>
                    <Av src={followedProfiles.current.find(p => p.uid === ownerId)?.photoURL} name={followedProfiles.current.find(p => p.uid === ownerId)?.displayName || ownerId.slice(0, 6)} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: darkText }}>
                      {followedProfiles.current.find(p => p.uid === ownerId)?.displayName || ownerId.slice(0, 8)}
                    </span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "#fff3cd", color: "#856404", fontWeight: 700, border: "1px solid #ffc107" }}>مالك</span>
                  </div>
                )}

                {/* Editor rows */}
                {editors.map(e => (
                  <div key={e.uid} style={{ border: `1px solid ${border}`, borderRadius: 3, marginBottom: 5, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#fafafa", cursor: "pointer" }}
                      onClick={() => setExpandedEd(prev => prev === e.uid ? null : e.uid)}>
                      <Av src={e.photoURL} name={e.displayName} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: darkText }}>{e.displayName}</span>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "#e8edf2", color: blue, fontWeight: 700, border: `1px solid #c0d4e8` }}>محرر</span>
                      {isOwner && (
                        <button onClick={ev => { ev.stopPropagation(); removeEditor(e.uid); }} style={{ background: "none", border: "none", cursor: "pointer", color: mutedText, fontSize: 13, padding: "0 2px", fontFamily: "inherit" }}>✕</button>
                      )}
                      <span style={{ fontSize: 10, color: mutedText }}>{expandedEd === e.uid ? "▲" : "▼"}</span>
                    </div>
                    {expandedEd === e.uid && (
                      <div style={{ borderTop: `1px solid ${border}`, padding: "8px 10px", background: white }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: mutedText, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: ".3px" }}>الصلاحيات</p>
                        {permLabels.map(pl => (
                          <div key={pl.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid #f0f0f0` }}>
                            <div>
                              <span style={{ fontSize: 12, color: darkText, fontWeight: 600, display: "block" }}>{pl.label}</span>
                              <span style={{ fontSize: 10, color: dimText }}>{pl.desc}</span>
                            </div>
                            {isOwner
                              ? <Toggle on={e.permissions[pl.key]} onClick={() => togglePerm(e.uid, pl.key)} />
                              : <span style={{ fontSize: 11, color: e.permissions[pl.key] ? "#2e7d32" : "#c62828", fontWeight: 700, background: e.permissions[pl.key] ? "#e8f5e9" : "#ffebee", padding: "2px 8px", borderRadius: 3, border: `1px solid ${e.permissions[pl.key] ? "#a5d6a7" : "#ffcdd2"}` }}>{e.permissions[pl.key] ? "مسموح" : "ممنوع"}</span>
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add editor — owner only */}
                {isOwner ? (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: labelText, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".3px" }}>إضافة محرر (متابَع فقط)</label>
                    <div style={{ position: "relative" }}>
                      <input type="text" value={edSearch} onChange={e => setEdSearch(e.target.value)} placeholder="ابحث باسم المستخدم..." style={inp} />
                      {edSearching && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2.5"
                          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", animation: "nf-spin .7s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                      )}
                    </div>
                    {edResults.length > 0 && (
                      <div style={{ border: `1px solid ${border}`, borderRadius: 3, marginTop: 4, background: white, overflow: "hidden" }}>
                        {edResults.map(r => (
                          <button key={r.uid} onClick={() => addEditor(r)} style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            padding: "7px 10px", border: "none", borderBottom: `1px solid #f0f0f0`,
                            background: white, cursor: "pointer", fontSize: 12, color: darkText,
                            textAlign: "right", fontFamily: "inherit",
                          }}>
                            <Av src={r.photoURL} name={r.displayName} />
                            <span style={{ flex: 1 }}>{r.displayName}</span>
                            <span style={{ fontSize: 11, color: blue }}>+ إضافة</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {edError && <p style={{ margin: "4px 0 0", fontSize: 11, color: red }}>⚠ {edError}</p>}
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: mutedText }}>فقط المستخدمين الذين تتابعهم يظهرون في البحث</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: mutedText, margin: "8px 0 0" }}>فقط المالك يمكنه إدارة المحررين</p>
                )}
              </div>
            </div>

          </div>
          {/* ════ END RIGHT COLUMN ════ */}
        </div>

        {/* ── Save button row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <button onClick={save} disabled={!valid || saving} style={{
            padding: "7px 24px", border: `1px solid ${blue}`, borderRadius: 3,
            background: valid && !saving ? blueBg : "#e0e0e0",
            color: valid && !saving ? white : "#999",
            fontSize: 13, fontWeight: 700, cursor: valid && !saving ? "pointer" : "not-allowed",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
            boxShadow: valid && !saving ? "0 1px 2px rgba(0,0,0,.2)" : "none",
          }}>
            {saving && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "nf-spin .7s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
          {savedMsg && <span style={{ fontSize: 12, color: "#2e7d32", fontWeight: 600 }}>{savedMsg}</span>}
        </div>

        {/* ── Danger zone ── */}
        {isOwner && (
          <div style={{ marginTop: 20, border: `1px solid ${border}`, borderRadius: 4, background: white, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(to bottom, #f5f5f5, #ebebeb)", borderBottom: `1px solid ${border}`, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#c62828", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#c62828", letterSpacing: ".2px" }}>حذف الفيد</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: dimText, lineHeight: 1.6 }}>
                حذف الفيد إجراء دائم ولا يمكن التراجع عنه. سيُحذف الفيد من حسابك وحسابات جميع المحررين.
              </p>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} style={{
                  padding: "5px 16px", border: "1px solid #c62828", borderRadius: 3,
                  background: "transparent", color: "#c62828", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  حذف الفيد نهائياً
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: darkText, fontWeight: 600 }}>هذا الإجراء لا يمكن التراجع عنه. متأكد؟</span>
                  <button onClick={del} disabled={deleting} style={{
                    padding: "5px 16px", border: "none", borderRadius: 3,
                    background: "#c62828", color: white, fontSize: 12, fontWeight: 700,
                    cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit",
                    opacity: deleting ? 0.6 : 1, boxShadow: "0 1px 2px rgba(0,0,0,.2)",
                  }}>
                    {deleting ? "جاري الحذف..." : "نعم، احذف"}
                  </button>
                  <button onClick={() => setConfirmDel(false)} style={{
                    padding: "5px 16px", border: `1px solid ${border}`, borderRadius: 3,
                    background: "#f5f5f5", color: darkText, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Brand footer ── */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: mutedText, letterSpacing: ".5px", fontWeight: 700 }}>
          <a href="https://www.northfall.blog" style={{ color: mutedText, textDecoration: "none" }}>NORTHFALL</a>
        </div>
      </div>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────
function FeedSettingsPage() {
  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <Suspense fallback={
            <div style={{ minHeight: "100vh", background: "#dce3ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#555", fontSize: 13, fontFamily: "Tahoma, Arial, sans-serif" }}>جاري التحميل...</span>
            </div>
          }>
            <FeedSettingsContent />
          </Suspense>
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

export default FeedSettingsPage;
