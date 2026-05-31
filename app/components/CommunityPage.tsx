"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, LogIn, Clock, TrendingUp, Search, X, Shield, Tag, Link2, Plus, Copy, Check, UserCog, ChevronDown, Crown, MoreVertical, BellOff, Hash } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, deleteDoc, getCountFromServer, addDoc, onSnapshot } from "firebase/firestore";
import { setCommunityFavorite, setCommunityMuted, addCommunityToCustomFeed } from "@/lib/user-community-prefs";
import { db } from "@/lib/firebase";
import PostCard from "./PostCard";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import { postMatchesHashtag, interestTagsFromHashtag } from "@/lib/hashtags";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";
import CommunityMembersPanel from "./CommunityMembersPanel";
import type { CustomFeed } from "./CustomFeedModal";
import { resolveCategoryDisplay } from "@/lib/community-categories";
import { textDirAttr } from "@/lib/display-text";
import { trackImplicitInterest } from "@/lib/implicit-interest";
import {
  addUserInterests,
  interestTagsFromCommunityData,
  mergeInterestsOrdered,
  normalizeInterestTag,
  saveSubscriptionInterests,
} from "@/lib/user-interests";

const MATURE_STORAGE_PREFIX = "nf-mature-confirmed-";

// Render **bold** and [text](url) markdown inline
function renderRichText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    if (m[1] !== undefined) parts.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2] && m[3]) parts.push(<a key={k++} href={m[3]} target="_blank" rel="noopener noreferrer" className="text-nf-accent underline underline-offset-2">{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

function getLinkIcon(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#FF0000] inline-block">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.003 3.003 0 0 0-2.11 2.107C0 8.053 0 12 0 12s0 3.947.502 5.837a3.003 3.003 0 0 0 2.11 2.107c1.883.511 9.388.511 9.388.511s7.505 0 9.388-.511a3.003 3.003 0 0 0 2.11-2.107C24 15.947 24 12 24 12s0-3.947-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#1DA1F2] inline-block">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    );
  }
  if (lower.includes("github.com")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-neutral-300 inline-block">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    );
  }
  if (lower.includes("facebook.com")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#1877F2] inline-block">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    );
  }
  if (lower.includes("instagram.com")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-[#E4405F] inline-block">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    );
  }
  if (lower.includes("linkedin.com")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#0A66C2] inline-block">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    );
  }
  if (lower.includes("twitch.tv")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#9146FF] inline-block">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
    );
  }
  if (lower.includes("discord")) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#5865F2] inline-block">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
      </svg>
    );
  }
  return <Link2 size={12} className="shrink-0 text-nf-accent inline-block" />;
}

interface CommunityPageProps {
  name: string;
  onBack: () => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  onPostClick?: (id: string) => void;
  onJoinToggle?: (name: string, joined: boolean) => void;
  onDashboardClick?: (name: string) => void;
  onMembersClick?: (name: string) => void;
  onModPanelClick?: (name: string) => void;
  customFeeds?: CustomFeed[];
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
  onSidebarRefresh?: () => void;
}

