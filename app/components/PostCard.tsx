"use client";

import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark, Flag, Code, MoreHorizontal, ChevronLeft, ChevronRight, Star, Heart, Sparkles, Zap, Trophy, Eye, EyeOff, Send, Pencil, Trash2, AlertTriangle, Link2, Flame, BookOpen, Languages, FileText, X, ChevronDown, Settings, Key, Check, AlertCircle, Quote, GitBranch, Copy } from "lucide-react";
import { isPollExpired, pollStatusLabel, type PollData } from "@/lib/poll";
import { recordPostView } from "@/lib/record-post-view";
import { cn } from "@/lib/utils";
import { firestoreCommunityIdFromDisplay, isUserDestinationPath } from "@/lib/post-target";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, setDoc, deleteDoc, getDoc, collection, addDoc, getDocs, query, where, increment, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import ShareModal from "./ShareModal";
import ReportModal from "./ReportModal";
import HoverCard from "./HoverCard";
import { renderFormattedBody } from "./PostFormatter";
import PostHashtagText from "./PostHashtagText";
import { postBodyPreviewText } from "@/lib/post-preview";
import { textHasHashtags } from "@/lib/hashtags";
import VideoPlayer from "./VideoPlayer";
import NsfwMediaCover from "./NsfwMediaCover";
import FeedMediaFrame from "./FeedMediaFrame";
import VotePill from "./VotePill";
import { getVoteTransition, normalizeStoredVote } from "@/lib/vote-transition";
import { readPostVoteCount } from "@/lib/post-vote-count";
import { useToast } from "./ToastProvider";
import { calcSaitGain } from "@/lib/ranking";
import { displayFeedTitle, textDirAttr } from "@/lib/display-text";
import { getPostBorderedPref } from "@/lib/user-display-prefs";
import { buildNorthfallEmbedCode } from "@/lib/northfall-embed";
import { mergeActor } from "@/lib/notification-format";
import { bumpCategoryAffinity } from "@/lib/hide-post";
import { flairBadgeStyle } from "@/lib/flair-badge";
import NorthFallAiResult from "./NorthFallAiResult";

