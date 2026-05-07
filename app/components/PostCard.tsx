"use client";

import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark, Flag, Code, MoreHorizontal, ChevronLeft, ChevronRight, Star, Heart, Sparkles, Zap, Trophy, Eye, Send, Pencil, Trash2, AlertTriangle, Link2, Flame, BarChart3, BookOpen, Languages, FileText, X, ChevronDown, Settings, Key, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, setDoc, deleteDoc, getDoc, collection, addDoc, getDocs, query, where, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import ShareModal from "./ShareModal";
import ReportModal from "./ReportModal";
import HoverCard from "./HoverCard";
import { renderFormattedBody } from "./PostFormatter";
import { useToast } from "./ToastProvider";

interface PostCardProps {
  postId?: string;
  community?: string;
  author?: string;
  authorUid?: string;
  authorPhoto?: string;
  time?: string;
  title: string;
  body?: string;
  image?: string;
  imageUrls?: string[];
  flair?: string;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  votes?: number;
  comments?: number;
  awards?: any[];
  poll?: { options: string[]; votes: number[]; duration: string } | null;
  onCommunityClick?: (name: string) => void;
  onProfileClick?: (uid?: string) => void;
  onPostClick?: (id: string) => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
}

export default function PostCard({
  postId,
  community = "n/general",
  author = "User",
  authorUid,
  authorPhoto,
  time = "now",
  title,
  body,
  image,
  imageUrls,
  flair,
  isNsfw,
  isSpoiler,
  votes = 0,
  comments = 0,
  awards,
  poll,
  onCommunityClick,
  onProfileClick,
  onPostClick,
  onEditClick,
  onDeleteClick,
}: PostCardProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [voteCount, setVoteCount] = useState(votes);
  const [myVote, setMyVote] = useState(0);
  const [saved, setSaved] = useState(false);

  // Check if post is saved and load user's vote on mount
  useEffect(() => {
    if (!user || !postId) return;
    getDoc(doc(db, "users", user.uid, "saved", postId)).then(s => setSaved(s.exists())).catch(() => {});
    getDoc(doc(db, "posts", postId, "votes", user.uid)).then(s => {
      if (s.exists()) {
        setMyVote(s.data().dir || 0);
        // Don't add vote to count - Firestore votes already includes it
      }
    }).catch(() => {});
  }, [user, postId]);

  const toggleSave = async () => {
    if (!user || !postId) return;
    const ref = doc(db, "users", user.uid, "saved", postId);
    if (saved) {
      await deleteDoc(ref);
      setSaved(false);
      toast("تم إزالة المنشور من المحفوظات", "info");
    } else {
      await setDoc(ref, { postId, savedAt: new Date().toISOString() });
      setSaved(true);
      toast("تم حفظ المنشور", "save");
    }
  };
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [views, setViews] = useState(0);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState("");
  const [blurRevealed, setBlurRevealed] = useState(false);
  const [dblClickAnim, setDblClickAnim] = useState(false);
  const [pollVotes, setPollVotes] = useState<number[]>(poll?.votes || []);
  const [myPollVote, setMyPollVote] = useState<number | null>(null);
  // AI
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDropOpen, setAiDropOpen] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiProvider, setAiProvider] = useState<"chatgpt" | "gemini" | "claude" | "deepseek" | "groq" | "mistral" | "chatanywhere">("chatanywhere");
  const [aiModel, setAiModel] = useState(0);
  const [aiConnected, setAiConnected] = useState<"unknown" | "testing" | "ok" | "fail">("unknown");
  const aiDropRef = useRef<HTMLDivElement>(null);

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

  // Load AI settings on mount
  useEffect(() => {
    const k = localStorage.getItem("nf-ai-key") || "";
    const p = localStorage.getItem("nf-ai-provider") || "chatanywhere";
    const m = parseInt(localStorage.getItem("nf-ai-model") || "0");
    setAiApiKey(k);
    setAiProvider(p as any);
    setAiModel(m);
  }, []);

  // Close AI dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (aiDropRef.current && !aiDropRef.current.contains(e.target as Node)) setAiDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const testAiConnection = async () => {
    setAiConnected("testing");
    try {
      const res = await fetch(`/api/ai?provider=${aiProvider}&apiKey=${aiApiKey || ""}`);
      const data = await res.json();
      setAiConnected(data.ok ? "ok" : "fail");
    } catch { setAiConnected("fail"); }
  };

  const saveAiSettings = () => {
    localStorage.setItem("nf-ai-key", aiApiKey);
    localStorage.setItem("nf-ai-provider", aiProvider);
    localStorage.setItem("nf-ai-model", String(aiModel));
    if (aiApiKey) testAiConnection();
  };

  // Check if user already voted in poll
  useEffect(() => {
    if (!user || !postId || !poll) return;
    getDoc(doc(db, "posts", postId, "pollVotes", user.uid)).then(s => {
      if (s.exists()) setMyPollVote(s.data().optionIndex);
    }).catch(() => {});
  }, [user, postId, poll]);

  const handlePollVote = async (idx: number) => {
    if (!user || !postId || !poll || myPollVote !== null) return;
    const newVotes = [...pollVotes];
    newVotes[idx] = (newVotes[idx] || 0) + 1;
    setPollVotes(newVotes);
    setMyPollVote(idx);
    try {
      await updateDoc(doc(db, "posts", postId), { "poll.votes": newVotes });
      await setDoc(doc(db, "posts", postId, "pollVotes", user.uid), { optionIndex: idx, votedAt: new Date().toISOString() });
    } catch {}
  };

  // Support multiple images
  const allImages = imageUrls && imageUrls.length > 0 ? imageUrls.filter(u => u && u.trim()) : (image ? [image] : []);
  const hasMultiple = allImages.length > 1;

  const handleDblClickVote = () => {
    if (!user || !postId) return;
    if (myVote !== 1) handleVote(1);
    setDblClickAnim(true);
    setTimeout(() => setDblClickAnim(false), 800);
  };

  const handleVote = async (dir: 1 | -1) => {
    if (!user || !postId) return;
    const newVote = myVote === dir ? 0 : dir;
    const diff = newVote - myVote;
    setMyVote(newVote);
    setVoteCount(voteCount + diff);
    try {
      // Use increment to avoid race conditions
      await updateDoc(doc(db, "posts", postId), { votes: increment(diff) });
      // Save user's vote in subcollection
      if (newVote === 0) {
        await deleteDoc(doc(db, "posts", postId, "votes", user.uid));
      } else {
        await setDoc(doc(db, "posts", postId, "votes", user.uid), { dir: newVote, votedAt: new Date().toISOString() });
      }
      // Batch notification: update existing or create new
      if (authorUid && authorUid !== user.uid && newVote !== 0) {
        try {
          const notifQ = query(collection(db, "users", authorUid, "notifications"), where("postId", "==", postId), where("type", "==", "vote"), where("read", "==", false));
          const notifSnap = await getDocs(notifQ);
          if (!notifSnap.empty) {
            const existing = notifSnap.docs[0];
            const prev = existing.data();
            const count = (prev.count || 1) + 1;
            await updateDoc(existing.ref, {
              count,
              text: count > 1 ? `${count} شخص صوّتوا على منشورك "${title?.slice(0, 30) || "منشور"}"` : `${user.displayName || "مستخدم"} صوّت على منشورك "${title?.slice(0, 40) || "منشور"}"`,
              lastVoterName: user.displayName || "مستخدم",
              createdAt: new Date().toISOString(),
            });
          } else {
            await addDoc(collection(db, "users", authorUid, "notifications"), {
              type: "vote", text: `${user.displayName || "مستخدم"} صوّت على منشورك "${title?.slice(0, 40) || "منشور"}"`,
              read: false, createdAt: new Date().toISOString(), postId, count: 1,
            });
          }
        } catch {}
      }
    } catch {}
  };

  // AI explain post
  const [aiDisplayText, setAiDisplayText] = useState("");

  // Smooth typing animation effect
  useEffect(() => {
    if (aiResult && !aiLoading) {
      let i = 0;
      setAiDisplayText("");
      const interval = setInterval(() => {
        if (i < aiResult.length) {
          setAiDisplayText(aiResult.slice(0, i + 2));
          i += 2;
        } else {
          setAiDisplayText(aiResult);
          clearInterval(interval);
        }
      }, 8);
      return () => clearInterval(interval);
    } else {
      setAiDisplayText("");
    }
  }, [aiResult, aiLoading]);

  // AI result display

  const handleAiExplain = async (mode: "explain" | "summarize" | "translate" | "expand" | "correct" | "tags" | "rephrase" | "question" | "keypoints" | "counter" | "improve" | "issues" | "morefeatures") => {
    const sel = AI_MODELS[aiModel];
    const key = aiApiKey || "";
    setAiLoading(true);
    setAiResult(null);
    setAiDropOpen(false);
    const uName = user?.displayName || "صديقي";
    const tLang = localStorage.getItem("nf-ai-translate-lang") || "en";
    const langNames: Record<string,string> = { en:"الإنجليزية", ar:"العربية", fr:"الفرنسية", de:"الألمانية", es:"الإسبانية", tr:"التركية", ja:"اليابانية", ko:"الكورية", zh:"الصينية", ru:"الروسية" };
    try {
      const prompts: Record<string, string> = {
        explain: `يا ${uName}، اشرح لي هاي المنشور بشكل مبسط (3-4 أسطر) كأنك بتشرحه لشخص مو فاهمه، احكي باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        summarize: `${uName}، لخص هاي المنشور بسطرين-تلاتة، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        translate: `ترجم هاي المنشور ل${langNames[tLang] || "الإنجليزية"} بشكل طبيعي ومبسط — إذا المنشور أصلاً ب${langNames[tLang]} ترجمه للعربية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        expand: `${uName}، وسع هاي المنشور وضيف تفاصيل أكتر (5-6 أسطر) بنفس الأسلوب، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        correct: `صحح الأخطاء الإملائية والنحوية بهاي المنشور واكتب النسخة المصححة:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        tags: `اقترح 3-5 وسوم (tags) مناسبة لهاد المنشور ككلمات مفتاحية، اكتبها بس مفصولة بفواصل:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 300) || "لا يوجد محتوى"}`,
        rephrase: `${uName}، أعد صياغة هاي المنشور بأسلوب أجمل وأكثر جاذبية، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        question: `اكتب 3 أسئلة ممكنة تنطرح عن هاي المنشور، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        keypoints: `${uName}، استخرج أهم النقاط الرئيسية من هاي المنشور كقائمة مختصرة:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        counter: `${uName}، اكتب رد أو حجة مضادة لهاد المنشور بشكل محترم ومبسط (3-4 أسطر)، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        improve: `${uName}، حسّن هاي المنشور بأسلوب احترافي وجذاب مع الحفاظ على المعنى — أضف تنسيق وتنظيم أفضل، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        issues: `${uName}، اذكر المشاكل أو الأخطاء المحتملة بهاد المنشور (معلومات خاطئة، منطق ضعيف، أخطاء تقنية) بشكل مبسط، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
        morefeatures: `${uName}، أعد كتابة هاي المنشور بنسخة محسّنة وجاهزة للنشر — حسّن الأسلوب والتنسيق والعناوين، أضف أمثلة وتفاصيل، خليه احترافي وجذاب. اكتب النص المحسّن بس بدون شرح، باللهجة الأردنية:\n\nالعنوان: ${title}\nالمحتوى: ${body?.slice(0, 500) || "لا يوجد محتوى"}`,
      };
      const systemPrompts: Record<string, string> = {
        explain: `أنت مساعد بتشرح المنشورات ببساطة ووضوح باللهجة الأردنية. خاطب المستخدم باسمه. احكي باختصار 3-4 أسطر بدون عناوين. بدون إيموجي. خليك عادي وودي.`,
        summarize: `أنت مساعد بلخص المنشورات باختصار باللهجة الأردنية. خاطب المستخدم باسمه. اكتب 2-3 أسطر بس. بدون إيموجي.`,
        translate: `أنت مترجم محترف. ترجم بشكل طبيعي ومبسط. بدون إيموجي. إذا النص بنفس لغة الهدف، ترجمه للعربية.`,
        expand: `أنت مساعد بتوسع المنشورات وبتضيف تفاصيل مفيدة باللهجة الأردنية. خاطب المستخدم باسمه. اكتب 5-6 أسطر. بدون إيموجي.`,
        correct: `أنت مدقق لغوي بتصحح الأخطاء الإملائية والنحوية بالعربية. اكتب النص المصحح بس. بدون إيموجي.`,
        tags: `أنت مساعد بيقترح وسوم مناسبة. اكتب الكلمات المفتاحية بس مفصولة بفواصل. بدون إيموجي.`,
        rephrase: `أنت مساعد بيعيد صياغة المنشورات بأسلوب أجمل وأكثر جاذبية باللهجة الأردنية. خاطب المستخدم باسمه. بدون إيموجي. خليك عادي وودي.`,
        question: `أنت مساعد بيكتب أسئلة ممكنة عن المنشور باللهجة الأردنية. خاطب المستخدم باسمه. اكتب 3 أسئلة بس. بدون إيموجي.`,
        keypoints: `أنت مساعد بيستخرج النقاط الرئيسية من المنشورات باللهجة الأردنية. خاطب المستخدم باسمه. اكتب قائمة مختصرة. بدون إيموجي.`,
        counter: `أنت مساعد بيكتب حجج مضادة محترمة باللهجة الأردنية. خاطب المستخدم باسمه. كن محترم وموضوعي. بدون إيموجي.`,
        improve: `أنت محرر محترف بحسّن المنشورات بأسلوب احترافي وجذاب باللهجة الأردنية. خاطب المستخدم باسمه. حسّن التنسيق والأسلوب. بدون إيموجي.`,
        issues: `أنت ناقد تقني بيكشف المشاكل والأخطاء المحتملة بالمنشورات باللهجة الأردنية. خاطب المستخدم باسمه. كن موضوعي وبناء. بدون إيموجي.`,
        morefeatures: `أنت محرر محترف بيعيد كتابة المنشورات بنسخة محسّنة وجاهزة للنشر باللهجة الأردنية. خاطب المستخدم باسمه. اكتب النص المحسّن فقط بدون أي شرح أو مقدمات. حسّن الأسلوب والتنسيق والعناوين. بدون إيموجي.`,
      };
      let text = "";
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: sel.provider, model: sel.model, apiKey: key, messages: [{ role: "user", content: prompts[mode] }], systemPrompt: systemPrompts[mode], maxTokens: 2000, temperature: 0.5, top_p: 0.92 }),
      });
      const data = await res.json();
      if (sel.provider === "gemini") text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      else if (sel.provider === "claude") text = data.content?.[0]?.text || "";
      else text = data.choices?.[0]?.message?.content || "";
      setAiResult(text || "لم أستطع توليد رد");
    } catch (err: any) {
      setAiResult(`خطأ: ${(err?.message || "").slice(0, 60)}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/app?view=post&postId=${postId}`);
    setShowShare(true);
    setTimeout(() => setShowShare(false), 2000);
  };

  const handleEmbed = () => {
    navigator.clipboard?.writeText(`<iframe src="${window.location.origin}/embed/${postId}" width="600" height="400"></iframe>`);
    setShowEmbed(true);
    setTimeout(() => setShowEmbed(false), 2000);
  };

  // Track views (optimistic - no extra read)
  useEffect(() => {
    if (!postId) return;
    const viewed = sessionStorage.getItem(`viewed-${postId}`);
    if (!viewed) {
      sessionStorage.setItem(`viewed-${postId}`, "1");
      setViews(v => v + 1);
      updateDoc(doc(db, "posts", postId), { views: (views || 0) + 1 }).catch(() => {});
    }
  }, [postId]);

  const handleQuickReply = async () => {
    if (!user || !postId || !quickReplyText.trim()) return;
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        text: quickReplyText.trim(),
        authorUid: user.uid,
        authorName: user.displayName || "User",
        authorPhoto: user.photoURL || "",
        parentId: "",
        createdAt: new Date().toISOString(),
        votes: 0,
      });
      setQuickReplyText("");
      setShowQuickReply(false);
      toast("تم إرسال التعليق", "success");
      // Batch notification for comments
      if (authorUid && authorUid !== user.uid) {
        try {
          const notifQ = query(collection(db, "users", authorUid, "notifications"), where("postId", "==", postId), where("type", "==", "comment"), where("read", "==", false));
          const notifSnap = await getDocs(notifQ);
          if (!notifSnap.empty) {
            const existing = notifSnap.docs[0];
            const prev = existing.data();
            const count = (prev.count || 1) + 1;
            await updateDoc(existing.ref, {
              count,
              text: count > 1 ? `${count} شخص علّقوا على منشورك "${title?.slice(0, 30) || "منشور"}"` : `${user.displayName || "مستخدم"} علّق على منشورك "${title?.slice(0, 40) || "منشور"}"`,
              lastCommenterName: user.displayName || "مستخدم",
              createdAt: new Date().toISOString(),
            });
          } else {
            await addDoc(collection(db, "users", authorUid, "notifications"), {
              type: "comment", text: `${user.displayName || "مستخدم"} علّق على منشورك "${title?.slice(0, 40) || "منشور"}"`,
              read: false, createdAt: new Date().toISOString(), postId, count: 1,
            });
          }
        } catch {}
      }
    } catch (e: any) {
      console.error("[PostCard] Quick reply error:", e?.code || e?.message || e);
      const msg = e?.code === "PERMISSION_DENIED" ? "لا توجد صلاحية — انشر قواعد Firestore!" : "فشل حفظ التعليق";
      toast(msg, "error");
    }
  };

  // Build URL for Ctrl+Click new tab support
  const postHref = postId ? `/app?view=post&postId=${postId}` : undefined;

  // Handle click: normal click navigates, middle-click/ctrl-click opens new tab
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return; // let browser handle
    if (e.button === 1) return; // middle click, let browser handle
    if (e.button === 0) { e.preventDefault(); onPostClick?.(postId || ""); }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={cn("bg-transparent border rounded-lg mb-2.5 cursor-pointer transition-colors duration-150 relative",
        voteCount >= 10 ? "border-orange-400/20 hover:bg-nf-accent/5 hover:border-orange-400/40" : "border-nf-border-2 hover:bg-nf-accent/5 hover:border-nf-accent/15")}
    >
      <div className="px-4 pt-3 pb-2 relative" onDoubleClick={handleDblClickVote}>
        {/* Double-click heart animation */}
        {dblClickAnim && (
          <motion.div initial={{ opacity: 1, scale: 0.5, y: 0 }} animate={{ opacity: 0, scale: 1.8, y: -30 }} transition={{ duration: 0.7 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#ff4444"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </motion.div>
        )}
        {/* Header */}
        <div className="flex items-center gap-2 text-[13px] mb-1.5">
          <div className="w-5 h-5 rounded-full bg-nf-secondary overflow-hidden shrink-0">
            {authorPhoto ? (
              <img src={authorPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-nf-muted font-bold">n/</div>
            )}
          </div>
          <HoverCard type="community" name={community.replace("n/", "")} onCommunityClick={onCommunityClick}><span className="font-semibold text-nf-accent cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onCommunityClick?.(community.replace("n/", "")); }}>{community}</span></HoverCard>
          <span className="text-nf-dim">·</span>
          <HoverCard type="user" name={author} uid={authorUid} onProfileClick={onProfileClick}><span className="text-nf-muted hover:text-white hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onProfileClick?.(authorUid || undefined); }}>u/{author}</span></HoverCard>
          <span className="text-nf-dim">·</span>
          <span className="text-nf-muted">{time}</span>
          {flair && <><span className="text-nf-dim">·</span><span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-nf-accent/20 text-nf-accent">{flair}</span></>}
          {voteCount >= 10 && <><span className="text-nf-dim">·</span><span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-400/15 text-orange-400 flex items-center gap-0.5"><Flame size={9} />رائج</span></>}
        </div>

        {/* Title */}
        <h3 className="text-[18px] font-bold text-white leading-snug mb-1">{title}</h3>

        {/* Body */}
        {body && (
          <div className="flex items-start gap-2">
            <div className="text-sm text-nf-text-2 leading-relaxed line-clamp-3 flex-1">{renderFormattedBody(body)}</div>
            {body.split(/\s+/).length > 50 && <span className="text-[10px] text-nf-dim shrink-0 mt-0.5">{Math.max(1, Math.ceil(body.split(/\s+/).length / 200))} {t("pd.minRead")}</span>}
          </div>
        )}

        {/* Poll */}
        {poll && poll.options.length >= 2 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-white mb-1">
              <BarChart3 size={14} className="text-nf-accent" />
              <span>استطلاع</span>
            </div>
            {poll.options.map((opt, idx) => {
              const total = pollVotes.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round(((pollVotes[idx] || 0) / total) * 100) : 0;
              const isVoted = myPollVote === idx;
              const hasVoted = myPollVote !== null;
              return (
                <button key={idx} onClick={(e) => { e.stopPropagation(); handlePollVote(idx); }}
                  className={cn("w-full relative flex items-center gap-3 px-4 py-2.5 rounded-lg border text-right overflow-hidden transition-all",
                    !hasVoted ? "cursor-pointer hover:border-nf-accent/40 hover:bg-nf-accent/5" : "cursor-default",
                    isVoted ? "border-nf-accent/30" : "border-nf-border-2")}
                  disabled={hasVoted}
                >
                  {hasVoted && (
                    <div className={cn("absolute top-0 right-0 h-full transition-all duration-500", isVoted ? "bg-nf-accent/15" : "bg-nf-secondary/30")} style={{ width: `${pct}%` }} />
                  )}
                  {!hasVoted && (
                    <div className="w-4 h-4 rounded-full border-2 border-nf-border shrink-0 relative z-10" />
                  )}
                  {hasVoted && (
                    <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 relative z-10 flex items-center justify-center", isVoted ? "border-nf-accent" : "border-nf-border")}>
                      {isVoted && <div className="w-2 h-2 rounded-full bg-nf-accent" />}
                    </div>
                  )}
                  <span className="text-[13px] text-white relative z-10 flex-1">{opt}</span>
                  {hasVoted && (
                    <span className={cn("text-[13px] font-bold relative z-10 tabular-nums", isVoted ? "text-nf-accent" : "text-nf-dim")}>{pct}%</span>
                  )}
                </button>
              );
            })}
            <div className="flex items-center gap-2 text-[11px] text-nf-dim mt-1">
              <span>{pollVotes.reduce((a, b) => a + b, 0)} صوت</span>
              <span>·</span>
              <span>{poll.duration === "24h" ? "ينتهي خلال يوم" : poll.duration === "3d" ? "ينتهي خلال 3 أيام" : "ينتهي خلال أسبوع"}</span>
            </div>
          </div>
        )}

        {/* Images - full width, supports carousel */}
        {allImages.length > 0 && (
          <div className="mt-2 -mx-4 relative overflow-hidden">
            <img src={allImages[imgIdx]} alt="" className={cn("w-full h-auto max-h-[600px] object-cover transition-all duration-300",
              (isNsfw || isSpoiler) && !blurRevealed ? "blur-2xl scale-105" : "cursor-zoom-in hover:opacity-92")} />
            {(isNsfw || isSpoiler) && !blurRevealed && (
              <div onClick={(e) => { e.stopPropagation(); setBlurRevealed(true); }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors z-10">
                <span className="text-white text-[13px] font-bold mb-1">{isNsfw ? "محتوى حساس" : "Spoiler - اضغط للعرض"}</span>
                <span className="text-white/60 text-[10px]">اضغط لكشف الصورة</span>
              </div>
            )}
            {hasMultiple && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setImgIdx((imgIdx - 1 + allImages.length) % allImages.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setImgIdx((imgIdx + 1) % allImages.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"><ChevronRight size={16} /></button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }} className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === imgIdx ? "bg-white" : "bg-white/40")} />
                  ))}
                </div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-white font-medium">{imgIdx + 1}/{allImages.length}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer - always visible */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 text-nf-muted flex-wrap">
        <div className="flex items-center gap-0.5 bg-nf-secondary rounded-full px-1.5 py-0.5">
          <button onClick={(e) => { e.stopPropagation(); handleVote(1); }} className={cn("p-1 rounded-md transition-colors duration-150", myVote === 1 ? "text-orange-500" : "text-nf-dim hover:text-nf-muted")}><ArrowUp size={16} /></button>
          <span className={cn("text-xs font-bold min-w-[20px] text-center", myVote === 1 ? "text-orange-500" : myVote === -1 ? "text-blue-400" : voteCount > 0 ? "text-orange-500" : voteCount < 0 ? "text-blue-400" : "text-nf-dim")}>{voteCount}</span>
          <button onClick={(e) => { e.stopPropagation(); handleVote(-1); }} className={cn("p-1 rounded-md transition-colors duration-150", myVote === -1 ? "text-blue-400" : "text-nf-dim hover:text-nf-muted")}><ArrowDown size={16} /></button>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setShowQuickReply(!showQuickReply); }} className="flex items-center gap-1 hover:text-white text-xs transition-colors">
          <MessageSquare size={14} /><span>{comments} {t("pc.comments")}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="flex items-center gap-1 hover:text-white text-xs transition-colors">
          <Share2 size={14} /><span>{t("pc.share")}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); toggleSave(); }} className={cn("flex items-center gap-1 text-xs transition-all duration-200", saved ? "text-nf-accent" : "hover:text-nf-accent")}>
          <Bookmark size={14} fill={saved ? "currentColor" : "none"} /><span>{saved ? "محفوظ" : "حفظ"}</span>
        </button>
        <span className="flex items-center gap-0.5 text-xs text-nf-dim">
          <Eye size={12} />{views > 0 ? views : "--"}
        </span>
        <div className="flex-1" />
        {/* AI Dropdown - right side */}
        <div className="relative" ref={aiDropRef}>
          <button onClick={(e) => { e.stopPropagation(); setAiDropOpen(!aiDropOpen); }} className={cn("ai-btn", aiDropOpen && "ai-btn-active")} style={{ fontSize: 10, padding: "2px 8px", gap: 3 }}>
            <Sparkles size={10} className="ai-btn-icon" />
            <span className="ai-btn-letter">AI</span>
            <ChevronDown size={8} className={cn("shrink-0 transition-transform opacity-60", aiDropOpen && "rotate-180")} />
          </button>
          {aiDropOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-white/10 shadow-xl shadow-black/40 min-w-[200px] overflow-hidden" style={{ backgroundColor: "rgba(18,18,20,0.85)", backdropFilter: "blur(20px) saturate(1.2)" }}>
              <div className="py-0.5">
                <button onClick={(e) => { e.stopPropagation(); handleAiExplain("explain"); }} disabled={aiLoading} className={cn("w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all", aiLoading ? "opacity-30" : "text-nf-muted hover:bg-white/5")}>
                  <BookOpen size={10} className="text-nf-accent/40" /> <span className="flex-1 text-right">اشرح لي</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleAiExplain("summarize"); }} disabled={aiLoading} className={cn("w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all", aiLoading ? "opacity-30" : "text-nf-muted hover:bg-white/5")}>
                  <FileText size={10} className="text-nf-accent/40" /> <span className="flex-1 text-right">لخّص</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleAiExplain("translate"); }} disabled={aiLoading} className={cn("w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all", aiLoading ? "opacity-30" : "text-nf-muted hover:bg-white/5")}>
                  <Languages size={10} className="text-nf-accent/40" /> <span className="flex-1 text-right">ترجمة</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleAiExplain("correct"); }} disabled={aiLoading} className={cn("w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all", aiLoading ? "opacity-30" : "text-nf-muted hover:bg-white/5")}>
                  <FileText size={10} className="text-amber-400/40" /> <span className="flex-1 text-right">تصحيح</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleAiExplain("tags"); }} disabled={aiLoading} className={cn("w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all", aiLoading ? "opacity-30" : "text-nf-muted hover:bg-white/5")}>
                  <BookOpen size={10} className="text-blue-400/40" /> <span className="flex-1 text-right">وسوم</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleAiExplain("morefeatures"); }} disabled={aiLoading} className={cn("w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all", aiLoading ? "opacity-30" : "text-nf-muted hover:bg-white/5")}>
                  <Sparkles size={10} className="text-purple-400/40" /> <span className="flex-1 text-right">نص محسّن</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="hover:text-white transition-colors p-0.5 rounded hover:bg-nf-hover"><MoreHorizontal size={16} /></button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
              <div className="absolute left-0 top-full mt-1 bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden z-50 min-w-[140px]">
                {user && authorUid === user.uid && onEditClick && (
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditClick(postId || ""); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                    <Pencil size={12} /> تعديل المنشور
                  </button>
                )}
                {user && authorUid === user.uid && onDeleteClick && (
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDeleteClick(postId || ""); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 size={12} /> حذف المنشور
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigator.clipboard?.writeText(`${window.location.origin}/app?view=post&postId=${postId}`); toast("تم نسخ الرابط", "success"); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                  <Link2 size={12} /> نسخ الرابط
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowReport(true); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                  <Flag size={12} /> إبلاغ
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Reply */}
      {showQuickReply && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-nf-border-2/50">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-nf-secondary flex items-center justify-center shrink-0"><span className="text-[9px] text-nf-muted font-bold">{(user?.displayName || "U")[0]}</span></div>
          )}
          <input
            type="text"
            value={quickReplyText}
            onChange={(e) => setQuickReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); handleQuickReply(); } }}
            placeholder={t("pc.quickReply")}
            className="flex-1 bg-nf-secondary rounded-full px-3 py-1.5 text-xs text-white placeholder:text-nf-dim border-none outline-none"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); handleQuickReply(); }} disabled={!quickReplyText.trim()} className={cn("p-1.5 rounded-full transition-colors", quickReplyText.trim() ? "text-nf-accent hover:bg-nf-accent/10" : "text-nf-dim")}>
            <Send size={14} />
          </button>
        </div>
      )}

      {/* AI Result with typing animation */}
      {(aiResult || aiLoading) && (
        <div className="px-4 py-2.5 border-t border-nf-border-2/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={10} className={cn("text-nf-accent/60", aiLoading && "animate-pulse")} />
            <span className="text-[9px] text-nf-accent/60 font-bold">{aiLoading ? "بكتبلك..." : "NorthFall AI"}</span>
            {aiResult && !aiLoading && <button onClick={() => { setAiResult(null); setAiDisplayText(""); }} className="mr-auto text-nf-dim hover:text-white transition-colors"><X size={10} /></button>}
          </div>
          {aiLoading && !aiResult && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
          {aiDisplayText && <p className="text-[11px] text-nf-muted leading-relaxed">{aiDisplayText}<span className="inline-block w-[2px] h-[11px] bg-nf-accent/60 ml-0.5 animate-pulse" /></p>}
        </div>
      )}

      {showReport && <ReportModal open={showReport} onClose={() => setShowReport(false)} type="post" targetId={postId || ""} />}
      {showShareModal && <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} postId={postId || ""} postTitle={title} />}
    </motion.article>
  );
}
