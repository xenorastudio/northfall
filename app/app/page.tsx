"use client";

import Navbar from "../components/Navbar";
import SidebarLeft from "../components/SidebarLeft";
import SidebarRight from "../components/SidebarRight";
import PostComposer from "../components/PostComposer";
import FeedSort from "../components/FeedSort";
import PostCard from "../components/PostCard";
import CommunityPage from "../components/CommunityPage";
import ProfilePage from "../components/ProfilePage";
import PostDetail from "../components/PostDetail";
import CreatePostPage from "../components/CreatePostPage";
import CreateCommunityPage from "../components/CreateCommunityPage";
import EditCommunityPage from "../components/EditCommunityPage";
import CommunityDashboard from "../components/CommunityDashboard";
import CustomFeedModal, { type CustomFeed } from "../components/CustomFeedModal";
import CustomFeedPage from "../components/CustomFeedPage";
import CommunityMembersPage from "../components/CommunityMembersPage";
import ManageCommunitiesPage from "../components/ManageCommunitiesPage";
import { useToast } from "../components/ToastProvider";
import { DataProvider, useData } from "../components/DataProvider";
import { lazy, Suspense } from "react";

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
import { Megaphone, X, ArrowUp, Rss, Pencil } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, orderBy, limit, where, deleteDoc, doc, startAfter, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
// framer-motion removed for performance
import { cn } from "@/lib/utils";

type View = "feed" | "community" | "profile" | "post" | "create" | "settings" | "notifs" | "edit" | "admin" | "games" | "seo" | "create-community" | "edit-community" | "community-dashboard" | "manage-communities" | "custom-feed" | "members";

interface Post {
  id: string;
  community?: string;
  flair?: string;
  authorName?: string;
  authorPhoto?: string;
  authorUid?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  imageUrls?: string[];
  linkUrl?: string;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  votes?: number;
  commentCount?: number;
  postType?: string;
  createdAt?: string;
  awards?: any[];
  poll?: { options: string[]; votes: number[]; duration: string } | null;
  quotedPostId?: string;
}

