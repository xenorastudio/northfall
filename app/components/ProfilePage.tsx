"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Camera, Pencil, Cake, FileText, MessageSquare, Bookmark, Award, Star, Zap, Heart, Trophy, Sparkles, UserPlus, UserCheck, Users, ArrowUp, Shield, Gamepad2, Calendar, Tag, ExternalLink, Rss, Lock, Globe, RotateCcw } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  getCountFromServer,
  onSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLevel } from "@/lib/ranking";
import PostCard from "./PostCard";
import PostBodyContent from "./PostBodyContent";
import { GAMES } from "./GamesPage";
import { cn } from "@/lib/utils";
import { mergeActor } from "@/lib/notification-format";
import type { CustomFeed } from "./CustomFeedModal";

const profileColorCache: Record<string, string> = {};
function extractProfileColor(src: string): Promise<string> {
  if (profileColorCache[src]) return Promise.resolve(profileColorCache[src]);
  return new Promise((resolve) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = 8; c.height = 8;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, 8, 8);
      const d = ctx.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i+3] < 128) continue; r += d[i]; g += d[i+1]; b += d[i+2]; count++; }
      if (!count) { resolve("rgb(30,30,40)"); return; }
      r = Math.round(r/count*0.35); g = Math.round(g/count*0.35); b = Math.round(b/count*0.35);
      const color = `rgb(${r},${g},${b})`; profileColorCache[src] = color; resolve(color);
    };
    img.onerror = () => resolve("rgb(30,30,40)"); img.src = src;
  });
}

