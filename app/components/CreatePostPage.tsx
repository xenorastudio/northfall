"use client";

import { Image, AlertCircle, X, ChevronDown, ChevronUp, Eye, Bold, Heading2, Code2, Plus, Trash2, AtSign, List, Italic, Strikethrough, Quote, Sparkles, Save, Clock, AlertTriangle, Smile, Table, Minus, Keyboard, Maximize2, Minimize2, RotateCcw, GitBranch, Search, Pencil, ArrowRight, Play } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { useData } from "./DataProvider";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import RichContentEditor, { type RichContentEditorHandle } from "./RichContentEditor";
import { cleanArabicTextPreserveLines } from "@/lib/clean-arabic-text";
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "./ToastProvider";
import PostHashtagText from "./PostHashtagText";
import PostBodyContent from "./PostBodyContent";
import NsfwMediaCover from "./NsfwMediaCover";
import FeedMediaFrame from "./FeedMediaFrame";
import { extractHashtagsFromPost } from "@/lib/hashtags";
import { canPostInCommunity, resolveCommunityType } from "@/lib/community-access";
import { hasMeaningfulPreviewBody } from "@/lib/post-preview-body";
import { textDirAttr } from "@/lib/display-text";
import { PROFILE_POST_COMMUNITY, PROFILE_POST_TARGET } from "@/lib/post-target";
import { buildPollPayload, pollDurationLabel } from "@/lib/poll";
import ComposeSelect from "./ComposeSelect";
import "./rich-editor.css";

type PollOptionRow = { text: string; imageUrl: string };


const flairs = ["مناقشة", "مساعدة", "إبداع", "خبر", "تعلم", "مشروع", "سؤال"];

function draftFingerprint(d: { title?: string; body?: string; community?: string }) {
  return `${(d.title || "").trim()}|${(d.body || "").trim()}|${d.community || ""}`;
}

