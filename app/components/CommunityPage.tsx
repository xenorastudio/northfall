"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, LogIn, Clock, TrendingUp, Search, X, Shield, Tag, Link2, Plus, Copy, Check, UserCog, ChevronDown, Crown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, deleteDoc, getCountFromServer, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PostCard from "./PostCard";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";
import CommunityMembersPanel from "./CommunityMembersPanel";

interface CommunityPageProps {
  name: string;
  onBack: () => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  onPostClick?: (id: string) => void;
  onJoinToggle?: (name: string, joined: boolean) => void;
  onDashboardClick?: (name: string) => void;
  onMembersClick?: (name: string) => void;
}

export default function CommunityPage({ name, onBack, onEditClick, onDeleteClick, onPostClick, onJoinToggle, onDashboardClick, onMembersClick }: CommunityPageProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [sortMode, setSortMode] = useState<"new" | "top" | "comments">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbMeta, setDbMeta] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [moderators, setModerators] = useState<{ uid: string; name: string; photo: string; role: string }[]>([]);
  // Sidebar hide on scroll down, show on scroll up
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current + 10) setSidebarVisible(false);
      else if (y < lastScrollY.current - 10) setSidebarVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getDoc(doc(db, "communities", name)).then(snap => {
      if (snap.exists()) setDbMeta(snap.data());
    }).catch(() => {});
  }, [name]);

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
  const isOwner = user?.uid === meta.creatorUid;
  const isRestricted = meta.communityType === "restricted";
  const isPrivate = meta.communityType === "private";
  const needsInvite = isPrivate || isRestricted;

  // Check if current user is staff (owner/admin/moderator)
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => {
    if (!user || isOwner) { setIsStaff(isOwner); return; }
    import("firebase/firestore").then(({ getDoc, doc: fsDoc }) => {
      getDoc(fsDoc(db, "communities", name, "members", user.uid)).then(s => {
        if (s.exists()) {
          const role = s.data().role;
          setIsStaff(role === "admin" || role === "moderator");
        }
      }).catch(() => {});
    });
  }, [user?.uid, name, isOwner]);

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
    // Private community: only via invite
    if (isPrivate && !joined && !isOwner) return;
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
      }
      onJoinToggle?.(name, !prevJoined);
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

  const filteredPosts = [...posts]
    .filter(p => !searchQuery.trim() || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === "top") return (b.votes || 0) - (a.votes || 0);
      if (sortMode === "comments") return (b.commentCount || 0) - (a.commentCount || 0);
      return 0;
    });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      style={meta.accentColor ? { "--accent": meta.accentColor } as React.CSSProperties : {}}>

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
              {meta.founded && <span>تأسس {meta.founded}</span>}
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1 flex-wrap justify-end">
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
            <button onClick={toggleJoin}
              className={cn("px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all",
                joined ? "bg-transparent text-nf-muted border-nf-border-2 hover:border-red-400/50 hover:text-red-400"
                  : isPrivate && !isOwner ? "bg-nf-secondary text-nf-dim border-nf-border-2 cursor-not-allowed opacity-50"
                  : "bg-nf-text text-nf-body border-nf-text hover:opacity-90")}>
              {!user ? <span className="flex items-center gap-1.5"><LogIn size={13} /> انضم</span>
                : joined ? "✓ عضو"
                : isPrivate && !isOwner ? "🔒 خاص"
                : "انضم"}
            </button>
          </div>
        </div>

        {/* Short desc */}
        {meta.shortDesc && <p className="text-[12px] text-nf-muted leading-relaxed mb-3">{meta.shortDesc}</p>}

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
      <div className="flex gap-5 items-start">
        {/* Posts column */}
        <div className="flex-1 min-w-0">
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
                isNsfw={post.isNsfw} isSpoiler={post.isSpoiler} votes={post.votes || 0}
                comments={post.commentCount || 0} awards={post.awards} poll={post.poll}
                quotedPostId={post.quotedPostId} onPostClick={onPostClick}
                onEditClick={onEditClick} onDeleteClick={onDeleteClick} />
            ))}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className={cn(
          "hidden lg:flex flex-col gap-3 w-[280px] shrink-0 sticky transition-all duration-300",
          sidebarVisible ? "top-[calc(var(--nav-total-height)+12px)] opacity-100" : "top-[calc(var(--nav-total-height)+12px)] opacity-0 pointer-events-none translate-y-2"
        )}>
          {/* About card */}
          <div className="bg-nf-card border border-nf-border-2/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-nf-border-2/30">
              <p className="text-[12px] font-bold text-nf-text">عن المجتمع</p>
            </div>
            <div className="px-4 py-3 space-y-3">
              {meta.shortDesc
                ? <p className="text-[12px] text-nf-muted leading-relaxed">{meta.shortDesc}</p>
                : <p className="text-[12px] text-nf-dim italic">لا يوجد وصف بعد</p>
              }
              <div className="flex items-center gap-4 pt-1 border-t border-nf-border-2/20">
                <div className="text-center">
                  <p className="text-[15px] font-black text-nf-text">{memberCount.toLocaleString()}</p>
                  <p className="text-[10px] text-nf-dim">عضو</p>
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-black text-nf-text">{posts.length}</p>
                  <p className="text-[10px] text-nf-dim">منشور</p>
                </div>
                {meta.founded && (
                  <div className="text-center">
                    <p className="text-[15px] font-black text-nf-text">{meta.founded}</p>
                    <p className="text-[10px] text-nf-dim">تأسيس</p>
                  </div>
                )}
              </div>
              <button onClick={toggleJoin}
                className={cn("w-full py-2 rounded-xl text-[12px] font-bold transition-all",
                  joined ? "bg-nf-secondary text-nf-muted hover:bg-red-500/10 hover:text-red-400"
                    : isPrivate && !isOwner ? "bg-nf-secondary text-nf-dim cursor-not-allowed opacity-50"
                    : "bg-nf-accent text-nf-primary hover:bg-nf-accent/80")}>
                {joined ? "✓ عضو — اضغط للمغادرة" : isPrivate && !isOwner ? "🔒 يتطلب دعوة" : "انضم للمجتمع"}
              </button>
            </div>
          </div>

          {/* Rules — collapsible like Reddit */}
          {meta.rules?.length > 0 && (
            <div className="bg-nf-card border border-nf-border-2/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-nf-border-2/30 flex items-center gap-2">
                <Shield size={13} className="text-nf-accent" />
                <p className="text-[12px] font-bold text-nf-text">قوانين المجتمع</p>
              </div>
              <div className="divide-y divide-nf-border-2/20">
                {meta.rules.slice(0, 10).map((rule: string, i: number) => {
                  const parts = rule.split(" || ");
                  const title = parts[0];
                  const detail = parts[1] || "";
                  const isOpen = expandedRule === i;
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedRule(isOpen ? null : i)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-nf-secondary/20 transition-colors text-right"
                      >
                        <span className="text-[11px] font-bold text-nf-accent shrink-0 w-4">{i + 1}</span>
                        <span className="flex-1 text-[12px] text-nf-text font-medium leading-snug">{title}</span>
                        <ChevronDown size={13} className={cn("text-nf-dim shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && detail && (
                        <div className="px-4 pb-3 pt-0">
                          <p className="text-[11px] text-nf-muted leading-relaxed mr-7">{detail}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {meta.tags?.length > 0 && (
            <div className="bg-nf-card border border-nf-border-2/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-nf-border-2/30 flex items-center gap-2">
                <Tag size={13} className="text-nf-accent" />
                <p className="text-[12px] font-bold text-nf-text">الوسوم</p>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {meta.tags.slice(0, 10).map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-nf-secondary text-[10px] text-nf-muted border border-nf-border-2/50">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bookmarks */}
          {meta.bookmarks?.length > 0 && (
            <div className="bg-nf-card border border-nf-border-2/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-nf-border-2/30 flex items-center gap-2">
                <Link2 size={13} className="text-nf-accent" />
                <p className="text-[12px] font-bold text-nf-text">روابط مفيدة</p>
              </div>
              <div className="px-4 py-2">
                {meta.bookmarks.map((b: any, i: number) => (
                  <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2 text-[11px] text-nf-accent hover:text-nf-text transition-colors border-b border-nf-border-2/20 last:border-0">
                    <Link2 size={10} className="shrink-0" /> {b.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Moderators */}
          {moderators.length > 0 && (
            <div className="bg-nf-card border border-nf-border-2/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-nf-border-2/30 flex items-center gap-2">
                <Shield size={13} className="text-nf-accent" />
                <p className="text-[12px] font-bold text-nf-text">المشرفون</p>
              </div>
              <div className="divide-y divide-nf-border-2/15">
                {moderators.map(m => (
                  <div key={m.uid} className="flex items-center gap-2.5 px-4 py-2.5">
                    {m.photo
                      ? <img src={m.photo} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      : <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center text-[10px] font-bold text-nf-muted shrink-0">{m.name[0]?.toUpperCase()}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-nf-text truncate">u/{m.name}</p>
                      <p className="text-[10px] text-nf-dim">
                        {m.role === "owner" ? "صانع المجتمع" : m.role === "admin" ? "مشرف" : "ناظم"}
                      </p>
                    </div>
                    {m.role === "owner" && <Crown size={11} className="text-amber-500 shrink-0" />}
                    {m.role === "admin" && <Shield size={11} className="text-red-400 shrink-0" />}
                    {m.role === "moderator" && <Shield size={11} className="text-blue-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Members management panel removed — now a full page */}
    </motion.div>
  );
}
