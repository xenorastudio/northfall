"use client";

import { Ban, ShieldAlert, EyeOff, AlertCircle, Flame, HelpCircle, ChevronLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";

const categories = [
  { id: "spam", icon: Ban, title: "سبام", desc: "محتوى مكرر أو غير مرغوب فيه" },
  { id: "harassment", icon: ShieldAlert, title: "تحرش أو تنمر", desc: "محتوى يهدف لإيذاء أو تخويف الآخرين" },
  { id: "inappropriate", icon: EyeOff, title: "محتوى غير مناسب", desc: "محتوى مخالف للآداب أو غير لائق" },
  { id: "misinfo", icon: AlertCircle, title: "معلومات مضللة", desc: "معلومات غير صحيحة أو مضللة" },
  { id: "hate", icon: Flame, title: "خطاب كراهية", desc: "محتوى يحرض على الكراهية أو التمييز" },
  { id: "other", icon: HelpCircle, title: "سبب آخر", desc: "مخالفة لا تندرج تحت الأسباب أعلاه" },
];

const MAX_DETAILS = 2000;
/** لون موحّد للمودال — أوضح من خلفية الموقع */
const MODAL_SURFACE = "bg-[#1a1a1a]";

function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export default function ReportModal({
  open,
  onClose,
  type,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  type: "post" | "comment";
  targetId: string;
}) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState("");
  const [reportText, setReportText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const typeLabel = type === "post" ? "المنشور" : "التعليق";

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelected("");
      setReportText("");
      setSubmitted(false);
      setSubmitting(false);
    }
  }, [open]);

  const handleCategorySelect = (catId: string) => {
    setSelected(catId);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!user) {
      onClose();
      return;
    }
    if (!targetId?.trim() || !selected) return;
    setSubmitting(true);
    try {
      const details = reportText.trim().slice(0, MAX_DETAILS);
      await addDoc(collection(db, "reports"), {
        reason: categories.find((c) => c.id === selected)?.title || selected,
        category: selected,
        details,
        type,
        targetId: targetId.trim(),
        reporterUid: user.uid,
        reporterName: (user.displayName || "مستخدم").slice(0, 80),
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setStep(1);
        setSelected("");
        setReportText("");
        onClose();
      }, 1500);
    } catch {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setStep(1);
    setSelected("");
    setReportText("");
    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10055] bg-[#151515]/90"
        data-nf-report-modal="true"
        aria-hidden
        onMouseDown={stopBubble}
        onClick={(e) => {
          stopBubble(e);
          handleClose();
        }}
      />
      <div
        dir="rtl"
        role="dialog"
        aria-modal
        aria-labelledby="nf-report-title"
        data-nf-report-modal="true"
        className={cn(
          "fixed z-[10060] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-24px))] max-h-[min(90vh,640px)] flex flex-col rounded-2xl border border-nf-border-2 shadow-2xl overflow-hidden",
          MODAL_SURFACE
        )}
        onMouseDown={stopBubble}
        onClick={stopBubble}
      >
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
              <span className="text-green-400 text-2xl">&#10003;</span>
            </div>
            <p className="text-nf-text font-bold text-sm">تم إرسال البلاغ</p>
            <p className="text-xs text-nf-muted mt-1">شكراً لمساعدتنا في الحفاظ على المجتمع آمناً</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-nf-dim hover:bg-white/[0.06] hover:text-nf-text transition-colors"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
              <div className="text-center flex-1 min-w-0">
                <div className="text-[10px] text-nf-dim">الخطوة {step} من 2</div>
                <h3 id="nf-report-title" className="text-[15px] font-bold text-nf-text">
                  إبلاغ عن {typeLabel}
                </h3>
              </div>
              <div className="w-8 shrink-0" />
            </div>

            <div className="h-0.5 bg-white/[0.06] shrink-0">
              <div
                className="h-full bg-nf-accent transition-all duration-300"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              {step === 1 ? (
                <div className="p-5">
                  <p className="text-xs text-nf-muted mb-3">اختار سبب الإبلاغ</p>
                  <div className="flex flex-col gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-right hover:bg-white/[0.05] transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center shrink-0">
                          <cat.icon size={16} className="text-nf-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-nf-text">{cat.title}</div>
                          <div className="text-[11px] text-nf-dim">{cat.desc}</div>
                        </div>
                        <ChevronLeft size={14} className="text-nf-dim shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-xs text-nf-muted mb-3">تأكيد الإبلاغ</p>
                  <div className="rounded-xl p-3 mb-3 border border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const cat = categories.find((c) => c.id === selected);
                        if (!cat) return null;
                        const Icon = cat.icon;
                        return (
                          <>
                            <div className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center shrink-0">
                              <Icon size={16} className="text-[#ff4444]" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-nf-text">{cat.title}</div>
                              <div className="text-[11px] text-nf-dim">{cat.desc}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value.slice(0, MAX_DETAILS))}
                    placeholder="اكتب تفاصيل إضافية (اختياري)..."
                    rows={3}
                    className="w-full rounded-xl border border-white/[0.08] bg-transparent px-3.5 py-2.5 text-sm text-nf-text placeholder:text-nf-dim outline-none resize-none focus:border-nf-accent/40 transition-colors mb-4"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-nf-muted hover:bg-white/[0.05] hover:text-nf-text transition-colors disabled:opacity-40"
                    >
                      رجوع
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || !user}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff4444] text-white text-xs font-bold hover:bg-[#ff3333] transition-colors disabled:opacity-40"
                    >
                      {submitting ? "جاري الإرسال…" : "إبلاغ"}
                    </button>
                  </div>
                  {!user && (
                    <p className="text-[11px] text-amber-400/90 mt-2 text-center">سجّل الدخول لإرسال بلاغ</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
