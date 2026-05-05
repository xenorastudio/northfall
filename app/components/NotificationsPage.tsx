"use client";
import React, { useState, useEffect } from "react";
import { Bell, MessageSquare, ArrowUp, UserPlus, Award, Hash, CheckCheck, Trash2, ArrowLeft, Eye } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function timeAgo(ts: any): string {
  if (!ts) return "";
  try {
    const d = typeof ts === "string" ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date(ts));
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "الآن"; if (s < 3600) return `${Math.floor(s / 60)}د`; if (s < 86400) return `${Math.floor(s / 3600)}س`; return `${Math.floor(s / 86400)}ي`;
  } catch { return ""; }
}

export default function NotificationsPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "mentions">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q2 = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q2, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n: any) => !n.read);
    for (const n of unread) {
      try { await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true }); } catch {}
    }
  };

  const markRead = async (n: any) => {
    if (!user || n.read) return;
    try { await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true }); } catch {}
  };

  const deleteNotif = async (n: any) => {
    if (!user) return;
    try { await deleteDoc(doc(db, "users", user.uid, "notifications", n.id)); } catch {}
  };

  const clearAll = async () => {
    if (!user) return;
    for (const n of notifications) {
      try { await deleteDoc(doc(db, "users", user.uid, "notifications", n.id)); } catch {}
    }
  };

  let filtered = notifications;
  if (filter === "unread") filtered = notifications.filter((n: any) => !n.read);
  if (filter === "mentions") filtered = notifications.filter((n: any) => n.type === "comment" || n.type === "mention");

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const grouped = (() => {
    const groups: { label: string; items: any[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    let todayItems: any[] = [], yesterdayItems: any[] = [], weekItems: any[] = [], olderItems: any[] = [];
    for (const n of filtered) {
      const d = n.createdAt ? (typeof n.createdAt === "string" ? new Date(n.createdAt) : n.createdAt.toDate?.() || new Date(n.createdAt)) : new Date(0);
      if (d >= today) todayItems.push(n);
      else if (d >= yesterday) yesterdayItems.push(n);
      else if (d >= weekAgo) weekItems.push(n);
      else olderItems.push(n);
    }
    if (todayItems.length) groups.push({ label: "اليوم", items: todayItems });
    if (yesterdayItems.length) groups.push({ label: "أمس", items: yesterdayItems });
    if (weekItems.length) groups.push({ label: "هذا الأسبوع", items: weekItems });
    if (olderItems.length) groups.push({ label: "أقدم", items: olderItems });
    return groups;
  })();

  const iconMap: Record<string, { icon: any; cls: string; label: string }> = {
    comment: { icon: MessageSquare, cls: "text-blue-400", label: "تعليق" },
    vote: { icon: ArrowUp, cls: "text-orange-500", label: "تصويت" },
    follow: { icon: UserPlus, cls: "text-violet-400", label: "متابعة" },
    award: { icon: Award, cls: "text-amber-400", label: "جائزة" },
    mention: { icon: Hash, cls: "text-cyan-400", label: "إشارة" },
    general: { icon: Bell, cls: "text-nf-muted", label: "عام" },
  };

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            الإشعارات
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nf-accent text-white font-bold">{unreadCount}</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-nf-accent bg-nf-accent/10 hover:bg-nf-accent/20 transition-colors">
              <CheckCheck size={11} /> قراءة الكل
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={11} /> مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs - flat pill */}
      <div className="flex items-center gap-1 mb-3 p-0.5 bg-nf-secondary/30 rounded-md">
        {[
          { id: "all" as const, label: "الكل", count: notifications.length },
          { id: "unread" as const, label: "غير مقروء", count: unreadCount },
          { id: "mentions" as const, label: "إشارات", count: notifications.filter((n: any) => n.type === "comment" || n.type === "mention").length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all",
              filter === f.id ? "bg-nf-primary text-white" : "text-nf-dim hover:text-nf-muted")}>
            {f.label}
            {f.count > 0 && <span className={cn("text-[9px] px-1 py-0.5 rounded-full", filter === f.id ? "bg-nf-accent/20 text-nf-accent" : "bg-nf-secondary text-nf-dim")}>{f.count}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell size={24} className="text-nf-dim/40 mb-2" />
          <p className="text-xs font-semibold text-nf-muted">
            {filter === "all" ? "لا توجد إشعارات بعد" : filter === "unread" ? "كل الإشعارات مقروءة" : "لا توجد إشارات"}
          </p>
          <p className="text-[10px] text-nf-dim mt-1">علّق على المنشورات لتظهر هنا</p>
        </div>
      ) : (
        <div className="flex flex-col gap-px">
          <AnimatePresence mode="popLayout">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="px-2 py-1.5 text-[10px] font-bold text-nf-dim/60 uppercase tracking-wider">{group.label}</div>
                {group.items.map((n: any) => {
                  const notifType = n.type || "general";
                  const meta = iconMap[notifType] || iconMap.general;
                  const Icon = meta.icon;
                  return (
                    <motion.div key={n.id}
                      layout
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => markRead(n)}
                      className={cn("group relative flex items-center gap-2 px-2 py-1.5 rounded-md transition-all cursor-pointer",
                        !n.read
                          ? "bg-nf-accent/5 hover:bg-nf-accent/10"
                          : "hover:bg-nf-secondary/50")}>
                      {/* Unread dot */}
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-nf-accent shrink-0" />
                      )}
                      {n.read && <div className="w-1.5 shrink-0" />}
                      <Icon size={13} className={cn("shrink-0", meta.cls)} />
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className={cn("text-[11px] leading-tight truncate", n.read ? "text-nf-muted" : "text-white font-medium")}>{n.text || n.message || "إشعار جديد"}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn("text-[9px] px-1 py-0.5 rounded font-semibold", meta.cls, "bg-nf-secondary/60")}>{meta.label}</span>
                        {n.count > 1 && <span className="text-[9px] px-1 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent font-bold">×{n.count}</span>}
                        <span className="text-[9px] text-nf-dim">{n.createdAt ? timeAgo(n.createdAt) : ""}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button onClick={(e) => { e.stopPropagation(); markRead(n); }} className="p-0.5 rounded text-nf-dim hover:text-nf-accent transition-colors" title="قراءة">
                              <Eye size={11} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteNotif(n); }} className="p-0.5 rounded text-nf-dim hover:text-red-400 transition-colors" title="حذف">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
