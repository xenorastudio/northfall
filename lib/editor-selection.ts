/** حفظ/استعادة موضع المؤشر كنص مسطح — يبقى صالحاً بعد تعديل DOM */

export type EditorSelectionOffsets = {
  start: number;
  end: number;
};

export function getTextOffsetInRoot(
  root: HTMLElement,
  node: Node,
  offset: number
): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, offset);
  } catch {
    return -1;
  }
  return range.toString().replace(/\u200b/g, "").length;
}

export function saveSelectionOffsets(root: HTMLElement): EditorSelectionOffsets | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !root.contains(sel.anchorNode)) return null;

  const anchor = sel.anchorNode;
  const focus = sel.focusNode ?? anchor;
  if (!anchor || !focus) return null;
  const start = getTextOffsetInRoot(root, anchor, sel.anchorOffset);
  const end = getTextOffsetInRoot(root, focus, sel.focusOffset);
  if (start < 0 || end < 0) return null;

  return { start: Math.min(start, end), end: Math.max(start, end) };
}

export function findTextRange(
  root: HTMLElement,
  start: number,
  end: number
): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startNode: Text | null = null;
  let startOff = 0;
  let endNode: Text | null = null;
  let endOff = 0;

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = (node as Text).parentElement;
    if (parent?.closest("pre, code")) continue;

    const len = ((node as Text).textContent || "").replace(/\u200b/g, "").length;
    if (!startNode && pos + len >= start) {
      startNode = node as Text;
      startOff = Math.max(0, start - pos);
    }
    if (!endNode && pos + len >= end) {
      endNode = node as Text;
      endOff = Math.max(0, end - pos);
      break;
    }
    pos += len;
  }

  if (!startNode || !endNode) return null;

  const range = document.createRange();
  try {
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
  } catch {
    return null;
  }
  return range;
}

export function restoreSelectionOffsets(
  root: HTMLElement,
  offsets: EditorSelectionOffsets | null
): void {
  if (!offsets) return;
  const range = findTextRange(root, offsets.start, offsets.end);
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
  root.focus();
}
