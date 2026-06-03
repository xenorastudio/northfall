"use client";

import { useEffect, useState, useRef } from "react";
import { Languages, Copy, Volume2, X, Search, Check, Loader2 } from "lucide-react";
import { translateText } from "@/lib/translate";
import { cn } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
  positionBelow: boolean;
}

export default function SelectionTranslator() {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [originalCopied, setOriginalCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [originalSpeaking, setOriginalSpeaking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If clicking inside our translator popover, don't clear selection or close
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }

      // Small delay to allow window.getSelection() to be populated
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          if (!popoverOpen) {
            setSelectedText("");
            setPosition(null);
          }
          return;
        }

        const text = selection.toString().trim();
        // Ignore single characters or empty lines
        if (text.length < 2) {
          if (!popoverOpen) {
            setSelectedText("");
            setPosition(null);
          }
          return;
        }

        // Avoid triggering inside input fields, textareas
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || (activeElement as HTMLElement).isContentEditable)
        ) {
          return;
        }

        try {
          const range = selection.getRangeAt(0);
          const rects = range.getClientRects();
          if (rects.length > 0) {
            // Position the button right above/below the middle of the first rect
            const rect = rects[0];
            const x = rect.left + rect.width / 2 + window.scrollX;
            const y = rect.top + window.scrollY;

            // Viewport-aware placement: if selection is near the top of the viewport (< 220px), show popover below it
            const spaceAbove = rect.top;
            const positionBelow = spaceAbove < 220;

            setSelectedText(text);
            setPosition({ x, y: positionBelow ? (rect.bottom + window.scrollY) : y, positionBelow });
            // If the user made a new selection, close the old translation popover
            setPopoverOpen(false);
            setTranslatedText("");
          }
        } catch (err) {
          console.warn("Failed to get selection range:", err);
        }
      }, 50);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (!popoverOpen) {
          setSelectedText("");
          setPosition(null);
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [popoverOpen]);

  // Click outside to close the open translation popover
  useEffect(() => {
    if (!popoverOpen) return;

    const handleDocumentClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
        setPosition(null);
        setSelectedText("");
        setTranslatedText("");
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [popoverOpen]);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Pre-load and cache speech voices on mount (fixes async loading in Chrome/Safari)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const updateVoices = () => {
      try {
        setVoices(window.speechSynthesis.getVoices());
      } catch (e) {
        console.warn("Failed to load voices:", e);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleTranslate = async () => {
    if (!selectedText) return;
    setLoading(true);
    setPopoverOpen(true);
    try {
      const result = await translateText(selectedText);
      setTranslatedText(result || "تعذر العثور على ترجمة مناسبة.");
    } catch (err) {
      console.error("Translation failed:", err);
      setTranslatedText("حدث خطأ أثناء الاتصال بخدمة الترجمة.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOriginal = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setOriginalCopied(true);
      setTimeout(() => setOriginalCopied(false), 1500);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const handleCopyTranslation = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const speakText = (text: string, onStart: () => void, onEnd: () => void) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;

      // Chrome bug fix: resume if stuck in paused state
      if (synth.paused) {
        synth.resume();
      }

      synth.cancel(); // Stop any currently speaking audio

      // Small delay to let cancel action finish before speaking
      setTimeout(() => {
        const hasArabic = /[\u0600-\u06FF]/.test(text);
        const utterance = new SpeechSynthesisUtterance(text);

        // Find voice matching targeted language
        const targetLang = hasArabic ? "ar" : "en";
        const matchedVoice = voices.find((v) => v.lang.toLowerCase().includes(targetLang));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.lang = hasArabic ? "ar-SA" : "en-US";
        utterance.rate = 0.95; // Slightly slower for better articulation

        utterance.onstart = onStart;
        utterance.onend = onEnd;
        utterance.onerror = (err) => {
          console.warn("SpeechSynthesis error:", err);
          onEnd();
        };

        synth.speak(utterance);
      }, 60);
    } catch (err) {
      console.error("SpeechSynthesis failed:", err);
      onEnd();
    }
  };

  const handleSpeakOriginal = () => {
    if (!selectedText || originalSpeaking) return;
    speakText(
      selectedText,
      () => setOriginalSpeaking(true),
      () => setOriginalSpeaking(false)
    );
  };

  const handleSpeakTranslation = () => {
    if (!translatedText || speaking) return;
    speakText(
      translatedText,
      () => setSpeaking(true),
      () => setSpeaking(false)
    );
  };

  const handleSearchGoogle = () => {
    if (!selectedText) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, "_blank");
  };

  const handleClose = () => {
    setPopoverOpen(false);
    setPosition(null);
    setSelectedText("");
    setTranslatedText("");
  };

  if (!position) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-[9999] pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: position.positionBelow 
          ? "translate(-50%, 10px)" 
          : "translate(-50%, -100%) translateY(-10px)",
      }}
    >
      {!popoverOpen ? (
        // Flat toolbar button group (RTL divided layout)
        <div className="flex items-center rounded-lg border border-nf-border-2 bg-nf-card text-nf-text shadow-xl overflow-hidden divide-x divide-nf-border-2/40 divide-x-reverse select-none">
          <button
            onClick={handleTranslate}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-nf-accent transition-colors"
            type="button"
          >
            <Languages size={12} />
            <span>ترجمة</span>
          </button>
          
          <button
            onClick={handleCopyOriginal}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-semibold text-nf-muted hover:text-nf-text transition-colors"
            type="button"
          >
            {originalCopied ? <Check size={12} className="text-green-400 shrink-0" /> : <Copy size={12} className="shrink-0" />}
            <span>نسخ</span>
          </button>
          
          <button
            onClick={handleSpeakOriginal}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-semibold text-nf-muted hover:text-nf-text transition-colors"
            type="button"
          >
            <Volume2 size={12} className={cn("shrink-0", originalSpeaking && "text-nf-accent animate-pulse")} />
            <span>نطق</span>
          </button>
          
          <button
            onClick={handleSearchGoogle}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-semibold text-nf-muted hover:text-nf-text transition-colors"
            type="button"
          >
            <Search size={12} />
            <span>بحث</span>
          </button>
        </div>
      ) : (
        // Flat, clean Popover card with translated content (No blur, solid colors)
        <div className="w-[320px] max-w-[90vw] p-4 rounded-xl border border-nf-border-2 bg-nf-card shadow-2xl flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-nf-border-2/40 pb-2">
            <span className="text-[10px] font-black text-nf-accent tracking-wider flex items-center gap-1">
              <Languages size={12} />
              ترجمة سريعة
            </span>
            <button
              onClick={handleClose}
              className="p-1 rounded-full text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-all"
              type="button"
            >
              <X size={12} />
            </button>
          </div>

          {/* Original Text snippet */}
          <div className="text-[10px] text-nf-muted/70 line-clamp-1 italic px-1 text-right select-none" dir="auto">
            « {selectedText} »
          </div>

          {/* Translated Content */}
          <div className="min-h-[50px] max-h-[160px] overflow-y-auto py-0.5 px-1 text-[12px] text-zinc-100 leading-relaxed font-medium">
            {loading ? (
              <div className="flex items-center justify-center h-12 gap-2 text-nf-dim">
                <Loader2 size={16} className="animate-spin text-nf-accent" />
                <span>جاري الترجمة...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-right text-zinc-200 leading-[1.8] select-text" dir="auto">
                {translatedText}
              </div>
            )}
          </div>

          {/* Actions toolbar */}
          {!loading && translatedText && (
            <div className="flex items-center justify-end gap-1.5 border-t border-nf-border-2/40 pt-2 select-none">
              <button
                onClick={handleSpeakTranslation}
                disabled={speaking}
                className={cn(
                  "p-1.5 rounded-lg text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 transition-all",
                  speaking && "text-nf-accent bg-nf-accent/10 animate-pulse"
                )}
                title="نطق الترجمة"
                type="button"
              >
                <Volume2 size={13} />
              </button>
              
              <button
                onClick={handleCopyTranslation}
                className="p-1.5 rounded-lg text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 transition-all"
                title="نسخ الترجمة"
                type="button"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
