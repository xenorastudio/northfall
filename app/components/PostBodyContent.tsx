"use client";

import "./rich-editor.css";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import PostHashtagText from "./PostHashtagText";
import { normalizePostBodyMarkdown } from "@/lib/markdown-body";
import { bodyNeedsFormattedRender, renderFormattedBody } from "./PostFormatter";
import { UserProfilePopover } from "./HoverCard";

export default function PostBodyContent({
  text,
  className,
  onHashtagClick,
  onProfileClick,
  enableMentionHover = true,
}: {
  text: string;
  className?: string;
  onHashtagClick?: (tag: string) => void;
  onProfileClick?: (uid: string) => void;
  enableMentionHover?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mentionTip, setMentionTip] = useState<{
    name: string;
    rect: DOMRect;
  } | null>(null);

  useEffect(() => {
    if (!enableMentionHover) return;
    const root = rootRef.current;
    if (!root) return;

    const clearTimer = () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
    };

    const showFor = (el: HTMLElement) => {
      const name =
        el.getAttribute("data-mention") ||
        el.textContent?.replace(/^@/, "")?.trim();
      if (!name) return;
      clearTimer();
      hoverTimer.current = setTimeout(() => {
        setMentionTip({ name, rect: el.getBoundingClientRect() });
      }, 180);
    };

    const onEnter = (e: Event) => {
      const el = (e.target as HTMLElement).closest(
        ".nf-md-mention, .mention-link"
      );
      if (!el || !root.contains(el)) return;
      showFor(el as HTMLElement);
    };

    const onLeave = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (related?.closest?.(".nf-mention-popover")) return;
      const from = (e.target as HTMLElement).closest(
        ".nf-md-mention, .mention-link"
      );
      if (!from) return;
      if (related && from.contains(related)) return;
      clearTimer();
      setMentionTip(null);
    };

    root.addEventListener("mouseenter", onEnter, true);
    root.addEventListener("mouseleave", onLeave, true);
    return () => {
      clearTimer();
      root.removeEventListener("mouseenter", onEnter, true);
      root.removeEventListener("mouseleave", onLeave, true);
    };
  }, [enableMentionHover, text]);

  if (!text) return null;

  const normalized = normalizePostBodyMarkdown(text);

  const onClick = (e: React.MouseEvent) => {
    const mention = (e.target as HTMLElement).closest(
      ".nf-md-mention, .mention-link"
    );
    if (mention) {
      e.stopPropagation();
      return;
    }
    if (!onHashtagClick) return;
    const el = (e.target as HTMLElement).closest("[data-hashtag]");
    if (!el) return;
    e.stopPropagation();
    e.preventDefault();
    const tag = el.getAttribute("data-hashtag");
    if (tag) onHashtagClick(tag);
  };

  const popover =
    enableMentionHover &&
    mentionTip &&
    typeof document !== "undefined" &&
    createPortal(
      <UserProfilePopover
        name={mentionTip.name}
        anchorRect={mentionTip.rect}
        show
        onClose={() => setMentionTip(null)}
        onProfileClick={onProfileClick}
      />,
      document.body
    );

  if (bodyNeedsFormattedRender(normalized)) {
    return (
      <>
        <div
          ref={rootRef}
          className={cn(
            "nf-post-body nf-bidi-text text-sm leading-relaxed",
            className
          )}
          dir="auto"
          style={{ textAlign: "right" }}
          onClick={onClick}
        >
          {renderFormattedBody(normalized)}
        </div>
        {popover}
      </>
    );
  }

  return (
    <>
      <div
        ref={rootRef}
        className={cn(
          "whitespace-pre-wrap nf-bidi-text text-sm leading-relaxed",
          className
        )}
        dir="auto"
        style={{ textAlign: "right" }}
        onClick={onClick}
      >
        <PostHashtagText text={normalized} onHashtagClick={onHashtagClick} />
      </div>
      {popover}
    </>
  );
}
