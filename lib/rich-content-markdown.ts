/** Shared rich text markdown conversion */

import { splitTextByHashtags } from "@/lib/hashtags";
import {
  collectMarkdownTableRows,
  isMarkdownTableSeparatorLine,
  parseMarkdownTableCells,
} from "@/lib/markdown-table";
import { guessCodeLang, highlightCode } from "@/lib/code-highlight";
import { isMarkdownListItem } from "@/lib/markdown-body";
import { prepareCodeForDisplay } from "@/lib/code-indent";
import { autolinkBareUrls } from "@/lib/autolink";
import { getPrePlainText } from "@/lib/editor-code";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatInlineMarkdown(text: string, opts?: { skipHashtagSpans?: boolean }): string {
  const segments = splitTextByHashtags(text);

  return segments
    .map((seg) => {
      if (seg.type === "hashtag") {
        const tag = escapeHtml(seg.value);
        if (opts?.skipHashtagSpans) {
          return escapeHtml(seg.label);
        }
        return `<span class="nf-hashtag" dir="ltr" data-hashtag="${tag}">#${tag}</span>`;
      }

      let s = escapeHtml(seg.value);
      s = s.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/(?<!\*)\*(?!\*)([\s\S]+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
      s = s.replace(/~~([\s\S]+?)~~/g, '<span class="nf-md-strike">$1</span>');
      s = s.replace(/`([\s\S]+?)`/g, '<code class="nf-md-inline-code" dir="ltr">$1</code>');
      s = s.replace(/\^([\s\S]+?)\^/g, "<sup>$1</sup>");
      s = s.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="nf-editor-img" />'
      );
      s = s.replace(
        /\[([\s\S]*?)\]\(([\s\S]*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="nf-md-link">$1</a>'
      );
      s = s.replace(
        />!([\s\S]+?)!</g,
        '<span class="nf-spoiler" data-spoiler="true" contenteditable="true">$1</span>'
      );
      s = autolinkBareUrls(s);
      return s;
    })
    .join("");
}

function normalizeTableCellText(text: string, el?: HTMLElement): string {
  const t = text.trim().replace(/\n/g, " ");
  if (!t) return "";
  const ph = el?.getAttribute("data-placeholder")?.trim();
  if (ph && t === ph) return "";
  if (t === "اكتب هنا…" || t === "Type here…" || t === "خلية" || t === "Cell") return "";
  return t
    .replace(/\|/g, "\\|")
    .replace(/#+\s+/g, "")
    .replace(/^>\s+/g, "")
    .replace(/^[-*]\s+/g, "")
    .replace(/^\d+\.\s+/g, "");
}

export function htmlToMarkdown(html: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  function cleanText(text: string): string {
    return text.replace(/\n\s*\n\s*\n/g, "\n\n").trim();
  }

  function serialize(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toUpperCase();

    let childrenMarkdown = "";
    el.childNodes.forEach((child) => {
      childrenMarkdown += serialize(child);
    });

    switch (tagName) {
      case "B":
      case "STRONG": {
        const text = childrenMarkdown.replace(/\n+/g, " ").trim();
        return text ? `**${text}**` : "";
      }
      case "I":
      case "EM": {
        const text = childrenMarkdown.replace(/\n+/g, " ").trim();
        return text ? `*${text}*` : "";
      }
      case "S":
      case "STRIKE":
      case "DEL": {
        const text = childrenMarkdown.replace(/\n+/g, " ").trim();
        return text ? `~~${text}~~` : "";
      }
      case "IMG": {
        const alt = el.getAttribute("alt") || "image";
        const src = el.getAttribute("src") || "";
        return src ? `![${alt}](${src})` : "";
      }
      case "CODE": {
        if (el.parentElement?.tagName.toUpperCase() === "PRE") {
          return el.textContent ?? "";
        }
        const text = childrenMarkdown.replace(/\n+/g, " ").trim();
        if (/^\[[^\]]+\]\([^)]+\)$/.test(text)) return text;
        return text ? `\`${text}\`` : "";
      }
      case "PRE": {
        const lang = el.getAttribute("data-lang")?.trim() || "";
        const code = getPrePlainText(el);
        return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
      }
      case "A": {
        const text = childrenMarkdown.replace(/\n+/g, " ").trim();
        return `[${text}](${el.getAttribute("href") || ""})`;
      }
      case "SUP": {
        const text = childrenMarkdown.replace(/\n+/g, " ").trim();
        return text ? `^${text}^` : "";
      }
      case "H1":
        return `\n# ${childrenMarkdown.trim()}\n`;
      case "H2":
        return `\n## ${childrenMarkdown.trim()}\n`;
      case "H3":
        return `\n### ${childrenMarkdown.trim()}\n`;
      case "BLOCKQUOTE":
        return `\n> ${childrenMarkdown.trim().replace(/\n/g, "\n> ")}\n`;
      case "UL":
        return `\n${childrenMarkdown}\n`;
      case "OL": {
        let index = 1;
        let md = "\n";
        el.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toUpperCase() === "LI") {
            let liText = "";
            child.childNodes.forEach((liChild) => {
              liText += serialize(liChild);
            });
            md += `${index}. ${liText.trim()}\n`;
            index++;
          } else {
            md += serialize(child);
          }
        });
        return md + "\n";
      }
      case "LI":
        return `- ${childrenMarkdown.trim()}\n`;
      case "P":
      case "DIV":
        if (el.classList.contains("nf-table-quick-bar")) return "";
        if (el.classList.contains("nf-editor-table-wrap")) {
          const table = el.querySelector("table");
          return table ? serialize(table) : "";
        }
        if (childrenMarkdown.trim() === "") return "";
        return `\n${childrenMarkdown.trim()}\n`;
      case "BR":
        return "\n";
      case "TABLE": {
        let markdownTable = "\n";
        const rows = Array.from(el.querySelectorAll("tr"));
        if (rows.length === 0) return "";

        let maxCols = 0;
        const matrix = rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("th, td")).map((cell) => {
            let cellText = "";
            cell.childNodes.forEach((child) => {
              cellText += serialize(child);
            });
            return normalizeTableCellText(cellText, cell as HTMLElement)
          });
          if (cells.length > maxCols) maxCols = cells.length;
          return cells;
        });

        if (matrix.length === 0) return "";

        const headers = matrix[0] || [];
        while (headers.length < maxCols) headers.push("");
        markdownTable += "| " + headers.join(" | ") + " |\n";

        const separator = Array.from({ length: maxCols }).map(() => "---");
        markdownTable += "| " + separator.join(" | ") + " |\n";

        for (let r = 1; r < matrix.length; r++) {
          const rowCells = matrix[r] || [];
          while (rowCells.length < maxCols) rowCells.push("");
          markdownTable += "| " + rowCells.join(" | ") + " |\n";
        }

        return markdownTable + "\n";
      }
      case "SPAN": {
        if (el.classList.contains("nf-hashtag") || el.hasAttribute("data-hashtag")) {
          const tag = (el.getAttribute("data-hashtag") || childrenMarkdown).replace(/^#/, "").trim();
          return tag ? `#${tag}` : "";
        }
        if (el.classList.contains("nf-md-strike")) {
          const text = childrenMarkdown.replace(/\n+/g, " ").trim();
          return text ? `~~${text}~~` : "";
        }
        let text = childrenMarkdown.replace(/\n+/g, " ");
        if (el.classList.contains("nf-spoiler") || el.getAttribute("data-spoiler") === "true") {
          return `>!${text.trim()}!<`;
        }
        const style = el.style;
        if (style.fontWeight === "bold" || style.fontWeight === "700" || el.className.includes("font-bold")) {
          text = `**${text}**`;
        }
        if (style.fontStyle === "italic" || el.className.includes("italic")) {
          text = `*${text}*`;
        }
        if (style.textDecoration.includes("line-through") || style.textDecorationLine === "line-through") {
          text = `~~${text}~~`;
        }
        if (style.verticalAlign === "super" || el.className.includes("super")) {
          text = `^${text}^`;
        }
        return text;
      }
      default:
        return childrenMarkdown;
    }
  }

  return cleanText(serialize(doc.body));
}

