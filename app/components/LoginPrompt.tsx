"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "./AuthProvider";

const DISMISS_KEY = "nf-login-prompt-dismissed";

export default function LoginPrompt() {
  const { user, loading, signIn } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) { setVisible(false); return; }
    if (sessionStorage.getItem(DISMISS_KEY)) { setDismissed(true); return; }
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem(DISMISS_KEY)) setVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading, user]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  if (loading || user || dismissed || !visible) return null;

  return (
    <div className="fixed top-4 left-4 z-[9998] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="w-[320px] rounded-xl border border-nf-border-2/50 bg-nf-secondary overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[15px] font-bold text-nf-text tracking-tight">NorthFall</p>
              <p className="text-[11px] text-nf-dim mt-0.5">سجل دخولك للمتابعة</p>
            </div>
            <button onClick={dismiss} className="p-1 rounded-lg hover:bg-nf-hover transition-colors text-nf-dim hover:text-nf-text -mr-1 -mt-1">
              <X size={14} />
            </button>
          </div>

          <p className="text-[12px] text-nf-muted leading-relaxed mb-4">
            سجل دخولك لتعليق على المنشورات والتفاعل مع المجتمع
          </p>

          <button
            onClick={async () => { await signIn().catch(() => {}); }}
            className="w-full flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-nf-text font-medium text-[13px] py-2.5 rounded-xl transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>تابع مع Google</span>
          </button>

          <p className="text-[9px] text-nf-dim/50 mt-3 leading-relaxed text-center">
            بالضغط على &quot;تابع مع Google&quot;، أنت توافق على{" "}
            <span className="text-nf-dim/70 underline underline-offset-2 decoration-nf-border-2/30">اتفاقية الاستخدام</span>
            {" "}و{" "}
            <span className="text-nf-dim/70 underline underline-offset-2 decoration-nf-border-2/30">سياسة الخصوصية</span>
          </p>
        </div>
      </div>
    </div>
  );
}
