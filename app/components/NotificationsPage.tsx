"use client";
import React, { useState, useEffect } from "react";
import { Bell, MessageSquare, ArrowUp, UserPlus, Award, Hash, CheckCheck, Trash2, ArrowLeft, Eye, Sparkles, Settings } from "lucide-react";
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

  const iconMap: Record<string, { icon: any; cls: string; bg: string; ring: string }> = {
    comment: { icon: MessageSquare, cls: "text-blue-400", bg: "bg-blue-500/15", ring: "ring-blue-500/20" },
    vote: { icon: ArrowUp, cls: "text-emerald-400", bg: "bg-emerald-500/15", ring: "ring-emerald-500/20" },
    follow: { icon: UserPlus, cls: "text-violet-400", bg: "bg-violet-500/15", ring: "ring-violet-500/20" },
    award: { icon: Award, cls: "text-amber-400", bg: "bg-amber-500/15", ring: "ring-amber-500/20" },
    mention: { icon: Hash, cls: "text-cyan-400", bg: "bg-cyan-500/15", ring: "ring-cyan-500/20" },
    general: { icon: Bell, cls: "text-nf-accent", bg: "bg-nf-accent/15", ring: "ring-nf-accent/20" },
  };

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl text-nf-dim hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              الإشعارات
              {unreadCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-nf-accent text-white font-bold">{unreadCount}</span>
              )}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-nf-accent bg-nf-accent/10 hover:bg-nf-accent/25 transition-colors">
              <CheckCheck size={13} /> قراءة الكل
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={13} /> مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs - pill style */}
      <div className="flex items-center gap-1.5 mb-4 p-1 bg-nf-secondary/50 rounded-lg">
        {[
          { id: "all" as const, label: "الكل", count: notifications.length },
          { id: "unread" as const, label: "غير مقروء", count: unreadCount },
          { id: "mentions" as const, label: "إشارات", count: notifications.filter((n: any) => n.type === "comment" || n.type === "mention").length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all",
              filter === f.id ? "bg-nf-primary text-white shadow-sm" : "text-nf-dim hover:text-nf-muted")}>
            {f.label}
            {f.count > 0 && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", filter === f.id ? "bg-nf-accent/20 text-nf-accent" : "bg-nf-secondary text-nf-dim")}>{f.count}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-nf-secondary flex items-center justify-center mb-4 border border-nf-border-2">
            <Bell size={28} className="text-nf-dim" />
          </div>
          <p className="text-sm font-bold text-nf-muted">
            {filter === "all" ? "لا توجد إشعارات بعد" : filter === "unread" ? "كل الإشعارات مقروءة" : "لا توجد إشارات"}
          </p>
          <p className="text-xs text-nf-dim mt-1.5">علّق على المنشورات لتظهر هنا</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-2 text-[11px] font-bold text-nf-dim/70 uppercase tracking-wider">{group.label}</div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((n: any) => {
                    const notifType = n.type || "general";
                    const meta = iconMap[notifType] || iconMap.general;
                    const Icon = meta.icon;
                    return (
                      <motion.div key={n.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => markRead(n)}
                        className={cn("group relative flex items-start gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer",
                          !n.read
                            ? "bg-nf-accent/8 hover:bg-nf-accent/15"
                            : "hover:bg-white/5")}>
                        {/* Unread indicator */}
                        {!n.read && (
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-nf-accent" />
                        )}
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1", meta.bg, meta.ring)}>
                          <Icon size={16} className={meta.cls} />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={cn("text-[13px] leading-snug", n.read ? "text-nf-muted" : "text-white font-medium")}>{n.text || n.message || "إشعار جديد"}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-nf-dim">{n.createdAt ? timeAgo(n.createdAt) : ""}</span>
                            {n.count > 1 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nf-accent/15 text-nf-accent font-bold">×{n.count}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!n.read && (
                            <button onClick={(e) => { e.stopPropagation(); markRead(n); }} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-accent hover:bg-nf-accent/10 transition-colors" title="قراءة">
                              <Eye size={14} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteNotif(n); }} className="p-1.5 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors" title="حذف">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
