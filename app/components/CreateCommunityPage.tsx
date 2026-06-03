"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Globe, Lock, Eye, Check, X, Image, Users } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { cn } from "@/lib/utils";
import { COMMUNITY_CATEGORIES, categoryToStoreValue } from "@/lib/community-categories";
import {
  buildCommunityTagsField,
  saveExplicitInterestsFromCategory,
} from "@/lib/user-interests";
import {
  canonicalCommunityId,
  firstAvailableCommunityNames,
  isCommunityNameTaken,
  normalizeCommunityNameKey,
} from "@/lib/community-name";
import CommunityMediaFields from "./CommunityMediaFields";
import {
  DEFAULT_MEDIA_POSITION,
  positionToCss,
  type MediaPosition,
} from "@/lib/media-object-position";

interface CreateCommunityPageProps {
  onBack: () => void;
  onSuccess: (communityName: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const COMMUNITY_TYPES = [
  { id: "public",     icon: Globe, label: "عام",   desc: "أي شخص يمكنه المشاهدة والمشاركة والتعليق" },
  { id: "restricted", icon: Eye,   label: "مقيد",  desc: "أي شخص يمكنه المشاهدة، لكن فقط المشرفين يمكنهم المشاركة" },
  { id: "private",    icon: Lock,  label: "خاص",   desc: "فقط الأعضاء المعتمدون يمكنهم المشاهدة والمشاركة" },
];

const TOTAL_STEPS = 3;

export default function CreateCommunityPage({ onBack, onSuccess, showToast }: CreateCommunityPageProps) {
  const { user } = useAuth();
  const { communities: allComms } = useData();
  const [step, setStep] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [communityType, setCommunityType] = useState("public");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameConflictId, setNameConflictId] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [checkingName, setCheckingName] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoPosition, setLogoPosition] = useState<MediaPosition>({ ...DEFAULT_MEDIA_POSITION });
  const [bannerPosition, setBannerPosition] = useState<MediaPosition>({ ...DEFAULT_MEDIA_POSITION });
  const [shortDesc, setShortDesc] = useState("");
  const [isMature, setIsMature] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!name.trim()) {
      setNameError("");
      setNameConflictId("");
      setNameSuggestions([]);
      return;
    }
    const nameRegex = /^[\u0600-\u06FFa-zA-Z0-9_]+$/;
    if (!nameRegex.test(name.trim())) {
      setNameError("حروف وأرقام وشرطة سفلية فقط، بدون مسافات");
      setNameConflictId("");
      setNameSuggestions([]);
      return;
    }
    if (name.trim().length < 3) {
      setNameError("3 أحرف على الأقل");
      setNameConflictId("");
      setNameSuggestions([]);
      return;
    }
    if (name.trim().length > 32) {
      setNameError("الحد الأقصى 32 حرف");
      setNameConflictId("");
      setNameSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingName(true);
      try {
        const { taken, existingId } = await isCommunityNameTaken(name, allComms);
        if (taken) {
          const conflict = existingId || normalizeCommunityNameKey(name);
          setNameConflictId(conflict);
          setNameError(`n/${conflict} موجود مسبقاً`);
          const suggestions = await firstAvailableCommunityNames(name, 5);
          setNameSuggestions(suggestions);
        } else {
          setNameError("");
          setNameConflictId("");
          setNameSuggestions([]);
        }
      } catch {
        setNameError("");
        setNameConflictId("");
        setNameSuggestions([]);
      }
      setCheckingName(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [name, allComms]);

  const goNext = () => {
    if (step === 1 && !selectedTopic) { showToast("اختر تصنيفاً أولاً", "error"); return; }
    if (step === 1 && selectedTopic && user) {
      void saveExplicitInterestsFromCategory(user.uid, selectedTopic);
    }
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
      const cleanName = canonicalCommunityId(name);
      const { taken, existingId } = await isCommunityNameTaken(name, allComms);
      if (taken) {
        showToast(`n/${existingId || cleanName} موجود مسبقاً`, "error");
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "communities", cleanName), {
        name: cleanName,
        nameKey: normalizeCommunityNameKey(name),
        label: `n/${cleanName}`,
        shortDesc: shortDesc.trim(),
        desc: shortDesc.trim() || `أهلاً بكم في مجتمع n/${cleanName}`,
        img: logoUrl.trim(),
        banner: bannerUrl.trim(),
        logoPosition: positionToCss(logoPosition),
        logoScale: logoPosition.scale,
        bannerPosition: positionToCss(bannerPosition),
        bannerScale: bannerPosition.scale,
        founded: new Date().getFullYear().toString(),
        rules: ["احترام الجميع وعدم الإساءة"],
        tags: buildCommunityTagsField(categoryToStoreValue(selectedTopic)),
        bookmarks: [],
        stats: [],
        creatorUid: user.uid,
        creatorName: user.displayName || "مؤسس المجتمع",
        creatorPhoto: user.photoURL || "",
        createdAt: new Date().toISOString(),
        memberCount: 1,
        members: 0,
        category: categoryToStoreValue(selectedTopic),
        communityType,
        showInForum: true,
        isMature: !!isMature,
        modLevel: communityType === "private" ? "restrict" : communityType === "restricted" ? "moderate" : "open",
      });

      await setDoc(doc(db, "communities", cleanName, "members", user.uid), {
        uid: user.uid, joinedAt: new Date().toISOString(), role: "owner",
      });
      await setDoc(doc(db, "users", user.uid, "communities", cleanName), {
        name: cleanName, joinedAt: new Date().toISOString(), isFavorite: false,
      });

      showToast(`تم إنشاء مجتمع n/${cleanName} بنجاح!`, "success");
      onSuccess(cleanName);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "حاول مرة أخرى";
      showToast(`حدث خطأ: ${msg}`, "error");
    }
    setLoading(false);
  };

  const openCommunityPreview = () => {
    const id = canonicalCommunityId(name) || name.trim();
    if (!id || id.length < 3) {
      showToast("أدخل اسم المجتمع أولاً", "error");
      return;
    }
    localStorage.setItem(
      "nf-community-preview",
      JSON.stringify({
        name: id,
        shortDesc: shortDesc.trim(),
        desc: shortDesc.trim() || `أهلاً بكم في مجتمع n/${id}`,
        img: logoUrl.trim(),
        banner: bannerUrl.trim(),
        logoUrl: logoUrl.trim(),
        bannerUrl: bannerUrl.trim(),
        logoPosition: positionToCss(logoPosition),
        logoScale: logoPosition.scale,
        bannerPosition: positionToCss(bannerPosition),
        bannerScale: bannerPosition.scale,
        category: categoryToStoreValue(selectedTopic),
        communityType,
        rules: ["احترام الجميع وعدم الإساءة"],
        tags: [],
        memberCount: 1,
        timestamp: Date.now(),
      })
    );
    window.open(
      `/app?view=community&community=${encodeURIComponent(id)}&preview=true`,
      "_blank"
    );
  };

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-6" style={{ direction: "rtl" }}>
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

      {step === 1 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">عن ماذا سيكون مجتمعك؟</h2>
          <p className="text-[12px] text-nf-dim mb-5">اختر تصنيفاً يساعد الأعضاء على اكتشاف مجتمعك</p>
          <div className="flex flex-wrap gap-2 mb-8 max-h-[min(520px,70vh)] overflow-y-auto pr-1">
            {COMMUNITY_CATEGORIES.map((label) => {
              const isSelected = selectedTopic === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedTopic(label)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[12px] font-semibold transition-all text-right",
                    isSelected
                      ? "border-nf-accent bg-nf-accent/10 text-nf-text"
                      : "border-nf-border-2 text-nf-muted hover:border-nf-accent/40 hover:text-nf-text hover:bg-nf-secondary/40"
                  )}
                >
                  <span className="leading-snug whitespace-normal">{label}</span>
                  {isSelected && <Check size={11} className="text-nf-accent shrink-0" />}
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

      {step === 2 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-1">ما نوع مجتمعك؟</h2>
          <p className="text-[12px] text-nf-dim mb-5">حدد من يمكنه المشاهدة والمشاركة</p>
          <div className="space-y-2 mb-6">
            {COMMUNITY_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button key={type.id} type="button" onClick={() => setCommunityType(type.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-right transition-all",
                    communityType === type.id ? "border-nf-accent/50 bg-nf-secondary" : "border-nf-border-2 hover:border-nf-accent/20"
                  )}>
                  <Icon size={18} className={communityType === type.id ? "text-nf-accent shrink-0" : "text-nf-dim shrink-0"} />
                  <div className="flex-1">
                    <p className={cn("text-[13px] font-bold", communityType === type.id ? "text-nf-text" : "text-nf-muted")}>{type.label}</p>
                    <p className="text-[11px] text-nf-dim mt-0.5">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mb-6">
            <label className="text-[12px] font-bold text-nf-text block mb-2">اسم المجتمع <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-nf-accent font-mono">n/</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسم_المجتمع"
                className={cn(
                  "w-full !bg-nf-secondary border rounded-xl pr-9 pl-10 py-3 text-[13px] text-nf-text outline-none font-mono",
                  nameError ? "border-nf-border-2" : "border-nf-border-2 focus:border-nf-accent"
                )} />
            </div>
            {checkingName && !nameError && (
              <p className="text-[11px] text-nf-dim mt-1.5">جاري التحقق من الاسم...</p>
            )}
            {nameError && (
              <div className="mt-2 rounded-lg border border-nf-border-2/50 bg-nf-secondary/30 px-3 py-2">
                <p className="text-[11px] text-nf-muted">{nameError}</p>
                {nameSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-nf-dim mb-1">أسماء متاحة:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {nameSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setName(s)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-nf-secondary border border-nf-border-2 text-nf-accent hover:bg-nf-accent/10 hover:border-nf-accent/30 transition-colors"
                        >
                          n/{s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!nameError && !checkingName && name.trim().length >= 3 && (
              <p className="text-[11px] text-green-400/90 mt-1.5 flex items-center gap-1">
                <Check size={12} /> n/{canonicalCommunityId(name)} متاح
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button onClick={goNext} disabled={!!nameError || !name.trim() || checkingName}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold disabled:opacity-40">
              التالي <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-[20px] font-bold text-nf-text mb-5">هوية مجتمعك</h2>
          <div className="space-y-4 mb-6">
            <CommunityMediaFields
              logoUrl={logoUrl}
              bannerUrl={bannerUrl}
              logoPosition={logoPosition}
              bannerPosition={bannerPosition}
              onLogoUrlChange={setLogoUrl}
              onBannerUrlChange={setBannerUrl}
              onLogoPositionChange={setLogoPosition}
              onBannerPositionChange={setBannerPosition}
            />
            <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={3} maxLength={300} placeholder="وصف مختصر..."
              className="w-full !bg-transparent border border-nf-border-2 rounded-xl px-3 py-2.5 text-[12px] resize-none outline-none focus:border-nf-accent transition-colors" />
            <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-nf-border-2">
              <div>
                <p className="text-[13px] font-bold text-nf-text">مجتمع مخصص لفئة +18</p>
                <p className="text-[11px] text-nf-dim mt-1.5 leading-relaxed">
                  تفعيل هذا الخيار يعني ان مجتمعك قد يحتوي على مناقشات حساسة، تجارب معقدة، او لقطات العاب قوية.
                  سيطلب من الزوار تأكيد عمرهم قبل الدخول او التفاعل.
                </p>
              </div>
              <button type="button" onClick={() => setIsMature(p => !p)} className={cn("w-11 h-6 rounded-full relative shrink-0", isMature ? "bg-nf-accent" : "bg-nf-border-2")}>
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all", isMature ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={openCommunityPreview} className="px-4 py-2 rounded-xl border border-nf-border-2 text-[12px] text-nf-accent font-semibold hover:bg-nf-hover transition-colors">
              معاينة الصفحة
            </button>
            <button type="button" onClick={handleCreate} disabled={loading} className="px-6 py-2.5 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold disabled:opacity-40">
              {loading ? "جاري الإنشاء..." : "إنشاء المجتمع ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
