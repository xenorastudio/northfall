/** Detect & repair unfenced code blocks (e.g. after tables). */

import { guessCodeLang } from "@/lib/code-highlight";
import { prepareCodeForDisplay } from "@/lib/code-indent";

/** JSDoc / block-comment line wrongly saved as markdown bullet `- author :` */
export function isCommentMetaBullet(line: string): boolean {
  const m = line.match(/^[-*]\s+(.*)/);
  if (m) {
    const rest = m[1].trim();
    if (/^(author|description|platform|date|param|returns|see|todo|note|title|version|license)\s*:/i.test(rest)) {
      return true;
    }
  }
  const t = line.trim();
  return /^(author|description|platform|date|param|returns|see|todo|note|title|version|license)\s*:/i.test(t)
    || /^\.\w+\s*:/.test(t);
}

export function isBlockCommentLine(line: string): boolean {
  const t = line.trim();
  if (t.startsWith("/*") || t.startsWith("*/")) return true;
  if (/^\*\s+\S/.test(line)) return true;
  if (/^\s+\*\s+\S/.test(line)) return true;
  return isCommentMetaBullet(line);
}

/** Real markdown list item — not a code comment disguised as bullet */
export function isMarkdownListItem(line: string): boolean {
  if (isBlockCommentLine(line) || isCommentMetaBullet(line)) return false;
  return /^-\s+\S/.test(line) || /^\*\s+\S/.test(line);
}

export function normalizeCodeLine(line: string): string {
  if (isCommentMetaBullet(line)) {
    return line.replace(/^[-*]\s+/, "").replace(/^\./, "");
  }
  if (/^\s+\*\s/.test(line)) return line.replace(/^\s+\*\s/, "* ");
  return line;
}

function parseMarkdownTableCellsQuick(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) return false;
  const cells = t.split("|").map((c) => c.trim()).filter(Boolean);
  return cells.length >= 2;
}

export function isMarkdownLinkLine(line: string): boolean {
  return /^\[[^\]]+\]\([^)]+\)\s*$/.test(line.trim());
}

export function isCodeLikeLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (isMarkdownLinkLine(line)) return false;
  if (t.includes("|") && parseMarkdownTableCellsQuick(t)) return false;
  if (/^(#{1,3}\s|>\s|\d+\.\s)/.test(t)) return false;
  if (/^https?:\/\//i.test(t)) return false;

  if (isBlockCommentLine(line) || isCommentMetaBullet(line)) return true;

  if (/^-\s+\S/.test(line) || /^\*\s+\S/.test(line)) return false;

  return (
    line.startsWith("    ") ||
    line.startsWith("\t") ||
    /^(using\s|namespace\s|\/\*|\*\/|\*|\/\/|#include|public\s|private\s|protected\s|internal\s|\[|\]|void\s|class\s|struct\s|enum\s|interface\s|return\s|if\s|else\s|for\s|foreach\s|while\s|var\s|const\s|float\s|int\s|bool\s|string\s|new\s|static\s)/.test(t) ||
    /^[\}\{;\)]\s*$/.test(t) ||
    t.endsWith("{") ||
    t.endsWith(";") ||
    t.endsWith("}") ||
    t.endsWith(");")
  );
}

/** Editor sometimes saves each code line as `using Foo;` inline markdown */
export function unwrapLineCodeBackticks(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const m = line.trim().match(/^`([^`]+)`$/);
      if (m && isCodeLikeLine(m[1])) return m[1];
      return line;
    })
    .join("\n");
}

export function collectIndentedCodeBlock(
  lines: string[],
  start: number
): { code: string; endIndex: number } | null {
  if (!lines[start]?.startsWith("    ") && !lines[start]?.startsWith("\t")) return null;
  const codeLines: string[] = [];
  let j = start;
  while (j < lines.length && (lines[j].startsWith("    ") || lines[j].startsWith("\t"))) {
    codeLines.push(lines[j].replace(/^( {4}|\t)/, ""));
    j++;
  }
  if (codeLines.length === 0) return null;
  return { code: codeLines.join("\n"), endIndex: j - 1 };
}

export function collectLooseCodeBlock(
  lines: string[],
  start: number
): { code: string; endIndex: number } | null {
  if (!isCodeLikeLine(lines[start] || "")) return null;
  const codeLines: string[] = [];
  let j = start;
  while (j < lines.length) {
    if (!lines[j].trim()) {
      let k = j + 1;
      while (k < lines.length && !lines[k].trim()) k++;
      if (k < lines.length && isCodeLikeLine(lines[k])) {
        j = k;
        continue;
      }
      break;
    }
    if (!isCodeLikeLine(lines[j])) break;
    codeLines.push(normalizeCodeLine(lines[j]));
    j++;
  }
  if (codeLines.length === 0) return null;
  return { code: codeLines.join("\n"), endIndex: j - 1 };
}

/** Merge consecutive ``` fences (fixes one-line-per-box preview) */
export function mergeAdjacentCodeFences(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const t = lines[i].trimStart();
    if (!t.startsWith("```")) {
      out.push(lines[i]);
      i++;
      continue;
    }

    const lang = t.slice(3).trim() || guessCodeLang("");
    const codeLines: string[] = [];
    i++;

    while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
      codeLines.push(lines[i]);
      i++;
    }
    if (i < lines.length) i++;

    while (i < lines.length) {
      while (i < lines.length && !lines[i].trim()) i++;
      if (i >= lines.length || !lines[i].trimStart().startsWith("```")) break;

      const nextLang = lines[i].trimStart().slice(3).trim() || lang;
      const sameLang = !nextLang || !lang || nextLang === lang;
      if (!sameLang) break;

      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
    }

    const mergedLang = lang || guessCodeLang(codeLines.join("\n"));
    out.push("```" + mergedLang);
    out.push(...codeLines);
    out.push("```");
  }

  return out.join("\n");
}

