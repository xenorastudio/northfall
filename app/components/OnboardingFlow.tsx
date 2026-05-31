"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { ONBOARDING_CATEGORY_LABELS } from "@/lib/user-interests";
import { ONBOARDING_GENDER_OPTIONS, tagsForCategoryLabels } from "@/lib/onboarding-catalog";
import { completeUserOnboarding, getOnboardingCompleted } from "@/lib/user-onboarding";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingFlow() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [gender, setGender] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [feedTags, setFeedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableTags = useMemo(() => tagsForCategoryLabels(categories), [categories]);

  const toggleCategory = (label: string) => {
    setCategories((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : prev.length < 8 ? [...prev, label] : prev
    );
  };

  const toggleTag = (tag: string) => {
    setFeedTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : prev.length < 24 ? [...prev, tag] : prev
    );
  };

  const goNext = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!categories.length) {
        setError("اختر اهتماماً واحداً على الأقل أو تخطَّ الخطوة بعد الاختيار.");
        return;
      }
      setError("");
      setFeedTags([]);
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!feedTags.length) {
        setError("اختر وسمًا واحدًا على الأقل لتخصيص خلاصتك.");
        return;
      }
      setError("");
      setStep(4);
      if (!user) return;
      setSaving(true);
      try {
        await completeUserOnboarding(user.uid, { gender, categoryLabels: categories, feedTags });
        setTimeout(() => router.replace("/app"), 2400);
      } catch (e) {
        console.error(e);
        setError("تعذّر حفظ التفضيلات. جرّب مرة أخرى.");
        setStep(3);
      } finally {
        setSaving(false);
      }
    }
  };

  const skipGender = () => {
    setGender(null);
    setStep(2);
  };

  useEffect(() => {
    if (!user) return;
    getOnboardingCompleted(user.uid).then((done) => {
      if (done) router.replace("/app");
    });
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)] text-nf-muted text-[13px]">
        جاري التحميل…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-nf-text flex flex-col" dir="rtl">
      <header className="flex items-center justify-between px-4 py-3 border-b border-nf-border/30">
        <span className="text-[13px] font-bold tracking-tight">NorthFall</span>
        {step > 1 && step < 4 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            className="text-[11px] text-nf-muted hover:text-nf-text flex items-center gap-1"
          >
            <ChevronLeft size={14} className="rotate-180" />
            رجوع
          </button>
        )}
        {step < 4 && (
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn("h-1 rounded-full transition-all", step >= i ? "w-6 bg-nf-accent" : "w-3 bg-nf-border")}
              />
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex-1 flex flex-col"
            >
              <h1 className="text-xl font-bold mb-2">كيف تعرّف عن نفسك؟</h1>
              <p className="text-[12px] text-nf-dim mb-6">اختياري — يساعدنا على تخصيص تجربتك.</p>
              <div className="space-y-2 flex-1">
                {ONBOARDING_GENDER_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setGender(o.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-[13px] font-medium transition-colors",
                      gender === o.id
                        ? "border-nf-accent bg-nf-accent/10 text-nf-text"
                        : "border-nf-border/40 bg-transparent hover:border-nf-border"
                    )}
                  >
                    <span>{o.labelAr}</span>
                    {gender === o.id && <Check size={16} className="text-nf-accent" />}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!gender}
                  className="w-full py-3 rounded-xl bg-nf-accent text-white font-semibold text-[13px] disabled:opacity-40"
                >
                  متابعة
                </button>
                <button type="button" onClick={skipGender} className="w-full py-2 text-[12px] text-nf-dim hover:text-nf-muted">
                  تخطي
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <h1 className="text-xl font-bold mb-2">اختر اهتماماتك</h1>
              <p className="text-[12px] text-nf-dim mb-4 leading-relaxed">
                اختياراتك تحدد الخطوة التالية — يمكنك اختيار حتى 8 تصنيفات.
              </p>
              <div className="flex-1 overflow-y-auto -mx-1 px-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pb-4">
                {ONBOARDING_CATEGORY_LABELS.map((label) => {
                  const on = categories.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleCategory(label)}
                      className={cn(
                        "text-right px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-colors",
                        on
                          ? "border-nf-accent bg-nf-accent/10"
                          : "border-nf-border/35 bg-transparent hover:border-nf-border/60"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="w-full py-3 rounded-xl bg-nf-accent text-white font-semibold text-[13px]"
              >
                متابعة ({categories.length})
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <h1 className="text-xl font-bold mb-2">خصّص خلاصتك</h1>
              <p className="text-[12px] text-nf-dim mb-4">
                اختر الوسوم التي تريد رؤية محتوى عنها في المقدمة (حتى 24).
              </p>
              <div className="flex-1 overflow-y-auto flex flex-wrap gap-2 content-start pb-4">
                {availableTags.map((tag) => {
                  const on = feedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors",
                        on ? "border-nf-accent bg-nf-accent/15 text-nf-text" : "border-nf-border/40 text-nf-muted hover:border-nf-border"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {error && <p className="text-[11px] text-red-400 mb-2">{error}</p>}
              <button
                type="button"
                onClick={goNext}
                className="w-full py-3 rounded-xl bg-nf-accent text-white font-semibold text-[13px]"
              >
                متابعة ({feedTags.length})
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-nf-accent/15 flex items-center justify-center mb-6">
                {saving ? (
                  <Loader2 size={32} className="text-nf-accent animate-spin" />
                ) : (
                  <Check size={32} className="text-nf-accent" />
                )}
              </div>
              <h1 className="text-lg font-bold mb-2">لحظة…</h1>
              <p className="text-[13px] text-nf-dim max-w-xs leading-relaxed">
                Hold on as we build your feed based on your interests
              </p>
              <p className="text-[12px] text-nf-dim/80 mt-2 max-w-xs">
                نجهّز خلاصتك وفق اهتماماتك
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {error && step !== 3 && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
      </main>
    </div>
  );
}
