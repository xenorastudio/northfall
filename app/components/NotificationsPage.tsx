"use client";

import React, { useState, useEffect } from "react";
import {
  Bell, MessageSquare, ArrowUp, UserPlus, Award,
  CheckCheck, Trash2, Eye, Heart, AtSign, Users, Shield,
  Megaphone, Gift, X,
} from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, deleteDoc, doc, writeBatch, setDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import {
  actorInitial,
  formatNotificationPrimary,
  notificationActorLabel,
  primaryActor,
  type NotificationLike,
} from "@/lib/notification-format";

function timeAgo(ts: any): string {
  if (!ts) return "";
  try {
    const d = typeof ts === "string" ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date(ts));
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "الآن";
    if (s < 3600) return `${Math.floor(s / 60)} دقيقة`;
    if (s < 86400) return `${Math.floor(s / 3600)} ساعة`;
    if (s < 604800) return `${Math.floor(s / 86400)} يوم`;
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  } catch { return ""; }
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  comment:  { icon: MessageSquare, color: "text-blue-400",   bg: "bg-blue-400/10",   label: "تعليق" },
  vote:     { icon: ArrowUp,       color: "text-orange-400", bg: "bg-orange-400/10", label: "تصويت" },
  follow:   { icon: UserPlus,      color: "text-violet-400", bg: "bg-violet-400/10", label: "متابعة" },
  award:    { icon: Award,         color: "text-amber-400",  bg: "bg-amber-400/10",  label: "جائزة" },
  mention:  { icon: AtSign,        color: "text-cyan-400",   bg: "bg-cyan-400/10",   label: "إشارة" },
  like:     { icon: Heart,         color: "text-pink-400",   bg: "bg-pink-400/10",   label: "إعجاب" },
  invite:   { icon: Users,         color: "text-green-400",  bg: "bg-green-400/10",  label: "دعوة" },
  mod:      { icon: Shield,        color: "text-red-400",    bg: "bg-red-400/10",    label: "إشراف" },
  announce: { icon: Megaphone,     color: "text-yellow-400", bg: "bg-yellow-400/10", label: "إعلان" },
  reply:    { icon: MessageSquare, color: "text-sky-400",    bg: "bg-sky-400/10",    label: "رد" },
  gift:     { icon: Gift,          color: "text-rose-400",   bg: "bg-rose-400/10",   label: "هدية" },
  general:  { icon: Bell,          color: "text-nf-muted",   bg: "bg-nf-secondary",  label: "عام" },
};

const FILTERS = [
  { id: "all",      label: "الكل" },
  { id: "unread",   label: "غير مقروء" },
  { id: "social",   label: "اجتماعي" },
  { id: "content",  label: "محتوى" },
];