function formatDraftAge(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} ي`;
  const months = Math.floor(days / 30);
  return `منذ ${months} ش`;
}

export function normalizeGoogleDriveLink(url: string, isVideo: boolean = false): string {
  const s = url.trim();
  const match = s.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]{25,50})/);
  if (match) {
    const fileId = match[1];
    return isVideo 
      ? `https://drive.google.com/file/d/${fileId}/view`
      : `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return s;
}

function loadGooglePickerScripts(callback: () => void) {
  if ((window as any).gapi && (window as any).google?.accounts?.oauth2) {
    callback();
    return;
  }

  let gapiLoaded = false;
  let gsiLoaded = false;

  const checkLoaded = () => {
    if (gapiLoaded && gsiLoaded) {
      callback();
    }
  };

  if (!(window as any).gapi) {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).gapi.load("picker", () => {
        gapiLoaded = true;
        checkLoaded();
      });
    };
    document.body.appendChild(script);
  } else {
    gapiLoaded = true;
  }

  if (!(window as any).google?.accounts?.oauth2) {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gsiLoaded = true;
      checkLoaded();
    };
    document.body.appendChild(script);
  } else {
    gsiLoaded = true;
  }
}

export default function CreatePostPage({ onBack, onPost, editPostId, quotedPostId, livingPostId, livingVersions, defaultCommunity }: {
  onBack: () => void;
  onPost: () => void;
  editPostId?: string;
  quotedPostId?: string;
  /** If set, this is a "living post upgrade" — publish a new version */
  livingPostId?: string;
  /** Existing versions array passed from PostDetail */
  livingVersions?: import("./LivingPostVersions").PostVersion[];
  /** Pre-select community when creating from a community page */
  defaultCommunity?: string;
}) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { communities: fetchedComms, joinedCommunities } = useData();
  const profileHandle = user?.displayName?.replace(/\s+/g, "") || user?.uid?.slice(0, 10) || "me";
  const comms = useMemo(
    () =>
      fetchedComms
        .filter((c) => joinedCommunities.includes(c.name) || c.creatorUid === user?.uid)
        .map((c) => ({
          name: c.name,
          label: c.label || `n/${c.name}`,
          desc: c.shortDesc || "",
          img: c.img || "",
        })),
    [fetchedComms, joinedCommunities, user?.uid]
  );
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  // Unified media items: {type: "image"|"video", url: string}[]
  type MediaItem = { id: string; type: "image" | "video"; url: string };
  const newMediaId = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([{ id: "m-0", type: "image", url: "" }]);
  const [community, setCommunity] = useState(defaultCommunity || PROFILE_POST_COMMUNITY);

  useEffect(() => {
    if (!editPostId && !livingPostId && defaultCommunity) {
      setCommunity(defaultCommunity);
    }
  }, [defaultCommunity, editPostId, livingPostId]);
  const [flair, setFlair] = useState("");
  const [showCommDrop, setShowCommDrop] = useState(false);
  const [commPickerSearch, setCommPickerSearch] = useState("");
  const isProfileTarget = community === PROFILE_POST_COMMUNITY;
  const [showFlairDrop, setShowFlairDrop] = useState(false);
  // Community flairs loaded from Firestore
  const [communityFlairs, setCommunityFlairs] = useState<{ text: string; color: number; bg: string; textColor: string }[]>([]);
  const [flairRequired, setFlairRequired] = useState(false);
  const [canPostHere, setCanPostHere] = useState(true);

  const TAG_COLORS = [
    { bg: "#c8d8f0", text: "#1a3a6b" }, { bg: "#f8c8c8", text: "#7a1a1a" },
    { bg: "#d8c8f0", text: "#3a1a7a" }, { bg: "#fce8b8", text: "#7a4a00" },
    { bg: "#c8f0d8", text: "#1a6b3a" }, { bg: "#f0e8c8", text: "#6b5a1a" },
    { bg: "#f0c8e8", text: "#6b1a4a" },
  ];
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBody, setPreviewBody] = useState("");
  const editorRef = useRef<RichContentEditorHandle>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [composeTab, setComposeTab] = useState<"text" | "media" | "poll">("text");
  const [pollOptions, setPollOptions] = useState<PollOptionRow[]>([
    { text: "", imageUrl: "" },
    { text: "", imageUrl: "" },
  ]);
  const [pollDuration, setPollDuration] = useState("24h");
  const [loaded, setLoaded] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isLiving, setIsLiving] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  // Living post upgrade: changelog only
  const [livingChangelog, setLivingChangelog] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [autoDraft, setAutoDraft] = useState<any | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const savingDraftRef = useRef(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [quotedPostData, setQuotedPostData] = useState<any>(null);

  // Fetch quoted post data if quotedPostId provided
  useEffect(() => {
    if (!quotedPostId) return;
    getDoc(doc(db, "posts", quotedPostId)).then(s => {
      if (s.exists()) setQuotedPostData({ id: s.id, ...s.data() });
    }).catch(() => {});
  }, [quotedPostId]);

  // Load community flairs + posting permissions when community changes
  useEffect(() => {
    if (!community || isProfileTarget) {
      setCommunityFlairs([]);
      setFlairRequired(false);
      setFlair("");
      setCanPostHere(true);
      return;
    }
    (async () => {
      try {
        const commDocId = community.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, "").toLowerCase();
        const snap = await getDoc(doc(db, "communities", commDocId));
        if (!snap.exists()) {
          setCommunityFlairs([]);
          setFlairRequired(false);
          setCanPostHere(true);
          return;
        }
        const data = snap.data();
        const type = resolveCommunityType(data);
        let isStaff = user?.uid === data.creatorUid;
        let isMember = false;
        if (user) {
          const memberSnap = await getDoc(doc(db, "communities", commDocId, "members", user.uid));
          isMember = memberSnap.exists();
          if (!isStaff && memberSnap.exists()) {
            const role = memberSnap.data()?.role;
            isStaff = role === "admin" || role === "moderator";
          }
        }
        setCanPostHere(
          canPostInCommunity({
            type,
            isOwner: user?.uid === data.creatorUid,
            isStaff: !!isStaff,
            isMember,
            isLoggedIn: !!user,
          })
        );

        const rawTags = data.tags || [];
        if (!rawTags.length) {
          setCommunityFlairs([]);
          setFlairRequired(false);
          return;
        }
        const mapped = rawTags.map((t: any, i: number) => {
          const label = typeof t === "string" ? t : (t.text || "");
          const colorIdx = typeof t === "object" && t.color !== undefined ? t.color : (i % TAG_COLORS.length);
          const c = TAG_COLORS[colorIdx % TAG_COLORS.length];
          return { text: label, color: colorIdx, bg: c.bg, textColor: c.text };
        });
        setCommunityFlairs(mapped);
        setFlairRequired(true);
        setFlair("");
      } catch {
        setCommunityFlairs([]);
        setFlairRequired(false);
        setCanPostHere(true);
      }
    })();
  }, [community, isProfileTarget, user?.uid]);


  const MAX_DRAFTS = 8;

  const normalizeDrafts = (raw: any[]): any[] => {
    let current: any = null;
    const namedByFp = new Map<string, any>();
    for (const d of raw) {
      if (!d || typeof d.id !== "string") continue;
      if (d.id === "current") {
        current = d;
        continue;
      }
      const fp = draftFingerprint(d);
      const prev = namedByFp.get(fp);
      if (!prev || new Date(d.savedAt || 0) >= new Date(prev.savedAt || 0)) {
        namedByFp.set(fp, d);
      }
    }
    const named = Array.from(namedByFp.values())
      .sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime())
      .slice(0, MAX_DRAFTS);
    return current ? [current, ...named] : named;
  };

  const getDrafts = (): any[] => {
    try {
      const parsed = JSON.parse(localStorage.getItem("nf-drafts") || "[]");
      if (!Array.isArray(parsed)) return [];
      const normalized = normalizeDrafts(parsed);
      if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        localStorage.setItem("nf-drafts", JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  };

  const saveDrafts = (drafts: any[]) => {
    localStorage.setItem("nf-drafts", JSON.stringify(normalizeDrafts(drafts)));
  };

  const draftLabel = (d: { name?: string; title?: string }) =>
    (d.name || "").trim() || (d.title || "").trim() || "بدون عنوان";

  const draftMeta = (d: { community?: string; savedAt?: string }) => {
    const where =
      d.community === PROFILE_POST_COMMUNITY ? `@${profileHandle}` : `n/${d.community || "عام"}`;
    const when = formatDraftAge(d.savedAt);
    return when ? `${where} · ${when}` : where;
  };

  const refreshSavedDrafts = useCallback(() => {
    const all = getDrafts();
    const named = all.filter((d: any) => d.id !== "current");
    const namedFps = new Set(named.map((d) => draftFingerprint(d)));
    const current = all.find((d: any) => d.id === "current");
    const showAuto =
      current &&
      (current.title || current.body) &&
      !namedFps.has(draftFingerprint(current));
    setAutoDraft(showAuto ? current : null);
    setSavedDrafts(named);
  }, []);

  const openDraftsModal = () => {
    refreshSavedDrafts();
    setRenamingId(null);
    setRenameValue("");
    setShowDrafts(true);
  };

  // Auto-save draft to localStorage (slot واحد: current)
  useEffect(() => {
    if (editPostId) return;
    const timer = setTimeout(() => {
      if (title.trim() || body.trim()) {
        const others = getDrafts().filter((d: any) => d.id !== "current");
        const entry = {
          id: "current",
          title,
          body,
          community,
          flair,
          imageUrls,
          isNsfw,
          isSpoiler,
          savedAt: new Date().toISOString(),
        };
        saveDrafts([entry, ...others]);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, body, community, flair, imageUrls, isNsfw, isSpoiler, editPostId]);

  const hasAutoDraftBanner = useCallback(() => {
    const drafts = getDrafts();
    const current = drafts.find((d: any) => d.id === "current");
    if (!current || !(current.title || current.body)) return false;
    const named = drafts.filter((d: any) => d.id !== "current");
    return !named.some((d) => draftFingerprint(d) === draftFingerprint(current));
  }, []);

  // Check for saved draft on mount
  useEffect(() => {
    if (editPostId) return;
    setShowDraftBanner(hasAutoDraftBanner());
  }, [editPostId, hasAutoDraftBanner]);

  useEffect(() => {
    if (editPostId) return;
    setShowDraftBanner(hasAutoDraftBanner());
  }, [title, body, community, editPostId, hasAutoDraftBanner]);

  useEffect(() => {
    if (!showDrafts) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDrafts]);

  const loadDraft = () => {
    const drafts = getDrafts();
    const d = drafts.find((dr: any) => dr.id === "current");
    if (d) {
      setTitle(d.title || ""); setBody(d.body || ""); setCommunity(d.postTarget === PROFILE_POST_TARGET || !d.community ? PROFILE_POST_COMMUNITY : d.community); setFlair(d.flair || "");
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
    if (savingDraftRef.current) return;
    if (!title.trim() && !body.trim()) {
      toast("اكتب عنواناً أو نصاً قبل الحفظ", "error");
      return;
    }
    savingDraftRef.current = true;
    try {
      const fp = draftFingerprint({ title, body, community });
      let named = getDrafts().filter((d: any) => d.id !== "current");
      const dupIdx = named.findIndex((d) => draftFingerprint(d) === fp);
      const payload = {
        title,
        body,
        community,
        flair,
        imageUrls,
        isNsfw,
        isSpoiler,
        savedAt: new Date().toISOString(),
      };
      if (dupIdx >= 0) {
        named[dupIdx] = { ...named[dupIdx], ...payload };
        saveDrafts(named);
        toast("تم تحديث المسودة", "success");
      } else {
        if (named.length >= MAX_DRAFTS) {
          toast("وصلت للحد الأقصى (8 مسودات). احذف مسودة قديمة أولاً.", "error");
          openDraftsModal();
          return;
        }
        const id = "draft-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
        named = [{ id, ...payload }, ...named];
        saveDrafts(named);
        toast("تم حفظ المسودة", "success");
      }
      setShowDraftBanner(hasAutoDraftBanner());
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
      openDraftsModal();
    } finally {
      setTimeout(() => {
        savingDraftRef.current = false;
      }, 400);
    }
  };

  const commitDraftRename = (id: string) => {
    const drafts = getDrafts();
    const next = drafts.map((dr: any) =>
      dr.id === id ? { ...dr, name: renameValue.trim() || undefined } : dr
    );
    saveDrafts(next);
    setRenamingId(null);
    setRenameValue("");
    refreshSavedDrafts();
  };

  const loadNamedDraft = (id: string) => {
    const drafts = getDrafts();
    const d = drafts.find((dr: any) => dr.id === id);
    if (d) {
      setTitle(d.title || ""); setBody(d.body || ""); setCommunity(d.postTarget === PROFILE_POST_TARGET || !d.community ? PROFILE_POST_COMMUNITY : d.community); setFlair(d.flair || "");
      setImageUrls(d.imageUrls?.length ? d.imageUrls : [""]); setIsNsfw(d.isNsfw || false); setIsSpoiler(d.isSpoiler || false);
      setRenamingId(null);
      setRenameValue("");
      setShowDrafts(false);
    }
  };

  const deleteNamedDraft = (id: string) => {
    const drafts = getDrafts().filter((d: any) => d.id !== id);
    saveDrafts(drafts);
    if (renamingId === id) {
      setRenamingId(null);
      setRenameValue("");
    }
    refreshSavedDrafts();
  };

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
          setCommunity(d.postTarget === PROFILE_POST_TARGET || !d.community ? PROFILE_POST_COMMUNITY : d.community);
          setFlair(d.flair || "");
          setIsNsfw(d.isNsfw || false);
          setIsSpoiler(d.isSpoiler || false);
          if (d.imageUrls?.length) setImageUrls(d.imageUrls);
          else if (d.imageUrl) setImageUrls([d.imageUrl]);
          if (d.videoUrl) setVideoUrl(d.videoUrl);
          const storedMedia = Array.isArray(d.mediaItems) ? (d.mediaItems as { type?: string; url?: string }[]) : [];
          let built: MediaItem[] = storedMedia
            .filter((m) => m?.url?.trim())
            .map((m, i) => ({
              id: `m-${i}`,
              type: (m.type === "video" ? "video" : "image") as "image" | "video",
              url: String(m.url).trim(),
            }));
          if (!built.length) {
            const imgs: MediaItem[] = (d.imageUrls?.length ? d.imageUrls : d.imageUrl ? [d.imageUrl] : []).map(
              (u: string, i: number) => ({ id: `m-${i}`, type: "image" as const, url: u })
            );
            const vid = d.videoUrl?.trim();
            built = [...imgs, ...(vid ? [{ id: newMediaId(), type: "video" as const, url: vid }] : [])];
          }
          if (built.length) setMediaItems(built);
          else setMediaItems([{ id: newMediaId(), type: "image", url: "" }]);
          if (d.poll?.options) {
            const imgs: string[] = Array.isArray(d.poll.optionImages) ? d.poll.optionImages : [];
            setPollOptions(
              d.poll.options.map((text: string, i: number) => ({
                text: text || "",
                imageUrl: imgs[i] || "",
              }))
            );
            setShowPoll(true);
            setComposeTab("poll");
            setPollDuration(d.poll.duration || "24h");
          }
          setLoaded(true);
        }
      } catch (e) { console.error(e); }
    })();
  }, [editPostId, loaded]);

  // Load living post data for upgrade — صفحة نظيفة تماماً، بس نحفظ community
  useEffect(() => {
    if (!livingPostId || loaded) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "posts", livingPostId));
        if (snap.exists()) {
          const d = snap.data();
          // فقط نحدد المجتمع — باقي الحقول فارغة كأنه منشور جديد
          setCommunity(d.postTarget === PROFILE_POST_TARGET || !d.community ? PROFILE_POST_COMMUNITY : d.community);
          setIsLiving(true);
          setLoaded(true);
        }
      } catch (e) { console.error(e); }
    })();
  }, [livingPostId, loaded]);

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
    if (pollOptions.length < 6) setPollOptions([...pollOptions, { text: "", imageUrl: "" }]);
  };

  const removePollOption = (idx: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const updatePollOption = (idx: number, field: keyof PollOptionRow, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = { ...updated[idx], [field]: val };
    setPollOptions(updated);
  };

  const isUrlDrag = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) return false;
    return (
      e.dataTransfer.types.includes("text/uri-list") ||
      e.dataTransfer.types.includes("text/plain")
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isUrlDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setIsDragOver(false);
  };

  // Drag & drop image URL onto body area (links only — not local files)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      toast("أضف رابط الصورة أو الفيديو في قسم الوسائط أعلاه", "info");
      return;
    }
    const text = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    const url = text.trim().split("\n")[0]?.trim() || "";
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      const isVideo = /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url) || url.includes("youtube.com") || url.includes("youtu.be");
      const normalized = normalizeGoogleDriveLink(url, isVideo);
      const emptyIdx = mediaItems.findIndex((m) => !m.url.trim());
      if (emptyIdx >= 0) {
        const updated = [...mediaItems];
        updated[emptyIdx] = { ...updated[emptyIdx], type: isVideo ? "video" : "image", url: normalized };
        setMediaItems(updated);
      } else if (mediaItems.length < 8) {
        setMediaItems([...mediaItems, { id: newMediaId(), type: isVideo ? "video" : "image", url: normalized }]);
      }
      toast(isVideo ? "تمت إضافة رابط الفيديو" : "تمت إضافة رابط الصورة", "success");
    }
  };

  const reorderMedia = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= mediaItems.length || to >= mediaItems.length) return;
    const next = [...mediaItems];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setMediaItems(next);
  };

  const openGooglePicker = () => {
    loadGooglePickerScripts(() => {
      const google = (window as any).google;
      const client = google.accounts.oauth2.initTokenClient({
        client_id: "271792383366-cm32ivgq8r7bg033vqlkc10fnbui9jus.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            createPicker(tokenResponse.access_token);
          }
        },
      });
      client.requestAccessToken({ prompt: "consent" });
    });
  };

  const createPicker = (oauthToken: string) => {
    const google = (window as any).google;
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setMimeTypes("image/*,video/*")
      .setSelectFolderEnabled(false);

    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId("271792383366")
      .setOAuthToken(oauthToken)
      .addView(view)
      .setDeveloperKey("AIzaSyD2rbBw37_HLLEDWW8Ym5Cmwz3HOaD6KOk")
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const docs = data[google.picker.Response.DOCUMENTS];
          const newItems = docs.map((docObj: any) => {
            const fileId = docObj[google.picker.Document.ID];
            const mimeType = docObj[google.picker.Document.MIME_TYPE] || "";
            const isVideo = mimeType.startsWith("video/");
            const rawUrl = isVideo 
              ? `https://drive.google.com/file/d/${fileId}/view`
              : `https://drive.google.com/uc?export=view&id=${fileId}`;
              
            return {
              id: "m-gd-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
              type: isVideo ? ("video" as const) : ("image" as const),
              url: rawUrl
            };
          });
          
          setMediaItems((prev) => {
            const filtered = prev.filter(item => item.url.trim());
            const combined = [...filtered, ...newItems].slice(0, 8);
            return combined.length > 0 ? combined : [{ id: newMediaId(), type: "image", url: "" }];
          });
          toast("تم استيراد الملفات من Google Drive بنجاح", "success");
        }
      })
      .build();
    picker.setVisible(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!editPostId && !livingPostId && !isProfileTarget && !canPostHere) {
      toast("لا يمكنك النشر هنا — في المجتمعات المقيدة النشر للمشرفين فقط", "error");
      return;
    }
    // For living upgrade, title is optional; for normal posts it's required
    if (!livingPostId && !title.trim()) return;
    // Flair required if community has flairs
    if (flairRequired && !flair) {
      toast("يجب اختيار وسم قبل النشر في هذا المجتمع", "error");
      return;
    }
    setSubmitting(true);
    try {
      const cleanTitle = cleanArabicTextPreserveLines(title.trim());
      const cleanBody = cleanArabicTextPreserveLines(body.trim());
      // Derive imageUrls and videoUrl from unified mediaItems
      const validMedia = mediaItems.filter(m => m.url.trim());
      const validUrls = validMedia.filter(m => m.type === "image").map(m => m.url.trim());
      const derivedVideoUrl = validMedia.find(m => m.type === "video")?.url.trim() || "";
      const pollActive = showPoll || composeTab === "poll";
      const validPollOptions = pollActive ? pollOptions.filter((o) => o.text.trim()) : [];
      const pollPayload =
        pollActive && validPollOptions.length >= 2 ? buildPollPayload(validPollOptions, pollDuration) : null;

      // ── Living post upgrade ──────────────────────────────────────────────
      if (livingPostId) {
        const existingSnap = await getDoc(doc(db, "posts", livingPostId));
        if (!existingSnap.exists()) throw new Error("المنشور غير موجود");
        const existingData = existingSnap.data();
        const existingVersions: any[] = Array.isArray(existingData.versions) ? existingData.versions : [];
        const nextVersion = (existingVersions[existingVersions.length - 1]?.version ?? 0) + 1;

        // الإصدار الجديد يحتوي على المحتوى الجديد كاملاً
        const newVersion = {
          version: nextVersion,
          imageUrl: validUrls[0] || "",
          imageUrls: validUrls,
          title: cleanTitle || title.trim(),
          body: cleanBody,
          changelog: cleanArabicTextPreserveLines(livingChangelog.trim()) || `تحديث v${nextVersion}`,
          mentions: [],
          publishedAt: new Date().toISOString(),
          authorName: user.displayName || "مستخدم",
          flair: flair || existingData.flair || "",
          poll: pollPayload,
        };
        const updatedVersions = [...existingVersions, newVersion];

        // نحدّث فقط: versions array + currentVersion + الصورة الرئيسية للعرض في الفيد
        const livingHashtags = extractHashtagsFromPost({
          title: cleanTitle || String(existingData.title || ""),
          body: cleanBody,
        });
        await updateDoc(doc(db, "posts", livingPostId), {
          versions: updatedVersions,
          currentVersion: nextVersion,
          hashtags: livingHashtags,
          // نحدّث الصورة الرئيسية للفيد إذا في صورة جديدة
          ...(validUrls[0] ? { imageUrl: validUrls[0], imageUrls: validUrls } : {}),
        });
        const drafts = getDrafts().filter((d: any) => d.id !== "current");
        saveDrafts(drafts);
        onPost();
        toast(`✓ تم نشر الإصدار v${nextVersion}`, "success");
        return;
      }

      // ── Normal create / edit ─────────────────────────────────────────────
      const hashtags = extractHashtagsFromPost({ title: cleanTitle, body: cleanBody });
      const commDocId = isProfileTarget ? "" : community.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, "").toLowerCase();
      const postData = {
        title: cleanTitle,
        body: cleanBody,
        hashtags,
        imageUrl: validUrls[0] || "",
        imageUrls: validUrls,
        linkUrl: "",
        videoUrl: derivedVideoUrl,
        // Store mediaItems order for carousel
        mediaItems: validMedia.map(m => ({ type: m.type, url: m.url.trim() })),
        community: isProfileTarget ? "" : community,
        communityDocId: commDocId,
        postTarget: isProfileTarget ? PROFILE_POST_TARGET : "community",
        flair,
        flairBg: communityFlairs.find(f => f.text === flair)?.bg || null,
        flairTextColor: communityFlairs.find(f => f.text === flair)?.textColor || null,
        isNsfw,
        isSpoiler,
        poll: pollPayload,
        postType: pollPayload ? "poll" : isLiving ? "living" : "post",
        isLiving: isLiving || false,
        ...(isLiving && !editPostId && validUrls[0] ? {
          versions: [{
            version: 1,
            imageUrl: validUrls[0],
            changelog: "الإصدار الأول",
            mentions: [],
            publishedAt: new Date().toISOString(),
            authorName: user.displayName || "مستخدم",
          }],
          currentVersion: 1,
        } : {}),
      };
      if (editPostId) {
        await updateDoc(doc(db, "posts", editPostId), postData);
      } else {
        await addDoc(collection(db, "posts"), {
          ...postData,
          authorName: user.displayName || "مستخدم",
          authorPhoto: user.photoURL || "",
          authorUid: user.uid,
          votes: 0,
          commentCount: 0,
          createdAt: new Date().toISOString(),
          ...(quotedPostId ? { quotedPostId } : {}),
        });
        await updateDoc(doc(db, "users", user.uid), {
          postCount: increment(1),
          xp: increment(3),
        }).catch(() => {});
      }
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
    <>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {livingPostId ? (
          <button onClick={onBack} className="flex items-center gap-1.5 text-nf-dim hover:text-nf-text text-[12px] transition-colors shrink-0">
            <ArrowRight size={16} />
            العودة للمنشور
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end ms-auto">
          <button
            type="button"
            title={showPreview ? "العودة للتحرير" : "معاينة المنشور"}
            onClick={() => {
              if (!showPreview) {
                const md = editorRef.current?.flush() ?? body;
                setPreviewBody(md);
                setShowPreview(true);
              } else {
                setShowPreview(false);
              }
            }}
            className={cn(
              "inline-flex items-center px-3 py-2 rounded-lg text-[11px] font-semibold border transition-colors",
              showPreview
                ? "bg-nf-hover/80 text-nf-text border-nf-border-2/50"
                : "text-nf-dim border-nf-border-2/40 hover:bg-nf-hover/50 hover:text-nf-text"
            )}
          >
            {showPreview ? "تحرير" : "معاينة"}
          </button>
          {draftSaved && !editPostId && !livingPostId && (
            <span className="text-[9px] text-green-400">تم الحفظ</span>
          )}
          {!livingPostId && (
            <button onClick={saveNamedDraft} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-nf-dim hover:bg-nf-hover hover:text-nf-text transition-all duration-200">
              مسودة
            </button>
          )}
          {!livingPostId && (
            <button onClick={openDraftsModal} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-nf-dim hover:bg-nf-hover hover:text-nf-text transition-all duration-200">
              المسودات
            </button>
          )}
          <button onClick={handleSubmit} disabled={(!livingPostId && !title.trim()) || (flairRequired && !flair) || submitting}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-nf-accent text-nf-primary hover:bg-nf-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
            {submitting
              ? (livingPostId ? "جاري النشر..." : editPostId ? "جاري التحديث..." : t("cp.publishing"))
              : (livingPostId ? `نشر إصدار جديد` : editPostId ? "تحديث" : t("cp.publish"))
            }
          </button>
        </div>
      </div>

      {/* Living upgrade banner */}
      {livingPostId && (
        <div className="mb-4 px-4 py-3 rounded border border-nf-accent/25 bg-nf-secondary/30">
          <p className="text-[12px] font-semibold text-nf-accent mb-0.5">إصدار جديد للمنشور الحي</p>
          <p className="text-[11px] text-nf-dim leading-relaxed">
            اكتب محتوى الإصدار الجديد — العنوان والنص والصورة كلها اختيارية.
          </p>
          {livingVersions && livingVersions.length > 0 && (
            <p className="text-[10px] text-nf-dim mt-1.5">
              الإصدار الحالي: v{livingVersions[livingVersions.length - 1]?.version ?? 1}
              {" → "}
              v{(livingVersions[livingVersions.length - 1]?.version ?? 0) + 1}
            </p>
          )}
        </div>
      )}

      {/* Quote preview - full mini post card */}
      {quotedPostData && (
        <div className="mb-3 rounded-lg border border-nf-border-2/40 bg-nf-secondary overflow-hidden">
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
            {quotedPostData.title && <h3 className="text-[16px] font-bold text-nf-text-2/80 leading-snug mb-1">{quotedPostData.title}</h3>}
            {quotedPostData.body && <p className="text-sm text-nf-text-2/80 leading-relaxed line-clamp-4">{quotedPostData.body}</p>}
            {quotedPostData.imageUrl && <img src={quotedPostData.imageUrl} alt="" className="mt-2 rounded max-h-[120px] w-auto object-cover" />}
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-nf-border-2/30">
            <span className="text-[10px] text-nf-dim flex items-center gap-1"><Quote size={10} />سيتم اقتباس هذا المنشور</span>
            <button onClick={() => setQuotedPostData(null)} className="text-[10px] text-nf-dim hover:text-red-400 flex items-center gap-1 transition-colors"><X size={10} />إزالة</button>
          </div>
        </div>
      )}

      {showPreview && (
        /* Preview mode — نفس شكل بطاقة المنشور في الفيد */
        <div className="rounded-lg border border-nf-border-2/30 overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 text-[12px] mb-2 flex-wrap">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-nf-secondary flex items-center justify-center text-[10px] font-bold text-nf-muted shrink-0">
                  {(user?.displayName || "U")[0]}
                </div>
              )}
              <span className="font-semibold text-nf-accent">
                {isProfileTarget ? `u/${profileHandle}` : `n/${community}`}
              </span>
              <span className="text-nf-dim">·</span>
              <span className="text-nf-muted">u/{user?.displayName || "مستخدم"}</span>
              {flair && (() => {
                const cf = communityFlairs.find((f) => f.text === flair);
                return cf ? (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: cf.bg, color: cf.textColor }}
                  >
                    {flair}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent text-[10px]">{flair}</span>
                );
              })()}
              {isNsfw && (
                <span className="text-[9px] font-semibold text-red-400/80">NSFW</span>
              )}
              {isSpoiler && (
                <span className="text-[9px] font-semibold text-nf-dim">Spoiler</span>
              )}
            </div>

            {(title || "").trim() ? (
              <h3
                className="text-[16px] font-bold text-nf-text nf-bidi-text mb-2 leading-snug"
                dir={textDirAttr(title)}
              >
                <PostHashtagText text={title} />
              </h3>
            ) : (
              <p className="text-[13px] text-nf-dim mb-2 italic">بدون عنوان</p>
            )}

            {hasMeaningfulPreviewBody(previewBody || body) ? (
              <div className="nf-post-body nf-bidi-text text-sm text-nf-text-2 leading-relaxed mb-2" dir="auto">
                <PostBodyContent text={previewBody || body} />
              </div>
            ) : (previewBody || body || "").trim() ? (
              <p className="text-[12px] text-nf-dim italic mb-2">
                لا يوجد نص بعد — الخط الفاصل أو الهاشتاق وحده لا يظهر كمنشور في الفيد
              </p>
            ) : null}

            {mediaItems
              .filter((m) => m.url.trim())
              .map((item, i) => (
                <div key={`${item.type}-${i}`} className="rounded-lg overflow-hidden mb-2 border border-nf-border-2/30 bg-nf-secondary/20">
                  {item.type === "image" ? (
                    <NsfwMediaCover
                      blurred={isNsfw || isSpoiler}
                      isNsfw={isNsfw}
                      isSpoiler={isSpoiler}
                      className="rounded-lg"
                    >
                      <FeedMediaFrame
                        src={item.url.trim()}
                        alt=""
                        maxHeight="360px"
                      />
                    </NsfwMediaCover>
                  ) : (
                    <a
                      href={item.url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-nf-accent hover:bg-nf-hover transition-colors"
                    >
                      <Play size={12} className="shrink-0" />
                      <span className="truncate">{item.url.trim()}</span>
                    </a>
                  )}
                </div>
              ))}

            {(() => {
              const pollOpts = pollOptions.filter((o) => o.text.trim());
              const showPollBlock =
                pollOpts.length >= 2 ||
                composeTab === "poll" ||
                (showPoll && pollOptions.some((o) => o.text.trim() || o.imageUrl.trim()));
              if (!showPollBlock) return null;
              if (pollOpts.length < 2) {
                return (
                  <p className="text-[11px] text-nf-dim italic mt-2 pt-2 border-t border-nf-border-2/25">
                    أضف خيارين على الأقل في تبويب الاستطلاع
                  </p>
                );
              }
              return (
                <div className="mt-3 space-y-2 pt-2 border-t border-nf-border-2/25">
                  <p className="text-[12px] font-semibold text-nf-text mb-1">
                    استطلاع
                    <span className="text-[10px] font-normal text-nf-dim"> · {pollDurationLabel(pollDuration)}</span>
                  </p>
                  {pollOpts.map((opt, i) => (
                    <div
                      key={i}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-nf-border-2/50 text-right"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-nf-border-2/60 shrink-0" />
                      {opt.imageUrl.trim() && (
                        <img src={opt.imageUrl.trim()} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                      )}
                      <span className="text-[13px] text-nf-text flex-1">{opt.text}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-nf-dim">0 صوت · معاينة قبل النشر</p>
                </div>
              );
            })()}
          </div>
          <div className="px-3 py-2 border-t border-nf-border-2/30 text-[10px] text-nf-dim">
            معاينة — هكذا سيظهر المنشور في الفيد
          </div>
        </div>
      )}

      {/* Edit mode — يبقى في DOM مخفياً أثناء المعاينة حتى لا يُكسر كود الـ pre */}
      <div className={cn("space-y-3", showPreview && "hidden")}>
          {/* Community selector + flair row — hidden for living upgrade */}
          {!livingPostId && <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <button type="button" onClick={() => { setShowCommDrop(!showCommDrop); setShowFlairDrop(false); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-full border border-nf-border-2 bg-transparent text-[13px] text-nf-text hover:border-nf-border-2/80 transition-colors w-full justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isProfileTarget ? (
                    user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-nf-accent/25 flex items-center justify-center text-[9px] text-nf-accent font-bold shrink-0">u</span>
                    )
                  ) : (() => {
                    const c = comms.find((x) => x.name === community);
                    return c?.img ? (
                      <img src={c.img} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-nf-border flex items-center justify-center text-[8px] text-nf-muted font-bold shrink-0">n/</span>
                    );
                  })()}
                  <span className="font-semibold truncate">
                    {isProfileTarget ? `u/${profileHandle}` : comms.find((x) => x.name === community)?.label}
                  </span>
                </div>
                <ChevronDown size={14} className={cn("text-nf-muted shrink-0 transition-transform", showCommDrop && "rotate-180")} />
              </button>
              <AnimatePresence>
                {showCommDrop && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-2 right-0 left-0 bg-nf-primary border border-nf-border-2 rounded-xl overflow-hidden z-30 shadow-lg">
                    <p className="px-3 pt-2.5 pb-1 text-[11px] font-bold text-nf-muted">انشر إلى</p>
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim" />
                        <input
                          type="text"
                          value={commPickerSearch}
                          onChange={(e) => setCommPickerSearch(e.target.value)}
                          placeholder="ابحث عن مجتمع..."
                          className="w-full rounded-full border border-nf-border-2 bg-transparent py-2 pr-9 pl-3 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-border"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <button type="button" onClick={() => { setCommunity(PROFILE_POST_COMMUNITY); setShowCommDrop(false); setCommPickerSearch(""); }}
                      className={cn("flex items-center gap-3 w-full px-3 py-2.5 text-right hover:bg-nf-hover transition-colors", isProfileTarget && "bg-nf-hover")}>
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-nf-accent/30 flex items-center justify-center text-[10px] text-nf-accent font-bold shrink-0">u</span>
                      )}
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-[13px] font-semibold text-nf-text">u/{profileHandle}</p>
                        <p className="text-[11px] text-nf-dim">صفحتك</p>
                      </div>
                    </button>
                    <div className="max-h-[220px] overflow-y-auto border-t border-nf-border-2">
                      {comms.length === 0 && !commPickerSearch.trim() ? (
                        <p className="px-3 py-4 text-[11px] text-nf-dim text-center">انضم لمجتمع أولاً لنشر فيه</p>
                      ) : comms
                        .filter((c) => {
                          const q = commPickerSearch.trim().toLowerCase();
                          if (!q) return true;
                          return c.name.toLowerCase().includes(q) || c.label.toLowerCase().includes(q);
                        })
                        .map((c) => (
                          <button key={c.name} type="button" onClick={() => { setCommunity(c.name); setShowCommDrop(false); setCommPickerSearch(""); }}
                            className={cn("flex items-center gap-3 w-full px-3 py-2.5 text-right hover:bg-nf-hover transition-colors", community === c.name && "bg-nf-hover")}>
                            {c.img ? (
                              <img src={c.img} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] text-nf-accent font-bold shrink-0">n/</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-nf-text">{c.label}</p>
                              {c.desc && <p className="text-[10px] text-nf-dim truncate">{c.desc}</p>}
                            </div>
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isProfileTarget && <div className="relative">
              <button type="button" onClick={() => { setShowFlairDrop(!showFlairDrop); setShowCommDrop(false); }}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] hover:bg-nf-hover transition-colors", flairRequired && !flair ? "bg-red-400/10 border border-red-400/30 text-red-400" : "bg-nf-secondary text-nf-muted hover:text-nf-text")}>
                {flair && communityFlairs.length > 0 ? (() => {
                  const cf = communityFlairs.find(f => f.text === flair);
                  return cf
                    ? <span style={{ background: cf.bg, color: cf.textColor, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{flair}</span>
                    : <span>{flair}</span>;
                })() : (
                  <span className={flairRequired && !flair ? "text-red-400 font-semibold" : ""}>
                    {flairRequired ? (flair || "اختر وسما *") : (flair || t("cp.addFlair"))}
                  </span>
                )}
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showFlairDrop && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-lg p-2 z-20 flex flex-wrap gap-1.5 min-w-[200px]">
                    {communityFlairs.length > 0 ? (
                      communityFlairs.map((cf) => (
                        <button key={cf.text} onClick={() => { setFlair(cf.text); setShowFlairDrop(false); }}
                          style={{ background: flair === cf.text ? cf.bg : undefined, color: flair === cf.text ? cf.textColor : undefined, border: `1px solid ${cf.bg}`, padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .1s" }}
                          className={cn("transition-all", flair !== cf.text && "bg-nf-secondary text-nf-muted hover:opacity-80")}>
                          {cf.text}
                        </button>
                      ))
                    ) : (
                      flairs.map((f) => (
                        <button key={f} onClick={() => { setFlair(f); setShowFlairDrop(false); }}
                          className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors", flair === f ? "bg-nf-accent text-nf-primary" : "bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-nf-text")}>
                          {f}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>}
          </div>}

          {/* Draft recovery banner */}
          {showDraftBanner && !showDrafts && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-nf-secondary/15 border border-nf-border-2/40"
            >
              <div className="flex items-center gap-2 text-[11px] text-nf-muted">
                <RotateCcw size={12} className="text-nf-dim" /> مسودة تلقائية
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadDraft}
                  className="px-2.5 py-0.5 rounded-md bg-nf-hover/80 text-nf-text text-[10px] font-semibold hover:bg-nf-hover transition-colors"
                >
                  استعادة
                </button>
                <button onClick={openDraftsModal} className="px-2 py-0.5 rounded-md text-nf-dim text-[10px] hover:text-nf-text hover:bg-nf-hover/50">
                  الكل
                </button>
                <button onClick={discardDraft} className="px-2 py-0.5 rounded-md text-nf-dim text-[10px] hover:text-red-400">
                  تجاهل
                </button>
              </div>
            </motion.div>
          )}

          <div className="nf-compose-plain space-y-3">
          <div className="nf-compose-field relative py-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={livingPostId ? "عنوان هذا الإصدار (اختياري)" : t("cp.title")}
              maxLength={300}
              className="w-full pe-12 py-0.5 text-[15px] font-bold text-nf-text placeholder:text-nf-dim/50"
            />
            <span
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-[9px] tabular-nums",
                title.length > 250 ? "text-red-400" : title.length > 150 ? "text-yellow-400" : "text-nf-dim"
              )}
            >
              {title.length}/300
            </span>
          </div>

          <div className="nf-compose-tabs">
            <button
              type="button"
              onClick={() => setComposeTab("text")}
              className={cn(
                "nf-compose-tab",
                composeTab === "text" ? "nf-compose-tab--active" : "nf-compose-tab--idle"
              )}
            >
              نص
            </button>
            <button
              type="button"
              onClick={() => setComposeTab("media")}
              className={cn(
                "nf-compose-tab",
                composeTab === "media" ? "nf-compose-tab--active" : "nf-compose-tab--idle"
              )}
            >
              صور وفيديو
            </button>
            <button
              type="button"
              onClick={() => {
                setComposeTab("poll");
                setShowPoll(true);
              }}
              className={cn(
                "nf-compose-tab",
                composeTab === "poll" ? "nf-compose-tab--active" : "nf-compose-tab--idle"
              )}
            >
              استطلاع
            </button>
          </div>

          <div className="min-h-[min(220px,45vh)]">
            {composeTab === "text" && (
              <div
                className={cn(
                  "nf-compose-field nf-compose-field--editor relative transition-colors",
                  isDragOver && "ring-1 ring-dashed ring-nf-border-2/60"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-nf-accent/10 rounded-xl z-10 pointer-events-none">
                    <div className="flex items-center gap-2 text-nf-accent text-[12px] font-bold">
                      <Image size={16} /> أفلت الصورة هنا أو استخدم تبويب «صور وفيديو»
                    </div>
                  </div>
                )}
                <RichContentEditor
                  ref={editorRef}
                  variant="post"
                  value={body}
                  onChange={setBody}
                  placeholder={t("cp.bodyPlaceholder")}
                  minHeight={isFullscreen ? 360 : 220}
                  className="bg-transparent border-0"
                />
              </div>
            )}

            {composeTab === "media" && (
              <div className="space-y-2">
                <p className="text-[10px] text-nf-dim leading-relaxed px-0.5">روابط الصور والفيديو — تظهر مع نص المنشور عند النشر.</p>
                <div className="space-y-2 max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain">
                  {mediaItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <span className="text-[10px] text-nf-dim/50 tabular-nums w-4 text-center shrink-0">{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...mediaItems];
                          updated[idx] = { ...updated[idx], type: item.type === "image" ? "video" : "image", url: "" };
                          setMediaItems(updated);
                        }}
                        className="shrink-0 text-[10px] text-nf-dim hover:text-nf-text transition-colors w-9"
                        title={item.type === "image" ? "صورة" : "فيديو"}
                      >
                        {item.type === "image" ? "صورة" : "فيديو"}
                      </button>
                      <div className="nf-compose-field flex-1 min-w-0 py-1.5">
                      <input
                        type="url"
                        dir="ltr"
                        value={item.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          const isVid = item.type === "video";
                          const normalized = normalizeGoogleDriveLink(val, isVid);
                          const updated = [...mediaItems];
                          updated[idx] = { ...updated[idx], url: normalized };
                          setMediaItems(updated);
                        }}
                        placeholder={item.type === "image" ? "https://example.com/image.jpg" : "https://youtube.com/..."}
                        className="text-[11px] text-nf-text placeholder:text-nf-dim/40"
                      />
                      </div>
                      <div className="flex flex-col shrink-0">
                        <button type="button" disabled={idx === 0} onClick={() => reorderMedia(idx, idx - 1)} className="p-0.5 text-nf-dim hover:text-nf-text disabled:opacity-20"><ChevronUp size={12} /></button>
                        <button type="button" disabled={idx === mediaItems.length - 1} onClick={() => reorderMedia(idx, idx + 1)} className="p-0.5 text-nf-dim hover:text-nf-text disabled:opacity-20"><ChevronDown size={12} /></button>
                      </div>
                      {mediaItems.length > 1 && (
                        <button type="button" onClick={() => setMediaItems(mediaItems.filter((m) => m.id !== item.id))} className="p-1 text-nf-dim/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {mediaItems.length < 8 && (
                  <div className="flex items-center gap-4 pt-2">
                    <button type="button" onClick={() => setMediaItems([...mediaItems, { id: newMediaId(), type: "image", url: "" }])} className="text-[10px] text-nf-dim hover:text-nf-text transition-colors">
                      + إضافة صورة
                    </button>
                    <button type="button" onClick={() => setMediaItems([...mediaItems, { id: newMediaId(), type: "video", url: "" }])} className="text-[10px] text-nf-dim hover:text-nf-text transition-colors">
                      + إضافة فيديو
                    </button>
                    <button type="button" disabled className="text-[10px] text-nf-dim/40 transition-colors flex items-center gap-1 cursor-not-allowed"
                      style={{ display: user?.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2" || user?.uid === "OUJAuK34FoTpFyJqgOVjCH9c4Kf1" ? "inline-flex" : "none" }}>
                      📂 قريباً — Google Drive
                    </button>
                  </div>
                )}
              </div>
            )}

            {composeTab === "poll" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <p className="text-[10px] text-nf-dim leading-relaxed">أضف خيارات التصويت. يمكنك إرفاق صورة لكل خيار.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPoll(false);
                      setComposeTab("text");
                    }}
                    className="text-[10px] text-nf-dim hover:text-nf-text shrink-0 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-medium text-nf-dim">الخيار {idx + 1}</span>
                      {pollOptions.length > 2 && (
                        <button type="button" onClick={() => removePollOption(idx)} className="text-[10px] text-nf-dim hover:text-red-400">
                          حذف
                        </button>
                      )}
                    </div>
                    <div className="nf-compose-field py-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updatePollOption(idx, "text", e.target.value)}
                      placeholder="نص الخيار"
                      className="text-[12px] text-nf-text placeholder:text-nf-dim/40"
                    />
                    </div>
                    <div className="nf-compose-field py-2">
                    <input
                      type="url"
                      dir="ltr"
                      value={opt.imageUrl}
                      onChange={(e) => updatePollOption(idx, "imageUrl", e.target.value)}
                      placeholder="https://… صورة الخيار (اختياري)"
                      className="text-[10px] text-nf-text placeholder:text-nf-dim/35"
                    />
                    </div>
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button type="button" onClick={addPollOption} className="text-[10px] text-nf-dim hover:text-nf-text transition-colors px-0.5">
                    + إضافة خيار
                  </button>
                )}
                <div className="flex items-center gap-2 pt-1 px-0.5">
                  <label htmlFor="poll-duration" className="text-[10px] text-nf-dim shrink-0">
                    مدة التصويت
                  </label>
                  <ComposeSelect
                    id="poll-duration"
                    value={pollDuration}
                    onChange={setPollDuration}
                    options={[
                      { value: "24h", label: pollDurationLabel("24h") },
                      { value: "3d", label: pollDurationLabel("3d") },
                      { value: "1w", label: pollDurationLabel("1w") },
                    ]}
                    className="min-w-[7rem]"
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Tags row */}
          <div className="nf-compose-tabs mt-2">
            <button
              type="button"
              onClick={() => setIsNsfw(!isNsfw)}
              className={cn(
                "nf-compose-tab",
                isNsfw ? "nf-compose-tab--active" : "nf-compose-tab--idle"
              )}
            >
              NSFW
            </button>
            <button
              type="button"
              onClick={() => setIsSpoiler(!isSpoiler)}
              className={cn(
                "nf-compose-tab",
                isSpoiler ? "nf-compose-tab--active" : "nf-compose-tab--idle"
              )}
            >
              Spoiler
            </button>
            {!editPostId && !livingPostId && (
              <button
                type="button"
                onClick={() => setIsLiving(!isLiving)}
                className={cn(
                  "nf-compose-tab",
                  isLiving ? "nf-compose-tab--active" : "nf-compose-tab--idle"
                )}
                title="منشور حي — يمكنك تحديث الصورة ورفع إصدارات جديدة لاحقاً"
              >
                منشور حي
              </button>
            )}
            {livingPostId && (
              <span className="nf-compose-tab nf-compose-tab--active opacity-80 cursor-default">
                إصدار جديد
              </span>
            )}
          </div>

          {isLiving && !editPostId && !livingPostId && (
            <div className="rounded-lg px-3 py-2.5 bg-nf-secondary/15 border border-nf-border-2/40">
              <div className="flex items-start gap-2.5">
                <GitBranch size={14} className="text-nf-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-nf-text">منشور حي — كيف يعمل؟</p>
                  <p className="text-[10px] text-nf-dim leading-relaxed mt-1">
                    بعد النشر يمكنك رفع إصدارات جديدة (v2، v3…) مع سجل تغييرات لكل إصدار.
                    <span className="text-nf-text"> الصورة الأولى في تبويب «صور وفيديو» = الإصدار v1.</span>
                    {" "}يمكنك تحديث الصورة والنص لاحقاً دون حذف المنشور.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Living upgrade: Changelog — نفس شكل نص المنشور ── */}
          {livingPostId && (
            <div>
              <label className="text-[12px] font-semibold text-nf-muted flex items-center gap-1.5 mb-2">
                <GitBranch size={12} className="text-nf-accent/80" />
                سجل التغييرات
                <span className="font-normal text-nf-dim">— ماذا تغيّر؟ (اختياري)</span>
              </label>
              <div className="nf-compose-field min-h-[min(180px,32vh)] flex flex-col">
                <textarea
                  value={livingChangelog}
                  onChange={(e) => setLivingChangelog(e.target.value)}
                  placeholder={"- أصلحت الألوان\n- حسّنت الخط\n- أضفت تفاصيل جديدة"}
                  maxLength={500}
                  className="w-full flex-1 min-h-[min(160px,28vh)] px-3 py-2.5 text-[15px] text-nf-text placeholder:text-nf-dim/50 bg-transparent border-0 outline-none resize-none leading-relaxed"
                />
                <span
                  className={cn(
                    "text-[9px] tabular-nums text-left px-3 pb-2",
                    livingChangelog.length > 450 ? "text-red-400" : "text-nf-dim"
                  )}
                >
                  {livingChangelog.length}/500
                </span>
              </div>
            </div>
          )}

          {(isNsfw || isSpoiler) && (
            <div className="flex items-center gap-2 text-[9px] text-nf-dim px-0.5">
              {isNsfw && <span className="text-red-400/70">NSFW</span>}
              {isSpoiler && <span>Spoiler</span>}
            </div>
          )}
      </div>
    </motion.div>

    {typeof document !== "undefined" &&
      createPortal(
        <AnimatePresence>
          {showDrafts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
              dir="rtl"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/70"
                aria-label="إغلاق"
                onClick={() => setShowDrafts(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="nf-drafts-title"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.12 }}
                className="relative w-full max-w-[400px] rounded-xl overflow-hidden border border-[#343536] bg-[#1a1a1b]"
                style={{ boxShadow: "none" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#343536]"
                >
                  <h2 id="nf-drafts-title" className="text-[13px] font-bold text-nf-text">
                    المسودات
                    <span className="text-nf-dim font-medium tabular-nums ms-1.5">
                      {savedDrafts.length}/{MAX_DRAFTS}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowDrafts(false)}
                    className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors"
                    aria-label="إغلاق"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-[min(400px,52vh)] overflow-y-auto py-1">
                  {autoDraft && (
                    <button
                      type="button"
                      className="w-full text-start px-4 py-2.5 hover:bg-nf-hover transition-colors border-b border-[#343536]/80"
                      onClick={() => {
                        loadDraft();
                        setShowDrafts(false);
                      }}
                    >
                      <p className="text-[13px] font-semibold text-nf-text truncate">
                        {draftLabel(autoDraft)}
                      </p>
                      <p className="text-[10px] text-nf-dim mt-0.5">
                        مسودة تلقائية · {draftMeta(autoDraft)}
                      </p>
                    </button>
                  )}

                  {savedDrafts.length === 0 && !autoDraft ? (
                    <p className="text-center text-[11px] text-nf-dim py-10 px-4">لا مسودات محفوظة</p>
                  ) : (
                    <ul>
                      {savedDrafts.map((d: any) => (
                        <li key={d.id} className="border-b border-[#343536]/50 last:border-0">
                          <div className="flex items-center gap-0.5 hover:bg-nf-hover transition-colors">
                            <button
                              type="button"
                              className="flex-1 min-w-0 text-start px-4 py-2.5"
                              onClick={() => {
                                if (renamingId === d.id) return;
                                loadNamedDraft(d.id);
                              }}
                            >
                              {renamingId === d.id ? (
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter") commitDraftRename(d.id);
                                    if (e.key === "Escape") {
                                      setRenamingId(null);
                                      setRenameValue("");
                                    }
                                  }}
                                  onBlur={() => commitDraftRename(d.id)}
                                  placeholder="اسم اختياري"
                                  className="w-full bg-nf-secondary border border-[#343536] rounded-lg px-2.5 py-1.5 text-[12px] text-nf-text outline-none focus:border-[#818384]"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <p className="text-[13px] font-semibold text-nf-text truncate">
                                    {draftLabel(d)}
                                  </p>
                                  <p className="text-[10px] text-nf-dim mt-0.5 truncate">{draftMeta(d)}</p>
                                </>
                              )}
                            </button>
                            {renamingId !== d.id && (
                              <div className="flex items-center shrink-0 pe-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingId(d.id);
                                    setRenameValue(d.name || "");
                                  }}
                                  className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-secondary transition-colors"
                                  title="تسمية"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNamedDraft(d.id);
                                  }}
                                  className="p-1.5 rounded-lg text-nf-dim hover:text-red-400 hover:bg-nf-secondary transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
