"use client";

import { ArrowRight, Image, Link2, X, ChevronDown, FileText, Eye, Bold, Heading2, Code2, Plus, Trash2, BarChart3, AtSign, List, Italic, Strikethrough, Quote, Sparkles, Save, Clock, AlertTriangle, Smile, Table, Minus, Keyboard, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "./ToastProvider";
import { renderFormattedBody } from "./PostFormatter";

const communities = [
  { name: "عام", label: "n/عام", desc: "المجتمع العام", img: "" },
  { name: "Unity", label: "n/Unity", desc: "مجتمع Unity", img: "/assets/images/unitylogo.png" },
  { name: "Unreal", label: "n/Unreal", desc: "مجتمع Unreal", img: "/assets/images/unreallogo.svg" },
  { name: "Godot", label: "n/Godot", desc: "مجتمع Godot العربي", img: "/assets/images/godotlogo.png" },
  { name: "Blender", label: "n/Blender", desc: "مجتمع Blender", img: "/assets/images/logoblender.png" },
];

const flairs = ["مناقشة", "مساعدة", "إبداع", "خبر", "تعلم", "مشروع", "سؤال"];

export default function CreatePostPage({ onBack, onPost, editPostId, quotedPostId }: { onBack: () => void; onPost: () => void; editPostId?: string; quotedPostId?: string }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [community, setCommunity] = useState("عام");
  const [flair, setFlair] = useState("");
  const [showCommDrop, setShowCommDrop] = useState(false);
  const [showFlairDrop, setShowFlairDrop] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState("24h");
  const [loaded, setLoaded] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftTimer, setDraftTimer] = useState<NodeJS.Timeout | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [quotedPostData, setQuotedPostData] = useState<any>(null);

  // Fetch quoted post data if quotedPostId provided
  useEffect(() => {
    if (!quotedPostId) return;
    getDoc(doc(db, "posts", quotedPostId)).then(s => {
      if (s.exists()) setQuotedPostData({ id: s.id, ...s.data() });
    }).catch(() => {});
  }, [quotedPostId]);

  const emojis = ["👍","❤️","🔥","😂","🎉","🚀","💡","⭐","✅","❌","🤔","👀","💪","🎮","🎨","💻","🐛","✨","📌","🎯"];

  const MAX_DRAFTS = 8;

  const getDrafts = (): any[] => {
    try { return JSON.parse(localStorage.getItem("nf-drafts") || "[]"); } catch { return []; }
  };

  const saveDrafts = (drafts: any[]) => localStorage.setItem("nf-drafts", JSON.stringify(drafts));

  // Auto-save draft to localStorage (multi-draft)
  useEffect(() => {
    if (editPostId) return;
    if (draftTimer) clearTimeout(draftTimer);
    const timer = setTimeout(() => {
      if (title.trim() || body.trim()) {
        const drafts = getDrafts();
        const existing = drafts.findIndex((d: any) => d.id === "current");
        const entry = { id: "current", title, body, community, flair, imageUrls, isNsfw, isSpoiler, savedAt: new Date().toISOString() };
        if (existing >= 0) drafts[existing] = entry; else if (drafts.length < MAX_DRAFTS) drafts.push(entry);
        saveDrafts(drafts);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1500);
    setDraftTimer(timer);
  }, [title, body, community, flair, imageUrls, isNsfw, isSpoiler]);

  // Check for saved draft on mount
  useEffect(() => {
    if (editPostId) return;
    const drafts = getDrafts();
    const current = drafts.find((d: any) => d.id === "current");
    if (current && (current.title || current.body)) setShowDraftBanner(true);
  }, []);

  const loadDraft = () => {
    const drafts = getDrafts();
    const d = drafts.find((dr: any) => dr.id === "current");
    if (d) {
      setTitle(d.title || ""); setBody(d.body || ""); setCommunity(d.community || "عام"); setFlair(d.flair || "");
      setImageUrls(d.imageUrls?.length ? d.imageUrls : [""]); setIsNsfw(d.isNsfw || false); setIsSpoiler(d.isSpoiler || false);
      setShowDraftBanner(false);
    }
  };

  const discardDraft = () => {
    const drafts = getDrafts().filter((d: any) => d.id !== "current");
    saveDrafts(drafts);
    setShowDraftBanner(false);
  };

  const saveNamedDraft = () => {
    if (!title.trim() && !body.trim()) return;
    const drafts = getDrafts();
    const named = drafts.filter((d: any) => d.id !== "current");
    if (named.length >= MAX_DRAFTS) return;
    const id = "draft-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    named.push({ id, title, body, community, flair, imageUrls, isNsfw, isSpoiler, savedAt: new Date().toISOString() });
    saveDrafts([...drafts.filter((d: any) => d.id !== "current"), ...named]);
    setDraftSaved(true); setTimeout(() => setDraftSaved(false), 2000);
  };

  const loadNamedDraft = (id: string) => {
    const drafts = getDrafts();
    const d = drafts.find((dr: any) => dr.id === id);
    if (d) {
      setTitle(d.title || ""); setBody(d.body || ""); setCommunity(d.community || "عام"); setFlair(d.flair || "");
      setImageUrls(d.imageUrls?.length ? d.imageUrls : [""]); setIsNsfw(d.isNsfw || false); setIsSpoiler(d.isSpoiler || false);
      setShowDrafts(false);
    }
  };

  const deleteNamedDraft = (id: string) => {
    const drafts = getDrafts().filter((d: any) => d.id !== id);
    saveDrafts(drafts);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === "b") { e.preventDefault(); insertFormat("**", "**"); }
        if (e.key === "i") { e.preventDefault(); insertFormat("*", "*"); }
        if (e.key === "k") { e.preventDefault(); insertFormat("[", "](url)"); }
        if (e.key === "e") { e.preventDefault(); insertFormat("`", "`"); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [body]);

  // Load existing post data for editing
  useEffect(() => {
    if (!editPostId || loaded) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "posts", editPostId));
        if (snap.exists()) {
          const d = snap.data();
          setTitle(d.title || "");
          setBody(d.body || "");
          setCommunity(d.community || "عام");
          setFlair(d.flair || "");
          setIsNsfw(d.isNsfw || false);
          setIsSpoiler(d.isSpoiler || false);
          if (d.imageUrls?.length) setImageUrls(d.imageUrls);
          else if (d.imageUrl) setImageUrls([d.imageUrl]);
          if (d.poll?.options) { setPollOptions(d.poll.options); setShowPoll(true); setPollDuration(d.poll.duration || "24h"); }
          setLoaded(true);
        }
      } catch (e) { console.error(e); }
    })();
  }, [editPostId, loaded]);

  const addImageUrl = () => {
    if (imageUrls.length < 5) setImageUrls([...imageUrls, ""]);
  };

  const removeImageUrl = (idx: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  const updateImageUrl = (idx: number, val: string) => {
    const updated = [...imageUrls];
    updated[idx] = val;
    setImageUrls(updated);
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, ""]);
  };

  const removePollOption = (idx: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const updatePollOption = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("post-body") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);
    const newBody = body.substring(0, start) + prefix + selected + suffix + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // Handle Tab key in textarea
  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertFormat("  ");
    }
    // Auto-continue lists on Enter
    if (e.key === "Enter") {
      const textarea = e.currentTarget;
      const pos = textarea.selectionStart;
      const lineStart = body.lastIndexOf("\n", pos - 1) + 1;
      const currentLine = body.substring(lineStart, pos);
      const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.)\s/);
      if (listMatch) {
        e.preventDefault();
        const prefix = listMatch[1] + (listMatch[2].match(/\d/) ? (parseInt(listMatch[2]) + 1) + ". " : listMatch[2] + " ");
        insertFormat("\n" + prefix);
      }
    }
  };

  // Drag & drop images
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const text = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
      const emptyIdx = imageUrls.findIndex(u => !u.trim());
      if (emptyIdx >= 0) updateImageUrl(emptyIdx, text);
      else if (imageUrls.length < 5) { setImageUrls([...imageUrls, text]); }
    }
  };

  const handleSubmit = async () => {
    if (!user || !title.trim()) return;
    setSubmitting(true);
    try {
      const validUrls = imageUrls.filter(u => u.trim());
      const validPollOptions = showPoll ? pollOptions.filter(o => o.trim()) : [];
      const postData = {
        title: title.trim(),
        body: body.trim(),
        imageUrl: validUrls[0] || "",
        imageUrls: validUrls,
        linkUrl: "",
        community,
        flair,
        isNsfw,
        isSpoiler,
        poll: showPoll && validPollOptions.length >= 2 ? { options: validPollOptions, duration: pollDuration, votes: validPollOptions.map(() => 0) } : null,
        postType: showPoll ? "poll" : "post",
      };
      if (editPostId) {
        await updateDoc(doc(db, "posts", editPostId), postData);
      } else {
        const postRef = await addDoc(collection(db, "posts"), {
          ...postData,
          authorName: user.displayName || "مستخدم",
          authorPhoto: user.photoURL || "",
          authorUid: user.uid,
          votes: 1,
          commentCount: 0,
          createdAt: new Date().toISOString(),
          ...(quotedPostId ? { quotedPostId } : {}),
        });
        // Save author's auto-upvote
        await setDoc(doc(db, "posts", postRef.id, "votes", user.uid), { dir: 1, votedAt: new Date().toISOString() });
        // Update user stats
        await updateDoc(doc(db, "users", user.uid), {
          postCount: increment(1),
          karma: increment(3),
        }).catch(() => {});
      }
      // Clear draft after publish
      const drafts = getDrafts().filter((d: any) => d.id !== "current");
      saveDrafts(drafts);
      onPost();
      toast(editPostId ? "تم تعديل المنشور بنجاح" : "تم نشر المنشور بنجاح", "success");
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-nf-dim hover:text-white text-[12px] transition-colors shrink-0">
          <ArrowRight size={16} /> {t("cp.backToFeed")}
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <button onClick={() => setShowPreview(!showPreview)}
            className={cn("flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border",
              showPreview ? "bg-nf-accent/10 text-nf-accent border-nf-accent/30" : "text-nf-dim border-nf-border-2 hover:bg-nf-hover hover:text-white")}>
            <Eye size={12} /> معاينة
          </button>
          {/* Draft indicator */}
          {draftSaved && !editPostId && (
            <span className="flex items-center gap-1 text-[9px] text-green-400"><Save size={9} /> تم الحفظ</span>
          )}
          <button onClick={saveNamedDraft} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-nf-dim hover:bg-nf-hover hover:text-nf-muted transition-all duration-200">
            <Save size={12} /> مسودة
          </button>
          <button onClick={() => setShowDrafts(!showDrafts)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-nf-dim hover:bg-nf-hover hover:text-nf-muted transition-all duration-200">
            <Clock size={12} /> المسودات
          </button>
          <button onClick={handleSubmit} disabled={!title.trim() || submitting}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-nf-accent text-white hover:bg-nf-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
            {submitting ? (editPostId ? "جاري التحديث..." : t("cp.publishing")) : (editPostId ? "تحديث" : t("cp.publish"))}
          </button>
        </div>
      </div>

      {/* Quote preview - full mini post card */}
      {quotedPostData && (
        <div className="mb-3 rounded-lg border border-nf-border-2/40 bg-[#16161a] overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 text-[13px] mb-1.5">
              <div className="w-5 h-5 rounded-full bg-nf-secondary overflow-hidden shrink-0">
                {quotedPostData.authorPhoto ? (
                  <img src={quotedPostData.authorPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-nf-muted font-bold">{(quotedPostData.authorName || "U")[0]}</div>
                )}
              </div>
              <span className="font-semibold text-nf-accent">n/{quotedPostData.community || "عام"}</span>
              <span className="text-nf-dim">·</span>
              <span className="text-nf-muted">u/{quotedPostData.authorName || "User"}</span>
            </div>
            {quotedPostData.title && <h3 className="text-[16px] font-bold text-white/80 leading-snug mb-1">{quotedPostData.title}</h3>}
            {quotedPostData.body && <p className="text-sm text-nf-text-2/80 leading-relaxed line-clamp-4">{quotedPostData.body}</p>}
            {quotedPostData.imageUrl && <img src={quotedPostData.imageUrl} alt="" className="mt-2 rounded max-h-[120px] w-auto object-cover" />}
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-nf-border-2/30">
            <span className="text-[10px] text-nf-dim flex items-center gap-1"><Quote size={10} />سيتم اقتباس هذا المنشور</span>
            <button onClick={() => setQuotedPostData(null)} className="text-[10px] text-nf-dim hover:text-red-400 flex items-center gap-1 transition-colors"><X size={10} />إزالة</button>
          </div>
        </div>
      )}

      {showPreview ? (
        /* Preview mode */
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3 text-[11px] text-nf-dim">
            <span>n/{community}</span>
            {flair && <span className="px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent text-[10px]">{flair}</span>}
            {isNsfw && <span className="px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 text-[9px] font-bold border border-red-400/30">NSFW</span>}
            {isSpoiler && <span className="px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 text-[9px] font-bold border border-yellow-400/30">Spoiler</span>}
          </div>
          <h1 className="text-[16px] font-bold text-white mb-3">{title || "عنوان المنشور"}</h1>
          {imageUrls.filter(u => u.trim()).map((url, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-nf-border-2 mb-2">
              <img src={url} alt="" className="w-full max-h-[300px] object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            </div>
          ))}
          {showPoll && pollOptions.filter(o => o.trim()).length >= 2 && (
            <div className="space-y-1.5 mb-3">
              {pollOptions.filter(o => o.trim()).map((opt, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-nf-border-2 bg-nf-secondary/30">
                  <div className="w-4 h-4 rounded-full border border-nf-border shrink-0" />
                  <span className="text-[12px] text-nf-muted">{opt}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3">{renderFormattedBody(body)}</div>
        </div>
      ) : (
        /* Edit mode - flat, no outer box */
        <div className="space-y-3">
          {/* Community selector + flair row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <button onClick={() => { setShowCommDrop(!showCommDrop); setShowFlairDrop(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nf-secondary text-[12px] text-white hover:bg-nf-hover transition-colors w-full justify-between">
                <div className="flex items-center gap-2">
                  {(() => { const c = communities.find(c => c.name === community); return c?.img ? <img src={c.img} alt="" className="w-4 h-4 rounded-full object-cover" /> : <span className="w-4 h-4 rounded-full bg-nf-border flex items-center justify-center text-[8px] text-nf-muted font-bold">n/</span>; })()}
                  <span>{communities.find(c => c.name === community)?.label}</span>
                </div>
                <ChevronDown size={12} className="text-nf-muted" />
              </button>
              <AnimatePresence>
                {showCommDrop && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 right-0 left-0 bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden z-20">
                    {communities.map((c) => (
                      <button key={c.name} onClick={() => { setCommunity(c.name); setShowCommDrop(false); }}
                        className={cn("flex items-center gap-3 w-full px-3 py-2 text-[12px] text-white hover:bg-nf-hover text-right transition-colors", community === c.name && "bg-nf-hover")}>
                        {c.img ? <img src={c.img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" /> : <span className="w-5 h-5 rounded-full bg-nf-border flex items-center justify-center text-[8px] text-nf-muted font-bold shrink-0">n/</span>}
                        <span className="font-bold">{c.label}</span>
                        <span className="text-nf-dim text-[10px]">{c.desc}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button onClick={() => { setShowFlairDrop(!showFlairDrop); setShowCommDrop(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-nf-secondary text-[10px] text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                <span>{flair || t("cp.addFlair")}</span>
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showFlairDrop && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-lg p-2 z-20 flex flex-wrap gap-1 min-w-[180px]">
                    {flairs.map((f) => (
                      <button key={f} onClick={() => { setFlair(f); setShowFlairDrop(false); }}
                        className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors", flair === f ? "bg-nf-accent text-white" : "bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-white")}>
                        {f}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Draft recovery banner */}
          {showDraftBanner && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-nf-accent/10 border border-nf-accent/20">
              <div className="flex items-center gap-2 text-[11px] text-nf-accent">
                <RotateCcw size={12} /> لديك مسودة محفوظة
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadDraft} className="px-2 py-0.5 rounded bg-nf-accent/20 text-nf-accent text-[10px] font-bold hover:bg-nf-accent/30">استعادة</button>
                <button onClick={discardDraft} className="px-2 py-0.5 rounded text-nf-dim text-[10px] hover:text-red-400">تجاهل</button>
              </div>
            </motion.div>
          )}

          {/* Drafts list */}
          {showDrafts && (() => {
            const drafts = getDrafts().filter((d: any) => d.id !== "current");
            return drafts.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">المسودات ({drafts.length}/{MAX_DRAFTS})</span>
                  <button onClick={() => setShowDrafts(false)} className="text-nf-dim hover:text-white"><X size={12} /></button>
                </div>
                {drafts.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-nf-secondary/30 hover:bg-nf-hover transition-colors group cursor-pointer" onClick={() => loadNamedDraft(d.id)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{d.title || "بدون عنوان"}</p>
                      <span className="text-[9px] text-nf-dim">n/{d.community} · {new Date(d.savedAt).toLocaleDateString("ar")}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteNamedDraft(d.id); }} className="opacity-0 group-hover:opacity-100 text-nf-dim hover:text-red-400 transition-all"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-3 text-[11px] text-nf-dim">لا توجد مسودات محفوظة</div>;
          })()}

          {/* Title - flat, no border */}
          <div className="relative">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("cp.title")} maxLength={300}
              className="w-full bg-transparent px-1 py-2 text-[15px] font-bold text-white placeholder:text-nf-dim/50 outline-none" />
            <span className={cn("absolute left-1 top-1/2 -translate-y-1/2 text-[9px]", title.length > 250 ? "text-red-400" : title.length > 150 ? "text-yellow-400" : "text-nf-dim")}>{title.length}/300</span>
          </div>

          {/* Image URLs - multiple */}
          <div className="space-y-1.5">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <Image size={12} className="text-nf-dim shrink-0" />
                  <input type="text" value={url} onChange={(e) => updateImageUrl(idx, e.target.value)}
                    placeholder={idx === 0 ? t("cp.imagePlaceholder") : `رابط صورة ${idx + 1}`}
                    className="flex-1 bg-transparent border-b border-nf-border-2/50 px-1 py-1.5 text-[11px] text-white placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
                </div>
                {imageUrls.length > 1 && (
                  <button onClick={() => removeImageUrl(idx)} className="p-0.5 rounded text-nf-dim hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                )}
                {url && (
                  <div className="w-7 h-7 rounded border border-nf-border-2 overflow-hidden shrink-0">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>
            ))}
            {imageUrls.length < 5 && (
              <button onClick={addImageUrl} className="flex items-center gap-1 text-[10px] text-nf-dim hover:text-nf-accent transition-colors">
                <Plus size={9} /> إضافة صورة أخرى
              </button>
            )}
          </div>

          {/* Poll */}
          {showPoll && (
            <div className="space-y-1.5 border border-nf-border-2/50 rounded-lg p-3 bg-nf-secondary/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider flex items-center gap-1"><BarChart3 size={10} /> استطلاع</span>
                <button onClick={() => setShowPoll(false)} className="text-[9px] text-nf-dim hover:text-red-400 transition-colors">إزالة</button>
              </div>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={opt} onChange={(e) => updatePollOption(idx, e.target.value)} placeholder={`خيار ${idx + 1}`}
                    className="flex-1 bg-transparent border-b border-nf-border-2/50 px-1 py-1.5 text-[11px] text-white placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
                  {pollOptions.length > 2 && (
                    <button onClick={() => removePollOption(idx)} className="p-0.5 text-nf-dim hover:text-red-400 transition-colors"><X size={10} /></button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button onClick={addPollOption} className="flex items-center gap-1 text-[9px] text-nf-dim hover:text-nf-accent transition-colors">
                  <Plus size={8} /> إضافة خيار
                </button>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] text-nf-dim">المدة:</span>
                {["24h", "3d", "1w"].map(d => (
                  <button key={d} onClick={() => setPollDuration(d)}
                    className={cn("px-2 py-0.5 rounded text-[9px] font-semibold transition-colors", pollDuration === d ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-white")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags row: NSFW / Spoiler / Pin */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setIsNsfw(!isNsfw)} className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold transition-colors border",
              isNsfw ? "bg-red-400/10 text-red-400 border-red-400/30" : "text-nf-dim border-nf-border-2 hover:bg-nf-hover hover:text-white")}>
              <AlertTriangle size={8} /> NSFW
            </button>
            <button onClick={() => setIsSpoiler(!isSpoiler)} className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold transition-colors border",
              isSpoiler ? "bg-nf-accent/10 text-nf-accent border-nf-accent/30" : "text-nf-dim border-nf-border-2 hover:bg-nf-hover hover:text-white")}>
              <Eye size={8} /> Spoiler
            </button>
          </div>

          {/* Formatting toolbar */}
          <div className="flex items-center gap-0.5 rounded-lg px-1 py-0.5 bg-nf-secondary/20 flex-wrap">
            <button onClick={() => insertFormat("**", "**")} title="Bold (Ctrl+B)" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Bold size={12} /></button>
            <button onClick={() => insertFormat("*", "*")} title="Italic (Ctrl+I)" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Italic size={12} /></button>
            <button onClick={() => insertFormat("~~", "~~")} title="Strikethrough" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Strikethrough size={12} /></button>
            <div className="w-px h-4 bg-nf-border-2/50 mx-0.5" />
            <button onClick={() => insertFormat("# ")} title="Title" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Heading2 size={12} /></button>
            <button onClick={() => insertFormat("> ")} title="Quote" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Quote size={12} /></button>
            <button onClick={() => insertFormat("- ")} title="List" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><List size={12} /></button>
            <button onClick={() => insertFormat("---\n")} title="Horizontal Rule" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Minus size={12} /></button>
            <button onClick={() => insertFormat("| عمود 1 | عمود 2 |\n|--------|--------|\n| ", " | ")} title="Table" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Table size={12} /></button>
            <div className="w-px h-4 bg-nf-border-2/50 mx-0.5" />
            <button onClick={() => insertFormat("`", "`")} title="Code (Ctrl+E)" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Code2 size={12} /></button>
            <button onClick={() => insertFormat("```\n", "\n```")} title="Code Block" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors text-[9px] font-mono font-bold">{"{}"}</button>
            <button onClick={() => insertFormat("[", "](url)")} title="Link (Ctrl+K)" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Link2 size={12} /></button>
            <div className="w-px h-4 bg-nf-border-2/50 mx-0.5" />
            <button onClick={() => setShowPoll(!showPoll)} title="Poll" className={cn("p-1.5 rounded transition-colors", showPoll ? "text-nf-accent bg-nf-accent/10" : "text-nf-dim hover:bg-nf-hover hover:text-white")}><BarChart3 size={12} /></button>
            <button onClick={() => insertFormat("@")} title="Mention" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><AtSign size={12} /></button>
            <div className="w-px h-4 bg-nf-border-2/50 mx-0.5" />
            {/* Emoji */}
            <div className="relative">
              <button onClick={() => setShowEmoji(!showEmoji)} title="Emoji" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Smile size={12} /></button>
              {showEmoji && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
                  <div className="absolute bottom-full mb-1 right-0 bg-nf-primary border border-nf-border-2 rounded-lg p-2 z-50 grid grid-cols-5 gap-1 min-w-[180px]">
                    {emojis.map((em, i) => (
                      <button key={i} onClick={() => { insertFormat(em); setShowEmoji(false); }} className="p-1 rounded hover:bg-nf-hover text-sm text-center transition-colors">{em}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Shortcuts help */}
            <div className="relative">
              <button onClick={() => setShowShortcuts(!showShortcuts)} title="اختصارات" className="p-1.5 rounded text-nf-dim hover:bg-nf-hover hover:text-white transition-colors"><Keyboard size={12} /></button>
              {showShortcuts && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowShortcuts(false)} />
                  <div className="absolute bottom-full mb-1 right-0 bg-nf-primary border border-nf-border-2 rounded-lg p-3 z-50 min-w-[200px]">
                    <div className="text-[10px] font-bold text-nf-muted mb-2">اختصارات لوحة المفاتيح</div>
                    <div className="space-y-1.5 text-[10px] text-nf-dim">
                      <div className="flex justify-between"><span>عريض</span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px]">Ctrl+B</kbd></div>
                      <div className="flex justify-between"><span>مائل</span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px]">Ctrl+I</kbd></div>
                      <div className="flex justify-between"><span>رابط</span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px]">Ctrl+K</kbd></div>
                      <div className="flex justify-between"><span>كود</span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px]">Ctrl+E</kbd></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Body + DragDrop */}
          <div className={cn("relative rounded-lg border-2 border-dashed transition-colors", isDragOver ? "border-nf-accent bg-nf-accent/5" : "border-transparent")}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}>
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-nf-accent/5 rounded-lg z-10 pointer-events-none">
                <div className="flex items-center gap-2 text-nf-accent text-[12px] font-bold"><Image size={16} /> أفلت الصورة هنا</div>
              </div>
            )}
            <textarea id="post-body" value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={handleBodyKeyDown} placeholder={t("cp.bodyPlaceholder")} rows={isFullscreen ? 25 : 8}
              className={cn("w-full bg-transparent px-1 py-2 text-[12px] text-white placeholder:text-nf-dim/50 outline-none font-mono leading-relaxed", isFullscreen ? "resize-y" : "resize-none")} />
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-between text-[9px] text-nf-dim">
            <div className="flex items-center gap-3">
              <span className={cn("tabular-nums", body.length > 10000 ? "text-red-400" : body.length > 5000 ? "text-yellow-400" : "")}>{body.split(/\s+/).filter(Boolean).length} كلمة · {body.length} حرف</span>
              <span className="flex items-center gap-1">~{Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 200))} دقيقة قراءة</span>
              {isNsfw && <span className="text-red-400 font-semibold">NSFW</span>}
              {isSpoiler && <span className="text-nf-accent font-semibold">Spoiler</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="flex items-center gap-0.5 hover:text-white transition-colors">
                {isFullscreen ? <Minimize2 size={9} /> : <Maximize2 size={9} />} {isFullscreen ? "تصغير" : "تكبير"}
              </button>
              <span>{"**bold** *italic* ~~strike~~ # عنوان `كود` ```كتلة``` - قائمة > اقتباس @ إشارة --- فاصل"}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
