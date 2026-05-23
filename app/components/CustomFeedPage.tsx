"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Check, Rss, Trash2, Lock, Globe, Loader2, ChevronRight, Users } from "lucide-react";
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
    setTimeout(() => nameRef.current?.focus(), 100);
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
      const data: CustomFeed = { id, name: name.trim(), communities: selected, isPrivate, showOnProfile, createdAt: editFeed?.createdAt || new Date().toISOString() };
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
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
          <ChevronRight size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center shrink-0">
          <Rss size={16} className="text-nf-accent" />
        </div>
        <div className="flex-1">
          <h1 className="text-[20px] font-black text-nf-text">{editFeed ? "تعديل الفيد" : "إنشاء فيد مخصص"}</h1>
          <p className="text-[12px] text-nf-dim">اجمع مجتمعات في خلاصة واحدة بدون متابعة رسمية</p>
        </div>
        {editFeed && (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-nf-muted">حذف نهائياً؟</span>
              <button onClick={del} className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-[12px] font-bold hover:bg-red-500/25 transition-colors">حذف</button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg bg-nf-secondary text-nf-muted text-[12px] font-bold hover:bg-nf-hover transition-colors">إلغاء</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={16} />
            </button>
          )
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* Right: community picker */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">اختر المجتمعات</p>

          <div className="relative mb-3">
            <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن أي مجتمع..."
              className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-9 pl-8 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
            {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-nf-dim hover:text-nf-text"><X size={12} /></button>}
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-nf-dim">لا توجد نتائج</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((c) => {
                const sel = selected.includes(c.name);
                return (
                  <button key={c.name} onClick={() => toggle(c.name)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-3 rounded-xl border text-right transition-all duration-100",
                      sel ? "border-nf-accent/40 bg-nf-accent/8" : "border-nf-border-2/40 hover:border-nf-border-2 hover:bg-nf-secondary/40"
                    )}>
                    {c.img ? (
                      <img src={c.img} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-nf-secondary border border-nf-border-2/50 flex items-center justify-center text-[9px] text-nf-accent font-bold shrink-0">n/</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-nf-text font-medium truncate">n/{c.name}</div>
                      {(c.members || 0) > 0 && (
                        <div className="text-[10px] text-nf-dim flex items-center gap-0.5 mt-0.5">
                          <Users size={8} />{c.members?.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                      sel ? "bg-nf-accent border-nf-accent" : "border-nf-border")}>
                      {sel && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Left: settings panel */}
        <div className="w-[300px] shrink-0 sticky top-[calc(var(--nav-total-height)+16px)] space-y-5">

          {/* Name */}
          <div>
            <label className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-2 block">اسم الفيد</label>
            <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="مثال: تطوير ألعاب" maxLength={40}
              className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl px-3.5 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/50 transition-colors"
              onKeyDown={(e) => { if (e.key === "Enter" && valid) save(); }} />
            <div className="text-[10px] text-nf-dim mt-1 text-left">{name.length}/40</div>
          </div>

          {/* Selected */}
          <div>
            <label className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-2 block">
              المختارة {selected.length > 0 && <span className="text-nf-accent">({selected.length})</span>}
            </label>
            {selected.length === 0 ? (
              <div className="rounded-xl border border-dashed border-nf-border-2/40 py-6 text-center">
                <p className="text-[12px] text-nf-dim">اختر مجتمعات من اليسار</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {selected.map((s) => {
                  const c = allComms.find((x) => x.name === s);
                  return (
                    <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nf-secondary/50">
                      {c?.img ? <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        : <div className="w-5 h-5 rounded-full bg-nf-accent/15 flex items-center justify-center text-[7px] text-nf-accent font-bold shrink-0">n/</div>}
                      <span className="flex-1 text-[12px] text-nf-text truncate">n/{s}</span>
                      <button onClick={() => toggle(s)} className="text-nf-dim hover:text-red-400 transition-colors shrink-0"><X size={11} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className="space-y-0 rounded-xl border border-nf-border-2/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-nf-border-2/30">
              <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">الخصوصية</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-nf-border-2/20">
              <div className="flex items-center gap-2.5">
                <Lock size={14} className="text-nf-muted shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-nf-text">خاص</div>
                  <div className="text-[11px] text-nf-dim">يظهر لك فقط</div>
                </div>
              </div>
              <button onClick={() => setIsPrivate((p) => !p)}
                className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0", isPrivate ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200", isPrivate ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <Globe size={14} className="text-nf-muted shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-nf-text">عرض في البروفايل</div>
                  <div className="text-[11px] text-nf-dim">يظهر للآخرين في صفحتك</div>
                </div>
              </div>
              <button onClick={() => setShowOnProfile((p) => !p)}
                className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0", showOnProfile ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200", showOnProfile ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
          </div>

          {/* Save */}
          <button onClick={save} disabled={!valid || saving}
            className={cn("w-full py-3 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2",
              valid && !saving ? "bg-nf-accent text-white hover:opacity-90" : "bg-nf-secondary text-nf-dim cursor-not-allowed")}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "جاري الحفظ..." : editFeed ? "حفظ التعديلات" : "إنشاء الفيد"}
          </button>
        </div>
      </div>
    </div>
  );
}
