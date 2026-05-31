"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Check, Rss, Trash2, Lock, Globe, Loader2, ChevronRight, Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { getEditorUidsFromFeedData } from "@/lib/custom-feed-access";

export interface CustomFeed {
  id: string;
  name: string;
  communities: string[];
  createdAt?: any;
  isPrivate?: boolean;
  showOnProfile?: boolean;
  bannerUrl?: string;
  iconUrl?: string;
  showBannerBg?: boolean;
  editors?: any[];
  ownerId?: string;
}

interface Community {
  name: string;
  img?: string;
  members?: number;
}

interface UserResult {
  uid: string;
  displayName: string;
  photoURL: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  editFeed?: CustomFeed | null;
  onSaved: (feed: CustomFeed) => void;
  onDeleted?: (id: string) => void;
}

export default function CustomFeedModal({ open, onClose, editFeed, onSaved, onDeleted }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editors, setEditors] = useState<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const [editorSearch, setEditorSearch] = useState("");
  const [editorResults, setEditorResults] = useState<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const [searchingEditor, setSearchingEditor] = useState(false);
  const [editorError, setEditorError] = useState("");
  const followedProfiles = useRef<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const clearSearchTimer = () => { clearTimeout(searchTimer.current); searchTimer.current = undefined; };
  const [isPrivate, setIsPrivate] = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [search, setSearch] = useState("");
  const [allComms, setAllComms] = useState<Community[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const editorSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    getDocs(collection(db, "communities")).then((snap) => {
      setAllComms(
        snap.docs
          .map((d) => ({ name: d.data().name || d.id, img: d.data().img || "", members: d.data().memberCount || 0 }))
          .sort((a, b) => (b.members || 0) - (a.members || 0))
      );
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (editFeed) {
      setName(editFeed.name);
      setSelected(editFeed.communities);
      setEditors(editFeed.editors ? editFeed.editors.map((e: any) => typeof e === 'string' ? { uid: e, displayName: e, photoURL: '' } : e) : []);
      setIsPrivate(editFeed.isPrivate ?? false);
      setShowOnProfile(editFeed.showOnProfile ?? true);
    } else {
      setName(""); setSelected([]); setEditors([]); setIsPrivate(false); setShowOnProfile(true);
    }
    setSearch(""); setConfirmDelete(false); setEditorSearch(""); setEditorResults([]); setEditorError("");
  }, [editFeed, open]);

  useEffect(() => { if (open) setTimeout(() => nameRef.current?.focus(), 100); }, [open]);

  // Load followed user profiles for editor search
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
              profiles.push({
                uid: s.id,
                displayName: s.data().displayName || s.id,
                photoURL: s.data().photoURL || "",
              });
            }
          }
        }
        if (!cancelled) followedProfiles.current = profiles;
      } catch { /* silently fail */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Local search through followed profiles
  useEffect(() => {
    const q = editorSearch.trim().toLowerCase();
    if (q.length < 1) { setEditorResults([]); return; }
    setSearchingEditor(true);
    clearSearchTimer();
    searchTimer.current = setTimeout(() => {
      const results = followedProfiles.current.filter(
        (p) => p.displayName.toLowerCase().includes(q)
      ).slice(0, 8);
      setEditorResults(results);
      setSearchingEditor(false);
    }, 200);
    return () => clearSearchTimer();
  }, [editorSearch]);

  if (!open) return null;

  const filtered = search.trim()
    ? allComms.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allComms;

  const toggle = (n: string) => setSelected((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  const handleAddEditor = async (target: UserResult) => {
    if (editors.some((e) => e.uid === target.uid)) {
      setEditorError("هذا المستخدم مضاف مسبقاً");
      return;
    }
    setEditorError("");
    // Check following
    try {
      const followSnap = await getDoc(doc(db, "users", user!.uid, "following", target.uid));
      if (!followSnap.exists()) {
        setEditorError("لا يمكنك إضافة هذا المستخدم ما لم تقم بمتابعته أولاً");
        return;
      }
    } catch {
      setEditorError("حدث خطأ أثناء التحقق من المتابعة");
      return;
    }
    setEditors((p) => [...p, target]);
    setEditorSearch("");
    setEditorResults([]);
  };

  const removeEditor = (uid: string) => {
    setEditors((p) => p.filter((e) => e.uid !== uid));
    setEditorError("");
  };

  const save = async () => {
    if (!user || !name.trim() || !selected.length) return;
    setSaving(true);
    setEditorError("");
    try {
      const id = editFeed?.id || `feed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = Timestamp.now();
      const editorObjs = editors.map((e) => ({
        uid: e.uid,
        displayName: e.displayName,
        photoURL: e.photoURL,
      }));
      const editorUids = editorObjs.map((e) => e.uid);
      const centralData: Record<string, unknown> = {
        ownerId: user.uid,
        name: name.trim(),
        communities: selected,
        editors: editorObjs,
        editorUids,
        isPrivate,
        showOnProfile,
        showBannerBg: true,
        bannerUrl: editFeed?.bannerUrl ?? null,
        iconUrl: editFeed?.iconUrl ?? null,
        createdAt: editFeed?.createdAt || now,
      };

      const batch = writeBatch(db);
      batch.set(doc(db, "custom_feeds", id), centralData, { merge: true });

      const allUids = [...new Set([user.uid, ...editorUids])];
      const refBase = {
        id,
        name: name.trim(),
        communities: selected,
        isPrivate,
        showOnProfile,
        ownerId: user.uid,
        editors: editorObjs,
        editorUids,
        createdAt: editFeed?.createdAt || now,
      };
      for (const uid of allUids) {
        batch.set(doc(db, "users", uid, "customFeeds", id), {
          ...refBase,
          isEditor: uid !== user.uid,
        }, { merge: true });
      }

      if (editFeed) {
        try {
          const prev = await getDoc(doc(db, "custom_feeds", id));
          if (prev.exists()) {
            const oldUids = getEditorUidsFromFeedData(prev.data());
            for (const uid of oldUids) {
              if (!allUids.includes(uid)) {
                batch.delete(doc(db, "users", uid, "customFeeds", id));
              }
            }
          }
        } catch { /* ignore */ }
      }

      await batch.commit();

      const feed: CustomFeed = {
        id,
        name: name.trim(),
        communities: selected,
        isPrivate,
        showOnProfile,
        createdAt: editFeed?.createdAt || now,
        editors: editorObjs,
        ownerId: user.uid,
      };
      onSaved(feed);
      onClose();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!user || !editFeed) return;
    await Promise.all([
      deleteDoc(doc(db, "users", user.uid, "customFeeds", editFeed.id)).catch(() => {}),
      deleteDoc(doc(db, "custom_feeds", editFeed.id)).catch(() => {}),
    ]);
    onDeleted?.(editFeed.id);
    onClose();
  };

  const valid = name.trim().length > 0 && selected.length > 0;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      <div className="relative w-full max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-secondary)" }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid var(--border-secondary)" }}>
          <button onClick={onClose} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
            <ChevronRight size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0">
            <Rss size={13} className="text-nf-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-bold text-nf-text">{editFeed ? "تعديل الفيد" : "إنشاء فيد مخصص"}</h2>
            <p className="text-[10px] text-nf-dim">اجمع مجتمعات في خلاصة واحدة بدون متابعة رسمية</p>
          </div>
          {editFeed && (
            confirmDelete ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-nf-muted">حذف نهائياً؟</span>
                <button onClick={del} className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-[11px] font-bold hover:bg-red-500/25 transition-colors">حذف</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1 rounded-lg bg-nf-secondary text-nf-muted text-[11px] font-bold hover:bg-nf-hover transition-colors">إلغاء</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            )
          )}
        </div>

        {/* ── Body: two columns ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Right column: community picker */}
          <div className="flex-1 flex flex-col overflow-hidden px-4 py-4">
            <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-2.5 shrink-0">اختر المجتمعات</p>

            <div className="relative mb-2.5 shrink-0">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن أي مجتمع..."
                className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-8 pl-7 py-2 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
              {search && <button onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nf-dim hover:text-nf-text"><X size={11} /></button>}
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-nf-dim">لا توجد نتائج</div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {filtered.map((c) => {
                    const sel = selected.includes(c.name);
                    return (
                      <button key={c.name} onClick={() => toggle(c.name)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-right transition-all duration-100",
                          sel ? "border-nf-accent/35 bg-nf-accent/6" : "border-nf-border-2/40 hover:border-nf-border-2 hover:bg-nf-secondary/40"
                        )}>
                        {c.img ? (
                          <img src={c.img} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-nf-secondary border border-nf-border-2/50 flex items-center justify-center text-[8px] text-nf-accent font-bold shrink-0">n/</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] text-nf-text font-medium truncate">n/{c.name}</div>
                          {(c.members || 0) > 0 && (
                            <div className="text-[10px] text-nf-dim flex items-center gap-0.5 mt-0.5">
                              <Users size={8} />{c.members?.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                          sel ? "bg-nf-accent border-nf-accent" : "border-nf-border")}>
                          {sel && <Check size={9} className="text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Left column: settings */}
          <div className="w-[280px] shrink-0 flex flex-col overflow-y-auto px-4 py-4 gap-4"
            style={{ borderRight: "1px solid var(--border-secondary)" }}>

            {/* Name */}
            <div>
              <label className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">اسم الفيد</label>
              <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="مثال: تطوير ألعاب" maxLength={40}
                className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/50 transition-colors"
                onKeyDown={(e) => { if (e.key === "Enter" && valid) save(); }} />
              <div className="text-[10px] text-nf-dim mt-1 text-left">{name.length}/40</div>
            </div>

            {/* Selected list */}
            <div>
              <label className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">
                المختارة {selected.length > 0 && <span className="text-nf-accent">({selected.length})</span>}
              </label>
              {selected.length === 0 ? (
                <div className="rounded-xl border border-dashed border-nf-border-2/40 py-5 text-center">
                  <p className="text-[11px] text-nf-dim">اختر مجتمعات من اليسار</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[160px] overflow-y-auto">
                  {selected.map((s) => {
                    const c = allComms.find((x) => x.name === s);
                    return (
                      <div key={s} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-nf-secondary/50">
                        {c?.img ? <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                          : <div className="w-5 h-5 rounded-full bg-nf-accent/15 flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">n/</div>}
                        <span className="flex-1 text-[11px] text-nf-text truncate">n/{s}</span>
                        <button onClick={() => toggle(s)} className="text-nf-dim hover:text-red-400 transition-colors shrink-0"><X size={10} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Editors Section ── */}
            <div>
              <label className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UserPlus size={11} className="text-nf-muted" />
                إضافة محررين مشاركين (اختياري)
              </label>

              {/* Search input */}
              <div className="relative mb-2">
                <Search size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
                <input
                  ref={editorSearchRef}
                  type="text"
                  value={editorSearch}
                  onChange={(e) => setEditorSearch(e.target.value)}
                  placeholder="ابحث باسم المستخدم..."
                  className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-8 pl-3 py-2 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors"
                />
                {searchingEditor && <Loader2 size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nf-accent animate-spin" />}
              </div>

              {/* Search results dropdown */}
              {editorResults.length > 0 && (
                <div className="mb-2 rounded-xl overflow-hidden border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-secondary)" }}>
                  {editorResults.map((r) => (
                    <button
                      key={r.uid}
                      onClick={() => handleAddEditor(r)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-right text-[11px] text-nf-text hover:bg-nf-hover transition-colors"
                    >
                      {r.photoURL ? (
                        <img src={r.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-nf-accent/15 flex items-center justify-center text-[8px] text-nf-accent font-bold shrink-0">
                          {r.displayName[0]}
                        </div>
                      )}
                      <span className="flex-1 truncate">{r.displayName}</span>
                      <UserPlus size={10} className="text-nf-muted shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Error */}
              {editorError && (
                <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] leading-relaxed">
                  {editorError}
                </div>
              )}

              {/* Added editors chips */}
              {editors.length > 0 && (
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  {editors.map((e) => (
                    <div key={e.uid} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-nf-secondary/50">
                      {e.photoURL ? (
                        <img src={e.photoURL} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-nf-accent/15 flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">
                          {e.displayName[0]}
                        </div>
                      )}
                      <span className="flex-1 text-[11px] text-nf-text truncate">{e.displayName}</span>
                      <button onClick={() => removeEditor(e.uid)} className="text-nf-dim hover:text-red-400 transition-colors shrink-0">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy toggles */}
            <div className="space-y-0">
              <label className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-2 block">الخصوصية</label>

              {/* Private */}
              <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                <div className="flex items-center gap-2">
                  <Lock size={13} className="text-nf-muted shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-nf-text">خاص</div>
                    <div className="text-[10px] text-nf-dim">يظهر لك فقط</div>
                  </div>
                </div>
                <button onClick={() => setIsPrivate((p) => !p)}
                  className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0", isPrivate ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200", isPrivate ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              {/* Show on profile */}
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-nf-muted shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-nf-text">عرض في البروفايل</div>
                    <div className="text-[10px] text-nf-dim">يظهر للآخرين في صفحتك</div>
                  </div>
                </div>
                <button onClick={() => setShowOnProfile((p) => !p)}
                  className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0", showOnProfile ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200", showOnProfile ? "right-0.5" : "left-0.5")} />
                </button>
              </div>
            </div>

            {/* Save */}
            <div className="mt-auto">
              <button onClick={save} disabled={!valid || saving}
                className={cn("w-full py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2",
                  valid && !saving ? "bg-nf-accent text-white hover:opacity-90" : "bg-nf-secondary text-nf-dim cursor-not-allowed")}>
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? "جاري الحفظ..." : editFeed ? "حفظ التعديلات" : "إنشاء الفيد"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
