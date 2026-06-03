"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Languages, Copy, Volume2, X, Search, Check, Loader2, Sparkles, Wand2, CheckCheck, VolumeX, FileText, BadgeCheck } from "lucide-react";
import { translateText } from "@/lib/translate";
import { cn } from "@/lib/utils";
import TranslateLangPicker from "./TranslateLangPicker";

const AI_MODELS = [
  { name: "GPT-3.5 تجريبي", provider: "chatanywhere" as const, model: "gpt-3.5-turbo", free: true, desc: "مجاني للتجربة — لا يحتاج مفتاح مدفوع" },
  { name: "DeepSeek Chat", provider: "deepseek" as const, model: "deepseek-chat", free: true, desc: "مجاني وسريع، مناسب لكل الاستخدامات" },
  { name: "Gemini 2.0 Flash", provider: "gemini" as const, model: "gemini-2.0-flash", free: true, desc: "سريع من جوجل، ممتاز للردود القصيرة" },
  { name: "Groq Llama 3.3", provider: "groq" as const, model: "llama-3.3-70b-versatile", free: true, desc: "أسرع نموذج، استجابة فورية" },
  { name: "Groq Gemma 2", provider: "groq" as const, model: "gemma2-9b-it", free: true, desc: "خفيف وسريع من Groq" },
  { name: "Mistral Small", provider: "mistral" as const, model: "mistral-small-latest", free: true, desc: "نموذج صغير من Mistral، مجاني" },
  { name: "GPT-4o Mini", provider: "chatgpt" as const, model: "gpt-4o-mini", free: false, desc: "نسخة مصغرة من GPT-4، رخيصة" },
  { name: "GPT-4.1 Nano", provider: "chatgpt" as const, model: "gpt-4.1-nano", free: false, desc: "أصغر نموذج OpenAI، سريع" },
  { name: "Gemini 2.5 Flash", provider: "gemini" as const, model: "gemini-2.5-flash-preview-05-20", free: false, desc: "أحدث Gemini، ذكاء عالي" },
  { name: "Claude 3.5 Haiku", provider: "claude" as const, model: "claude-3-5-haiku-20241022", free: false, desc: "سريع ورخيص من Anthropic" },
  { name: "Mistral Medium", provider: "mistral" as const, model: "mistral-medium-latest", free: false, desc: "نموذج متوسط، توازن بين السرعة والذكاء" },
];

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
  const [aiType, setAiType] = useState<"explain" | "summarize" | "keypoints" | "none">("none");
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [originalCopied, setOriginalCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [originalSpeaking, setOriginalSpeaking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTypewriter = useCallback((text: string) => {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }
    setTranslatedText("");
    let i = 0;
    typewriterIntervalRef.current = setInterval(() => {
      if (i < text.length) {
        setTranslatedText(text.slice(0, i + 2));
        i += 2;
      } else {
        setTranslatedText(text);
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
      }
    }, 8);
  }, []);

  useEffect(() => {
    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, []);

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
      startTypewriter(result || "تعذر العثور على ترجمة مناسبة.");
    } catch (err) {
      console.error("Translation failed:", err);
      setTranslatedText("حدث خطأ أثناء الاتصال بخدمة الترجمة.");
    } finally {
      setLoading(false);
    }
  }, [selectedText, startTypewriter]);

  // AI Explain feature integration
  const handleAiExplain = useCallback(async () => {
    if (!selectedText) return;
    setIsAiMode(true);
    setAiType("explain");
    setLoading(true);
    setLoadingText("جاري شرح النص...");
    setPopoverOpen(true);
    try {
      const modelIndexRaw = localStorage.getItem("nf-ai-model");
      const modelIndex = modelIndexRaw ? parseInt(modelIndexRaw, 10) : 0;
      const sel = AI_MODELS[modelIndex] || AI_MODELS[0];
      const provider = sel.provider;
      const model = sel.model;
      const key = localStorage.getItem("nf-ai-key") || "";

      let contextStr = "";
      if (typeof window !== "undefined" && (window as any).activePostContext) {
        const ctx = (window as any).activePostContext;
        contextStr = `\n\n(سياق المنشور الذي تم تحديد النص منه للمساعدة في فهم المعنى:\nالعنوان: ${ctx.title}\nالمحتوى: ${ctx.body ? ctx.body.slice(0, 1000) : ""})`;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: key,
          messages: [
            { role: "user", content: `أعطني شرحاً مبسطاً وسريعاً للنص المختار التالي (اكتب الشرح بالعربية أولاً ثم بالإنجليزية باختصار شديد في سطرين أو ثلاثة فقط):\n\n"${selectedText}"${contextStr}` }
          ],
          systemPrompt: "أنت مساعد خبير ومحلل ذكي تدعى NorthFall Assistant. قدم شرحاً دقيقاً، عميقاً ومبسطاً للنص المختار بناءً على السياق العام المرفق للمنشور. اشرح المصطلحات الغامضة أو الأفكار المعقدة بوضوح ممتاز وبأسلوب مشوق ومناسب لأعضاء منتدى NorthFall. لا تكتب مقدمات أو عناوين فرعية أو زخارف أو إيموجي.",
          maxTokens: 1000,
          temperature: 0.5
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

      startTypewriter(text || "تعذر الحصول على شرح.");
    } catch (err: any) {
      console.error("AI Explain failed:", err);
      setTranslatedText(`خطأ: ${err?.message || "تعذر الاتصال بمساعد NorthFall. تأكد من تهيئة الإعدادات."}`);
    } finally {
      setLoading(false);
    }
  }, [selectedText, startTypewriter]);

  // AI Summarize feature integration
  const handleAiSummarize = useCallback(async () => {
    if (!selectedText) return;
    setIsAiMode(true);
    setAiType("summarize");
    setLoading(true);
    setLoadingText("جاري تلخيص النص...");
    setPopoverOpen(true);
    try {
      const modelIndexRaw = localStorage.getItem("nf-ai-model");
      const modelIndex = modelIndexRaw ? parseInt(modelIndexRaw, 10) : 0;
      const sel = AI_MODELS[modelIndex] || AI_MODELS[0];
      const provider = sel.provider;
      const model = sel.model;
      const key = localStorage.getItem("nf-ai-key") || "";

      let contextStr = "";
      if (typeof window !== "undefined" && (window as any).activePostContext) {
        const ctx = (window as any).activePostContext;
        contextStr = `\n\n(سياق المنشور الذي تم تحديد النص منه للمساعدة في فهم المعنى:\nالعنوان: ${ctx.title}\nالمحتوى: ${ctx.body ? ctx.body.slice(0, 1000) : ""})`;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: key,
          messages: [
            { role: "user", content: `لخص النص المختار التالي باختصار شديد وبأسلوب واضح ومباشر (اكتب التلخيص بالعربية أولاً ثم بالإنجليزية في سطرين أو ثلاثة فقط):\n\n"${selectedText}"${contextStr}` }
          ],
          systemPrompt: "أنت كاتب ومحرر محترف تدعى NorthFall Assistant. لخص النص المختار بدقة عالية مع الحفاظ على الأفكار الهامة وسياق المنشور المرفق. اكتب تلخيصاً ذكياً وموجزاً ومترابطاً (2-3 أسطر). لا تكتب مقدمات أو عناوين فرعية أو زخارف أو إيموجي.",
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

      startTypewriter(text || "تعذر تلخيص النص.");
    } catch (err: any) {
      console.error("AI Summarize failed:", err);
      setTranslatedText(`خطأ: ${err?.message || "تعذر الاتصال بمساعد NorthFall. تأكد من تهيئة الإعدادات."}`);
    } finally {
      setLoading(false);
    }
  }, [selectedText, startTypewriter]);

  // AI Keypoints feature integration
  const handleAiKeypoints = useCallback(async () => {
    if (!selectedText) return;
    setIsAiMode(true);
    setAiType("keypoints");
    setLoading(true);
    setLoadingText("جاري استخراج الأفكار الرئيسية...");
    setPopoverOpen(true);
    try {
      const modelIndexRaw = localStorage.getItem("nf-ai-model");
      const modelIndex = modelIndexRaw ? parseInt(modelIndexRaw, 10) : 0;
      const sel = AI_MODELS[modelIndex] || AI_MODELS[0];
      const provider = sel.provider;
      const model = sel.model;
      const key = localStorage.getItem("nf-ai-key") || "";

      let contextStr = "";
      if (typeof window !== "undefined" && (window as any).activePostContext) {
        const ctx = (window as any).activePostContext;
        contextStr = `\n\n(سياق المنشور الذي تم تحديد النص منه للمساعدة في فهم المعنى:\nالعنوان: ${ctx.title}\nالمحتوى: ${ctx.body ? ctx.body.slice(0, 1000) : ""})`;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: key,
          messages: [
            { role: "user", content: `استخرج النقاط والأفكار الرئيسية من النص المختار التالي على شكل نقاط مختصرة جداً (اكتب النقاط بالعربية أولاً ثم بالإنجليزية باختصار شديد):\n\n"${selectedText}"${contextStr}` }
          ],
          systemPrompt: "أنت محلل محتوى خبير تدعى NorthFall Assistant. استخرج النقاط والأفكار الرئيسية والجوهرية من النص المختار بناءً على سياق المنشور المرفق. رتب الأفكار بشكل منطعي وموجز جداً على شكل نقاط واضحة ومباشرة. لا تكتب مقدمات أو عناوين أو إيموجي.",
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

      startTypewriter(text || "تعذر استخراج الأفكار الرئيسية.");
    } catch (err: any) {
      console.error("AI Keypoints failed:", err);
      setTranslatedText(`خطأ: ${err?.message || "تعذر الاتصال بمساعد NorthFall. تأكد من تهيئة الإعدادات."}`);
    } finally {
      setLoading(false);
    }
  }, [selectedText, startTypewriter]);

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
        activeUtteranceRef.current = utterance; // Prevent garbage collection bug in Chrome/Safari

        // Find voice matching targeted language - avoids matching 'es-AR' for Arabic
        const targetLang = hasArabic ? "ar" : "en";
        const currentVoices = voices.length > 0 ? voices : (synth.getVoices() || []);
        const matchedVoice = currentVoices.find((v) => {
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
      }, 120);
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
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }
    setPopoverOpen(false);
    setPosition(null);
    setSelectedText("");
    setTranslatedText("");
    setSpeaking(false);
    setOriginalSpeaking(false);
    setIsAiMode(false);
    setAiType("none");
    setShowAiMenu(false);
  };

  const getHeaderTitle = () => {
    return isAiMode ? "NorthFall Assistant" : "ترجمة سريعة";
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
          {!showAiMenu ? (
            <>
              <button
                onClick={handleTranslate}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-nf-accent transition-colors"
                type="button"
              >
                <Languages size={12} />
                <span>ترجمة</span>
              </button>

              <button
                onClick={() => setShowAiMenu(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors"
                type="button"
              >
                <span>مساعد NorthFall</span>
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
            </>
          ) : (
            <>
              <button
                onClick={handleAiExplain}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors"
                type="button"
              >
                <span>شرح العبارة</span>
              </button>

              <button
                onClick={handleAiSummarize}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors"
                type="button"
              >
                <FileText size={12} />
                <span>تلخيص النص</span>
              </button>

              <button
                onClick={handleAiKeypoints}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors"
                type="button"
              >
                <CheckCheck size={12} />
                <span>الأفكار الرئيسية</span>
              </button>

              <button
                onClick={() => setShowAiMenu(false)}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-nf-hover text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors"
                type="button"
              >
                <span>رجوع ↩</span>
              </button>
            </>
          )}
        </div>
      ) : (
        // Flat, clean Popover card with translated content (No blur, solid colors, retro sharp corners)
        <div className="w-[340px] max-w-[90vw] p-4 rounded-none border-2 border-nf-border-2 bg-nf-card shadow-2xl flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2" dir="rtl">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 shrink-0 select-none">
                {!isAiMode && <Languages size={12} className="text-nf-accent" />}
                <span className={cn(
                  "text-[10px] font-black tracking-wider",
                  isAiMode ? "nf-shimmer-text" : "text-nf-accent"
                )}>
                  {getHeaderTitle()}
                </span>
                {isAiMode && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[12px] h-[12px] shrink-0 object-contain" />}
              </div>
              {!isAiMode && (
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
            <div className="flex items-center justify-end gap-1.5 pt-2 select-none">
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
