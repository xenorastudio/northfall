"use client";
import React, { useState, useEffect } from "react";
import { Bell, MessageSquare, ArrowUp, UserPlus, Award, Hash, CheckCheck, Trash2, ArrowLeft, Eye, Sparkles, Volume2, VolumeX } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";

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
  const [muted, setMuted] = useState(false);

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

  // Group notifications by date
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

  const iconMap: Record<string, { icon: any; cls: string; bg: string }> = {
    comment: { icon: MessageSquare, cls: "text-blue-400", bg: "bg-blue-500/10" },
    vote: { icon: ArrowUp, cls: "text-green-400", bg: "bg-green-500/10" },
    follow: { icon: UserPlus, cls: "text-purple-400", bg: "bg-purple-500/10" },
    award: { icon: Award, cls: "text-yellow-400", bg: "bg-yellow-500/10" },
    mention: { icon: Hash, cls: "text-cyan-400", bg: "bg-cyan-500/10" },
    general: { icon: Bell, cls: "text-nf-accent", bg: "bg-nf-accent/10" },
  };

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-nf-dim hover:text-white hover:bg-nf-hover transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">الإشعارات</h1>
            {unreadCount > 0 && <p className="text-[11px] text-nf-accent">{unreadCount} غير مقروء</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-nf-accent bg-nf-accent/10 hover:bg-nf-accent/20 transition-colors">
              <CheckCheck size={13} /> قراءة الكل
            </button>
          )}
          <button onClick={() => setMuted(!muted)} className={cn("p-2 rounded-lg transition-colors", muted ? "text-red-400 bg-red-400/10" : "text-nf-dim hover:text-white hover:bg-nf-hover")}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-nf-dim hover:text-red-400 hover:bg-red-400/5 transition-colors">
              <Trash2 size={13} /> مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center border-b border-nf-border-2 mb-2">
        {[
          { id: "all" as const, label: "الكل", count: notifications.length },
          { id: "unread" as const, label: "غير مقروء", count: unreadCount },
          { id: "mentions" as const, label: "إشارات", count: notifications.filter((n: any) => n.type === "comment" || n.type === "mention").length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors",
              filter === f.id ? "text-nf-accent border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-nf-secondary flex items-center justify-center mb-3 border border-nf-border-2">
            <Bell size={24} className="text-nf-dim" />
          </div>
          <p className="text-sm font-semibold text-nf-muted">
            {filter === "all" ? "لا توجد إشعارات" : filter === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشارات"}
          </p>
          <p className="text-xs text-nf-dim mt-1">الإشعارات ستظهر هنا</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-2 text-[10px] font-bold text-nf-dim uppercase tracking-wider bg-nf-secondary/20 sticky top-0 z-10">{group.label}</div>
              {group.items.map((n: any) => {
                const notifType = n.type || "general";
                const meta = iconMap[notifType] || iconMap.general;
                const Icon = meta.icon;
                return (
                  <div key={n.id}
                    onClick={() => markRead(n)}
                    className={cn("group flex items-start gap-3 px-4 py-3 border-b border-nf-border-2/30 transition-colors cursor-pointer hover:bg-nf-hover",
                      !n.read && "bg-nf-accent/5 border-r-2 border-r-nf-accent")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", meta.bg)}>
                      <Icon size={15} className={meta.cls} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white leading-snug">{n.text || n.message || "إشعار جديد"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-nf-dim">{n.createdAt ? timeAgo(n.createdAt) : ""}</span>
                        {n.count > 1 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nf-accent/15 text-nf-accent font-bold">+{n.count}</span>}
                        {!n.read && <span className="text-[10px] text-nf-accent font-semibold">جديد</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.read && (
                        <button onClick={(e) => { e.stopPropagation(); markRead(n); }} className="p-1 rounded text-nf-dim hover:text-nf-accent hover:bg-nf-hover transition-colors" title="قراءة">
                          <Eye size={13} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotif(n); }} className="p-1 rounded text-nf-dim hover:text-red-400 hover:bg-nf-hover transition-colors" title="حذف">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
