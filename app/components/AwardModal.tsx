"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";

export default function AwardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
}) {
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-nf-primary border border-nf-border rounded-xl w-full max-w-[340px] mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-nf-border-2">
              <button onClick={onClose} className="text-nf-muted hover:text-nf-text p-1"><X size={16} /></button>
              <div className="text-sm font-bold text-nf-text">الجوائز</div>
              <div className="w-6" />
            </div>
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-nf-accent/10 flex items-center justify-center mx-auto mb-3">
                <Star size={28} className="text-nf-accent/40" />
              </div>
              <p className="text-nf-text font-bold text-sm">قريباً</p>
              <p className="text-xs text-nf-muted mt-1">ميزة الجوائز قيد التطوير</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
