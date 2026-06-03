"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Languages, Copy, Volume2, X, Search, Check, Loader2, Sparkles, Wand2, CheckCheck, VolumeX } from "lucide-react";
import { translateText } from "@/lib/translate";
import { cn } from "@/lib/utils";
import TranslateLangPicker from "./TranslateLangPicker";

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
  const [loadingText, setLoadingText] = useState("جاري التحميل...");
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiType, setAiType] = useState<"explain" | "simplify" | "correct" | "none">("none");
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
        handleClose();
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

  const handleTranslate = useCallback(async () => {
    if (!selectedText) return;
    setIsAiMode(false);
    setAiType("none");
    setLoading(true);
    setLoadingText("جاري الترجمة...");
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
  }, [selectedText]);

  // AI Explain feature integration
  const handleAiExplain = useCallback(async () => {
    if (!selectedText) return;
    setIsAiMode(true);
    setAiType("explain");
    setLoading(true);
    setLoadingText("جاري توليد الشرح بالذكاء الاصطناعي...");
    setPopoverOpen(true);
    try {
      const provider = localStorage.getItem("nf-ai-provider") || "chatanywhere";
      const key = localStorage.getItem("nf-ai-key") || "";
      const model = localStorage.getItem("nf-ai-model") || (
        provider === "chatanywhere" || provider === "chatgpt" ? "gpt-3.5-turbo" :
        provider === "deepseek" ? "deepseek-chat" :
        provider === "groq" ? "llama-3.3-70b-versatile" :
        provider === "mistral" ? "mistral-tiny" :
        provider === "gemini" ? "gemini-1.5-flash" :
        provider === "claude" ? "claude-3-5-haiku-20241022" : "gpt-3.5-turbo"
      );

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: key,
          messages: [
            { role: "user", content: `أعطني شرحاً مبسطاً وسريعاً جداً للنص المختار التالي (اكتب الشرح بالعربية أولاً ثم بالإنجليزية باختصار شديد في سطرين أو ثلاثة فقط):\n\n"${selectedText}"` }
          ],
          systemPrompt: "أنت مساعد ذكي تشرح العبارات والمصطلحات الصعبة. اكتب الشرح بأسلوب واضح وبسيط باختصار شديد، 2-3 أسطر فقط. لا تكتب أي مقدمات أو عناوين أو إيموجي.",
          maxTokens: 1000,
          temperature: 0.3
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      let text = "";
      if (provider === "gemini") {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (provider === "claude") {
        text = data.content?.[0]?.text || "";
      } else {
        text = data.choices?.[0]?.message?.content || "";
      }

      setTranslatedText(text || "تعذر الحصول على شرح بالذكاء الاصطناعي.");
    } catch (err: any) {
      console.error("AI Explain failed:", err);
      setTranslatedText(`خطأ: ${err?.message || "تعذر الاتصال بالذكاء الاصطناعي. تأكد من إعدادات مفتاح API في الإعدادات."}`);
    } finally {
      setLoading(false);
    }
  }, [selectedText]);

  // AI Simplify feature integration
  const handleAiSimplify = useCallback(async () => {
    if (!selectedText) return;
    setIsAiMode(true);
    setAiType("simplify");
    setLoading(true);
    setLoadingText("جاري تبسيط النص بالذكاء الاصطناعي...");
    setPopoverOpen(true);
    try {
      const provider = localStorage.getItem("nf-ai-provider") || "chatanywhere";
      const key = localStorage.getItem("nf-ai-key") || "";
      const model = localStorage.getItem("nf-ai-model") || (
        provider === "chatanywhere" || provider === "chatgpt" ? "gpt-3.5-turbo" :
        provider === "deepseek" ? "deepseek-chat" :
        provider === "groq" ? "llama-3.3-70b-versatile" :
        provider === "mistral" ? "mistral-tiny" :
        provider === "gemini" ? "gemini-1.5-flash" :
        provider === "claude" ? "claude-3-5-haiku-20241022" : "gpt-3.5-turbo"
      );

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: key,
          messages: [
            { role: "user", content: `أعد صياغة النص المختار التالي بأسلوب أبسط وأسهل في الفهم للمبتدئين (اكتب النص المبسط بالعربية أولاً ثم بالإنجليزية باختصار شديد في سطرين أو ثلاثة فقط):\n\n"${selectedText}"` }
          ],
          systemPrompt: "أنت مساعد ذكي تبسط النصوص الصعبة والمعقدة وتجعلها واضحة ومفهومة. لا تكتب أي مقدمات أو عناوين أو إيموجي أو زخارف.",
          maxTokens: 1000,
          temperature: 0.3
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      let text = "";
      if (provider === "gemini") {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (provider === "claude") {
        text = data.content?.[0]?.text || "";
      } else {
        text = data.choices?.[0]?.message?.content || "";
      }

      setTranslatedText(text || "تعذر تبسيط النص.");
    } catch (err: any) {
      console.error("AI Simplify failed:", err);
      setTranslatedText(`خطأ: ${err?.message || "تعذر الاتصال بالذكاء الاصطناعي. تأكد من إعدادات مفتاح API في الإعدادات."}`);
    } finally {
      setLoading(false);
    }
  }, [selectedText]);

  // AI Correct feature integration
  const handleAiCorrect = useCallback(async () => {
    if (!selectedText) return;
    setIsAiMode(true);
    setAiType("correct");
    setLoading(true);
    setLoadingText("جاري تصحيح النص بالذكاء الاصطناعي...");
    setPopoverOpen(true);
    try {
      const provider = localStorage.getItem("nf-ai-provider") || "chatanywhere";
      const key = localStorage.getItem("nf-ai-key") || "";
      const model = localStorage.getItem("nf-ai-model") || (
        provider === "chatanywhere" || provider === "chatgpt" ? "gpt-3.5-turbo" :
        provider === "deepseek" ? "deepseek-chat" :
        provider === "groq" ? "llama-3.3-70b-versatile" :
        provider === "mistral" ? "mistral-tiny" :
        provider === "gemini" ? "gemini-1.5-flash" :
        provider === "claude" ? "claude-3-5-haiku-20241022" : "gpt-3.5-turbo"
      );

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: key,
          messages: [
            { role: "user", content: `صحح الأخطاء اللغوية والإملائية في النص التالي واعرض النص بعد التصحيح، مع توضيح بسيط جداً للأخطاء التي تم تصحيحها (بالعربية والإنجليزية باختصار في سطرين أو ثلاثة فقط):\n\n"${selectedText}"` }
          ],
          systemPrompt: "أنت مساعد ذكي تصحح الأخطاء اللغوية والنحوية والإملائية بدقة. لا تكتب أي مقدمات أو عناوين أو إيموجي.",
          maxTokens: 1000,
          temperature: 0.2
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      let text = "";
      if (provider === "gemini") {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (provider === "claude") {
        text = data.content?.[0]?.text || "";
      } else {
        text = data.choices?.[0]?.message?.content || "";
      }

      setTranslatedText(text || "تعذر تصحيح النص.");
    } catch (err: any) {
      console.error("AI Correct failed:", err);
      setTranslatedText(`خطأ: ${err?.message || "تعذر الاتصال بالذكاء الاصطناعي. تأكد من إعدادات مفتاح API في الإعدادات."}`);
    } finally {
      setLoading(false);
    }
  }, [selectedText]);

  // Re-translate when user changes their preferred language
  useEffect(() => {
    const handleLangChange = () => {
      if (popoverOpen && selectedText && !isAiMode) {
        void handleTranslate();
      }
    };
    window.addEventListener("nf-translate-lang-change", handleLangChange);
    return () => {
      window.removeEventListener("nf-translate-lang-change", handleLangChange);
    };
  }, [popoverOpen, selectedText, isAiMode, handleTranslate]);

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

        // Find voice matching targeted language - avoids matching 'es-AR' for Arabic
        const targetLang = hasArabic ? "ar" : "en";
        const matchedVoice = voices.find((v) => {
          const l = v.lang.toLowerCase().replace("_", "-");
          return l === targetLang || l.startsWith(`${targetLang}-`);
        });

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
    if (!selectedText) return;
    if (originalSpeaking) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setOriginalSpeaking(false);
      return;
    }
    speakText(
      selectedText,
      () => setOriginalSpeaking(true),
      () => setOriginalSpeaking(false)
    );
  };

  const handleSpeakTranslation = () => {
    if (!translatedText) return;
    if (speaking) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
      return;
    }
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
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPopoverOpen(false);
    setPosition(null);
    setSelectedText("");
    setTranslatedText("");
    setSpeaking(false);
    setOriginalSpeaking(false);
    setIsAiMode(false);
    setAiType("none");
  };

  const getHeaderTitle = () => {
    if (aiType === "explain") return "شرح بالذكاء الاصطناعي";
    if (aiType === "simplify") return "تبسيط بالذكاء الاصطناعي";
    if (aiType === "correct") return "تصحيح بالذكاء الاصطناعي";
    return "ترجمة سريعة";
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
            onClick={handleAiExplain}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
            type="button"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span>شرح</span>
          </button>

          <button
            onClick={handleAiSimplify}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            type="button"
          >
            <Wand2 size={12} className="text-emerald-400" />
            <span>تبسيط</span>
          </button>

          <button
            onClick={handleAiCorrect}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            type="button"
          >
            <CheckCheck size={12} className="text-indigo-400" />
            <span>تصحيح</span>
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
            className={cn("flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-semibold transition-colors", originalSpeaking ? "text-red-400 hover:text-red-300" : "text-nf-muted hover:text-nf-text")}
            type="button"
          >
            {originalSpeaking ? (
              <>
                <VolumeX size={12} className="shrink-0 animate-pulse text-red-400" />
                <span>إيقاف</span>
              </>
            ) : (
              <>
                <Volume2 size={12} className="shrink-0" />
                <span>نطق</span>
              </>
            )}
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
        <div className="w-[340px] max-w-[90vw] p-4 rounded-xl border border-nf-border-2 bg-nf-card shadow-2xl flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-nf-border-2/40 pb-2" dir="rtl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-black text-nf-accent tracking-wider flex items-center gap-1 shrink-0">
                {aiType !== "none" ? <Sparkles size={12} className="text-amber-400" /> : <Languages size={12} />}
                {getHeaderTitle()}
              </span>
              {aiType === "none" && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-nf-dim text-[9px]">إلى</span>
                  <TranslateLangPicker variant="inline" storageKey="nf-translate-lang" className="relative z-[1201]" />
                </div>
              )}
            </div>
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
                <span>{loadingText}</span>
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
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  speaking 
                    ? "text-red-400 bg-red-500/10 hover:bg-red-500/20" 
                    : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10"
                )}
                title={speaking ? "إيقاف النطق" : "نطق النص"}
                type="button"
              >
                {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              
              <button
                onClick={handleCopyTranslation}
                className="p-1.5 rounded-lg text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 transition-all"
                title="نسخ النص"
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
