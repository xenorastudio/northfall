"use client";

import { createPortal } from "react-dom";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Columns,
  Plus,
  Rows,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TableMenuState } from "@/lib/editor-table";
import {
  alignTableCell,
  deleteTable,
  deleteTableColumn,
  deleteTableRow,
  insertTableColumnAfter,
  insertTableColumnBefore,
  insertTableRowBelow,
} from "@/lib/editor-table";

type EditorTableMenuProps = {
  menu: TableMenuState | null;
  onClose: () => void;
  onChange: () => void;
};

function Item({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-start transition-colors",
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-nf-text hover:bg-white/[0.06]"
      )}
    >
      <span className="shrink-0 opacity-70 inline-flex"><Icon size={14} /></span>
      <span>{label}</span>
    </button>
  );
}

export default function EditorTableMenu({ menu, onClose, onChange }: EditorTableMenuProps) {
  if (!menu || typeof document === "undefined") return null;

  const run = (fn: () => void) => {
    fn();
    onChange();
    onClose();
  };

  const { table, cell } = menu;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10040]" onMouseDown={onClose} />
      <div
        dir="rtl"
        className="fixed z-[10050] min-w-[220px] max-w-[min(240px,calc(100vw-16px))] rounded-xl border border-nf-border-2/60 bg-nf-primary shadow-[0_16px_40px_rgba(0,0,0,0.45)] overflow-hidden py-1"
        style={{ left: menu.x, top: menu.y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Item icon={Plus} label="إدراج صف أسفل" onClick={() => run(() => insertTableRowBelow(table, cell))} />
        <Item icon={Trash2} label="حذف الصف" danger onClick={() => run(() => deleteTableRow(table, cell))} />
        <div className="my-1 border-t border-nf-border-2/40" />
        <Item icon={Columns} label="إدراج عمود قبل" onClick={() => run(() => insertTableColumnBefore(table, cell))} />
        <Item icon={Columns} label="إدراج عمود بعد" onClick={() => run(() => insertTableColumnAfter(table, cell))} />
        <Item icon={Trash2} label="حذف العمود" danger onClick={() => run(() => deleteTableColumn(table, cell))} />
        <div className="my-1 border-t border-nf-border-2/40" />
        <Item icon={AlignRight} label="محاذاة يمين" onClick={() => run(() => alignTableCell(cell, "right"))} />
        <Item icon={AlignCenter} label="محاذاة وسط" onClick={() => run(() => alignTableCell(cell, "center"))} />
        <Item icon={AlignLeft} label="محاذاة يسار" onClick={() => run(() => alignTableCell(cell, "left"))} />
        <div className="my-1 border-t border-nf-border-2/40" />
        <Item icon={Rows} label="حذف الجدول" danger onClick={() => run(() => deleteTable(table))} />
      </div>
    </>,
    document.body
  );
}
