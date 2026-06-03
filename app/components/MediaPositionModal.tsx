"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import ImagePositionEditor from "./ImagePositionEditor";
import { normalizeMediaPosition, type MediaPosition } from "@/lib/media-object-position";

type MediaPositionModalProps = {
  open: boolean;
  variant: "banner" | "avatar";
  imageUrl: string;
  position: MediaPosition;
  onClose: () => void;
  onSave: (pos: MediaPosition) => void;
  /** classic = نافذة بيضاء لصفحة التعديل القديمة */
  theme?: "app" | "classic";
};

function stopBubble(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export default function MediaPositionModal({
  open,
  variant,
  imageUrl,
  position,
  onClose,
  onSave,
  theme = "app",
}: MediaPositionModalProps) {
  const [draft, setDraft] = useState<MediaPosition>(() => normalizeMediaPosition(position));
  const justOpenedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setDraft(normalizeMediaPosition(position));
      justOpenedRef.current = true;
      const t = window.setTimeout(() => {
        justOpenedRef.current = false;
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [open, position]);

  if (!open || typeof document === "undefined") return null;

  const isBanner = variant === "banner";
  const title = isBanner ? "تخصيص صورة البانر" : "تخصيص الشعار";
  const classic = theme === "classic";

  const tryClose = () => {
    if (justOpenedRef.current) return;
    onClose();
  };

  return createPortal(
    <>
      <div
        className={classic ? "fixed inset-0 z-[99990] bg-black/45" : "fixed inset-0 z-[99990] bg-black/85 backdrop-blur-[2px]"}
        onMouseDown={stopBubble}
        onClick={(e) => {
          stopBubble(e);
          tryClose();
        }}
      />
      <div
        dir="rtl"
        role="dialog"
        aria-modal
        aria-labelledby="nf-media-modal-title"
        className={
          classic
            ? "fixed z-[99999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(720px,calc(100vw-20px))] max-h-[calc(100vh-32px)] flex flex-col rounded shadow-lg overflow-hidden border border-[#aaa]"
            : "fixed z-[99999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(720px,calc(100vw-20px))] max-h-[calc(100vh-32px)] flex flex-col rounded-2xl border border-nf-border-2 bg-[#212121] shadow-2xl overflow-hidden"
        }
        style={classic ? { background: "#fff" } : undefined}
        onMouseDown={stopBubble}
        onClick={stopBubble}
      >
        <div className={classic ? "px-5 pt-4 pb-2 shrink-0 border-b border-[#ddd]" : "px-5 pt-5 pb-3 shrink-0"}>
          <h2
            id="nf-media-modal-title"
            className={classic ? "text-[15px] font-bold text-[#222] text-center" : "text-[17px] font-bold text-white text-center"}
          >
            {title}
          </h2>
          {isBanner && (
            <p
              className={
                classic
                  ? "mt-2 flex items-start justify-center gap-1.5 text-[11px] text-[#666] text-center leading-relaxed"
                  : "mt-2.5 flex items-start justify-center gap-1.5 text-[11px] text-white/55 text-center leading-relaxed"
              }
            >
              <Info size={13} className="shrink-0 mt-0.5 opacity-70" />
              <span>للحصول على افضل النتائج، يفضل صورة بعرض 2560×1440 بكسل على الاقل.</span>
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
          <ImagePositionEditor
            imageUrl={imageUrl}
            position={draft}
            onPositionChange={setDraft}
            variant={variant}
            inModal
            aspectRatio={16 / 9}
          />
        </div>

        <div className={classic ? "flex items-center justify-end gap-2 px-5 py-3 border-t border-[#ddd] shrink-0 bg-[#f5f5f5]" : "flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 shrink-0"}>
          <button
            type="button"
            onClick={tryClose}
            className={
              classic
                ? "px-4 py-1.5 rounded text-[12px] font-semibold text-[#444] border border-[#bbb] bg-white hover:bg-[#eee] transition-colors"
                : "px-5 py-2 rounded-full text-[13px] font-semibold text-white/80 hover:bg-white/10 transition-colors"
            }
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(normalizeMediaPosition(draft));
              onClose();
            }}
            className={
              classic
                ? "px-5 py-1.5 rounded text-[12px] font-bold text-white bg-[#444] hover:bg-[#333] transition-colors"
                : "px-6 py-2 rounded-full text-[13px] font-bold bg-white text-[#212121] hover:bg-white/90 transition-colors"
            }
          >
            تم
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

