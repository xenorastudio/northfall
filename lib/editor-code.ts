import { guessCodeLang, highlightCode } from "@/lib/code-highlight";
import { prepareCodeForDisplay } from "@/lib/code-indent";

function extractCodeTextPreservingIndent(root: HTMLElement): string {
  const lines: string[] = [];
  let current = "";

  const flushLine = () => {
    lines.push(current);
    current = "";
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += node.nodeValue ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (tag === "BR") {
      flushLine();
      return;
    }
    if (tag === "DIV" || tag === "P") {
      flushLine();
      el.childNodes.forEach(walk);
      flushLine();
      return;
    }
    el.childNodes.forEach(walk);
  };

  root.childNodes.forEach(walk);
  if (current.length) flushLine();

  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

export function getPrePlainText(pre: HTMLElement): string {
  const code = pre.querySelector("code");
  if (code) return extractCodeTextPreservingIndent(code);
  const parts: string[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      parts.push(n.nodeValue ?? "");
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const el = n as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (tag === "BR") {
      parts.push("\n");
      return;
    }
    if (tag === "DIV" || tag === "P") {
      if (parts.length && !parts[parts.length - 1]!.endsWith("\n")) parts.push("\n");
      el.childNodes.forEach(walk);
      if (!parts[parts.length - 1]?.endsWith("\n")) parts.push("\n");
      return;
    }
    el.childNodes.forEach(walk);
  };
  pre.childNodes.forEach(walk);
  return parts.join("").replace(/\n+$/, "");
}

export function stripCodeHighlights(root: HTMLElement, onlyPre?: HTMLElement) {
  const pres = onlyPre
    ? [onlyPre]
    : Array.from(root.querySelectorAll("pre.nf-editor-pre"));
  pres.forEach((pre) => {
    const code = pre.querySelector("code");
    if (code?.querySelector("span")) {
      code.textContent = code.textContent ?? "";
    }
  });
}

export function insertCodeBlockInEditor(editor: HTMLElement, raw: string, lang?: string) {
  const resolvedLang = lang || guessCodeLang(raw);
  editor.focus();
  const pre = document.createElement("pre");
  pre.className = "nf-editor-pre nf-code-block";
  pre.setAttribute("data-lang", resolvedLang);
  pre.setAttribute("dir", "ltr");
  const code = document.createElement("code");
  code.className = "nf-hl-code";
  code.setAttribute("dir", "ltr");
  code.textContent = raw;
  pre.appendChild(code);
  const after = document.createElement("p");
  after.appendChild(document.createElement("br"));

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    editor.appendChild(pre);
    editor.appendChild(after);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(after);
  range.insertNode(pre);
  range.setStartAfter(after);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  paintCodeHighlights(editor);
}

export function paintCodeHighlights(root: HTMLElement) {
  root.querySelectorAll("pre.nf-editor-pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;
    const raw = (code.textContent ?? "").replace(/\u200B/g, "");
    if (!raw.trim()) return;
    const lang = pre.getAttribute("data-lang") || guessCodeLang(raw);
    if (!pre.getAttribute("data-lang")) pre.setAttribute("data-lang", lang);
    const display = prepareCodeForDisplay(raw);
    code.className = "nf-hl-code";
    code.innerHTML = highlightCode(display, lang);
  });
}