function AppContent() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { refreshCommunities } = useData();
  const [posts, setPosts] = useState<Post[]>([]);

  // Apply saved accent color on load
  useEffect(() => {
    const ac = localStorage.getItem("nf-accent");
    if (ac) document.documentElement.style.setProperty("--nf-accent", ac);
  }, []);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("feed");

  // Read query params on mount to navigate from landing page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "thread") {
      window.location.replace(`/forum?view=thread&threadId=${params.get("threadId") || ""}`);
      return;
    }
      if (v && ["feed", "community", "profile", "post", "create", "settings", "notifs", "edit", "admin", "games", "seo", "create-community", "edit-community", "community-dashboard", "manage-communities", "custom-feed", "members"].includes(v)) {
      setView(v as View);
      const c = params.get("community"); if (c) setSelectedCommunity(c);
      const p = params.get("postId"); if (p) setSelectedPostId(p);
      const u = params.get("uid"); if (u) setViewingUid(u);
      const e = params.get("editPostId"); if (e) { setEditPostId(e); setView("edit"); }
      // Set tab title on direct URL load
      const titles: Record<string, string> = { feed: "Northfall", community: c ? `n/${c}` : "مجتمع", profile: "بروفايل", post: "منشور", create: "منشور جديد", settings: "إعدادات", notifs: "إشعارات", edit: "تعديل", admin: "إشراف", games: "ألعاب", seo: "أدوات SEO", "create-community": "إنشاء مجتمع جديد", "edit-community": "تعديل مجتمع", "community-dashboard": "لوحة تحكم المجتمع" };
      document.title = (titles[v] || "Northfall") + " — Northfall";
    }
  }, []);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [editPostId, setEditPostId] = useState("");
  const [quotePostId, setQuotePostId] = useState<string | undefined>(undefined);

  // URL-based navigation helper
  const navigateTo = (newView: View, extra: Record<string, string> = {}) => {
    setView(newView);
    const params = new URLSearchParams({ view: newView, ...extra });
    const url = `/app?${params.toString()}`;
    window.history.pushState({ view: newView, ...extra }, "", url);
    // Update browser tab title (like Reddit)
    const titleMap: Record<string, string> = {
      feed: "Northfall",
      community: extra.community ? `n/${extra.community}` : "مجتمع",
      profile: extra.profileName || "بروفايل",
      post: extra.postTitle || "منشور",
      create: "منشور جديد",
      settings: "إعدادات",
      notifs: "إشعارات",
      edit: "تعديل",
      admin: "إشراف",
      games: "ألعاب",
      seo: "أدوات SEO",
      "create-community": "إنشاء مجتمع جديد",
      "edit-community": "تعديل مجتمع",
      "community-dashboard": "لوحة تحكم المجتمع",
      "manage-communities": "إدارة مجتمعاتي",
      "custom-feed": "فيد مخصص",
      "members": "إدارة الأعضاء",
    };
    document.title = (titleMap[newView] || "Northfall") + " — Northfall";
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
    if (v && ["feed", "community", "profile", "post", "create", "settings", "notifs", "edit", "admin", "games", "seo", "create-community", "edit-community", "community-dashboard", "manage-communities", "custom-feed", "members"].includes(v)) {
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
  const [showAnnouncement, setShowAnnouncement] = useState(true);
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

  const openMembers = (name: string) => {
    setMembersCommunity(name);
    navigateTo("members", { community: name });
  };

  // Load custom feeds from Firestore (real-time)
  useEffect(() => {
    if (!user) { setCustomFeeds([]); setActiveCustomFeed(null); return; }
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "customFeeds"),
      (snap) => {
        const feeds = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as CustomFeed))
          .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
        setCustomFeeds(feeds);
        // Update active feed data if it was edited
        setActiveCustomFeed((prev) => {
          if (!prev) return null;
          return feeds.find((f) => f.id === prev.id) || null;
        });
      },
      () => {}
    );
    return () => unsub();
  }, [user]);

  const openCustomFeed = (feed: CustomFeed) => {
    setActiveCustomFeed(feed);
    setFeedMode("all");
    setTagFilter(null);
    const params = new URLSearchParams({ view: "feed", customFeed: feed.id });
    window.history.pushState({ view: "feed", customFeed: feed.id }, "", `/app?${params.toString()}`);
    document.title = `${feed.name} — Northfall`;
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

  const POSTS_PER_PAGE = 10;
  const lastDocRef = useRef<any>(null);
  const hasMoreRef = useRef(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (loadMore && !hasMoreRef.current) return;
    if (!loadMore) {
      setLoading(true);
      lastDocRef.current = null;
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

        // Sort client-side
        allPosts.sort((a, b) => {
          if (sortMode === "top") return (b.votes || 0) - (a.votes || 0);
          if (sortMode === "new") return (b.createdAt || "").localeCompare(a.createdAt || "");
          // hot
          const scoreA = (a.votes || 0) * (1 / (1 + (Date.now() - new Date(a.createdAt || "").getTime()) / 3600000));
          const scoreB = (b.votes || 0) * (1 / (1 + (Date.now() - new Date(b.createdAt || "").getTime()) / 3600000));
          return scoreB - scoreA;
        });

        if (loadMore) setPosts((prev) => [...prev, ...allPosts.slice(prev.length, prev.length + POSTS_PER_PAGE)]);
        else setPosts(allPosts.slice(0, POSTS_PER_PAGE * 3));
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
        allPosts.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        if (loadMore) setPosts(prev => [...prev, ...allPosts]); else setPosts(allPosts);
        const more = allPosts.length >= POSTS_PER_PAGE;
        hasMoreRef.current = more;
        setHasMore(more);
      } else {
        let q;
        if (loadMore && lastDocRef.current) {
          q = query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastDocRef.current), limit(POSTS_PER_PAGE));
        } else {
          q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
        }
        const snap = await getDocs(q);
        const newPosts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Post));
        if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
        if (loadMore) setPosts(prev => [...prev, ...newPosts]); else setPosts(newPosts);
        const more = newPosts.length >= POSTS_PER_PAGE;
        hasMoreRef.current = more;
        setHasMore(more);
      }
    } catch (e) {
      console.error("Fetch posts error:", e);
    } finally {
      setLoading(false);
    }
  }, [feedMode, user, followedUids, joinedCommunities, activeCustomFeed]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Real-time new posts detection (replaces polling)
  useEffect(() => {
    if (view !== "feed") return;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty && posts.length > 0) {
        const latestId = snap.docs[0].id;
        if (!posts.find(p => p.id === latestId)) {
          setNewPostsCount(c => c + 1);
        }
      }
    }, () => {});
    return () => unsub();
  }, [view, posts]);

  // Re-fetch when feed mode changes
  useEffect(() => { fetchPosts(); }, [feedMode]);

  // Re-fetch when custom feed changes
  useEffect(() => { fetchPosts(); }, [activeCustomFeed]);

  const [viewingUid, setViewingUid] = useState<string | null>(null);
  const [editingCommunity, setEditingCommunity] = useState<string>("");
  const [dashboardCommunity, setDashboardCommunity] = useState<string>("");
  const openCommunity = (name: string) => { setSelectedCommunity(name); navigateTo("community", { community: name }); };
  const openCommunityDashboard = (name: string) => { setDashboardCommunity(name); navigateTo("community-dashboard", { community: name }); };
  const openEditCommunity = (name: string) => { setEditingCommunity(name); navigateTo("edit-community", { community: name }); };
  const openProfile = (uid?: string) => { if (uid) { setViewingUid(uid); navigateTo("profile", { uid }); } else if (user) { setViewingUid(user.uid); navigateTo("profile", { uid: user.uid }); } else { setShowLogin(true); } };
  const openPost = (id: string) => { setSelectedPostId(id); const p = posts.find(p => p.id === id); navigateTo("post", { postId: id, postTitle: p?.title || "" }); };
  const openCreate = () => { if (user) { setEditPostId(""); navigateTo("create"); } else setShowLogin(true); };
  const openEdit = (id: string) => { setEditPostId(id); navigateTo("edit", { editPostId: id }); };

  // Update tab title when post data loads (important for new tabs)
  useEffect(() => {
    if (view === "post" && selectedPostId) {
      const p = posts.find(p => p.id === selectedPostId);
      if (p?.title) document.title = `${p.title} — Northfall`;
    }
  }, [view, selectedPostId, posts]);
  const scrollRef = useRef(0);
  const backToFeed = () => {
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

  const sortedPosts = [...posts]
    .filter(p => {
      if (!tagFilter) return true;
      const tag = tagFilter.toLowerCase();
      const comm = (p.community || "").toLowerCase();
      const body = (p.body || "").toLowerCase();
      const title = (p.title || "").toLowerCase();
      return comm.includes(tag) || body.includes("#" + tag) || title.includes("#" + tag);
    })
    .sort((a, b) => {
      if (sortMode === "new") return (b.createdAt || "").localeCompare(a.createdAt || "");
      if (sortMode === "top") return (b.votes || 0) - (a.votes || 0);
      // Hot: decay algorithm - newer + more votes = higher
      const scoreA = (a.votes || 0) * (1 / (1 + (Date.now() - new Date(a.createdAt || "").getTime()) / 3600000));
      const scoreB = (b.votes || 0) * (1 / (1 + (Date.now() - new Date(b.createdAt || "").getTime()) / 3600000));
      return scoreB - scoreA;
    });

  const requireAuth = (action: () => void) => {
    if (user) action();
    else setShowLogin(true);
  };

  return (
    <>
      <Navbar onProfileClick={openProfile} onLoginClick={() => setShowLogin(true)} onCommunityClick={openCommunity} onPostClick={openPost} onNotifsClick={() => navigateTo("notifs")} onSettingsClick={() => navigateTo("settings")} onCreateClick={openCreate} onAdminClick={() => navigateTo("admin")} onSeoClick={() => navigateTo("seo")} />
      <SidebarLeft
        key={sidebarKey}
        onNavClick={(id) => {
          clearCustomFeed();
          if (id === "profile" || id === "saved") requireAuth(() => { setViewingUid(user?.uid || null); navigateTo("profile", { uid: user?.uid || "" }); });
          else if (id === "notifs") navigateTo("notifs");
          else if (id === "settings") navigateTo("settings");
          else if (id === "forums") window.open("/forum", "_blank");
          else if (id === "games") navigateTo("games");
          else if (id === "manage-communities") requireAuth(() => navigateTo("manage-communities"));
          else if (id === "hot" || id === "new" || id === "top") { setSortMode(id); navigateTo("feed"); }
          else backToFeed();
        }}
        onCommunityClick={(name) => { clearCustomFeed(); openCommunity(name); }}
        activeNav={view === "feed" ? (activeCustomFeed ? "" : sortMode === "hot" ? "hot" : sortMode === "new" ? "new" : sortMode === "top" ? "top" : "home") : view === "profile" ? "profile" : view === "settings" ? "settings" : view === "notifs" ? "notifs" : view === "games" ? "games" : view === "community" ? selectedCommunity : ""}
        onCreateCommunity={() => requireAuth(() => navigateTo("create-community"))}
        onDashboardClick={(name) => openCommunityDashboard(name)}
        customFeeds={user ? customFeeds : []}
        activeCustomFeedId={activeCustomFeed?.id ?? null}
        onCustomFeedClick={(feed) => requireAuth(() => openCustomFeed(feed))}
        onCreateCustomFeed={() => requireAuth(() => { setEditingCustomFeed(null); navigateTo("custom-feed"); })}
        onEditCustomFeed={(feed) => requireAuth(() => { setEditingCustomFeed(feed); navigateTo("custom-feed"); })}
      />

      <div className="md:ml-[260px] min-h-screen flex justify-center" style={{ paddingTop: "var(--nav-total-height)" }}>
        <div className="w-full max-w-[1280px] px-3 md:px-6 py-3 md:py-5 pb-20 md:pb-5 flex gap-8 justify-center items-start" style={{ direction: "rtl" }}>
          <div className={cn("hidden lg:block self-stretch", view === "community" && "hidden")}><SidebarRight onCommunityClick={openCommunity} onPostClick={openPost} communityName={view === "community" ? selectedCommunity : undefined} /></div>

          <div className={cn("flex-1", view === "feed" ? "max-w-[680px]" : view === "create-community" ? "max-w-[1150px]" : view === "community" ? "max-w-[1000px]" : view === "custom-feed" ? "max-w-[1100px]" : view === "members" ? "max-w-[1100px]" : "max-w-[1100px]")} style={{ direction: "rtl" }}>
            <div>
              {view === "feed" && (
                <div key="feed" className="animate-in fade-in duration-150">
                  <PostComposer onFocus={openCreate} onPost={() => { backToFeed(); }} />

                  {/* Custom Feed Header */}
                  {activeCustomFeed && (
                    <div className="rounded-xl border border-nf-border-2/60 bg-nf-secondary/30 overflow-hidden mb-3">
                      {/* Top accent bar */}
                      <div className="h-0.5 w-full bg-nf-accent/60" />
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center shrink-0">
                          <Rss size={16} className="text-nf-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-nf-text">{activeCustomFeed.name}</span>
                            {activeCustomFeed.isPrivate && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-nf-secondary text-nf-dim border border-nf-border-2/50">خاص</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {activeCustomFeed.communities.slice(0, 4).map((c) => (
                              <span key={c} className="text-[10px] text-nf-dim">n/{c}</span>
                            ))}
                            {activeCustomFeed.communities.length > 4 && (
                              <span className="text-[10px] text-nf-dim">+{activeCustomFeed.communities.length - 4}</span>
                            )}
                          </div>
                        </div>
                        <button
                        onClick={() => { setEditingCustomFeed(activeCustomFeed); navigateTo("custom-feed"); }}
                          className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors shrink-0"
                          title="تعديل الفيد"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={clearCustomFeed}
                          className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors shrink-0"
                          title="إغلاق الفيد"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  <FeedSort onSortChange={(s) => setSortMode(s)} onTagClick={(t) => setTagFilter(t === tagFilter ? null : t)} tagFilter={tagFilter} feedMode={activeCustomFeed ? "all" : feedMode} onFeedModeChange={activeCustomFeed ? undefined : setFeedMode} requireAuth={requireAuth} />

                  {newPostsCount > 0 && (
                    <button
                      onClick={() => { setNewPostsCount(0); fetchPosts(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-xl bg-nf-accent/10 border border-nf-accent/30 text-nf-accent text-xs font-bold hover:bg-nf-accent/20 transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <ArrowUp size={14} className="animate-bounce" />
                      {newPostsCount} {t("gen.newPosts")}
                    </button>
                  )}

                  {showAnnouncement && (
                    <div className="flex items-center gap-3 bg-nf-primary border border-nf-border-2 rounded-lg px-4 py-3 mb-3">
                      <Megaphone size={18} className="text-nf-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-nf-text">{t("gen.welcome")}</div>
                        <div className="text-xs text-nf-muted">{t("gen.welcomeSub")}</div>
                      </div>
                      <button onClick={() => setShowAnnouncement(false)} className="text-nf-muted hover:text-nf-text shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {loading ? (
                    <>
                        {[1,2,3].map(i => (
                          <div key={i} className="border border-nf-border-2 rounded-lg p-4 overflow-hidden relative" style={{ animationDelay: `${i * 0.08}s` }}>
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
                    ) : posts.length === 0 ? (
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
                      sortedPosts.map((post) => (
                          <PostCard
                            key={post.id}
                            postId={post.id}
                            community={post.community ? `n/${post.community}` : `n/${t("gen.general")}`}
                            author={post.authorName || t("gen.user")}
                            authorUid={post.authorUid}
                            authorPhoto={post.authorPhoto}
                            time={post.createdAt ? timeAgo(post.createdAt) : t("gen.now")}
                            title={post.title}
                            body={post.body}
                            image={post.imageUrl}
                            imageUrls={post.imageUrls}
                            flair={post.flair}
                            isNsfw={post.isNsfw}
                            isSpoiler={post.isSpoiler}
                            votes={post.votes || 0}
                            comments={post.commentCount || 0}
                            awards={post.awards}
                            poll={post.poll}
                            quotedPostId={post.quotedPostId}
                            onPostClick={openPost}
                            onCommunityClick={openCommunity}
                            onProfileClick={openProfile}
                            onEditClick={openEdit}
                            onDeleteClick={async (id) => { await deleteDoc(doc(db, "posts", id)); fetchPosts(); }}
                            onQuoteClick={(id) => { setQuotePostId(id); navigateTo("create"); }}
                          />
                      ))
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
                  <CommunityPage name={selectedCommunity} onBack={backToFeed} onEditClick={openEdit} onDeleteClick={async (id) => { await deleteDoc(doc(db, "posts", id)); fetchPosts(); }} onPostClick={openPost} onJoinToggle={() => setSidebarKey(k => k + 1)} onDashboardClick={(name) => openCommunityDashboard(name)} onMembersClick={openMembers} />
                </div>
              )}

              {view === "profile" && (
                <div key="profile" className="animate-in fade-in duration-150">
                  <ProfilePage uid={viewingUid || undefined} onEditClick={openEdit} onDeleteClick={async (id) => { await deleteDoc(doc(db, "posts", id)); fetchPosts(); }} onSettingsClick={() => navigateTo("settings")} onAdminClick={() => navigateTo("admin")} onPostClick={openPost} onCustomFeedClick={(feed) => requireAuth(() => openCustomFeed(feed))} />
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
                  <CreatePostPage onBack={backToFeed} onPost={backToFeed} editPostId={view === "edit" ? editPostId : undefined} quotedPostId={view === "create" ? quotePostId : undefined} />
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
                <div key="post" className="animate-in fade-in duration-150">
                  <PostDetail postId={selectedPostId} onBack={backToFeed} onCommunityClick={openCommunity} onProfileClick={openProfile} onEditClick={openEdit} onDeleteClick={async (id) => { await deleteDoc(doc(db, "posts", id)); fetchPosts(); backToFeed(); }} onQuoteClick={(id) => { setQuotePostId(id); navigateTo("create"); }} />
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

              {view === "custom-feed" && user && (
                <div key="custom-feed" className="animate-in fade-in duration-150">
                  <CustomFeedPage
                    editFeed={editingCustomFeed}
                    onBack={() => { setEditingCustomFeed(null); backToFeed(); }}
                    onSaved={(feed) => {
                      if (activeCustomFeed?.id === feed.id) setActiveCustomFeed(feed);
                      setEditingCustomFeed(null);
                      backToFeed();
                    }}
                    onDeleted={(id) => {
                      if (activeCustomFeed?.id === id) clearCustomFeed();
                      else backToFeed();
                    }}
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
            </div>
          </div>
        </div>
      </div>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />



      {/* Back to top */}
      {showBackTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 sm:bottom-6 left-6 w-10 h-10 rounded-full bg-nf-accent text-white flex items-center justify-center shadow-lg hover:bg-nf-accent/80 transition-all z-50 animate-in fade-in zoom-in duration-200"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </>
  );
}

export default function AppPage() {
  return (
    <AuthProvider>
      <DataProvider>
        <I18nProvider>
          <ToastProvider>
            <MaintenanceOverlay>
              <AppContent />
            </MaintenanceOverlay>
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
