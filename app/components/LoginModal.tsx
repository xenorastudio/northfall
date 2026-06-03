"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";

type Props = {
  open: boolean;
  onClose?: () => void;
  forced?: boolean;
};

export default function LoginModal({ open, onClose, forced = false }: Props) {
  const { signIn } = useAuth();
  const { lang } = useI18n();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => { if (!forced) onClose?.(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[400px] rounded-xl border border-nf-border-2/55 bg-nf-secondary px-7 py-8 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {!forced && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 text-nf-dim hover:text-nf-text transition-colors"
              >
                <X size={16} />
              </button>
            )}

            <p className="text-[20px] font-bold text-nf-text mb-5 tracking-tight">NorthFall</p>

            <h2 className="text-[15px] font-bold text-nf-text mb-2">
              {lang === "en" ? "Sign in to continue" : "سجل دخولك للمتابعة"}
            </h2>
            <p className="text-[12px] text-nf-muted mb-6 leading-relaxed">
              {lang === "en"
                ? "Log in to comment on posts and interact with the community"
                : "سجل دخولك لتعليق على المنشورات والتفاعل مع المجتمع"}
            </p>

            <button
              type="button"
              onClick={async () => {
                await signIn();
                if (!forced) onClose?.();
              }}
              className="w-full flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-nf-text font-medium text-[13px] py-2.5 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{lang === "en" ? "Continue with Google" : "تابع مع Google"}</span>
            </button>

            <div className="text-[9px] text-nf-dim/50 mt-4 leading-relaxed">
              {lang === "en" ? (
                <span>
                  By clicking &quot;Continue with Google&quot;, you agree to the{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (!forced) onClose?.();
                      window.dispatchEvent(new CustomEvent("nf-open-policy-modal"));
                    }}
                    className="text-nf-dim/70 underline underline-offset-2 hover:text-nf-text font-bold"
                  >
                    Terms of Use
                  </button>
                  {" "}and{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (!forced) onClose?.();
                      window.dispatchEvent(new CustomEvent("nf-open-policy-modal"));
                    }}
                    className="text-nf-dim/70 underline underline-offset-2 hover:text-nf-text font-bold"
                  >
                    Privacy Policy
                  </button>
                </span>
              ) : (
                <span>
                  بالضغط على &quot;تابع مع Google&quot;، أنت توافق على{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (!forced) onClose?.();
                      window.dispatchEvent(new CustomEvent("nf-open-policy-modal"));
                    }}
                    className="text-nf-dim/70 underline underline-offset-2 hover:text-nf-text font-bold"
                  >
                    اتفاقية الاستخدام
                  </button>
                  {" "}و{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (!forced) onClose?.();
                      window.dispatchEvent(new CustomEvent("nf-open-policy-modal"));
                    }}
                    className="text-nf-dim/70 underline underline-offset-2 hover:text-nf-text font-bold"
                  >
                    سياسة الخصوصية
                  </button>
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
