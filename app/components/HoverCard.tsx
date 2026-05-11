"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Star, MessageSquare, Shield, Users, FileText, Clock, UserPlus, UserCheck, ExternalLink, Gamepad2 } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, addDoc, updateDoc, collection, getDocs, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";
import { getLevel } from "@/lib/ranking";
import { useToast } from "./ToastProvider";
import { GAMES } from "./GamesPage";

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
            });
          }
        } else {
          const meta: Record<string, any> = {
            Unity: {
              img: "/assets/images/unitylogo.png",
              banner: "/assets/images/bannerunity.png",
              desc: "مكانك لو حابب تتعلم Unity وتشارك مشاريعك مع مطورين عرب. تواصل، اسأل، واطلع شغلك للعالم.",
              tags: ["Unity", "GameDev", "C#", "3D", "2D", "AR/VR"],
              memberCount: 0,
              postCount: 0,
              onlineCount: 0,
            },
            Unreal: {
              img: "/assets/images/unreallogo.svg",
              banner: "/assets/images/bannerunity.png",
              desc: "محرك الألعاب الأقوى — من AAA لمستقلة. تعلم UE5، شارك مشاريعك، واساعد غيرك يبدأ.",
              tags: ["Unreal", "UE5", "Blueprints", "C++", "Nanite", "Lumen"],
              memberCount: 0,
              postCount: 0,
              onlineCount: 0,
            },
            Godot: {
              img: "/assets/images/godotlogo.png",
              banner: "/assets/images/godotbanner.png",
              desc: "المحرك المفتوح اللي بيسمح لك تعمل لعبتك بلا قيود. من 2D لـ 3D — تعال شارك تجربتك وساعد غيرك يبدأ.",
              tags: ["Godot", "OpenSource", "GDScript", "2D", "3D"],
              memberCount: 0,
              postCount: 0,
              onlineCount: 0,
            },
            Blender: {
              img: "/assets/images/logoblender.png",
              banner: "/assets/images/bannerblender.png",
              desc: "من النمذجة للأنيميشن للرندر — كل شي بيتعمل بـ Blender. اعرض أعمالك وتعلم تقنيات جديدة مع مجتمع يفهمك.",
              tags: ["Blender", "3D", "Modeling", "Animation", "Rendering"],
              memberCount: 0,
              postCount: 0,
              onlineCount: 0,
            },
          };
          const m = meta[name] || { img: "", banner: "", desc: `مجتمع n/${name}`, tags: [], memberCount: 0, postCount: 0, onlineCount: 0 };
          setData(m);
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
              className="w-[280px] bg-nf-primary border border-nf-border rounded-lg shadow-xl overflow-hidden pointer-events-auto"
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
        const notifQ = query(collection(db, "users", uid, "notifications"), where("type", "==", "follow"), where("read", "==", false));
        const notifSnap = await getDocs(notifQ);
        if (!notifSnap.empty) {
          const existing = notifSnap.docs[0];
          const prev = existing.data();
          const count = (prev.count || 1) + 1;
          await updateDoc(existing.ref, { count, text: `${count} شخص تابعوك`, createdAt: new Date().toISOString() });
        } else {
          await addDoc(collection(db, "users", uid, "notifications"), {
            type: "follow", text: `${user.displayName || "مستخدم"} تابعك`,
            read: false, createdAt: new Date().toISOString(), count: 1,
          });
        }
      } catch {}
    }
  };

  if (!data) return <div className="p-3 text-xs text-nf-muted">{t("gen.loading")}</div>;
  return (
    <div>
      <div className="relative h-[65px]">
        <img src={data.bannerUrl || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-nf-primary to-transparent" />
      </div>
      <div className="px-3 pb-2.5 -mt-4 relative">
        <div className="flex items-end gap-2 mb-2">
          <div className="relative">
            {data.photo ? (
              <img src={data.photo} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-nf-primary" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-nf-secondary border-2 border-nf-primary flex items-center justify-center text-sm text-nf-muted font-bold">{name[0]}</div>
            )}
            {(() => {
              const isOnline = data.lastSeen && (Date.now() - new Date(data.lastSeen).getTime()) < 5 * 60 * 1000;
              return (
                <span className={cn("absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-nf-primary",
                  isOnline ? "bg-green-400" : "bg-gray-500")} />
              );
            })()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-white">u/{data.name}</span>
              {(uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && (
                <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[15px] h-[15px] shrink-0" />
              )}
              {(() => {
                const isOnline = data.lastSeen && (Date.now() - new Date(data.lastSeen).getTime()) < 5 * 60 * 1000;
                return <span className={cn("text-[10px] font-semibold", isOnline ? "text-green-400" : "text-nf-dim")}>{isOnline ? "متصل" : "غير متصل"}</span>;
              })()}
            </div>
              <div className="text-[10px] text-nf-dim flex items-center gap-0.5"><Cake size={8} /> {(() => { if (uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") return "انضم أبريل 2024"; if (data.joinedAt) { const d = new Date(data.joinedAt); const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]; return `انضم ${months[d.getMonth()]} ${d.getFullYear()}`; } return t("hc.joinedApril"); })()}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {(() => { const r = getLevel(data.xp || 0); return <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${r.bg} ${r.color} border ${r.border}`}>{r.name}</span>; })()}
          <span className="px-1.5 py-0.5 rounded bg-nf-secondary/60 text-[9px] text-nf-dim"><span className="text-white font-bold">{Math.max(0, Math.round(data.karma || 0))}</span> صيت</span>
          <span className="px-1.5 py-0.5 rounded bg-nf-secondary/60 text-[9px] text-nf-dim"><span className="text-amber-400 font-bold">{data.xp || 0}</span> XP</span>
          <span className="px-1.5 py-0.5 rounded bg-nf-secondary/60 text-[9px] text-nf-dim"><span className="text-white font-bold">{data.postCount || 0}</span> منشور</span>
          <span className="px-1.5 py-0.5 rounded bg-nf-secondary/60 text-[9px] text-nf-dim"><span className="text-white font-bold">{data.commentCount || 0}</span> تعليق</span>
          <span className="px-1.5 py-0.5 rounded bg-nf-secondary/60 text-[9px] text-nf-dim flex items-center gap-0.5"><Users size={7} /><span className="text-white font-bold">{data.followerCount || 0}</span> يتابعونه</span>
          <span className="px-1.5 py-0.5 rounded bg-nf-secondary/60 text-[9px] text-nf-dim flex items-center gap-0.5"><UserPlus size={7} /><span className="text-white font-bold">{data.followingCount || 0}</span> يتابعهم</span>
        </div>
        {data.bio && <p className="text-[10px] text-nf-dim leading-relaxed mb-2 line-clamp-2">{data.bio}</p>}
        {/* Social Links */}
        {data.socialLinks && Object.values(data.socialLinks).some((v: any) => v?.trim()) && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {Object.entries(data.socialLinks).filter(([, v]: any) => v?.trim()).map(([key, val]: any) => {
              const labels: Record<string, string> = { twitter: "X", youtube: "YouTube", github: "GitHub", steam: "Steam", discord: "Discord", website: "موقع" };
              const label = labels[key] || key;
              const url = val.startsWith("http") ? val : `https://${val}`;
              return <button key={key} onClick={(e) => { e.stopPropagation(); window.open(url, "_blank", "noopener,noreferrer"); }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-nf-secondary text-nf-muted hover:text-white hover:bg-nf-hover transition-colors cursor-pointer"><ExternalLink size={8} />{label}</button>;
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
          <button onClick={() => onProfileClick?.(uid || "")} className="flex-1 py-1.5 rounded text-[11px] font-bold bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
            {t("hc.viewProfile")}
          </button>
          {user && !isOwn && (
            <button
              onClick={toggleFollow}
              className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold border transition-all ${
                isFollowing
                  ? "bg-nf-secondary text-nf-muted border-nf-border hover:bg-nf-hover hover:text-white"
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
  const [memberCount, setMemberCount] = useState(data.memberCount || 0);

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
      <div className="relative h-[70px]">
        {data.banner ? (
          <img src={data.banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-l from-nf-secondary to-nf-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-nf-primary to-transparent" />
      </div>
      <div className="px-3 pb-2.5 -mt-5 relative">
        <div className="flex items-end gap-2 mb-2">
          {data.img ? (
            <img src={data.img} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-nf-primary" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-nf-secondary border-2 border-nf-primary flex items-center justify-center text-sm text-nf-muted font-bold">n/</div>
          )}
          <div className="flex-1">
            <div className="text-[13px] font-bold text-white">n/{name}</div>
            <div className="text-[10px] text-nf-dim">{t("cp.founded")}</div>
          </div>
        </div>
        <p className="text-[11px] text-nf-text-2 leading-relaxed mb-2">{data.desc}</p>

        {/* Stats */}
        <div className="text-[10px] text-nf-dim mb-2 flex items-center gap-3">
          <span className="flex items-center gap-1"><Users size={9} /> <span className="text-white font-bold">{memberCount > 0 ? memberCount.toLocaleString() : "—"}</span> {t("cp.members")}</span>
          <span className="flex items-center gap-1"><FileText size={9} /> <span className="text-white font-bold">{data.postCount || "—"}</span> {t("cp.posts")}</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> <span className="text-green-400 font-bold">{data.onlineCount || "—"}</span> متصل</span>
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {data.tags.slice(0, 4).map((tag: string) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-nf-accent/10 text-[9px] font-medium text-nf-accent">{tag}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onCommunityClick?.(name)} className="flex-1 py-1.5 rounded text-[11px] font-bold bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
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
