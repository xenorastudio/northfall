"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LinkBubbleState =
  | { mode: "create"; selectedText: string; range: Range }
  | { mode: "edit"; rect: DOMRect; anchor: HTMLAnchorElement };

type Props = {
  state: LinkBubbleState | null;
  isAr?: boolean;
  onClose: () => void;
  onApply: (url: string, label: string, range: Range) => void;
  onUpdate: (anchor: HTMLAnchorElement, url: string, label: string) => void;
  onRemove: (anchor: HTMLAnchorElement) => void;
};

function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function LinkModal({
  isAr,
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
  isAr: boolean;
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
        className="fixed inset-0 z-[10055] bg-black/45"
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
        data-nf-link-bubble="true"
        className="fixed z-[10060] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-24px))] rounded-xl border border-nf-border-2 bg-nf-card shadow-2xl overflow-hidden"
        onMouseDown={stopBubble}
        onClick={stopBubble}
        onPointerDown={stopBubble}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-nf-border-2/60">
          <h3 className="text-sm font-bold text-nf-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-nf-dim hover:bg-nf-hover hover:text-nf-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-nf-muted mb-1 block">
              {isAr ? "النص" : "Text"}
            </span>
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
              className="w-full rounded-lg border border-nf-border-2 bg-nf-input px-3 py-2 text-sm text-nf-text outline-none focus:border-nf-accent/50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-nf-muted mb-1 block">
              {isAr ? "الرابط" : "Link"}
              <span className="text-red-400 mr-0.5">*</span>
            </span>
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
              className="w-full rounded-lg border border-nf-border-2 bg-nf-input px-3 py-2 text-sm text-nf-text outline-none focus:border-nf-accent/50"
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-nf-border-2/60 bg-nf-secondary/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={onSave}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-colors",
              canSave
                ? "bg-nf-accent text-nf-primary hover:opacity-90"
                : "bg-nf-secondary text-nf-dim cursor-not-allowed opacity-60"
            )}
          >
            {isAr ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function EditorLinkBubble({
  state,
  isAr = true,
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

  if (!state || typeof document === "undefined") return null;

  if (state.mode === "create" || (state.mode === "edit" && editModal)) {
    const canSave = url.trim().length > 0;
    return createPortal(
      <LinkModal
        isAr={isAr}
        title={
          state.mode === "edit"
            ? isAr
              ? "تعديل الرابط"
              : "Edit Link"
            : isAr
              ? "إضافة رابط"
              : "Add Link"
        }
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
        }}
      />,
      document.body
    );
  }

  const top = Math.min(state.rect.bottom + 6, window.innerHeight - 48);
  const left = Math.max(
    8,
    Math.min(state.rect.left, window.innerWidth - 320)
  );

  return createPortal(
    <div
      dir="ltr"
      role="toolbar"
      data-nf-link-bubble="true"
      style={{ position: "fixed", top, left, zIndex: 10060 }}
      className="nf-link-toolbar flex items-center gap-1 px-2 py-1.5 rounded-lg border border-nf-border-2/80 bg-nf-card/95 backdrop-blur-sm shadow-md max-w-[min(320px,calc(100vw-16px))]"
      onMouseDown={stopBubble}
      onClick={stopBubble}
      onPointerDown={stopBubble}
    >
      <a
        href={state.anchor.href}
        target="_blank"
        rel="noopener noreferrer"
        className="nf-md-link text-[11px] truncate max-w-[140px] underline shrink-0"
        onClick={stopBubble}
      >
        {state.anchor.getAttribute("href")}
      </a>
      <span className="w-px h-4 bg-nf-border-2/60 shrink-0" />
      <a
        href={state.anchor.href}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 rounded-md text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors shrink-0"
        title={isAr ? "فتح" : "Open"}
      >
        <ExternalLink size={13} />
      </a>
      <button
        type="button"
        onClick={() => setEditModal(true)}
        className="p-1 rounded-md text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors shrink-0"
        title={isAr ? "تعديل" : "Edit"}
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={() => {
          onRemove(state.anchor);
          onClose();
        }}
        className="p-1 rounded-md text-nf-dim hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        title={isAr ? "حذف" : "Remove"}
      >
        <Trash2 size={13} />
      </button>
    </div>,
    document.body
  );
}
