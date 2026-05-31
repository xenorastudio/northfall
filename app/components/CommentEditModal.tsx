"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import RichContentEditor, { type RichContentEditorHandle } from "./RichContentEditor";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (markdown: string) => Promise<void>;
  user?: { displayName?: string; photoURL?: string } | null;
  saving?: boolean;
};

export default function CommentEditModal({ open, initialText, onClose, onSave, user, saving }: Props) {
  const [text, setText] = useState(initialText);
  const editorRef = useRef<RichContentEditorHandle>(null);

  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSave = async () => {
    const md = (editorRef.current?.flush() ?? text).trim();
    if (!md) return;
    await onSave(md);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] px-4 bg-black/55 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl bg-nf-card border border-nf-border-2 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-nf-border-2/80">
              <h2 className="text-sm font-bold text-nf-text">تعديل التعليق</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3">
              <RichContentEditor
                ref={editorRef}
                value={text}
                onChange={setText}
                placeholder="عدّل تعليقك..."
                variant="comment"
                minHeight={140}
                user={user}
                noSpecs
                autoFocus
                className="nf-comment-editor border border-nf-border-2/50 rounded-xl overflow-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-nf-border-2/80 bg-nf-secondary/10">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors disabled:opacity-40"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className={cn(
                  "px-5 py-1.5 rounded-full text-xs font-bold bg-nf-accent text-nf-primary hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
