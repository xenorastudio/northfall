/** موضع المؤشر داخل textarea (لتثبيت القوائم المنسدلة عند الكتابة) */

export type CaretOffset = {
  top: number;
  left: number;
  height: number;
};

export function getTextareaCaretOffset(
  element: HTMLTextAreaElement,
  position: number
): CaretOffset {
  const style = window.getComputedStyle(element);
  const div = document.createElement("div");
  const props = [
    "direction",
    "boxSizing",
    "width",
    "overflowWrap",
    "wordWrap",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
  ] as const;

  props.forEach((key) => {
    div.style.setProperty(key, style.getPropertyValue(key));
  });

  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordBreak = "break-word";
  div.style.top = "0";
  div.style.left = "-9999px";
  div.style.width = `${element.clientWidth}px`;

  const before = element.value.substring(0, position);
  const after = element.value.substring(position) || "\u200b";

  div.textContent = before;
  const marker = document.createElement("span");
  marker.textContent = after[0] === "\n" ? "\u200b" : after;
  div.appendChild(marker);

  document.body.appendChild(div);
  const markerRect = marker.getBoundingClientRect();
  const divRect = div.getBoundingClientRect();
  document.body.removeChild(div);

  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;

  return {
    top: markerRect.top - divRect.top + element.scrollTop,
    left: markerRect.left - divRect.left + element.scrollLeft,
    height: markerRect.height || lineHeight,
  };
}

export function caretMenuViewportPosition(
  textarea: HTMLTextAreaElement,
  caret: CaretOffset,
  menuHeightEstimate = 240
): { top: number; left: number; width: number; placeAbove: boolean } {
  const rect = textarea.getBoundingClientRect();
  const gap = 6;
  let top = rect.top + caret.top + caret.height + gap;
  const left = Math.max(8, rect.left + caret.left);
  const width = Math.min(300, Math.max(220, rect.width * 0.55));
  const placeAbove = top + menuHeightEstimate > window.innerHeight - 12;
  if (placeAbove) {
    top = rect.top + caret.top - menuHeightEstimate - gap;
  }
  top = Math.max(8, Math.min(top, window.innerHeight - menuHeightEstimate - 8));
  return { top, left, width, placeAbove };
}