export type MarkdownToHtmlOptions = {
  /** في المحرر الحي: لا نلوّن هاشتاغات غير مكتملة عبر HTML — فقط decorateHashtagsInEditor */
  skipHashtagSpans?: boolean;
};

export function markdownToHtml(markdown: string, options?: MarkdownToHtmlOptions): string {
  if (!markdown) return "";

  const inline = (line: string) => formatInlineMarkdown(line, options);
  const lines = markdown.split("\n");
  let inCode = false;
  let codeLang = "";
  let codeContent: string[] = [];
  let inUl = false;
  let inOl = false;
  let inQuote = false;
  const outputLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        inCode = false;
        const raw = prepareCodeForDisplay(codeContent.join("\n"));
        const lang = codeLang || guessCodeLang(raw);
        const highlighted =
          typeof window !== "undefined" ? highlightCode(raw, lang) : escapeHtml(raw);
        outputLines.push(
          `<pre class="nf-editor-pre nf-code-block" dir="ltr" data-lang="${escapeHtml(lang)}"><code class="nf-hl-code" dir="ltr">${highlighted}</code></pre>`
        );
        codeContent = [];
        codeLang = "";
      } else {
        inCode = true;
        codeLang = line.trimStart().slice(3).trim();
      }
      continue;
    }
    if (inCode) {
      codeContent.push(line);
      continue;
    }

    if (line.startsWith("### ")) {
      outputLines.push(
        `<h3 class="nf-md-h3">${inline(line.slice(4))}</h3>`
      );
      continue;
    }
    if (line.startsWith("## ")) {
      outputLines.push(
        `<h2 class="nf-md-h2">${inline(line.slice(3))}</h2>`
      );
      continue;
    }
    if (line.startsWith("# ")) {
      outputLines.push(
        `<h1 class="nf-md-h1">${inline(line.slice(2))}</h1>`
      );
      continue;
    }

    const collected = collectMarkdownTableRows(lines, i);
    if (collected) {
      const { rows: tableRows, endIndex } = collected;
      if (tableRows.length > 0) {
        const maxCols = Math.max(...tableRows.map((r) => r.length));
        let tableHtml = `<div class="nf-editor-table-wrap"><div class="nf-table-quick-bar" contenteditable="false"><button type="button" class="nf-table-qbtn" data-nf-table-action="add-col">+ عمود</button><button type="button" class="nf-table-qbtn" data-nf-table-action="add-row">+ صف</button><span class="nf-table-hint">⋯ داخل الخلية للمزيد</span></div><table class="nf-editor-table"><tbody>`;
        tableRows.forEach((r, ri) => {
          tableHtml += "<tr>";
          for (let c = 0; c < maxCols; c++) {
            const val = inline(r[c] || "");
            if (ri === 0) {
              tableHtml += `<th class="nf-tcell" data-placeholder="عنوان">${val || "<br>"}</th>`;
            } else {
              tableHtml += `<td class="nf-tcell" data-placeholder="اكتب هنا…">${val || "<br>"}</td>`;
            }
          }
          tableHtml += "</tr>";
        });
        tableHtml += "</tbody></table></div>";
        outputLines.push(tableHtml);
        i = endIndex;
        continue;
      }
    }

    if (isMarkdownTableSeparatorLine(line)) continue;

    if (isMarkdownListItem(line)) {
      if (inOl) {
        outputLines.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        outputLines.push('<ul class="nf-md-ul">');
        inUl = true;
      }
      outputLines.push(
        `<li>${inline(line.replace(/^[-*]\s/, ""))}</li>`
      );
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      if (inUl) {
        outputLines.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        outputLines.push('<ol class="nf-md-ol">');
        inOl = true;
      }
      outputLines.push(
        `<li>${inline(line.replace(/^\d+\.\s/, ""))}</li>`
      );
      continue;
    }

    if (inUl && !isMarkdownListItem(line)) {
      outputLines.push("</ul>");
      inUl = false;
    }
    if (inOl && !line.match(/^\d+\.\s/)) {
      outputLines.push("</ol>");
      inOl = false;
    }

    if (line.startsWith("> ")) {
      if (!inQuote) {
        outputLines.push('<blockquote class="nf-md-quote">');
        inQuote = true;
      }
      outputLines.push(inline(line.slice(2)));
      continue;
    }
    if (inQuote && !line.startsWith("> ")) {
      outputLines.push("</blockquote>");
      inQuote = false;
    }

    if (line.match(/^---+$|^\*\*\*+$|^___+$/)) {
      outputLines.push('<hr class="nf-md-hr" />');
      continue;
    }

    if (!line.trim()) {
      outputLines.push("<p><br></p>");
      continue;
    }

    outputLines.push(`<p>${inline(line)}</p>`);
  }

  if (inUl) outputLines.push("</ul>");
  if (inOl) outputLines.push("</ol>");
  if (inQuote) outputLines.push("</blockquote>");

  return outputLines.join("");
}

/** Wrap plain #tags in styled spans inside the live editor (مكتملة فقط — يليها مسافة/نهاية) */
export function decorateHashtagsInEditor(root: HTMLElement): void {
  const skip = "pre, code, .nf-spoiler, .nf-hashtag, a, h1, h2, h3, th, td";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || parent.closest(skip)) continue;
    const text = node.textContent || "";
    if (text.includes("#")) targets.push(node as Text);
  }

  for (const textNode of targets) {
    const text = textNode.textContent || "";

    // فقط هاشتاغ مكتمل (يليه مسافة أو نهاية) — لا نلوّن # أثناء الكتابة
    const re = /#([\p{L}\p{N}_][\p{L}\p{N}_-]{0,31})(?=[\s,.!?،؛:\n\r])/gu;
    if (!re.test(text)) continue;
    re.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      const span = document.createElement("span");
      span.className = "nf-hashtag";
      span.setAttribute("dir", "ltr");
      span.setAttribute("data-hashtag", m[1]);
      span.textContent = `#${m[1]}`;
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

export { saveSelectionOffsets as saveEditorSelection, restoreSelectionOffsets as restoreEditorSelection } from "@/lib/editor-selection";
export type { EditorSelectionOffsets } from "@/lib/editor-selection";
