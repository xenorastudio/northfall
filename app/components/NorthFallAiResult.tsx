"use client";

import { Copy, X } from "lucide-react";

type Props = {
  loading: boolean;
  text: string;
  postTitle?: string;
  actionLabel?: string;
  onClose: () => void;
  showToast?: (msg: string) => void;
};

export default function NorthFallAiResult({
  loading,
  text,
  postTitle,
  actionLabel = "ملخص",
  onClose,
  showToast,
}: Props) {
  const copy = async (value: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast?.(msg);
    } catch {
      showToast?.("تعذر النسخ");
    }
  };

  return (
    <div className="mx-3 my-2 p-3 rounded-xl border border-nf-border-2/50 bg-nf-secondary/20">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[11px] font-bold text-nf-text tracking-tight">NorthFall AI</span>
        <span className="text-[10px] text-nf-dim">
          {loading ? "جاري التوليد..." : actionLabel}
        </span>
        <div className="mr-auto flex items-center gap-1 shrink-0">
          {postTitle?.trim() && !loading && (
            <button
              type="button"
              onClick={() => void copy(postTitle.trim(), "تم نسخ العنوان")}
              className="flex items-center gap-0.5 text-[10px] text-nf-dim hover:text-nf-text px-1.5 py-0.5 rounded hover:bg-nf-hover transition-colors"
            >
              <Copy size={10} />
              العنوان
            </button>
          )}
          {text && !loading && (
            <button
              type="button"
              onClick={() => void copy(text, "تم نسخ النص")}
              className="flex items-center gap-0.5 text-[10px] text-nf-dim hover:text-nf-text px-1.5 py-0.5 rounded hover:bg-nf-hover transition-colors"
            >
              <Copy size={10} />
              نسخ
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-0.5 text-nf-dim hover:text-nf-text transition-colors"
            aria-label="إغلاق"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {loading && !text && (
        <div className="flex items-center gap-1">
          <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      )}

      {text && (
        <p className="text-[12px] text-nf-muted leading-relaxed whitespace-pre-wrap">
          {text}
          {loading && (
            <span className="inline-block w-[2px] h-[12px] bg-nf-accent/60 ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      )}
    </div>
  );
}
