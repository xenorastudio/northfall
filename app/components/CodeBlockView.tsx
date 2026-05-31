"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { highlightCode, guessCodeLang } from "@/lib/code-highlight";
import { prepareCodeForDisplay } from "@/lib/code-indent";

const COLLAPSE_LINE_THRESHOLD = 16;
const COLLAPSED_MAX_HEIGHT_PX = 280;

function resolveHighlightLang(declared: string, code: string): string {
  const guessed = guessCodeLang(code);
  const d = declared.trim().toLowerCase();
  if (guessed !== "javascript") return guessed;
  if (d && d !== "javascript" && d !== "js") return d;
  return guessed;
}

export default function CodeBlockView({
  code,
  lang,
  collapsible = true,
  compact = false,
}: {
  code: string;
  lang: string;
  collapsible?: boolean;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const display = prepareCodeForDisplay(code);
  const highlighted = highlightCode(display, resolveHighlightLang(lang, display));
  const lineCount = useMemo(() => display.split("\n").length, [display]);
  const collapseThreshold = compact ? 8 : COLLAPSE_LINE_THRESHOLD;
  const collapsedMaxHeight = compact ? 160 : COLLAPSED_MAX_HEIGHT_PX;
  const isLong = collapsible && lineCount > collapseThreshold;
  const collapsed = isLong && !expanded;

  return (
    <div className={cn("nf-code-block nf-gh-code-block nf-code-block-wrap", compact && "nf-code-block--compact")} dir="ltr">
      <div
        className={cn(
          "nf-code-block-scroll relative",
          collapsed && "nf-code-block-scroll--collapsed"
        )}
        style={collapsed ? { maxHeight: collapsedMaxHeight } : undefined}
      >
        <pre dir="ltr" className="nf-code-block-pre">
          <code className="nf-hl-code" dir="ltr" dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
        {collapsed && <div className="nf-code-block-fade" aria-hidden />}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="nf-code-block-toggle"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              إخفاء الكود
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              عرض كل الكود ({lineCount} سطر)
            </>
          )}
        </button>
      )}
    </div>
  );
}
