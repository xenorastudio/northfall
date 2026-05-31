"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, Trash2, Lock, Globe, Loader2, UserPlus, X, Hash, Image, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, Timestamp, writeBatch, onSnapshot } from "firebase/firestore";
import type { CustomFeed } from "./CustomFeedModal";

interface Community { name: string; img?: string; members?: number; }

interface Props {
  editFeed?: CustomFeed | null;
  onBack: () => void;
  onSaved: (feed: CustomFeed) => void;
  onDeleted?: (id: string) => void;
}

type Section = "basic" | "communities" | "editors" | "appearance";

interface Permissions {
  editName: boolean;
  editCommunities: boolean;
  editPrivacy: boolean;
  editAppearance: boolean;
}

interface Person {
  uid: string;
  displayName: string;
  photoURL: string;
  permissions: Permissions;
}

const defaultPerms = (): Permissions => ({ editName: true, editCommunities: true, editPrivacy: true, editAppearance: true });

const permLabels: { key: keyof Permissions; label: string }[] = [
  { key: "editName", label: "الاسم" },
  { key: "editCommunities", label: "المجتمعات" },
  { key: "editPrivacy", label: "الخصوصية" },
  { key: "editAppearance", label: "المظهر (بانر)" },
];

export default function CustomFeedPage({ editFeed, onBack, onSaved, onDeleted }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [bannerUrl, setBannerUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [showBannerBg, setShowBannerBg] = useState(true);
  const [search, setSearch] = useState("");
  const [allComms, setAllComms] = useState<Community[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const [editors, setEditors] = useState<Person[]>([]);
  const [editorSearch, setEditorSearch] = useState("");
  const [editorResults, setEditorResults] = useState<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const [searchingEditor, setSearchingEditor] = useState(false);
  const [editorError, setEditorError] = useState("");
  const followedProfiles = useRef<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const editorSearchTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const isLocalSave = useRef(false);
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    basic: true, communities: false, editors: false, appearance: false,
  });
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState("");

  const isOwner = user && (editFeed?.ownerId === user.uid || ownerId === user.uid);
  const myEntry = editors.find(e => e.uid === user?.uid);
  const myPerms = isOwner ? { editName: true, editCommunities: true, editPrivacy: true, editAppearance: true } : (myEntry?.permissions || defaultPerms());
  const canEdit = (perm: keyof Permissions) => isOwner || myPerms[perm];
  const toggleSection = (s: Section) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  const resolveOwner = (uid: string): { displayName: string; photoURL: string } => {
    const p = followedProfiles.current.find(x => x.uid === uid);
    return { displayName: p?.displayName || uid.slice(0, 8), photoURL: p?.photoURL || '' };
  };

  // Resolve display name from followedProfiles or uid
  const resolve = (e: any): Person => {
    if (typeof e === 'string') {
      const p = followedProfiles.current.find(x => x.uid === e);
      return { uid: e, displayName: p?.displayName || e.slice(0, 8), photoURL: p?.photoURL || '', permissions: defaultPerms() };
    }
    return {
      uid: e.uid,
      displayName: e.displayName || e.uid.slice(0, 8),
      photoURL: e.photoURL || '',
      permissions: e.permissions || defaultPerms(),
    };
  };

  // ── Load communities ──
  useEffect(() => {
    getDocs(collection(db, "communities")).then((snap) => {
      setAllComms(
        snap.docs
          .map((d) => ({ name: d.data().name || d.id, img: d.data().img || "", members: d.data().memberCount || 0 }))
          .sort((a, b) => (b.members || 0) - (a.members || 0))
      );
    }).catch(() => {});
  }, []);

  // ── Real-time sync via onSnapshot on central doc ──
  useEffect(() => {
    if (!editFeed) return;
    const unsub = onSnapshot(doc(db, "custom_feeds", editFeed.id), (snap) => {
      if (!snap.exists() || isLocalSave.current) return;
      const d = snap.data();
      setName(d.name || "");
      setSelected(d.communities || []);
      setIsPrivate(d.isPrivate ?? false);
      setShowOnProfile(d.showOnProfile ?? true);
      setBannerUrl(d.bannerUrl || "");
      setIconUrl(d.iconUrl || "");
      setShowBannerBg(d.showBannerBg ?? true);
      setOwnerId(d.ownerId || "");
      if (d.editors) setEditors(d.editors.map(resolve));
      else setEditors([]);
    });
    return () => unsub();
  }, [editFeed, followedProfiles.current.length]);

  // ── Load initial data from editFeed ──
  useEffect(() => {
    if (editFeed) {
      setName(editFeed.name);
      setSelected(editFeed.communities);
      setIsPrivate(editFeed.isPrivate ?? false);
      setShowOnProfile(editFeed.showOnProfile ?? true);
      setBannerUrl(editFeed.bannerUrl ?? "");
      setIconUrl(editFeed.iconUrl ?? "");
      setShowBannerBg(editFeed.showBannerBg ?? true);
      setOwnerId(editFeed.ownerId || "");
    } else {
      setName(""); setSelected([]); setIsPrivate(false); setShowOnProfile(true);
      setBannerUrl(""); setIconUrl(""); setShowBannerBg(true); setOwnerId("");
    }
    setTimeout(() => nameRef.current?.focus(), 150);
  }, [editFeed]);

  // ── Load followed profiles for editor search ──
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const followingSnap = await getDocs(collection(db, "users", user.uid, "following"));
        const uids = followingSnap.docs.map((d) => d.id);
        if (uids.length === 0) { followedProfiles.current = []; return; }
        const profiles: { uid: string; displayName: string; photoURL: string }[] = [];
        for (let i = 0; i < uids.length; i += 10) {
          const chunk = uids.slice(i, i + 10);
          const snaps = await Promise.all(chunk.map((uid) => getDoc(doc(db, "users", uid)).catch(() => null)));
          for (const s of snaps) {
            if (s?.exists()) {
              profiles.push({ uid: s.id, displayName: s.data().displayName || s.id, photoURL: s.data().photoURL || "" });
            }
          }
        }
        if (!cancelled) { followedProfiles.current = profiles; setEditors((prev) => prev.map(resolve)); }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // ── Local search through followed profiles ──
  useEffect(() => {
    const q = editorSearch.trim().toLowerCase();
    if (q.length < 1) { setEditorResults([]); return; }
    setSearchingEditor(true);
    clearTimeout(editorSearchTimer.current);
    editorSearchTimer.current = setTimeout(() => {
      const results = followedProfiles.current.filter((p) => p.displayName.toLowerCase().includes(q)).slice(0, 8);
      setEditorResults(results);
      setSearchingEditor(false);
    }, 200);
    return () => { clearTimeout(editorSearchTimer.current); };
  }, [editorSearch]);

  // ── Normalize editors on load ──
  useEffect(() => {
    if (editFeed?.editors) setEditors(editFeed.editors.map(resolve));
    else setEditors([]);
  }, [editFeed]);

  const handleAddEditor = async (target: { uid: string; displayName: string; photoURL: string }) => {
    if (editors.some((e) => e.uid === target.uid)) { setEditorError("هذا المستخدم مضاف مسبقاً"); return; }
    setEditorError("");
    try {
      const followSnap = await getDoc(doc(db, "users", user!.uid, "following", target.uid));
      if (!followSnap.exists()) { setEditorError("لا يمكنك إضافة هذا المستخدم ما لم تقم بمتابعته أولاً"); return; }
    } catch { setEditorError("حدث خطأ أثناء التحقق من المتابعة"); return; }
    setEditors((p) => [...p, { ...target, permissions: defaultPerms() }]);
    setEditorSearch(""); setEditorResults([]);
  };

  const removeEditor = (uid: string) => { setEditors((p) => p.filter((e) => e.uid !== uid)); setEditorError(""); };

  const togglePerm = (uid: string, key: keyof Permissions) => {
    setEditors((prev) => prev.map((e) => e.uid === uid ? { ...e, permissions: { ...e.permissions, [key]: !e.permissions[key] } } : e));
  };

  const filtered = search.trim()
    ? allComms.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allComms;

  const toggle = (n: string) => setSelected((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  const save = async () => {
    if (!user || !name.trim() || !selected.length) return;
    isLocalSave.current = true;
    setSaving(true);
    try {
      const id = editFeed?.id || `feed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const editorObjs = editors.map((e) => ({ uid: e.uid, displayName: e.displayName, photoURL: e.photoURL, permissions: e.permissions }));
      const editorUids = editors.map((e) => e.uid);
      const canWriteName = isOwner || myPerms.editName;
      const canWriteCommunities = isOwner || myPerms.editCommunities;
      const canWritePrivacy = isOwner || myPerms.editPrivacy;
      const canWriteAppearance = isOwner || myPerms.editAppearance;
      const centralData: Record<string, any> = {};
      if (canWriteName) centralData.name = name.trim();
      if (canWriteCommunities) centralData.communities = selected;
      if (canWritePrivacy) { centralData.isPrivate = isPrivate; centralData.showOnProfile = showOnProfile; }
      if (canWriteAppearance) { centralData.showBannerBg = showBannerBg; if (bannerUrl.trim()) centralData.bannerUrl = bannerUrl.trim(); if (iconUrl.trim()) centralData.iconUrl = iconUrl.trim(); }
      centralData.editors = editorObjs;
      centralData.editorUids = editorUids;

      const isExisting = !!editFeed;
      const now = Timestamp.now();

      if (isExisting) {
        await setDoc(doc(db, "custom_feeds", id), centralData, { merge: true });
      } else {
        await setDoc(doc(db, "custom_feeds", id), { ...centralData, ownerId: user.uid, createdAt: now });
      }

      const allUids = [...new Set([user.uid, ...editorUids])];
      const batch = writeBatch(db);
      const oldEditorUids: string[] = editFeed?.editors
        ? editFeed.editors.map((e: any) => typeof e === 'string' ? e : e.uid)
        : [];

      for (const uid of allUids) {
        const refData: Record<string, any> = {
          id, name: name.trim(), communities: selected, isPrivate, showOnProfile, showBannerBg,
          ownerId: user.uid, editors: editorObjs, editorUids, isEditor: uid !== user.uid,
        };
        if (bannerUrl.trim()) refData.bannerUrl = bannerUrl.trim();
        if (iconUrl.trim()) refData.iconUrl = iconUrl.trim();
        refData.createdAt = editFeed?.createdAt || now;
        batch.set(doc(db, "users", uid, "customFeeds", id), refData);
      }

      for (const uid of oldEditorUids) {
        if (!allUids.includes(uid)) {
          batch.delete(doc(db, "users", uid, "customFeeds", id));
        }
      }

      await batch.commit();
      onSaved({ id, name: name.trim(), communities: selected, isPrivate, showOnProfile, showBannerBg,
        editors: editorUids, ownerId: user.uid, createdAt: editFeed?.createdAt || now } as any);
    } catch (e) { console.error(e); } finally { setSaving(false); setTimeout(() => { isLocalSave.current = false; }, 500); }
  };

  const del = async () => {
    if (!user || !editFeed) return;
    const isOwnerUser = editFeed.ownerId === user.uid;
    if (isOwnerUser) {
      await deleteDoc(doc(db, "users", user.uid, "customFeeds", editFeed.id)).catch(() => {});
      try {
        const centralSnap = await getDoc(doc(db, "custom_feeds", editFeed.id));
        if (centralSnap.exists()) {
          const centralData = centralSnap.data();
          await Promise.all([
            deleteDoc(doc(db, "custom_feeds", editFeed.id)).catch(() => {}),
            ...(centralData.editors || []).map((e: any) =>
              deleteDoc(doc(db, "users", (typeof e === 'string' ? e : e.uid), "customFeeds", editFeed.id)).catch(() => {})
            ),
          ]);
        } else { await deleteDoc(doc(db, "custom_feeds", editFeed.id)).catch(() => {}); }
      } catch { await deleteDoc(doc(db, "custom_feeds", editFeed.id)).catch(() => {}); }
    } else {
      await deleteDoc(doc(db, "users", user.uid, "customFeeds", editFeed.id)).catch(() => {});
    }
    onDeleted?.(editFeed.id);
  };

  const valid = name.trim().length > 0 && selected.length > 0;

  function SectionHeader({ section, icon, title, desc }: { section: Section; icon: React.ReactNode; title: string; desc?: string }) {
    const isOpen = openSections[section];
    return (
      <button onClick={() => toggleSection(section)} className="w-full flex items-center gap-2 py-2.5 text-right group">
        <div className="w-7 h-7 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0 group-hover:bg-nf-accent/15 transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-nf-text">{title}</div>
          {desc && <div className="text-[10px] text-nf-dim">{desc}</div>}
        </div>
        <ChevronDown size={14} className={cn("text-nf-dim transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>
    );
  }

  function SectionContent({ section, children }: { section: Section; children: React.ReactNode }) {
    if (!openSections[section]) return null;
    return (
      <div className="animate-in slide-in-from-top-1 fade-in duration-200 pb-2">{children}</div>
    );
  }

  function PersonAvatar({ p, size = 7, color }: { p: { photoURL?: string; displayName: string }; size?: number; color?: string }) {
    const cls = `w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 text-[${Math.floor(size * 1.3)}px] font-bold`;
    if (p.photoURL) return <img src={p.photoURL} alt="" className={`${cls} object-cover`} />;
    return <div className={`${cls} ${color || "bg-nf-accent/15 text-nf-accent"}`}>{p.displayName[0] || "?"}</div>;
  }

  function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick} type="button"
        className={cn("relative w-7 h-3.5 rounded-full transition-colors shrink-0", on ? "bg-nf-accent" : "bg-nf-border-2")}>
        <span className={cn("absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all", on ? "right-0.5" : "left-0.5")} />
      </button>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6" style={{ direction: "rtl" }}>
      {/* Header */}
      <h2 className="text-[18px] font-bold text-nf-text mb-6">{editFeed ? "تعديل الفيد" : "فيد مخصص جديد"}</h2>

      {/* ── Basic Info ── */}
      <div className="border border-nf-border-2/60 rounded-xl mb-3 overflow-hidden bg-nf-secondary/10">
        <div className="px-4">
          <SectionHeader section="basic" icon={<Info size={13} className="text-nf-accent" />} title="المعلومات الأساسية" desc="الاسم وإعدادات الخصوصية" />
        </div>
        <div className="border-t border-nf-border-2/40">
          <div className="px-4">
            <SectionContent section="basic">
              <div className="pt-3 pb-2 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-nf-dim mb-1 block">الاسم</label>
                  <input ref={nameRef} type="text" value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 40))}
                    readOnly={!canEdit('editName')}
                    placeholder="اسم الفيد المخصص" maxLength={40}
                    className={cn("w-full !bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim/50 outline-none transition-colors", canEdit('editName') ? "focus:border-nf-accent" : "opacity-60 cursor-not-allowed")}
                    onKeyDown={(e) => { if (e.key === "Enter" && valid) save(); }} />
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => canEdit('editPrivacy') && setIsPrivate(p => !p)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all", isPrivate ? "bg-nf-accent/10 border-nf-accent/20 text-nf-accent" : "border-nf-border-2 text-nf-dim", canEdit('editPrivacy') ? "hover:text-nf-text" : "opacity-60 cursor-not-allowed")}>
                    <Lock size={11} /> خاص
                  </button>
                  <button onClick={() => canEdit('editPrivacy') && setShowOnProfile(p => !p)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all", showOnProfile ? "bg-nf-accent/10 border-nf-accent/20 text-nf-accent" : "border-nf-border-2 text-nf-dim", canEdit('editPrivacy') ? "hover:text-nf-text" : "opacity-60 cursor-not-allowed")}>
                    <Globe size={11} /> في البروفايل
                  </button>
                </div>
              </div>
            </SectionContent>
          </div>
        </div>
      </div>

      {/* ── Communities ── */}
      <div className="border border-nf-border-2/60 rounded-xl mb-3 overflow-hidden bg-nf-secondary/10">
        <div className="px-4">
          <SectionHeader section="communities" icon={<Hash size={13} className="text-nf-accent" />}
            title={`المجتمعات${selected.length > 0 ? ` (${selected.length})` : ""}`} desc="اختر المجتمعات اللي تظهر في الفيد" />
        </div>
        <div className="border-t border-nf-border-2/40">
          <div className="px-4">
              <SectionContent section="communities">
                <div className={cn("pt-3 pb-2 space-y-2", !canEdit('editCommunities') && "opacity-60 pointer-events-none")}>
                  <div className="relative">
                    <Search size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث عن مجتمع..."
                      readOnly={!canEdit('editCommunities')}
                      className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl pr-8 pl-7 py-2 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors" />
                    {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-nf-dim hover:text-nf-text"><X size={10} /></button>}
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-0.5 rounded-xl border border-nf-border-2 bg-nf-secondary/20">
                    {filtered.length === 0 ? (
                      <div className="py-6 text-center text-[12px] text-nf-dim">لا توجد نتائج</div>
                    ) : filtered.map((c) => {
                      const sel = selected.includes(c.name);
                      return (
                        <button key={c.name} onClick={() => canEdit('editCommunities') && toggle(c.name)}
                          className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-right transition-colors text-[12px]", sel ? "bg-nf-accent/8 text-nf-text font-medium" : "text-nf-muted hover:bg-nf-hover")}>
                          <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0", sel ? "bg-nf-accent border-nf-accent" : "border-nf-border")}>
                            {sel && <Check size={9} className="text-white" strokeWidth={3} />}
                          </div>
                          {c.img ? <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                            : <div className="w-5 h-5 rounded-full bg-nf-secondary border border-nf-border-2 flex items-center justify-center text-[6px] text-nf-accent font-bold shrink-0">n</div>}
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selected.map((s) => (
                        <button key={s} onClick={() => canEdit('editCommunities') && toggle(s)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-nf-accent/12 text-nf-accent hover:bg-red-500/12 hover:text-red-400 transition-all">
                          n/{s} <X size={8} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </SectionContent>
          </div>
        </div>
      </div>

      {/* ── Editors ── */}
      <div className="border border-nf-border-2/60 rounded-xl mb-3 overflow-hidden bg-nf-secondary/10">
        <div className="px-4">
          <SectionHeader section="editors" icon={<UserPlus size={13} className="text-nf-accent" />}
            title={`المحررون${editors.length > 0 ? ` (${editors.length})` : ""}`} desc={isOwner ? "أضف محررين مشاركين (متابعين فقط)" : "المحررون المشاركون في هذا الفيد"} />
        </div>
        <div className="border-t border-nf-border-2/40">
          <div className="px-4">
            <SectionContent section="editors">
              <div className="pt-3 pb-2 space-y-2">
                {isOwner ? (
                  <>
                    <div className="relative">
                      <Search size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
                      <input type="text" value={editorSearch} onChange={(e) => setEditorSearch(e.target.value)}
                        placeholder="ابحث عن مستخدم تتابعه..."
                        className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl pr-8 pl-7 py-2 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors" />
                      {searchingEditor && <Loader2 size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-nf-accent animate-spin" />}
                    </div>
                    {editorResults.length > 0 && (
                      <div className="rounded-xl overflow-hidden border border-nf-border-2">
                        {editorResults.map((r) => (
                          <button key={r.uid} onClick={() => handleAddEditor(r)}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-right text-[12px] text-nf-text hover:bg-nf-hover transition-colors">
                            {r.photoURL ? <img src={r.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                              : <div className="w-6 h-6 rounded-full bg-nf-accent/15 flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">{r.displayName[0]}</div>}
                            <span className="flex-1 truncate">{r.displayName}</span>
                            <UserPlus size={9} className="text-nf-accent shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                    {editorError && <p className="text-[11px] text-red-400 flex items-center gap-1"><X size={11} /> {editorError}</p>}
                  </>
                ) : (
                  <p className="text-[11px] text-nf-dim py-1 flex items-center gap-1.5">
                    <Lock size={10} className="shrink-0" />
                    فقط المالك يمكنه إدارة المحررين
                  </p>
                )}

                {/* Person cards with collapsible permissions + toggles */}
                <div className="space-y-1.5">
                  {/* Owner card */}
                  {editFeed && (() => {
                    const ownerData = resolveOwner(editFeed.ownerId || '');
                    return (
                      <div className="border border-nf-border-2/50 rounded-xl overflow-hidden bg-nf-secondary/20">
                        <button onClick={() => setExpandedPerson(p => p === '__owner__' ? null : '__owner__')}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right group">
                          {ownerData.photoURL ? (
                            <img src={ownerData.photoURL} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center text-[9px] text-amber-500 font-bold shrink-0">
                              {(ownerData.displayName[0] || 'م').toUpperCase()}
                            </div>
                          )}
                          <span className="flex-1 text-[12px] font-medium text-nf-text truncate">{ownerData.displayName}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">مالك</span>
                          <ChevronDown size={12} className={cn("text-nf-dim transition-transform shrink-0", expandedPerson === '__owner__' && "rotate-180")} />
                        </button>
                      </div>
                    );
                  })()}

                  {/* Editor cards with permission toggles */}
                  {editors.map((e) => (
                    <div key={e.uid} className="border border-nf-border-2/50 rounded-xl overflow-hidden bg-nf-secondary/20">
                      <button onClick={() => setExpandedPerson(p => p === e.uid ? null : e.uid)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right group">
                        <PersonAvatar p={e} size={7} />
                        <span className="flex-1 text-[12px] font-medium text-nf-text truncate">{e.displayName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-nf-accent/10 text-nf-accent font-bold">محرر</span>
                        {isOwner && (
                          <button onClick={(ev) => { ev.stopPropagation(); removeEditor(e.uid); }}
                            className="text-nf-dim hover:text-red-400 transition-colors shrink-0 p-0.5"><X size={10} /></button>
                        )}
                        <ChevronDown size={12} className={cn("text-nf-dim transition-transform shrink-0", expandedPerson === e.uid && "rotate-180")} />
                      </button>
                      {expandedPerson === e.uid && (
                        <div className="border-t border-nf-border-2/30 px-3 py-2.5 bg-nf-secondary/10">
                          {isOwner ? (
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold text-nf-dim mb-1.5">الصلاحيات</div>
                              {permLabels.map((pl) => (
                                <label key={pl.key} className="flex items-center justify-between py-1 cursor-pointer">
                                  <span className="text-[11px] text-nf-text">{pl.label}</span>
                                  <Toggle on={e.permissions[pl.key]} onClick={() => togglePerm(e.uid, pl.key)} />
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {permLabels.map((pl) => (
                                <div key={pl.key} className="flex items-center gap-2 text-[11px]">
                                  {e.permissions[pl.key]
                                    ? <Check size={10} className="text-green-500 shrink-0" />
                                    : <X size={10} className="text-red-400 shrink-0" />}
                                  <span className={e.permissions[pl.key] ? "text-nf-text" : "text-nf-dim"}>{pl.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionContent>
          </div>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="border border-nf-border-2/60 rounded-xl mb-3 overflow-hidden bg-nf-secondary/10">
        <div className="px-4">
          <SectionHeader section="appearance" icon={<Image size={13} className="text-nf-accent" />} title="المظهر" desc="بانر وأيقونة الفيد" />
        </div>
        <div className="border-t border-nf-border-2/40">
          <div className="px-4">
              <SectionContent section="appearance">
                <div className={cn("pt-3 pb-2 space-y-3", !canEdit('editAppearance') && "opacity-60 pointer-events-none")}>
                  <div>
                    <label className="text-[10px] font-semibold text-nf-dim mb-1 block">رابط البانر</label>
                    <input type="text" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
                      readOnly={!canEdit('editAppearance')}
                      placeholder="https://..." maxLength={500}
                      className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors" />
                  </div>
                  {bannerUrl.trim() && (
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-nf-border-2">
                      <span className="text-[11px] text-nf-text">عرض الخلفية</span>
                      <button onClick={() => canEdit('editAppearance') && setShowBannerBg(p => !p)}
                        className={cn("relative w-8 h-4 rounded-full transition-colors shrink-0", showBannerBg ? "bg-nf-accent" : "bg-nf-border-2")}>
                        <span className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all", showBannerBg ? "right-0.5" : "left-0.5")} />
                      </button>
                    </div>
                  )}
                </div>
              </SectionContent>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 pt-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
        {editFeed && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)}
            className={cn("flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors border",
              isOwner ? "text-nf-dim hover:text-red-400 hover:bg-red-400/10 border-transparent hover:border-red-400/20" : "text-nf-dim/30 border-transparent cursor-not-allowed")}>
            <Trash2 size={13} /> حذف
          </button>
        )}
        {confirmDelete && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-nf-muted">متأكد؟</span>
            <button onClick={del} className="px-3 py-1 rounded-lg bg-red-500/15 text-red-400 text-[11px] font-bold hover:bg-red-500/25 transition-colors">حذف</button>
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1 rounded-lg bg-nf-secondary text-nf-muted text-[11px] font-bold hover:bg-nf-hover transition-colors">إلغاء</button>
          </div>
        )}
        <div className="flex-1" />
        <button onClick={save} disabled={!valid || saving}
          className={cn("px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2",
            valid && !saving ? "bg-nf-accent text-white hover:opacity-90" : "bg-nf-secondary text-nf-dim cursor-not-allowed")}>
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? "..." : editFeed ? "حفظ" : "إنشاء"}
        </button>
      </div>
    </div>
  );
}