function ProfileGameCard({ game }: { game: { id: string; name: string; cover: string; rating: number; releaseYear: number; genre: string[]; description: string; platforms: string[]; players: string; developer: string; publisher: string; steamUrl: string } }) {
  const [dominantColor, setDominantColor] = useState("rgb(30,30,40)");
  const [hovered, setHovered] = useState(false);
  const loadedRef = useRef(false);
  useEffect(() => { if (!loadedRef.current) { loadedRef.current = true; extractProfileColor(game.cover).then(c => setDominantColor(c)); } }, [game.cover]);
  return (
    <div className="group relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-xl pointer-events-none" style={{ background: dominantColor }} />
      <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/[0.06] group-hover:ring-white/[0.12] transition-all duration-300">
        <img src={game.cover} alt={game.name} draggable={false} onContextMenu={e => e.preventDefault()} className="w-full aspect-[3/4] object-cover transition-transform duration-700 ease-out group-hover:scale-105 select-none pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent p-2.5 pt-10">
          <p className="text-[10px] text-white font-bold truncate drop-shadow-lg">{game.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={8} className="text-amber-400" fill="currentColor" />
            <span className="text-[8px] text-amber-400 font-bold">{game.rating}</span>
            <span className="text-[7px] text-white/25">·</span>
            <span className="text-[7px] text-white/35">{game.releaseYear}</span>
          </div>
        </div>
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm shadow-red-500/40">
          <Heart size={9} className="text-white" fill="white" />
        </div>
        <div className="absolute top-1.5 right-1.5">
          <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white/70 font-bold border border-white/[0.08]">{game.genre[0]}</span>
        </div>
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }} className="absolute top-full right-0 left-0 z-40 mt-1.5">
            <div className="rounded-2xl p-3 shadow-2xl shadow-black/80 border border-white/[0.06] bg-black/80 backdrop-blur-2xl">
              <p className="text-[10px] text-white/60 leading-relaxed mb-2">{game.description}</p>
              <div className="flex items-center gap-2 mb-2 text-[8px]">
                <span className="flex items-center gap-0.5 text-amber-400"><Star size={7} fill="currentColor" /> {game.rating}</span>
                <span className="flex items-center gap-0.5 text-white/40"><Calendar size={7} /> {game.releaseYear}</span>
                <span className="flex items-center gap-0.5 text-white/40"><Users size={7} /> {game.players}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {game.genre.map(g => (<span key={g} className="text-[7px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/70 font-semibold">{g}</span>))}
              </div>
              <div className="flex items-center gap-2 text-[7px] text-white/30">
                <span className="flex items-center gap-0.5"><Tag size={6} /> {game.developer}</span>
                <span>· {game.publisher}</span>
              </div>
              {game.steamUrl && (
                <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-[7px] text-white/40 hover:text-white/70 transition-colors bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.04]">
                  <ExternalLink size={6} /> Steam
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const tabs = [
  { icon: FileText, labelKey: "pp.posts", id: "posts" },
  { icon: MessageSquare, labelKey: "pp.comments", id: "comments" },
  { icon: Bookmark, labelKey: "pp.saved", id: "saved" },
  { icon: Rss, labelKey: "فيدات", id: "feeds" },
  { icon: Gamepad2, labelKey: "ألعابي", id: "games" },
  { icon: Award, labelKey: "pp.awards", id: "awards" },
];

const awardDefs = [
  { id: "helpful", icon: Heart, titleKey: "aw.helpful", descKey: "aw.helpfulDesc", color: "text-red-400", bg: "bg-red-500/10" },
  { id: "popular", icon: Star, titleKey: "aw.popular", descKey: "aw.popularDesc", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { id: "active", icon: Zap, titleKey: "aw.active", descKey: "aw.activeDesc", color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "community", icon: Trophy, titleKey: "aw.leader", descKey: "aw.leaderDesc", color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "first", icon: Sparkles, titleKey: "pp.firstStep", descKey: "pp.firstStepDesc", color: "text-green-400", bg: "bg-green-500/10" },
];

function timeAgo(ts: any, t: (k: string) => string): string {
  if (!ts) return t("gen.now");
  try {
    const d = typeof ts === "string" ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date(ts));
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return t("gen.now");
    if (s < 3600) return `${Math.floor(s / 60)} ${t("gen.minutesAgo")}`;
    if (s < 86400) return `${Math.floor(s / 3600)} ${t("gen.hoursAgo")}`;
    if (s < 2592000) return `${Math.floor(s / 86400)} ${t("gen.daysAgo")}`;
    return `${Math.floor(s / 2592000)} ${t("gen.monthsAgo")}`;
  } catch { return t("gen.now"); }
}

export default function ProfilePage({ uid, initialTab, onEditClick, onDeleteClick, onSettingsClick, onAdminClick, onPostClick, onCustomFeedClick }: { uid?: string; initialTab?: string; onEditClick?: (id: string) => void; onDeleteClick?: (id: string) => void; onSettingsClick?: () => void; onAdminClick?: () => void; onPostClick?: (id: string) => void; onCustomFeedClick?: (feed: CustomFeed) => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const targetUid = (typeof uid === "string" && uid) || user?.uid || "";
  const isOwn = !uid || uid === user?.uid;
  const [activeTab, setActiveTab] = useState("posts");
  useEffect(() => {
    const readTab = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      const valid = ["posts", "comments", "saved", "feeds", "games", "awards"];
      if (tab && valid.includes(tab)) setActiveTab(tab);
    };
    readTab();
    window.addEventListener("popstate", readTab);
    return () => window.removeEventListener("popstate", readTab);
  }, [uid]);

  useEffect(() => {
    const valid = ["posts", "comments", "saved", "feeds", "games", "awards"];
    if (initialTab && valid.includes(initialTab)) setActiveTab(initialTab);
  }, [initialTab]);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [savedSearch, setSavedSearch] = useState("");
  const [savedSearchDebounced, setSavedSearchDebounced] = useState("");
  const [savedCategory, setSavedCategory] = useState("all");
  const [savedSort, setSavedSort] = useState<"newest"|"oldest"|"top">("newest");
  const [savedFlair, setSavedFlair] = useState("all");
  const [savedHideNsfw, setSavedHideNsfw] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [favoriteGameIds, setFavoriteGameIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [karma, setKarma] = useState(0);
  const [xp, setXp] = useState(0);
  const [postCount, setPostCount] = useState(0);

  const [profileData, setProfileData] = useState<{ name: string; photo: string; bio: string; bannerUrl: string; socialLinks: Record<string, string>; createdAt?: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [copiedId, setCopiedId] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [profileCustomFeeds, setProfileCustomFeeds] = useState<CustomFeed[]>([]);
  const [hideSaved, setHideSaved] = useState(false);
  const [showKarma, setShowKarma] = useState(true);

  const getLevelWithIcon = (xp: number) => {
    const base = getLevel(xp);
    const iconMap: Record<string, typeof Trophy> = {
      "اسطورة": Trophy, "بطل": Trophy, "خبير": Sparkles, "محترف": Zap,
      "متقدم": Zap, "نشيط": Star, "متمرس": Star,
    };
    return { ...base, icon: iconMap[base.name] || UserPlus };
  };
  const level = getLevelWithIcon(xp);

  // Fetch profile data for viewed user
  useEffect(() => {
    if (!targetUid) return;
    async function fetchProfile() {
      try {
        // Get user doc first (most reliable source for name/photo)
        const userSnap = await getDoc(doc(db, "users", targetUid));
        const userData = userSnap.exists() ? userSnap.data() : null;
        // Check online status
        if (userData?.lastSeen) {
          setIsOnline((Date.now() - new Date(userData.lastSeen).getTime()) < 300000);
        }
        setHideSaved(!!userData?.hideSaved);
        setShowKarma(userData?.showKarma !== false);

        if (isOwn && user) {
          // For own profile, prefer Firestore custom photo over Google auth photo
          setProfileData({
            name: user.displayName || userData?.displayName || t("gen.user"),
            photo: userData?.photoURL || user.photoURL || "",
            bio: userData?.bio || "",
            bannerUrl: userData?.bannerUrl || "",
            socialLinks: userData?.socialLinks || {},
            createdAt: userData?.createdAt || "",
          });
        } else if (userData) {
          setProfileData({
            name: userData.displayName || t("gen.user"),
            photo: userData.photoURL || "",
            bio: userData.bio || "",
            bannerUrl: userData.bannerUrl || "",
            socialLinks: userData.socialLinks || {},
            createdAt: userData.createdAt || "",
          });
        } else {
          // Fallback: get name/photo from posts
          const q = query(collection(db, "posts"), where("authorUid", "==", targetUid), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0].data();
            setProfileData({
              name: d.authorName || t("gen.user"),
              photo: d.authorPhoto || "",
              bio: "",
              bannerUrl: d.bannerUrl || "",
              socialLinks: {},
            });
          }
        }
      } catch (e) { console.error(e); }
    }
    fetchProfile();
  }, [targetUid, isOwn, user]);

  // Check if current user follows the target user
  useEffect(() => {
    if (!user || isOwn || !targetUid) return;
    getDoc(doc(db, "users", user.uid, "following", targetUid)).then(s => setIsFollowing(s.exists())).catch(() => {});
  }, [user, isOwn, targetUid]);

  // Fetch follower/following counts (one-time, no realtime)
  useEffect(() => {
    if (!targetUid) return;
    async function fetchCounts() {
      try {
        const fSnap = await getCountFromServer(collection(db, "users", targetUid!, "followers"));
        setFollowerCount(fSnap.data().count);
        const f2Snap = await getCountFromServer(collection(db, "users", targetUid!, "following"));
        setFollowingCount(f2Snap.data().count);
      } catch {}
    }
    fetchCounts();
  }, [targetUid]);

  const toggleFollow = async () => {
    if (!user || isOwn) return;
    const followRef = doc(db, "users", user.uid, "following", targetUid);
    const followerRef = doc(db, "users", targetUid, "followers", user.uid);
    if (isFollowing) {
      await deleteDoc(followRef);
      await deleteDoc(followerRef);
      setIsFollowing(false);
    } else {
      await setDoc(followRef, { uid: targetUid, followedAt: new Date().toISOString() });
      await setDoc(followerRef, { uid: user.uid, followedAt: new Date().toISOString() });
      setIsFollowing(true);
      // Batched follow notification
      try {
        const actor = {
          uid: user.uid,
          name: user.displayName || "مستخدم",
          photo: user.photoURL || "",
        };
        const notifQ = query(collection(db, "users", targetUid, "notifications"), where("type", "==", "follow"), where("read", "==", false));
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
            text: count > 1 ? `${actor.name} و ${count - 1} آخرين تابعوك` : `${actor.name} تابعك`,
            createdAt: new Date().toISOString(),
          });
        } else {
          await addDoc(collection(db, "users", targetUid, "notifications"), {
            type: "follow",
            text: `${actor.name} تابعك`,
            fromUid: actor.uid,
            fromName: actor.name,
            fromPhoto: actor.photo,
            actors: [actor],
            read: false,
            createdAt: new Date().toISOString(),
            count: 1,
          });
        }
      } catch {}
    }
  };

  // Fetch user posts (no composite index needed - sort client-side)
  useEffect(() => {
    if (!targetUid) { setLoading(false); return; }
    async function fetch() {
      try {
        const q = query(collection(db, "posts"), where("authorUid", "==", targetUid), limit(10));
        const snap = await getDocs(q);
        const p = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any)).sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setPosts(p);
        // Karma comes ONLY from Firestore user doc — never sum post votes (that's not sait)
        try {
          const uSnap = await getDoc(doc(db, "users", targetUid!));
          if (uSnap.exists()) {
            const ud = uSnap.data();
            setKarma(ud.karma || 0);
            if (ud.xp !== undefined) setXp(ud.xp);
            if (ud.postCount !== undefined) setPostCount(ud.postCount);
          }
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [user]);

  // Fetch comment count from user doc (stored field) or fallback to limited scan
  useEffect(() => {
    if (!targetUid) return;
    async function fetchCommentCount() {
      try {
        const uSnap = await getDoc(doc(db, "users", targetUid!));
        if (uSnap.exists() && uSnap.data().commentCount !== undefined) {
          setCommentCount(uSnap.data().commentCount);
        } else {
          // Fallback: scan recent posts for user comments (limited)
          const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10));
          const snap = await getDocs(q);
          let count = 0;
          const commentSnaps = await Promise.all(
            snap.docs.map(postDoc => getDocs(query(collection(db, "posts", postDoc.id, "comments"), where("authorUid", "==", targetUid!), limit(5))))
          );
          commentSnaps.forEach((cSnap) => { count += cSnap.size; });
          setCommentCount(count);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchCommentCount();
  }, [targetUid]);

  // Fetch favorite games
  useEffect(() => {
    if (!targetUid) return;
    getDoc(doc(db, "users", targetUid!, "games", "favorites")).then(s => {
      if (s.exists()) setFavoriteGameIds(s.data().ids || []);
    }).catch(() => {});
  }, [targetUid]);

  // Fetch custom feeds for profile tab
  useEffect(() => {
    if (!targetUid || activeTab !== "feeds") return;
    getDocs(collection(db, "users", targetUid, "customFeeds")).then((snap) => {
      const feeds = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as CustomFeed))
        // For others: only show feeds that are NOT private AND showOnProfile is true
        // For own profile: show all feeds
        .filter((f) => isOwn ? true : (f.showOnProfile !== false && !f.isPrivate))
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      setProfileCustomFeeds(feeds);
    }).catch(() => {});
  }, [targetUid, activeTab, isOwn]);

  // Debounce saved search input (200ms) to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => setSavedSearchDebounced(savedSearch), 200);
    return () => clearTimeout(timer);
  }, [savedSearch]);

  useEffect(() => {
    setSavedPosts([]);
  }, [targetUid]);

  const fetchSavedPosts = useCallback(async () => {
    if (!targetUid) return;
    if (!isOwn && hideSaved) return;
    setSavedPostsLoading(true);
    try {
      const savedSnap = await getDocs(collection(db, "users", targetUid, "saved"));
      const postSnaps = await Promise.all(
        savedSnap.docs.map(s => {
          const postId = s.data().postId || s.id;
          return getDoc(doc(db, "posts", postId));
        })
      );
      const items = postSnaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() }));
      setSavedPosts(items);
    } catch (e) {
      console.error(e);
      setSavedPosts([]);
    } finally {
      setSavedPostsLoading(false);
    }
  }, [targetUid, isOwn, hideSaved]);

  useEffect(() => {
    if (activeTab !== "saved") return;
    if (!targetUid || (!isOwn && hideSaved)) return;
    fetchSavedPosts();
  }, [activeTab, targetUid, isOwn, hideSaved, fetchSavedPosts]);

  // Pure client-side filter + sort — zero reads from Firebase
  const filteredSavedPosts = useMemo(() => {
    return savedPosts
      .filter(p => {
        const q = savedSearchDebounced.toLowerCase();
        if (q && !((p.title||"").toLowerCase().includes(q)||(p.body||"").toLowerCase().includes(q))) return false;
        if (savedCategory !== "all" && p.community !== savedCategory) return false;
        if (savedFlair !== "all" && p.flair !== savedFlair) return false;
        if (savedHideNsfw && p.isNsfw) return false;
        return true;
      })
      .sort((a, b) => {
        if (savedSort === "top") return (b.votes||0) - (a.votes||0);
        const da = new Date(a.createdAt||0).getTime();
        const db_ = new Date(b.createdAt||0).getTime();
        return savedSort === "newest" ? db_ - da : da - db_;
      });
  }, [savedPosts, savedSearchDebounced, savedCategory, savedFlair, savedHideNsfw, savedSort]);

  // Fetch user comments across all posts
  useEffect(() => {
    if (!targetUid || activeTab !== "comments") return;
    async function enrichComment(cDoc: QueryDocumentSnapshot) {
      const d = cDoc.data();
      const postId = cDoc.ref.parent?.parent?.id;
      if (!postId) return null;
      let postTitle = "";
      let postCommunity = "";
      try {
        const p = await getDoc(doc(db, "posts", postId));
        if (p.exists()) {
          postTitle = String(p.data().title || "");
          postCommunity = String(p.data().community || "");
        }
      } catch {
        /* ignore */
      }
      return {
        id: cDoc.id,
        postId,
        postTitle,
        postCommunity,
        ...d,
      };
    }

    async function fetchComments() {
      setCommentsLoading(true);
      const allComments: any[] = [];
      try {
        const snap = await getDocs(
          query(
            collectionGroup(db, "comments"),
            where("authorUid", "==", targetUid),
            orderBy("createdAt", "desc"),
            limit(40)
          )
        );
        const rows = await Promise.all(snap.docs.map((c) => enrichComment(c)));
        rows.forEach((r) => {
          if (r) allComments.push(r);
        });
      } catch (e) {
        console.warn("[profile] collectionGroup comments, fallback:", e);
        try {
          const postsSnap = await getDocs(
            query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(60))
          );
          const commentSnaps = await Promise.all(
            postsSnap.docs.map((postDoc) =>
              getDocs(
                query(
                  collection(db, "posts", postDoc.id, "comments"),
                  where("authorUid", "==", targetUid),
                  limit(8)
                )
              )
            )
          );
          commentSnaps.forEach((cSnap, i) => {
            const postDoc = postsSnap.docs[i];
            if (!postDoc) return;
            cSnap.forEach((c) => {
              const d = c.data();
              allComments.push({
                id: c.id,
                postId: postDoc.id,
                postTitle: String(postDoc.data().title || ""),
                postCommunity: String(postDoc.data().community || ""),
                ...d,
              });
            });
          });
        } catch (e2) {
          console.error(e2);
        }
      }
      allComments.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      setComments(allComments);
      setCommentsLoading(false);
    }
    fetchComments();
  }, [targetUid, activeTab]);

  // Determine earned awards based on karma and post count
  const earnedAwards = awardDefs.filter(a => {
    if (a.id === "first" && posts.length >= 1) return true;
    if (a.id === "active" && posts.length >= 10) return true;
    if (a.id === "popular" && karma >= 50) return true;
    if (a.id === "helpful" && commentCount >= 10) return true;
    if (a.id === "community") return false;
    return false;
  });

  if (!user && !uid) {
    return (
      <div className="text-center py-16 text-nf-muted">
        <p className="text-lg font-bold">{t("pp.loginToView")}</p>
      </div>
    );
  }

  const displayName = isOwn ? (user?.displayName || t("gen.user")) : (profileData?.name || t("gen.user"));
  const displayPhoto = profileData?.photo || (isOwn ? user?.photoURL || "" : "");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Banner */}
      <div className={`relative overflow-hidden mb-3 rounded-lg ${profileData?.bannerUrl ? 'h-[80px] sm:h-[120px]' : 'h-0'}`}>
        {profileData?.bannerUrl ? (
          <img src={profileData.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : null}
        {profileData?.bannerUrl && <div className="absolute inset-0 bg-gradient-to-t from-nf-primary/90 to-transparent" />}
        {isOwn && (
          <button onClick={onSettingsClick} className="absolute bottom-3 left-3 p-2 rounded-lg bg-black/40 text-white/70 hover:text-white transition-colors">
            <Camera size={16} />
          </button>
        )}
      </div>
      
      {/* Header */}
      <div className="px-2 -mt-4 sm:-mt-6 relative z-10 mb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative shrink-0">
            {displayPhoto ? (
              <img src={displayPhoto} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-nf-primary object-cover" />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-nf-primary bg-nf-secondary flex items-center justify-center text-nf-muted text-base sm:text-lg font-bold">
                {displayName[0]}
              </div>
            )}
            {isOwn && (
              <button onClick={onSettingsClick} className="absolute -bottom-1 -left-1 p-1 rounded-full bg-nf-secondary border border-nf-border text-nf-muted hover:text-nf-text">
                <Camera size={12} />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1 sm:pt-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-nf-text">{displayName}</h1>
              {(targetUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && (
                <span className="relative inline-flex items-center justify-center shrink-0">
                  <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-pulse" />
                  <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[20px] h-[20px] relative z-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
                </span>
              )}
              {isOwn ? (
                <div className="flex items-center gap-2">
                  <button onClick={onSettingsClick} className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg border border-nf-border text-xs font-medium text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
                    <Pencil size={12} />
                    <span className="hidden sm:inline">{t("pp.edit")}</span>
                  </button>
                  {(user?.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && onAdminClick && (
                    <button onClick={onAdminClick} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-nf-border text-[10px] font-medium text-nf-dim hover:bg-nf-hover hover:text-nf-accent transition-colors" title="لوحة الإشراف">
                      <Shield size={11} />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={toggleFollow}
                  className={cn(
                    "flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                    isFollowing
                      ? "bg-nf-secondary text-nf-muted border-nf-border hover:bg-nf-hover hover:text-nf-text"
                      : "bg-nf-accent text-white border-nf-accent hover:bg-nf-accent/80"
                  )}
                >
                  {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  <span>{isFollowing ? t("gen.followingStatus") : t("gen.follow")}</span>
                </button>
              )}
            </div>
            <p className="text-sm text-nf-muted mt-0.5">u/{displayName}</p>
          </div>
        </div>
        {profileData?.bio?.trim() && (
          <p className="mt-3 text-[13px] text-nf-dim leading-[1.75] whitespace-pre-wrap break-words w-full">
            {profileData.bio}
          </p>
        )}
        {profileData?.socialLinks && Object.values(profileData.socialLinks).some(v => v.trim()) && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {Object.entries(profileData.socialLinks).filter(([, v]) => v.trim()).map(([key, val]) => {
                const socialMeta: Record<string, { color: string; label: string; path: string }> = {
                  twitter: { color: "#000", label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  youtube: { color: "#ff0000", label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" },
                  github: { color: "#fff", label: "GitHub", path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
                  steam: { color: "#1b2838", label: "Steam", path: "M11.502 18.003l-2.09-1.442a1.29 1.29 0 0 1-.398-1.666 1.28 1.28 0 0 1 1.532-.623l1.898.633.418-1.858a1.284 1.284 0 0 1 1.796-.856 1.29 1.29 0 0 1 .577 1.748l-1.012 2.024a1.29 1.29 0 0 1-1.878.478zM22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12z" },
                  discord: { color: "#5865f2", label: "Discord", path: "M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.393-.406-.874-.618-1.25a.077.077 0 0 0-.079-.036 19.74 19.74 0 0 0-4.885 1.515.07.07 0 0 0-.032.028C.533 9.046-.32 13.56.1 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.423 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.926.077.077 0 0 1-.008-.126c.126-.094.252-.192.372-.301a.074.074 0 0 1 .078-.012c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.1.246.204.373.302a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.926.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028c1.96-.607 3.949-1.522 6.002-3.029a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029z" },
                  website: { color: "#0ff", label: t("sp.personalWebsite"), path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
                };
                const meta = socialMeta[key];
                if (!meta) return null;
                return (
                  <a key={key} href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-nf-secondary/50 text-nf-muted hover:bg-nf-accent/10 hover:text-nf-accent transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d={meta.path} /></svg>
                    <span>{meta.label}</span>
                  </a>
                );
              })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1 px-2 mb-3 text-[11px] flex-wrap">
        <span className={cn("px-2 py-0.5 rounded-md flex items-center gap-1", level.bg, level.color)}><level.icon size={10} /><span className="font-bold">{level.name}</span></span>
        {showKarma && (
          <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><ArrowUp size={10} className="inline ml-0.5 text-nf-accent" /><span className="font-bold text-nf-text">{Math.max(0, Math.round(karma))}</span> صيت</span>
        )}
        <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><Zap size={10} className="inline ml-0.5 text-amber-400" /><span className="font-bold text-nf-text">{xp}</span> XP</span>
        <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><span className="font-bold text-nf-text">{postCount || posts.length}</span> {t("pp.postCount")}</span>
        <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><span className="font-bold text-nf-text">{followerCount}</span> {t("gen.followers")}</span>
        <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><span className="font-bold text-nf-text">{followingCount}</span> {t("gen.followingCount")}</span>
        <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><span className="font-bold text-nf-text">{commentCount}</span> تعليقات</span>
        {favoriteGameIds.length > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><Gamepad2 size={10} className="inline ml-0.5 text-nf-accent" /><span className="font-bold text-nf-text">{favoriteGameIds.length}</span> ألعاب</span>
        )}
        <span className={cn("px-2 py-0.5 rounded-md flex items-center gap-1", isOnline ? "bg-green-400/10 text-green-400" : "bg-nf-secondary/40 text-nf-dim")}>
          <span className={cn("w-1.5 h-1.5 rounded-full inline-block", isOnline ? "bg-green-400" : "bg-nf-dim")} />
          {isOnline ? "متصل" : "غير متصل"}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-nf-secondary/40 text-nf-muted"><Cake size={11} className="inline ml-0.5" /> {(() => { if (targetUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") return "انضم أبريل 2024"; if (profileData?.createdAt) { const d = new Date(profileData.createdAt); const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]; return `انضم ${months[d.getMonth()]} ${d.getFullYear()}`; } return t("pp.joinedRecently"); })()}</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-nf-border-2 mb-4 px-2 overflow-x-auto">
        {tabs.filter(t => t.id !== "saved" || isOwn || !hideSaved).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0",
              activeTab === tab.id
                ? "text-nf-text border-nf-accent"
                : "text-nf-muted border-transparent hover:text-nf-text hover:border-nf-border"
            )}
          >
            <tab.icon size={15} />
            <span className="text-xs sm:text-sm">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {activeTab === "posts" && (
          loading ? (
            <div className="text-center py-8 text-nf-muted text-sm">{t("gen.loading")}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-nf-muted">
              <FileText size={32} className="mx-auto mb-2 opacity-20" />
              <p className="font-bold">{t("pp.noPostsYet")}</p>
              <p className="text-sm">{t("pp.shareFirst")}</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                community={post.community ? `n/${post.community}` : `n/${t("gen.general")}`}
                author={post.authorName || t("gen.user")}
                authorUid={post.authorUid}
                authorPhoto={post.authorPhoto}
                time={timeAgo(post.createdAt, t)}
                title={post.title}
                body={post.body}
                image={post.imageUrl}
                imageUrls={post.imageUrls}
                flair={post.flair}
                flairBg={(post as { flairBg?: string }).flairBg}
                flairTextColor={(post as { flairTextColor?: string }).flairTextColor}
                isNsfw={post.isNsfw}
                isSpoiler={post.isSpoiler}
                isLiving={(post as any).isLiving}
                currentVersion={(post as any).currentVersion}
                versionsCount={(post as any).versions?.length}
                votes={post.votes || 0}
                comments={post.commentCount || 0}
                views={(post as { views?: number }).views || 0}
                awards={post.awards}
                poll={post.poll}
                quotedPostId={post.quotedPostId}
                onPostClick={onPostClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
              />
            ))
          )
        )}

        {activeTab === "comments" && (
          commentsLoading ? (
            <div className="py-12 text-center text-nf-dim text-sm">جاري تحميل التعليقات…</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-nf-muted">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
              <p className="font-bold">{t("pp.noCommentsYet")}</p>
              <p className="text-sm">{t("pp.commentToAppear")}</p>
            </div>
          ) : (
            <div className="divide-y divide-nf-border-2/30">
            {comments.map((c) => {
              const cPhoto = c.authorPhoto || (c.authorUid === targetUid ? displayPhoto : "");
              const cName = c.authorName || (c.authorUid === targetUid ? displayName : "مستخدم");
              return (
              <article
                key={`${c.postId}-${c.id}`}
                className="flex gap-3 py-3 px-1 hover:bg-nf-hover/40 rounded-lg transition-colors cursor-pointer"
                onClick={() => c.postId && onPostClick?.(c.postId)}
              >
                <div className="shrink-0 pt-0.5">
                  {cPhoto ? (
                    <img src={cPhoto} alt="" className="w-9 h-9 rounded-full object-cover bg-nf-secondary" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-nf-secondary flex items-center justify-center text-[12px] font-bold text-nf-muted">
                      {cName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] mb-1">
                    <span className="font-bold text-nf-text">{cName}</span>
                    <span className="text-nf-dim">·</span>
                    <span className="text-nf-dim tabular-nums">{timeAgo(c.createdAt, t)}</span>
                  </div>
                  <p className="text-[11px] text-nf-dim mb-1.5 leading-snug">
                    {t("pp.commentOn")}{" "}
                    {c.postCommunity && (
                      <span className="text-nf-accent/90">n/{c.postCommunity} · </span>
                    )}
                    <span className="text-nf-muted">{c.postTitle || "منشور"}</span>
                  </p>
                  <PostBodyContent
                    text={c.text || ""}
                    className="text-[14px] text-nf-text leading-relaxed"
                    enableMentionHover={false}
                  />
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-nf-dim">
                    <span className="flex items-center gap-1">
                      <ArrowUp size={12} className="text-nf-accent" />
                      {c.votes ?? 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(c.text || "");
                        setCopiedId(c.id);
                        setTimeout(() => setCopiedId(""), 1500);
                      }}
                      className={cn("hover:text-nf-text transition-colors", copiedId === c.id && "text-nf-accent")}
                    >
                      {copiedId === c.id ? "تم النسخ" : "نسخ"}
                    </button>
                  </div>
                </div>
              </article>
            );
            })}
            </div>
          )
        )}

        {activeTab === "saved" && (
          <>
            {!isOwn && hideSaved ? (
              <div className="text-center py-16 text-nf-muted">
                <Bookmark size={36} className="mx-auto mb-3 opacity-15" />
                <p className="font-bold text-[14px] mb-1">المحفوظات مخفية</p>
                <p className="text-[12px] text-nf-dim">هذا المستخدم أخفى قائمة المحفوظات من ملفه</p>
              </div>
            ) : (
          <>
            {/* ── Saved Posts Filters ── */}
            {savedPosts.length > 0 && (
              <div className="mb-4 space-y-2.5">
                {/* Search + refresh */}
                <div className="relative">
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nf-dim pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    type="text"
                    value={savedSearch}
                    onChange={e => setSavedSearch(e.target.value)}
                    placeholder={isOwn ? "ابحث في المحفوظات..." : "ابحث في محفوظات هذا المستخدم..."}
                    className={cn(
                      "w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-9 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/50 transition-colors",
                      isOwn ? "pl-16" : "pl-3"
                    )}
                  />
                  {isOwn && (
                  <button
                    onClick={() => fetchSavedPosts()}
                    disabled={savedPostsLoading}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-nf-dim hover:text-nf-accent hover:bg-nf-hover transition-colors disabled:opacity-40"
                    title="تحديث المحفوظات"
                  >
                    <RotateCcw size={13} className={savedPostsLoading ? "animate-spin" : ""} />
                  </button>
                  )}
                  {savedSearch && (
                    <button onClick={() => setSavedSearch("")} className="absolute left-10 top-1/2 -translate-y-1/2 p-1 text-nf-dim hover:text-nf-text transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>

                {/* Filter chips row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Community filter */}
                  {Array.from(new Set(savedPosts.map(p => p.community).filter(Boolean))).length > 0 && (
                    <>
                      {["all", ...Array.from(new Set(savedPosts.map(p => p.community).filter(Boolean)))].map(cat => (
                        <button key={cat} onClick={() => setSavedCategory(cat)}
                          className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border",
                            savedCategory === cat
                              ? "bg-nf-accent/15 text-nf-accent border-nf-accent/30"
                              : "text-nf-dim border-nf-border-2/60 hover:bg-nf-hover hover:text-nf-text")}>
                          {cat === "all" ? "كل المجتمعات" : `n/${cat}`}
                        </button>
                      ))}
                      <div className="w-px h-4 bg-nf-border-2/50 mx-0.5" />
                    </>
                  )}

                  {/* Flair filter */}
                  {Array.from(new Set(savedPosts.map(p => p.flair).filter(Boolean))).length > 0 && (
                    <>
                      {["all", ...Array.from(new Set(savedPosts.map(p => p.flair).filter(Boolean)))].map(fl => (
                        <button key={fl} onClick={() => setSavedFlair(fl)}
                          className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border",
                            savedFlair === fl
                              ? "bg-nf-accent/15 text-nf-accent border-nf-accent/30"
                              : "text-nf-dim border-nf-border-2/60 hover:bg-nf-hover hover:text-nf-text")}>
                          {fl === "all" ? "كل الفلايرات" : fl}
                        </button>
                      ))}
                      <div className="w-px h-4 bg-nf-border-2/50 mx-0.5" />
                    </>
                  )}

                  {/* NSFW toggle */}
                  <button onClick={() => setSavedHideNsfw(p => !p)}
                    className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border",
                      savedHideNsfw
                        ? "bg-red-500/15 text-red-400 border-red-400/30"
                        : "text-nf-dim border-nf-border-2/60 hover:bg-nf-hover hover:text-nf-text")}>
                    {savedHideNsfw ? "🔞 مخفي" : "إخفاء NSFW"}
                  </button>

                  <div className="flex-1" />

                  {/* Sort */}
                  <div className="flex items-center gap-1 bg-nf-secondary rounded-full px-1 py-0.5 border border-nf-border-2/50">
                    {(["newest","oldest","top"] as const).map(s => (
                      <button key={s} onClick={() => setSavedSort(s)}
                        className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all",
                          savedSort === s ? "bg-nf-accent/20 text-nf-accent" : "text-nf-dim hover:text-nf-text")}>
                        {s === "newest" ? "الأحدث" : s === "oldest" ? "الأقدم" : "الأعلى"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active filters summary */}
                {(savedSearch || savedCategory !== "all" || savedFlair !== "all" || savedHideNsfw) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-nf-dim">
                      {filteredSavedPosts.length} نتيجة من {savedPosts.length}
                    </span>
                    <button onClick={() => { setSavedSearch(""); setSavedCategory("all"); setSavedFlair("all"); setSavedHideNsfw(false); }}
                      className="text-[10px] text-nf-accent hover:underline">
                      مسح الكل
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Results — all filtering/sorting is done via useMemo, zero Firebase reads */}
            {savedPostsLoading && savedPosts.length === 0 ? (
              <div className="text-center py-12 text-nf-muted">
                <div className="w-6 h-6 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[12px] text-nf-dim">جاري التحميل...</p>
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="text-center py-16 text-nf-muted">
                <Bookmark size={36} className="mx-auto mb-3 opacity-15" />
                <p className="font-bold text-[14px] mb-1">{isOwn ? t("pp.noSavedYet") : "لا توجد محفوظات عامة"}</p>
                <p className="text-[12px] text-nf-dim">{isOwn ? t("pp.saveToAppear") : "لم يحفظ هذا المستخدم منشورات بعد"}</p>
              </div>
            ) : filteredSavedPosts.length === 0 ? (
              <div className="text-center py-12 text-nf-muted">
                <svg className="w-9 h-9 mx-auto mb-3 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <p className="text-[13px] font-medium mb-1">لا توجد نتائج</p>
                <p className="text-[11px] text-nf-dim mb-3">جرب تغيير الفلاتر أو كلمة البحث</p>
                <button onClick={() => { setSavedSearch(""); setSavedCategory("all"); setSavedFlair("all"); setSavedHideNsfw(false); }}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-nf-secondary text-nf-muted hover:bg-nf-hover transition-colors">
                  مسح الفلاتر
                </button>
              </div>
            ) : (
              filteredSavedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  postId={post.id}
                  community={post.community ? `n/${post.community}` : `n/${t("gen.general")}`}
                  author={post.authorName || t("gen.user")}
                  authorUid={post.authorUid}
                  authorPhoto={post.authorPhoto}
                  time={timeAgo(post.createdAt, t)}
                  title={post.title}
                  body={post.body}
                  image={post.imageUrl}
                  imageUrls={post.imageUrls}
                  videoUrl={post.videoUrl}
                  mediaItems={post.mediaItems}
                  flair={post.flair}
                  isNsfw={post.isNsfw}
                  isSpoiler={post.isSpoiler}
                  isLiving={(post as any).isLiving}
                  currentVersion={(post as any).currentVersion}
                  versionsCount={(post as any).versions?.length}
                  votes={post.votes || 0}
                  comments={post.commentCount || 0}
                  views={(post as { views?: number }).views || 0}
                  awards={post.awards}
                  poll={post.poll}
                  quotedPostId={post.quotedPostId}
                  onPostClick={onPostClick}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                />
              ))
            )}
          </>
            )}
          </>
        )}

        {activeTab === "awards" && (
          <div className="relative py-4 min-h-[320px]">
            <div className="pointer-events-none select-none opacity-25 blur-[1px]">
            {earnedAwards.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-nf-muted mb-3 font-bold">{t("pp.earnedAwards")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {earnedAwards.map((a) => (
                    <div key={a.id} className={cn("flex items-center gap-3 rounded-lg border border-nf-border-2 p-3", a.bg)}>
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", a.bg)}>
                        <a.icon size={20} className={a.color} />
                      </div>
                      <div>
                        <div className={cn("text-sm font-bold", a.color)}>{t(a.titleKey)}</div>
                        <div className="text-[11px] text-nf-dim">{t(a.descKey)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-nf-muted mb-3 font-bold">{t("pp.availableAwards")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {awardDefs.filter(a => !earnedAwards.find(e => e.id === a.id)).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-nf-border-2 p-3 opacity-40">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-nf-secondary">
                      <a.icon size={20} className="text-nf-dim" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-nf-dim">{t(a.titleKey)}</div>
                      <div className="text-[11px] text-nf-dim">{t(a.descKey)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 rounded-xl">
              <span className="text-[15px] font-bold text-white/90 tracking-wide">قريباً</span>
            </div>
          </div>
        )}

        {activeTab === "feeds" && (
          <div className="py-4">
            {profileCustomFeeds.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Rss size={22} className="text-nf-accent/50" />
                </div>
                <p className="text-[13px] font-bold text-nf-text mb-1">
                  {isOwn ? "لا توجد فيدات مخصصة بعد" : "لا توجد فيدات عامة"}
                </p>
                <p className="text-[11px] text-nf-dim">
                  {isOwn ? "أنشئ فيداً لتجميع مجتمعات في خلاصة واحدة" : "لم يشارك هذا المستخدم أي فيدات"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profileCustomFeeds.map((feed) => (
                  <div key={feed.id} className="relative group/feedcard">
                    <button
                      onClick={() => onCustomFeedClick?.(feed)}
                      className="w-full flex items-start gap-3 p-4 rounded-xl border border-nf-border-2/50 bg-nf-secondary/20 hover:bg-nf-secondary/40 hover:border-nf-accent/25 transition-all text-right"
                    >
                      <div className="w-10 h-10 rounded-xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center shrink-0">
                        <Rss size={16} className="text-nf-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[13px] font-bold text-nf-text truncate">{feed.name}</span>
                          {feed.isPrivate && <Lock size={10} className="text-nf-dim shrink-0" />}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {feed.communities.slice(0, 3).map((c) => (
                            <span key={c} className="text-[10px] text-nf-dim bg-nf-secondary/80 px-1.5 py-0.5 rounded-md border border-nf-border-2/30">n/{c}</span>
                          ))}
                        </div>
                      </div>
                    </button>
                    {/* Settings button — visible on hover for owner/editor */}
                    {(isOwn || feed.editors?.some((e: any) => (typeof e === "string" ? e : e.uid) === user?.uid)) && (
                      <a
                        href={`/feeds/${feed.id}/settings`}
                        onClick={e => e.stopPropagation()}
                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-nf-secondary/80 text-nf-dim opacity-0 group-hover/feedcard:opacity-100 hover:text-nf-accent hover:bg-nf-hover transition-all"
                        title="إعدادات الفيد"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "games" && (          <div className="py-4">
            {favoriteGameIds.length > 0 ? (
              <div>
                <p className="text-xs text-nf-dim mb-3 font-black tracking-tight">ألعابي المفضلة</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {GAMES.filter(g => favoriteGameIds.includes(g.id)).map(g => (
                    <ProfileGameCard key={g.id} game={g} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Gamepad2 size={28} className="text-nf-dim/20 mx-auto mb-2" />
                <p className="text-xs text-nf-dim mb-1">لا توجد ألعاب مفضلة بعد</p>
                <p className="text-[10px] text-nf-dim/50">اختر حتى 20 لعبة من مكتبة الألعاب</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