export function repairLooseCodeInMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inFence = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trimStart();

    if (t.startsWith("```")) {
      inFence = !inFence;
      out.push(line);
      i++;
      continue;
    }

    if (inFence) {
      out.push(line);
      i++;
      continue;
    }

    const indented = collectIndentedCodeBlock(lines, i);
    if (indented) {
      const lang = guessCodeLang(indented.code);
      out.push("```" + lang);
      out.push(...indented.code.split("\n"));
      out.push("```");
      i = indented.endIndex + 1;
      continue;
    }

    const loose = collectLooseCodeBlock(lines, i);
    if (loose) {
      let code = prepareCodeForDisplay(loose.code);
      const lang = guessCodeLang(code);
      out.push("```" + lang);
      out.push(...code.split("\n"));
      out.push("```");
      i = loose.endIndex + 1;
      continue;
    }

    out.push(line);
    i++;
  }

  return mergeAdjacentCodeFences(out.join("\n"));
}

export function repairMarkdownCodeBlocks(md: string): string {
  let text = unwrapLineCodeBackticks(md);
  text = repairLooseCodeInMarkdown(text);
  const raw = text.trim();
  if (!raw || raw.includes("```")) return text;

  const looksLikeCode =
    (/\b(function|const|let|class|import|export|using|namespace|public|void)\b/.test(raw) ||
      /\b(MonoBehaviour|UnityEngine)\b/.test(raw)) &&
    raw.includes("{") &&
    raw.includes("}");

  if (!looksLikeCode) return text;

  const lang = guessCodeLang(raw);

  if (raw.includes("\n")) {
    return mergeAdjacentCodeFences(`\`\`\`${lang}\n${raw}\n\`\`\``);
  }

  const formatted = prepareCodeForDisplay(
    raw
      .replace(/\s*\{\s*/g, " {\n  ")
      .replace(/;\s*/g, ";\n  ")
      .replace(/\}\s*/g, "\n}\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );

  return mergeAdjacentCodeFences(`\`\`\`${lang}\n${formatted}\n\`\`\``);
}

/** Full pipeline for preview / post body */
export function normalizePostBodyMarkdown(md: string): string {
  return repairMarkdownCodeBlocks(md);
}

/** Inline code that is actually a markdown link — unwrap so it renders as a link */
export function unwrapMarkdownLinksInInlineCode(md: string): string {
  return md.replace(/`(\[[^\]]+\]\([^`]+?\))`/g, "$1");
}

/** Loose code lines or markdown → normalized markdown for preview/posts */
export function preparePostBodyMarkdown(raw: string): string {
  const trimmed = (raw || "").trim();
  const unwrapped = unwrapMarkdownLinksInInlineCode(trimmed);
  return normalizePostBodyMarkdown(unwrapped);
}
