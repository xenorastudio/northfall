"use client";

import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[99990] bg-black/70"
        onMouseDown={stopBubble}
        onClick={(e) => {
          stopBubble(e);
          if (!loading) onCancel();
        }}
      />
      <div
        dir="rtl"
        role="alertdialog"
        aria-modal
        aria-labelledby="nf-confirm-title"
        aria-describedby="nf-confirm-desc"
        className="fixed z-[99999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(400px,calc(100vw-24px))] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(180deg, #2a2a2e 0%, #1e1e22 100%)" }}
        onMouseDown={stopBubble}
        onClick={stopBubble}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 id="nf-confirm-title" className="text-[15px] font-bold text-nf-text leading-snug">
            {title}
          </h3>
          <p id="nf-confirm-desc" className="mt-2 text-[13px] text-nf-muted leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-black/20">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-xs font-semibold text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold transition-colors min-w-[72px]",
              danger
                ? "bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
                : "bg-nf-accent text-nf-primary hover:opacity-90 disabled:opacity-60"
            )}
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