interface QuotedPostData {
  id: string;
  authorName?: string;
  authorPhoto?: string;
  authorUid?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  community?: string;
  createdAt?: string;
}

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
  linkUrl?: string;
  videoUrl?: string;
  mediaItems?: {type:"image"|"video", url:string}[];
  flair?: string;
  flairBg?: string | null;
  flairTextColor?: string | null;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  isLiving?: boolean;
  currentVersion?: number;
  versionsCount?: number;
  votes?: number;
  comments?: number;
  views?: number;
  awards?: any[];
  poll?: PollData | null;
  quotedPost?: QuotedPostData | null;
  quotedPostId?: string;
  onCommunityClick?: (name: string) => void;
  onProfileClick?: (uid?: string) => void;
  onPostClick?: (id: string) => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  onQuoteClick?: (id: string) => void;
  onFlairClick?: (flair: string) => void;
  hashtags?: string[];
  onHashtagClick?: (tag: string) => void;
  onHideClick?: (postId: string) => void;
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
  linkUrl,
  videoUrl,
  mediaItems: mediaItemsProp,
  flair,
  flairBg,
  flairTextColor,
  isNsfw,
  isSpoiler,
  isLiving,
  currentVersion,
  versionsCount,
  votes = 0,
  comments = 0,
  views: viewsProp = 0,
  awards,
  poll,
  onCommunityClick,
  onProfileClick,
  onPostClick,
  onEditClick,
  onDeleteClick,
  onQuoteClick,
  quotedPost: quotedPostProp,
  quotedPostId,
  onFlairClick,
  onHashtagClick,
  onHideClick,
  hashtags,
}: PostCardProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [voteCount, setVoteCount] = useState(votes);
  const [myVote, setMyVote] = useState(0);
  const [voteLoaded, setVoteLoaded] = useState(false);
  const myVoteRef = useRef(0);
  const voteCountRef = useRef(votes);
  const votingRef = useRef(false);
  const [saved, setSaved] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [fetchedQuotedPost, setFetchedQuotedPost] = useState<QuotedPostData | null>(null);
  const quotedPost = quotedPostProp || fetchedQuotedPost;
  const isUserDest = isUserDestinationPath(community);
  const communityDocId = firestoreCommunityIdFromDisplay(community);
  const [postBordered, setPostBordered] = useState(false);

  useEffect(() => {
    setPostBordered(getPostBorderedPref());
    const onPrefs = () => setPostBordered(getPostBorderedPref());
    window.addEventListener("nf-display-prefs", onPrefs);
    return () => window.removeEventListener("nf-display-prefs", onPrefs);
  }, []);

  // Check if user is staff in this community (ليس منشورات u/)
  useEffect(() => {
    if (!user || !communityDocId) {
      setIsStaff(false);
      return;
    }
    const commName = communityDocId;
    getDoc(doc(db, "communities", commName)).then(commSnap => {
      if (commSnap.exists() && commSnap.data().creatorUid === user.uid) { setIsStaff(true); return; }
      getDoc(doc(db, "communities", commName, "members", user.uid)).then(s => {
        if (s.exists()) {
          const role = s.data().role;
          const perms = s.data().permissions || {};
          setIsStaff(role === "admin" || role === "moderator" || perms.managePosts === true);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [user?.uid, communityDocId]);

  // Fetch quoted post if quotedPostId provided but no quotedPost prop
  useEffect(() => {
    if (quotedPostProp || !quotedPostId) return;
    getDoc(doc(db, "posts", quotedPostId)).then(s => {
      if (s.exists()) {
        const d = s.data();
        setFetchedQuotedPost({ id: s.id, authorName: d.authorName, authorPhoto: d.authorPhoto, authorUid: d.authorUid, title: d.title, body: d.body, imageUrl: d.imageUrl || d.imageUrls?.[0], community: d.community, createdAt: d.createdAt });
      }
    }).catch(() => {});
  }, [quotedPostId, quotedPostProp]);

  useEffect(() => {
    if (votingRef.current) return;
    const next = Math.max(0, votes);
    setVoteCount(next);
    voteCountRef.current = next;
  }, [votes, postId]);

  // Check if post is saved and load user's vote on mount
  useEffect(() => {
    if (!user || !postId) return;
    getDoc(doc(db, "users", user.uid, "saved", postId)).then(s => setSaved(s.exists())).catch(() => {});
    Promise.all([
      getDoc(doc(db, "posts", postId, "votes", user.uid)),
      readPostVoteCount(postId),
    ])
      .then(([voteSnap, serverVotes]) => {
        if (voteSnap.exists()) {
          const dir = normalizeStoredVote(voteSnap.data().dir || 0);
          setMyVote(dir);
          myVoteRef.current = dir;
        }
        if (!votingRef.current) {
          setVoteCount(serverVotes);
          voteCountRef.current = serverVotes;
        }
        setVoteLoaded(true);
      })
      .catch(() => {
        setVoteLoaded(true);
      });
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
  const [views, setViews] = useState(viewsProp);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState("");
  const [blurRevealed, setBlurRevealed] = useState(false);

  useEffect(() => {
    setBlurRevealed(false);
  }, [imgIdx]);
  const [dblClickAnim, setDblClickAnim] = useState(false);
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

  const isSafeMediaUrl = (url: string) => {
    const u = (url || "").trim();
    if (!u) return false;
    if (u.startsWith("/") || u.startsWith("data:image/")) return true;
    try {
      const p = new URL(u);
      return p.protocol === "http:" || p.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Support multiple images + unified mediaItems (text / image / link — no exclusion)
  const allImages =
    imageUrls && imageUrls.length > 0
      ? imageUrls.filter((u) => isSafeMediaUrl(u))
      : image && isSafeMediaUrl(image)
        ? [image]
        : [];
  const hasMultiple = allImages.length > 1;
  // Feed always shows carousel — the setting only affects PostDetail (full post view)

  // Build unified media list
  const unifiedMedia: {type:"image"|"video", url:string}[] = (() => {
    if (mediaItemsProp && mediaItemsProp.length > 0) {
      return mediaItemsProp.filter((m) => m.url.trim() && isSafeMediaUrl(m.url));
    }
    const imgs = allImages.map(u => ({type:"image" as const, url:u}));
    const vid = videoUrl?.trim();
    return vid ? [...imgs, {type:"video" as const, url:vid}] : imgs;
  })();

  const handleDblClickVote = () => {
    if (!user || !postId) return;
    if (myVoteRef.current !== 1) handleVote(1);
    setDblClickAnim(true);
    setTimeout(() => setDblClickAnim(false), 800);
  };

  const handleVote = async (dir: 1 | -1) => {
    if (!user || !postId || !voteLoaded || votingRef.current) return;
    if (authorUid && authorUid === user.uid) return;
    const currentVote = myVoteRef.current;
    const transition = getVoteTransition(currentVote as -1 | 0 | 1, dir);
    if (!transition) return;

    votingRef.current = true;
    const { next: newVote, diff } = transition;
    const prevVote = currentVote;
    const prevCount = voteCountRef.current;
    const nextCount = Math.max(0, prevCount + diff);
    myVoteRef.current = newVote;
    voteCountRef.current = nextCount;
    setMyVote(newVote);
    setVoteCount(nextCount);
    try {
      // Use increment to avoid race conditions
      await updateDoc(doc(db, "posts", postId), { votes: increment(diff) });
      // Update author's صيت (karma) — use transaction for atomicity + idempotency
      if (authorUid && diff !== 0) {
        // Get voter's data for trust-based weight
        const voterSnap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
        const voterData = voterSnap?.exists() ? {
          xp: voterSnap.data().xp || 0,
        } : { xp: 0 };
        console.log("[SAIT] PostCard voterData", { voterUid: user.uid, voterData, authorUid });
        const isRemoving = newVote === 0;
        if (isRemoving) {
          // Removing vote → read stored saitGain from vote doc to exactly reverse it
          const voteSnap = await getDoc(doc(db, "posts", postId, "votes", user.uid)).catch(() => null);
          const storedGain = voteSnap?.exists() ? (voteSnap.data().saitGain || 0) : 0;
          console.log("[SAIT] PostCard REMOVE", { postId, voterUid: user.uid, previousVote: currentVote, nextVote: newVote, storedGain, reputationDelta: -storedGain });
          if (storedGain !== 0) {
            await updateDoc(doc(db, "users", authorUid), { karma: increment(-storedGain) }).catch((e) => { console.error("[SAIT] PostCard REMOVE error", e); });
          }
          await deleteDoc(doc(db, "posts", postId, "votes", user.uid));
        } else {
          // Adding new vote → use transaction to prevent double-counting
          const saitGain = calcSaitGain(Math.abs(nextCount), newVote as 1 | -1, voterData);
          console.log("[SAIT] PostCard ADD", { postId, voterUid: user.uid, previousVote: currentVote, nextVote: newVote, saitGain, contentVotes: voteCount + diff });
          try {
            await runTransaction(db, async (transaction) => {
              const voteDocRef = doc(db, "posts", postId, "votes", user.uid);
              const authorRef = doc(db, "users", authorUid);
              // ALL reads FIRST (Firestore requirement)
              const voteDoc = await transaction.get(voteDocRef);
              const authorDoc = await transaction.get(authorRef);
              // Idempotency: if vote doc already exists with same dir, skip karma update
              if (voteDoc.exists() && voteDoc.data().dir === newVote) {
                console.log("[SAIT] PostCard SKIP (vote already exists)", { postId, voterUid: user.uid });
                return;
              }
              // ALL writes AFTER reads
              transaction.set(voteDocRef, { dir: newVote, votedAt: new Date().toISOString(), saitGain });
              if (saitGain !== 0) {
                const currentKarma = authorDoc.exists() ? (authorDoc.data().karma || 0) : 0;
                transaction.set(authorRef, { karma: currentKarma + saitGain }, { merge: true });
              }
            });
            console.log("[SAIT] PostCard DONE", { postId, voterUid: user.uid, saitGain });
          } catch (txErr) {
            console.error("[SAIT] PostCard TRANSACTION FAILED", txErr);
          }
          return; // vote doc already saved in transaction
        }
      }
      if (newVote !== 0 && !authorUid) {
        await setDoc(doc(db, "posts", postId, "votes", user.uid), {
          dir: newVote,
          votedAt: new Date().toISOString(),
        });
      }
      if (newVote === 0 && !authorUid) {
        await deleteDoc(doc(db, "posts", postId, "votes", user.uid));
      }
      // Batch notification: update existing or create new
      if (authorUid && authorUid !== user.uid && newVote !== 0) {
        try {
          const actor = {
            uid: user.uid,
            name: user.displayName || "مستخدم",
            photo: user.photoURL || "",
          };
          const postTitle = title?.slice(0, 80) || "منشور";
          const notifQ = query(collection(db, "users", authorUid, "notifications"), where("postId", "==", postId), where("type", "==", "vote"), where("read", "==", false));
          const notifSnap = await getDocs(notifQ);
          if (!notifSnap.empty) {
            const existing = notifSnap.docs[0];
            const prev = existing.data();
            const actors = mergeActor(prev.actors, actor);
            const count = (prev.count || 1) + 1;
            await updateDoc(existing.ref, {
              count,
              actors,
              fromUid: actor.uid,
              fromName: actor.name,
              fromPhoto: actor.photo,
              postTitle,
              text: count > 1 ? `${count} أشخاص صوّتوا على «${postTitle.slice(0, 48)}»` : `${actor.name} صوّت على «${postTitle.slice(0, 48)}»`,
              lastVoterName: actor.name,
              createdAt: new Date().toISOString(),
            });
          } else {
            await addDoc(collection(db, "users", authorUid, "notifications"), {
              type: "vote",
              text: `${actor.name} صوّت على «${postTitle.slice(0, 48)}»`,
              fromUid: actor.uid,
              fromName: actor.name,
              fromPhoto: actor.photo,
              actors: [actor],
              postTitle,
              read: false,
              createdAt: new Date().toISOString(),
              postId,
              count: 1,
            });
          }
        } catch {}
      }
      if (newVote === 1) {
        void bumpCategoryAffinity(user.uid, {
          flair,
          hashtags,
          community: community?.replace(/^n\//, ""),
        }).catch(() => {});
      }
    } catch {
      myVoteRef.current = prevVote;
      voteCountRef.current = prevCount;
      setMyVote(prevVote);
      setVoteCount(prevCount);
    } finally {
      votingRef.current = false;
      if (postId) {
        readPostVoteCount(postId)
          .then((serverVotes) => {
            voteCountRef.current = serverVotes;
            setVoteCount(serverVotes);
          })
          .catch(() => {});
      }
    }
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
    if (!postId) return;
    navigator.clipboard?.writeText(buildNorthfallEmbedCode(postId, window.location.origin));
    setShowEmbed(true);
    setTimeout(() => setShowEmbed(false), 2000);
  };

  useEffect(() => {
    setViews(viewsProp);
  }, [postId, viewsProp]);

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
          const actor = {
            uid: user.uid,
            name: user.displayName || "مستخدم",
            photo: user.photoURL || "",
          };
          const postTitle = title?.slice(0, 80) || "منشور";
          const notifQ = query(collection(db, "users", authorUid, "notifications"), where("postId", "==", postId), where("type", "==", "comment"), where("read", "==", false));
          const notifSnap = await getDocs(notifQ);
          if (!notifSnap.empty) {
            const existing = notifSnap.docs[0];
            const prev = existing.data();
            const actors = mergeActor(prev.actors, actor);
            const count = (prev.count || 1) + 1;
            await updateDoc(existing.ref, {
              count,
              actors,
              fromUid: actor.uid,
              fromName: actor.name,
              fromPhoto: actor.photo,
              postTitle,
              text: count > 1 ? `${count} أشخاص علّقوا على «${postTitle.slice(0, 48)}»` : `${actor.name} علّق على «${postTitle.slice(0, 48)}»`,
              lastCommenterName: actor.name,
              createdAt: new Date().toISOString(),
            });
          } else {
            await addDoc(collection(db, "users", authorUid, "notifications"), {
              type: "comment",
              text: `${actor.name} علّق على «${postTitle.slice(0, 48)}»`,
              fromUid: actor.uid,
              fromName: actor.name,
              fromPhoto: actor.photo,
              actors: [actor],
              postTitle,
              read: false,
              createdAt: new Date().toISOString(),
              postId,
              count: 1,
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

  // Ctrl+Drag to pin as tab — attach via native event to avoid framer-motion type conflict
  const articleRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const onDragStart = (e: DragEvent) => {
      if (!e.ctrlKey) { e.preventDefault(); return; }
      const label = title ? title.slice(0, 22) + (title.length > 22 ? "…" : "") : "منشور";
      e.dataTransfer?.setData("application/nf-item-id",      `post:${postId}`);
      e.dataTransfer?.setData("application/nf-item-label",   label);
      e.dataTransfer?.setData("application/nf-item-view",    "post");
      e.dataTransfer?.setData("application/nf-item-payload", JSON.stringify({ postId }));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "copy";
    };
    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", onDragStart);
    return () => el.removeEventListener("dragstart", onDragStart);
  }, [postId, title]);

  // Count a view when the card is actually seen in the feed (not only on open)
  useEffect(() => {
    if (!postId) return;
    const el = articleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.45);
        if (!visible) return;
        void recordPostView(postId, {
          viewerUid: user?.uid,
          authorUid,
          countOwn: true,
        }).then((next) => {
          if (next !== null) setViews(next);
        });
        observer.disconnect();
      },
      { threshold: [0.45, 0.6] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [postId, user?.uid, authorUid]);

  return (
    <motion.article
      ref={articleRef as any}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={cn(
        "group cursor-pointer nf-post-card relative",
        postBordered && "nf-post-card--bordered"
      )}
    >
      <div className="px-3 pt-2.5 pb-1.5 relative" onDoubleClick={handleDblClickVote}>
        {/* Double-click heart animation */}
        {dblClickAnim && (
          <motion.div initial={{ opacity: 1, scale: 0.5, y: 0 }} animate={{ opacity: 0, scale: 1.8, y: -30 }} transition={{ duration: 0.7 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#ff4444"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </motion.div>
        )}
        {/* Header */}
        <div className="flex items-center gap-2 text-[12px] mb-1">
          <div className="w-5 h-5 rounded-full bg-nf-secondary overflow-hidden shrink-0">
            {authorPhoto ? (
              <img src={authorPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-nf-muted font-bold">n/</div>
            )}
          </div>
          {isUserDest ? (
            <HoverCard type="user" name={community.slice(2)} uid={authorUid} onProfileClick={onProfileClick}>
              <span className="font-semibold text-nf-accent cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onProfileClick?.(authorUid || undefined); }}>{community}</span>
            </HoverCard>
          ) : communityDocId ? (
            <HoverCard type="community" name={communityDocId} onCommunityClick={onCommunityClick}>
              <span className="font-semibold text-nf-accent cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onCommunityClick?.(communityDocId); }}>{community}</span>
            </HoverCard>
          ) : (
            <span className="font-semibold text-nf-muted">{community}</span>
          )}
          <span className="text-nf-dim">·</span>
          <HoverCard type="user" name={author} uid={authorUid} onProfileClick={onProfileClick}><span className="text-nf-muted hover:text-nf-text hover:underline cursor-pointer inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); onProfileClick?.(authorUid || undefined); }}>u/{author}{(authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[14px] h-[14px] inline" />}</span></HoverCard>
          <span className="text-nf-dim">·</span>
          <span className="text-nf-muted">{time}</span>
          {flair && (
            <>
              <span className="text-nf-dim">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlairClick?.(flair);
                }}
                className="px-1.5 py-px rounded-full text-[9px] font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
                style={flairBadgeStyle(flair, flairBg, flairTextColor)}
              >
                {flair}
              </button>
            </>
          )}
          {voteCount >= 10 && <><span className="text-nf-dim">·</span><span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-400/15 text-orange-400 flex items-center gap-0.5"><Flame size={9} />رائج</span></>}
          {isLiving && (
            <>
              <span className="text-nf-dim">·</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-nf-accent/10 text-nf-accent border border-nf-accent/20">
                حي{currentVersion ? ` v${currentVersion}` : ""}
                {versionsCount && versionsCount > 1 ? ` (${versionsCount})` : ""}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3
          className="nf-post-title nf-post-preview-title nf-bidi-text font-sans mb-1.5 line-clamp-1"
          dir={textDirAttr(title)}
          title={title}
        >
          {textHasHashtags(title) ? (
            <PostHashtagText text={displayFeedTitle(title)} onHashtagClick={onHashtagClick} />
          ) : (
            displayFeedTitle(title)
          )}
        </h3>

        {/* Body — معاينة نصية فقط في الفيد */}
        {body && (() => {
          const preview = postBodyPreviewText(body);
          if (!preview) {
            if (/```|using |public class|function /.test(body)) {
              return (
                <p className="nf-post-preview-body mt-0.5">💻 كود · اضغط لفتح المنشور</p>
              );
            }
            return null;
          }
          return (
            <p className="nf-post-preview-body nf-bidi-text mt-0.5" dir={textDirAttr(preview)}>
              {onHashtagClick && preview.includes("#") ? (
                <PostHashtagText text={preview} onHashtagClick={onHashtagClick} />
              ) : (
                preview
              )}
            </p>
          );
        })()}

        {/* Link post — فقط إذا ما في نص ولا وسائط */}
        {linkUrl?.trim() && unifiedMedia.length === 0 && !postBodyPreviewText(body || "") && isSafeMediaUrl(linkUrl) && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-nf-border-2/50 bg-transparent text-[12px] text-[#60a5fa] underline hover:text-[#93c5fd] transition-colors nf-md-link"
            dir="ltr"
          >
            <Link2 size={14} className="shrink-0" />
            <span className="truncate">{linkUrl.replace(/^https?:\/\//, "")}</span>
          </a>
        )}

        {/* Poll — شارة مختصرة في الفيد */}
        {poll && poll.options.length >= 2 && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-nf-dim border border-nf-border-2/35">
              استطلاع · {poll.options.length} خيارات
              {isPollExpired(poll, time) && " · انتهى"}
            </span>
          </div>
        )}

        {/* Unified Media Carousel — صورة كاملة مع حد أقصى للكبيرة */}
        {unifiedMedia.length > 0 && (
          <div className="mt-2 relative overflow-hidden rounded-lg nf-feed-media">
            {unifiedMedia[imgIdx]?.type === "image" ? (
              <NsfwMediaCover
                blurred={!!((isNsfw || isSpoiler) && !blurRevealed)}
                isNsfw={!!isNsfw}
                isSpoiler={!!isSpoiler}
                onReveal={() => setBlurRevealed(true)}
                className="rounded-lg"
              >
                <FeedMediaFrame
                  src={unifiedMedia[imgIdx].url}
                  alt=""
                  imgClassName="nf-feed-media-img"
                />
              </NsfwMediaCover>
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <VideoPlayer url={unifiedMedia[imgIdx].url} compact />
              </div>
            )}
            {/* Navigation */}
            {unifiedMedia.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setImgIdx((imgIdx - 1 + unifiedMedia.length) % unifiedMedia.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"><ChevronLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setImgIdx((imgIdx + 1) % unifiedMedia.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"><ChevronRight size={16} /></button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {unifiedMedia.map((m, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                      className={cn("rounded-full transition-all duration-200", i === imgIdx ? "w-3 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70")} />
                  ))}
                </div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-white font-medium z-10">
                  {imgIdx + 1}/{unifiedMedia.length}{unifiedMedia[imgIdx]?.type === "video" ? " 🎬" : ""}
                </span>
              </>
            )}
          </div>
        )}

        {/* Quoted Post - Mini Post Card (under my content, darker bg) */}
        {quotedPost && (
          <div className="mt-3 rounded-xl border border-nf-border-2/30 bg-nf-body/80 overflow-hidden hover:border-nf-accent/25 transition-all duration-150">
            <div
              onClick={(e) => { e.stopPropagation(); onPostClick?.(quotedPost.id); }}
              className="px-3.5 pt-3 pb-2.5 cursor-pointer hover:bg-nf-hover/40 transition-all duration-150"
            >
              <div className="flex items-center gap-2 text-[12px] mb-1.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-nf-secondary overflow-hidden shrink-0 ring-1 ring-nf-border-2/50">
                  {quotedPost.authorPhoto ? (
                    <img src={quotedPost.authorPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-nf-muted font-bold">{(quotedPost.authorName || "U")[0]}</div>
                  )}
                </div>
                <span className="font-semibold text-nf-accent shrink-0">n/{quotedPost.community || "عام"}</span>
                <span className="text-nf-dim">·</span>
                <span className="text-nf-muted truncate">u/{quotedPost.authorName || "User"}</span>
                <span className="text-nf-dim">·</span>
                <span className="text-nf-dim shrink-0">{quotedPost.createdAt ? timeAgoShort(quotedPost.createdAt) : ""}</span>
              </div>
              {quotedPost.title && <h3 className="text-[15px] font-bold text-nf-text leading-snug mb-1 line-clamp-2">{quotedPost.title}</h3>}
              {quotedPost.body && <p className="text-[13px] text-nf-muted leading-relaxed line-clamp-3">{quotedPost.body}</p>}
              {quotedPost.imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-nf-border-2/30">
                  <img src={quotedPost.imageUrl} alt="" className="w-full max-h-[220px] object-cover" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 border-t border-nf-border-2/25 text-nf-dim">
              <button onClick={() => onQuoteClick?.(quotedPost.id)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] hover:bg-nf-hover hover:text-nf-text transition-colors"><Quote size={10} />اقتباس</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer - always visible */}
      <div className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-1.5 text-nf-muted flex-wrap opacity-80 group-hover:opacity-100 transition-opacity duration-300">
        <div className="nf-post-action !gap-0 !px-0" onClick={(e) => e.stopPropagation()}>
          <VotePill
            count={voteCount}
            myVote={myVote as -1 | 0 | 1}
            onUp={() => handleVote(1)}
            onDown={() => handleVote(-1)}
          />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowQuickReply(!showQuickReply); }}
          className="nf-post-action hover:text-nf-text transition-colors"
        >
          <span className="nf-post-action-icon"><MessageSquare size={14} strokeWidth={2} /></span>
          <span className="nf-post-action-label">{comments} {t("pc.comments")}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onQuoteClick?.(postId || ""); }} className="nf-post-action hover:text-nf-text transition-colors">
          <span className="nf-post-action-icon"><Quote size={14} strokeWidth={2} /></span>
          <span className="nf-post-action-label">اقتباس</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="nf-post-action hover:text-nf-text transition-colors">
          <span className="nf-post-action-icon"><Share2 size={14} strokeWidth={2} /></span>
          <span className="nf-post-action-label">{t("pc.share")}</span>
        </button>
        {postId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(`/embed-generator?postId=${postId}`, "_blank", "noopener,noreferrer");
            }}
            className="nf-post-action hover:text-nf-text transition-colors"
            title="إنشاء Embed"
          >
            <span className="nf-post-action-icon"><Code size={14} strokeWidth={2} /></span>
            <span className="nf-post-action-label">Embed</span>
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); toggleSave(); }} className={cn("nf-post-action transition-colors", saved ? "text-nf-accent" : "hover:text-nf-accent")}>
          <span className="nf-post-action-icon"><Bookmark size={14} strokeWidth={2} fill={saved ? "currentColor" : "none"} /></span>
          <span className="nf-post-action-label">{saved ? "محفوظ" : "حفظ"}</span>
        </button>
        <div className="flex-1" />
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="hover:text-nf-text transition-colors p-0.5 rounded hover:bg-nf-hover"><MoreHorizontal size={16} /></button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
              <div className="absolute left-0 top-full mt-1 bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden z-50 min-w-[140px]">
                {user && authorUid === user.uid && onEditClick && (
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditClick(postId || ""); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
                    <Pencil size={12} /> تعديل المنشور
                  </button>
                )}
                {user && (authorUid === user.uid || isStaff) && onDeleteClick && (
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDeleteClick(postId || ""); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 size={12} /> حذف المنشور
                  </button>
                )}
                {title?.trim() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      void navigator.clipboard.writeText(title.trim());
                      toast("تم نسخ العنوان", "success");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
                  >
                    <Copy size={12} /> نسخ العنوان
                  </button>
                )}
                {body?.trim() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      void navigator.clipboard.writeText(body.trim());
                      toast("تم نسخ النص", "success");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
                  >
                    <Copy size={12} /> نسخ النص
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigator.clipboard?.writeText(`${window.location.origin}/app?view=post&postId=${postId}`); toast("تم نسخ الرابط", "success"); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
                  <Link2 size={12} /> نسخ الرابط
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowReport(true); }} className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
                  <Flag size={12} /> إبلاغ
                </button>
                {user && onHideClick && postId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onHideClick(postId);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"
                  >
                    <EyeOff size={12} /> إخفاء
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Reply */}
      {showQuickReply && (
        <div className="flex items-center gap-2 px-4 py-2">
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
            className="flex-1 bg-nf-secondary rounded-full px-3 py-1.5 text-xs text-nf-text placeholder:text-nf-dim border-none outline-none"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); handleQuickReply(); }} disabled={!quickReplyText.trim()} className={cn("p-1.5 rounded-full transition-colors", quickReplyText.trim() ? "text-nf-accent hover:bg-nf-accent/10" : "text-nf-dim")}>
            <Send size={14} />
          </button>
        </div>
      )}

      {/* AI Result — إطار قوس قزح دوّار */}
      {(aiResult || aiLoading) && (
        <NorthFallAiResult
          loading={aiLoading}
          text={aiDisplayText}
          actionLabel="ملخص"
          onClose={() => {
            setAiResult(null);
            setAiDisplayText("");
          }}
        />
      )}

      {showReport && <ReportModal open={showReport} onClose={() => setShowReport(false)} type="post" targetId={postId || ""} />}
      {showShareModal && <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} postId={postId || ""} postTitle={title} />}
    </motion.article>
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
