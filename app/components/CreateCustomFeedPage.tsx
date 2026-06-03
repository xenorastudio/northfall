"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Check, X, Search, Loader2, Users, UserPlus, Globe, Lock, Eye } from "lucide-react";
import { BannerAppearanceField } from "./CommunityMediaFields";
import {
  DEFAULT_MEDIA_POSITION,
  positionToCss,
  type MediaPosition,
} from "@/lib/media-object-position";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, writeBatch, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { createSharedFeed, addEditor, isUserFollowing } from "@/lib/shared-custom-feeds";

interface CreateCustomFeedPageProps {
  onBack: () => void;
  onSuccess: (feed: { id: string; name: string; communities: string[] }) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

interface Community {
  name: string;
  img?: string;
  members?: number;
}

const TOTAL_STEPS = 4;

const PRIVACY_OPTIONS = [
  { id: "public", icon: Globe, label: "عام", desc: "الكل يشوف الفيد المخصص" },
  { id: "private", icon: Lock, label: "خاص", desc: "فيك انت والمحررين تشوفوه" },
];

export default function CreateCustomFeedPage({ onBack, onSuccess, showToast }: CreateCustomFeedPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 - Name & Icon
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  // Step 2 - Communities
  const [allComms, setAllComms] = useState<Community[]>([]);
  const [selectedComms, setSelectedComms] = useState<string[]>([]);
  const [commSearch, setCommSearch] = useState("");

  // Step 3 - Editors & Privacy
  const [editorSearch, setEditorSearch] = useState("");
  const [editorResults, setEditorResults] = useState<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const [searchingEditor, setSearchingEditor] = useState(false);
  const [editors, setEditors] = useState<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const [editorError, setEditorError] = useState("");
  const followedProfiles = useRef<{ uid: string; displayName: string; photoURL: string }[]>([]);
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const clearSearchTimer = () => { clearTimeout(searchTimer.current); searchTimer.current = undefined; };
  const [isPrivate, setIsPrivate] = useState(false);

  // Step 4 - Banner & Create
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerPosition, setBannerPosition] = useState<MediaPosition>({ ...DEFAULT_MEDIA_POSITION });
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load communities
  useEffect(() => {
    getDocs(collection(db, "communities")).then((snap) => {
      setAllComms(
        snap.docs
          .map((d) => ({ name: d.data().name || d.id, img: d.data().img || "", members: d.data().memberCount || 0 }))
          .sort((a, b) => (b.members || 0) - (a.members || 0))
      );
    }).catch(() => {});
  }, []);

