"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Ban, ShieldAlert, EyeOff, AlertCircle, Flame, HelpCircle, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

const categories = [
  { id: "spam", icon: Ban, title: "سبام", desc: "محتوى مكرر أو غير مرغوب فيه" },
  { id: "harassment", icon: ShieldAlert, title: "تحرش أو تنمر", desc: "محتوى يهدف لإيذاء أو تخويف الآخرين" },
  { id: "inappropriate", icon: EyeOff, title: "محتوى غير مناسب", desc: "محتوى مخالف للآداب أو غير لائق" },
  { id: "misinfo", icon: AlertCircle, title: "معلومات مضللة", desc: "معلومات غير صحيحة أو مضللة" },
  { id: "hate", icon: Flame, title: "خطاب كراهية", desc: "محتوى يحرض على الكراهية أو التمييز" },
  { id: "other", icon: HelpCircle, title: "سبب آخر", desc: "مخالفة لا تندرج تحت الأسباب أعلاه" },
];

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
  const { user } = useAuth();
  const typeLabel = type === "post" ? "المنشور" : "التعليق";

  const handleCategorySelect = (catId: string) => {
    setSelected(catId);
    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, "reports"), {
        reason: categories.find(c => c.id === selected)?.title || selected,
        category: selected,
        details: reportText,
        type: type,
        targetId,
        reporterUid: user?.uid || "anon",
        reporterName: user?.displayName || "مجهول",
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    } catch {}
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setStep(1);
      setSelected("");
      setReportText("");
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    setStep(1);
    setSelected("");
    setReportText("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-nf-primary border border-nf-border rounded-xl w-full max-w-[420px] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-400 text-2xl">&#10003;</span>
                </div>
                <p className="text-nf-text font-bold text-sm">تم إرسال البلاغ</p>
                <p className="text-xs text-nf-muted mt-1">شكراً لمساعدتنا في الحفاظ على المجتمع آمناً</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-nf-border-2">
                  <button onClick={handleClose} className="text-nf-muted hover:text-nf-text p-1"><X size={16} /></button>
                  <div className="text-center">
                    <div className="text-[10px] text-nf-dim">الخطوة {step} من 2</div>
                    <div className="text-sm font-bold text-nf-text">إبلاغ عن {typeLabel}</div>
                  </div>
                  <div className="w-6" />
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-nf-border-2">
                  <div className="h-full bg-nf-accent transition-all duration-300" style={{ width: step === 1 ? "50%" : "100%" }} />
                </div>

                {step === 1 ? (
                  /* Step 1: Choose category */
                  <div className="p-4">
                    <p className="text-xs text-nf-muted mb-3">اختار سبب الإبلاغ</p>
                    <div className="flex flex-col gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-right hover:bg-nf-hover transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-nf-secondary flex items-center justify-center shrink-0 group-hover:bg-nf-border transition-colors">
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
                  /* Step 2: Confirm + write details */
                  <div className="p-4">
                    <p className="text-xs text-nf-muted mb-3">تأكيد الإبلاغ</p>
                    <div className="bg-nf-secondary rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const cat = categories.find(c => c.id === selected);
                          if (!cat) return null;
                          const Icon = cat.icon;
                          return (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-nf-border flex items-center justify-center shrink-0">
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
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="اكتب تفاصيل إضافية (اختياري)..."
                      rows={3}
                      className="w-full bg-transparent border border-nf-border rounded-lg px-3 py-2 text-sm text-nf-text placeholder:text-nf-dim outline-none resize-none focus:border-nf-accent transition-colors mb-4"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 px-4 py-2 rounded-lg border border-nf-border text-xs font-semibold text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
                      >
                        رجوع
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#ff4444] text-white text-xs font-bold hover:bg-[#ff3333] transition-colors"
                      >
                        إبلاغ
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