export default function NotificationsPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [handledInvites, setHandledInvites] = useState<Record<string, "accepted" | "declined">>({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const markRead = async (n: any) => {
    if (!user || n.read) return;
    try { await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true }); } catch {}
  };

  const markAllRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
    });
    try { await batch.commit(); } catch {}
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try { await deleteDoc(doc(db, "users", user.uid, "notifications", id)); } catch {}
  };

  const clearAll = async () => {
    if (!user || !notifications.length) return;
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, "users", user.uid, "notifications", n.id)));
    try { await batch.commit(); } catch {}
  };

  const acceptInvite = async (n: any) => {
    if (!user) return;
    try {
      // Add user to community members
      await setDoc(doc(db, "communities", n.community, "members", user.uid), {
        uid: user.uid,
        role: "member",
        joinedAt: new Date().toISOString(),
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      });
      await setDoc(doc(db, "users", user.uid, "communities", n.community), {
        name: n.community, joinedAt: new Date().toISOString(),
      });
      // Mark notification as read
      await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true });
      setHandledInvites(prev => ({ ...prev, [n.id]: "accepted" }));
    } catch {}
  };

  const declineInvite = async (n: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true });
      setHandledInvites(prev => ({ ...prev, [n.id]: "declined" }));
    } catch {}
  };

  const SOCIAL_TYPES = new Set(["follow", "invite", "mention", "like"]);
  const CONTENT_TYPES = new Set(["comment", "vote", "reply", "award", "gift"]);

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "social") return SOCIAL_TYPES.has(n.type);
    if (filter === "content") return CONTENT_TYPES.has(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Group by time
  const grouped = (() => {
    const now = Date.now();
    const DAY = 86400000;
    const groups: { label: string; items: any[] }[] = [];
    const buckets: Record<string, any[]> = { today: [], yesterday: [], week: [], older: [] };
    for (const n of filtered) {
      const t = n.createdAt ? new Date(typeof n.createdAt === "string" ? n.createdAt : n.createdAt.toDate?.() || n.createdAt).getTime() : 0;
      const age = now - t;
      if (age < DAY) buckets.today.push(n);
      else if (age < 2 * DAY) buckets.yesterday.push(n);
      else if (age < 7 * DAY) buckets.week.push(n);
      else buckets.older.push(n);
    }
    if (buckets.today.length)     groups.push({ label: "اليوم",         items: buckets.today });
    if (buckets.yesterday.length) groups.push({ label: "أمس",           items: buckets.yesterday });
    if (buckets.week.length)      groups.push({ label: "هذا الأسبوع",   items: buckets.week });
    if (buckets.older.length)     groups.push({ label: "أقدم",          items: buckets.older });
    return groups;
  })();

  return (
    <div className="w-full max-w-[640px] mx-auto" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[16px] font-bold text-nf-text leading-tight">الإشعارات</h1>
          {unreadCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent font-bold border border-nf-accent/20">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-nf-accent bg-nf-accent/10 hover:bg-nf-accent/20 transition-colors"
            >
              <CheckCheck size={12} /> قراءة الكل
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={12} /> مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const count = f.id === "all" ? notifications.length
            : f.id === "unread" ? unreadCount
            : f.id === "social" ? notifications.filter(n => SOCIAL_TYPES.has(n.type)).length
            : notifications.filter(n => CONTENT_TYPES.has(n.type)).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border",
                filter === f.id
                  ? "bg-nf-accent/10 text-nf-accent border-nf-accent/30"
                  : "text-nf-dim border-nf-border-2 hover:text-nf-text hover:border-nf-accent/20"
              )}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                    filter === f.id ? "bg-nf-accent/20 text-nf-accent" : "bg-nf-secondary text-nf-dim"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-nf-border-2/40">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-2.5 px-1 py-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-nf-secondary/50 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-nf-secondary/50 rounded w-[85%]" />
                <div className="h-2 bg-nf-secondary/30 rounded w-[40%]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell size={24} className="text-nf-dim/30 mb-3" />
          <p className="text-[13px] font-semibold text-nf-muted">
            {filter === "all" ? "لا توجد إشعارات" : filter === "unread" ? "كل الإشعارات مقروءة" : "لا توجد إشعارات هنا"}
          </p>
          <p className="text-[11px] text-nf-dim mt-1">تفاعل مع المجتمع لتظهر إشعاراتك هنا</p>
        </div>
      ) : (
        <div>
          {grouped.map((group, gi) => (
            <div key={group.label}>
              <p className="px-1 pt-3 pb-1 text-[11px] font-bold text-nf-dim">{group.label}</p>
              <div className="divide-y divide-nf-border-2/40">
                {group.items.map((n, ni) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
                  const Icon = cfg.icon;
                  const isLastInList = gi === grouped.length - 1 && ni === group.items.length - 1;
                  const notif = n as NotificationLike;
                  const actor = primaryActor(notif);
                  const primaryText = formatNotificationPrimary(notif);
                  const actionText = actor ? primaryText.slice(actor.name.length).trim() : primaryText;
                  const username = actor?.name || notificationActorLabel(notif);
                  const postPreview = notif.postTitle || (notif.text?.match(/"([^"]+)"/)?.[1] ?? "");
                  return (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => markRead(n)}
                      onKeyDown={(e) => e.key === "Enter" && markRead(n)}
                      className={cn(
                        "group relative flex items-start gap-2.5 px-1 py-2 cursor-pointer transition-colors",
                        !n.read ? "bg-nf-hover/50 hover:bg-nf-hover" : "hover:bg-nf-hover/35",
                        isLastInList && "border-b-0"
                      )}
                    >
                      {!n.read && (
                        <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-nf-accent" aria-hidden />
                      )}

                      <div className="shrink-0 relative">
                        {(() => {
                          const actor = primaryActor(n as NotificationLike);
                          const photo = actor?.photo || n.fromPhoto;
                          const name = actor?.name || n.fromName || actorInitial(n.text || "U");
                          return photo ? (
                            <img
                              src={photo}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-nf-border-2/60 bg-nf-secondary"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full ring-2 ring-nf-border-2/60 bg-gradient-to-br from-nf-secondary to-nf-hover flex items-center justify-center text-[13px] font-bold text-nf-text">
                              {actorInitial(name)}
                            </div>
                          );
                        })()}
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -start-0.5 w-[18px] h-[18px] rounded-full border-2 border-nf-body flex items-center justify-center",
                            cfg.bg
                          )}
                        >
                          <Icon size={9} className={cfg.color} />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 pe-6">
                        <p
                          className={cn(
                            "text-[13px] leading-snug",
                            n.read ? "text-nf-muted" : "text-nf-text"
                          )}
                        >
                          {actor ? (
                            <>
                              <span className={cn("font-bold", !n.read && "text-nf-text")}>
                                u/{username}
                              </span>
                              {" "}
                              <span className={cn(n.read ? "text-nf-muted" : "text-nf-text/90")}>
                                {actionText}
                              </span>
                            </>
                          ) : (
                            <span className={cn(!n.read && "font-medium")}>{primaryText}</span>
                          )}
                        </p>
                        {postPreview && notif.type !== "follow" && (
                          <p className="text-[12px] text-nf-dim mt-0.5 line-clamp-1">
                            {postPreview}
                          </p>
                        )}
                        <p className="text-[11px] text-nf-dim mt-0.5">
                          {timeAgo(n.createdAt)}
                          {n.community && (
                            <>
                              <span className="mx-1 text-nf-border-2">·</span>
                              <span className="text-nf-accent font-medium">n/{n.community}</span>
                            </>
                          )}
                        </p>

                        {n.type === "invite" && n.communityInvite && n.community && !handledInvites[n.id] && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptInvite(n);
                              }}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-nf-accent text-nf-primary hover:opacity-90"
                            >
                              قبول
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                declineInvite(n);
                              }}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-nf-dim hover:text-nf-text border border-nf-border-2"
                            >
                              رفض
                            </button>
                          </div>
                        )}
                        {n.type === "invite" && n.communityInvite && handledInvites[n.id] && (
                          <p
                            className={cn(
                              "text-[10px] mt-1 font-semibold",
                              handledInvites[n.id] === "accepted" ? "text-green-400" : "text-nf-dim"
                            )}
                          >
                            {handledInvites[n.id] === "accepted"
                              ? `انضممت إلى n/${n.community}`
                              : "تم الرفض"}
                          </p>
                        )}
                      </div>

                      <div className="absolute end-1 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(n);
                            }}
                            className="p-1 text-nf-dim hover:text-nf-text"
                            title="تحديد كمقروء"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => deleteNotif(n.id, e)}
                          className="p-1 text-nf-dim hover:text-red-400"
                          title="حذف"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
