"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Star, MessageSquare, Shield, Users, FileText, Clock, UserPlus, UserCheck } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, addDoc, updateDoc, collection, getDocs, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";
import { useToast } from "./ToastProvider";

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
          // Try direct user lookup by displayName via limited scan
          const q = query(collection(db, "users"), orderBy("displayName"), limit(15));
          const snap = await getDocs(q);
          const userDoc = snap.docs.find(d => d.data().displayName === name);
          if (userDoc) {
            const d = userDoc.data();
            setData({
              photo: d.photoURL || "",
              name: d.displayName || name,
              uid: userDoc.id,
              karma: d.karma || 0,
              postCount: d.postCount || 0,
              bannerUrl: d.bannerUrl || "",
              lastSeen: d.lastSeen || null,
              socialLinks: d.socialLinks || {},
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
              {(() => {
                const isOnline = data.lastSeen && (Date.now() - new Date(data.lastSeen).getTime()) < 5 * 60 * 1000;
                return <span className={cn("text-[10px] font-semibold", isOnline ? "text-green-400" : "text-nf-dim")}>{isOnline ? "متصل" : "غير متصل"}</span>;
              })()}
            </div>
            <div className="text-[10px] text-nf-dim flex items-center gap-0.5"><Cake size={8} /> {t("hc.joinedApril")}</div>
          </div>
        </div>
        <div className="text-[10px] text-nf-dim mb-1.5">
          <span className="text-white">{data.karma || 1}</span> {t("pp.karma")} · <span className="text-white">{data.postCount || 0}</span> {t("cp.posts")} · <span className="text-white">0</span> {t("cp.comments")} · <span className="text-white">0</span> {t("pc.saved")}
        </div>
        <p className="text-[10px] text-nf-dim leading-relaxed mb-1.5">{t("hc.defaultBio")}</p>
        <div className="text-[10px] text-nf-dim mb-2">{t("hc.memberOf")}</div>
        {/* Linked Accounts */}
        {data.socialLinks && Object.values(data.socialLinks as Record<string, string>).some((v: string) => v.trim()) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.entries(data.socialLinks as Record<string, string>).filter(([, v]: [string, string]) => v.trim()).map(([key, val]: [string, string]) => {
              const icons: Record<string, { label: string; path: string }> = {
                twitter: { label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                youtube: { label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" },
                github: { label: "GitHub", path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
                steam: { label: "Steam", path: "M11.502 18.003l-2.09-1.442a1.29 1.29 0 0 1-.398-1.666 1.28 1.28 0 0 1 1.532-.623l1.898.633.418-1.858a1.284 1.284 0 0 1 1.796-.856 1.29 1.29 0 0 1 .577 1.748l-1.012 2.024a1.29 1.29 0 0 1-1.878.478zM22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12z" },
                discord: { label: "Discord", path: "M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.393-.406-.874-.618-1.25a.077.077 0 0 0-.079-.036 19.74 19.74 0 0 0-4.885 1.515.07.07 0 0 0-.032.028C.533 9.046-.32 13.56.1 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.423 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.926.077.077 0 0 1-.008-.126c.126-.094.252-.192.372-.301a.074.074 0 0 1 .078-.012c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.1.246.204.373.302a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.926.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028c1.96-.607 3.949-1.522 6.002-3.029a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029z" },
                twitch: { label: "Twitch", path: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" },
                itch: { label: "Itch.io", path: "M3.13 8.43a1.35 1.35 0 0 1 1.27-1.02c.86-.1 1.68.3 2.54.46a8.3 8.3 0 0 0 3.06.06c.86-.16 1.68-.56 2.54-.46a1.35 1.35 0 0 1 1.27 1.02c.12.59.04 1.2-.02 1.8-.1.96-.2 1.92-.3 2.88-.06.5-.1 1-.2 1.5-.1.5-.3.96-.7 1.24-.4.1-.7-.1-1-.3-.6-.4-1.1-.9-1.7-1.2-.4-.2-.9-.3-1.3-.1-.4.1-.6.5-.7.9-.1.4 0 .8.1 1.2.1.4.3.7.6 1 .5.4 1.1.7 1.7.8.6.1 1.2.1 1.8 0 .6-.1 1.2-.4 1.7-.8.3-.3.5-.6.6-1 .1-.4.2-.8.1-1.2-.1-.4-.3-.8-.7-.9-.4-.2-.9-.1-1.3.1-.6.3-1.1.8-1.7 1.2-.3.2-.6.4-1 .3-.4-.28-.6-.74-.7-1.24-.1-.5-.14-1-.2-1.5-.1-.96-.2-1.92-.3-2.88-.06-.6-.14-1.21-.02-1.8z" },
                artstation: { label: "ArtStation", path: "M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24-3.723a2.42 2.42 0 0 0-.637-1.614L14.5.822a2.42 2.42 0 0 0-3.427 0L9.637 2.32l5.747 9.956H24zm-14.5 0L2.792 4.838 0 9.677h9.5z" },
                linkedin: { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                website: { label: t("sp.personalWebsite"), path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
              };
              const m = icons[key];
              if (!m) return null;
              return (
                <a key={key} href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-nf-secondary/50 text-[9px] text-nf-muted hover:text-nf-accent transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d={m.path} /></svg>
                  {m.label}
                </a>
              );
            })}
          </div>
        )}
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
