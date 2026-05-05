"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mountain, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn } = useAuth();
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-nf-primary border border-nf-border rounded-xl p-8 max-w-[400px] w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-3 left-3 text-nf-muted hover:text-white transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 mb-5">
              <Mountain size={32} className="text-nf-accent" />
              <span className="font-inter text-xl font-bold text-white">NorthFall</span>
            </div>

            <h2 className="text-lg font-bold text-white mb-2">{t("lm.title")}</h2>
            <p className="text-sm text-nf-muted mb-6">{t("lm.subtitle")}</p>

            <button
              onClick={async () => { await signIn(); onClose(); }}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold text-sm py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{t("lm.continueGoogle")}</span>
            </button>

            <p className="text-[11px] text-nf-dim mt-4 leading-relaxed">
              {t("lm.agreement")}{" "}
              <a href="#" className="text-nf-muted hover:text-white">{t("sr.terms")}</a> {t("lm.and")}{" "}
              <a href="#" className="text-nf-muted hover:text-white">{t("sr.privacy")}</a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
