"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUp, ArrowDown, Share2, Bookmark, MessageSquare, ChevronDown, ChevronUp, Flag, Code2, Trash2, Pencil, ExternalLink, ArrowUpCircle, Link2, BarChart3, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc, getDocs, collection, query, orderBy, addDoc, updateDoc, increment, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";
import ReportModal from "./ReportModal";
import HoverCard from "./HoverCard";
import { renderFormattedBody } from "./PostFormatter";

interface PostDetailProps {
  postId: string;
  onBack: () => void;
  onCommunityClick?: (name: string) => void;
  onProfileClick?: (uid: string) => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
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

function CommentNode({ comment, depth = 0, onReply, onProfileClick, onDelete, postId: commentPostId, showToast, forceCollapse }: { comment: Comment; depth?: number; onReply: (parentId: string, authorName: string) => void; onProfileClick?: (uid: string) => void; onDelete?: (commentId: string) => void; postId?: string; showToast?: (msg: string) => void; forceCollapse?: boolean }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const effectiveCollapsed = forceCollapse ?? collapsed;
  const [voteCount, setVoteCount] = useState(comment.votes || 0);
  const [myVote, setMyVote] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwn = user?.uid === comment.authorUid;
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Load user's existing vote on this comment
  useEffect(() => {
    if (!user || !commentPostId) return;
    getDoc(doc(db, "posts", commentPostId, "comments", comment.id, "votes", user.uid)).then(s => {
      if (s.exists()) {
        setMyVote(s.data().dir || 0);
        // Don't add vote to count - Firestore votes already includes it
      }
    }).catch(() => {});
  }, [user, commentPostId, comment.id]);

  const handleVote = async (dir: 1 | -1) => {
    if (!user) return;
    const newVote = myVote === dir ? 0 : dir;
    const diff = newVote - myVote;
    setMyVote(newVote);
    setVoteCount(voteCount + diff);
    try {
      await updateDoc(doc(db, "posts", commentPostId || "", "comments", comment.id), { votes: increment(diff) });
      if (newVote === 0) {
        await deleteDoc(doc(db, "posts", commentPostId || "", "comments", comment.id, "votes", user.uid));
      } else {
        await setDoc(doc(db, "posts", commentPostId || "", "comments", comment.id, "votes", user.uid), { dir: newVote, votedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error("[CommentNode] Vote error:", e);
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
        <>
          {/* Vertical line - starts from top and goes to the bottom, but the first one in a thread starts lower */}
          <div className="absolute right-3 top-0 bottom-0 w-[1.5px] bg-white/20" />
          
          {/* The elbow curve - connects the vertical line to the avatar area */}
          <div className="absolute right-3 top-0 w-4 h-[18px] border-b-[1.5px] border-r-[1.5px] border-white/20 rounded-br-xl" />
          
          {/* click area to collapse/expand */}
          <div
            className="absolute right-0 top-0 bottom-0 w-8 cursor-pointer z-10"
            onClick={() => setCollapsed(!collapsed)}
          />
        </>
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
              <span className="font-bold text-white hover:text-blue-400 transition-colors">u/{comment.authorName || t("gen.user")}</span>
            </div>
          </HoverCard>
          <span className="text-nf-dim">·</span>
          <span className="text-nf-muted" title={comment.createdAt ? new Date(comment.createdAt).toLocaleString('ar') : ''}>{timeAgoShort(comment.createdAt)}</span>
          {hasReplies && (
            <button onClick={() => setCollapsed(!effectiveCollapsed)} className="text-nf-dim hover:text-white transition-colors mr-1">
              {effectiveCollapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
            </button>
          )}
        </div>

        {!effectiveCollapsed && (
          <>
            {/* Text - with @mention highlighting */}
            {editing ? (
              <div className="mb-1.5">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/20 resize-none" />
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={async () => { try { await updateDoc(doc(db, "posts", comment.postId || commentPostId || "", "comments", comment.id), { text: editText }); setEditing(false); } catch (e) { console.error(e); } }} className="px-3 py-1 rounded-lg bg-nf-accent text-white text-xs font-bold hover:opacity-90">{t("pd.save")}</button>
                  <button onClick={() => { setEditing(false); setEditText(comment.text); }} className="px-3 py-1 rounded-lg bg-nf-secondary text-nf-muted text-xs hover:text-white">{t("pd.cancel")}</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-nf-text-2 leading-relaxed mb-1.5">
                {renderFormattedBody(comment.text)}
              </div>
            )}

            {/* Delete Confirm */}
            {showDeleteConfirm && (
              <div className="mb-1.5 p-2 bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg">
                <p className="text-xs text-[#ff8888] mb-1.5">{t("pd.deleteConfirm")}</p>
                <div className="flex items-center gap-2">
                  <button onClick={async () => { try { await deleteDoc(doc(db, "posts", comment.postId || commentPostId || "", "comments", comment.id)); onDelete?.(comment.id); } catch (e) { console.error(e); } setShowDeleteConfirm(false); }} className="px-3 py-1 rounded-lg bg-[#ff4444] text-white text-xs font-bold">{t("pd.delete")}</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 rounded-lg bg-nf-secondary text-nf-muted text-xs hover:text-white">{t("pd.cancel")}</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              <div className="flex items-center gap-0.5 bg-nf-secondary rounded-full px-1 py-0.5">
                <button onClick={() => handleVote(1)} className={cn("p-0.5 rounded transition-colors duration-150", myVote === 1 ? "text-orange-500" : "text-nf-dim hover:text-nf-muted")}><ArrowUp size={12} /></button>
                <span className={cn("font-bold min-w-[14px] text-center text-[11px]", myVote === 1 ? "text-orange-500" : myVote === -1 ? "text-blue-400" : voteCount > 0 ? "text-orange-500" : voteCount < 0 ? "text-blue-400" : "text-nf-dim")}>{voteCount}</span>
                <button onClick={() => handleVote(-1)} className={cn("p-0.5 rounded transition-colors duration-150", myVote === -1 ? "text-blue-400" : "text-nf-dim hover:text-nf-muted")}><ArrowDown size={12} /></button>
              </div>
              <button onClick={() => onReply(comment.id, comment.authorName || t("gen.user"))} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                <MessageSquare size={11} /><span>{t("pd.reply")}</span>
              </button>
              <button onClick={() => { navigator.clipboard?.writeText(comment.text); showToast?.(t("pd.textCopied")); }} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                <Share2 size={11} /><span>{t("pd.copy")}</span>
              </button>
              <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/app?view=post&postId=${commentPostId || comment.postId}`); showToast?.(t("pd.linkCopied")); }} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                <Link2 size={11} /><span>{t("pd.link")}</span>
              </button>
              <button onClick={() => setSaved(!saved)} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors", saved ? "text-nf-accent" : "text-nf-muted hover:bg-nf-hover hover:text-white")}>
                <Bookmark size={11} /><span>{saved ? t("pd.saved") : t("pd.saveBtn")}</span>
              </button>
              {isOwn && (
                <>
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                    <Pencil size={11} /><span>{t("pd.edit")}</span>
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                    <Trash2 size={11} /><span>{t("pd.delete")}</span>
                  </button>
                </>
              )}
              <button onClick={() => setShowReport(true)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
                <Flag size={11} /><span>{t("pd.report")}</span>
              </button>
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
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} onProfileClick={onProfileClick} onDelete={onDelete} postId={commentPostId} showToast={showToast} forceCollapse={forceCollapse} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PostDetail({ postId, onBack, onCommunityClick, onProfileClick, onEditClick, onDeleteClick }: PostDetailProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [postVoteCount, setPostVoteCount] = useState(0);
  const [postMyVote, setPostMyVote] = useState(0);
  const [postSaved, setPostSaved] = useState(false);
  const [commentSort, setCommentSort] = useState<"best" | "new">("best");
  const [toast, setToast] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [detailBlurRevealed, setDetailBlurRevealed] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [commentSearch, setCommentSearch] = useState("");
  const [views, setViews] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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

  // Increment view count
  useEffect(() => {
    if (!postId) return;
    const viewed = sessionStorage.getItem(`viewed-${postId}`);
    if (!viewed) {
      updateDoc(doc(db, "posts", postId), { views: increment(1) }).catch(() => {});
      sessionStorage.setItem(`viewed-${postId}`, "1");
    }
    getDoc(doc(db, "posts", postId)).then(s => { if (s.exists()) setViews(s.data()?.views || 0); }).catch(() => {});
  }, [postId]);

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

  const setPostVote = async (dir: 1 | -1) => {
    if (!user) return;
    const newVote = postMyVote === dir ? 0 : dir;
    const diff = newVote - postMyVote;
    setPostMyVote(newVote);
    setPostVoteCount(postVoteCount + diff);
    try {
      await updateDoc(doc(db, "posts", postId), { votes: increment(diff) });
      if (newVote === 0) {
        await deleteDoc(doc(db, "posts", postId, "votes", user.uid));
      } else {
        await setDoc(doc(db, "posts", postId, "votes", user.uid), { dir: newVote, votedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error("[PostDetail] Vote error:", e);
    }
  };

  useEffect(() => {
    async function fetch() {
      try {
        const postSnap = await getDoc(doc(db, "posts", postId));
        if (postSnap.exists()) {
          const data: any = { id: postSnap.id, ...postSnap.data() };
          setPost(data);
          setPostVoteCount(data.votes || 0);
        }
        // Load user's existing vote
        if (user) {
          const voteSnap = await getDoc(doc(db, "posts", postId, "votes", user.uid));
          if (voteSnap.exists()) {
            setPostMyVote(voteSnap.data().dir || 0);
            // Don't add vote to count - Firestore votes already includes it
          }
        }
        const cSnap = await getDocs(query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc")));
        setComments(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [postId]);

  const refreshComments = async () => {
    const cSnap = await getDocs(query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc")));
    setComments(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
  };

  const submitComment = async () => {
    if (!user || !commentText.trim()) return;
    try {
      console.log("[PostDetail] Submitting comment...", { postId, uid: user.uid, text: commentText.trim().slice(0, 30) });
      const commentRef = await addDoc(collection(db, "posts", postId, "comments"), {
        text: commentText.trim(),
        authorName: user.displayName || t("gen.user"),
        authorPhoto: user.photoURL || "",
        authorUid: user.uid,
        parentId: replyTo?.id || "",
        createdAt: new Date().toISOString(),
        votes: 0,
      });
      console.log("[PostDetail] Comment saved with ID:", commentRef.id);
      await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
      console.log("[PostDetail] Comment count updated");
      setCommentText("");
      setReplyTo(null);
      await refreshComments();
      showToast(t("pd.commentSent"));
    } catch (e: any) {
      console.error("[PostDetail] Comment error:", e?.code || e?.message || e);
      const msg = e?.code === "PERMISSION_DENIED" ? "لا توجد صلاحية — انشر قواعد Firestore!" : "فشل حفظ التعليق: " + (e?.message || "خطأ غير معروف");
      showToast(msg);
    }
  };

  const handleReply = (parentId: string, authorName: string) => {
    setReplyTo({ id: parentId, name: authorName });
    setCommentText(`@${authorName} `);
  };

  if (loading) return <div className="text-center py-8 text-nf-muted text-sm">{t("gen.loading")}</div>;
  if (!post) return <div className="text-center py-8 text-nf-muted">{t("pd.postNotFound")}</div>;

  const readingTime = Math.max(1, Math.ceil(((post?.body || "").split(/\s+/).length) / 200));

  const tree = (() => {
    let built = buildTree(comments);
    if (commentSearch.trim()) {
      const q = commentSearch.trim().toLowerCase();
      const filter = (cs: Comment[]): Comment[] => cs.map(c => ({ ...c, replies: c.replies ? filter(c.replies) : [] })).filter(c => c.text.toLowerCase().includes(q) || (c.replies && c.replies.length > 0));
      built = filter(built);
    }
    if (commentSort === "new") return built.reverse();
    return built.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0));
  })();

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[80] bg-transparent">
        <motion.div className="h-full bg-gradient-to-l from-nf-accent to-[#ff6b6b] rounded-l-full" style={{ width: `${scrollProgress}%` }} transition={{ duration: 0.1 }} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-nf-muted hover:text-white text-sm transition-colors">
          <ArrowRight size={16} /> {t("pd.backToFeed")}
        </button>
        <button onClick={() => setShowShortcuts(!showShortcuts)} className="text-nf-dim hover:text-white text-xs transition-colors">⌨ {t("pd.shortcuts")}</button>
      </div>
      {showShortcuts && (
        <div className="mb-4 bg-nf-secondary rounded-lg p-3 text-xs text-nf-muted grid grid-cols-2 gap-1.5">
          <span><kbd className="bg-nf-primary px-1.5 py-0.5 rounded text-white">Esc</kbd> {t("pd.back")}</span>
          <span><kbd className="bg-nf-primary px-1.5 py-0.5 rounded text-white">S</kbd> {t("pd.saveBtn")}</span>
          <span><kbd className="bg-nf-primary px-1.5 py-0.5 rounded text-white">Ctrl+Enter</kbd> {t("pd.sendComment")}</span>
          <span><kbd className="bg-nf-primary px-1.5 py-0.5 rounded text-white">Double-click</kbd> {t("pd.vote")}</span>
        </div>
      )}

      {/* Post - flat, no border */}
      <article className="mb-4 relative" onDoubleClick={() => { if (postMyVote !== 1) setPostVote(1); }}>
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
            <HoverCard type="user" name={post.authorName || t("gen.user")} uid={post.authorUid} onProfileClick={onProfileClick}><span className="text-nf-muted cursor-pointer hover:text-white transition-colors">u/{post.authorName || t("gen.user")}</span></HoverCard>
            <span className="text-nf-dim">·</span>
            <span className="text-nf-muted">{timeAgoShort(post.createdAt)}</span>
            {post.flair && <><span className="text-nf-dim">·</span><span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-nf-accent/20 text-nf-accent">{post.flair}</span></>}
            <span className="text-nf-dim">·</span>
            <span className="text-nf-muted">{views || post.views || 0} {t("pd.views")}</span>
          </div>
          <h2 className="text-[16px] sm:text-[18px] font-bold text-white leading-snug mb-2">{post.title}</h2>
          {post.body && (
            <div className="text-sm text-nf-text-2 leading-relaxed relative group/body">
              {renderFormattedBody(post.body)}
              <div className="mt-4 pt-3 border-t border-nf-border-2/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-nf-dim bg-nf-secondary/40 px-2 py-1 rounded-md flex items-center gap-1.5">
                    <Clock width={10} height={10} className="text-nf-accent" />
                    {readingTime} {t("pd.minRead")}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Poll */}
          {post.poll && post.poll.options?.length >= 2 && (() => {
            const pollVotes = post.poll.votes || post.poll.options.map(() => 0);
            const total = pollVotes.reduce((a: number, b: number) => a + b, 0);
            return (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-white mb-1">
                  <BarChart3 size={14} className="text-nf-accent" />
                  <span>استطلاع</span>
                </div>
                {post.poll.options.map((opt: string, idx: number) => {
                  const pct = total > 0 ? Math.round(((pollVotes[idx] || 0) / total) * 100) : 0;
                  return (
                    <div key={idx} className="w-full relative flex items-center gap-3 px-4 py-2.5 rounded-lg border border-nf-border-2 text-right overflow-hidden">
                      <div className="absolute top-0 right-0 h-full bg-nf-accent/15 transition-all duration-500" style={{ width: `${pct}%` }} />
                      <div className="w-4 h-4 rounded-full border-2 border-nf-border shrink-0 relative z-10" />
                      <span className="text-[13px] text-white relative z-10 flex-1">{opt}</span>
                      <span className={cn("text-[13px] font-bold relative z-10 tabular-nums", pct > 0 ? "text-nf-accent" : "text-nf-dim")}>{pct}%</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 text-[11px] text-nf-dim mt-1">
                  <span>{total} صوت</span>
                  <span>·</span>
                  <span>{post.poll.duration === "24h" ? "ينتهي خلال يوم" : post.poll.duration === "3d" ? "ينتهي خلال 3 أيام" : "ينتهي خلال أسبوع"}</span>
                </div>
              </div>
            );
          })()}
          {/* Multiple images */}
          {(() => {
            const urls = post.imageUrls?.length > 0 ? post.imageUrls.filter((u: string) => u?.trim()) : (post.imageUrl ? [post.imageUrl] : []);
            const isBlurred = (post.isNsfw || post.isSpoiler) && !detailBlurRevealed;
            return urls.map((url: string, i: number) => (
              <div key={i} className="relative mt-3 rounded-lg overflow-hidden">
                <img src={url} alt="" className={cn("rounded-lg max-h-[400px] sm:max-h-[600px] w-full sm:w-auto transition-all duration-300", isBlurred ? "blur-2xl scale-105" : "cursor-pointer hover:opacity-90")} onClick={() => !isBlurred && setLightboxImg(url)} />
                {isBlurred && (
                  <div onClick={() => setDetailBlurRevealed(true)} className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors z-10">
                    <span className="text-white text-[13px] font-bold mb-1">{post.isNsfw ? "محتوى حساس" : "Spoiler - اضغط للعرض"}</span>
                    <span className="text-white/60 text-[11px]">اضغط لكشف الصورة</span>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 text-nf-muted flex-wrap">
          <div className="flex items-center gap-0.5 bg-nf-secondary rounded-full px-1.5 py-0.5">
            <button onClick={() => setPostVote(1)} className={cn("p-1 rounded-md transition-colors duration-150", postMyVote === 1 ? "text-orange-500" : "text-nf-dim hover:text-nf-muted")}><ArrowUp size={16} /></button>
            <span className={cn("text-xs font-bold min-w-[20px] text-center", postMyVote === 1 ? "text-orange-500" : postMyVote === -1 ? "text-blue-400" : postVoteCount > 0 ? "text-orange-500" : postVoteCount < 0 ? "text-blue-400" : "text-nf-dim")}>{postVoteCount}</span>
            <button onClick={() => setPostVote(-1)} className={cn("p-1 rounded-md transition-colors duration-150", postMyVote === -1 ? "text-blue-400" : "text-nf-dim hover:text-nf-muted")}><ArrowDown size={16} /></button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-nf-hover text-xs transition-colors"><MessageSquare size={14} /> {post.commentCount || 0} {t("pc.comments")}</button>
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
                  <button onClick={() => { const text = `${post.title}\n${window.location.href}`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`); setShowShareMenu(false); showToast(t("pd.openedX")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X / Twitter
                  </button>
                  <div className="h-px bg-nf-border-2 my-0.5" />
                  <button onClick={() => { const text = `${post.title}${post.body ? '\n' + post.body.slice(0, 300) : ''}\n\n${window.location.href}`; navigator.clipboard?.writeText(text); setShowShareMenu(false); showToast(t("pd.contentCopied")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-nf-accent transition-colors">
                    <Link2 size={14} className="text-nf-accent shrink-0" />
                    {t("pd.copyContent")}
                  </button>
                  <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowShareMenu(false); showToast(t("pd.linkCopied")); }} className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-nf-hover text-xs text-nf-muted hover:text-white transition-colors">
                    <Share2 size={14} className="shrink-0" />
                    {t("pd.copyLink")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={togglePostSave} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors", postSaved ? "text-nf-accent" : "hover:bg-nf-hover")}><Bookmark size={14} /> {postSaved ? "محفوظ" : "حفظ"}</button>
          <button onClick={() => setShowPostReport(true)} className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-nf-hover text-xs transition-colors"><Flag size={14} /> بلّغ</button>
          {user && post?.authorUid === user.uid && onEditClick && (
            <button onClick={() => onEditClick(postId)} className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-nf-hover text-xs transition-colors"><Pencil size={14} /> تعديل</button>
          )}
          {user && post?.authorUid === user.uid && onDeleteClick && (
            <button onClick={async () => { await deleteDoc(doc(db, "posts", postId)); onBack(); }} className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-red-400/10 text-xs text-nf-muted hover:text-red-400 transition-colors"><Trash2 size={14} /> حذف</button>
          )}
          <button onClick={() => { const embed = `<blockquote class="northfall-embed" data-post-id="${postId}"><a href="${window.location.origin}/app?view=post&postId=${postId}">NorthFall Post</a></blockquote>`; navigator.clipboard?.writeText(embed); showToast(t("pd.embedCopied")); }} className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-nf-hover text-xs transition-colors"><Code2 size={14} /> Embed</button>
        </div>
        <ReportModal open={showPostReport} onClose={() => setShowPostReport(false)} type="post" targetId={postId} />
      </article>

      {/* Comment Input - pill shaped like original */}
      {user ? (
        <div className="mt-3 mb-4">
          <div className="flex items-center bg-nf-input border border-nf-border-2 rounded-3xl overflow-hidden px-2 py-1 gap-2 focus-within:border-white/20 focus-within:shadow-[0_0_0_2px_rgba(255,255,255,0.05)] transition-all">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-nf-secondary flex items-center justify-center shrink-0 text-[9px] text-nf-muted font-bold">{(user.displayName || "U")[0]}</div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => { setCommentText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitComment(); } }}
              placeholder={replyTo ? `${t("pd.writeReply")} ${replyTo.name}...` : `${t("pd.writeComment")}... (${t("pd.ctrlEnter")})`}
              rows={1}
              maxLength={10000}
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#555] resize-none min-h-[36px] py-1.5 px-2 leading-snug"
            />
            <div className="flex items-center gap-2 shrink-0">
              {commentText.length > 0 && <span className={cn("text-[10px]", commentText.length > 9000 ? "text-[#ff4444]" : "text-nf-dim")}>{commentText.length > 9000 ? `${10000 - commentText.length}` : ""}</span>}
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className="px-4 py-1.5 rounded-2xl border border-nf-border text-xs font-semibold text-nf-muted hover:bg-nf-hover hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {t("pd.commentBtn")}
              </button>
            </div>
          </div>
          {replyTo && (
            <div className="flex items-center gap-2 mt-1.5 mr-10 text-xs text-nf-muted">
              <span>{t("pd.replyTo")} <strong className="text-blue-400">{replyTo.name}</strong></span>
              <button onClick={() => { setReplyTo(null); setCommentText(""); }} className="text-nf-dim hover:text-white">✕</button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-3 text-nf-muted text-sm border border-nf-border-2 rounded-lg mb-4">
          {t("pd.loginToComment")}
        </div>
      )}

      {/* Comments Sort & Search */}
      <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
        <span className="text-xs text-nf-muted">{t("pd.sortBy")}</span>
        <button onClick={() => setCommentSort("best")} className={cn("px-2 py-1 rounded-full text-xs font-medium transition-colors", commentSort === "best" ? "bg-nf-hover text-white" : "text-nf-muted hover:text-white")}>{t("pd.sortBest")}</button>
        <button onClick={() => setCommentSort("new")} className={cn("px-2 py-1 rounded-full text-xs font-medium transition-colors", commentSort === "new" ? "bg-nf-hover text-white" : "text-nf-muted hover:text-white")}>{t("pd.sortNew")}</button>
        <button onClick={() => setAllCollapsed(!allCollapsed)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-nf-muted hover:text-white transition-colors">
          {allCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          {allCollapsed ? t("pd.expandAll") : t("pd.collapseAll")}
        </button>
        <span className="text-xs text-nf-dim mr-auto">{comments.length} {t("pc.comments")}</span>
        <div className="relative w-full mt-1">
          <input type="text" value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} placeholder={t("pd.searchComments")} className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-nf-dim outline-none focus:border-white/20 transition-colors" />
          {commentSearch && <button onClick={() => setCommentSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-nf-dim hover:text-white text-xs">✕</button>}
        </div>
      </div>

      {/* Comments Tree */}
      <div className="border-t border-nf-border-2 pt-2">
        {tree.length === 0 ? (
          <div className="text-center py-6 text-nf-muted text-sm">{t("pd.noCommentsYet")}</div>
        ) : (
          tree.map((c) => (
            <CommentNode key={c.id} comment={c} onReply={handleReply} onProfileClick={onProfileClick} postId={postId} onDelete={(id) => setComments(prev => prev.filter(c => c.id !== id))} showToast={showToast} forceCollapse={allCollapsed} />
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
        <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 left-4 text-white/70 hover:text-white text-2xl" onClick={() => setLightboxImg(null)}>&times;</button>
          <img src={lightboxImg} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-20 sm:bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-nf-secondary border border-nf-border-2 flex items-center justify-center text-nf-muted hover:text-white hover:bg-nf-hover transition-colors shadow-lg">
        <ArrowUpCircle size={20} />
      </button>
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
