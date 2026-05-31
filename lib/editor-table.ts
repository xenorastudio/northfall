export type TableMenuState = {
  table: HTMLTableElement;
  cell: HTMLTableCellElement;
  x: number;
  y: number;
};

export function getTableContextFromSelection(): { table: HTMLTableElement; cell: HTMLTableCellElement } | null {
  const sel = window.getSelection();
  if (!sel?.anchorNode) return null;
  const node = sel.anchorNode.nodeType === Node.ELEMENT_NODE
    ? (sel.anchorNode as HTMLElement)
    : sel.anchorNode.parentElement;
  const cell = node?.closest("td, th") as HTMLTableCellElement | null;
  if (!cell) return null;
  const table = cell.closest("table.nf-editor-table, .nf-editor-table table, table") as HTMLTableElement | null;
  if (!table) return null;
  return { table, cell };
}

function cellCoords(table: HTMLTableElement, cell: HTMLTableCellElement) {
  const row = cell.parentElement as HTMLTableRowElement;
  const rows = Array.from(table.querySelectorAll("tr"));
  return {
    row,
    ri: rows.indexOf(row),
    ci: Array.from(row.cells).indexOf(cell),
    rows,
  };
}

function createCell(tag: "td" | "th", placeholder: string, text = "") {
  const el = document.createElement(tag);
  el.className = "nf-tcell";
  el.setAttribute("data-placeholder", placeholder);
  if (text) el.textContent = text;
  else el.innerHTML = "<br>";
  return el;
}

export function insertTableColumnAtEnd(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll("tr"));
  rows.forEach((r, ri) => {
    const tag = r.querySelector("th") && ri === 0 ? "th" : "td";
    const ph = tag === "th" ? "عنوان" : "اكتب هنا…";
    r.appendChild(createCell(tag as "td" | "th", ph));
  });
}

export function insertTableRowAtEnd(table: HTMLTableElement) {
  const colCount = table.querySelector("tr")?.cells.length ?? 3;
  const newRow = document.createElement("tr");
  for (let i = 0; i < colCount; i++) {
    newRow.appendChild(createCell("td", "اكتب هنا…"));
  }
  table.querySelector("tbody")?.appendChild(newRow) || table.appendChild(newRow);
}

export function insertTableRowBelow(table: HTMLTableElement, cell: HTMLTableCellElement) {
  const { row } = cellCoords(table, cell);
  const colCount = row.cells.length;
  const newRow = document.createElement("tr");
  for (let i = 0; i < colCount; i++) {
    newRow.appendChild(createCell("td", "اكتب هنا…"));
  }
  row.after(newRow);
}

export function deleteTableRow(table: HTMLTableElement, cell: HTMLTableCellElement) {
  const { row, rows } = cellCoords(table, cell);
  if (rows.length <= 1) {
    table.closest(".nf-editor-table-wrap")?.remove() || table.remove();
    return;
  }
  row.remove();
}

export function insertTableColumnBefore(table: HTMLTableElement, cell: HTMLTableCellElement) {
  const { ci, rows } = cellCoords(table, cell);
  rows.forEach((r, ri) => {
    const tag = r.querySelector("th") && ri === 0 ? "th" : "td";
    const ph = tag === "th" ? "عنوان" : "اكتب هنا…";
    const ref = r.cells[ci];
    if (ref) r.insertBefore(createCell(tag as "td" | "th", ph), ref);
    else r.appendChild(createCell(tag as "td" | "th", ph));
  });
}

export function insertTableColumnAfter(table: HTMLTableElement, cell: HTMLTableCellElement) {
  const { ci, rows } = cellCoords(table, cell);
  rows.forEach((r, ri) => {
    const tag = r.querySelector("th") && ri === 0 ? "th" : "td";
    const ph = tag === "th" ? "عنوان" : "اكتب هنا…";
    const ref = r.cells[ci + 1];
    if (ref) r.insertBefore(createCell(tag as "td" | "th", ph), ref);
    else r.appendChild(createCell(tag as "td" | "th", ph));
  });
}

export function deleteTableColumn(table: HTMLTableElement, cell: HTMLTableCellElement) {
  const { ci, rows } = cellCoords(table, cell);
  const colCount = rows[0]?.cells.length ?? 0;
  if (colCount <= 1) {
    table.closest(".nf-editor-table-wrap")?.remove() || table.remove();
    return;
  }
  rows.forEach((r) => r.cells[ci]?.remove());
}

export function alignTableCell(cell: HTMLTableCellElement, align: "left" | "center" | "right") {
  cell.style.textAlign = align;
}

export function deleteTable(table: HTMLTableElement) {
  const wrap = table.closest(".nf-editor-table-wrap");
  if (wrap) {
    const next = document.createElement("p");
    next.innerHTML = "<br>";
    wrap.replaceWith(next);
  } else {
    table.remove();
  }
}

export function menuPositionNearRect(rect: DOMRect, menuW = 220, menuH = 340) {
  let top = rect.bottom + 6;
  let left = rect.left;
  if (top + menuH > window.innerHeight - 8) {
    top = Math.max(8, rect.top - menuH - 6);
  }
  if (left + menuW > window.innerWidth - 8) {
    left = window.innerWidth - menuW - 8;
  }
  if (left < 8) left = 8;
  return { x: left, y: top };
}

export function dotsPositionInCell(cell: HTMLTableCellElement) {
  const rect = cell.getBoundingClientRect();
  return {
    x: rect.left + 6,
    y: rect.top + 6,
    cellRect: rect,
  };
}

export function buildDefaultTableHtml(isAr: boolean): string {
  const phH = isAr ? "عنوان" : "Header";
  const phC = isAr ? "اكتب هنا…" : "Type here…";
  const h = (n: number) => (isAr ? `عنوان ${n}` : `Header ${n}`);
  return `
    <div class="nf-editor-table-wrap">
      <div class="nf-table-quick-bar" contenteditable="false">
        <button type="button" class="nf-table-qbtn" data-nf-table-action="add-col">+ عمود</button>
        <button type="button" class="nf-table-qbtn" data-nf-table-action="add-row">+ صف</button>
        <span class="nf-table-hint">${isAr ? "اضغط ⋯ داخل أي خلية للمزيد" : "Click ⋯ in a cell for more"}</span>
      </div>
      <table class="nf-editor-table"><tbody>
        <tr>
          <th class="nf-tcell" data-placeholder="${phH}">${h(1)}</th>
          <th class="nf-tcell" data-placeholder="${phH}">${h(2)}</th>
          <th class="nf-tcell" data-placeholder="${phH}">${h(3)}</th>
        </tr>
        <tr>
          <td class="nf-tcell" data-placeholder="${phC}"><br></td>
          <td class="nf-tcell" data-placeholder="${phC}"><br></td>
          <td class="nf-tcell" data-placeholder="${phC}"><br></td>
        </tr>
        <tr>
          <td class="nf-tcell" data-placeholder="${phC}"><br></td>
          <td class="nf-tcell" data-placeholder="${phC}"><br></td>
          <td class="nf-tcell" data-placeholder="${phC}"><br></td>
        </tr>
      </tbody></table>
    </div>
    <p><br></p>
  `;
}
