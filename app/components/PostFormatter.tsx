"use client";

import React from "react";
import VideoPlayer, { parseVideoUrl } from "./VideoPlayer";
import { splitTextByHashtags } from "@/lib/hashtags";
import { collectMarkdownTableRows, isMarkdownTableSeparatorLine } from "@/lib/markdown-table";
import { guessCodeLang } from "@/lib/code-highlight";
import { repairUtf8Mojibake } from "@/lib/display-text";
import {
  collectIndentedCodeBlock,
  collectLooseCodeBlock,
  isMarkdownListItem,
  isMarkdownLinkLine,
  normalizeMarkdownLinkSpacing,
} from "@/lib/markdown-body";
import { autolinkBareUrls } from "@/lib/autolink";
import CodeBlockView from "./CodeBlockView";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** نص فيه جدول أو تنسيق markdown — لا يكفي PostHashtagText وحده */
export function bodyNeedsFormattedRender(text: string | undefined | null): boolean {
  if (!text?.trim()) return false;
  if (/<pre[\s>]/i.test(text) || /nf-editor-pre/i.test(text)) return true;
  if (collectLooseCodeBlock(text.split("\n"), 0)) return true;
  return (
    /!\[[^\]]*\]\([^)]+\)/.test(text) ||
    /(?<!\*)\*(?!\*)[\s\S]+?(?<!\*)\*(?!\*)/.test(text) ||
    /~~[\s\S]+?~~/.test(text) ||
    /`[\s\S]+?`/.test(text) ||
    /\^[\s\S]+?\^/.test(text) ||
    />![\s\S]+?!</.test(text) ||
    /\[[\s\S]*?\]\s*\([\s\S]*?\)/.test(text) ||
    /^\s*\|.+\|/m.test(text) ||
    /\n\s*\|.+\|/m.test(text) ||
    /^\s*[^|\n]+\|[^|\n]+/m.test(text) ||
    /^```/m.test(text) ||
    /^#{1,3}\s/m.test(text) ||
    /^>\s/m.test(text) ||
    /^[-*]\s/m.test(text) ||
    /^\d+\.\s/m.test(text) ||
    /^---+$/m.test(text) ||
    /^#{1,6}/m.test(text) ||
    /@([\p{L}\p{N}_-]+)/u.test(text) ||
    /https?:\/\/\S+/i.test(text)
  );
}

function formatInlinePlain(text: string): string {
  let s = text;
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong style="font-weight:700">$1</strong>');
  s = s.replace(/(?<!\*)\*(?!\*)([\s\S]+?)(?<!\*)\*(?!\*)/g, '<em style="font-style:italic">$1</em>');
  s = s.replace(/~~([\s\S]+?)~~/g, '<span style="text-decoration:line-through;opacity:0.6">$1</span>');
  s = s.replace(/`([\s\S]+?)`/g, '<code dir="ltr" class="nf-md-inline-code">$1</code>');
  s = s.replace(/\^([\s\S]+?)\^/g, "<sup>$1</sup>");
  s = s.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="nf-editor-img" loading="lazy" />'
  );
  s = normalizeMarkdownLinkSpacing(s);
  s = s.replace(
    /\[([\s\S]*?)\]\s*\(([\s\S]*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="nf-md-link">$1</a>'
  );
  s = s.replace(/>!([\s\S]+?)!</g, '<span class="nf-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
  s = s.replace(
    /@([\p{L}\p{N}_-]+)/gu,
    '<span class="nf-md-mention mention-link" data-mention="$1">@$1</span>'
  );
  s = autolinkBareUrls(s);
  return s;
}

function formatInline(text: string): string {
  const segments = splitTextByHashtags(text);
  if (segments.length === 1 && segments[0].type === "text") {
    return formatInlinePlain(text);
  }
  return segments
    .map((seg) => {
      if (seg.type === "hashtag") {
        const tag = escapeHtml(seg.value);
        return `<span class="nf-hashtag" dir="ltr" data-hashtag="${tag}">#${tag}</span>`;
      }
      return formatInlinePlain(seg.value);
    })
    .join("");
}

function isInlineOnlyCommentLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t.startsWith("```") || t.startsWith(">") || /^#{1,3}\s/.test(t)) return false;
  if (isMarkdownListItem(line) || /^\d+\.\s/.test(t)) return false;
  if (t.match(/^---+$|^\*\*\*+$|^___+$/)) return false;
  if (/^https?:\/\//i.test(t) && parseVideoUrl(t)) return false;
  return true;
}