  // Load followed profiles for editor search
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
        if (!cancelled) followedProfiles.current = profiles;
      } catch { /* silent */ }
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
      const results = followedProfiles.current.filter((p) => p.displayName.toLowerCase().includes(q)).slice(0, 8);
      setEditorResults(results);
      setSearchingEditor(false);
    }, 200);
    return () => clearSearchTimer();
  }, [editorSearch]);

  const filteredComms = commSearch.trim()
    ? allComms.filter((c) => c.name.toLowerCase().includes(commSearch.toLowerCase()))
    : allComms;

  const toggleCommunity = (name: string) => {
    setSelectedComms((prev) => prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]);
  };

  const addEditorFromSearch = (profile: { uid: string; displayName: string; photoURL: string }) => {
    if (editors.find((e) => e.uid === profile.uid)) { setEditorError("هذا المستخدم موجود بالفعل"); return; }
    if (profile.uid === user?.uid) { setEditorError("لا يمكنك إضافة نفسك"); return; }
    setEditors((prev) => [...prev, profile]);
    setEditorSearch("");
    setEditorResults([]);
    setEditorError("");
  };

  const removeEditorFromList = (uid: string) => {
    setEditors((prev) => prev.filter((e) => e.uid !== uid));
  };

  const goNext = () => {
    if (step === 1) {
      if (!name.trim()) { showToast("أدخل اسم الفيد المخصص", "error"); return; }
      if (name.trim().length < 2) { showToast("الاسم قصير جداً (حرفين على الأقل)", "error"); return; }
    }
    if (step === 2) {
      if (selectedComms.length === 0) { showToast("اختر مجتمعاً واحداً على الأقل", "error"); return; }
    }
    setStep((s) => s + 1);
  };

  const handleCreate = async () => {
    if (!user) { showToast("يجب تسجيل الدخول أولاً", "error"); return; }
    setLoading(true);
    try {
      const feedId = await createSharedFeed(user.uid, {
        name: name.trim(),
        communities: selectedComms,
        isPrivate,
        showOnProfile,
        bannerUrl: bannerUrl.trim() || undefined,
        bannerPosition: bannerUrl.trim() ? positionToCss(bannerPosition) : undefined,
        iconUrl: iconUrl.trim() || undefined,
        editors: editors.map((e) => e.uid),
      }, editors);

      showToast("تم إنشاء الفيد المخصص بنجاح!", "success");
      onSuccess({ id: feedId, name: name.trim(), communities: selectedComms });
    } catch (e: any) {
      showToast(`حدث خطأ: ${e?.message || "حاول مرة أخرى"}`, "error");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-6" style={{ direction: "rtl" }}>
      {/* Progress header */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={step === 1 ? onBack : () => setStep((s) => s - 1)}
          className="flex items-center gap-1.5 text-nf-dim hover:text-nf-text text-[12px] transition-colors shrink-0"
        >
          <ArrowRight size={15} /> {step === 1 ? "رجوع" : "السابق"}
        </button>
        <div className="flex-1 flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i < step ? "bg-nf-accent" : "bg-nf-border-2")} />
          ))}
        </div>
        <span className="text-[11px] text-nf-dim shrink-0">{step} / {TOTAL_STEPS}</span>
      </div>

      {/* ── Step 1: Name & Icon ── */}
      {step === 1 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">اسم الفيد المخصص</h2>
          <p className="text-[12px] text-nf-dim mb-5">اختر اسماً يعبر عن محتوى الفيد</p>

          <div className="mb-5">
            <label className="text-[12px] font-bold text-nf-text block mb-2">
              الاسم <span className="text-red-400">*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: ألعابي المفضلة"
              className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-3 text-[13px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors" />
            <p className="text-[10px] text-nf-dim mt-1.5">{name.length} حرف · حرفين على الأقل</p>
          </div>

          <div className="mb-5">
            <label className="text-[12px] font-bold text-nf-text block mb-1.5">
              رابط صورة الأيقونة (اختياري)
            </label>
            <div className="flex items-center gap-2">
              <input type="text" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://example.com/icon.png"
                className="flex-1 !bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors font-mono" />
              {iconUrl && (
                <img src={iconUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-nf-border-2 shrink-0"
                  onError={(e) => { (e.currentTarget.style.display = "none") }} />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={goNext} disabled={!name.trim() || name.trim().length < 2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              التالي <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Choose Communities ── */}
      {step === 2 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">اختر المجتمعات</h2>
          <p className="text-[12px] text-nf-dim mb-5">اختر المجتمعات اللي تظهر في الفيد المخصص</p>

          <div className="relative mb-4">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim" />
            <input type="text" value={commSearch} onChange={(e) => setCommSearch(e.target.value)}
              placeholder="ابحث عن مجتمع..."
              className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl pr-9 pl-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors" />
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-1 mb-5">
            {filteredComms.map((c) => {
              const isSelected = selectedComms.includes(c.name);
              return (
                <button key={c.name} onClick={() => toggleCommunity(c.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all",
                    isSelected ? "bg-nf-accent/10 border border-nf-accent/30" : "border border-transparent hover:bg-nf-hover"
                  )}>
                  {c.img ? (
                    <img src={c.img} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center text-[10px] font-bold text-nf-dim shrink-0">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-right">
                    <p className={cn("text-[12px] font-bold", isSelected ? "text-nf-text" : "text-nf-muted")}>{c.name}</p>
                    <p className="text-[10px] text-nf-dim">{c.members || 0} عضو</p>
                  </div>
                  <div className={cn("w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all",
                    isSelected ? "bg-nf-accent border-nf-accent" : "border-nf-border")}>
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-nf-dim">تم اختيار {selectedComms.length} مجتمع</span>
            <button onClick={goNext} disabled={selectedComms.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              التالي <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Editors + Privacy ── */}
      {step === 3 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">المحررون والخصوصية</h2>
          <p className="text-[12px] text-nf-dim mb-5">أضف محررين مشاركين وحدد خصوصية الفيد</p>

          {/* Editor search */}
          <div className="mb-5">
            <label className="text-[12px] font-bold text-nf-text block mb-1.5">
              <UserPlus size={12} className="inline ml-1" />
              أضف محررين (اختياري)
            </label>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim" />
              <input
                ref={(el) => { if (el) { } }}
                type="text" value={editorSearch} onChange={(e) => setEditorSearch(e.target.value)}
                placeholder="ابحث عن مستخدم تتابعه..."
                className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl pr-9 pl-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors" />
              {searchingEditor && <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nf-dim animate-spin" />}
            </div>
            {editorError && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><X size={11} /> {editorError}</p>}

            {editorResults.length > 0 && (
              <div className="mt-2 border border-nf-border-2 rounded-xl overflow-hidden">
                {editorResults.map((r) => (
                  <button key={r.uid} onClick={() => { addEditorFromSearch(r); setEditorError(""); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right hover:bg-nf-hover transition-colors">
                    {r.photoURL ? (
                      <img src={r.photoURL} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center text-[10px] font-bold text-nf-dim shrink-0">
                        {r.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 text-[12px] font-medium text-nf-text">{r.displayName}</span>
                    <UserPlus size={12} className="text-nf-accent shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Editor chips */}
            {editors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {editors.map((e) => (
                  <span key={e.uid} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nf-accent/10 text-[11px] font-medium text-nf-text">
                    {e.displayName}
                    <button onClick={() => removeEditorFromList(e.uid)} className="hover:text-red-400 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-nf-dim mt-1.5">فقط المستخدمين اللي تتابعهم تظهر في البحث</p>
          </div>

          {/* Privacy toggle */}
          <div className="space-y-2 mb-5">
            <label className="text-[12px] font-bold text-nf-text block mb-1.5">الخصوصية</label>
            {PRIVACY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button key={opt.id} onClick={() => setIsPrivate(opt.id === "private")}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-xl border text-right transition-all",
                    (isPrivate && opt.id === "private") || (!isPrivate && opt.id === "public")
                      ? "border-nf-accent/50 bg-nf-secondary" : "border-nf-border-2 hover:border-nf-accent/20"
                  )}>
                  <Icon size={18} className={(isPrivate && opt.id === "private") || (!isPrivate && opt.id === "public") ? "text-nf-accent shrink-0" : "text-nf-dim shrink-0"} />
                  <div className="flex-1">
                    <p className={cn("text-[13px] font-bold", (isPrivate && opt.id === "private") || (!isPrivate && opt.id === "public") ? "text-nf-text" : "text-nf-muted")}>{opt.label}</p>
                    <p className="text-[11px] text-nf-dim mt-0.5">{opt.desc}</p>
                  </div>
                  <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                    (isPrivate && opt.id === "private") || (!isPrivate && opt.id === "public") ? "border-nf-accent" : "border-nf-border")}>
                    {((isPrivate && opt.id === "private") || (!isPrivate && opt.id === "public")) && <div className="w-2 h-2 rounded-full bg-nf-accent" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 transition-colors">
              التالي <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Banner + Preview + Create ── */}
      {step === 4 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">اللمسات الأخيرة</h2>
          <p className="text-[12px] text-nf-dim mb-5">أضف بانر وحدد إعدادات الظهور</p>

          <div className="space-y-4 mb-6">
            <BannerAppearanceField
              bannerUrl={bannerUrl}
              bannerPosition={bannerPosition}
              onBannerUrlChange={setBannerUrl}
              onBannerPositionChange={setBannerPosition}
            />

            {/* Show on profile toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-nf-border-2 bg-nf-secondary/30">
              <div>
                <p className="text-[13px] font-bold text-nf-text">الظهور في البروفايل</p>
                <p className="text-[11px] text-nf-dim mt-0.5">يظهر الفيد في صفحة ملفك الشخصي</p>
              </div>
              <button onClick={() => setShowOnProfile((p) => !p)}
                className={cn("w-11 h-6 rounded-full transition-all relative shrink-0", showOnProfile ? "bg-nf-accent" : "bg-nf-border-2")}>
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", showOnProfile ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl border border-nf-border-2 bg-nf-secondary/20">
              <p className="text-[13px] font-bold text-nf-text mb-2">ملخص الفيد</p>
              <div className="space-y-1.5 text-[11px] text-nf-muted">
                <p>الاسم: <span className="text-nf-text font-medium">{name.trim()}</span></p>
                <p>المجتمعات: <span className="text-nf-text font-medium">{selectedComms.length}</span></p>
                <p>المحررون: <span className="text-nf-text font-medium">{editors.length}</span></p>
                <p>الخصوصية: <span className="text-nf-text font-medium">{isPrivate ? "خاص" : "عام"}</span></p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleCreate} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {loading ? <><Loader2 size={14} className="animate-spin" /> جاري الإنشاء...</> : "إنشاء الفيد ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
