"use client";

import Navbar from "../components/Navbar";
import DonateSupportPopup from "../components/DonateSupportPopup";
import BowieEasterEggListener from "../components/BowieEasterEggListener";
import SidebarLeft from "../components/SidebarLeft";
import SidebarRight from "../components/SidebarRight";
import PostComposer from "../components/PostComposer";
import FeedSort from "../components/FeedSort";
import FeedHighlights from "../components/FeedHighlights";
import PostCard from "../components/PostCard";
import CommunityPage from "../components/CommunityPage";
import ProfilePage from "../components/ProfilePage";
import PostDetail from "../components/PostDetail";
import CreatePostPage from "../components/CreatePostPage";
import CreateCommunityPage from "../components/CreateCommunityPage";
import CreateCustomFeedPage from "../components/CreateCustomFeedPage";
import EditCommunityPage from "../components/EditCommunityPage";
import CommunityDashboard from "../components/CommunityDashboard";
import ModeratorPanel from "../components/ModeratorPanel";
import CustomFeedModal, { type CustomFeed } from "../components/CustomFeedModal";
import CommunityMembersPage from "../components/CommunityMembersPage";
import ManageCommunitiesPage from "../components/ManageCommunitiesPage";
import InviteAcceptDialog from "../components/InviteAcceptDialog";
import { useToast } from "../components/ToastProvider";
import { DataProvider, useData } from "../components/DataProvider";
import { lazy, Suspense } from "react";
import { postMatchesHashtag, interestTagsFromHashtag } from "@/lib/hashtags";
import { addUserInterests, mergeInterestsOrdered, normalizeInterestTag } from "@/lib/user-interests";

const SettingsPage = lazy(() => import("../components/SettingsPage"));
const NotificationsPage = lazy(() => import("../components/NotificationsPage"));
const AdminPage = lazy(() => import("../components/AdminPage"));
const GamesPage = lazy(() => import("../components/GamesPage"));
const SeoToolsPage = lazy(() => import("../components/SeoToolsPage"));
import MaintenanceOverlay from "../components/MaintenanceOverlay";
import AuthProvider, { useAuth } from "../components/AuthProvider";
import { I18nProvider, useI18n } from "../components/I18nProvider";
import LoginModal from "../components/LoginModal";
import ToastProvider from "../components/ToastProvider";
import { ClassicTabsProvider, useClassicTabs } from "../components/ClassicTabsProvider";
import { X, ArrowUp } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit, where, deleteDoc, doc, getDoc, setDoc, startAfter, onSnapshot } from "firebase/firestore";
import { deletePostCompletely } from "@/lib/delete-content";
import { canUserAccessFeed, pruneStaleUserFeedRefs } from "@/lib/custom-feed-access";
import { trackImplicitInterest } from "@/lib/implicit-interest";
import { interestTagsFromCategory } from "@/lib/user-interests";
import { setDocumentTitle, truncateTabLabel } from "@/lib/document-title";
import { db } from "@/lib/firebase";
// framer-motion removed for performance
import { cn } from "@/lib/utils";
import {
  sortPostsByMode,
  mergePostsDedup,
  mergeGlobalHotCandidates,
  prependPostsDedup,
  buildCommunityMetaLookup,
  filterPostsForGlobalFeed,
  filterPostsForHomeFeed,
  parseCommunityMutesFromUser,
  type CommunityMutesMap,
} from "@/lib/feed-ranking";
import {
  rankPostsWithHideLearning,
  type NegativeSignal,
} from "@/lib/feed-hide-ranking";
import { applyInterestBoostToPosts } from "@/lib/feed-interest-boost";
import { getOnboardingCompleted } from "@/lib/user-onboarding";
import { hidePostFromFeed, undoHidePost } from "@/lib/hide-post";
import {
  formatPostDestinationPath,
  firestoreCommunityIdFromDisplay,
  isUserDestinationPath,
} from "@/lib/post-target";

type View = "feed" | "community" | "profile" | "post" | "create" | "settings" | "notifs" | "edit" | "admin" | "games" | "seo" | "create-community" | "create-custom-feed" | "edit-custom-feed" | "edit-community" | "community-dashboard" | "manage-communities" | "members" | "mod-panel" | "living-upgrade";

interface Post {
  id: string;
  community?: string;
  postTarget?: string;
  flair?: string;
  flairBg?: string | null;
  flairTextColor?: string | null;
  authorName?: string;
  authorPhoto?: string;
  authorUid?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  imageUrls?: string[];
  linkUrl?: string;
  videoUrl?: string;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  votes?: number;
  commentCount?: number;
  views?: number;
  postType?: string;
  createdAt?: string;
  awards?: any[];
  poll?: { options: string[]; votes: number[]; duration: string } | null;
  quotedPostId?: string;
  hashtags?: string[];
}

