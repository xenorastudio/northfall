"use client";

import "./rich-editor.css";
import { useState, useEffect, useRef, useCallback, memo, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Heading2,
  AlertCircle,
  Monitor,
  Superscript,
  Image as ImageIcon,
  Table2,
  FileCode2,
  Minus,
  Hash,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import {
  htmlToMarkdown,
  markdownToHtml,
  saveEditorSelection,
  restoreEditorSelection,
} from "@/lib/rich-content-markdown";
import { buildDefaultTableHtml, getTableContextFromSelection, menuPositionNearRect, dotsPositionInCell, insertTableColumnAtEnd, insertTableRowAtEnd, type TableMenuState } from "@/lib/editor-table";
import { guessCodeLang } from "@/lib/code-highlight";
import { normalizePostBodyMarkdown } from "@/lib/markdown-body";
import { insertCodeBlockInEditor, paintCodeHighlights, stripCodeHighlights } from "@/lib/editor-code";
import { looksLikeCodePaste } from "@/lib/code-indent";
import EditorTableMenu from "./EditorTableMenu";
import EditorLinkBubble, { type LinkBubbleState } from "./EditorLinkBubble";
import { useI18n } from "./I18nProvider";
import {
  getHashtagSuggestions,
  prefetchHashtagPool,
  type HashtagSuggestion,
} from "@/lib/hashtag-suggestions";
import {
  getHashtagQueryAtEditor,
  insertHashtagAtRange,
  replacePlainTextRange,
  getCaretViewportPosition,
  stripEditorHashtagSpans,
} from "@/lib/editor-hashtag";
import {
  getMentionQueryAtEditor,
  getMentionSuggestions,
  mentionHandleFromDisplayName,
  prefetchFollowingMentions,
  type MentionSuggestion,
} from "@/lib/mention-suggestions";

export type RichContentEditorHandle = {
  /** Sync editor DOM → markdown immediately (for preview / submit) */
  flush: () => string;
};

export interface RichContentEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder: string;
  minHeight?: number;
  className?: string;
  variant?: "post" | "comment";
  submitLabel?: string;
  onSubmit?: (markdownText: string) => void;
  onCancel?: () => void;
  replyToName?: string;
  onClearReply?: () => void;
  user?: { displayName?: string; photoURL?: string } | null;
  shareSpecs?: boolean;
  onToggleSpecs?: () => void;
  t?: (key: string) => string;
  autoFocus?: boolean;
  noSpecs?: boolean;
  /** Comment: hide toolbar/footer until the user types */
  expandChromeOnInput?: boolean;
  onDismiss?: () => void;
}

type ToolbarBtn = {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  action: () => void;
  postOnly?: boolean;
};

function ToolbarDivider() {
  return <span className="w-px h-4 bg-nf-border-2/40 mx-0.5 shrink-0" aria-hidden />;
}

