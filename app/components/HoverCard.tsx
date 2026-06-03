"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Star, MessageSquare, Shield, Users, FileText, Clock, UserPlus, UserCheck, ExternalLink, Gamepad2 } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, addDoc, updateDoc, collection, getDocs, query, where, getCountFromServer, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";
import { mergeActor } from "@/lib/notification-format";
import { getLevel } from "@/lib/ranking";
import { useToast } from "./ToastProvider";
import { GAMES } from "./GamesPage";
import { firestoreCommunityIdFromDisplay } from "@/lib/post-target";

interface HoverCardProps {
  children: React.ReactNode;
  type: "user" | "community";
  name: string;
  uid?: string;
  onCommunityClick?: (name: string) => void;
  onProfileClick?: (uid: string) => void;
}

export default function HoverCard({ children, type, name, uid, onCommunityClick, onProfileClick }: HoverCardProps) {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const close = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };

  useEffect(() => {
    if (!show || data) return;
    async function fetch() {
      try {
        if (type === "user") {
          const { collection, getDocs, query, where, orderBy, limit, getDoc, doc } = await import("firebase/firestore");
          // Try direct lookup by uid first (most reliable)
          if (uid) {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
              const d = userSnap.data();
              // Fallback: count posts from collection only if postCount is missing
              let postCount = d.postCount || 0;
              if (!postCount) {
                try {
                  const pSnap = await getDocs(query(collection(db, "posts"), where("authorUid", "==", uid), limit(100)));
                  postCount = pSnap.size;
                } catch {}
              }
              // Get follower/following counts and favorite games
              let followerCount = 0, followingCount = 0, favoriteGameIds: string[] = [];
              try { const fSnap = await getDocs(collection(db, "users", uid, "followers")); followerCount = fSnap.size; } catch {}
              try { const f2Snap = await getDocs(collection(db, "users", uid, "following")); followingCount = f2Snap.size; } catch {}
              try { const gSnap = await getDoc(doc(db, "users", uid, "games", "favorites")); if (gSnap.exists()) favoriteGameIds = gSnap.data().ids || []; } catch {}
              setData({
                photo: d.photoURL || "",
                name: d.displayName || name,
                uid: userSnap.id,
                karma: d.karma || 0,
                xp: d.xp || 0,
                postCount,
                commentCount: d.commentCount || 0,
                bio: d.bio || "",
                bannerUrl: d.bannerUrl || "",
                lastSeen: d.lastSeen || null,
                joinedAt: d.createdAt || null,
                followerCount,
                followingCount,
                socialLinks: d.socialLinks || {},
                favoriteGameIds,
                role: d.role || "عضو",
              });
              return;
            }
          }
          // Fallback: scan by displayName
          const q = query(collection(db, "users"), orderBy("displayName"), limit(15));
          const snap = await getDocs(q);
          const userDoc = snap.docs.find(d => d.data().displayName === name);
          if (userDoc) {
            const d = userDoc.data();
            const foundUid = userDoc.id;
            let postCount = d.postCount || 0;
            if (!postCount) {
              try {
                const pSnap = await getDocs(query(collection(db, "posts"), where("authorUid", "==", foundUid), limit(100)));
                postCount = pSnap.size;
              } catch {}
            }
            let followerCount = 0, followingCount = 0, favoriteGameIds: string[] = [];
            try { const fSnap = await getDocs(collection(db, "users", foundUid, "followers")); followerCount = fSnap.size; } catch {}
            try { const f2Snap = await getDocs(collection(db, "users", foundUid, "following")); followingCount = f2Snap.size; } catch {}
            try { const gSnap = await getDoc(doc(db, "users", foundUid, "games", "favorites")); if (gSnap.exists()) favoriteGameIds = gSnap.data().ids || []; } catch {}
            setData({
              photo: d.photoURL || "",
              name: d.displayName || name,
              uid: foundUid,
              karma: d.karma || 0,
              xp: d.xp || 0,
              postCount,
              commentCount: d.commentCount || 0,
              bio: d.bio || "",
              bannerUrl: d.bannerUrl || "",
              lastSeen: d.lastSeen || null,
              joinedAt: d.createdAt || null,
              followerCount,
              followingCount,
              socialLinks: d.socialLinks || {},
              favoriteGameIds,
              role: d.role || "عضو",
            });
          }
        } else {
          const commId = firestoreCommunityIdFromDisplay(name.startsWith("n/") ? name : `n/${name}`);
          if (!commId) return;
          try {
            const commSnap = await getDoc(doc(db, "communities", commId));
            if (commSnap.exists()) {
              const d = commSnap.data();
              setData({
                img: d.img || "",
                banner: d.banner || "",
                desc: d.desc || `مجتمع n/${name}`,
                tags: d.tags || [],
                memberCount: d.memberCount || 0,
                postCount: d.postCount || 0,
                onlineCount: d.onlineCount || 0,
                creatorName: d.creatorName || "",
                creatorUid: d.creatorUid || "",
              });
            } else {
              setData({ img: "", banner: "", desc: `مجتمع n/${name}`, tags: [], memberCount: 0, postCount: 0, onlineCount: 0 });
            }
          } catch {
            setData({ img: "", banner: "", desc: `مجتمع n/${name}`, tags: [], memberCount: 0, postCount: 0, onlineCount: 0 });
          }
        }
      } catch {}
    }
    fetch();
  }, [show, type, name, data]);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }, []);

  // Close on scroll/resize to avoid floating card
  useEffect(() => {
    if (!show) return;
    const handler = () => close();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [show]);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => {
      updatePos();
      setShow(true);
    }, 300);
  };
  const handleLeave = () => {
    close();
  };

  return (
    <span ref={triggerRef} className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {show && pos && createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 99999 }}
              className="w-[310px] bg-nf-body border border-nf-border-2 rounded-xl shadow-xl overflow-hidden pointer-events-auto"
              onMouseEnter={() => setShow(true)}
              onMouseLeave={handleLeave}
            >
              {type === "user" ? (
                <UserCard data={data} name={name} uid={uid} onProfileClick={() => { close(); onProfileClick?.(data?.uid || uid || ""); }} />
              ) : (
                <CommunityCard data={data} name={name} onCommunityClick={() => { close(); onCommunityClick?.(name); }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
}

function UserCard({ data, name, uid, onProfileClick }: { data: any; name: string; uid?: string; onProfileClick?: (uid: string) => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwn = user?.uid === uid;

  useEffect(() => {
    if (!user || !uid || isOwn) return;
    getDoc(doc(db, "users", user.uid, "following", uid)).then(s => setIsFollowing(s.exists())).catch(() => {});
  }, [user, uid, isOwn]);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !uid || isOwn) return;
    const followRef = doc(db, "users", user.uid, "following", uid);
    const followerRef = doc(db, "users", uid, "followers", user.uid);
    if (isFollowing) {
      await deleteDoc(followRef);
      await deleteDoc(followerRef);
      setIsFollowing(false);
      toast("تم إلغاء المتابعة", "info");
    } else {
      await setDoc(followRef, { uid, followedAt: new Date().toISOString() });
      await setDoc(followerRef, { uid: user.uid, followedAt: new Date().toISOString() });
      setIsFollowing(true);
      toast("تمت المتابعة", "success");
      // Batched follow notification
      try {
        const actor = {
          uid: user.uid,
          name: user.displayName || "مستخدم",
          photo: user.photoURL || "",
        };
        const notifQ = query(collection(db, "users", uid, "notifications"), where("type", "==", "follow"), where("read", "==", false));
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
          await addDoc(collection(db, "users", uid, "notifications"), {
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

  if (!data) return <div className="p-3 text-xs text-nf-muted">{t("gen.loading")}</div>;
  return (
    <div>
      <div className={`relative overflow-hidden ${data.bannerUrl ? 'h-[65px]' : 'h-0'}`}>
        {data.bannerUrl ? <img src={data.bannerUrl} alt="" className="w-full h-full object-cover" /> : null}
        {data.bannerUrl && <div className="absolute inset-0 bg-gradient-to-t from-nf-body to-transparent" />}
      </div>
      <div className={`px-3 pb-2.5 ${data.bannerUrl ? '-mt-4' : 'mt-2'} relative`}>
        <div className="flex items-end gap-2 mb-2.5">
          <div className="relative">
            {data.photo ? (
              <img src={data.photo} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-nf-body" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-nf-secondary border-2 border-nf-body flex items-center justify-center text-sm text-nf-muted font-bold">{name[0]}</div>
            )}
            {(() => {
              const isOnline = data.lastSeen && (Date.now() - new Date(data.lastSeen).getTime()) < 5 * 60 * 1000;
              return (
                <span className={cn("absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-nf-body",
                  isOnline ? "bg-green-400" : "bg-gray-500")} />
              );
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-nf-text truncate">u/{data.name}</span>
              {(uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && (
                <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[13px] h-[13px] shrink-0" />
              )}
              {(() => {
                const isOnline = data.lastSeen && (Date.now() - new Date(data.lastSeen).getTime()) < 5 * 60 * 1000;
                return <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", isOnline ? "text-green-400 bg-green-400/10" : "text-nf-dim bg-nf-secondary/40")}>{isOnline ? "نشط" : "غير متصل"}</span>;
              })()}
              {data.role && data.role !== "عضو" && (
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border",
                  data.role === "مشرف" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  data.role === "إداري" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                  "bg-nf-accent/10 text-nf-accent border-nf-accent/20"
                )}>
                  {data.role}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 mt-1 text-[9px] text-nf-dim">
              <div className="flex items-center gap-1">
                <Cake size={9} className="text-nf-accent shrink-0" /> 
                <span>
                  {uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2" ? "انضم أبريل 2024" : (() => { 
                    if (data.joinedAt) { 
                      const d = new Date(data.joinedAt); 
                      const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]; 
                      return `انضم ${months[d.getMonth()]} ${d.getFullYear()}`; 
                    } 
                    return t("hc.joinedApril"); 
                  })()}
                </span>
              </div>
              {data.lastSeen && (
                <div className="flex items-center gap-1">
                  <Clock size={9} className="text-emerald-500 shrink-0" />
                  <span>
                    آخر نشاط: {(() => {
                      const d = new Date(data.lastSeen);
                      return `${d.toLocaleDateString("ar-EG")} ${d.toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Level Banner */}
        <div className="flex items-center justify-between mb-3 bg-nf-secondary/20 p-2 rounded-lg border border-nf-border-2/40">
          <span className="text-[10px] font-bold text-nf-muted">مستوى العضوية / Level</span>
          {(() => { const r = getLevel(data.xp || 0); return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${r.bg} ${r.color} border ${r.border}`}>{r.name}</span>; })()}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-1.5 text-center mb-3">
          <div className="bg-nf-secondary/20 border border-nf-border-2/40 p-1.5 rounded-lg flex flex-col justify-center">
            <span className="text-[12px] font-black text-nf-text">{Math.max(0, Math.round(data.karma || 0))}</span>
            <span className="text-[8px] text-nf-dim font-bold block mt-0.5">الصيت</span>
          </div>
          <div className="bg-nf-secondary/20 border border-nf-border-2/40 p-1.5 rounded-lg flex flex-col justify-center">
            <span className="text-[12px] font-black text-amber-400">{data.xp || 0}</span>
            <span className="text-[8px] text-nf-dim font-bold block mt-0.5">XP</span>
          </div>
          <div className="bg-nf-secondary/20 border border-nf-border-2/40 p-1.5 rounded-lg flex flex-col justify-center">
            <span className="text-[12px] font-black text-nf-text">{data.postCount || 0}</span>
            <span className="text-[8px] text-nf-dim font-bold block mt-0.5">المنشورات</span>
          </div>
          <div className="bg-nf-secondary/20 border border-nf-border-2/40 p-1.5 rounded-lg flex flex-col justify-center">
            <span className="text-[12px] font-black text-nf-text">{data.commentCount || 0}</span>
            <span className="text-[8px] text-nf-dim font-bold block mt-0.5">التعليقات</span>
          </div>
          <div className="bg-nf-secondary/20 border border-nf-border-2/40 p-1.5 rounded-lg flex flex-col justify-center">
            <span className="text-[12px] font-black text-nf-text">{data.followerCount || 0}</span>
            <span className="text-[8px] text-nf-dim font-bold block mt-0.5">المتابِعون</span>
          </div>
          <div className="bg-nf-secondary/20 border border-nf-border-2/40 p-1.5 rounded-lg flex flex-col justify-center">
            <span className="text-[12px] font-black text-nf-text">{data.followingCount || 0}</span>
            <span className="text-[8px] text-nf-dim font-bold block mt-0.5">يتابعهم</span>
          </div>
        </div>
        {data.bio && (
          <p className="text-[11px] text-nf-text-2 leading-relaxed mb-3 mt-1.5 px-0.5 whitespace-pre-wrap select-text">
            {data.bio}
          </p>
        )}
        {/* Social Links */}
        {data.socialLinks && Object.values(data.socialLinks).some((v: any) => v?.trim()) && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {Object.entries(data.socialLinks).filter(([, v]: any) => v?.trim()).map(([key, val]: any) => {
              const labels: Record<string, string> = { twitter: "X", youtube: "YouTube", github: "GitHub", steam: "Steam", discord: "Discord", website: "موقع" };
              const label = labels[key] || key;
              const url = val.startsWith("http") ? val : `https://${val}`;
              return <button key={key} onClick={(e) => { e.stopPropagation(); window.open(url, "_blank", "noopener,noreferrer"); }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-nf-secondary text-nf-muted hover:text-nf-text hover:bg-nf-hover transition-colors cursor-pointer"><ExternalLink size={8} />{label}</button>;
            })}
          </div>
        )}
        {/* Favorite Games */}
        {data.favoriteGameIds && data.favoriteGameIds.length > 0 && (() => {
          const topGames = GAMES.filter(g => data.favoriteGameIds.includes(g.id)).slice(0, 3);
          if (topGames.length === 0) return null;
          return (
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {topGames.map(g => (
                <div key={g.id} className="relative group rounded-lg overflow-hidden aspect-[3/4]">
                  <img src={g.cover} alt={g.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-1 right-1 left-1 text-[7px] text-white font-bold truncate drop-shadow">{g.name}</span>
                </div>
              ))}
            </div>
          );
        })()}
        <div className="flex gap-2">
          <button onClick={() => onProfileClick?.(data?.uid || uid || "")} className="flex-1 py-1.5 rounded text-[11px] font-bold bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
            {t("hc.viewProfile")}
          </button>
          {user && !isOwn && (
            <button
              onClick={toggleFollow}
              className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold border transition-all ${
                isFollowing
                  ? "bg-nf-secondary text-nf-muted border-nf-border hover:bg-nf-hover hover:text-nf-text"
                  : "bg-nf-accent text-white border-nf-accent hover:bg-nf-accent/80"
              }`}
            >
              {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommunityCard({ data, name, onCommunityClick }: { data: any; name: string; onCommunityClick?: (name: string) => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(data?.memberCount || 0);

  useEffect(() => {
    if (data?.memberCount !== undefined) {
      setMemberCount(data.memberCount);
    }
  }, [data]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "communities", name, "members", user.uid)).then(s => setJoined(s.exists())).catch(() => {});
  }, [user, name]);

  useEffect(() => {
    getCountFromServer(collection(db, "communities", name, "members")).then(s => setMemberCount(s.data().count)).catch(() => {});
  }, [name]);

  if (!data) return <div className="p-3 text-xs text-nf-muted">{t("hc.loading")}</div>;
  return (
    <div>
      <div className={`relative overflow-hidden ${data.banner ? 'h-[70px]' : 'h-0'}`}>
        {data.banner ? (
          <img src={data.banner} alt="" className="w-full h-full object-cover" />
        ) : null}
        {data.banner && <div className="absolute inset-0 bg-gradient-to-t from-nf-primary to-transparent" />}
      </div>
      <div className={`px-3 pb-2.5 ${data.banner ? '-mt-5' : 'mt-0'} relative`}>
        <div className="flex items-end gap-2 mb-2">
          {data.img ? (
            <img src={data.img} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-nf-primary" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-nf-secondary border-2 border-nf-primary flex items-center justify-center text-sm text-nf-muted font-bold">n/</div>
          )}
          <div className="flex-1">
            <div className="text-[13px] font-bold text-nf-text">n/{name}</div>
            <div className="text-[10px] text-nf-dim">{t("cp.founded")}</div>
          </div>
        </div>
        <p className="text-[11px] text-nf-text-2 leading-relaxed mb-2">{data.desc}</p>

        {/* Stats */}
        <div className="text-[10px] text-nf-dim mb-2 flex items-center gap-3">
          <span className="flex items-center gap-1"><Users size={9} /> <span className="text-nf-text font-bold">{memberCount > 0 ? memberCount.toLocaleString() : "0"}</span> {t("cp.members")}</span>
          <span className="flex items-center gap-1"><FileText size={9} /> <span className="text-nf-text font-bold">{data.postCount || "0"}</span> {t("cp.posts")}</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> <span className="text-green-400 font-bold">{data.onlineCount || "0"}</span> متصل</span>
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {data.tags.slice(0, 4).map((tag: any, i: number) => {
              const label = typeof tag === "string" ? tag : (tag.text || "");
              const TAG_COLORS = [
                { bg: "#c8d8f0", text: "#1a3a6b" }, { bg: "#f8c8c8", text: "#7a1a1a" },
                { bg: "#d8c8f0", text: "#3a1a7a" }, { bg: "#fce8b8", text: "#7a4a00" },
                { bg: "#c8f0d8", text: "#1a6b3a" }, { bg: "#f0e8c8", text: "#6b5a1a" },
              ];
              const colorIdx = typeof tag === "object" && tag.color !== undefined ? tag.color : (i % TAG_COLORS.length);
              const col = TAG_COLORS[colorIdx % TAG_COLORS.length];
              return (
                <span key={i} style={{ background: col.bg, color: col.text, padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600 }}>{label}</span>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onCommunityClick?.(name)} className="flex-1 py-1.5 rounded text-[11px] font-bold bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors">
            {t("hc.viewCommunity")}
          </button>
          {user && !joined && (
            <button
              onClick={async () => {
                try {
                  await setDoc(doc(db, "communities", name, "members", user.uid), { uid: user.uid, joinedAt: new Date().toISOString() });
                  await setDoc(doc(db, "users", user.uid, "communities", name), { name, joinedAt: new Date().toISOString() });
                  setJoined(true);
                } catch {}
              }}
              className="px-3 py-1.5 rounded text-[11px] font-bold bg-nf-accent text-white hover:bg-nf-accent/80 transition-colors"
            >
              {t("cp.join")}
            </button>
          )}
          {joined && (
            <span className="flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-bold bg-nf-accent/15 text-nf-accent">
              <UserCheck size={11} /> {t("cp.member")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

async function fetchUserHoverData(name: string, uid?: string) {
  try {
    if (uid) {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        let postCount = d.postCount || 0;
        if (!postCount) {
          try {
            const pSnap = await getDocs(query(collection(db, "posts"), where("authorUid", "==", uid), limit(100)));
            postCount = pSnap.size;
          } catch {
            /* ignore */
          }
        }
        let followerCount = 0;
        let followingCount = 0;
        let favoriteGameIds: string[] = [];
        try {
          const fSnap = await getDocs(collection(db, "users", uid, "followers"));
          followerCount = fSnap.size;
        } catch {
          /* ignore */
        }
        try {
          const f2Snap = await getDocs(collection(db, "users", uid, "following"));
          followingCount = f2Snap.size;
        } catch {
          /* ignore */
        }
        try {
          const gSnap = await getDoc(doc(db, "users", uid, "games", "favorites"));
          if (gSnap.exists()) favoriteGameIds = gSnap.data().ids || [];
        } catch {
          /* ignore */
        }
        return {
          photo: d.photoURL || "",
          name: d.displayName || name,
          uid: userSnap.id,
          karma: d.karma || 0,
          xp: d.xp || 0,
          postCount,
          commentCount: d.commentCount || 0,
          bio: d.bio || "",
          bannerUrl: d.bannerUrl || "",
          lastSeen: d.lastSeen || null,
          joinedAt: d.createdAt || null,
          followerCount,
          followingCount,
          socialLinks: d.socialLinks || {},
          favoriteGameIds,
          role: d.role || "عضو",
        };
      }
    }

    const q = query(collection(db, "users"), orderBy("displayName"), limit(20));
    const snap = await getDocs(q);
    const handle = name.toLowerCase();
    const userDoc =
      snap.docs.find((d) => d.data().displayName === name) ||
      snap.docs.find((d) => {
        const dn = String(d.data().displayName || "").replace(/\s+/g, "").toLowerCase();
        return dn === handle || dn.startsWith(handle);
      });
    if (!userDoc) return null;
    const d = userDoc.data();
    const foundUid = userDoc.id;
    return {
      photo: d.photoURL || "",
      name: d.displayName || name,
      uid: foundUid,
      karma: d.karma || 0,
      xp: d.xp || 0,
      postCount: d.postCount || 0,
      commentCount: d.commentCount || 0,
      bio: d.bio || "",
      bannerUrl: d.bannerUrl || "",
      lastSeen: d.lastSeen || null,
      joinedAt: d.createdAt || null,
      followerCount: 0,
      followingCount: 0,
      socialLinks: d.socialLinks || {},
      favoriteGameIds: [] as string[],
      role: d.role || "عضو",
    };
  } catch {
    return null;
  }
}

/** بطاقة بروفايل عند hover على @mention */
export function UserProfilePopover({
  name,
  uid,
  anchorRect,
  show,
  onClose,
  onProfileClick,
}: {
  name: string;
  uid?: string;
  anchorRect: DOMRect;
  show: boolean;
  onClose?: () => void;
  onProfileClick?: (uid: string) => void;
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!show) {
      setData(null);
      return;
    }
    let cancelled = false;
    void fetchUserHoverData(name, uid).then((res) => {
      if (!cancelled) setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [show, name, uid]);

  if (!show || typeof document === "undefined") return null;

  const top = Math.min(anchorRect.bottom + 6, window.innerHeight - 320);
  const right = Math.max(8, window.innerWidth - anchorRect.right);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      style={{ position: "fixed", top, right, zIndex: 99999 }}
      className="nf-mention-popover w-[310px] bg-nf-body border border-nf-border-2 rounded-xl shadow-xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      <UserCard
        data={data}
        name={name}
        uid={uid || data?.uid}
        onProfileClick={(id) => {
          onClose?.();
          onProfileClick?.(id);
        }}
      />
    </motion.div>,
    document.body
  );
}
