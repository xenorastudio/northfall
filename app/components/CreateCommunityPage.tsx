"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Globe, Lock, Eye, Check, X, Image, Users } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";

interface CreateCommunityPageProps {
  onBack: () => void;
  onSuccess: (communityName: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const TOPICS = [
  { id: "gamedev",     emoji: "🎮", label: "تطوير ألعاب" },
  { id: "gaming",      emoji: "🕹️", label: "ألعاب" },
  { id: "art3d",       emoji: "🎨", label: "فن وتصميم" },
  { id: "programming", emoji: "💻", label: "برمجة" },
  { id: "showcase",    emoji: "✨", label: "عرض مشاريع" },
  { id: "discussion",  emoji: "💬", label: "نقاشات" },
  { id: "tutorial",    emoji: "📚", label: "تعليم وشروحات" },
  { id: "news",        emoji: "📰", label: "أخبار وتقنية" },
  { id: "music",       emoji: "🎵", label: "موسيقى وصوتيات" },
  { id: "animation",   emoji: "🎬", label: "أنيميشن وفيديو" },
  { id: "hardware",    emoji: "🖥️", label: "أجهزة وهاردوير" },
  { id: "mobile",      emoji: "📱", label: "تطبيقات موبايل" },
  { id: "ai",          emoji: "🤖", label: "ذكاء اصطناعي" },
  { id: "security",    emoji: "🔐", label: "أمن معلومات" },
  { id: "science",     emoji: "🔬", label: "علوم وبحوث" },
  { id: "sports",      emoji: "⚽", label: "رياضة" },
  { id: "photography", emoji: "📷", label: "تصوير" },
  { id: "writing",     emoji: "✍️", label: "كتابة وقصص" },
  { id: "finance",     emoji: "💰", label: "مال وأعمال" },
  { id: "health",      emoji: "🏥", label: "صحة ولياقة" },
  { id: "travel",      emoji: "✈️", label: "سفر وسياحة" },
  { id: "food",        emoji: "🍕", label: "طعام وطبخ" },
  { id: "movies",      emoji: "🎥", label: "أفلام ومسلسلات" },
  { id: "books",       emoji: "📖", label: "كتب وقراءة" },
];

const COMMUNITY_TYPES = [
  { id: "public",     icon: Globe, label: "عام",   desc: "أي شخص يمكنه المشاهدة والمشاركة والتعليق" },
  { id: "restricted", icon: Eye,   label: "مقيد",  desc: "أي شخص يمكنه المشاهدة، لكن فقط الأعضاء المعتمدون يمكنهم المشاركة" },
  { id: "private",    icon: Lock,  label: "خاص",   desc: "فقط الأعضاء المعتمدون يمكنهم المشاهدة والمشاركة" },
];

const TOTAL_STEPS = 3;

export default function CreateCommunityPage({ onBack, onSuccess, showToast }: CreateCommunityPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);

  // Step 1
  const [selectedTopic, setSelectedTopic] = useState("");

  // Step 2
  const [communityType, setCommunityType] = useState("public");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [checkingName, setCheckingName] = useState(false);

  // Step 3
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [showInForum, setShowInForum] = useState(true);
  const [loading, setLoading] = useState(false);

  // Live name validation
  useEffect(() => {
    if (!name.trim()) { setNameError(""); return; }
    const nameRegex = /^[\u0600-\u06FFa-zA-Z0-9_]+$/;
    if (!nameRegex.test(name.trim())) {
      setNameError("حروف وأرقام وشرطة سفلية فقط، بدون مسافات");
      return;
    }
    if (name.trim().length < 3) { setNameError("3 أحرف على الأقل"); return; }
    if (name.trim().length > 32) { setNameError("الحد الأقصى 32 حرف"); return; }
    const timer = setTimeout(async () => {
      setCheckingName(true);
      try {
        const snap = await getDoc(doc(db, "communities", name.trim()));
        setNameError(snap.exists() ? "هذا الاسم مستخدم بالفعل" : "");
      } catch { }
      setCheckingName(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [name]);

  const goNext = () => {
    if (step === 1 && !selectedTopic) { showToast("اختر تصنيفاً أولاً", "error"); return; }
    if (step === 2) {
      if (!name.trim()) { showToast("أدخل اسم المجتمع", "error"); return; }
      if (nameError) { showToast("صحح اسم المجتمع أولاً", "error"); return; }
    }
    setStep(s => s + 1);
  };

  const handleCreate = async () => {
    if (!user) { showToast("يجب تسجيل الدخول أولاً", "error"); return; }
    setLoading(true);
    try {
      const cleanName = name.trim();
      const snap = await getDoc(doc(db, "communities", cleanName));
      if (snap.exists()) { showToast("هذا الاسم مستخدم بالفعل", "error"); setLoading(false); return; }

      await setDoc(doc(db, "communities", cleanName), {
        name: cleanName,
        label: `n/${cleanName}`,
        shortDesc: shortDesc.trim(),
        desc: shortDesc.trim() || `أهلاً بكم في مجتمع n/${cleanName}`,
        img: logoUrl.trim(),
        banner: bannerUrl.trim(),
        founded: new Date().getFullYear().toString(),
        rules: ["احترام الجميع وعدم الإساءة"],
        tags: [],
        bookmarks: [],
        stats: [],
        creatorUid: user.uid,
        creatorName: user.displayName || "مؤسس المجتمع",
        creatorPhoto: user.photoURL || "",
        createdAt: new Date().toISOString(),
        memberCount: 1,
        members: 0,
        category: selectedTopic,
        communityType,
        showInForum,
        modLevel: communityType === "private" ? "restrict" : communityType === "restricted" ? "moderate" : "open",
      });

      await setDoc(doc(db, "communities", cleanName, "members", user.uid), {
        uid: user.uid, joinedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "users", user.uid, "communities", cleanName), {
        name: cleanName, joinedAt: new Date().toISOString(),
      });

      showToast(`تم إنشاء مجتمع n/${cleanName} بنجاح!`, "success");
      onSuccess(cleanName);
    } catch (e: any) {
      showToast(`حدث خطأ: ${e?.message || "حاول مرة أخرى"}`, "error");
    }
    setLoading(false);
  };

  const topicLabel = TOPICS.find(t => t.id === selectedTopic)?.label || "";
  const topicEmoji = TOPICS.find(t => t.id === selectedTopic)?.emoji || "";

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-6" style={{ direction: "rtl" }}>
      {/* Progress header */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={step === 1 ? onBack : () => setStep(s => s - 1)}
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

      {/* ── Step 1: Topic ── */}
      {step === 1 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">عن ماذا سيكون مجتمعك؟</h2>
          <p className="text-[12px] text-nf-dim mb-5">اختر تصنيفاً يساعد الأعضاء على اكتشاف مجتمعك</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setSelectedTopic(t.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-semibold transition-all",
                  selectedTopic === t.id
                    ? "border-nf-accent bg-nf-accent/10 text-nf-text"
                    : "border-nf-border-2 text-nf-muted hover:border-nf-accent/40 hover:text-nf-text"
                )}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                {selectedTopic === t.id && <Check size={11} className="text-nf-accent" />}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 transition-colors">
              التالي <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Type + Name ── */}
      {step === 2 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">ما نوع مجتمعك؟</h2>
          <p className="text-[12px] text-nf-dim mb-5">حدد من يمكنه المشاهدة والمشاركة</p>

          <div className="space-y-2 mb-6">
            {COMMUNITY_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button key={type.id} onClick={() => setCommunityType(type.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-right transition-all",
                    communityType === type.id ? "border-nf-accent/50 bg-nf-secondary" : "border-nf-border-2 hover:border-nf-accent/20"
                  )}>
                  <Icon size={18} className={communityType === type.id ? "text-nf-accent shrink-0" : "text-nf-dim shrink-0"} />
                  <div className="flex-1">
                    <p className={cn("text-[13px] font-bold", communityType === type.id ? "text-nf-text" : "text-nf-muted")}>{type.label}</p>
                    <p className="text-[11px] text-nf-dim mt-0.5">{type.desc}</p>
                  </div>
                  <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                    communityType === type.id ? "border-nf-accent" : "border-nf-border")}>
                    {communityType === type.id && <div className="w-2 h-2 rounded-full bg-nf-accent" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Name */}
          <div className="mb-6">
            <label className="text-[12px] font-bold text-nf-text block mb-2">
              اسم المجتمع <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-nf-accent font-mono">n/</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسم_المجتمع"
                className={cn(
                  "w-full !bg-nf-secondary border rounded-xl pr-9 pl-10 py-3 text-[13px] text-nf-text placeholder:text-nf-dim/50 outline-none transition-all font-mono",
                  nameError ? "border-red-500/60" : "border-nf-border-2 focus:border-nf-accent"
                )} />
              {checkingName && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] text-nf-dim animate-pulse">جاري التحقق...</span>}
              {!checkingName && name && !nameError && <Check size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400" />}
            </div>
            {nameError
              ? <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1"><X size={11} /> {nameError}</p>
              : <p className="text-[10px] text-nf-dim mt-1.5">الاسم لا يمكن تغييره بعد الإنشاء · حروف وأرقام وشرطة سفلية فقط</p>
            }
          </div>

          <div className="flex justify-end">
            <button onClick={goNext} disabled={!!nameError || !name.trim() || checkingName}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              التالي <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Identity + Description ── */}
      {step === 3 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[20px] font-bold text-nf-text">هوية مجتمعك</h2>
            <button onClick={() => setPreviewMode(p => !p)}
              className={cn("text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all",
                previewMode ? "bg-nf-accent/10 text-nf-accent border-nf-accent/30" : "text-nf-dim border-nf-border-2 hover:text-nf-text")}>
              {previewMode ? "✏️ تعديل" : "👁 معاينة"}
            </button>
          </div>
          <p className="text-[12px] text-nf-dim mb-5">أضف صورة وبانر ووصف لمجتمعك (اختياري)</p>

          {previewMode ? (
            /* ── Preview ── */
            <div className="rounded-xl border border-nf-border-2 mb-6">
              {/* Banner */}
              <div className="relative h-[130px] rounded-t-xl overflow-hidden">
                {bannerUrl
                  ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display="none")} />
                  : <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
                }
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-nf-card to-transparent" />
              </div>
              {/* Info below banner */}
              <div className="bg-nf-card rounded-b-xl px-4 pb-4">
                <div className="flex items-end gap-3 -mt-6 mb-2">
                  {logoUrl
                    ? <img src={logoUrl} alt="" className="w-12 h-12 rounded-full border-[3px] border-nf-card object-cover shrink-0 shadow-lg" onError={e => (e.currentTarget.style.display="none")} />
                    : <div className="w-12 h-12 rounded-full border-[3px] border-nf-card bg-gradient-to-br from-nf-accent/40 to-nf-secondary flex items-center justify-center text-nf-accent font-black text-sm shrink-0 shadow-lg">n/</div>
                  }
                  <div className="flex-1 pb-0.5">
                    <p className="text-[14px] font-black text-nf-text">n/{name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-nf-dim">
                      <span className="flex items-center gap-1"><Users size={9} /> 1 عضو</span>
                      {topicEmoji && <span>{topicEmoji} {topicLabel}</span>}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-nf-accent text-nf-primary text-[11px] font-bold mb-0.5">انضم</span>
                </div>
                {shortDesc && <p className="text-[11px] text-nf-muted leading-relaxed">{shortDesc}</p>}
              </div>
            </div>
          ) : (
            /* ── Edit fields ── */
            <div className="space-y-4 mb-6">
              {/* Logo */}
              <div>
                <label className="text-[12px] font-bold text-nf-text block mb-1.5">
                  <Image size={12} className="inline ml-1" />
                  رابط صورة الشعار
                </label>
                <div className="flex items-center gap-2">
                  <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 !bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors font-mono" />
                  {logoUrl && (
                    <img src={logoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-nf-border-2 shrink-0"
                      onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                </div>
                <p className="text-[10px] text-nf-dim mt-1">صورة دائرية للمجتمع · يفضل 512×512</p>
              </div>

              {/* Banner */}
              <div>
                <label className="text-[12px] font-bold text-nf-text block mb-1.5">
                  <Image size={12} className="inline ml-1" />
                  رابط صورة البانر
                </label>
                <input type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors font-mono" />
                {bannerUrl && (
                  <div className="mt-2 h-[60px] rounded-lg overflow-hidden border border-nf-border-2">
                    <img src={bannerUrl} alt="" className="w-full h-full object-cover"
                      onError={e => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
                <p className="text-[10px] text-nf-dim mt-1">صورة الغلاف العريضة · يفضل 1200×400</p>
              </div>

              {/* Short description */}
              <div>
                <label className="text-[12px] font-bold text-nf-text block mb-1.5">وصف المجتمع</label>
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)}
                  placeholder="اكتب وصفاً مختصراً يعرّف بمجتمعك..."
                  rows={3}
                  className="w-full !bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors resize-none leading-relaxed" />
                <p className="text-[10px] text-nf-dim mt-1">{shortDesc.length} / 300 حرف</p>
              </div>

              {/* Show in forum toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-nf-border-2 bg-nf-secondary/30">
                <div>
                  <p className="text-[13px] font-bold text-nf-text">الظهور في المنتدى</p>
                  <p className="text-[11px] text-nf-dim mt-0.5">يظهر مجتمعك في قائمة المجتمعات للجميع</p>
                </div>
                <button onClick={() => setShowInForum(p => !p)}
                  className={cn("w-11 h-6 rounded-full transition-all relative shrink-0",
                    showInForum ? "bg-nf-accent" : "bg-nf-border-2")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                    showInForum ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleCreate} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {loading ? "جاري الإنشاء..." : "إنشاء المجتمع ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
