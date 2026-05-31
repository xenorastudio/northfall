import { isCodeLikeLine } from "@/lib/markdown-body";

export function parseMarkdownTableCells(line: string): string[] | null {
  const t = line.trim();
  if (!t.includes("|")) return null;
  let cells = t.split("|").map((c) => c.trim());
  if (cells[0] === "") cells = cells.slice(1);
  if (cells[cells.length - 1] === "") cells = cells.slice(0, -1);
  if (cells.length < 1) return null;
  if (cells.every((c) => /^[-:]+$/.test(c))) return null;
  return cells;
}

export function isMarkdownTableSeparatorLine(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) return false;
  let cells = t.split("|").map((c) => c.trim());
  if (cells[0] === "") cells = cells.slice(1);
  if (cells[cells.length - 1] === "") cells = cells.slice(0, -1);
  return cells.length > 0 && cells.every((c) => /^[-:]+$/.test(c));
}

/** يجمع صفوف الجدول ويتخطى سطر |---|---| */
export function collectMarkdownTableRows(
  lines: string[],
  start: number
): { rows: string[][]; endIndex: number } | null {
  const first = parseMarkdownTableCells(lines[start]);
  if (!first) return null;

  const rows: string[][] = [first];
  let j = start + 1;

  while (j < lines.length) {
    const line = lines[j];
    const trimmed = line.trimStart();
    if (trimmed.startsWith("```")) break;
    if (isCodeLikeLine(line)) break;
    if (isMarkdownTableSeparatorLine(line)) {
      j++;
      continue;
    }
    const row = parseMarkdownTableCells(line);
    if (!row) break;
    rows.push(row);
    j++;
  }

  return { rows, endIndex: j - 1 };
}
