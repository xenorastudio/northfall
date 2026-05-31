import { getHashtagQueryAtCursor } from "@/lib/hashtag-suggestions";
import { findTextRange, getTextOffsetInRoot } from "@/lib/editor-selection";

/** موضع المؤشر كنص مسطح داخل contenteditable */
export function getTextOffsetBeforeSelection(root: HTMLElement): number {
  const sel = window.getSelection();
  const anchor = sel?.anchorNode;
  if (!sel?.rangeCount || !anchor || !root.contains(anchor)) return -1;
  return getTextOffsetInRoot(root, anchor, sel.anchorOffset);
}

export function getPlainTextFromEditor(root: HTMLElement): string {
  return root.innerText.replace(/\u200b/g, "");
}

export function getHashtagQueryAtEditor(root: HTMLElement): { start: number; query: string; cursor: number } | null {
  const cursor = getTextOffsetBeforeSelection(root);
  if (cursor < 0) return null;
  const plain = getPlainTextFromEditor(root);
  const info = getHashtagQueryAtCursor(plain, cursor);
  if (!info) return null;
  return { ...info, cursor };
}

/** إزالة spans الهاشتاغ — لا نلوّن داخل المحرر الحي */
export function stripEditorHashtagSpans(root: HTMLElement): void {
  root.querySelectorAll(".nf-hashtag").forEach((el) => {
    el.replaceWith(document.createTextNode(el.textContent || ""));
  });
}

/** موضع القائمة عند المؤشر (مع fallback للـ RTL والأسطر الفارغة) */
export function getCaretViewportPosition(
  root: HTMLElement,
  menuHeightEstimate = 220,
  menuWidth = 260
): {
  top: number;
  left: number;
  width: number;
  placeAbove: boolean;
} {
  const sel = window.getSelection();
  const editorRect = root.getBoundingClientRect();

  if (!sel?.rangeCount || !root.contains(sel.anchorNode)) {
    return {
      top: editorRect.top + 40,
      left: Math.max(8, editorRect.right - menuWidth - 12),
      width: menuWidth,
      placeAbove: false,
    };
  }

  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);

  let rect = range.getBoundingClientRect();
  const emptyCaret =
    (rect.width === 0 && rect.height === 0) ||
    (rect.top === 0 && rect.left === 0 && rect.bottom === 0);

  if (emptyCaret) {
    const marker = document.createElement("span");
    marker.setAttribute("data-caret-marker", "1");
    marker.appendChild(document.createTextNode("\u200b"));
    try {
      range.insertNode(marker);
      rect = marker.getBoundingClientRect();
      const after = document.createRange();
      after.setStartAfter(marker);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
    } finally {
      marker.remove();
    }
  }

  if (rect.width === 0 && rect.height === 0) {
    rect = new DOMRect(
      editorRect.right - 24,
      editorRect.top + 32,
      0,
      18
    );
  }

  const gap = 6;
  let top = rect.bottom + gap;
  const placeAbove = top + menuHeightEstimate > window.innerHeight - 12;
  if (placeAbove) top = Math.max(8, rect.top - menuHeightEstimate - gap);
  top = Math.max(8, Math.min(top, window.innerHeight - menuHeightEstimate - 8));

  const left = Math.max(
    8,
    Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
  );

  return { top, left, width: menuWidth, placeAbove };
}

/** @deprecated use getCaretViewportPosition */
export function selectionMenuViewportPosition(
  menuHeightEstimate = 200,
  menuWidth = 240
) {
  return { top: 8, left: 8, width: menuWidth, placeAbove: false };
}

function unwrapAllHashtags(root: HTMLElement): void {
  stripEditorHashtagSpans(root);
}

/** إدراج هاشتاغ كنص عادي — بدون span (لا قفز للمؤشر) */
export function insertHashtagAtRange(
  root: HTMLElement,
  start: number,
  end: number,
  tag: string
): void {
  unwrapAllHashtags(root);
  const range = findTextRange(root, start, end);
  if (!range) return;

  range.deleteContents();
  const text = document.createTextNode(`#${tag} `);
  range.insertNode(text);
  range.setStartAfter(text);
  range.collapse(true);

  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** إدراج نص بين موضعين في شجرة الن-text */
export function replacePlainTextRange(
  root: HTMLElement,
  start: number,
  end: number,
  insert: string
): void {
  unwrapAllHashtags(root);
  const range = findTextRange(root, start, end);
  if (!range) return;

  range.deleteContents();
  range.insertNode(document.createTextNode(insert));
  range.collapse(false);

  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
