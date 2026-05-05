"use client";

import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark, Flag, Code, MoreHorizontal, ChevronLeft, ChevronRight, Star, Heart, Sparkles, Zap, Trophy, Eye, Send, Pencil, Trash2, AlertTriangle, Link2, Flame, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { doc, updateDoc, setDoc, deleteDoc, getDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore";
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

  // Check if post is saved on mount
  useEffect(() => {
    if (!user || !postId) return;
    getDoc(doc(db, "users", user.uid, "saved", postId)).then(s => setSaved(s.exists())).catch(() => {});
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
  const [voteAnim, setVoteAnim] = useState<"up" | "down" | null>(null);
  const [dblClickAnim, setDblClickAnim] = useState(false);
  const [pollVotes, setPollVotes] = useState<number[]>(poll?.votes || []);
  const [myPollVote, setMyPollVote] = useState<number | null>(null);

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
    setVoteAnim(dir === 1 ? "up" : "down");
    setTimeout(() => setVoteAnim(null), 600);
    setVoteCount(voteCount + diff);
    try {
      await updateDoc(doc(db, "posts", postId), { votes: voteCount + diff });
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
        createdAt: new Date().toISOString(),
        votes: 1,
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
    } catch {}
  };

  // Build URL for Ctrl+Click new tab support
  const postHref = postId ? `/app?view=post&postId=${postId}` : undefined;

  return (
    <a href={postHref || "#"} onClick={e => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); onPostClick?.(postId || ""); } }} className="block">
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
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
      <div className="flex items-center gap-3 px-4 py-1.5 text-nf-muted">
        <div className="flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); handleVote(1); }} className={cn("p-0.5 rounded transition-all duration-200", myVote === 1 ? "text-[#ff4444] scale-110" : "hover:text-[#ff4444]")}><ArrowUp size={16} /></button>
          <span className={cn("text-xs font-bold transition-all duration-200", voteAnim === "up" ? "text-[#ff4444] scale-125" : voteAnim === "down" ? "text-nf-accent scale-125" : voteCount > 0 ? "text-[#ff4444]" : voteCount < 0 ? "text-nf-accent" : "text-white")}>{voteCount}</span>
          <button onClick={(e) => { e.stopPropagation(); handleVote(-1); }} className={cn("p-0.5 rounded transition-all duration-200", myVote === -1 ? "text-nf-accent scale-110" : "hover:text-nf-accent")}><ArrowDown size={16} /></button>
          {voteAnim && <motion.span initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: voteAnim === "up" ? -14 : 14, scale: 1.5 }} transition={{ duration: 0.5 }} className={cn("absolute text-[10px] font-bold pointer-events-none", voteAnim === "up" ? "text-[#ff4444]" : "text-nf-accent")}>{voteAnim === "up" ? "+1" : "-1"}</motion.span>}
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


      {showReport && <ReportModal open={showReport} onClose={() => setShowReport(false)} type="post" targetId={postId || ""} />}
      {showShareModal && <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} postId={postId || ""} postTitle={title} />}
    </motion.article>
    </a>
  );
}
