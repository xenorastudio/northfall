/** Restore GitHub-style indentation when the editor strips or breaks leading spaces. */

const TAB = "    ";

function normalizeLines(code: string): string[] {
  return code.replace(/\r\n/g, "\n").replace(/\t/g, TAB).split("\n");
}

/** True when braces exist but indent is missing or inconsistent (e.g. `}` flush left). */
export function shouldReformatIndent(code: string): boolean {
  const lines = normalizeLines(code);
  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length < 2 || !/\{/.test(code)) return false;

  const indented = nonEmpty.filter((l) => /^ {2,}\S/.test(l)).length;
  const nakedClose = nonEmpty.filter((l) => /^\}/.test(l.trim()) && !/^ {2,}/.test(l)).length;

  if (indented === 0 && nonEmpty.some((l) => /[{}\[\];]/.test(l))) return true;
  if (nakedClose > 0) return true;

  const flatInner = nonEmpty.filter((l) => {
    if (/^ {2,}/.test(l)) return false;
    const t = l.trim();
    if (/^(using|namespace|\/\/|\/\*|\*|#|public class|private class|internal class|public struct|public enum)/.test(t)) {
      return false;
    }
    if (/^(public|private|protected|internal|static|abstract|sealed)\s+(class|struct|interface|enum)\b/.test(t)) {
      return false;
    }
    if (/^\[/.test(t)) return false;
    return /^(if|for|foreach|while|return|var|float|double|int|bool|string|void|private|public|protected)\b/.test(t);
  }).length;

  return flatInner > 0 && indented > 0;
}

export function needsAutoIndent(code: string): boolean {
  return shouldReformatIndent(code);
}

export function autoIndentCode(code: string, tab = TAB): string {
  const lines = normalizeLines(code);
  const out: string[] = [];
  let depth = 0;

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) {
      out.push("");
      continue;
    }

    const opens = (t.match(/[\{\[]/g) || []).length;
    const closes = (t.match(/[\}\]]/g) || []).length;
    const startsClose = /^[\}\]]/.test(t);

    if (startsClose) {
      depth = Math.max(0, depth - 1);
    }

    out.push(tab.repeat(depth) + t);

    if (startsClose) {
      depth += opens;
      depth -= Math.max(0, closes - 1);
    } else {
      depth += opens;
      depth -= closes;
    }
    depth = Math.max(0, depth);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function prepareCodeForDisplay(code: string): string {
  const normalized = code.replace(/\r\n/g, "\n").replace(/\t/g, TAB);
  const lines = normalized.split("\n");
  const nonEmpty = lines.filter((l) => l.trim());

  if (nonEmpty.length < 2) return normalized;

  const hasBraces = /\{/.test(normalized) && /\}/.test(normalized);
  const allFlat = nonEmpty.every((l) => !/^ {2,}/.test(l));
  const needsFix = shouldReformatIndent(normalized);

  if (hasBraces && (needsFix || allFlat)) {
    const stripped = lines.map((l) => (l.trim() ? l.trim() : ""));
    return autoIndentCode(stripped.join("\n"));
  }

  return normalized;
}

export function looksLikeCodePaste(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || !trimmed.includes("\n")) return false;
  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length < 3) return false;
  const codeSignals =
    /\b(using|namespace|public|private|class|void|function|const|let|var|import|#include|MonoBehaviour|SerializeField)\b/.test(
      trimmed
    ) ||
    (trimmed.includes("{") && trimmed.includes("}"));
  const semis = lines.filter((l) => l.trim().endsWith(";")).length;
  return codeSignals && (semis >= 2 || trimmed.includes("{"));
}