function AppContent() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const {
    refreshCommunities,
    communities: allCommunities,
    joinedCommunities: joinedFromData,
    userInterests,
    interestTagWeights,
    pushUserInterests,
  } = useData();
  const { isClassic } = useClassicTabs();
  const [posts, setPosts] = useState<Post[]>([]);

  // Apply saved accent color on load
  useEffect(() => {
    const ac = localStorage.getItem("nf-accent");
    if (ac) document.documentElement.style.setProperty("--nf-accent", ac);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getOnboardingCompleted(user.uid).then((done) => {
      if (!cancelled && !done) window.location.replace("/onboarding");
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("feed");

  // Read query params on mount to navigate from landing page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    const c = params.get("community");
    const isPreview = params.get("preview") === "true";

    // Handle invite link
    const inviteToken = params.get("invite");
    const inviteCommunity = params.get("c");
    if (inviteToken && inviteCommunity) {
      setInvitePending({ token: inviteToken, community: inviteCommunity });
      return;
    }

    if (v === "thread") {
      window.location.replace(`/forum?view=thread&threadId=${params.get("threadId") || ""}`);
      return;
    }

    let targetView = v;
    if (c && (!v || isPreview)) {
      targetView = "community";
    }

    const viewToUse = targetView || "feed";
    if (["feed", "community", "profile", "post", "create", "settings", "notifs", "edit", "admin", "games", "seo", "create-community", "create-custom-feed", "edit-custom-feed", "edit-community", "community-dashboard", "manage-communities", "custom-feed", "members"].includes(viewToUse)) {
      setView(viewToUse as View);
      if (c) setSelectedCommunity(c);
      const p = params.get("postId"); if (p) setSelectedPostId(p);
      const u = params.get("uid"); if (u) setViewingUid(u);
      const e = params.get("editPostId"); if (e) { setEditPostId(e); setView("edit"); }
      setDocumentTitle();
    }
  }, []);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [editPostId, setEditPostId] = useState("");
  const [livingPostId, setLivingPostId] = useState("");
  const [quotePostId, setQuotePostId] = useState<string | undefined>(undefined);

  // URL-based navigation helper
  const navigateTo = (newView: View, extra: Record<string, string> = {}) => {
    setView(newView);
    const safeExtra: Record<string, string> = {};
    for (const [key, value] of Object.entries(extra)) {
      if (typeof value === "string") safeExtra[key] = value;
    }
    const params = new URLSearchParams({ view: newView, ...safeExtra });
    const url = `/app?${params.toString()}`;
    window.history.pushState({ view: newView, ...safeExtra }, "", url);
    if (newView === "post" && extra.postTitle) {
      setDocumentTitle(truncateTabLabel(extra.postTitle));
    } else if (newView === "community" && extra.community) {
      setDocumentTitle(truncateTabLabel(`n/${extra.community}`));
    } else {
      setDocumentTitle();
    }
  };

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view") as View | null | "thread";
      if (v === "thread") {
        window.location.replace(`/forum?view=thread&threadId=${params.get("threadId") || ""}`);
        return;
      }
    if (v && ["feed", "community", "profile", "post", "create", "settings", "notifs", "edit", "admin", "games", "seo", "create-community", "create-custom-feed", "edit-custom-feed", "edit-community", "community-dashboard", "manage-communities", "custom-feed", "members"].includes(v)) {
        setView(v);
        const c = params.get("community"); if (c) setSelectedCommunity(c);
        const p = params.get("postId"); if (p) setSelectedPostId(p);
        const u = params.get("uid"); if (u) setViewingUid(u);
        const e = params.get("editPostId"); if (e) setEditPostId(e);
      } else {
        setView("feed");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => {
    const openLogin = () => setShowLogin(true);
    window.addEventListener("nf-login-required", openLogin);
    return () => window.removeEventListener("nf-login-required", openLogin);
  }, []);
  const [showBackTop, setShowBackTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Back to top visibility + scroll progress
  useEffect(() => {
    const handler = () => {
      setShowBackTop(window.scrollY > 400);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  const [sortMode, setSortMode] = useState("hot");
  const [feedMode, setFeedMode] = useState<"all" | "following">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [followedUids, setFollowedUids] = useState<string[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [sidebarKey, setSidebarKey] = useState(0);

  // ── Custom Feeds ──────────────────────────────────────────────
  const [customFeeds, setCustomFeeds] = useState<CustomFeed[]>([]);
  const [activeCustomFeed, setActiveCustomFeed] = useState<CustomFeed | null>(null);
  const [showCustomFeedModal, setShowCustomFeedModal] = useState(false);
  const [editingCustomFeed, setEditingCustomFeed] = useState<CustomFeed | null>(null);
  const [membersCommunity, setMembersCommunity] = useState<string>("");
  const [modPanelCommunity, setModPanelCommunity] = useState<string>("");
  const [invitePending, setInvitePending] = useState<{ token: string; community: string } | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [negativeSignals, setNegativeSignals] = useState<NegativeSignal[]>([]);
  const [categoryAffinities, setCategoryAffinities] = useState<Map<string, number>>(new Map());
  const [pendingHidePosts, setPendingHidePosts] = useState<Map<string, Post>>(new Map());
  const hideConfirmTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const communityCategoryLookup = useMemo(() => {
    const m = new Map<string, string>();
    allCommunities.forEach((c) => {
      if (c.name && c.category) m.set(c.name.toLowerCase(), c.category);
    });
    return m;
  }, [allCommunities]);

  const openMembers = (name: string) => {
    setMembersCommunity(name);
    navigateTo("members", { community: name });
  };

  const openModPanel = (name: string) => {
    setModPanelCommunity(name);
    navigateTo("mod-panel", { community: name });
  };

  // Load custom feeds from Firestore (real-time)
  useEffect(() => {
    if (!user) { setCustomFeeds([]); setActiveCustomFeed(null); return; }
    void pruneStaleUserFeedRefs(user.uid);
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "customFeeds"),
      async (snap) => {
        const validFeeds: CustomFeed[] = [];
        for (const d of snap.docs) {
          const allowed = await canUserAccessFeed(d.id, user.uid);
          if (!allowed) {
            deleteDoc(d.ref).catch(() => {});
            continue;
          }
          validFeeds.push({ id: d.id, ...d.data() } as CustomFeed);
        }
        validFeeds.sort((a, b) => {
          const ta = a.createdAt ? (typeof a.createdAt === "object" && a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
          const tb = b.createdAt ? (typeof b.createdAt === "object" && b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
          return ta - tb;
        });
        setCustomFeeds(validFeeds);
        setActiveCustomFeed((prev) => {
          if (!prev) return null;
          return validFeeds.find((f) => f.id === prev.id) || null;
        });
      },
      () => {}
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHiddenPostIds(new Set());
      setNegativeSignals([]);
      setCategoryAffinities(new Map());
      return;
    }
    const unsubHidden = onSnapshot(collection(db, "users", user.uid, "hiddenPosts"), (snap) => {
      setHiddenPostIds(new Set(snap.docs.map((d) => d.id)));
    });
    const unsubSignals = onSnapshot(collection(db, "users", user.uid, "negativeSignals"), (snap) => {
      setNegativeSignals(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            category: String(data.category || ""),
            timestamp: String(data.timestamp || ""),
            postId: data.postId as string | undefined,
          };
        })
      );
    });
    const unsubAff = onSnapshot(collection(db, "users", user.uid, "categoryAffinities"), (snap) => {
      const m = new Map<string, number>();
      snap.docs.forEach((d) => {
        const cat = String(d.data().category || "").toLowerCase();
        if (cat) m.set(cat, Number(d.data().score) || 0);
      });
      setCategoryAffinities(m);
    });
    return () => {
      unsubHidden();
      unsubSignals();
      unsubAff();
    };
  }, [user]);

  const openCustomFeed = async (feed: CustomFeed) => {
    if (!user) return;
    const allowed = await canUserAccessFeed(feed.id, user.uid);
    if (!allowed) {
      toast("لم يعد لديك صلاحية على هذا الفيد", "error");
      deleteDoc(doc(db, "users", user.uid, "customFeeds", feed.id)).catch(() => {});
      setCustomFeeds((prev) => prev.filter((f) => f.id !== feed.id));
      return;
    }
    setActiveCustomFeed(feed);
    setFeedMode("all");
    setTagFilter(null);
    const params = new URLSearchParams({ view: "feed", customFeed: feed.id });
    window.history.pushState({ view: "feed", customFeed: feed.id }, "", `/app?${params.toString()}`);
    setDocumentTitle(truncateTabLabel(feed.name));
    setView("feed");
  };

  const clearCustomFeed = () => {
    setActiveCustomFeed(null);
    navigateTo("feed");
  };
  // ─────────────────────────────────────────────────────────────

  // Fetch followed users and joined communities
  useEffect(() => {
    if (!user) { setFollowedUids([]); setJoinedCommunities([]); return; }
    async function fetchFollowData() {
      try {
        const followingSnap = await getDocs(collection(db, "users", user!.uid, "following"));
        setFollowedUids(followingSnap.docs.map(d => d.id));
        const commSnap = await getDocs(collection(db, "users", user!.uid, "communities"));
        setJoinedCommunities(commSnap.docs.map(d => d.data().name || d.id));
      } catch (e) { console.error(e); }
    }
    fetchFollowData();
  }, [user]);

  // Load muted words + community mutes (وقت الكتم لكل مجتمع)
  const [mutedWords, setMutedWords] = useState<string[]>([]);
  const communityMutesRef = useRef<CommunityMutesMap>({});

  const matureCommunitySet = useRef<Set<string>>(new Set());
  useEffect(() => {
    const s = new Set<string>();
    allCommunities.forEach((c) => { if (c.isMature) s.add(c.name.toLowerCase()); });
    matureCommunitySet.current = s;
  }, [allCommunities]);

  const feedKnownIdsRef = useRef<Set<string>>(new Set());
  const feedBaselineReadyRef = useRef(false);
  const suppressNewAlertUntilRef = useRef(0);
  const lastAcknowledgedLatestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMutedWords([]);
      communityMutesRef.current = {};
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setMutedWords(d.mutedWords || []);
        let mutes = parseCommunityMutesFromUser(d);
        const list: string[] = d.mutedCommunities || [];
        if (list.length > 0 && Object.keys(mutes).length === 0) {
          const now = new Date().toISOString();
          const cm: Record<string, string> = {};
          list.forEach((n) => { cm[n] = now; });
          mutes = parseCommunityMutesFromUser({ communityMutes: cm });
          setDoc(doc(db, "users", user.uid), { communityMutes: cm }, { merge: true }).catch(() => {});
        }
        communityMutesRef.current = mutes;
      } else {
        setMutedWords([]);
        communityMutesRef.current = {};
      }
    }, () => {});
    return () => unsub();
  }, [user]);

  const POSTS_PER_PAGE = 10;
  const FETCH_BATCH = 30;
  /** حجم كل ساق في استعلام Hot العام (حديث + تفاعل) */
  const GLOBAL_HOT_LEG = 80;
  const lastDocRef = useRef<any>(null);
  const hotRecentCursorRef = useRef<any>(null);
  const hotVotesCursorRef = useRef<any>(null);
  const hasMoreRef = useRef(true);
  const [hasMore, setHasMore] = useState(true);
  const publicCommunityLookupRef = useRef(buildCommunityMetaLookup([]));
  useEffect(() => {
    publicCommunityLookupRef.current = buildCommunityMetaLookup(
      allCommunities.map((c) => ({
        name: c.name,
        communityType: c.communityType,
        showInForum: c.showInForum,
      }))
    );
  }, [allCommunities]);

  const applyGlobalFeedFilters = useCallback(
    (list: Post[]) =>
      filterPostsForGlobalFeed(list, {
        publicLookup: publicCommunityLookupRef.current,
      }),
    []
  );

  /** كتم المجتمع: يخفي الجديد فقط من الفيد الرئيسي — لا الخلاصة المخصصة */
  const applyHomeFeedPipeline = useCallback(
    (list: Post[]) => {
      const pub = applyGlobalFeedFilters(list);
      if (activeCustomFeed) return pub;
      return filterPostsForHomeFeed(pub, communityMutesRef.current);
    },
    [activeCustomFeed, applyGlobalFeedFilters]
  );

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (loadMore && !hasMoreRef.current) return;
    if (!loadMore) {
      setLoading(true);
      lastDocRef.current = null;
      hotRecentCursorRef.current = null;
      hotVotesCursorRef.current = null;
      hasMoreRef.current = true;
    }
    try {
      // ── Custom Feed mode ──────────────────────────────────────
      if (activeCustomFeed && activeCustomFeed.communities.length > 0) {
        // Split into chunks of 10 (Firestore "in" limit)
        const comms = activeCustomFeed.communities;
        const chunks: string[][] = [];
        for (let i = 0; i < comms.length; i += 10) chunks.push(comms.slice(i, i + 10));

        let allPosts: Post[] = [];
        for (const chunk of chunks) {
          // No orderBy to avoid composite index requirement — sort client-side
          const q = query(
            collection(db, "posts"),
            where("community", "in", chunk),
            limit(30)
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const post = { id: d.id, ...d.data() } as Post;
            if (!allPosts.find((p) => p.id === post.id)) allPosts.push(post);
          });
        }

        const ranked = sortPostsByMode(
          allPosts,
          sortMode === "top" ? "top" : sortMode === "new" ? "new" : "hot"
        );
        if (loadMore) setPosts((prev) => mergePostsDedup(prev, ranked));
        else setPosts(ranked);
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }
      // ─────────────────────────────────────────────────────────

      if (feedMode === "following" && user && (followedUids.length > 0 || joinedCommunities.length > 0)) {
        let allPosts: Post[] = [];
        if (followedUids.length > 0) {
          const q = query(collection(db, "posts"), where("authorUid", "in", followedUids.slice(0, 10)), limit(POSTS_PER_PAGE));
          const snap = await getDocs(q);
          allPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
        }
        if (joinedCommunities.length > 0) {
          const q = query(collection(db, "posts"), where("community", "in", joinedCommunities.slice(0, 10)), limit(POSTS_PER_PAGE));
          const snap = await getDocs(q);
          const commPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
          const existingIds = new Set(allPosts.map(p => p.id));
          commPosts.forEach(p => { if (!existingIds.has(p.id)) allPosts.push(p); });
        }
        const filtered = applyHomeFeedPipeline(allPosts);
        const ranked = sortPostsByMode(filtered, sortMode === "top" ? "top" : sortMode === "new" ? "new" : "hot");
        if (loadMore) setPosts(prev => mergePostsDedup(prev, ranked));
        else setPosts(ranked);
        const more = ranked.length >= POSTS_PER_PAGE;
        hasMoreRef.current = more;
        setHasMore(more);
      } else {
        // ── Global platform feed: كل المجتمعات العامة، ترتيب بالـ score فقط ──
        // الكتم لا يخفي المنشورات — +18 يُعرض مع blur في الواجهة

        if (sortMode === "hot") {
          const recentQ =
            loadMore && hotRecentCursorRef.current
              ? query(
                  collection(db, "posts"),
                  orderBy("createdAt", "desc"),
                  startAfter(hotRecentCursorRef.current),
                  limit(GLOBAL_HOT_LEG)
                )
              : query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(GLOBAL_HOT_LEG));
          const votesQ =
            loadMore && hotVotesCursorRef.current
              ? query(
                  collection(db, "posts"),
                  orderBy("votes", "desc"),
                  startAfter(hotVotesCursorRef.current),
                  limit(GLOBAL_HOT_LEG)
                )
              : query(collection(db, "posts"), orderBy("votes", "desc"), limit(GLOBAL_HOT_LEG));

          const [recentSnap, votesSnap] = await Promise.all([getDocs(recentQ), getDocs(votesQ)]);
          if (recentSnap.docs.length > 0) {
            hotRecentCursorRef.current = recentSnap.docs[recentSnap.docs.length - 1];
          }
          if (votesSnap.docs.length > 0) {
            hotVotesCursorRef.current = votesSnap.docs[votesSnap.docs.length - 1];
          }

          const toPost = (d: { id: string; data: () => Record<string, unknown> }) =>
            ({ id: d.id, ...d.data() } as Post);
          const recentPosts = recentSnap.docs.map(toPost);
          const votePosts = votesSnap.docs.map(toPost);
          let merged = mergeGlobalHotCandidates(recentPosts, votePosts, votePosts.slice(0, 25));
          merged = sortPostsByMode(applyHomeFeedPipeline(merged), "hot");

          if (loadMore) setPosts((prev) => mergePostsDedup(prev, merged));
          else setPosts(merged);

          const more =
            recentSnap.docs.length >= GLOBAL_HOT_LEG || votesSnap.docs.length >= GLOBAL_HOT_LEG;
          hasMoreRef.current = more;
          setHasMore(more);
        } else if (sortMode === "top") {
          const batchSize = FETCH_BATCH;
          const q =
            loadMore && lastDocRef.current
              ? query(
                  collection(db, "posts"),
                  orderBy("votes", "desc"),
                  startAfter(lastDocRef.current),
                  limit(batchSize)
                )
              : query(collection(db, "posts"), orderBy("votes", "desc"), limit(batchSize));
          const snap = await getDocs(q);
          let newPosts = snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Post)
          );
          if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
          newPosts = sortPostsByMode(applyHomeFeedPipeline(newPosts), "top");
          if (loadMore) setPosts((prev) => mergePostsDedup(prev, newPosts));
          else setPosts(newPosts);
          const more = snap.docs.length >= batchSize;
          hasMoreRef.current = more;
          setHasMore(more);
        } else {
          const batchSize = POSTS_PER_PAGE;
          const q =
            loadMore && lastDocRef.current
              ? query(
                  collection(db, "posts"),
                  orderBy("createdAt", "desc"),
                  startAfter(lastDocRef.current),
                  limit(batchSize)
                )
              : query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(batchSize));
          const snap = await getDocs(q);
          let newPosts = snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Post)
          );
          if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
          newPosts = applyHomeFeedPipeline(newPosts);
          if (loadMore) setPosts((prev) => mergePostsDedup(prev, newPosts));
          else setPosts(newPosts);
          const more = snap.docs.length >= batchSize;
          hasMoreRef.current = more;
          setHasMore(more);
        }
      }
    } catch (e) {
      console.error("Fetch posts error:", e);
    } finally {
      setLoading(false);
      if (!loadMore) {
        setNewPostsCount(0);
        suppressNewAlertUntilRef.current = Date.now() + 800;
      }
    }
  }, [feedMode, user, followedUids, joinedCommunities, activeCustomFeed, sortMode, applyHomeFeedPipeline]);

  const handleHidePost = useCallback(
    (post: Post) => {
      if (!user) {
        setShowLogin(true);
        return;
      }
      setPendingHidePosts((prev) => new Map(prev).set(post.id, post));

      const existing = hideConfirmTimersRef.current.get(post.id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        hideConfirmTimersRef.current.delete(post.id);
        setPendingHidePosts((prev) => {
          const next = new Map(prev);
          next.delete(post.id);
          return next;
        });
        void hidePostFromFeed(
          user.uid,
          {
            id: post.id,
            flair: post.flair,
            hashtags: post.hashtags,
            community: post.community,
          },
          communityCategoryLookup
        ).catch((e) => console.warn("[hidePost]", e));
      }, 8000);

      hideConfirmTimersRef.current.set(post.id, timer);
    },
    [user, communityCategoryLookup]
  );

  const handleUndoHide = useCallback(
    async (postId: string) => {
      const timer = hideConfirmTimersRef.current.get(postId);
      if (timer) {
        clearTimeout(timer);
        hideConfirmTimersRef.current.delete(postId);
      }
      setPendingHidePosts((prev) => {
        const next = new Map(prev);
        next.delete(postId);
        return next;
      });

      if (user && hiddenPostIds.has(postId)) {
        try {
          await undoHidePost(user.uid, postId);
          toast("تم التراجع — المنشور ظهر مجدداً", "success");
        } catch {
          toast("تعذّر التراجع", "error");
        }
      }
    },
    [user, hiddenPostIds, toast]
  );

  useEffect(() => {
    feedKnownIdsRef.current = new Set(posts.map((p) => p.id));
    if (posts.length > 0 && !loading) feedBaselineReadyRef.current = true;
  }, [posts, loading]);

  const loadNewPostsIntoFeed = useCallback(async () => {
    suppressNewAlertUntilRef.current = Date.now() + 4000;
    setNewPostsCount(0);

    try {
      const snap = await getDocs(
        query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(25))
      );
      if (!snap.empty) lastAcknowledgedLatestIdRef.current = snap.docs[0].id;

      const incoming = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Post)
      );
      const filtered = applyHomeFeedPipeline(incoming);
      const mode =
        sortMode === "top" ? ("top" as const) : sortMode === "new" ? ("new" as const) : ("hot" as const);

      setPosts((prev) => sortPostsByMode(prependPostsDedup(filtered, prev), mode));
      filtered.forEach((p) => feedKnownIdsRef.current.add(p.id));
    } catch (e) {
      console.error("Load new posts error:", e);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [applyHomeFeedPipeline, sortMode]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Reset states on user logout to prevent cached restricted community feeds from staying visible
  useEffect(() => {
    if (!user) {
      setView("feed");
      setSelectedCommunity("");
      setSelectedPostId("");
      setActiveCustomFeed(null);
      setFeedMode("all");
      setTagFilter(null);
      setViewingUid(null);
      fetchPosts();
    }
  }, [user, fetchPosts]);

  // منشورات جديدة — تظهر فقط بعد تحديث يدوي (بدون onSnapshot)
  const checkForNewPosts = useCallback(async () => {
    if (!feedBaselineReadyRef.current) return;
    try {
      const snap = await getDocs(
        query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10))
      );
      if (snap.empty) return;
      const latestId = snap.docs[0].id;
      if (lastAcknowledgedLatestIdRef.current === latestId) {
        setNewPostsCount(0);
        return;
      }
      const known = feedKnownIdsRef.current;
      let count = 0;
      for (const d of snap.docs) {
        if (!known.has(d.id)) count++;
        else break;
      }
      setNewPostsCount(count);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (view !== "feed") return;
    const onFocus = () => {
      if (Date.now() < suppressNewAlertUntilRef.current) return;
      void checkForNewPosts();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [view, checkForNewPosts]);

  // Re-fetch when feed mode or sort changes
  useEffect(() => {
    feedBaselineReadyRef.current = false;
    lastAcknowledgedLatestIdRef.current = null;
    setNewPostsCount(0);
    fetchPosts();
  }, [feedMode, sortMode]);

  // Re-fetch when custom feed changes
  useEffect(() => { fetchPosts(); }, [activeCustomFeed]);

  const [viewingUid, setViewingUid] = useState<string | null>(null);
  const [editingCommunity, setEditingCommunity] = useState<string>("");
  const [dashboardCommunity, setDashboardCommunity] = useState<string>("");
  const openCommunity = (name: string) => {
    if (isUserDestinationPath(name)) return;
    const id = firestoreCommunityIdFromDisplay(name);
    if (!id) return;
    if (user) {
      const comm = allCommunities.find((c) => c.name === id);
      trackImplicitInterest("community", id, interestTagsFromCategory(comm?.category || ""), user.uid);
    }
    setSelectedCommunity(id);
    navigateTo("community", { community: id });
  };
  const openCommunityDashboard = (name: string) => { setDashboardCommunity(name); navigateTo("community-dashboard", { community: name }); };
  const openEditCommunity = (name: string) => { setEditingCommunity(name); navigateTo("edit-community", { community: name }); };
  const openProfile = (uid?: string) => {
    const targetUid = uid || user?.uid;
    if (!targetUid) { setShowLogin(true); return; }
    setViewingUid(targetUid);
    navigateTo("profile", { uid: targetUid });
  };
  const openPost = (id: string) => {
    setSelectedPostId(id);
    const p = posts.find(p => p.id === id);
    if (p?.community) {
      setSelectedCommunity(p.community);
    } else {
      setSelectedCommunity("");
    }
    navigateTo("post", { postId: id, postTitle: p?.title || "" });
  };
  const openCreate = (communityName?: string) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    const comm =
      typeof communityName === "string" && communityName.trim() ? communityName.trim() : undefined;
    setEditPostId("");
    if (comm) {
      setSelectedCommunity(comm);
      navigateTo("create", { community: comm });
    } else {
      setSelectedCommunity("");
      navigateTo("create");
    }
  };
  const openEdit = (id: string) => { setEditPostId(id); navigateTo("edit", { editPostId: id }); };
  const openUpgrade = (id: string) => { setLivingPostId(id); setView("living-upgrade"); setDocumentTitle(); };

  // Update tab title when post data loads (important for new tabs)
  useEffect(() => {
    if (view === "post" && selectedPostId) {
      const p = posts.find(p => p.id === selectedPostId);
      if (p?.title) setDocumentTitle(truncateTabLabel(p.title));
    }
  }, [view, selectedPostId, posts]);
  const scrollRef = useRef(0);
  const backToFeed = () => {
    setSelectedCommunity("");
    navigateTo("feed");
    // Restore scroll position after view change
    requestAnimationFrame(() => { window.scrollTo({ top: scrollRef.current, behavior: "instant" as ScrollBehavior }); });
  };

  // Save scroll position before leaving feed
  useEffect(() => {
    if (view === "feed") {
      const onScroll = () => { scrollRef.current = window.scrollY; };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, [view]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); openCreate(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [user]);

  const handleHashtagClick = useCallback(
    (rawTag: string) => {
      const tag = normalizeInterestTag(rawTag);
      if (!tag) return;
      if (view !== "feed") {
        setTagFilter(tag);
        navigateTo("feed");
      } else {
        setTagFilter((prev) => (prev === tag ? null : tag));
      }
      const interestTags = interestTagsFromHashtag(tag);
      pushUserInterests(interestTags);
      if (user) {
        void addUserInterests(user.uid, interestTags, mergeInterestsOrdered(userInterests, interestTags));
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [user, userInterests, pushUserInterests, view, navigateTo]
  );

  const sortedPosts = [...posts]
    .filter((p) => !tagFilter || postMatchesHashtag(p, tagFilter))
    .filter(p => {
      if (!mutedWords.length) return true;
      const title = (p.title || "").toLowerCase();
      const body = (p.body || "").toLowerCase();
      return !mutedWords.some(w => title.includes(w) || body.includes(w));
    });

  const rankMode = sortMode === "top" ? "top" as const : sortMode === "new" ? "new" as const : "hot" as const;
  const feedHideCtx = {
    negativeSignals,
    categoryAffinities,
    communityCategories: communityCategoryLookup,
  };
  const rankedPosts = rankPostsWithHideLearning(
    (activeCustomFeed ? sortedPosts : filterPostsForHomeFeed(sortedPosts, communityMutesRef.current))
      .filter((p) => !hiddenPostIds.has(p.id) || pendingHidePosts.has(p.id)),
    user ? feedHideCtx : { negativeSignals: [], categoryAffinities: new Map(), communityCategories: communityCategoryLookup },
    rankMode
  );
  const displayPosts =
    user && Object.keys(interestTagWeights).length > 0
      ? applyInterestBoostToPosts(rankedPosts, interestTagWeights, communityCategoryLookup)
      : rankedPosts;

  const requireAuth = (action: () => void) => {
    if (user) action();
    else setShowLogin(true);
  };

  return (
    <>
      <DonateSupportPopup />
      <BowieEasterEggListener />
      <Navbar onProfileClick={openProfile} onLoginClick={() => setShowLogin(true)} onCommunityClick={openCommunity} onPostClick={openPost} onNotifsClick={() => navigateTo("notifs")} onSettingsClick={() => navigateTo("settings")} onCreateClick={openCreate} onAdminClick={() => navigateTo("admin")} onSeoClick={() => navigateTo("seo")} activeCommunity={view === "community" ? selectedCommunity : undefined} />
      <SidebarLeft
        key={sidebarKey}
        onNavClick={(id) => {
          clearCustomFeed();
          if (id === "profile" || id === "saved") requireAuth(() => { setViewingUid(user?.uid || null); navigateTo("profile", { uid: user?.uid || "" }); });
          else if (id === "notifs") navigateTo("notifs");
          else if (id === "settings") navigateTo("settings");
          else if (id === "forums") window.open("/forum", "_blank");
          else if (id === "games") navigateTo("games");
          else if (id === "launches") window.open("/launches", "_blank", "noopener,noreferrer");
          else if (id === "manage-communities") requireAuth(() => navigateTo("manage-communities"));
          else if (id === "hot" || id === "new" || id === "top") { setSortMode(id); navigateTo("feed"); }
          else backToFeed();
        }}
        onCommunityClick={(name) => { clearCustomFeed(); openCommunity(name); }}
        activeNav={view === "feed" ? (activeCustomFeed ? "" : sortMode === "hot" ? "hot" : sortMode === "new" ? "new" : sortMode === "top" ? "top" : "home") : view === "profile" ? "profile" : view === "settings" ? "settings" : view === "notifs" ? "notifs" : view === "games" ? "games" : view === "manage-communities" ? "manage-communities" : view === "community" ? selectedCommunity : ""}
        onCreateCommunity={() => requireAuth(() => navigateTo("create-community"))}
        onDashboardClick={(name) => openCommunityDashboard(name)}
        customFeeds={user ? customFeeds : []}
        activeCustomFeedId={activeCustomFeed?.id ?? null}
        onCustomFeedClick={(feed) => requireAuth(() => openCustomFeed(feed))}
        onCreateCustomFeed={() => requireAuth(() => navigateTo("create-custom-feed"))}
      />

      {/* Classic Tab Bar removed */}

      {/* Custom Feed banner */}
      {activeCustomFeed?.bannerUrl && view === "feed" && activeCustomFeed?.showBannerBg !== false && (
        <div
          className="fixed left-0 right-0 pointer-events-none overflow-hidden"
          style={{ zIndex: -1, height: "700px", top: 0 }}
        >
          <img
            src={activeCustomFeed.bannerUrl}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.35 }}
          />
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to bottom,
              var(--bg-body) 0%,
              var(--bg-body) calc(var(--nav-total-height)),
              rgba(0,0,0,0.2) calc(var(--nav-total-height) + 20px),
              transparent 30%,
              transparent 55%,
              var(--bg-body) 95%
            )`
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, var(--bg-body) 0%, transparent 12%, transparent 88%, var(--bg-body) 100%)"
          }} />
        </div>
      )}

      <div className="md:ml-[260px] min-h-screen flex justify-center" style={{ paddingTop: "var(--nav-total-height)", position: "relative", zIndex: 1 }}>
        <div className="w-full max-w-[1280px] px-2 md:px-4 py-3 md:py-4 pb-20 md:pb-5 flex gap-6 justify-center items-start" style={{ direction: "rtl" }}>
          <div className={cn("hidden lg:block self-stretch shrink-0", (view !== "feed" && view !== "community" && view !== "post") && "hidden")} style={{ position: "relative", zIndex: 1 }}><SidebarRight onCommunityClick={openCommunity} onPostClick={openPost} communityName={(view === "community" || view === "post") ? (selectedCommunity || undefined) : undefined} /></div>

          <div className={cn("flex-1 min-w-0", view === "feed" ? "max-w-[740px]" : view === "create-community" ? "max-w-[1150px]" : view === "community" ? "max-w-[1000px]" : view === "members" ? "max-w-[1100px]" : "max-w-[1100px]")} style={{ direction: "rtl" }}>
            <div>

              {view === "feed" && (
                <div key="feed" className="animate-in fade-in duration-150">
                  <PostComposer onFocus={openCreate} onPost={() => { backToFeed(); }} />
                  <FeedSort
                    onSortChange={(s) => setSortMode(s)}
                    onTagClick={handleHashtagClick}
                    tagFilter={tagFilter}
                    onTagFilterClear={() => setTagFilter(null)}
                    feedMode={activeCustomFeed ? "all" : feedMode}
                    onFeedModeChange={activeCustomFeed ? undefined : setFeedMode}
                    requireAuth={requireAuth}
                  />

                  {/* Highlights — ثابت على الرئيسية (كل / جديد / رائج) */}
                  {!activeCustomFeed && !tagFilter && (
                    <FeedHighlights onPostClick={openPost} onCommunityClick={openCommunity} />
                  )}

                  {newPostsCount > 0 && (
                    <button
                      type="button"
                      onClick={loadNewPostsIntoFeed}
                      className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-xl border border-nf-accent/30 text-nf-accent text-xs font-bold hover:bg-nf-accent/20 transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-200"
                      style={{ backgroundColor: "var(--bg-primary)" }}
                    >
                      <ArrowUp size={14} className="animate-bounce" />
                      {newPostsCount} {t("gen.newPosts")}
                    </button>
                  )}



                  <div className="flex flex-col overflow-visible">
                    {loading ? (
                    <>
                        {[1,2,3].map(i => (
                          <div key={i} className="border-b border-nf-border-2/40 p-4 overflow-hidden relative">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)" }} />
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 rounded-full bg-nf-secondary/80" />
                              <div className="w-20 h-3 rounded bg-nf-secondary/80" />
                              <div className="w-12 h-3 rounded bg-nf-secondary/60" />
                            </div>
                            <div className="w-3/4 h-5 rounded bg-nf-secondary/80 mb-2" />
                            <div className="w-full h-3 rounded bg-nf-secondary/60 mb-1" />
                            <div className="w-2/3 h-3 rounded bg-nf-secondary/40" />
                            <div className="flex items-center gap-3 mt-3">
                              <div className="w-16 h-3 rounded bg-nf-secondary/60" />
                              <div className="w-20 h-3 rounded bg-nf-secondary/60" />
                              <div className="w-14 h-3 rounded bg-nf-secondary/40" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : displayPosts.length === 0 ? (
                      <div className="text-center py-12 text-nf-muted">
                        {feedMode === "following" ? (
                          <>
                            <p className="text-lg font-bold mb-1">{t("gen.noFollowingPosts")}</p>
                            <p className="text-sm">{t("gen.followHint")}</p>
                            <button onClick={() => setFeedMode("all")} className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-nf-accent text-white hover:bg-nf-accent/80 transition-colors">{t("gen.viewAll")}</button>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-bold mb-1">{t("gen.noPosts")}</p>
                            <p className="text-sm">{t("gen.createFirst")}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      displayPosts.map((post) =>
                        pendingHidePosts.has(post.id) ? (
                          <div
                            key={post.id}
                            className="border-b border-nf-border-2/40 px-4 py-4 flex items-center justify-between gap-3 bg-nf-hover/20 min-h-[72px]"
                          >
                            <span className="text-[13px] text-nf-muted">تم إخفاء هذا المنشور من الفيد</span>
                            <button
                              type="button"
                              onClick={() => void handleUndoHide(post.id)}
                              className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold text-nf-accent bg-nf-accent/10 hover:bg-nf-accent/20 transition-colors"
                            >
                              تراجع
                            </button>
                          </div>
                        ) : (
                          <PostCard
                            key={post.id}
                            postId={post.id}
                            community={formatPostDestinationPath(post)}
                            author={post.authorName || t("gen.user")}
                            authorUid={post.authorUid}
                            authorPhoto={post.authorPhoto}
                            time={post.createdAt ? timeAgo(post.createdAt) : t("gen.now")}
                            title={post.title || ""}
                            body={post.body}
                            image={post.imageUrl}
                            imageUrls={post.imageUrls}
                            linkUrl={post.linkUrl}
                            videoUrl={(post as any).videoUrl}
                            mediaItems={(post as any).mediaItems}
                            flair={post.flair}
                            flairBg={(post as Post).flairBg}
                            flairTextColor={(post as Post).flairTextColor}
                            isNsfw={post.isNsfw || !!(post.community && matureCommunitySet.current.has(post.community.toLowerCase()))}
                            isSpoiler={post.isSpoiler}
                            isLiving={(post as any).isLiving}
                            currentVersion={(post as any).currentVersion}
                            versionsCount={(post as any).versions?.length}
                            votes={post.votes || 0}
                            comments={post.commentCount || 0}
                            views={post.views || 0}
                            awards={post.awards}
                            poll={post.poll}
                            quotedPostId={post.quotedPostId}
                            onPostClick={openPost}
                            onCommunityClick={openCommunity}
                            onProfileClick={openProfile}
                            onEditClick={openEdit}
                            onDeleteClick={async (id) => { try { await deletePostCompletely(id); } catch (e) { console.error(e); } fetchPosts(); }}
                            onQuoteClick={(id) => { setQuotePostId(id); navigateTo("create"); }}
                            hashtags={(post as Post).hashtags}
                            onHashtagClick={handleHashtagClick}
                            onHideClick={() => handleHidePost(post)}
                          />
                        )
                      )
                    )}
                    {hasMore && posts.length > 0 && (
                      <button onClick={() => fetchPosts(true)} className="w-full py-3 rounded-lg text-xs font-bold text-nf-dim hover:text-nf-accent hover:bg-nf-accent/5 transition-colors">
                        {t("gen.loadMore") || "تحميل المزيد"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {view === "community" && selectedCommunity && (
                <div key="community" className="animate-in fade-in duration-150">
                  <CommunityPage name={selectedCommunity} onBack={backToFeed} onEditClick={openEdit} onDeleteClick={async (id) => { try { await deletePostCompletely(id); } catch (e) { console.error(e); } fetchPosts(); }} onPostClick={openPost} onCreatePost={(c) => openCreate(c)} onJoinToggle={() => setSidebarKey(k => k + 1)} onDashboardClick={(name) => openCommunityDashboard(name)} onMembersClick={openMembers} onModPanelClick={openModPanel} customFeeds={customFeeds} showToast={toast} onSidebarRefresh={() => setSidebarKey(k => k + 1)} />
                </div>
              )}

              {view === "profile" && (
                <div key="profile" className="animate-in fade-in duration-150">
                  <ProfilePage uid={viewingUid || undefined} onEditClick={openEdit} onDeleteClick={async (id) => { try { await deletePostCompletely(id); } catch (e) { console.error(e); } fetchPosts(); }} onSettingsClick={() => navigateTo("settings")} onAdminClick={() => navigateTo("admin")} onPostClick={openPost} onCustomFeedClick={(feed) => requireAuth(() => openCustomFeed(feed))} />
                </div>
              )}

              {view === "settings" && (
                <div key="settings" className="animate-in fade-in duration-150">
                  <Suspense fallback={<div className="p-8 text-center text-nf-dim">جاري التحميل...</div>}>
                    <SettingsPage onBack={backToFeed} />
                  </Suspense>
                </div>
              )}

              {view === "notifs" && (
                <div key="notifs" className="animate-in fade-in duration-150">
                  <Suspense fallback={<div className="p-8 text-center text-nf-dim">جاري التحميل...</div>}>
                    <NotificationsPage onBack={backToFeed} />
                  </Suspense>
                </div>
              )}

              {view === "admin" && (
                <div key="admin" className="animate-in fade-in duration-150">
                  <Suspense fallback={<div className="p-8 text-center text-nf-dim">جاري التحميل...</div>}>
                    <AdminPage onBack={backToFeed} onPostClick={openPost} />
                  </Suspense>
                </div>
              )}

              {view === "seo" && (
                <div key="seo" className="animate-in fade-in duration-150">
                  <Suspense fallback={<div className="p-8 text-center text-nf-dim">جاري التحميل...</div>}>
                    <SeoToolsPage onBack={backToFeed} />
                  </Suspense>
                </div>
              )}

              {view === "games" && (
                <div key="games" className="animate-in fade-in duration-150">
                  <Suspense fallback={<div className="p-8 text-center text-nf-dim">جاري التحميل...</div>}>
                    <GamesPage onBack={backToFeed} />
                  </Suspense>
                </div>
              )}

              {(view === "create" || view === "edit") && (
                <div key={view} className="animate-in fade-in duration-150">
                  <CreatePostPage
                    onBack={selectedCommunity ? () => navigateTo("community", { community: selectedCommunity }) : backToFeed}
                    onPost={selectedCommunity ? () => navigateTo("community", { community: selectedCommunity }) : backToFeed}
                    editPostId={view === "edit" ? editPostId : undefined}
                    quotedPostId={view === "create" ? quotePostId : undefined}
                    defaultCommunity={view === "create" ? selectedCommunity || undefined : undefined}
                  />
                </div>
              )}

              {view === "living-upgrade" && livingPostId && (
                <div key="living-upgrade" className="animate-in fade-in duration-150">
                  <CreatePostPage
                    onBack={() => setView("post")}
                    onPost={() => { setView("post"); fetchPosts(); }}
                    livingPostId={livingPostId}
                  />
                </div>
              )}

              {view === "create-community" && (
                <div key="create-community" className="animate-in fade-in duration-150">
                  <CreateCommunityPage
                    onBack={backToFeed}
                    onSuccess={async (cleanName) => {
                      await refreshCommunities();
                      openCommunity(cleanName);
                    }}
                    showToast={(msg, type) => toast(msg, type || "info")}
                  />
                </div>
              )}

              {view === "create-custom-feed" && (
                <div key="create-custom-feed" className="animate-in fade-in duration-150">
                  <CreateCustomFeedPage
                    onBack={backToFeed}
                    onSuccess={(feed) => {
                      setActiveCustomFeed({ id: feed.id, name: feed.name, communities: feed.communities });
                      navigateTo("feed", { customFeed: feed.id });
                    }}
                    showToast={(msg, type) => toast(msg, type || "info")}
                  />
                </div>
              )}

              {/* edit-custom-feed: redirects to /feeds/[feedId]/settings */}

              {view === "edit-community" && editingCommunity && (
                <div key="edit-community" className="animate-in fade-in duration-150">
                  <EditCommunityPage
                    communityName={editingCommunity}
                    onBack={backToFeed}
                    onSaved={() => { setDashboardCommunity(editingCommunity); navigateTo("community-dashboard", { community: editingCommunity }); }}
                    showToast={(msg, type) => toast(msg, type || "info")}
                  />
                </div>
              )}

              {view === "community-dashboard" && dashboardCommunity && (
                <div key="community-dashboard" className="animate-in fade-in duration-150">
                  <CommunityDashboard
                    communityName={dashboardCommunity}
                    onBack={backToFeed}
                    onEdit={() => { setEditingCommunity(dashboardCommunity); navigateTo("edit-community", { community: dashboardCommunity }); }}
                    showToast={(msg, type) => toast(msg, type || "info")}
                  />
                </div>
              )}

              {view === "post" && (
                <div key={`post-${selectedPostId}`} className="animate-in fade-in duration-150">
                  <PostDetail postId={selectedPostId} onBack={backToFeed} onCommunityClick={openCommunity} onProfileClick={openProfile} onEditClick={openEdit} onDeleteClick={async (id) => { try { await deletePostCompletely(id); } catch (e) { console.error(e); } fetchPosts(); backToFeed(); }} onQuoteClick={(id) => { setQuotePostId(id); navigateTo("create"); }} onUpgradeClick={openUpgrade} onHashtagClick={handleHashtagClick} />
                </div>
              )}

              {view === "manage-communities" && (
                <div key="manage-communities" className="animate-in fade-in duration-150">
                  <ManageCommunitiesPage
                    onBack={backToFeed}
                    onCommunityClick={(name) => { clearCustomFeed(); openCommunity(name); }}
                    onCreateCommunity={() => requireAuth(() => navigateTo("create-community"))}
                    onDashboardClick={openCommunityDashboard}
                  />
                </div>
              )}

              {view === "members" && membersCommunity && (
                <div key="members" className="animate-in fade-in duration-150">
                  <CommunityMembersPage
                    communityName={membersCommunity}
                    onBack={() => { openCommunity(membersCommunity); }}
                  />
                </div>
              )}

              {view === "mod-panel" && modPanelCommunity && (
                <div key="mod-panel" className="animate-in fade-in duration-150">
                  <ModeratorPanel
                    communityName={modPanelCommunity}
                    onBack={() => { openCommunity(modPanelCommunity); }}
                    onPostClick={openPost}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />

      {/* Invite Accept Dialog */}
      {invitePending && (
        <InviteAcceptDialog
          community={invitePending.community}
          onAccept={async () => {
            if (!user) { setShowLogin(true); return; }
            try {
              const { setDoc, doc: fsDoc } = await import("firebase/firestore");
              await setDoc(fsDoc(db, "communities", invitePending.community, "members", user.uid), { uid: user.uid, joinedAt: new Date().toISOString(), role: "member" });
              await setDoc(fsDoc(db, "users", user.uid, "communities", invitePending.community), { name: invitePending.community, joinedAt: new Date().toISOString() });
              setInvitePending(null);
              window.history.replaceState({}, "", "/app");
              openCommunity(invitePending.community);
            } catch (e) { console.error(e); }
          }}
          onDecline={() => { setInvitePending(null); window.history.replaceState({}, "", "/app"); }}
          requireLogin={!user}
          onLogin={() => setShowLogin(true)}
        />
      )}



      {/* Back to top — hidden (was gray FAB) */}

    </>
  );
}

export default function AppPage() {
  return (
    <AuthProvider>
      <DataProvider>
        <I18nProvider>
          <ToastProvider>
            <ClassicTabsProvider>
              <MaintenanceOverlay>
                <AppContent />
              </MaintenanceOverlay>
            </ClassicTabsProvider>
          </ToastProvider>
        </I18nProvider>
      </DataProvider>
    </AuthProvider>
  );
}

function timeAgo(timestamp: any): string {
  if (!timestamp) return "now";
  try {
    const date = typeof timestamp === "string" ? new Date(timestamp) : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 2592000)}mo`;
  } catch {
    return "now";
  }
}