export function renderFormattedBody(text: string, opts?: { compact?: boolean }): React.ReactNode[] {
  if (!text) return [];
  const compact = opts?.compact ?? false;
  text = repairUtf8Mojibake(text);
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        result.push(
          <CodeBlockView
            key={`code-${i}`}
            code={codeLines.join("\n")}
            lang={codeLang || guessCodeLang(codeLines.join("\n"))}
            compact={compact}
          />
        );
        codeLines = [];
        codeLang = "";
      } else {
        inCodeBlock = true;
        codeLang = line.trimStart().replace(/```/, "").trim();
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const indented = collectIndentedCodeBlock(lines, i);
    if (indented) {
      result.push(
        <CodeBlockView
          key={`indented-${i}`}
          code={indented.code}
          lang={guessCodeLang(indented.code)}
          compact={compact}
        />
      );
      i = indented.endIndex;
      continue;
    }

    if (isMarkdownLinkLine(line)) {
      const formatted = formatInline(line.trim());
      result.push(
        compact ? (
          <span
            key={i}
            className="text-sm text-nf-text-2 leading-relaxed nf-comment-inline"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        ) : (
          <p key={i} className="text-sm text-nf-text-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
        )
      );
      continue;
    }

    const loose = collectLooseCodeBlock(lines, i);
    if (loose) {
      result.push(
        <CodeBlockView
          key={`loose-${i}`}
          code={loose.code}
          lang={guessCodeLang(loose.code)}
          compact={compact}
        />
      );
      i = loose.endIndex;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoted = formatInline(line.slice(2));
      result.push(<blockquote key={i} className="border-r-2 border-nf-accent/40 pr-3 ltr:border-r-0 ltr:pr-0 ltr:border-l-2 ltr:pl-3 my-1.5 text-sm text-nf-text-2/80 italic" dangerouslySetInnerHTML={{ __html: quoted }} />);
      continue;
    }

    if (line.startsWith("### ")) {
      const heading = formatInline(line.slice(4));
      result.push(<h4 key={i} className="text-[14px] sm:text-[15px] font-bold text-white mt-3 mb-1.5" dangerouslySetInnerHTML={{ __html: heading }} />);
      continue;
    }
    if (line.startsWith("## ")) {
      const heading = formatInline(line.slice(3));
      result.push(<h3 key={i} className="text-[15px] sm:text-[16px] font-bold text-white mt-3 mb-1.5" dangerouslySetInnerHTML={{ __html: heading }} />);
      continue;
    }
    if (line.startsWith("# ")) {
      const heading = formatInline(line.slice(2));
      result.push(<h2 key={i} className="text-[16px] sm:text-[18px] font-bold text-white mt-3 mb-1.5" dangerouslySetInnerHTML={{ __html: heading }} />);
      continue;
    }

    if (isMarkdownTableSeparatorLine(line)) continue;

    const collected = collectMarkdownTableRows(lines, i);
    if (collected) {
      const { rows: tableRows, endIndex } = collected;
      if (tableRows.length > 0) {
        const maxCols = Math.max(...tableRows.map((r) => r.length));
        result.push(
          <div key={`table-${i}`} className="nf-post-table-wrap my-2.5 overflow-x-auto rounded-lg border border-nf-border-2/40">
            <table className="nf-post-table w-full text-xs" dir="ltr">
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri} className={ri === 0 ? "bg-nf-secondary/15" : ""}>
                    {Array.from({ length: maxCols }).map((_, ci) => {
                      const cell = row[ci] || "";
                      const formatted = formatInline(cell);
                      return ri === 0 ? (
                        <th
                          key={ci}
                          className="nf-post-table-cell px-3 py-2 font-bold text-nf-text min-w-[72px]"
                          dangerouslySetInnerHTML={{ __html: formatted }}
                        />
                      ) : (
                        <td
                          key={ci}
                          className="nf-post-table-cell px-3 py-2 text-nf-text-2 min-w-[72px]"
                          dangerouslySetInnerHTML={{ __html: formatted }}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = endIndex;
        continue;
      }
    }

    if (isMarkdownListItem(line)) {
      const item = formatInline(line.replace(/^[-*]\s/, ""));
      result.push(
        <div key={i} className="flex items-start gap-2.5 my-1.5">
          <span className="text-nf-accent font-extrabold select-none mt-1 text-[13px]">•</span>
          <span className="text-[13px] text-nf-text-2/95 leading-[1.8] flex-1" dangerouslySetInnerHTML={{ __html: item }} />
        </div>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)?.[1] || "1";
      const item = formatInline(line.replace(/^\d+\.\s/, ""));
      result.push(
        <div key={i} className="flex items-start gap-2.5 my-1.5">
          <span className="text-nf-accent font-black select-none text-[12px] mt-0.5 min-w-[18px] text-right font-sans">{num}.</span>
          <span className="text-[13px] text-nf-text-2/95 leading-[1.8] flex-1" dangerouslySetInnerHTML={{ __html: item }} />
        </div>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$|^\*\*\*+$|^___+$/)) {
      result.push(<hr key={i} className="my-3 border-nf-border-2" />);
      continue;
    }

    if (!line.trim()) {
      result.push(<div key={i} className="h-2" />);
      continue;
    }

    const trimmed = line.trim();
    if (/^https?:\/\/\S+$/i.test(trimmed) && !parseVideoUrl(trimmed)) {
      const formatted = formatInline(trimmed);
      result.push(
        compact ? (
          <span
            key={i}
            className="text-sm text-nf-text-2 leading-relaxed nf-comment-inline block my-0.5"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        ) : (
          <p key={i} className="text-sm text-nf-text-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
        )
      );
      continue;
    }

    // Video URL on its own line — render as poster card
    if (/^https?:\/\//i.test(trimmed) && parseVideoUrl(trimmed)) {
      result.push(
        <div key={i} className="my-2">
          <VideoPlayer url={trimmed} compact />
        </div>
      );
      continue;
    }

    const formatted = formatInline(line);
    if (compact && isInlineOnlyCommentLine(line)) {
      result.push(
        <span
          key={i}
          className="text-sm text-nf-text-2 leading-relaxed nf-comment-inline"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
      continue;
    }
    result.push(<p key={i} className="text-sm text-nf-text-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />);
  }

  if (inCodeBlock && codeLines.length > 0) {
    result.push(
      <CodeBlockView
        key="code-end"
        code={codeLines.join("\n")}
        lang={codeLang || guessCodeLang(codeLines.join("\n"))}
        compact={compact}
      />
    );
  }

  return result;
}
