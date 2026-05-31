"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LinkBubbleState =
  | { mode: "create"; selectedText: string; range: Range }
  | { mode: "edit"; rect: DOMRect; anchor: HTMLAnchorElement };

type Props = {
  state: LinkBubbleState | null;
  onClose: () => void;
  onApply: (url: string, label: string, range: Range) => void;
  onUpdate: (anchor: HTMLAnchorElement, url: string, label: string) => void;
  onRemove: (anchor: HTMLAnchorElement) => void;
};

function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function formatLinkLabel(href: string, text: string): string {
  const t = text.trim();
  if (t && t !== href) return t.length > 36 ? `${t.slice(0, 33)}…` : t;
  try {
    const u = new URL(href, window.location.origin);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    const short = `${host}${path}`;
    return short.length > 40 ? `${short.slice(0, 37)}…` : short;
  } catch {
    return href.length > 40 ? `${href.slice(0, 37)}…` : href;
  }
}

function LinkModal({
  title,
  label,
  url,
  setLabel,
  setUrl,
  canSave,
  onClose,
  onSave,
  urlRef,
}: {
  title: string;
  label: string;
  url: string;
  setLabel: (v: string) => void;
  setUrl: (v: string) => void;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
  urlRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-[10055] bg-[#151515]/90"
        data-nf-link-bubble="true"
        onMouseDown={stopBubble}
        onClick={(e) => {
          stopBubble(e);
          onClose();
        }}
      />
      <div
        dir="rtl"
        role="dialog"
        aria-modal
        aria-labelledby="nf-link-modal-title"
        data-nf-link-bubble="true"
        className="fixed z-[10060] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(400px,calc(100vw-24px))] rounded-2xl border border-nf-border-2 bg-nf-card shadow-2xl overflow-hidden"
        onMouseDown={stopBubble}
        onClick={stopBubble}
        onPointerDown={stopBubble}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-nf-border-2/60">
          <h3 id="nf-link-modal-title" className="text-[15px] font-bold text-nf-text">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-nf-dim hover:bg-nf-hover hover:text-nf-text transition-colors"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="text-[12px] font-semibold text-nf-muted mb-1.5 block">النص</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onMouseDown={stopBubble}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                  e.preventDefault();
                  onClose();
                }
                if (e.key === "Enter" && canSave) {
                  e.preventDefault();
                  onSave();
                }
              }}
              className="w-full rounded-xl border border-nf-border-2 bg-nf-input px-3.5 py-2.5 text-sm text-nf-text outline-none focus:border-nf-accent/50 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-nf-muted mb-1.5 block">الرابط</span>
            <input
              ref={urlRef}
              type="url"
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onMouseDown={stopBubble}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                  e.preventDefault();
                  onClose();
                }
                if (e.key === "Enter" && canSave) {
                  e.preventDefault();
                  onSave();
                }
              }}
              placeholder="https://"
              className="w-full rounded-xl border border-nf-border-2 bg-nf-input px-3.5 py-2.5 text-sm text-nf-text outline-none focus:border-nf-accent/50 transition-colors"
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-nf-border-2/60 bg-nf-secondary/15">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={onSave}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold transition-colors",
              canSave
                ? "bg-nf-accent text-nf-primary hover:opacity-90"
                : "bg-nf-secondary text-nf-dim cursor-not-allowed opacity-60"
            )}
          >
            حفظ
          </button>
        </div>
      </div>
    </>
  );
}

export default function EditorLinkBubble({
  state,
  onClose,
  onApply,
  onUpdate,
  onRemove,
}: Props) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [editModal, setEditModal] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) {
      setEditModal(false);
      return;
    }
    if (state.mode === "edit") {
      setUrl(state.anchor.getAttribute("href") || "");
      setLabel(state.anchor.textContent || "");
      setEditModal(false);
    } else {
      setLabel(state.selectedText || "");
      setUrl("");
      setEditModal(true);
    }
  }, [state]);

  useEffect(() => {
    if (editModal || state?.mode === "create") {
      const t = setTimeout(() => urlRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [editModal, state]);

  if (!state || typeof document === "undefined") return null;

  if (state.mode === "create" || (state.mode === "edit" && editModal)) {
    const canSave = url.trim().length > 0;
    const title = state.mode === "edit" ? "تعديل الرابط" : "إضافة رابط";

    return createPortal(
      <LinkModal
        title={title}
        label={label}
        url={url}
        setLabel={setLabel}
        setUrl={setUrl}
        canSave={canSave}
        urlRef={urlRef}
        onClose={() => {
          setEditModal(false);
          onClose();
        }}
        onSave={() => {
          const u = url.trim();
          const t = label.trim() || u;
          if (!u) return;
          if (state.mode === "create") {
            onApply(u, t, state.range);
          } else {
            onUpdate(state.anchor, u, t);
          }
          setEditModal(false);
          onClose();
        }}
      />,
      document.body
    );
  }

  const href = state.anchor.getAttribute("href") || "";
  const linkLabel = formatLinkLabel(href, state.anchor.textContent || "");
  const top = Math.min(state.rect.bottom + 8, window.innerHeight - 52);
  const left = Math.max(8, Math.min(state.rect.left, window.innerWidth - 340));

  return createPortal(
    <div
      dir="rtl"
      role="toolbar"
      data-nf-link-bubble="true"
      style={{ position: "fixed", top, left, zIndex: 10060 }}
      className="nf-link-toolbar flex items-center gap-1 px-3 py-2 rounded-xl border border-nf-border-2 bg-nf-card shadow-lg max-w-[min(340px,calc(100vw-16px))]"
      onMouseDown={stopBubble}
      onClick={stopBubble}
      onPointerDown={stopBubble}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="nf-md-link text-[13px] font-medium text-[#60a5fa] hover:text-[#93c5fd] hover:underline truncate max-w-[200px] px-1"
        title={href}
        onClick={stopBubble}
      >
        {linkLabel}
      </a>
      <span className="w-px h-5 bg-nf-border-2/70 shrink-0 mx-0.5" />
      <button
        type="button"
        onClick={() => setEditModal(true)}
        className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors shrink-0"
        title="تعديل"
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={() => {
          onRemove(state.anchor);
          onClose();
        }}
        className="p-1.5 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        title="حذف"
      >
        <Trash2 size={15} />
      </button>
    </div>,
    document.body
  );
}
