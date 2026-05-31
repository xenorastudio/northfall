"use client";

import { useState, useEffect, useMemo } from "react";
import { scoreCommunitiesByUserInterests, popularCommunityIds } from "@/lib/recommendations";
import {
  interestTagsFromCommunityData,
  mergeInterestsOrdered,
  saveSubscriptionInterests,
} from "@/lib/user-interests";
import { resolveCategoryDisplay } from "@/lib/community-categories";
import { collection, getDocs, query, orderBy, limit, getDoc, doc, getCountFromServer, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Flame, TrendingUp, Bookmark, ExternalLink, ChevronDown, Mail, Calendar, Users, Globe, ArrowUp, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "./I18nProvider";
import { useData } from "./DataProvider";
import { useAuth } from "./AuthProvider";
import { formatPostDestinationPath } from "@/lib/post-target";
import { timeAgoShort } from "@/lib/time-ago";
import { textDirAttr } from "@/lib/display-text";
import { postHotScore } from "@/lib/feed-ranking";

function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("ar-SA");
}

function postBodyPreview(body?: string, maxLen = 80): string {
  if (!body || typeof body !== "string") return "";
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  return flat.length > maxLen ? `${flat.slice(0, maxLen)}…` : flat;
}

function formatFoundedDate(founded: string | undefined, createdAt: any): string {
  const AR_MONTHS = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  
  try {
    let date: Date | null = null;
    if (createdAt) {
      if (typeof createdAt === "object" && createdAt.toDate) {
        date = createdAt.toDate();
      } else if (typeof createdAt === "string" || typeof createdAt === "number") {
        date = new Date(createdAt);
      }
    }
    
    if (!date && founded) {
      if (founded.includes("-")) {
        date = new Date(founded);
      } else if (!isNaN(Number(founded)) && founded.length === 4) {
        return founded;
      }
    }
    
    if (date && !isNaN(date.getTime())) {
      const month = AR_MONTHS[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${year}`;
    }
  } catch (e) {
    console.error("Error formatting founded date:", e);
  }
  
  return founded || "2026";
}

// Render **bold** and [text](url) markdown inline, with dir="auto" line wrapping
function renderRichText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const parts: React.ReactNode[] = [];
        const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)]+)/g;
        let last = 0;
        let m: RegExpExecArray | null;
        let key = 0;
        while ((m = regex.exec(line)) !== null) {
          if (m.index > last) parts.push(<span key={key++}>{line.slice(last, m.index)}</span>);
          if (m[1] !== undefined && m[2] !== undefined) {
            parts.push(
              <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-nf-accent hover:text-nf-text hover:underline underline-offset-2 font-semibold">
                {m[1]}
              </a>
            );
          } else if (m[3] !== undefined) {
            parts.push(<strong key={key++} className="font-bold text-nf-text">{m[3]}</strong>);
          } else if (m[4] !== undefined) {
            parts.push(
              <a key={key++} href={m[4]} target="_blank" rel="noopener noreferrer" className="text-nf-accent hover:text-nf-text hover:underline underline-offset-2 font-semibold break-all">
                {m[4]}
              </a>
            );
          }
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(<span key={key++}>{line.slice(last)}</span>);
        return (
          <div key={idx} dir="auto" className="leading-relaxed">
            {parts}
          </div>
        );
      })}
    </div>
  );
}



export default function SidebarRight({ onCommunityClick, onPostClick, communityName }: { onCommunityClick: (name: string) => void; onPostClick: (id: string) => void; communityName?: string }) {
  const { t, lang } = useI18n();
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [creatorPhoto, setCreatorPhoto] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [dbMeta, setDbMeta] = useState<any>(null);
  const { user } = useAuth();
  const { communities: allComms, joinedCommunities, userInterests, refreshCommunities } = useData();
  const [expandedRuleIndex, setExpandedRuleIndex] = useState<number | null>(null);
  const [liveMemberCount, setLiveMemberCount] = useState<number | null>(null);

  type SidebarComm = {
    id: string;
    label: string;
    img: string;
    shortDesc: string;
    category: string;
    members: number;
    isJoined: boolean;
  };

  const mapIdsToComms = (ids: string[]): SidebarComm[] =>
    ids
      .filter((name) => name !== communityName)
      .map((name) => {
        const c = allComms.find((x) => x.name === name);
        if (!c) return null;
        const cat = resolveCategoryDisplay(c.category);
        const catLabel = cat ? cat.replace(/^[^\s]+\s/, "") : "";
        return {
          id: c.name,
          label: c.label,
          img: c.img,
          shortDesc: (c.shortDesc || "").trim(),
          category: catLabel,
          members: c.members || 0,
          isJoined: joinedCommunities.includes(c.name),
        };
      })
      .filter(Boolean) as SidebarComm[];

  const suggestedComms = useMemo(() => {
    let ids = scoreCommunitiesByUserInterests(
      allComms,
      userInterests,
      joinedCommunities,
      communityName,
      4
    );
    if (!ids.length) {
      ids = popularCommunityIds(allComms, joinedCommunities, communityName, 4);
    }
    return mapIdsToComms(ids);
  }, [allComms, joinedCommunities, communityName, userInterests]);

  const trendingComms = useMemo(() => {
    const suggestedSet = new Set(suggestedComms.map((c) => c.id));
    const poolWithoutSuggested = allComms.filter((c) => !suggestedSet.has(c.name));

    // إن بقي مجتمع واحد أو لا شيء بعد استبعاد المقترحة → نعرض الأكثر شعباً من الكل (حتى مع تكرار)
    const pool =
      poolWithoutSuggested.length >= 2
        ? poolWithoutSuggested
        : allComms;

    let ids = popularCommunityIds(pool, joinedCommunities, communityName, 6);
    if (ids.length === 0) {
      ids = [...pool]
        .filter((c) => c.name !== communityName)
        .sort((a, b) => (b.members || 0) - (a.members || 0))
        .slice(0, 6)
        .map((c) => c.name);
    }
    return mapIdsToComms(ids);
  }, [allComms, joinedCommunities, communityName, suggestedComms]);

  const joinCommunity = async (commId: string) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("nf-login-required"));
      return false;
    }
    if (joinedCommunities.includes(commId)) return true;
    try {
      const memberRef = doc(db, "communities", commId, "members", user.uid);
      const userCommRef = doc(db, "users", user.uid, "communities", commId);
      await Promise.all([
        setDoc(memberRef, { uid: user.uid, joinedAt: new Date().toISOString() }),
        setDoc(userCommRef, { name: commId, joinedAt: new Date().toISOString() }),
      ]);
      const commSnap = await getDoc(doc(db, "communities", commId));
      const commData: Record<string, unknown> = commSnap.exists()
        ? (commSnap.data() as Record<string, unknown>)
        : {
            category: allComms.find((c) => c.name === commId)?.category || "",
            tags: [],
          };
      void saveSubscriptionInterests(user.uid, commData, mergeInterestsOrdered(userInterests, interestTagsFromCommunityData(commData)));
      refreshCommunities();
      window.dispatchEvent(new CustomEvent("nf-community-members-changed", { detail: commId }));
      return true;
    } catch (err) {
      console.error("Sidebar join:", err);
      return false;
    }
  };

  const handleEnterCommunity = async (commId: string, isJoined: boolean) => {
    if (!isJoined) {
      const ok = await joinCommunity(commId);
      if (!ok) return;
    }
    onCommunityClick(commId);
  };

  const renderCommunityRow = (c: SidebarComm, i: number) => (
    <motion.button
      key={c.id}
      type="button"
      onClick={() => void handleEnterCommunity(c.id, c.isJoined)}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      className="flex items-start gap-3 w-full px-3.5 py-3 hover:bg-white/[0.03] transition-colors duration-150 text-right"
    >
      <img src={c.img} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/[0.06]" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-nf-text truncate leading-tight">{c.label}</p>
        {c.category && (
          <p className="text-[10px] text-nf-accent/90 font-medium truncate mt-0.5">{c.category}</p>
        )}
        {c.shortDesc ? (
          <p className="text-[10px] text-nf-dim mt-1 line-clamp-2 leading-relaxed">{c.shortDesc}</p>
        ) : (
          <p className="text-[10px] text-nf-dim mt-1 line-clamp-1">مجتمع على NorthFall</p>
        )}
        <p className="text-[10px] text-nf-dim mt-1.5">{formatMemberCount(c.members)} {t("sr.members")}</p>
      </div>
      {!c.isJoined && (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 self-center bg-nf-accent text-white">
          {t("sr.join")}
        </span>
      )}
    </motion.button>
  );

  const handleTagClick = (label: string) => {
    window.dispatchEvent(new CustomEvent("nf-filter-tag", { detail: label }));
  };

  useEffect(() => {
    setExpandedRuleIndex(null);
    if (!communityName) {
      setDbMeta(null);
      return;
    }
    const isPreview = typeof window !== "undefined" && window.location.search.includes("preview=true");
    if (isPreview) {
      const saved = localStorage.getItem("nf-community-preview");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name === communityName) {
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
              usefulLinks: parsed.usefulLinks || [],
              founded: parsed.founded || new Date().getFullYear().toString(),
              communityType: parsed.communityType || "public",
              memberCount: parsed.memberCount || 1,
            });
            return;
          }
        } catch (e) {
          console.error("Error parsing community preview in SidebarRight:", e);
        }
      }
    }

    const cName = communityName;
    async function fetchMeta() {
      try {
        const docRef = doc(db, "communities", cName);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setDbMeta(snap.data());
        } else {
          setDbMeta(null);
        }
      } catch (e) {
        console.error("Error fetching community sidebar meta:", e);
        setDbMeta(null);
      }
    }
    fetchMeta();
  }, [communityName]);

  useEffect(() => {
    if (!communityName) {
      setLiveMemberCount(null);
      return;
    }
    let cancelled = false;
    const refreshCount = async () => {
      try {
        const snap = await getCountFromServer(collection(db, "communities", communityName, "members"));
        if (!cancelled) setLiveMemberCount(snap.data().count);
      } catch {
        if (!cancelled) setLiveMemberCount(null);
      }
    };
    refreshCount();
    const interval = setInterval(refreshCount, 20000);
    const onMembersChanged = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail || detail === communityName) refreshCount();
    };
    window.addEventListener("nf-community-members-changed", onMembersChanged);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("nf-community-members-changed", onMembersChanged);
    };
  }, [communityName]);

  const meta = dbMeta;
  const membersCount = liveMemberCount ?? meta?.memberCount ?? 0;

  const loadRecentPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40));
      const snap = await getDocs(q);
      const ranked = snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() }))
        .filter((p: any) => p.title)
        .sort((a: any, b: any) => {
          const scoreA = postHotScore(a) + (Date.now() - new Date(a.createdAt || 0).getTime() < 86_400_000 ? 2 : 0);
          const scoreB = postHotScore(b) + (Date.now() - new Date(b.createdAt || 0).getTime() < 86_400_000 ? 2 : 0);
          return scoreB - scoreA;
        })
        .slice(0, 8);
      setRecentPosts(ranked);
    } catch (e) {
      console.error("SidebarRight recent posts:", e);
    }
  };

  useEffect(() => {
    void loadRecentPosts();
    const onFocus = () => void loadRecentPosts();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const creatorId = meta?.creatorUid || meta?.creator;
    if (!creatorId) { setCreatorPhoto(""); setCreatorName(""); return; }
    async function fetchCreator() {
      try {
        const s = await getDoc(doc(db, "users", creatorId));
        if (s.exists()) { 
          setCreatorPhoto(s.data().photoURL || ""); 
          setCreatorName(s.data().displayName || t("sr.communityCreator")); 
        } else {
          setCreatorPhoto("");
          setCreatorName(meta.creatorName || t("sr.communityCreator"));
        }
      } catch {
        setCreatorPhoto("");
        setCreatorName(meta.creatorName || t("sr.communityCreator"));
      }
    }
    fetchCreator();
  }, [meta?.creator, meta?.creatorUid, t]);

  const isFlat = false;

  return (
    <aside
      className="w-[280px] shrink-0 sticky overflow-y-auto"
      style={{
        top: "calc(var(--nav-total-height) + 16px)",
        maxHeight: "calc(100vh - var(--nav-total-height) - 32px)",
        zIndex: 1,
        backgroundColor: "var(--bg-body)",
      }}
    >

      {/* Recent Posts */}
      <div className="nf-sidebar-card overflow-hidden mb-2">
        <div className="flex items-center gap-1.5 px-3.5 py-3 pb-2 border-b nf-sidebar-card-divider">
          <Flame size={12} className="text-nf-accent" />
          <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.newPosts")}</span>
        </div>
        {recentPosts.length === 0 ? (
          <div className="p-3 text-center text-xs text-nf-dim">{t("sr.noPosts")}</div>
        ) : (
          <div className="py-1">
            {recentPosts.map((post: any, i: number) => {
              const dest = formatPostDestinationPath(post);
              const preview = postBodyPreview(post.body || post.content);
              const flair = (post.flair || post.postFlair || "").trim();
              return (
                <motion.a
                  key={post.id}
                  href="#"
                  onClick={(e) => { e.preventDefault(); onPostClick(post.id); }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer border-b border-white/[0.03] last:border-0"
                >
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/[0.06]" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/[0.06]">
                      <Flame size={14} className="text-nf-dim" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-semibold text-nf-text nf-bidi-text leading-snug line-clamp-2"
                      dir={textDirAttr(post.title || "")}
                    >
                      {post.title || t("sr.noPosts")}
                    </p>
                    <p className="text-[10px] text-nf-dim mt-0.5 truncate">
                      {dest} · {post.authorName || t("gen.user")} · {timeAgoShort(post.createdAt)}
                    </p>
                    {flair && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/[0.06] text-nf-muted">
                        {flair}
                      </span>
                    )}
                    {preview && (
                      <p
                        className="text-[10px] text-nf-dim nf-bidi-text mt-1 line-clamp-2 leading-relaxed"
                        dir={textDirAttr(preview)}
                      >
                        {preview}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-nf-dim">
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowUp size={11} className="opacity-70" />
                        {post.votes || 0}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <MessageCircle size={11} className="opacity-70" />
                        {post.commentCount || 0}
                      </span>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </div>

      {/* Community info cards - only when viewing a community */}
      {meta ? (
        isFlat ? (
          /* Unified Reddit-style continuous layout (single card) */
          <div className="nf-sidebar-card overflow-hidden mb-2 divide-y divide-[var(--border-subtle)]">            {/* About Section */}
            <div className="px-3.5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.aboutCommunity")}</span>
                <span className="text-xs font-bold text-nf-accent">n/{communityName}</span>
              </div>
              <p className="nf-community-desc nf-latin-text whitespace-pre-line mb-3" dir="auto">{meta.desc}</p>
              
              {/* Founded Date & Privacy (Reddit Image Style) */}
              <div className="space-y-1.5 text-[11px] text-nf-dim font-medium mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="shrink-0" />
                  <span>أنشئ في {formatFoundedDate(meta.founded, meta.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={12} className="shrink-0" />
                  <span>
                    {meta.communityType === "private" || meta.modLevel === "restrict"
                      ? "خاص (Private)"
                      : meta.communityType === "restricted" || meta.modLevel === "moderate"
                      ? "شبه خاص (Restricted)"
                      : "عام (Public)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} className="shrink-0" />
                  <span>{membersCount.toLocaleString()} {membersCount === 1 ? "عضو" : "أعضاء"}</span>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            {meta.stats?.length > 0 && (
              <div className="px-3.5 py-2">
                <div className="mb-1.5">
                  <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.stats")}</span>
                </div>
                <div className="space-y-1.5">
                  {meta.stats.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span className="text-nf-dim">{s.label}</span>
                      <span className="text-nf-text font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules Section */}
            {meta.rules && meta.rules.length > 0 && (
              <div className="px-3.5 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.rules")}</span>
                </div>
                <div className="flex flex-col">
                  {meta.rules.map((rule: any, i: number) => {
                    const title = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[0] : rule) : (rule.title || "");
                    const detail = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[1] : "") : (rule.body || "");
                    const isExpanded = expandedRuleIndex === i;
                    return (
                      <div key={i} className="py-2.5 border-b nf-sidebar-card-divider last:border-0">
                        <button 
                          onClick={() => detail && setExpandedRuleIndex(isExpanded ? null : i)}
                          className={`w-full flex items-start justify-between text-right outline-none py-0.5 ${
                            detail ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <span className={`flex-1 text-[12px] font-bold leading-snug text-right text-nf-muted transition-colors ${detail ? "hover:text-nf-accent" : ""}`} dir="auto">{title}</span>
                          {detail && (
                            <ChevronDown size={13} className={`text-nf-dim shrink-0 transition-transform duration-200 mr-2 self-center ${isExpanded ? "rotate-180" : ""}`} />
                          )}
                        </button>
                        {detail && isExpanded && (
                          <div className="text-[11px] text-nf-dim mt-2 pt-2 border-t nf-sidebar-card-divider leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                            {renderRichText(detail)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Moderators Section */}
            <div className="px-3.5 py-2.5">
              <div className="mb-2">
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.mods")}</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {creatorPhoto ? (
                    <img src={creatorPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] text-nf-accent font-bold">C</div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-nf-text truncate">u/{creatorName || t("sr.creator")}</div>
                    <span className="text-[9px] text-[#878a8c] bg-white/[0.05] px-2 py-0.5 rounded font-bold">{t("sr.creator")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            {meta.tags && meta.tags.length > 0 && (
              <div className="px-3.5 py-2.5">
                <div className="mb-2">
                  <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.tags")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meta.tags.map((tag: any, i: number) => {
                    const TAG_COLORS = [
                      { bg: "#c8d8f0", text: "#1a3a6b" },
                      { bg: "#f8c8c8", text: "#7a1a1a" },
                      { bg: "#d8c8f0", text: "#3a1a7a" },
                      { bg: "#fce8b8", text: "#7a4a00" },
                      { bg: "#c8f0d8", text: "#1a6b3a" },
                      { bg: "#f0e8c8", text: "#6b5a1a" },
                    ];
                    const label = typeof tag === "string" ? tag : (tag.text || tag);
                    const colorIdx = typeof tag === "object" && tag.color !== undefined ? tag.color : (i % TAG_COLORS.length);
                    const c = TAG_COLORS[colorIdx % TAG_COLORS.length];
                    return (
                      <button key={i} onClick={() => handleTagClick(label)} style={{ background: c.bg, color: c.text, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }} className="hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bookmarks Section */}
            {meta.bookmarks && meta.bookmarks.length > 0 && (
              <div className="px-3.5 py-2.5">
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-nf-muted uppercase tracking-wide">روابط المجتمع</span>
                </div>
                <div className="flex flex-col gap-2">
                  {meta.bookmarks.map((bm: any, i: number) => (
                    <a key={i} href={bm.url} target="_blank" rel="noopener noreferrer"
                      className="w-full py-2 rounded-full bg-nf-secondary hover:bg-nf-hover border border-nf-border-2/40 text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors duration-150 text-center block active:scale-[0.98]">
                      {bm.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Useful Links Section */}
            {meta.usefulLinks && meta.usefulLinks.length > 0 && (
              <div className="px-3.5 py-2.5">
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-nf-muted uppercase tracking-wide">روابط مفيدة</span>
                </div>
                <div className="flex flex-col gap-2">
                  {meta.usefulLinks.map((ul: any, i: number) => (
                    <a key={i} href={ul.url} target="_blank" rel="noopener noreferrer"
                      className="w-full py-2 rounded-full bg-nf-secondary hover:bg-nf-hover border border-nf-border-2/40 text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors duration-150 text-center block active:scale-[0.98]">
                      {ul.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Banner */}
            {meta.banner && (
              <div className="p-2">
                <div className="h-28 rounded-[6px] overflow-hidden relative group">
                  <img src={meta.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent flex items-end p-2 justify-end">
                    <span className="text-white text-[10px] font-bold">n/{communityName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* About */}
            <div className="nf-sidebar-card overflow-hidden mb-2">
              <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider flex items-center gap-2">
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.aboutCommunity")}</span>
                <span className="text-xs font-bold text-nf-accent">{t("sr.communityLabel")} n/{communityName}</span>
              </div>
              <div className="px-3.5 py-3">
                <p className="nf-community-desc nf-latin-text whitespace-pre-line mb-3" dir="auto">{meta.desc}</p>
                
                {/* Founded Date & Privacy (Reddit Image Style) */}
                <div className="space-y-2 text-[11px] text-nf-dim font-medium mb-3">
                  <div className="flex items-center gap-2.5 min-h-[18px]">
                    <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 text-nf-muted"><Calendar size={12} strokeWidth={2} /></span>
                    <span className="leading-none pt-px">أنشئ في {formatFoundedDate(meta.founded, meta.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 min-h-[18px]">
                    <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 text-nf-muted"><Globe size={12} strokeWidth={2} /></span>
                    <span className="leading-none pt-px">
                      {meta.communityType === "private" || meta.modLevel === "restrict"
                        ? "خاص (Private)"
                        : meta.communityType === "restricted" || meta.modLevel === "moderate"
                        ? "شبه خاص (Restricted)"
                        : "عام (Public)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 min-h-[18px]">
                    <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 text-nf-muted"><Users size={12} strokeWidth={2} /></span>
                    <span className="leading-none pt-px">{membersCount.toLocaleString()} {membersCount === 1 ? "عضو" : "أعضاء"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {meta.stats?.length > 0 && (
              <div className="nf-sidebar-card overflow-hidden mb-2">
                <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider">
                  <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.stats")}</span>
                </div>
                <div className="px-3.5 py-2 space-y-1.5">
                  {meta.stats.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span className="text-nf-dim">{s.label}</span>
                      <span className="text-nf-text font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {meta.rules.length > 0 && (
              <div className="nf-sidebar-card overflow-hidden mb-2">
                <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider flex items-center justify-between">
                  <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.rules")}</span>
                </div>
                <div className="px-3.5 py-2">
                  <div className="flex flex-col">
                    {meta.rules.map((rule: any, i: number) => {
                      const title = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[0] : rule) : (rule.title || "");
                      const detail = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[1] : "") : (rule.body || "");
                      const isExpanded = expandedRuleIndex === i;
                      return (
                        <div key={i} className="py-2.5 border-b nf-sidebar-card-divider last:border-0">
                          <button 
                            onClick={() => detail && setExpandedRuleIndex(isExpanded ? null : i)}
                            className={`w-full flex items-start justify-between text-right outline-none py-0.5 ${
                              detail ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            <span className={`flex-1 text-[12px] font-bold leading-snug text-right text-nf-muted transition-colors ${detail ? "hover:text-nf-accent" : ""}`} dir="auto">{title}</span>
                            {detail && (
                              <ChevronDown size={13} className={`text-nf-dim shrink-0 transition-transform duration-200 mr-2 self-center ${isExpanded ? "rotate-180" : ""}`} />
                            )}
                          </button>
                          {detail && isExpanded && (
                            <div className="text-[11px] text-nf-dim mt-2.5 pt-2.5 border-t nf-sidebar-card-divider leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                              {renderRichText(detail)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Moderators */}
            <div className="nf-sidebar-card overflow-hidden mb-2">
              <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider">
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.mods")}</span>
              </div>
              <div className="px-3.5 py-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {creatorPhoto ? (
                    <img src={creatorPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] text-nf-accent font-bold">C</div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-nf-text truncate">u/{creatorName || t("sr.creator")}</div>
                    <span className="text-[9px] text-[#878a8c] bg-white/[0.05] px-2 py-0.5 rounded font-bold">{t("sr.creator")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {meta.tags.length > 0 && (
              <div className="nf-sidebar-card overflow-hidden mb-2">
                <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider">
                  <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.tags")}</span>
                </div>
                <div className="px-3 py-2.5 flex flex-wrap gap-2">
                  {meta.tags.map((tag: any, i: number) => {
                    const TAG_COLORS = [
                      { bg: "#c8d8f0", text: "#1a3a6b" },
                      { bg: "#f8c8c8", text: "#7a1a1a" },
                      { bg: "#d8c8f0", text: "#3a1a7a" },
                      { bg: "#fce8b8", text: "#7a4a00" },
                      { bg: "#c8f0d8", text: "#1a6b3a" },
                      { bg: "#f0e8c8", text: "#6b5a1a" },
                    ];
                    const label = typeof tag === "string" ? tag : (tag.text || tag);
                    const colorIdx = typeof tag === "object" && tag.color !== undefined ? tag.color : (i % TAG_COLORS.length);
                    const c = TAG_COLORS[colorIdx % TAG_COLORS.length];
                    return (
                      <button key={i} onClick={() => handleTagClick(label)} style={{ background: c.bg, color: c.text, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }} className="hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Community Bookmarks - after tags */}
            {meta.bookmarks && meta.bookmarks.length > 0 && (
              <div className="nf-sidebar-card overflow-hidden mb-2">
                <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider">
                  <span className="text-[10px] font-bold text-nf-muted uppercase tracking-wide">روابط المجتمع</span>
                </div>
                <div className="px-3.5 py-3 flex flex-col gap-2">
                  {meta.bookmarks.map((bm: any, i: number) => (
                    <a key={i} href={bm.url} target="_blank" rel="noopener noreferrer"
                      className="w-full py-2 rounded-full bg-nf-secondary hover:bg-nf-hover border border-nf-border-2/40 text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors duration-150 text-center block active:scale-[0.98]">
                      {bm.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Useful Links - after community bookmarks */}
            {meta.usefulLinks && meta.usefulLinks.length > 0 && (
              <div className="nf-sidebar-card overflow-hidden mb-2">
                <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider">
                  <span className="text-[10px] font-bold text-nf-muted uppercase tracking-wide">روابط مفيدة</span>
                </div>
                <div className="px-3.5 py-3 flex flex-col gap-2">
                  {meta.usefulLinks.map((ul: any, i: number) => (
                    <a key={i} href={ul.url} target="_blank" rel="noopener noreferrer"
                      className="w-full py-2 rounded-full bg-nf-secondary hover:bg-nf-hover border border-nf-border-2/40 text-[11px] font-bold text-nf-muted hover:text-nf-text transition-colors duration-150 text-center block active:scale-[0.98]">
                      {ul.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Visual banner at the bottom of the community sidebar (Image 5/6 idea) */}
            {meta.banner && (
              <div className="nf-sidebar-card overflow-hidden mb-2">
                <div className="px-3.5 py-2.5 border-b nf-sidebar-card-divider">
                  <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">الواجهة</span>
                </div>
                <div className="p-2">
                  <div className="h-28 rounded-[8px] overflow-hidden relative group">
                    <img src={meta.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent flex items-end p-2 justify-end">
                      <span className="text-white text-[10px] font-bold">n/{communityName}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      ) : null}

      {suggestedComms.length > 0 && (
        <div className="nf-sidebar-card overflow-hidden mb-2">
          <div className="flex items-center gap-1.5 px-3.5 py-3 pb-2 border-b nf-sidebar-card-divider">
            <TrendingUp size={12} className="text-nf-accent" />
            <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.displayComms")}</span>
          </div>
          <div className="py-1 divide-y divide-white/[0.03]">
            {suggestedComms.map((c, i) => renderCommunityRow(c, i))}
          </div>
        </div>
      )}

      {trendingComms.length > 0 && (
        <div className="nf-sidebar-card overflow-hidden mb-2">
          <div className="flex items-center gap-1.5 px-3.5 py-3 pb-2 border-b nf-sidebar-card-divider">
            <Flame size={12} className="text-nf-accent" />
            <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.trending")}</span>
          </div>
          <div className="py-1 divide-y divide-white/[0.03]">
            {trendingComms.map((c, i) => renderCommunityRow(c, i))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center px-4 py-2">
        <div className="flex items-center justify-center gap-1 text-[11px] text-nf-muted flex-wrap">
          <a href="#" className="hover:text-nf-text">{t("sr.privacy")}</a>
          <span className="text-nf-dim">·</span>
          <a href="#" className="hover:text-nf-text">{t("sr.terms")}</a>
          <span className="text-nf-dim">·</span>
          <a href="#" className="hover:text-nf-text">{t("sr.help")}</a>
        </div>
        <p className="text-[11px] text-nf-dim mt-1">© 2026 NorthFall. {t("gen.allRightsReserved")}</p>
      </div>
    </aside>
  );
}
