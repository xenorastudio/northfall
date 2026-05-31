"use client";

import { useState, useRef } from "react";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Code } from "lucide-react";

interface SimpleCommentEditorProps {
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  initialText?: string;
  autoFocus?: boolean;
}

export default function SimpleCommentEditor({
  onSubmit,
  onCancel,
  placeholder = "اكتب تعليقك...",
  submitLabel = "نشر",
  initialText = "",
  autoFocus = false
}: SimpleCommentEditorProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (prefix: string, suffix: string = "", fallback: string = "نص") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.substring(start, end) || fallback;
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    setText(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const handleBold = () => insertFormat("**", "**", "نص غامق");
  const handleItalic = () => insertFormat("*", "*", "نص مائل");
  const handleLink = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.substring(start, end) || "نص الرابط";
    const url = prompt("أدخل رابط URL:");
    if (!url) return;
    const newText = text.substring(0, start) + `[${selected}](${url})` + text.substring(end);
    setText(newText);
    setTimeout(() => ta.focus(), 0);
  };
  const handleBulletList = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.substring(start, end);
    
    if (!selected.trim()) {
      // لا يوجد نص محدد - أضف - في بداية السطر
      insertFormat("- ", "", "عنصر");
      return;
    }
    
    // يوجد نص محدد - حوله لقائمة نقطية
    const lines = selected.split("\n");
    const bulletLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // إزالة النقاط الموجودة إن وجدت
      if (trimmed.startsWith("- ")) return trimmed;
      if (trimmed.match(/^\d+\.\s/)) return "- " + trimmed.replace(/^\d+\.\s/, "");
      return "- " + trimmed;
    }).join("\n");
    
    const newText = text.substring(0, start) + bulletLines + text.substring(end);
    setText(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start, start + bulletLines.length);
    }, 0);
  };

  const handleNumberedList = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.substring(start, end);
    
    if (!selected.trim()) {
      // لا يوجد نص محدد - أضف 1. في بداية السطر
      insertFormat("1. ", "", "عنصر");
      return;
    }
    
    // يوجد نص محدد - حوله لقائمة مرقمة
    const lines = selected.split("\n").filter(l => l.trim());
    const numberedLines = lines.map((line, idx) => {
      const trimmed = line.trim();
      // إزالة الأرقام أو النقاط الموجودة
      const cleaned = trimmed.replace(/^[-•]\s/, "").replace(/^\d+\.\s/, "");
      return `${idx + 1}. ${cleaned}`;
    }).join("\n");
    
    const newText = text.substring(0, start) + numberedLines + text.substring(end);
    setText(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start, start + numberedLines.length);
    }, 0);
  };
  const handleCode = () => insertFormat("`", "`", "code");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border border-nf-border-2 rounded-lg overflow-hidden bg-nf-secondary">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-nf-border-2/50 bg-nf-primary/30">
        <button
          type="button"
          onClick={handleBold}
          className="p-1.5 rounded hover:bg-nf-hover text-nf-muted hover:text-nf-text transition-colors"
          title="غامق (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-1.5 rounded hover:bg-nf-hover text-nf-muted hover:text-nf-text transition-colors"
          title="مائل (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={handleLink}
          className="p-1.5 rounded hover:bg-nf-hover text-nf-muted hover:text-nf-text transition-colors"
          title="رابط"
        >
          <LinkIcon size={14} />
        </button>
        <button
          type="button"
          onClick={handleBulletList}
          className="p-1.5 rounded hover:bg-nf-hover text-nf-muted hover:text-nf-text transition-colors"
          title="قائمة نقطية - حدد نص ثم اضغط"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={handleNumberedList}
          className="p-1.5 rounded hover:bg-nf-hover text-nf-muted hover:text-nf-text transition-colors"
          title="قائمة مرقمة - حدد نص ثم اضغط"
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={handleCode}
          className="p-1.5 rounded hover:bg-nf-hover text-nf-muted hover:text-nf-text transition-colors"
          title="كود"
        >
          <Code size={14} />
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-nf-dim">Ctrl+Enter للنشر</span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 bg-transparent text-nf-text placeholder:text-nf-dim resize-none outline-none"
        style={{ minHeight: 80, maxHeight: 300, fontFamily: "inherit", fontSize: 13, lineHeight: 1.6 }}
      />

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-nf-border-2/50 bg-nf-primary/30">
        <div className="text-[10px] text-nf-dim">
          **غامق** • *مائل* • [رابط](url) • `كود` • - نقطة • 1. رقم
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 rounded text-[11px] text-nf-muted hover:text-nf-text hover:bg-nf-hover transition-colors"
            >
              إلغاء
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-4 py-1 rounded text-[11px] font-bold bg-nf-accent text-nf-primary hover:bg-nf-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
