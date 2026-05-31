"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Share2, Bookmark, MessageSquare, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Flag, Code2, Trash2, Pencil, Link2, BarChart3, BookOpen, Languages, FileText, X, Quote, MoreHorizontal, GitCommitHorizontal, Eye } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { flairBadgeStyle } from "@/lib/flair-badge";
import CommentToolbarSelect from "./CommentToolbarSelect";
import { doc, getDoc, getDocs, collection, query, orderBy, addDoc, updateDoc, increment, setDoc, deleteDoc, runTransaction, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { calcSaitGain } from "@/lib/ranking";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";
import ReportModal from "./ReportModal";
import HoverCard from "./HoverCard";
import PostBodyContent from "./PostBodyContent";
import ImageLightbox from "./ImageLightbox";
import FeedMediaFrame from "./FeedMediaFrame";
import NorthFallAiButton from "./NorthFallAiButton";
import TranslateLangPicker from "./TranslateLangPicker";
import VotePill from "./VotePill";
import RichContentEditor, { type RichContentEditorHandle } from "./RichContentEditor";
import { getVoteTransition, normalizeStoredVote } from "@/lib/vote-transition";
import LivingPostVersions, { type PostVersion } from "./LivingPostVersions";
import CommentEditModal from "./CommentEditModal";
import { translateText } from "@/lib/translate";
import { buildNorthfallEmbedCode } from "@/lib/northfall-embed";
import { recordPostView } from "@/lib/record-post-view";
import {
  NORTHFALL_COMMENT_SORT,
  COMMENT_CONTENT_FILTERS,
  sortNorthfallComments,
  matchesCommentSearch,
  type NorthfallCommentSort,
  type CommentContentFilter,
} from "@/lib/comment-filters";

interface PostDetailProps {
  postId: string;
  onBack: () => void;
  onCommunityClick?: (name: string) => void;
  onProfileClick?: (uid: string) => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  onQuoteClick?: (id: string) => void;
  onUpgradeClick?: (postId: string) => void;
  onHashtagClick?: (tag: string) => void;
}

interface Comment {
  id: string;
  postId?: string;
  text: string;
  authorName?: string;
  authorPhoto?: string;
  authorUid?: string;
  parentId?: string;
  createdAt?: string;
  votes?: number;
  replies?: Comment[];
}

function OverflowMenu({
  items,
}: {
  items: { label: string; icon: ReactNode; onClick: () => void; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
        aria-label="المزيد"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-[150px] rounded-xl border border-nf-border-2 bg-nf-primary shadow-xl overflow-hidden py-0.5">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { item.onClick(); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors text-right",
                item.danger ? "text-red-400 hover:bg-red-500/10" : "text-nf-muted hover:bg-nf-hover hover:text-nf-text"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function buildTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  comments.forEach((c) => {
    c.replies = [];
    map.set(c.id, c);
  });
  comments.forEach((c) => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

function CommentNode({ comment, depth = 0, onReply, onProfileClick, onDelete, onHashtagClick, onCommentUpdated, postId: commentPostId, showToast, forceCollapse }: { comment: Comment; depth?: number; onReply: (parentId: string, authorName: string) => void; onProfileClick?: (uid: string) => void; onDelete?: (comment: Comment) => Promise<void> | void; onHashtagClick?: (tag: string) => void; onCommentUpdated?: (commentId: string, text: string) => void; postId?: string; showToast?: (msg: string) => void; forceCollapse?: boolean }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const effectiveCollapsed = forceCollapse ?? collapsed;
  const [voteCount, setVoteCount] = useState(comment.votes || 0);
  const [myVote, setMyVote] = useState(0);
  const myVoteRef = useRef(0);
  const voteCountRef = useRef(comment.votes || 0);
  const votingRef = useRef(false);
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const isOwn = user?.uid === comment.authorUid;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const runTranslate = async () => {
    if (translated) {
      setTranslated(null);
      return;
    }
    setTranslating(true);
    try {
      const result = await translateText(comment.text);
      if (result?.trim()) setTranslated(result);
    } catch {
      /* ignore */
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    voteCountRef.current = comment.votes || 0;
    setVoteCount(comment.votes || 0);
  }, [comment.votes]);

  useEffect(() => {
    myVoteRef.current = myVote;
  }, [myVote]);

  // Load user's existing vote on this comment
  useEffect(() => {
    if (!user || !commentPostId) return;
    getDoc(doc(db, "posts", commentPostId, "comments", comment.id, "votes", user.uid)).then(s => {
      if (s.exists()) {
        const dir = normalizeStoredVote(s.data().dir || 0);
        myVoteRef.current = dir;
        setMyVote(dir);
      }
    }).catch(() => {});
  }, [user, commentPostId, comment.id]);

  const handleVote = async (dir: 1 | -1) => {
    if (!user || votingRef.current) return;
    const transition = getVoteTransition(myVoteRef.current as -1 | 0 | 1, dir);
    if (!transition) return;
    const { next: newVote, diff } = transition;
    const prevVote = myVoteRef.current;
    const prevCount = voteCountRef.current;
    const nextCount = Math.max(0, prevCount + diff);
    votingRef.current = true;
    myVoteRef.current = newVote;
    voteCountRef.current = nextCount;
    setMyVote(newVote);
    setVoteCount(nextCount);
    try {
      await updateDoc(doc(db, "posts", commentPostId || "", "comments", comment.id), { votes: increment(diff) });
      if (newVote === 0) {
        await deleteDoc(doc(db, "posts", commentPostId || "", "comments", comment.id, "votes", user.uid));
      } else {
        await setDoc(doc(db, "posts", commentPostId || "", "comments", comment.id, "votes", user.uid), { dir: newVote, votedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error("[CommentNode] Vote error:", e);
      myVoteRef.current = prevVote;
      voteCountRef.current = prevCount;
      setMyVote(prevVote);
      setVoteCount(prevCount);
    } finally {
      votingRef.current = false;
    }
  };

  const saveCommentEdit = async (markdown: string) => {
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "posts", comment.postId || commentPostId || "", "comments", comment.id), {
        text: markdown,
        editedAt: new Date().toISOString(),
      });
      onCommentUpdated?.(comment.id, markdown);
      setEditOpen(false);
      showToast?.(t("pd.saved") || "تم الحفظ");
    } catch (e) {
      console.error(e);
      showToast?.("فشل حفظ التعديل");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "relative",
        depth > 0 && "mr-2 sm:mr-4 pr-6 sm:pr-8",
      )}
    >
      {/* Connector line (Precise YouTube Style) */}
      {depth > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 w-6 cursor-pointer z-10"
          onClick={() => setCollapsed(!collapsed)}
          aria-hidden
        />
      )}

      <div className="py-2">
        {/* Meta */}
        <div className="flex items-center gap-2 text-xs mb-1">
          <HoverCard type="user" name={comment.authorName || t("gen.user")} uid={comment.authorUid} onProfileClick={onProfileClick}>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-nf-secondary overflow-hidden shrink-0">
                {comment.authorPhoto ? (
                  <img src={comment.authorPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-nf-muted font-bold">
                    {(comment.authorName || "U")[0]}
                  </div>
                )}
              </div>
              <span className="font-bold text-white hover:text-nf-accent transition-colors inline-flex items-center gap-1">u/{comment.authorName || t("gen.user")}{(comment.authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[13px] h-[13px] inline" />}</span>
            </div>
          </HoverCard>
          <span className="text-nf-dim">·</span>
          <span className="text-nf-muted" title={comment.createdAt ? new Date(comment.createdAt).toLocaleString('ar') : ''}>{timeAgoShort(comment.createdAt)}</span>
          {hasReplies && (
            <button onClick={() => setCollapsed(!effectiveCollapsed)} className="text-nf-dim hover:text-nf-text transition-colors mr-1">
              {effectiveCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
            </button>
          )}
        </div>

        {!effectiveCollapsed && (
          <>
            {/* Text - with @mention highlighting */}
            <PostBodyContent
                text={translated ?? comment.text}
                variant="comment"
                className={cn("text-nf-text-2 mb-1.5", translated && "opacity-90")}
                onHashtagClick={onHashtagClick}
                onProfileClick={onProfileClick}
              />

            <CommentEditModal
              open={editOpen}
              initialText={comment.text}
              onClose={() => setEditOpen(false)}
              onSave={saveCommentEdit}
              saving={editSaving}
              user={user ? { displayName: user.displayName ?? undefined, photoURL: user.photoURL ?? undefined } : null}
            />

            {/* Delete Confirm */}
            {showDeleteConfirm && (
              <div className="mb-1.5 p-2 bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg">
                <p className="text-xs text-[#ff8888] mb-1.5">{t("pd.deleteConfirm")}</p>
                <div className="flex items-center gap-2">
                  <button onClick={async () => { try { await deleteDoc(doc(db, "posts", comment.postId || commentPostId || "", "comments", comment.id)); await onDelete?.(comment); } catch (e) { console.error(e); } setShowDeleteConfirm(false); }} className="px-3 py-1 rounded-lg bg-[#ff4444] text-white text-xs font-bold">{t("pd.delete")}</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 rounded-lg bg-nf-secondary text-nf-muted text-xs hover:text-nf-text">{t("pd.cancel")}</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              <VotePill
                count={voteCount}
                myVote={myVote as -1 | 0 | 1}
                onUp={() => handleVote(1)}
                onDown={() => handleVote(-1)}
                size="sm"
              />
              <button onClick={() => onReply(comment.id, comment.authorName || t("gen.user"))} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
                <MessageSquare size={11} /><span>{t("pd.reply")}</span>
              </button>
              <button
                type="button"
                onClick={runTranslate}
                disabled={translating}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors disabled:opacity-40"
              >
                {translating ? (
                  <span className="w-3 h-3 border border-nf-dim border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Languages size={11} />
                )}
                <span>{translated ? "إلغاء" : "ترجمة"}</span>
              </button>
              {!translated && <TranslateLangPicker />}
              <button onClick={() => setShowReport(true)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
                <Flag size={11} /><span>{t("pd.report")}</span>
              </button>
              <OverflowMenu
                items={
                  isOwn
                    ? [
                        { label: t("pd.copy"), icon: <Share2 size={11} />, onClick: () => { navigator.clipboard?.writeText(comment.text); showToast?.(t("pd.textCopied")); } },
                        { label: t("pd.edit"), icon: <Pencil size={11} />, onClick: () => setEditOpen(true) },
                        { label: t("pd.delete"), icon: <Trash2 size={11} />, onClick: () => setShowDeleteConfirm(true), danger: true },
                      ]
                    : [
                        { label: t("pd.copy"), icon: <Share2 size={11} />, onClick: () => { navigator.clipboard?.writeText(comment.text); showToast?.(t("pd.textCopied")); } },
                        { label: t("pd.link"), icon: <Link2 size={11} />, onClick: () => { navigator.clipboard?.writeText(`${window.location.origin}/app?view=post&postId=${commentPostId || comment.postId}`); showToast?.(t("pd.linkCopied")); } },
                        { label: saved ? t("pd.saved") : t("pd.saveBtn"), icon: <Bookmark size={11} />, onClick: () => setSaved(!saved) },
                      ]
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal open={showReport} onClose={() => setShowReport(false)} type="comment" targetId={comment.id} />

      {/* Nested replies */}
      <AnimatePresence>
        {!effectiveCollapsed && hasReplies && (
          <motion.div initial={false} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {comment.replies!.map((reply) => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} onProfileClick={onProfileClick} onDelete={onDelete} onHashtagClick={onHashtagClick} onCommentUpdated={onCommentUpdated} postId={commentPostId} showToast={showToast} forceCollapse={forceCollapse} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PostDetail({ postId, onBack, onCommunityClick, onProfileClick, onEditClick, onDeleteClick, onQuoteClick, onUpgradeClick, onHashtagClick }: PostDetailProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentComposerOpen, setCommentComposerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [postVoteCount, setPostVoteCount] = useState(0);
  const [postMyVote, setPostMyVote] = useState(0);
  const [postVoteLoaded, setPostVoteLoaded] = useState(false);
  const postMyVoteRef = useRef(0);
  const postVoteCountRef = useRef(0);
  const postVotingRef = useRef(false);
  const [postSaved, setPostSaved] = useState(false);
  const [commentSort, setCommentSort] = useState<NorthfallCommentSort>("recommended");
  const [commentSearch, setCommentSearch] = useState("");
  const [commentSearchOpen, setCommentSearchOpen] = useState(false);
  const [commentContentFilter, setCommentContentFilter] = useState<CommentContentFilter>("all");
  const commentSearchRef = useRef<HTMLInputElement>(null);
  const commentEditorRef = useRef<RichContentEditorHandle>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; urls: string[]; idx: number } | null>(null);
  const [detailBlurRevealed, setDetailBlurRevealed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [quotedPost, setQuotedPost] = useState<any>(null);
  const [detailImgIdx, setDetailImgIdx] = useState(0);
  const [imageCarousel, setImageCarousel] = useState(true);
  const [views, setViews] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  // AI
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDropOpen, setAiDropOpen] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiProvider, setAiProvider] = useState<"chatgpt" | "gemini" | "claude" | "deepseek" | "groq" | "mistral" | "chatanywhere">("chatanywhere");
  const [aiModel, setAiModel] = useState(0);
  const [aiConnected, setAiConnected] = useState<"unknown" | "testing" | "ok" | "fail">("unknown");
  const aiDropRef = useRef<HTMLDivElement>(null);

  const [postTranslated, setPostTranslated] = useState<{ title?: string; body?: string } | null>(null);
  const [postTranslating, setPostTranslating] = useState(false);
  const [livingIdx, setLivingIdx] = useState(-1);

  const livingVersions: PostVersion[] = useMemo(() => {
    if (!post?.versions || !Array.isArray(post.versions)) return [];
    return post.versions as PostVersion[];
  }, [post]);

  const activeLivingIdx = useMemo(() => {
    if (livingVersions.length === 0) return -1;
    if (livingIdx >= 0 && livingIdx < livingVersions.length) return livingIdx;
    return livingVersions.length - 1;
  }, [livingVersions, livingIdx]);

  const activeVersion = livingVersions[activeLivingIdx];

  const displayTitle = activeVersion?.title ?? post?.title ?? "";
  const displayBody = activeVersion?.body ?? post?.body ?? "";
  const displayImageUrls = useMemo((): string[] => {
    if (activeVersion?.imageUrls?.length) {
      return activeVersion.imageUrls.filter((u: string) => u?.trim());
    }
    if (activeVersion?.imageUrl?.trim()) return [activeVersion.imageUrl];
    if (post?.imageUrls?.length) return post.imageUrls.filter((u: string) => u?.trim());
    if (post?.imageUrl?.trim()) return [post.imageUrl];
    return [];
  }, [activeVersion, post]);

  useEffect(() => {
    const ic = localStorage.getItem("nf-image-carousel");
    setImageCarousel(ic !== "false");
  }, []);

  useEffect(() => {
    const sync = () => setImageCarousel(localStorage.getItem("nf-image-carousel") !== "false");
    window.addEventListener("nf-prefs-changed", sync);
    return () => window.removeEventListener("nf-prefs-changed", sync);
  }, []);

  useEffect(() => {
    setDetailImgIdx(0);
  }, [postId, displayImageUrls.length]);

  const togglePostTranslate = useCallback(async () => {
    if (!post) return;
    if (postTranslated) {
      setPostTranslated(null);
      return;
    }
    setPostTranslating(true);
    try {
      const [tTitle, tBody] = await Promise.all([
        displayTitle ? translateText(displayTitle) : Promise.resolve(""),
        displayBody ? translateText(displayBody) : Promise.resolve(""),
      ]);
      setPostTranslated({
        title: tTitle || undefined,
        body: tBody || undefined,
      });
    } catch {
      /* ignore */
    } finally {
      setPostTranslating(false);
    }
  }, [post, postTranslated, displayTitle, displayBody]);

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

  useEffect(() => {
    const k = localStorage.getItem("nf-ai-key") || "";
    const p = localStorage.getItem("nf-ai-provider") || "chatanywhere";
    const m = parseInt(localStorage.getItem("nf-ai-model") || "0");
    setAiApiKey(k); setAiProvider(p as any); setAiModel(m);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (aiDropRef.current && !aiDropRef.current.contains(e.target as Node)) setAiDropOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const testAiConnection = async () => {
    setAiConnected("testing");
    try { const r = await fetch(`/api/ai?provider=${aiProvider}&apiKey=${aiApiKey || ""}`); const d = await r.json(); setAiConnected(d.ok ? "ok" : "fail"); } catch { setAiConnected("fail"); }
  };
  const saveAiSettings = () => { localStorage.setItem("nf-ai-key", aiApiKey); localStorage.setItem("nf-ai-provider", aiProvider); localStorage.setItem("nf-ai-model", String(aiModel)); if (aiApiKey) testAiConnection(); };

  // Scroll progress
  useEffect(() => {
    const handler = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
      if (e.key === "s" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)) togglePostSave();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  useEffect(() => {
    if (!postId) return;
    const unsub = onSnapshot(doc(db, "posts", postId), (snap) => {
      if (snap.exists() && typeof snap.data()?.views === "number") {
        setViews(snap.data()!.views as number);
      }
    });
    return () => unsub();
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "posts", postId));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as { views?: number; authorUid?: string };
        const currentViews = data?.views ?? 0;
        setViews(currentViews);

        const next = await recordPostView(postId, {
          viewerUid: user?.uid,
          authorUid: data?.authorUid,
          countOwn: true,
        });
        if (!cancelled && next !== null) setViews(next);
      } catch {
        if (!cancelled) setViews((prev) => prev ?? 0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, user?.uid]);


  // Check if post is saved on mount
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "saved", postId)).then(s => setPostSaved(s.exists())).catch(() => {});
  }, [user, postId]);

  const togglePostSave = async () => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "saved", postId);
    if (postSaved) {
      await deleteDoc(ref);
      setPostSaved(false);
      showToast(t("pd.saveRemoved"));
    } else {
      await setDoc(ref, { postId, savedAt: new Date().toISOString() });
      setPostSaved(true);
      showToast(t("pd.postSaved"));
    }
  };
  const [showPostReport, setShowPostReport] = useState(false);

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
    if (!post) return;
    setAiLoading(true);
    setAiResult(null);
    setAiDropOpen(false);
    const uName = user?.displayName || "صديقي";
    const tLang = localStorage.getItem("nf-ai-translate-lang") || "en";
    const langNames: Record<string,string> = { en:"الإنجليزية", ar:"العربية", fr:"الفرنسية", de:"الألمانية", es:"الإسبانية", tr:"التركية", ja:"اليابانية", ko:"الكورية", zh:"الصينية", ru:"الروسية" };
    try {
      const prompts: Record<string, string> = {
        explain: `يا ${uName}، اشرح لي هاي المنشور بشكل مبسط (3-4 أسطر) كأنك بتشرحه لشخص مو فاهمه، احكي باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        summarize: `${uName}، لخص هاي المنشور بسطرين-تلاتة، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        translate: `ترجم هاي المنشور ل${langNames[tLang] || "الإنجليزية"} بشكل طبيعي ومبسط — إذا المنشور أصلاً ب${langNames[tLang]} ترجمه للعربية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        expand: `${uName}، وسع هاي المنشور وضيف تفاصيل أكتر (5-6 أسطر) بنفس الأسلوب، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        correct: `صحح الأخطاء الإملائية والنحوية بهاي المنشور واكتب النسخة المصححة:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        tags: `اقترح 3-5 وسوم (tags) مناسبة لهاد المنشور ككلمات مفتاحية، اكتبها بس مفصولة بفواصل:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 300) || "لا يوجد محتوى"}`,
        rephrase: `${uName}، أعد صياغة هاي المنشور بأسلوب أجمل وأكثر جاذبية، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        question: `اكتب 3 أسئلة ممكنة تنطرح عن هاي المنشور، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        keypoints: `${uName}، استخرج أهم النقاط الرئيسية من هاي المنشور كقائمة مختصرة:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        counter: `${uName}، اكتب رد أو حجة مضادة لهاد المنشور بشكل محترم ومبسط (3-4 أسطر)، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        improve: `${uName}، حسّن هاي المنشور بأسلوب احترافي وجذاب مع الحفاظ على المعنى — أضف تنسيق وتنظيم أفضل، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        issues: `${uName}، اذكر المشاكل أو الأخطاء المحتملة بهاد المنشور (معلومات خاطئة، منطق ضعيف، أخطاء تقنية) بشكل مبسط، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
        morefeatures: `${uName}، أعد كتابة هاي المنشور بنسخة محسّنة وجاهزة للنشر — حسّن الأسلوب والتنسيق والعناوين، أضف أمثلة وتفاصيل، خليه احترافي وجذاب. اكتب النص المحسّن بس بدون شرح، باللهجة الأردنية:\n\nالعنوان: ${post.title}\nالمحتوى: ${(post.body || "").slice(0, 500) || "لا يوجد محتوى"}`,
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

  const setPostVote = async (dir: 1 | -1) => {
    if (!user || !postVoteLoaded || postVotingRef.current) return;
    if (post?.authorUid && post.authorUid === user.uid) return;
    const currentVote = postMyVoteRef.current;
    const transition = getVoteTransition(currentVote as -1 | 0 | 1, dir);
    if (!transition) return;

    postVotingRef.current = true;
    const { next: newVote, diff } = transition;
    const prevVote = currentVote;
    const prevCount = postVoteCountRef.current;
    const nextCount = Math.max(0, prevCount + diff);
    postMyVoteRef.current = newVote;
    postVoteCountRef.current = nextCount;
    setPostMyVote(newVote);
    setPostVoteCount(nextCount);
    try {
      await updateDoc(doc(db, "posts", postId), { votes: increment(diff) });
      // Update author's صيت (karma) — use transaction for atomicity + idempotency
      if (post?.authorUid && diff !== 0) {
        // Get voter's data for trust-based weight
        const voterSnap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
        const voterData = voterSnap?.exists() ? {
          xp: voterSnap.data().xp || 0,
        } : { xp: 0 };
        console.log("[SAIT] PostDetail voterData", { voterUid: user.uid, voterData, authorUid: post.authorUid });
        const isRemoving = newVote === 0;
        if (isRemoving) {
          // Removing vote → read stored saitGain from vote doc to exactly reverse it
          const voteSnap = await getDoc(doc(db, "posts", postId, "votes", user.uid)).catch(() => null);
          const storedGain = voteSnap?.exists() ? (voteSnap.data().saitGain || 0) : 0;
          console.log("[SAIT] PostDetail REMOVE", { postId, voterUid: user.uid, previousVote: currentVote, nextVote: newVote, storedGain, reputationDelta: -storedGain });
          if (storedGain !== 0) {
            await updateDoc(doc(db, "users", post.authorUid), { karma: increment(-storedGain) }).catch((e) => { console.error("[SAIT] PostDetail REMOVE error", e); });
          }
          await deleteDoc(doc(db, "posts", postId, "votes", user.uid));
        } else {
          // Adding new vote → use transaction to prevent double-counting
          const saitGain = calcSaitGain(Math.abs(nextCount), newVote as 1 | -1, voterData);
          console.log("[SAIT] PostDetail ADD", { postId, voterUid: user.uid, previousVote: currentVote, nextVote: newVote, saitGain, contentVotes: postVoteCount + diff });
          try {
            await runTransaction(db, async (transaction) => {
              const voteDocRef = doc(db, "posts", postId, "votes", user.uid);
              const authorRef = doc(db, "users", post.authorUid);
              // ALL reads FIRST (Firestore requirement)
              const voteDoc = await transaction.get(voteDocRef);
              const authorDoc = await transaction.get(authorRef);
              // Idempotency: if vote doc already exists with same dir, skip karma update
              if (voteDoc.exists() && voteDoc.data().dir === newVote) {
                console.log("[SAIT] PostDetail SKIP (vote already exists)", { postId, voterUid: user.uid });
                return;
              }
              // ALL writes AFTER reads
              transaction.set(voteDocRef, { dir: newVote, votedAt: new Date().toISOString(), saitGain });
              if (saitGain !== 0) {
                const currentKarma = authorDoc.exists() ? (authorDoc.data().karma || 0) : 0;
                transaction.set(authorRef, { karma: currentKarma + saitGain }, { merge: true });
              }
            });
            console.log("[SAIT] PostDetail DONE", { postId, voterUid: user.uid, saitGain });
          } catch (txErr) {
            console.error("[SAIT] PostDetail TRANSACTION FAILED", txErr);
          }
          return; // vote doc already saved in transaction
        }
      }
      if (newVote === 0 && !post?.authorUid) {
        await deleteDoc(doc(db, "posts", postId, "votes", user.uid));
      }
    } catch (e) {
      console.error("[PostDetail] Vote error:", e);
      postMyVoteRef.current = prevVote;
      postVoteCountRef.current = prevCount;
      setPostMyVote(prevVote);
      setPostVoteCount(prevCount);
    } finally { postVotingRef.current = false; }
  };

  useEffect(() => {
    async function fetch() {
      try {
        const postSnap = await getDoc(doc(db, "posts", postId));
        if (postSnap.exists()) {
          const data: any = { id: postSnap.id, ...postSnap.data() };
          setPost(data);
          const nextVotes = Math.max(0, data.votes || 0);
          setPostVoteCount(nextVotes);
          postVoteCountRef.current = nextVotes;
          setCommentCount(data.commentCount || 0);
          setViews(data.views ?? 0);
        }
        // Load user's existing vote
        if (user) {
          const voteSnap = await getDoc(doc(db, "posts", postId, "votes", user.uid));
          if (voteSnap.exists()) {
            const dir = normalizeStoredVote(voteSnap.data().dir || 0);
            setPostMyVote(dir);
            postMyVoteRef.current = dir;
          }
          setPostVoteLoaded(true);
        }
        const cSnap = await getDocs(query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc")));
        setComments(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
        // Fetch quoted post if referenced
        const postData = postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } as any : null;
        if (postData?.quotedPostId) {
          try {
            const qSnap = await getDoc(doc(db, "posts", postData.quotedPostId));
            if (qSnap.exists()) setQuotedPost({ id: qSnap.id, ...qSnap.data() });
          } catch {}
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [postId]);

  useEffect(() => {
    setPostTranslated(null);
    setLivingIdx(-1);
  }, [postId]);

  useEffect(() => {
    setPostTranslated(null);
  }, [livingIdx]);

  const refreshComments = async () => {
    const cSnap = await getDocs(query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc")));
    setComments(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
  };

  const submitComment = async (textOverride?: string) => {
    const text = (textOverride ?? commentEditorRef.current?.flush() ?? commentText).trim();
    if (!user || !text) return;
    try {
      console.log("[PostDetail] Submitting comment...", { postId, uid: user.uid, text: text.slice(0, 30) });
      const commentRef = await addDoc(collection(db, "posts", postId, "comments"), {
        text,
        authorName: user.displayName || t("gen.user"),
        authorPhoto: user.photoURL || "",
        authorUid: user.uid,
        parentId: replyTo?.id || "",
        createdAt: new Date().toISOString(),
        votes: 0,
      });
      console.log("[PostDetail] Comment saved with ID:", commentRef.id);
      await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
      setCommentCount((prev) => prev + 1);
      // Update user comment count + XP
      await updateDoc(doc(db, "users", user.uid), { commentCount: increment(1), xp: increment(1) }).catch(() => {});
      console.log("[PostDetail] Comment count updated");
      setCommentText("");
      setReplyTo(null);
      setCommentComposerOpen(false);
      await refreshComments();
      showToast(t("pd.commentSent"));
    } catch (e: any) {
      console.error("[PostDetail] Comment error:", e?.code || e?.message || e);
      const msg = e?.code === "PERMISSION_DENIED" ? "لا توجد صلاحية — انشر قواعد Firestore!" : "فشل حفظ التعليق: " + (e?.message || "خطأ غير معروف");
      showToast(msg);
    }
  };

  const handleCommentUpdated = (commentId: string, text: string) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, text } : c)));
  };

  const handleReply = (parentId: string, authorName: string) => {
    setReplyTo({ id: parentId, name: authorName });
    setCommentText(`@${authorName} `);
    setCommentComposerOpen(true);
  };

  const countCommentTreeNodes = (node: Comment): number =>
    1 + (node.replies?.reduce((acc, child) => acc + countCommentTreeNodes(child), 0) || 0);

  const removeCommentRecursively = (list: Comment[], targetId: string): { next: Comment[]; removed: Comment | null } => {
    let removed: Comment | null = null;
    const next = list
      .map((item) => {
        if (item.id === targetId) {
          removed = item;
          return null;
        }
        if (!item.replies?.length) return item;
        const child = removeCommentRecursively(item.replies, targetId);
        if (child.removed) removed = child.removed;
        return { ...item, replies: child.next };
      })
      .filter(Boolean) as Comment[];
    return { next, removed };
  };

  const handleCommentDelete = async (target: Comment) => {
    const removeResult = removeCommentRecursively(comments, target.id);
    if (!removeResult.removed) return;
    const removedCount = countCommentTreeNodes(removeResult.removed);
    setComments(removeResult.next);
    setCommentCount((prev) => Math.max(0, prev - removedCount));
    await updateDoc(doc(db, "posts", postId), { commentCount: increment(-removedCount) }).catch(() => {});
  };

  if (loading) return <div className="text-center py-8 text-nf-muted text-sm">{t("gen.loading")}</div>;
  if (!post) return <div className="text-center py-8 text-nf-muted">{t("pd.postNotFound")}</div>;

  const isLivingPost = !!(post?.isLiving || livingVersions.length > 0);
  const activePoll = activeVersion?.poll ?? post?.poll;

  const commentMatchesQuery = (c: Comment, q: string) =>
    matchesCommentSearch(c, q, commentContentFilter);

  const countCommentMatches = (list: Comment[], q: string): number => {
    let n = 0;
    const walk = (cs: Comment[]) => {
      for (const c of cs) {
        if (commentMatchesQuery(c, q)) n++;
        if (c.replies?.length) walk(c.replies);
      }
    };
    walk(list);
    return n;
  };

  const searchQuery = commentSearch.trim().toLowerCase();
  const matchCount = searchQuery || commentContentFilter !== "all"
    ? countCommentMatches(comments, searchQuery)
    : 0;

  const tree = (() => {
    let built = buildTree(comments);
    if (searchQuery || commentContentFilter !== "all") {
      const filter = (cs: Comment[]): Comment[] =>
        cs
          .map((c) => ({ ...c, replies: c.replies ? filter(c.replies) : [] }))
          .filter(
            (c) =>
              commentMatchesQuery(c, searchQuery) ||
              (c.replies && c.replies.length > 0)
          );
      built = filter(built);
    }
    return sortNorthfallComments(built, commentSort);
  })();

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[80] bg-transparent">
        <motion.div className="h-full bg-gradient-to-l from-nf-accent to-[#ff6b6b] rounded-l-full" style={{ width: `${scrollProgress}%` }} transition={{ duration: 0.1 }} />
      </div>
      <div className="mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-nf-muted hover:text-nf-text text-sm transition-colors">
          <ArrowRight size={16} /> {t("pd.backToFeed")}
        </button>
      </div>

      {/* Post - flat, no border */}
      <article className="mb-4 relative" onDoubleClick={() => { if (postMyVoteRef.current !== 1) setPostVote(1); }}>
        <div className="px-3 sm:px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] mb-1.5 flex-wrap">
            <div className="w-5 h-5 rounded-full bg-nf-secondary overflow-hidden shrink-0">
              {post.authorPhoto ? (
                <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-nf-muted font-bold">n/</div>
              )}
            </div>
            <HoverCard type="community" name={post.community || t("gen.general")} onCommunityClick={onCommunityClick}><span className="font-semibold text-nf-accent cursor-pointer">n/{post.community || t("gen.general")}</span></HoverCard>
            <span className="text-nf-dim">·</span>
            <HoverCard type="user" name={post.authorName || t("gen.user")} uid={post.authorUid} onProfileClick={onProfileClick}><span className="text-nf-muted cursor-pointer hover:text-nf-text transition-colors inline-flex items-center gap-1">u/{post.authorName || t("gen.user")}{(post.authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[13px] h-[13px] inline" />}</span></HoverCard>
            <span className="text-nf-dim">·</span>
            <span className="text-nf-muted">{timeAgoShort(post.createdAt)}</span>
            {post.flair && (
              <>
                <span className="text-nf-dim">·</span>
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                  style={flairBadgeStyle(post.flair, post.flairBg, post.flairTextColor)}
                >
                  {post.flair}
                </span>
              </>
            )}
            <span className="text-nf-dim">·</span>
            <span className="inline-flex items-center gap-1 text-nf-muted shrink-0">
              <Eye size={11} className="opacity-70" />
              {views ?? post.views ?? 0} {t("pd.views")}
            </span>
            {isLivingPost && (
              <>
                <span className="text-nf-dim">·</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 flex items-center gap-0.5">
                  <GitCommitHorizontal size={9} /> منشور حي
                  {livingVersions.length > 0 && <span className="text-emerald-400/70">v{activeVersion?.version ?? post.currentVersion ?? 1}</span>}
                </span>
              </>
            )}
          </div>

          {isLivingPost && livingVersions.length > 0 && (
            <div className="mb-3">
              <LivingPostVersions
                versions={livingVersions}
                currentVersion={activeVersion?.version ?? post.currentVersion ?? 1}
                onVersionChange={(idx) => setLivingIdx(idx)}
                postId={postId}
                canManageVersions={!!(user && post?.authorUid === user.uid)}
                onVersionsUpdated={(next) => {
                  const latest = next[next.length - 1];
                  setPost((p: any) => ({
                    ...p,
                    versions: next,
                    currentVersion: latest?.version ?? p?.currentVersion,
                    title: latest?.title ?? p?.title,
                    body: latest?.body ?? p?.body,
                    imageUrl: latest?.imageUrl ?? p?.imageUrl,
                    imageUrls: latest?.imageUrls ?? p?.imageUrls,
                  }));
                }}
                onUpgradeClick={user && post?.authorUid === user.uid && onUpgradeClick ? () => onUpgradeClick(postId) : undefined}
              />
            </div>
          )}

          <h2 className="text-[16px] sm:text-[18px] font-bold text-nf-text leading-snug mb-2">
            {postTranslated?.title ?? displayTitle}
          </h2>
          {(displayBody || postTranslated?.body) && (
            <div className="relative group/body">
              <PostBodyContent
                text={postTranslated?.body ?? displayBody}
                className={cn("text-nf-text-2", postTranslated?.body && "opacity-90")}
                onHashtagClick={onHashtagClick}
                onProfileClick={onProfileClick}
              />
              <div className="mt-2 flex items-center gap-1 text-[11px] flex-wrap">
                <button
                  type="button"
                  onClick={togglePostTranslate}
                  disabled={postTranslating}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors disabled:opacity-40"
                >
                  {postTranslating ? (
                    <span className="w-3 h-3 border border-nf-dim border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Languages size={11} />
                  )}
                  <span>{postTranslated ? "إلغاء" : "ترجمة"}</span>
                </button>
                {!postTranslated && <TranslateLangPicker />}
              </div>
            </div>
          )}
          {!displayBody && !postTranslated?.body && displayTitle && (
            <div className="mt-2 flex items-center gap-1 text-[11px] flex-wrap">
              <button
                type="button"
                onClick={togglePostTranslate}
                disabled={postTranslating}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors disabled:opacity-40"
              >
                {postTranslating ? (
                  <span className="w-3 h-3 border border-nf-dim border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Languages size={11} />
                )}
                <span>{postTranslated ? "إلغاء" : "ترجمة"}</span>
              </button>
              {!postTranslated && <TranslateLangPicker />}
            </div>
          )}
          {/* Poll */}
          {activePoll && activePoll.options?.length >= 2 && (() => {
            const pollVotes = activePoll.votes || activePoll.options.map(() => 0);
            const total = pollVotes.reduce((a: number, b: number) => a + b, 0);
            return (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-nf-text mb-1">
                  <BarChart3 size={14} className="text-nf-accent" />
                  <span>استطلاع</span>
                </div>
                {activePoll.options.map((opt: string, idx: number) => {
                  const pct = total > 0 ? Math.round(((pollVotes[idx] || 0) / total) * 100) : 0;
                  return (
                    <div key={idx} className="w-full relative flex items-center gap-3 px-4 py-2.5 rounded-lg border border-nf-border-2 text-right overflow-hidden">
                      <div className="absolute top-0 right-0 h-full bg-nf-accent/15 transition-all duration-500" style={{ width: `${pct}%` }} />
                      <div className="w-4 h-4 rounded-full border-2 border-nf-border shrink-0 relative z-10" />
                      <span className="text-[13px] text-nf-text relative z-10 flex-1">{opt}</span>
                      <span className={cn("text-[13px] font-bold relative z-10 tabular-nums", pct > 0 ? "text-nf-accent" : "text-nf-dim")}>{pct}%</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 text-[11px] text-nf-dim mt-1">
                  <span>{total} صوت</span>
                  <span>·</span>
                  <span>{activePoll.duration === "24h" ? "ينتهي خلال يوم" : activePoll.duration === "3d" ? "ينتهي خلال 3 أيام" : "ينتهي خلال أسبوع"}</span>
                </div>
              </div>
            );
          })()}
          {/* Multiple images */}
          {(() => {
            const urls = displayImageUrls;
            const isBlurred = (post.isNsfw || post.isSpoiler) && !detailBlurRevealed;
            if (!urls.length) return null;

            const renderImage = (url: string, i: number) => (
              <div key={url + i} className="relative mt-3 rounded-lg overflow-hidden nf-feed-media">
                {isBlurred ? (
                  <div className="relative">
                    <FeedMediaFrame src={url} alt="" imgClassName="nf-feed-media-img blur-2xl scale-105" />
                    <div onClick={() => setDetailBlurRevealed(true)} className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors z-10">
                      <span className="text-white text-[13px] font-bold mb-1">{post.isNsfw ? "محتوى حساس" : "Spoiler - اضغط للعرض"}</span>
                      <span className="text-white/60 text-[11px]">اضغط لكشف الصورة</span>
                    </div>
                  </div>
                ) : (
                  <FeedMediaFrame
                    src={url}
                    alt=""
                    imgClassName="nf-feed-media-img"
                    onImageClick={() => setLightboxImg({ src: url, urls, idx: i })}
                  />
                )}
              </div>
            );

            if (imageCarousel && urls.length > 1) {
              const idx = Math.min(detailImgIdx, urls.length - 1);
              const url = urls[idx];
              return (
                <div className="relative mt-3 rounded-lg overflow-hidden nf-feed-media">
                  {isBlurred ? (
                    <div className="relative">
                      <FeedMediaFrame src={url} alt="" imgClassName="nf-feed-media-img blur-2xl scale-105" />
                      <div onClick={() => setDetailBlurRevealed(true)} className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 cursor-pointer z-10">
                        <span className="text-white text-[13px] font-bold mb-1">{post.isNsfw ? "محتوى حساس" : "Spoiler"}</span>
                      </div>
                    </div>
                  ) : (
                    <FeedMediaFrame
                      src={url}
                      alt=""
                      imgClassName="nf-feed-media-img"
                      onImageClick={() => setLightboxImg({ src: url, urls, idx })}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailImgIdx((idx - 1 + urls.length) % urls.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailImgIdx((idx + 1) % urls.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {urls.map((_: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDetailImgIdx(i)}
                        className={cn("rounded-full transition-all", i === idx ? "w-3 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40")}
                      />
                    ))}
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-white z-10">
                    {idx + 1}/{urls.length}
                  </span>
                </div>
              );
            }

            return urls.map((url, i) => renderImage(url, i));
          })()}

          {/* Quoted Post - Mini Post Card (under my content, darker bg) */}
          {quotedPost && (
            <div
              className="mt-4 rounded-lg border border-nf-border-2/40 bg-[#16161a] overflow-hidden hover:border-nf-border-2/70 transition-all duration-150"
            >
              <div
                onClick={() => onBack()}
                className="px-4 pt-3 pb-2 cursor-pointer hover:bg-[#1c1c22] transition-all duration-150"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] mb-1.5 flex-wrap">
                  <div className="w-5 h-5 rounded-full bg-nf-secondary overflow-hidden shrink-0">
                    {quotedPost.authorPhoto ? (
                      <img src={quotedPost.authorPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-nf-muted font-bold">{(quotedPost.authorName || "U")[0]}</div>
                    )}
                  </div>
                  <span className="font-semibold text-nf-accent cursor-pointer">n/{quotedPost.community || "عام"}</span>
                  <span className="text-nf-dim">·</span>
                  <span className="text-nf-muted cursor-pointer hover:text-nf-text transition-colors">u/{quotedPost.authorName || "User"}</span>
                  <span className="text-nf-dim">·</span>
                  <span className="text-nf-muted">{timeAgoShort(quotedPost.createdAt)}</span>
                </div>
                {quotedPost.title && <h2 className="text-[16px] sm:text-[18px] font-bold text-nf-text-2 leading-snug mb-2">{quotedPost.title}</h2>}
                {quotedPost.body && <div className="text-sm text-nf-text-2/80 leading-relaxed">{quotedPost.body}</div>}
                {quotedPost.imageUrl && <div className="mt-3 rounded-lg overflow-hidden"><img src={quotedPost.imageUrl} alt="" className="w-full max-h-[400px] sm:max-h-[600px] object-cover rounded-lg" /></div>}
              </div>
              {/* Quote actions */}
              <div className="flex items-center gap-1 px-3 py-1.5 border-t border-nf-border-2/30 text-nf-dim">
                <button onClick={() => onQuoteClick?.(quotedPost.id)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] hover:bg-nf-hover hover:text-nf-text transition-colors"><Quote size={10} />اقتباس</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-nf-muted flex-wrap">
          <VotePill
            count={postVoteCount}
            myVote={postMyVote as -1 | 0 | 1}
            onUp={() => setPostVote(1)}
            onDown={() => setPostVote(-1)}
          />
          <div className="relative" onMouseLeave={() => setShowShareMenu(false)}>
            <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-nf-hover text-xs transition-colors"><Share2 size={14} /> {t("pc.share")}</button>
            <AnimatePresence>
              {showShareMenu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border rounded-lg p-1.5 shadow-xl z-30 flex flex-col gap-0.5 min-w-[180px]">
                  <button onClick={() => { const text = `${post.title}${post.body ? '\n' + post.body.slice(0, 200) : ''}\n${(post.imageUrls?.[0] || post.imageUrl || '')}\n${window.location.href}`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`); setShowShareMenu(false); showToast(t("pd.openedWhatsapp")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-[#25D366] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366] shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.327 0-4.542-.681-6.435-1.966l-.246-.166-3.044 1.02 1.02-3.044-.166-.246A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    WhatsApp
                  </button>
                  <button onClick={() => { const text = `${post.title}${post.body ? '\n' + post.body.slice(0, 200) : ''}`; window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`); setShowShareMenu(false); showToast(t("pd.openedTelegram")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-[#0088cc] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0088cc] shrink-0"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    Telegram
                  </button>
                  <button onClick={() => { const text = `${post.title}\n${window.location.href}`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`); setShowShareMenu(false); showToast(t("pd.openedX")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-nf-text transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X / Twitter
                  </button>
                  <div className="h-px bg-nf-border-2 my-0.5" />
                  <button onClick={() => { const text = `${post.title}${post.body ? '\n' + post.body.slice(0, 300) : ''}\n\n${window.location.href}`; navigator.clipboard?.writeText(text); setShowShareMenu(false); showToast(t("pd.contentCopied")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-nf-accent transition-colors">
                    <Link2 size={14} className="text-nf-accent shrink-0" />
                    {t("pd.copyContent")}
                  </button>
                  <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowShareMenu(false); showToast(t("pd.linkCopied")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-nf-text transition-colors">
                    <Share2 size={14} className="shrink-0" />
                    {t("pd.copyLink")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={togglePostSave} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors", postSaved ? "text-nf-accent" : "hover:bg-nf-hover")}><Bookmark size={14} /> {postSaved ? "محفوظ" : "حفظ"}</button>
          <button onClick={() => onQuoteClick?.(postId)} className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-nf-hover text-xs transition-colors"><Quote size={14} /> اقتباس</button>
          <div ref={aiDropRef}>
          <NorthFallAiButton
            open={aiDropOpen}
            onToggle={() => setAiDropOpen(!aiDropOpen)}
            loading={aiLoading}
            menuItems={[
              { label: "لخص المنشور", onClick: () => handleAiExplain("summarize"), disabled: aiLoading },
              { label: "اشرح لي", onClick: () => handleAiExplain("explain"), disabled: aiLoading },
            ]}
          />
          </div>
          <OverflowMenu
            items={
              user && post?.authorUid === user.uid
                ? [
                    { label: "تعديل", icon: <Pencil size={12} />, onClick: () => onEditClick?.(postId) },
                    { label: "حذف", icon: <Trash2 size={12} />, onClick: async () => { await deleteDoc(doc(db, "posts", postId)); onBack(); }, danger: true },
                    { label: "Embed", icon: <Code2 size={12} />, onClick: () => { navigator.clipboard?.writeText(buildNorthfallEmbedCode(postId, window.location.origin)); showToast(t("pd.embedCopied")); } },
                  ]
                : [
                    { label: "بلّغ", icon: <Flag size={12} />, onClick: () => setShowPostReport(true) },
                    { label: t("pd.copyLink"), icon: <Link2 size={12} />, onClick: () => { navigator.clipboard?.writeText(window.location.href); showToast(t("pd.linkCopied")); } },
                    { label: "Embed", icon: <Code2 size={12} />, onClick: () => { navigator.clipboard?.writeText(buildNorthfallEmbedCode(postId, window.location.origin)); showToast(t("pd.embedCopied")); } },
                  ]
            }
          />
        </div>
        <ReportModal open={showPostReport} onClose={() => setShowPostReport(false)} type="post" targetId={postId} />
      </article>

      {/* AI Result with typing animation */}
      {(aiResult || aiLoading) && (
        <div className="mx-3 my-2 p-3 rounded-xl border border-nf-border-2/50 bg-nf-secondary/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] text-nf-dim font-semibold">{aiLoading ? "جاري التلخيص..." : "ملخص"}</span>
            {aiResult && !aiLoading && <button onClick={() => { setAiResult(null); setAiDisplayText(""); }} className="mr-auto text-nf-dim hover:text-nf-text transition-colors"><X size={11} /></button>}
          </div>
          {aiLoading && !aiResult && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-3 bg-nf-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
          {aiDisplayText && <p className="text-[12px] text-nf-muted leading-relaxed">{aiDisplayText}<span className="inline-block w-[2px] h-[12px] bg-nf-accent/60 ml-0.5 animate-pulse" /></p>}
        </div>
      )}

      {/* Comment Input */}
      {user ? (
        <div className="mt-3 mb-4">
          {!commentComposerOpen && !commentText.trim() && !replyTo ? (
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-nf-secondary/40 flex items-center justify-center text-[10px] text-nf-muted font-bold shrink-0">
                  {(user.displayName || t("gen.user"))[0]}
                </div>
              )}
              <button
                type="button"
                onClick={() => setCommentComposerOpen(true)}
                className="flex-1 text-right px-4 py-2 rounded-full border border-nf-border-2 bg-transparent text-sm text-nf-dim hover:border-nf-border-2/80 transition-colors"
              >
                {t("pd.writeComment")}...
              </button>
            </div>
          ) : (
            <RichContentEditor
              ref={commentEditorRef}
              value={commentText}
              onChange={setCommentText}
              placeholder={replyTo ? `${t("pd.writeReply")} ${replyTo.name}...` : `${t("pd.writeComment")}... (${t("pd.ctrlEnter")})`}
              variant="comment"
              minHeight={72}
              submitLabel={t("pd.commentBtn")}
              onSubmit={(md) => submitComment(md)}
              user={user ? { displayName: user.displayName ?? undefined, photoURL: user.photoURL ?? undefined } : null}
              replyToName={replyTo?.name}
              onClearReply={() => { setReplyTo(null); setCommentText(""); setCommentComposerOpen(false); }}
              noSpecs
              autoFocus
              expandChromeOnInput
              onDismiss={() => {
                if (!commentText.trim() && !replyTo) setCommentComposerOpen(false);
              }}
              className="nf-comment-editor rounded-2xl border border-nf-border-2/50 overflow-hidden bg-nf-body"
            />
          )}
        </div>
      ) : (
        <div className="text-center py-3 text-nf-muted text-sm border border-nf-border-2 rounded-lg mb-4">
          {t("pd.loginToComment")}
        </div>
      )}

      {/* Comments toolbar */}
      <div className="mb-3 pt-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <CommentToolbarSelect
            label="ترتيب"
            value={commentSort}
            options={NORTHFALL_COMMENT_SORT.map((opt) => ({
              id: opt.id,
              label: t(opt.labelKey) || opt.fallback,
            }))}
            onChange={setCommentSort}
          />
          <CommentToolbarSelect
            label="فلتر"
            value={commentContentFilter}
            options={COMMENT_CONTENT_FILTERS.map((opt) => ({
              id: opt.id,
              label: t(opt.labelKey) || opt.fallback,
            }))}
            onChange={setCommentContentFilter}
          />

          <div
            className={cn(
              "relative flex-1 flex items-center h-9 rounded-full border border-nf-border-2/60 bg-transparent transition-all min-w-[180px] hover:border-nf-border-2",
              (commentSearchOpen || commentSearch) && "border-nf-border-2"
            )}
          >
            <input
              ref={commentSearchRef}
              type="search"
              value={commentSearch}
              onChange={(e) => setCommentSearch(e.target.value)}
              onFocus={() => setCommentSearchOpen(true)}
              placeholder={t("pd.searchComments")}
              className="w-full h-full bg-transparent rounded-full py-0 px-3 text-[12px] text-nf-text placeholder:text-nf-dim outline-none"
            />
            {commentSearch ? (
              <button
                type="button"
                onClick={() => setCommentSearch("")}
                className="absolute left-2 text-[11px] text-nf-dim hover:text-nf-text px-1.5 py-0.5 rounded"
                aria-label="مسح"
              >
                ✕
              </button>
            ) : null}
          </div>
          {(commentSearchOpen || commentSearch) && (
            <button
              type="button"
              onClick={() => {
                setCommentSearch("");
                setCommentSearchOpen(false);
                commentSearchRef.current?.blur();
              }}
              className="shrink-0 text-[12px] font-semibold text-nf-text hover:text-nf-accent px-1 transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>

        {(searchQuery || commentContentFilter !== "all") && matchCount > 0 && (
          <p className="text-[11px] text-nf-dim px-0.5">
            {matchCount} {matchCount === 1 ? "نتيجة" : "نتائج"}
          </p>
        )}

        {(searchQuery || commentContentFilter !== "all") && matchCount === 0 ? (
          <p className="text-[11px] text-nf-dim px-0.5">لا توجد تعليقات تطابق بحثك.</p>
        ) : null}
      </div>

      {/* Comments Tree */}
      <div className="pt-1">
        {tree.length === 0 ? (
          <div className="text-center py-6 text-nf-muted text-sm">
            {searchQuery || commentContentFilter !== "all" ? "لا نتائج لهذا البحث." : t("pd.noCommentsYet")}
          </div>
        ) : (
          tree.map((c) => (
            <CommentNode key={c.id} comment={c} onReply={handleReply} onProfileClick={onProfileClick} onHashtagClick={onHashtagClick} onCommentUpdated={handleCommentUpdated} postId={postId} onDelete={handleCommentDelete} showToast={showToast} />
          ))
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg bg-nf-accent text-white text-sm font-medium shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.urls?.[lightboxImg.idx] ?? lightboxImg.src}
          alt={post?.title || ""}
          onClose={() => setLightboxImg(null)}
          allImages={lightboxImg.urls}
          currentIndex={lightboxImg.idx}
          onNavigate={(idx) => setLightboxImg({ ...lightboxImg, idx })}
        />
      )}

    </motion.div>
  );
}

function timeAgoShort(ts?: string): string {
  if (!ts) return "now";
  try {
    const d = new Date(ts);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  } catch { return "now"; }
}