export default function CommunityPage({ name, onBack, onEditClick, onDeleteClick, onPostClick, onJoinToggle, onDashboardClick, onMembersClick, onModPanelClick, customFeeds = [], showToast, onSidebarRefresh }: CommunityPageProps) {
  const { user } = useAuth();
  const { userInterests, pushUserInterests } = useData();
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);
  const { t } = useI18n();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [sortMode, setSortMode] = useState<"new" | "top" | "comments">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbMeta, setDbMeta] = useState<any>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [moderators, setModerators] = useState<{ uid: string; name: string; photo: string; role: string }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showFeedSubmenu, setShowFeedSubmenu] = useState(false);
  const [matureConfirmed, setMatureConfirmed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [menuBusy, setMenuBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
        setShowFeedSubmenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMatureConfirmed(localStorage.getItem(`${MATURE_STORAGE_PREFIX}${name}`) === "1");
  }, [name]);

  useEffect(() => {
    if (!user) { setIsFavorite(false); setIsMuted(false); return; }
    const unsubFav = onSnapshot(doc(db, "users", user.uid, "communities", name), s => {
      setIsFavorite(s.exists() && !!s.data().isFavorite);
    }, () => setIsFavorite(false));
    const unsubMute = onSnapshot(doc(db, "users", user.uid), s => {
      if (!s.exists()) { setIsMuted(false); return; }
      const muted: string[] = s.data().mutedCommunities || [];
      setIsMuted(muted.some(m => m.toLowerCase() === name.toLowerCase()));
    }, () => setIsMuted(false));
    return () => { unsubFav(); unsubMute(); };
  }, [user?.uid, name]);

  const toast = (msg: string, type: "success" | "error" | "info" = "info") => showToast?.(msg, type);

  const confirmMature = () => {
    localStorage.setItem(`${MATURE_STORAGE_PREFIX}${name}`, "1");
    setMatureConfirmed(true);
  };

  const toggleFavorite = async () => {
    if (!user) { toast("سجّل الدخول أولاً", "error"); return; }
    setMenuBusy(true);
    try {
      const next = !isFavorite;
      await setCommunityFavorite(user.uid, name, next);
      setIsFavorite(next);
      toast(next ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة", "success");
      onSidebarRefresh?.();
    } catch (e) {
      console.error(e);
      toast("تعذّر تحديث المفضلة", "error");
    }
    setMenuBusy(false);
    setShowOptionsMenu(false);
  };

  const toggleMute = async () => {
    if (!user) { toast("سجّل الدخول أولاً", "error"); return; }
    setMenuBusy(true);
    try {
      const next = !isMuted;
      await setCommunityMuted(user.uid, name, next);
      setIsMuted(next);
      toast(
        next
          ? `تم كتم n/${name} — المنشورات الجديدة لن تظهر في الصفحة الرئيسية (القديمة وصفحة المجتمع والخلاصات المخصصة تبقى)`
          : "لم يعد المجتمع مكتوماً",
        "success"
      );
      onSidebarRefresh?.();
    } catch (e) {
      console.error(e);
      toast("تعذّر تحديث الكتم", "error");
    }
    setMenuBusy(false);
    setShowOptionsMenu(false);
  };

  const handleAddToCustomFeed = async (feedId: string) => {
    if (!user) { toast("سجّل الدخول أولاً", "error"); return; }
    setMenuBusy(true);
    try {
      const result = await addCommunityToCustomFeed(user.uid, feedId, name);
      if (result === "added") toast("أُضيف إلى الخلاصة المخصصة", "success");
      else if (result === "exists") toast("المجتمع موجود بالفعل في هذه الخلاصة", "info");
      else toast("الخلاصة غير موجودة", "error");
    } catch (e) {
      console.error(e);
      toast("تعذّر الإضافة للخلاصة", "error");
    }
    setMenuBusy(false);
    setShowOptionsMenu(false);
    setShowFeedSubmenu(false);
  };

  useEffect(() => {
    const handleFilterTag = (e: Event) => {
      const tag = (e as CustomEvent).detail;
      setSelectedTag(tag);
    };
    window.addEventListener("nf-filter-tag", handleFilterTag);
    return () => window.removeEventListener("nf-filter-tag", handleFilterTag);
  }, []);

  useEffect(() => {
    const isPreview = typeof window !== "undefined" && window.location.search.includes("preview=true");
    setIsPreviewMode(isPreview);
    if (isPreview) {
      const saved = localStorage.getItem("nf-community-preview");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name === name) {
            setDbMeta({
              name: parsed.name,
              label: `n/${parsed.name}`,
              shortDesc: parsed.shortDesc,
              desc: parsed.desc,
              img: parsed.logoUrl || parsed.img,
              banner: parsed.bannerUrl || parsed.banner,
              category: parsed.category,
              rules: parsed.rules,
              tags: parsed.tags,
              bookmarks: parsed.bookmarks,
              founded: parsed.founded || new Date().getFullYear().toString(),
              communityType: parsed.communityType || "public",
              memberCount: parsed.memberCount || 1,
            });
            return;
          }
        } catch (e) {
          console.error("Error parsing community preview", e);
        }
      }
    }

    getDoc(doc(db, "communities", name)).then(snap => {
      if (snap.exists()) setDbMeta(snap.data());
    }).catch(() => {});
  }, [name]);

  useEffect(() => {
    if (!user?.uid || !name || !dbMeta) return;
    trackImplicitInterest(
      "community",
      name,
      interestTagsFromCommunityData(dbMeta as Record<string, unknown>),
      user.uid
    );
  }, [user?.uid, name, dbMeta]);

  // Fetch moderators (owner + admin + moderator)
  useEffect(() => {
    (async () => {
      try {
        const commSnap = await getDoc(doc(db, "communities", name)).catch(() => null);
        const creatorUid = commSnap?.data()?.creatorUid || "";
        const snap = await getDocs(collection(db, "communities", name, "members"));
        const list: { uid: string; name: string; photo: string; role: string }[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          const role = d.id === creatorUid ? "owner" : (data.role || "member");
          if (role === "owner" || role === "admin" || role === "moderator") {
            // Only show if showInModerators is true (owner always shows)
            const showInMods = role === "owner" ? true : (data.showInModerators !== false);
            if (!showInMods) continue;
            let uName = data.displayName || "";
            let uPhoto = data.photoURL || "";
            if (!uName) {
              const uSnap = await getDoc(doc(db, "users", d.id)).catch(() => null);
              if (uSnap?.exists()) { uName = uSnap.data().displayName || ""; uPhoto = uSnap.data().photoURL || ""; }
            }
            list.push({ uid: d.id, name: uName || d.id.slice(0, 8), photo: uPhoto, role });
          }
        }
        // Sort: owner first
        list.sort((a, b) => {
          const order: Record<string, number> = { owner: 0, admin: 1, moderator: 2 };
          return (order[a.role] ?? 3) - (order[b.role] ?? 3);
        });
        setModerators(list);
      } catch {}
    })();
  }, [name]);

  const meta = dbMeta || { img: "", banner: "", desc: "", shortDesc: "", rules: [], tags: [], bookmarks: [], stats: [] };
  const isMatureCommunity = !!meta.isMature;
  const showMatureGate = isMatureCommunity && !matureConfirmed && !isPreviewMode;
  const categoryLabel = resolveCategoryDisplay(meta.category);
  const isOwner = user?.uid === meta.creatorUid;
  const isRestricted = meta.communityType === "restricted";
  const isPrivate = meta.communityType === "private";
  const needsInvite = isPrivate || isRestricted;

  // Check if current user is staff — runs independently of dbMeta
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => {
    if (!user) { setIsStaff(false); return; }
    // Check creatorUid directly from Firestore
    getDoc(doc(db, "communities", name)).then(commSnap => {
      if (!commSnap.exists()) return;
      if (user.uid === commSnap.data().creatorUid) { setIsStaff(true); return; }
      getDoc(doc(db, "communities", name, "members", user.uid)).then(s => {
        if (s.exists()) {
          const role = s.data().role;
          setIsStaff(role === "admin" || role === "moderator");
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [user?.uid, name]);

  useEffect(() => {
    if (!user) { setJoined(false); return; }
    getDoc(doc(db, "communities", name, "members", user.uid)).then(s => setJoined(s.exists())).catch(() => {});
  }, [user?.uid, name]);

  useEffect(() => {
    getCountFromServer(collection(db, "communities", name, "members")).then(s => setMemberCount(s.data().count)).catch(() => {});
  }, [name]);

  // Generate invite link
  useEffect(() => {
    if (needsInvite && isOwner) {
      const token = btoa(`${name}:${Date.now()}`);
      setInviteLink(`${typeof window !== "undefined" ? window.location.origin : ""}/app?invite=${token}&community=${name}`);
    }
  }, [name, needsInvite, isOwner]);

  const toggleJoin = async () => {
    if (!user) return;
    // Owner can never leave their own community
    if (isOwner) return;
    // Private community: only via invite
    if (isPrivate && !joined) return;
    const prevJoined = joined;
    setJoined(!prevJoined);
    try {
      const memberRef = doc(db, "communities", name, "members", user.uid);
      const userCommRef = doc(db, "users", user.uid, "communities", name);
      if (prevJoined) {
        await Promise.all([deleteDoc(memberRef), deleteDoc(userCommRef)]);
      } else {
        await Promise.all([
          setDoc(memberRef, { uid: user.uid, joinedAt: new Date().toISOString() }),
          setDoc(userCommRef, { name, joinedAt: new Date().toISOString() })
        ]);
        const tags = interestTagsFromCommunityData(dbMeta as Record<string, unknown>);
        void saveSubscriptionInterests(
          user.uid,
          dbMeta as Record<string, unknown>,
          mergeInterestsOrdered(userInterests, tags)
        );
      }
      onJoinToggle?.(name, !prevJoined);
      getCountFromServer(collection(db, "communities", name, "members"))
        .then((s) => {
          setMemberCount(s.data().count);
          window.dispatchEvent(new CustomEvent("nf-community-members-changed", { detail: name }));
        })
        .catch(() => {});
    } catch { setJoined(prevJoined); }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    try {
      await addDoc(collection(db, "invites"), {
        community: name,
        email: inviteEmail.trim(),
        invitedBy: user.uid,
        invitedByName: user.displayName || "مستخدم",
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      setInviteSent(true);
      setInviteEmail("");
      setTimeout(() => setInviteSent(false), 3000);
    } catch {}
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "posts"), where("community", "==", name), limit(30));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setPosts(docs);
      } catch {
        try {
          const q2 = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30));
          const snap2 = await getDocs(q2);
          setPosts(snap2.docs.filter(d => d.data().community === name).map(d => ({ id: d.id, ...d.data() })));
        } catch {}
      } finally { setLoading(false); }
    })();
  }, [name]);

  const handleHashtagClick = useCallback(
    (rawTag: string) => {
      const tag = normalizeInterestTag(rawTag);
      if (!tag) return;
      setHashtagFilter((prev) => (prev === tag ? null : tag));
      const tags = interestTagsFromHashtag(tag);
      pushUserInterests(tags);
      if (user) {
        void addUserInterests(user.uid, tags, mergeInterestsOrdered(userInterests, tags));
      }
    },
    [user, userInterests, pushUserInterests]
  );

  const filteredPosts = [...posts]
    .filter(p => !selectedTag || p.flair === selectedTag)
    .filter(p => !hashtagFilter || postMatchesHashtag(p, hashtagFilter))
    .filter(p => !searchQuery.trim() || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === "top") return (b.votes || 0) - (a.votes || 0);
      if (sortMode === "comments") return (b.commentCount || 0) - (a.commentCount || 0);
      return 0;
    });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      style={meta.accentColor ? { "--accent": meta.accentColor } as React.CSSProperties : {}}>

      {isPreviewMode && (
        <div className="bg-nf-secondary border border-nf-border-2 text-nf-muted py-3 px-4 rounded-xl text-center text-xs font-bold mb-3 flex items-center justify-center gap-2 relative z-50">
          <span>هذه معاينة للمجتمع قبل النشر (التعديلات غير محفوظة بعد). يمكنك رؤية الشكل والروابط والقوانين كيف ستظهر للزوار.</span>
        </div>
      )}

      {/* ── Banner ── */}
      <div className="relative h-[160px] sm:h-[240px] rounded-xl overflow-hidden mb-0">
        {meta.banner
          ? <img src={meta.banner} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        }
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-nf-body via-nf-body/40 to-transparent" />
      </div>

      {/* ── Header (overlaps banner) ── */}
      <div className="relative z-10 -mt-10 sm:-mt-14 px-2 mb-4">
        <div className="flex items-end gap-3 sm:gap-4 mb-3">
          {/* Avatar */}
          {meta.img
            ? <img src={meta.img} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-nf-body object-cover shrink-0 shadow-xl" />
            : <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-nf-body bg-gradient-to-br from-nf-accent/40 to-nf-secondary shadow-xl flex items-center justify-center text-nf-accent font-black text-lg shrink-0">n/</div>
          }
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] sm:text-[22px] font-black text-nf-text leading-tight">n/{name}</h1>
              {meta.communityType && meta.communityType !== "public" && (
                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border",
                  isPrivate ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30")}>
                  {isPrivate ? "🔒 خاص" : "👁 مقيد"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-nf-dim flex-wrap">
              <span className="flex items-center gap-1"><Users size={11} /><span className="font-bold text-nf-text">{memberCount.toLocaleString()}</span> عضو</span>
              <span className="flex items-center gap-1"><MessageSquare size={11} /><span className="font-bold text-nf-text">{posts.length}</span> منشور</span>
              {categoryLabel && <span className="text-nf-muted">{categoryLabel}</span>}
              {isMatureCommunity && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">+18</span>}
              {meta.founded && <span>تأسس {meta.founded}</span>}
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pb-1 flex-wrap justify-end">
            {user && isMuted && (
              <button
                type="button"
                onClick={toggleMute}
                disabled={menuBusy}
                title={`إلغاء كتم n/${name}`}
                className="p-2 rounded-full border border-nf-border-2 bg-nf-card text-nf-dim hover:text-nf-text hover:border-nf-border transition-colors"
                aria-label="إلغاء الكتم">
                <BellOff size={15} />
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button type="button"
                onClick={() => { setShowOptionsMenu(p => !p); setShowFeedSubmenu(false); }}
                className="p-2 rounded-full border border-nf-border-2 bg-nf-card text-nf-dim hover:text-nf-text hover:border-nf-border transition-colors"
                aria-label="خيارات المجتمع">
                <MoreVertical size={15} />
              </button>
              {showOptionsMenu && (
                <div
                  className="absolute left-0 top-full mt-1 min-w-[188px] rounded-md border border-nf-border-2 bg-nf-card z-[500] overflow-hidden py-0.5 shadow-lg"
                >
                  <button
                    type="button"
                    disabled={menuBusy}
                    onClick={() => setShowFeedSubmenu(p => !p)}
                    className="w-full px-3 py-1.5 text-[12px] text-nf-text hover:bg-nf-hover transition-colors text-right"
                  >
                    أضف إلى خلاصتك
                  </button>
                  {showFeedSubmenu && (
                    <div className="border-t border-nf-border-2 bg-nf-secondary/40 max-h-[140px] overflow-y-auto">
                      {!user ? (
                        <p className="px-3 py-1.5 text-[11px] text-nf-dim">سجّل الدخول أولاً</p>
                      ) : customFeeds.length === 0 ? (
                        <p className="px-3 py-1.5 text-[11px] text-nf-dim">أنشئ خلاصة من الشريط الجانبي</p>
                      ) : (
                        customFeeds.map(feed => (
                          <button
                            key={feed.id}
                            type="button"
                            disabled={menuBusy}
                            onClick={() => handleAddToCustomFeed(feed.id)}
                            className="w-full text-right px-3 py-1.5 text-[11px] text-nf-text hover:bg-nf-hover truncate"
                          >
                            {feed.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={menuBusy}
                    onClick={toggleFavorite}
                    className="w-full px-3 py-1.5 text-[12px] text-nf-text hover:bg-nf-hover transition-colors text-right border-t border-nf-border-2"
                  >
                    {isFavorite ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
                  </button>
                  <button
                    type="button"
                    disabled={menuBusy}
                    onClick={toggleMute}
                    className="w-full px-3 py-1.5 text-[12px] text-nf-text hover:bg-nf-hover transition-colors text-right border-t border-nf-border-2"
                  >
                    {isMuted ? `إلغاء كتم إشعارات n/${name}` : `كتم إشعارات n/${name}`}
                  </button>
                </div>
              )}
            </div>
            {onDashboardClick && (isOwner || isStaff) && (
              <button onClick={() => onDashboardClick(name)}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-nf-border-2 bg-nf-secondary text-nf-dim hover:text-nf-accent hover:border-nf-accent transition-all flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                <span className="hidden sm:inline">الإدارة</span>
              </button>
            )}
            {/* Invite button for owner/staff of restricted/private */}
            {(isOwner || isStaff) && needsInvite && (
              <button onClick={() => setShowInvitePanel(p => !p)}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-nf-accent/40 bg-nf-accent/10 text-nf-accent hover:bg-nf-accent/20 transition-all flex items-center gap-1.5">
                <Plus size={11} /> دعوة
              </button>
            )}
            {(isOwner || isStaff) && (
              <button onClick={() => onMembersClick?.(name)}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-nf-border-2 bg-nf-secondary text-nf-dim hover:text-nf-accent hover:border-nf-accent transition-all flex items-center gap-1.5">
                <UserCog size={11} /> الأعضاء
              </button>
            )}
            <button
              onClick={toggleJoin}
              disabled={isOwner}
              className={cn("px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all",
                isOwner ? "bg-nf-accent/10 text-nf-accent border-nf-accent/30 cursor-default"
                  : joined ? "bg-transparent text-nf-muted border-nf-border-2 hover:border-red-400/50 hover:text-red-400"
                  : isPrivate ? "bg-nf-secondary text-nf-dim border-nf-border-2 cursor-not-allowed opacity-50"
                  : "bg-nf-text text-nf-body border-nf-text hover:opacity-90")}>
              {!user ? <span className="flex items-center gap-1.5"><LogIn size={13} /> انضم</span>
                : isOwner ? "👑 مؤسس"
                : joined ? "✓ عضو"
                : isPrivate ? "🔒 خاص"
                : "انضم"}
            </button>
          </div>
        </div>

        {/* Short desc */}
        {meta.shortDesc && (
          <p className="text-[12px] text-nf-muted leading-relaxed mb-3 nf-bidi-text" dir={textDirAttr(meta.shortDesc)}>
            {meta.shortDesc}
          </p>
        )}

        {/* Invite panel */}
        {showInvitePanel && isOwner && needsInvite && (
          <div className="bg-nf-card border border-nf-border-2 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-[12px] font-bold text-nf-text">دعوة أعضاء جدد</p>
            {/* Invite link */}
            <div>
              <p className="text-[10px] text-nf-dim mb-1.5">رابط الدعوة</p>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="flex-1 !bg-nf-secondary border border-nf-border-2 rounded-lg px-3 py-1.5 text-[10px] text-nf-dim font-mono outline-none" />
                <button onClick={copyInviteLink} className="px-3 py-1.5 rounded-lg bg-nf-secondary border border-nf-border-2 text-[11px] text-nf-muted hover:text-nf-accent transition-colors flex items-center gap-1">
                  {copiedLink ? <><Check size={11} className="text-green-400" /> تم</> : <><Copy size={11} /> نسخ</>}
                </button>
              </div>
            </div>
            {/* Invite by email/username */}
            <div>
              <p className="text-[10px] text-nf-dim mb-1.5">دعوة بالبريد الإلكتروني</p>
              <div className="flex items-center gap-2">
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="flex-1 !bg-nf-secondary border border-nf-border-2 rounded-lg px-3 py-1.5 text-[12px] text-nf-text placeholder:text-nf-dim/50 outline-none focus:border-nf-accent transition-colors" />
                <button onClick={sendInvite} disabled={!inviteEmail.trim()}
                  className="px-3 py-1.5 rounded-lg bg-nf-accent text-nf-primary text-[11px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 transition-colors">
                  {inviteSent ? "✓ أُرسلت" : "إرسال"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main layout: posts + sidebar ── */}
      <div className="flex gap-5 items-start relative">
        {showMatureGate && (
          <div className="absolute inset-0 z-[150] flex items-center justify-center rounded-xl overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-xl bg-nf-body/85" />
            <div className="relative max-w-md mx-4 p-6 rounded-2xl border border-nf-border-2 bg-nf-card/95 shadow-2xl text-center">
              <p className="text-[11px] font-bold text-amber-400 mb-2">محتوى للبالغين (+18)</p>
              <h3 className="text-[16px] font-black text-nf-text mb-2">تأكيد العمر مطلوب</h3>
              <p className="text-[12px] text-nf-dim leading-relaxed mb-5">
                مجتمع n/{name} قد يتضمن مناقشات حساسة أو محتوى قوي. أكّد أن عمرك 18 عاماً أو أكثر للمتابعة.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button type="button" onClick={confirmMature}
                  className="px-5 py-2.5 rounded-xl bg-nf-text text-nf-body text-[13px] font-bold hover:opacity-90">
                  أؤكد أنني فوق 18 عاماً
                </button>
                <button type="button" onClick={onBack}
                  className="px-5 py-2.5 rounded-xl border border-nf-border-2 text-[13px] text-nf-muted hover:text-nf-text">
                  العودة
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Posts column — expands when sidebar hides */}
        <div className={cn("flex-1 min-w-0 transition-all duration-300", showMatureGate && "pointer-events-none select-none blur-md opacity-40")}>
          {/* Active Tag Filter Banner */}
          {selectedTag && (
            <div className="flex items-center justify-between bg-nf-secondary border border-nf-border-2 px-3.5 py-2.5 rounded-xl mb-2.5">
              <span className="text-[12px] text-nf-text font-bold">تصفية حسب الوسم: #{selectedTag}</span>
              <button onClick={() => setSelectedTag(null)} className="text-nf-accent hover:underline text-[11px] font-bold">
                إلغاء التصفية
              </button>
            </div>
          )}
          {hashtagFilter && (
            <div className="flex items-center justify-between bg-nf-accent/10 border border-nf-accent/25 px-3.5 py-2.5 rounded-xl mb-2.5">
              <span className="text-[12px] text-nf-accent font-bold flex items-center gap-1.5">
                <Hash size={13} />
                هاشتاغ: #{hashtagFilter}
              </span>
              <button type="button" onClick={() => setHashtagFilter(null)} className="text-nf-accent hover:underline text-[11px] font-bold">
                إلغاء
              </button>
            </div>
          )}
          {/* Sort bar */}
          <div className="flex items-center gap-1.5 bg-nf-card border border-nf-border-2/50 rounded-xl px-2 py-1.5 mb-2">
            {([
              { id: "new" as const, icon: Clock, label: "جديد" },
              { id: "top" as const, icon: TrendingUp, label: "الأعلى" },
              { id: "comments" as const, icon: MessageSquare, label: "تعليقات" },
            ] as const).map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setSortMode(s.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                    sortMode === s.id ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted")}>
                  <Icon size={12} /> {s.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث في منشورات المجتمع..."
              className="w-full !bg-nf-card border border-nf-border-2/50 rounded-xl pr-9 pl-8 py-2 text-[12px] text-nf-text placeholder:text-nf-dim/60 outline-none focus:border-nf-accent/40 transition-colors" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nf-dim hover:text-nf-text">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Posts list */}
          <div className={cn(meta.feedLayout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-2.5")}>
            {loading ? (
              <div className="text-center py-12 text-nf-muted text-sm">{t("gen.loading")}</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-nf-muted">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-[13px]">{searchQuery ? "لا توجد نتائج" : t("cp.noPosts")}</p>
                <p className="text-[11px] mt-1 text-nf-dim">{searchQuery ? "جرب كلمة بحث أخرى" : "كن أول من ينشر في هذا المجتمع"}</p>
              </div>
            ) : filteredPosts.map(post => (
              <PostCard key={post.id} postId={post.id} community={`n/${post.community || name}`}
                author={post.authorName || t("gen.user")} authorUid={post.authorUid} authorPhoto={post.authorPhoto}
                time={post.createdAt || t("gen.now")} title={post.title} body={post.body}
                image={post.imageUrl} imageUrls={post.imageUrls} flair={post.flair}
                isNsfw={post.isNsfw} isSpoiler={post.isSpoiler}
                isLiving={(post as any).isLiving} currentVersion={(post as any).currentVersion} versionsCount={(post as any).versions?.length}
                votes={post.votes || 0}
                comments={post.commentCount || 0} awards={post.awards} poll={post.poll}
                 quotedPostId={post.quotedPostId} onPostClick={onPostClick}
                 onEditClick={onEditClick} onDeleteClick={onDeleteClick} onFlairClick={setSelectedTag}
                 hashtags={(post as { hashtags?: string[] }).hashtags}
                 onHashtagClick={handleHashtagClick} />
            ))}
          </div>
        </div>      </div>

      {/* Members management panel removed — now a full page */}
    </motion.div>
  );
}
