"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Check, Rss, Trash2, Lock, Globe, Loader2, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, serverTimestamp } from "firebase/firestore";
import type { CustomFeed } from "./CustomFeedModal";

interface Community { name: string; img?: string; members?: number; }

interface Props {
  editFeed?: CustomFeed | null;
  onBack: () => void;
  onSaved: (feed: CustomFeed) => void;
  onDeleted?: (id: string) => void;
}

export default function CustomFeedPage({ editFeed, onBack, onSaved, onDeleted }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [search, setSearch] = useState("");
  const [allComms, setAllComms] = useState<Community[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocs(collection(db, "communities")).then((snap) => {
      setAllComms(
        snap.docs
          .map((d) => ({ name: d.data().name || d.id, img: d.data().img || "", members: d.data().memberCount || 0 }))
          .sort((a, b) => (b.members || 0) - (a.members || 0))
      );
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (editFeed) {
      setName(editFeed.name);
      setSelected(editFeed.communities);
      setIsPrivate(editFeed.isPrivate ?? false);
      setShowOnProfile(editFeed.showOnProfile ?? true);
    } else {
      setName(""); setSelected([]); setIsPrivate(false); setShowOnProfile(true);
    }
    setTimeout(() => nameRef.current?.focus(), 150);
  }, [editFeed]);

  const filtered = search.trim()
    ? allComms.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allComms;

  const toggle = (n: string) => setSelected((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  const save = async () => {
    if (!user || !name.trim() || !selected.length) return;
    setSaving(true);
    try {
      const id = editFeed?.id || `feed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const data: CustomFeed = {
        id, name: name.trim(), communities: selected, isPrivate, showOnProfile,
        createdAt: editFeed?.createdAt || new Date().toISOString(),
        ownerUid: user.uid,
      } as CustomFeed;
      await setDoc(doc(db, "users", user.uid, "customFeeds", id), { ...data, updatedAt: serverTimestamp() });
      onSaved(data);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!user || !editFeed) return;
    await deleteDoc(doc(db, "users", user.uid, "customFeeds", editFeed.id)).catch(() => {});
    onDeleted?.(editFeed.id);
  };

  const valid = name.trim().length > 0 && selected.length > 0;

  return (
    // Centered modal overlay
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ direction: "rtl" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onBack} />

      {/* Modal */}
      <div className="relative w-full max-w-[460px] max-h-[88vh] flex flex-col rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-secondary)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-secondary)" }}>
          <div className="flex items-center gap-2.5">
            <Rss size={16} className="text-nf-accent" />
            <div>
              <h2 className="text-[15px] font-bold text-nf-text">
                {editFeed ? "تعديل الفيد" : "فيد مخصص جديد"}
              </h2>
              <p className="text-[11px] text-nf-dim">اجمع مجتمعات في خلاصة واحدة</p>
            </div>
          </div>
          <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-5 mt-4 px-3.5 py-2.5 rounded-xl bg-nf-secondary/40 flex items-start gap-2.5 shrink-0">
          <Info size={13} className="text-nf-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-nf-dim leading-relaxed">
            الفيد المخصص يجمع منشورات مجتمعات مختارة في خلاصة واحدة — بدون متابعة رسمية لهم
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-nf-dim uppercase tracking-wider mb-1.5 block">اسم الفيد</label>
            <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="مثال: تطوير ألعاب" maxLength={40}
              className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl px-3.5 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/50 transition-colors"
              onKeyDown={(e) => { if (e.key === "Enter" && valid) save(); }} />
            <div className="text-[10px] text-nf-dim mt-1 text-left">{name.length}/40</div>
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-nf-dim uppercase tracking-wider mb-2 block">
                المختارة <span className="text-nf-accent">({selected.length})</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selected.map((s) => {
                  const c = allComms.find((x) => x.name === s);
                  return (
                    <button key={s} onClick={() => toggle(s)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-nf-accent/15 text-nf-accent border border-nf-accent/25 hover:bg-red-500/15 hover:text-red-400 hover:border-red-400/25 transition-all">
                      {c?.img && <img src={c.img} alt="" className="w-3 h-3 rounded-full object-cover" />}
                      n/{s} <X size={9} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search communities */}
          <div>
            <label className="text-[11px] font-semibold text-nf-dim uppercase tracking-wider mb-2 block">اختر المجتمعات</label>
            <div className="relative mb-2">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن أي مجتمع..."
                className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-8 pl-7 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
              {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-nf-dim hover:text-nf-text"><X size={11} /></button>}
            </div>
            <div className="max-h-[240px] overflow-y-auto rounded-xl border border-nf-border-2/40 bg-nf-secondary/10">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-nf-dim">لا توجد نتائج</div>
              ) : filtered.map((c) => {
                const sel = selected.includes(c.name);
                return (
                  <button key={c.name} onClick={() => toggle(c.name)}
                    className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 text-right transition-colors border-b border-nf-border-2/15 last:border-0",
                      sel ? "bg-nf-accent/8" : "hover:bg-nf-secondary/50")}>
                    {c.img ? <img src={c.img} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      : <div className="w-7 h-7 rounded-full bg-nf-secondary border border-nf-border-2/50 flex items-center justify-center text-[8px] text-nf-accent font-bold shrink-0">n/</div>}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-nf-text font-medium truncate">n/{c.name}</div>
                      {(c.members || 0) > 0 && <div className="text-[10px] text-nf-dim flex items-center gap-0.5"><Users size={8} />{c.members?.toLocaleString()}</div>}
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                      sel ? "bg-nf-accent border-nf-accent" : "border-nf-border")}>
                      {sel && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy */}
          <div className="rounded-xl border border-nf-border-2/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-nf-border-2/20">
              <div className="flex items-center gap-2.5">
                <Lock size={13} className="text-nf-muted shrink-0" />
                <div>
                  <div className="text-[13px] font-medium text-nf-text">خاص</div>
                  <div className="text-[11px] text-nf-dim">يظهر لك فقط</div>
                </div>
              </div>
              <button onClick={() => setIsPrivate((p) => !p)}
                className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0", isPrivate ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200", isPrivate ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <Globe size={13} className="text-nf-muted shrink-0" />
                <div>
                  <div className="text-[13px] font-medium text-nf-text">عرض في البروفايل</div>
                  <div className="text-[11px] text-nf-dim">يظهر للآخرين في صفحتك</div>
                </div>
              </div>
              <button onClick={() => setShowOnProfile((p) => !p)}
                className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0", showOnProfile ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200", showOnProfile ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 shrink-0 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border-secondary)" }}>
          {editFeed && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[11px] text-nf-muted">حذف نهائياً؟</span>
              <button onClick={del} className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-[11px] font-bold hover:bg-red-500/25 transition-colors">حذف</button>
              <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1 rounded-lg bg-nf-secondary text-nf-muted text-[11px] font-bold hover:bg-nf-hover transition-colors">إلغاء</button>
            </div>
          )}
          {!confirmDelete && (
            <>
              <div className="flex-1" />
              <button onClick={onBack} className="px-4 py-2 rounded-xl text-[12px] font-medium text-nf-muted hover:bg-nf-hover transition-colors">إلغاء</button>
              <button onClick={save} disabled={!valid || saving}
                className={cn("px-5 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2",
                  valid && !saving ? "bg-nf-accent text-white hover:opacity-90" : "bg-nf-secondary text-nf-dim cursor-not-allowed")}>
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? "جاري الحفظ..." : editFeed ? "حفظ" : "إنشاء"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
