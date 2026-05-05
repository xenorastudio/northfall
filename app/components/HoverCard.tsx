"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Star, MessageSquare, Shield, Users, FileText, Clock, UserPlus, UserCheck } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, addDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
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
            });
          }
        } else {
          const meta: Record<string, any> = {
            Unity: {
              img: "/assets/images/unitylogo.png",
              banner: "/assets/images/bannerunity.png",
              desc: "مكانك لو حابب تتعلم Unity وتشارك مشاريعك مع مطورين عرب.",
              rules: ["احترام الجميع", "المحتوى متعلق بـ Unity", "لا سبام"],
              tags: ["Unity", "GameDev", "C#"],
            },
            Godot: {
              img: "/assets/images/godotlogo.png",
              banner: "/assets/images/godotbanner.png",
              desc: "المحرك المفتوح اللي بيسمح لك تعمل لعبتك بلا قيود.",
              rules: ["احترام الجميع", "المحتوى متعلق بـ Godot", "لا سبام"],
              tags: ["Godot", "OpenSource", "GDScript"],
            },
            Blender: {
              img: "/assets/images/logoblender.png",
              banner: "/assets/images/bannerblender.png",
              desc: "من النمذجة للأنيميشن للرندر — كل شي بيتعمل بـ Blender.",
              rules: ["احترام الجميع", "المحتوى متعلق بـ Blender", "لا سبام"],
              tags: ["Blender", "3D", "Modeling"],
            },
          };
          const m = meta[name] || { img: "", banner: "", desc: `مجتمع n/${name}`, rules: [], tags: [] };
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
        <div className="text-[10px] text-nf-dim mb-1.5">
          {t("hc.defaultBadges")}
        </div>
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
        <p className="text-[11px] text-nf-text-2 leading-relaxed mb-1.5">{data.desc}</p>
        <div className="text-[10px] text-nf-dim mb-1.5">
          <span className="text-white">{data.rules?.length || 0}</span> {t("hc.rule")} · {t("hc.openToAll")}
        </div>
        <button onClick={() => onCommunityClick?.(name)} className="w-full py-1.5 rounded text-[11px] font-bold bg-nf-secondary text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
          {t("hc.viewCommunity")}
        </button>
      </div>
    </div>
  );
}
