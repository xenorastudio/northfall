"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getHashtagQueryAtCursor,
  getHashtagSuggestions,
  prefetchHashtagPool,
  type HashtagSuggestion,
} from "@/lib/hashtag-suggestions";
import { caretMenuViewportPosition, getTextareaCaretOffset } from "@/lib/textarea-caret";

type HashtagTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  onValueChange: (value: string) => void;
};

export default function HashtagTextarea({
  value,
  onValueChange,
  onChange,
  onKeyDown,
  className,
  ...rest
}: HashtagTextareaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fetchSeq = useRef(0);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HashtagSuggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [anchor, setAnchor] = useState<{ start: number; query: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 260, placeAbove: false });

  useEffect(() => {
    void prefetchHashtagPool();
  }, []);

  const repositionMenu = useCallback(() => {
    const el = ref.current;
    if (!el || !open) return;
    const cursor = el.selectionStart ?? value.length;
    const caret = getTextareaCaretOffset(el, cursor);
  const pos = caretMenuViewportPosition(el, caret);
  setMenuPos({ ...pos, width: 200 });
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    repositionMenu();
    const el = ref.current;
    if (!el) return;
    const onScroll = () => repositionMenu();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, repositionMenu, value, items.length]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setAnchor(null);
    };
    document.addEventListener("mousedown", onDocMouseDown, true);
    return () => document.removeEventListener("mousedown", onDocMouseDown, true);
  }, [open]);

  const syncFromCursor = useCallback(
    (text: string, cursor: number) => {
      const info = getHashtagQueryAtCursor(text, cursor);
      setAnchor(info);
      if (!info) {
        setOpen(false);
        setItems([]);
        setLoading(false);
        return;
      }

      const seq = ++fetchSeq.current;
      setLoading(true);
      setOpen(true);
      requestAnimationFrame(() => repositionMenu());

      void getHashtagSuggestions(info.query, value).then((list) => {
        if (seq !== fetchSeq.current) return;
        setItems(list);
        setActiveIdx(0);
        setOpen(list.length > 0 || info.query.length === 0);
        setLoading(false);
        requestAnimationFrame(() => repositionMenu());
      });
    },
    [repositionMenu]
  );

  const applyTag = (tag: string) => {
    const el = ref.current;
    if (!el || !anchor) return;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, anchor.start);
    const after = value.slice(cursor);
    const insert = `#${tag} `;
    const next = before + insert + after;
    onValueChange(next);
    const pos = before.length + insert.length;
    setOpen(false);
    setAnchor(null);
    setItems([]);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && items.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyTag(items[activeIdx].tag);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setAnchor(null);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const showMenu = open && (items.length > 0 || loading);

  const menu = showMenu ? (
    <div
      ref={menuRef}
      role="listbox"
      dir="rtl"
      style={{
        position: "fixed",
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        zIndex: 10050,
      }}
      className={cn(
        "nf-hashtag-suggest-menu overflow-hidden",
        menuPos.placeAbove && "origin-bottom"
      )}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="nf-hashtag-suggest-head px-3 py-2 flex items-center gap-1.5">
        <Hash size={12} className="text-nf-dim shrink-0" />
        <span className="text-[11px] font-semibold text-nf-dim">هاشتاقات مقترحة</span>
      </div>

      {loading && items.length === 0 ? (
        <div className="px-3 py-3 text-[12px] text-nf-dim">جاري التحميل…</div>
      ) : (
        <ul className="max-h-[min(180px,36vh)] overflow-y-auto py-0.5">
          {items.map((item, i) => (
            <li key={item.tag}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  applyTag(item.tag);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2 text-[13px] transition-colors duration-100",
                  i === activeIdx
                    ? "bg-nf-hover text-nf-text"
                    : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
                )}
              >
                <span dir="ltr" className="nf-hashtag truncate text-start inline-flex items-center gap-0">
                  <span>#</span>
                  {item.tag}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-nf-dim">
                  {item.count > 0 ? `× ${item.count}` : "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative overflow-visible">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          onChange?.(e);
          syncFromCursor(e.target.value, e.target.selectionStart);
        }}
        onClick={(e) => syncFromCursor(e.currentTarget.value, e.currentTarget.selectionStart)}
        onSelect={(e) => syncFromCursor(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
        onKeyUp={(e) => {
          if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) return;
          syncFromCursor(e.currentTarget.value, e.currentTarget.selectionStart ?? 0);
        }}
        onKeyDown={handleTextareaKeyDown}
        onScroll={() => open && repositionMenu()}
        className={className}
        {...rest}
      />

      {typeof document !== "undefined" && menu && createPortal(menu, document.body)}
    </div>
  );
}