const RichContentEditor = forwardRef<RichContentEditorHandle, RichContentEditorProps>(function RichContentEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
  className,
  variant = "post",
  submitLabel = "نشر",
  onSubmit,
  onCancel,
  user,
  shareSpecs,
  onToggleSpecs,
  t: tProp,
  autoFocus = false,
  noSpecs = false,
  expandChromeOnInput = false,
  onDismiss,
}, ref) {
  const { t: tI18n, lang } = useI18n();
  const t = tProp ?? tI18n;
  const isAr = lang === "ar";
  const isComment = variant === "comment";
  const { user: authUser } = useAuth();

  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const textRef = useRef(value);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextRender = useRef(false);
  const linkBubbleActiveRef = useRef(false);
  const skipDomRebuildRef = useRef(false);

  const closeLinkBubble = useCallback(() => {
    linkBubbleActiveRef.current = false;
    setLinkBubble(null);
  }, []);

  const [hasContent, setHasContent] = useState(!!value.trim());
  const [linkBubble, setLinkBubble] = useState<LinkBubbleState | null>(null);
  const [tableMenu, setTableMenu] = useState<TableMenuState | null>(null);
  const [activeTableCell, setActiveTableCell] = useState<HTMLTableCellElement | null>(null);

  const tagMenuRef = useRef<HTMLDivElement>(null);
  const tagFetchSeq = useRef(0);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagItems, setTagItems] = useState<HashtagSuggestion[]>([]);
  const [tagIdx, setTagIdx] = useState(0);
  const [tagAnchor, setTagAnchor] = useState<{ start: number; query: string; cursor: number } | null>(null);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagMenuPos, setTagMenuPos] = useState({ top: 0, left: 0, width: 200, placeAbove: false });

  const mentionMenuRef = useRef<HTMLDivElement>(null);
  const mentionFetchSeq = useRef(0);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionItems, setMentionItems] = useState<MentionSuggestion[]>([]);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [mentionAnchor, setMentionAnchor] = useState<{ start: number; query: string; cursor: number } | null>(null);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionMenuPos, setMentionMenuPos] = useState({ top: 0, left: 0, width: 200, placeAbove: false });

  const applyHtml = useCallback((md: string) => {
    const el = editorRef.current;
    if (!el) return;
    const normalized = normalizePostBodyMarkdown(md);
    const html = markdownToHtml(normalized, { skipHashtagSpans: true });
    el.innerHTML = html || "";
    paintCodeHighlights(el);
  }, []);

  const queueParentChange = useCallback(
    (md: string, delayMs: number) => {
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        if (md === lastEmitted.current) return;
        lastEmitted.current = md;
        skipNextRender.current = true;
        onChange(md);
      }, delayMs);
    },
    [onChange]
  );

  const flushMarkdown = useCallback(() => {
    if (emitTimer.current) clearTimeout(emitTimer.current);
    const el = editorRef.current;
    if (!el) return normalizePostBodyMarkdown(textRef.current);
    const md = normalizePostBodyMarkdown(htmlToMarkdown(el.innerHTML));
    textRef.current = md;
    lastEmitted.current = md;
    skipNextRender.current = true;
    setHasContent(!!md.trim());
    onChange(md);
    return md;
  }, [onChange]);

  useImperativeHandle(ref, () => ({ flush: flushMarkdown }), [flushMarkdown]);

  const menusOpenRef = useRef(false);
  useEffect(() => {
    menusOpenRef.current = tagOpen || mentionOpen;
  }, [tagOpen, mentionOpen]);

  const emitMarkdownOnly = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const md = normalizePostBodyMarkdown(htmlToMarkdown(el.innerHTML));
    textRef.current = md;
    setHasContent(!!md.trim());
    queueParentChange(md, 300);
  }, [queueParentChange]);

  const syncFromEditor = useCallback(
    (opts?: { rebuild?: boolean }) => {
      const el = editorRef.current;
      if (!el) return;

      const rebuild = opts?.rebuild === true && !skipDomRebuildRef.current;
      skipDomRebuildRef.current = false;

      stripEditorHashtagSpans(el);

      const raw = htmlToMarkdown(el.innerHTML);
      const md = normalizePostBodyMarkdown(raw);
      const needsReapply = md !== raw;

      textRef.current = md;
      setHasContent(!!md.trim());
      queueParentChange(md, 150);

      if (rebuild && needsReapply) {
        const offsets = saveEditorSelection(el);
        requestAnimationFrame(() => {
          applyHtml(md);
          restoreEditorSelection(el, offsets);
          paintCodeHighlights(el);
        });
      } else {
        paintCodeHighlights(el);
      }
    },
    [applyHtml, queueParentChange]
  );

  useEffect(() => {
    if (value === lastEmitted.current) return;
    if (skipNextRender.current) {
      skipNextRender.current = false;
      return;
    }
    lastEmitted.current = value;
    textRef.current = value;
    applyHtml(value);
  }, [value, applyHtml]);

  useEffect(() => {
    applyHtml(value);
    if (autoFocus) {
      requestAnimationFrame(() => editorRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void prefetchHashtagPool();
    if (authUser?.uid) void prefetchFollowingMentions(authUser.uid);
  }, [authUser?.uid]);

  const closeAllSuggestMenus = useCallback(() => {
    tagFetchSeq.current++;
    mentionFetchSeq.current++;
    menusOpenRef.current = false;
    setTagOpen(false);
    setTagAnchor(null);
    setTagItems([]);
    setTagLoading(false);
    setMentionOpen(false);
    setMentionAnchor(null);
    setMentionItems([]);
    setMentionLoading(false);
  }, []);

  useEffect(() => {
    linkBubbleActiveRef.current = !!linkBubble;
  }, [linkBubble]);

  useEffect(() => {
    if (!tagOpen && !mentionOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (tagMenuRef.current?.contains(target) || mentionMenuRef.current?.contains(target)) return;
      if (editorRef.current?.contains(target)) return;
      closeAllSuggestMenus();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [tagOpen, mentionOpen, closeAllSuggestMenus]);

  useEffect(() => {
    if (!linkBubble) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.("[data-nf-link-bubble]")) return;
      if (editorRef.current?.contains(target)) return;
      closeLinkBubble();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [linkBubble, closeLinkBubble]);

  const openLinkEdit = useCallback((anchor: HTMLAnchorElement) => {
    linkBubbleActiveRef.current = true;
    setLinkBubble({
      mode: "edit",
      rect: anchor.getBoundingClientRect(),
      anchor,
    });
  }, []);

  const syncMentionMenu = useCallback(() => {
    const el = editorRef.current;
    if (!el) return false;
    const info = getMentionQueryAtEditor(el);
    setMentionAnchor(info);
    menusOpenRef.current = !!info;
    if (!info) {
      setMentionOpen(false);
      setMentionItems([]);
      setMentionLoading(false);
      menusOpenRef.current = false;
      return false;
    }

    setTagOpen(false);
    setTagAnchor(null);

    menusOpenRef.current = true;
    const seq = ++mentionFetchSeq.current;
    setMentionLoading(true);
    setMentionOpen(true);
    setMentionMenuPos(getCaretViewportPosition(el, 260, 280));

    void getMentionSuggestions(info.query, authUser?.uid).then((list) => {
      if (seq !== mentionFetchSeq.current) return;
      const now = getMentionQueryAtEditor(el);
      if (!now || now.start !== info.start) {
        setMentionOpen(false);
        setMentionLoading(false);
        return;
      }
      setMentionItems(list);
      setMentionIdx(0);
      setMentionLoading(false);
      setMentionOpen(list.length > 0 || info.query.length >= 0);
      setMentionMenuPos(getCaretViewportPosition(el, 260, 280));
    });
    return true;
  }, [authUser?.uid]);

  const syncHashtagMenu = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const info = getHashtagQueryAtEditor(el);
    setTagAnchor(info);
    if (!info) {
      setTagOpen(false);
      setTagItems([]);
      setTagLoading(false);
      menusOpenRef.current = false;
      return;
    }

    menusOpenRef.current = true;
    setMentionOpen(false);
    setMentionAnchor(null);

    const seq = ++tagFetchSeq.current;
    setTagLoading(true);
    setTagOpen(true);
    setTagMenuPos(getCaretViewportPosition(el, 220, 260));

    void getHashtagSuggestions(info.query).then((list) => {
      if (seq !== tagFetchSeq.current) return;
      const now = getHashtagQueryAtEditor(el);
      if (!now || now.start !== info.start) {
        setTagOpen(false);
        setTagLoading(false);
        return;
      }
      setTagItems(list);
      setTagIdx(0);
      setTagLoading(false);
      setTagOpen(true);
      setTagMenuPos(getCaretViewportPosition(el, 220, 260));
    });
  }, []);

  const applyHashtagTag = useCallback(
    (tag: string) => {
      const el = editorRef.current;
      if (!el) return;
      const info = getHashtagQueryAtEditor(el) ?? tagAnchor;
      if (!info) return;

      closeAllSuggestMenus();
      insertHashtagAtRange(el, info.start, info.cursor, tag);

      requestAnimationFrame(() => {
        editorRef.current?.focus();
        emitMarkdownOnly();
      });
    },
    [tagAnchor, emitMarkdownOnly, closeAllSuggestMenus]
  );

  const applyMention = useCallback(
    (item: MentionSuggestion) => {
      const el = editorRef.current;
      if (!el) return;
      const info = getMentionQueryAtEditor(el) ?? mentionAnchor;
      if (!info) return;
      const handle = mentionHandleFromDisplayName(item.displayName);
      const { start, cursor } = info;

      closeAllSuggestMenus();
      replacePlainTextRange(el, start, cursor, `@${handle} `);

      requestAnimationFrame(() => {
        editorRef.current?.focus();
        emitMarkdownOnly();
      });
    },
    [mentionAnchor, emitMarkdownOnly, closeAllSuggestMenus]
  );

  const syncAutocompleteMenus = useCallback(() => {
    if (syncMentionMenu()) return;
    syncHashtagMenu();
  }, [syncMentionMenu, syncHashtagMenu]);

  const scheduleSync = useCallback(() => {
    const el = editorRef.current;
    if (el) {
      stripEditorHashtagSpans(el);
      setHasContent(!!el.textContent?.trim());
    }

    requestAnimationFrame(() => syncAutocompleteMenus());

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(emitMarkdownOnly, 200);
  }, [emitMarkdownOnly, syncAutocompleteMenus]);

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      if (menuSyncTimer.current) clearTimeout(menuSyncTimer.current);
      if (emitTimer.current) clearTimeout(emitTimer.current);
    };
  }, []);

  const focusEditor = () => editorRef.current?.focus();

  const execFormat = (cmd: string, val?: string) => {
    focusEditor();
    document.execCommand(cmd, false, val);
    emitMarkdownOnly();
  };

  const applyBold = () => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    if (sel.isCollapsed) {
      insertHtml(`<strong>${isAr ? "نص" : "text"}</strong>`, false);
      return;
    }
    if (!document.execCommand("bold")) {
      wrapSelection("<strong>", "</strong>", isAr ? "نص" : "text", false);
      return;
    }
    emitMarkdownOnly();
  };

  const applyItalic = () => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.isCollapsed) {
      insertHtml(`<em>${isAr ? "نص مائل" : "italic"}</em>`, false);
      return;
    }
    const ok = document.execCommand("italic");
    if (!ok) {
      wrapSelection("<em>", "</em>", isAr ? "نص مائل" : "italic", false);
      return;
    }
    emitMarkdownOnly();
  };

  const insertHtml = (html: string, fullSync = true) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    if (fullSync) syncFromEditor({ rebuild: true });
    else emitMarkdownOnly();
  };

  const applyLinkToRange = useCallback(
    (url: string, label: string, range: Range) => {
      const el = editorRef.current;
      if (!el) return;
      let href = url.trim();
      if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
      focusEditor();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      const text = label.trim() || range.toString() || href;
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${href}" target="_blank" rel="noopener noreferrer" class="nf-md-link">${text}</a>`
      );
      emitMarkdownOnly();
      closeLinkBubble();
    },
    [emitMarkdownOnly, closeLinkBubble]
  );

  const updateExistingLink = useCallback(
    (anchor: HTMLAnchorElement, url: string, label: string) => {
      let href = url.trim();
      if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
      anchor.setAttribute("href", href);
      anchor.textContent = label.trim() || href;
      anchor.classList.add("nf-md-link");
      anchor.style.color = "inherit";
      anchor.style.textDecoration = "underline";
      emitMarkdownOnly();
      closeLinkBubble();
    },
    [emitMarkdownOnly, closeLinkBubble]
  );

  const removeLink = useCallback(
    (anchor: HTMLAnchorElement) => {
      const text = anchor.textContent || "";
      anchor.replaceWith(document.createTextNode(text));
      emitMarkdownOnly();
    },
    [emitMarkdownOnly]
  );

  const wrapSelection = (
    prefix: string,
    suffix: string,
    fallback: string,
    fullSync = true
  ) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const selected = sel.toString() || fallback;
    insertHtml(`${prefix}${selected}${suffix}`, fullSync);
  };

  const handleLinkOpen = () => {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !editorRef.current?.contains(sel.anchorNode)) return;
    if (sel.isCollapsed) {
      const node = sel.anchorNode;
      const parent = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
      const linkEl = parent?.closest("a.nf-md-link") as HTMLAnchorElement | null;
      if (linkEl) {
        linkBubbleActiveRef.current = true;
        setLinkBubble({ mode: "edit", rect: linkEl.getBoundingClientRect(), anchor: linkEl });
        return;
      }
      linkBubbleActiveRef.current = true;
      setLinkBubble({
        mode: "create",
        selectedText: "",
        range: sel.getRangeAt(0).cloneRange(),
      });
      return;
    }
    const text = sel.toString().trim();
    if (!text) return;
    linkBubbleActiveRef.current = true;
    setLinkBubble({
      mode: "create",
      selectedText: text,
      range: sel.getRangeAt(0).cloneRange(),
    });
  };

  const handleImage = () => {
    const url = prompt(isAr ? "رابط الصورة (URL):" : "Image URL:");
    if (!url?.trim()) return;
    insertHtml(`<img src="${url.trim()}" alt="" class="nf-editor-img" />`);
  };

  const handleSpoiler = () => {
    wrapSelection(
      '<span class="nf-spoiler" data-spoiler="true">',
      "</span>",
      isAr ? "حرق" : "spoiler"
    );
  };

  const handleHeading = () => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node: Node | null = sel.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const block = (node as HTMLElement | null)?.closest?.("h1,h2,h3,p,div");

    if (block && /^H[1-3]$/i.test(block.tagName)) {
      document.execCommand("formatBlock", false, "p");
      emitMarkdownOnly();
      return;
    }

    if (sel.isCollapsed && !block?.textContent?.replace(/\u200B/g, "").trim()) {
      insertHtml(`<h2>${isAr ? "عنوان" : "Heading"}</h2>`);
      return;
    }

    document.execCommand("formatBlock", false, "h2");
    emitMarkdownOnly();
  };

  const openMenuForCell = (cell: HTMLTableCellElement) => {
    const table = cell.closest("table") as HTMLTableElement | null;
    if (!table) return;
    const { cellRect } = dotsPositionInCell(cell);
    const pos = menuPositionNearRect(cellRect);
    setTableMenu({ table, cell, ...pos });
  };

  const applyInlineCode = () => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!sel.isCollapsed) {
      const selected = sel.toString();
      const esc = selected
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      insertHtml(`<code class="nf-md-inline-code" dir="ltr">${esc}</code>`);
      return;
    }
    insertHtml(`<code class="nf-md-inline-code" dir="ltr">${isAr ? "كود" : "code"}</code>`);
  };

  const handleCodeBlock = () => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    const sample = isAr
      ? "function greet(user) {\n  return `Hello, ${user}!`;\n}\nconsole.log(greet('Alice')); // Outputs: Hello, Alice!"
      : "function greet(user) {\n  return `Hello, ${user}!`;\n}\nconsole.log(greet('Alice')); // Outputs: Hello, Alice!";
    let raw = sample;
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.toString().trim()) {
      raw = sel.toString();
    }
    insertCodeBlockInEditor(el, raw, guessCodeLang(raw));
    emitMarkdownOnly();
  };

  const handleTable = () => {
    const ctx = getTableContextFromSelection();
    if (ctx) {
      setActiveTableCell(ctx.cell);
      openMenuForCell(ctx.cell);
      return;
    }
    insertHtml(buildDefaultTableHtml(isAr));
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const tableAction = target.closest("[data-nf-table-action]") as HTMLElement | null;
    if (tableAction) {
      e.preventDefault();
      const wrap = tableAction.closest(".nf-editor-table-wrap");
      const table = wrap?.querySelector("table") as HTMLTableElement | null;
      if (table) {
        const action = tableAction.getAttribute("data-nf-table-action");
        const ctx = getTableContextFromSelection();
        const cell = ctx?.table === table ? ctx.cell : (table.querySelector("td, th") as HTMLTableCellElement);
        if (action === "add-col") insertTableColumnAtEnd(table);
        else if (action === "add-row") insertTableRowAtEnd(table);
        if (cell) setActiveTableCell(cell);
        emitMarkdownOnly();
      }
      return;
    }

    if (target.closest(".nf-spoiler")) {
      target.closest(".nf-spoiler")?.classList.toggle("revealed");
      return;
    }

    const linkEl = target.closest("a.nf-md-link") as HTMLAnchorElement | null;
    if (linkEl && editorRef.current?.contains(linkEl)) {
      e.preventDefault();
      openLinkEdit(linkEl);
      return;
    }

    if (target.closest(".nf-table-dots-btn")) return;

    const cell = target.closest("td, th") as HTMLTableCellElement | null;
    if (cell && editorRef.current?.contains(cell)) {
      setActiveTableCell(cell);
      return;
    }
    setActiveTableCell(null);
    setTableMenu(null);
  };

  const handleHr = () => {
    insertHtml('<hr class="nf-md-hr" /><p><br></p>');
  };

  const handleSubmit = () => {
    syncFromEditor({ rebuild: true });
    const md = editorRef.current ? htmlToMarkdown(editorRef.current.innerHTML) : textRef.current;
    if (!md.trim()) return;
    if (!isComment || !onSubmit) {
      lastEmitted.current = md;
      textRef.current = md;
      onChange(md);
      return;
    }
    onSubmit(md);
    textRef.current = "";
    lastEmitted.current = "";
    onChange("");
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionOpen && mentionItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIdx((i) => Math.min(i + 1, mentionItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyMention(mentionItems[mentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        setMentionAnchor(null);
        return;
      }
    }

    if (tagOpen && tagItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setTagIdx((i) => Math.min(i + 1, tagItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setTagIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyHashtagTag(tagItems[tagIdx].tag);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setTagOpen(false);
        setTagAnchor(null);
        return;
      }
    }

    const inPre = (e.target as HTMLElement).closest?.("pre.nf-editor-pre");
    if (inPre && e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      scheduleSync();
      return;
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isComment) handleSubmit();
      return;
    }
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !mentionOpen && !tagOpen) {
      skipDomRebuildRef.current = true;
    }

    if (e.key === "#" || e.key === "@") {
      requestAnimationFrame(() => syncAutocompleteMenus());
    }

    if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      applyBold();
    }
    if (e.key === "i" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      applyItalic();
    }
  };

  const handleEditorFocusIn = (e: React.FocusEvent<HTMLDivElement>) => {
    const pre = (e.target as HTMLElement).closest?.("pre.nf-editor-pre") as HTMLElement | null;
    if (pre && editorRef.current) stripCodeHighlights(editorRef.current, pre);
  };

  const handleEditorFocusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    const el = editorRef.current;
    if (!el) return;
    const related = e.relatedTarget as Node | null;
    if (
      related &&
      (el.contains(related) ||
        tagMenuRef.current?.contains(related) ||
        mentionMenuRef.current?.contains(related) ||
        (related instanceof HTMLElement && related.closest?.("[data-nf-link-bubble]")))
    ) {
      return;
    }
    setTagOpen(false);
    setTagAnchor(null);
    setMentionOpen(false);
    setMentionAnchor(null);
    menusOpenRef.current = false;
    paintCodeHighlights(el);
    emitMarkdownOnly();
    if (expandChromeOnInput && !textRef.current.trim()) {
      onDismiss?.();
    }
  };

  const showCommentChrome = !isComment || !expandChromeOnInput || hasContent;

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plain = e.clipboardData.getData("text/plain");
    const el = editorRef.current;
    const inPre = (e.target as HTMLElement).closest?.("pre.nf-editor-pre");

    if (el && !inPre && looksLikeCodePaste(plain)) {
      insertCodeBlockInEditor(el, plain.trim(), guessCodeLang(plain));
      emitMarkdownOnly();
      return;
    }

    document.execCommand("insertText", false, plain);
    scheduleSync();
  };

  const toolbar: ToolbarBtn[] = [
    { icon: Bold, title: isAr ? "غامق" : "Bold", action: applyBold },
    { icon: Italic, title: isAr ? "مائل" : "Italic", action: applyItalic },
    { icon: Strikethrough, title: isAr ? "مشطوب" : "Strike", action: () => execFormat("strikeThrough") },
    { icon: Superscript, title: isAr ? "أس" : "Superscript", action: () => execFormat("superscript") },
    { icon: Heading2, title: isAr ? "عنوان / فقرة" : "Heading / paragraph", action: handleHeading },
    { icon: LinkIcon, title: isAr ? "رابط" : "Link", action: handleLinkOpen },
    { icon: ImageIcon, title: isAr ? "صورة" : "Image", action: handleImage },
    { icon: List, title: isAr ? "قائمة نقطية" : "Bullet list", action: () => execFormat("insertUnorderedList") },
    { icon: ListOrdered, title: isAr ? "قائمة مرقمة" : "Numbered list", action: () => execFormat("insertOrderedList") },
    { icon: AlertCircle, title: isAr ? "حرق (spoiler)" : "Spoiler", action: handleSpoiler },
    { icon: Quote, title: isAr ? "اقتباس" : "Quote", action: () => execFormat("formatBlock", "blockquote") },
    { icon: Code, title: isAr ? "كود سطر" : "Inline code", action: applyInlineCode },
    { icon: FileCode2, title: isAr ? "كتلة كود" : "Code block", action: handleCodeBlock },
    { icon: Table2, title: isAr ? "جدول" : "Table", action: handleTable },
    { icon: Minus, title: isAr ? "خط فاصل" : "Divider", action: handleHr },
  ];

  const visibleToolbar = toolbar;

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden flex flex-col",
        isComment ? "nf-comment-editor bg-transparent" : "bg-transparent",
        !className?.includes("border-0") && !isComment && "border border-nf-border-2/50",
        className
      )}
    >
      {showCommentChrome && (
      <div className={cn(
        "flex items-center gap-0.5 px-2 py-1.5 flex-wrap",
        isComment ? "bg-transparent border-b border-nf-border-2/30" : "bg-nf-secondary/15"
      )}>
        {visibleToolbar.map((btn, i) => (
          <span key={btn.title} className="contents">
            {i > 0 && (i === 4 || i === 6 || i === 9) && <ToolbarDivider />}
            <button
              type="button"
              title={btn.title}
              onMouseDown={(e) => {
                e.preventDefault();
                btn.action();
              }}
              className="p-1.5 rounded-md hover:bg-nf-hover text-nf-dim hover:text-nf-text transition-colors"
            >
              <btn.icon size={14} />
            </button>
          </span>
        ))}
        {!isComment && <div className="flex-1" />}
        {!isComment && (
          <span className="text-[10px] text-nf-dim/70 hidden sm:inline px-1">
            Ctrl+Enter{isAr ? " للنشر" : " submit"}
          </span>
        )}
      </div>
      )}

      <EditorLinkBubble
        state={linkBubble}
        onClose={closeLinkBubble}
        onApply={applyLinkToRange}
        onUpdate={updateExistingLink}
        onRemove={removeLink}
      />

      <div className={cn("relative", isComment && expandChromeOnInput && !hasContent && "flex items-start gap-2.5 px-2 py-2")}>
        {isComment && expandChromeOnInput && !hasContent && (
          <div className="shrink-0 pt-0.5">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-nf-secondary/40 flex items-center justify-center text-[10px] text-nf-muted font-bold">
                {(user?.displayName || "U")[0]}
              </div>
            )}
          </div>
        )}
        <div className="relative flex-1 min-w-0">
        {!hasContent && (
          <div
            className="absolute inset-x-0 top-0 px-3 py-2.5 text-[0.9375rem] text-nf-dim pointer-events-none select-none leading-relaxed truncate"
            aria-hidden
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
          data-enable-grammarly="false"
          role="textbox"
          aria-multiline
          aria-placeholder={placeholder}
          onInput={scheduleSync}
          onFocus={handleEditorFocusIn}
          onBlur={handleEditorFocusOut}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => {
            if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) return;
            if (menuSyncTimer.current) clearTimeout(menuSyncTimer.current);
            menuSyncTimer.current = setTimeout(() => syncAutocompleteMenus(), 120);
          }}
          onClick={(e) => {
            handleEditorClick(e);
            requestAnimationFrame(() => syncAutocompleteMenus());
          }}
          onPaste={handlePaste}
          style={{ minHeight: isComment && expandChromeOnInput && !hasContent ? 36 : minHeight }}
          className="nf-rich-editor w-full resize-y overflow-y-auto outline-none relative z-[1]"
        />
        </div>
      </div>

      {activeTableCell &&
        typeof document !== "undefined" &&
        createPortal(
          <button
            type="button"
            className="nf-table-dots-btn"
            style={{
              top: dotsPositionInCell(activeTableCell).y,
              left: dotsPositionInCell(activeTableCell).x,
            }}
            title="خيارات الجدول"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openMenuForCell(activeTableCell);
            }}
          >
            ⋯
          </button>,
          document.body
        )}

      <EditorTableMenu
        menu={tableMenu}
        onClose={() => setTableMenu(null)}
        onChange={() => syncFromEditor({ rebuild: true })}
      />

      {tagOpen && (tagItems.length > 0 || tagLoading) &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tagMenuRef}
            role="listbox"
            dir="rtl"
            style={{
              position: "fixed",
              top: tagMenuPos.top,
              left: tagMenuPos.left,
              width: tagMenuPos.width,
              zIndex: 10050,
            }}
            className={cn(
              "nf-editor-suggest-menu nf-editor-suggest-menu--tag",
              tagMenuPos.placeAbove && "origin-bottom"
            )}
          >
            <div className="nf-editor-suggest-head flex items-center gap-1.5">
              <Hash size={11} className="opacity-60 shrink-0" />
              <span>هاشتاقات</span>
            </div>
            {tagLoading && tagItems.length === 0 ? (
              <div className="px-3 py-3 text-[11px] opacity-60">جاري التحميل…</div>
            ) : (
              <ul>
                {tagItems.slice(0, 8).map((item, i) => (
                  <li key={item.tag}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === tagIdx}
                      onMouseEnter={() => setTagIdx(i)}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        applyHashtagTag(item.tag);
                      }}
                      className="w-full flex items-center justify-between gap-2"
                    >
                      <span dir="ltr" className="nf-suggest-tag truncate text-start">
                        #{item.tag.replace(/^-+|-+$/g, "")}
                      </span>
                      {item.count > 0 && (
                        <span className="shrink-0 text-[10px] tabular-nums opacity-50">{item.count}×</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}

      {mentionOpen && (mentionItems.length > 0 || mentionLoading) &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={mentionMenuRef}
            role="listbox"
            dir="rtl"
            style={{
              position: "fixed",
              top: mentionMenuPos.top,
              left: mentionMenuPos.left,
              width: mentionMenuPos.width,
              zIndex: 10051,
            }}
            className={cn(
              "nf-editor-suggest-menu nf-editor-suggest-menu--mention",
              mentionMenuPos.placeAbove && "origin-bottom"
            )}
          >
            <div className="nf-editor-suggest-head flex items-center gap-1.5">
              <AtSign size={11} className="opacity-60 shrink-0" />
              <span>إشارة مستخدم</span>
            </div>
            {mentionLoading && mentionItems.length === 0 ? (
              <div className="px-3 py-3 text-[11px] opacity-60">جاري البحث…</div>
            ) : (
              <ul>
                {mentionItems.slice(0, 8).map((item, i) => (
                  <li key={item.uid}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === mentionIdx}
                      onMouseEnter={() => setMentionIdx(i)}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        applyMention(item);
                      }}
                      className="w-full flex items-center gap-2.5 text-start"
                    >
                      <span className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold opacity-70 border border-[var(--border-subtle)]">
                        {item.photoURL ? (
                          <img src={item.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (item.displayName || "U")[0]
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-[12px] font-semibold">{item.displayName}</span>
                        <span dir="ltr" className="block truncate nf-suggest-handle">
                          @{mentionHandleFromDisplayName(item.displayName)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}

      {isComment && showCommentChrome && (
        <div className="flex items-center gap-2 px-3 pb-2 pt-1.5 border-t border-nf-border-2/20 bg-transparent">
          {!noSpecs && onToggleSpecs && (
            <button
              type="button"
              onClick={onToggleSpecs}
              title={
                shareSpecs
                  ? isAr ? "إلغاء مشاركة المواصفات" : "Stop sharing specs"
                  : isAr ? "شارك مواصفات جهازك" : "Share device specs"
              }
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all",
                shareSpecs ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted"
              )}
            >
              <Monitor size={12} />
              <span className="hidden sm:inline">{isAr ? "مواصفات" : "Specs"}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-nf-secondary flex items-center justify-center text-[8px] text-nf-muted font-bold">
                {(user?.displayName || "U")[0]}
              </div>
            )}
            <span className="text-[11px] text-nf-dim hidden sm:inline">
              {user?.displayName || (isAr ? "مستخدم" : "User")}
            </span>
          </div>

          <div className="flex-1" />

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
            >
              {t("pd.cancel") || (isAr ? "إلغاء" : "Cancel")}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasContent}
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-nf-accent text-nf-primary hover:opacity-90 disabled:bg-nf-secondary disabled:text-nf-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitLabel}
          </button>
        </div>
      )}
    </div>
  );
});

export default memo(RichContentEditor);
