"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Search, RefreshCw, FileText, MessageSquare, User, Clock, Eye, CheckCircle, RotateCcw, Trash2, X, ExternalLink, Ban, Wrench } from "lucide-react";
import { doc, getDoc, getDocs, updateDoc, deleteDoc, setDoc, collection, query, orderBy, limit, writeBatch, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";

const catMap: Record<string, string> = {
  spam: "سبام", harassment: "تحرش/تنمر", inappropriate: "غير لائق",
  misinfo: "معلومات مضللة", hate: "كراهية", other: "أخرى",
};

const statusStyle: Record<string, { bar: string; text: string }> = {
  pending:  { bar: "bg-nf-accent", text: "text-nf-accent" },
  reviewed: { bar: "bg-nf-muted", text: "text-nf-muted" },
  dismissed:{ bar: "bg-nf-dim",   text: "text-nf-dim" },
};

const statusLabels: Record<string, string> = {
  pending: "بانتظار المراجعة", reviewed: "تمت المراجعة", dismissed: "مرفوض",
};

export default function AdminPage({ onBack, onPostClick }: { onBack: () => void; onPostClick?: (id: string) => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState<"pending" | "reviewed" | "dismissed" | "all">("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<string[]>([]);
  const [deletingPost, setDeletingPost] = useState(false);
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [purging, setPurging] = useState(false);
  const [recalcSait, setRecalcSait] = useState(false);

  const isAdmin = user?.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2" || user?.uid === "OUJAuK34FoTpFyJqgOVjCH9c4Kf1";

  const showToast = (msg: string) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => setToasts(prev => prev.slice(1)), 2500);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const q2 = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(200));
      const snap = await getDocs(q2);
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { showToast("خطأ في التحميل"); }
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadReports(); }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(doc(db, "system", "maintenance"), (snap) => {
      if (snap.exists()) setMaintenanceOn(!!snap.data().active);
    });
    return () => unsub();
  }, [isAdmin]);

  const toggleMaintenance = async () => {
    const newVal = !maintenanceOn;
    try { await setDoc(doc(db, "system", "maintenance"), { active: newVal }); showToast(newVal ? "تم تفعيل وضع الصيانة" : "تم إطفاء وضع الصيانة"); } catch { showToast("خطأ"); }
  };

  const knownCommunities = ["Unity", "Unreal", "Godot", "Blender", "عام"];

  const purgeAllData = async () => {
    if (purgeConfirm !== "حذف الكل") { showToast("اكتب " + '"حذف الكل"' + " للتأكيد"); return; }
    setPurging(true);
    try {
      // 1. Delete all posts + comments + votes
      const postsSnap = await getDocs(collection(db, "posts"));
      for (const p of postsSnap.docs) {
        const commentsSnap = await getDocs(collection(db, "posts", p.id, "comments"));
        for (const c of commentsSnap.docs) await deleteDoc(c.ref).catch(() => {});
        const votesSnap = await getDocs(collection(db, "posts", p.id, "votes"));
        for (const v of votesSnap.docs) await deleteDoc(v.ref).catch(() => {});
        await deleteDoc(p.ref);
      }
      showToast("تم حذف المنشورات");

      // 2. Delete all forum threads + replies + votes
      for (const comm of knownCommunities) {
        const threadsSnap = await getDocs(collection(db, "forums", comm, "threads")).catch(() => ({ docs: [] as any[] }));
        for (const th of threadsSnap.docs) {
          const repliesSnap = await getDocs(collection(db, "forums", comm, "threads", th.id, "replies")).catch(() => ({ docs: [] as any[] }));
          for (const r of repliesSnap.docs) await deleteDoc(r.ref).catch(() => {});
          const tVotesSnap = await getDocs(collection(db, "forums", comm, "threads", th.id, "votes")).catch(() => ({ docs: [] as any[] }));
          for (const v of tVotesSnap.docs) await deleteDoc(v.ref).catch(() => {});
          await deleteDoc(th.ref).catch(() => {});
        }
      }
      showToast("تم حذف المنتدى");

      // 3. Delete all users + subcollections
      const usersSnap = await getDocs(collection(db, "users"));
      for (const u of usersSnap.docs) {
        const subCols = ["followers", "following", "communities", "saved", "notifications"];
        for (const sc of subCols) {
          const scSnap = await getDocs(collection(db, "users", u.id, sc)).catch(() => ({ docs: [] as any[] }));
          for (const d of scSnap.docs) await deleteDoc(d.ref).catch(() => {});
        }
        await deleteDoc(u.ref);
      }
      showToast("تم حذف الحسابات");

      // 4. Delete reports
      const reportsSnap = await getDocs(collection(db, "reports"));
      for (const r of reportsSnap.docs) await deleteDoc(r.ref).catch(() => {});
      showToast("تم حذف البلاغات");

      // 5. Delete communities + members
      for (const comm of knownCommunities) {
        const membersSnap = await getDocs(collection(db, "communities", comm, "members")).catch(() => ({ docs: [] as any[] }));
        for (const m of membersSnap.docs) await deleteDoc(m.ref).catch(() => {});
        await deleteDoc(doc(db, "communities", comm)).catch(() => {});
      }
      showToast("تم حذف المجتمعات");

      showToast("تم حذف كل البيانات بنجاح");
      setReports([]);
      setPurgeOpen(false);
      setPurgeConfirm("");
    } catch { showToast("حدث خطأ أثناء الحذف"); }
    setPurging(false);
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield size={40} className="text-nf-dim mb-3" />
      <p className="text-sm font-semibold text-nf-muted">غير مصرح بالدخول</p>
      <button onClick={onBack} className="mt-3 px-4 py-1.5 rounded-lg border border-nf-border text-xs text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">العودة</button>
    </div>
  );

  const filtered = reports.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search.trim()) {
      const s = ((r.reporterName || "") + " " + (r.reason || "") + " " + (catMap[r.category] || r.category || "")).toLowerCase();
      if (!s.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === "pending").length;
  const reviewedCount = reports.filter(r => r.status === "reviewed").length;
  const dismissedCount = reports.filter(r => r.status === "dismissed").length;

  const handleAction = async (action: string, reportId: string, targetId?: string) => {
    try {
      if (action === "review") {
        await updateDoc(doc(db, "reports", reportId), { status: "reviewed", reviewedAt: new Date().toISOString() });
        showToast("تمت المراجعة");
      } else if (action === "dismiss") {
        await updateDoc(doc(db, "reports", reportId), { status: "dismissed", reviewedAt: new Date().toISOString() });
        showToast("تم الرفض");
      } else if (action === "reopen") {
        await updateDoc(doc(db, "reports", reportId), { status: "pending", reviewedAt: null });
        showToast("تمت الإعادة للمراجعة");
      } else if (action === "delete-post" && targetId) {
        if (!confirm("حذف المنشور وجميع تعليقاته نهائياً؟")) return;
        setDeletingPost(true);
        const commentsSnap = await getDocs(collection(db, "posts", targetId, "comments"));
        const batch = writeBatch(db);
        commentsSnap.docs.forEach(c => batch.delete(c.ref));
        batch.delete(doc(db, "posts", targetId));
        await batch.commit();
        await updateDoc(doc(db, "reports", reportId), { status: "reviewed", reviewedAt: new Date().toISOString() });
        showToast("تم حذف المنشور والتعليقات");
        setDeletingPost(false);
      } else if (action === "delete-comment" && targetId) {
        if (!confirm("حذف التعليق نهائياً؟")) return;
        const parts = targetId.split("|");
        if (parts.length === 2) {
          await deleteDoc(doc(db, "posts", parts[0], "comments", parts[1]));
          await updateDoc(doc(db, "reports", reportId), { status: "reviewed", reviewedAt: new Date().toISOString() });
          showToast("تم حذف التعليق");
        }
      }
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action === "review" || action === "delete-post" || action === "delete-comment" ? "reviewed" : action === "dismiss" ? "dismissed" : "pending" } : r));
      setDetailId(null);
    } catch { showToast("حدث خطأ"); setDeletingPost(false); }
  };

  const detailReport = reports.find(r => r.id === detailId);

  const filters: { id: typeof filter; label: string; count: number }[] = [
    { id: "pending", label: "بانتظار", count: pendingCount },
    { id: "reviewed", label: "تمت المراجعة", count: reviewedCount },
    { id: "dismissed", label: "مرفوض", count: dismissedCount },
    { id: "all", label: "الكل", count: reports.length },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-nf-primary/95 backdrop-blur-sm border-b border-nf-border-2">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-nf-accent" />
            <h1 className="text-sm font-bold text-white">لوحة الإشراف</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={async () => {
              setRecalcSait(true);
              try {
                // Reset all users' karma and forumKarma to 0
                const usersSnap = await getDocs(collection(db, "users"));
                for (const u of usersSnap.docs) {
                  await updateDoc(doc(db, "users", u.id), { karma: 0, forumKarma: 0 });
                }
                // Recalculate app karma from all vote docs in posts
                const postsSnap = await getDocs(collection(db, "posts"));
                for (const p of postsSnap.docs) {
                  const authorUid = p.data().authorUid;
                  if (!authorUid) continue;
                  const votesSnap = await getDocs(collection(db, "posts", p.id, "votes"));
                  for (const v of votesSnap.docs) {
                    const saitGain = v.data().saitGain || 0;
                    if (saitGain !== 0) {
                      await updateDoc(doc(db, "users", authorUid), { karma: (await getDoc(doc(db, "users", authorUid))).data()?.karma + saitGain });
                    }
                  }
                }
                // Recalculate forum karma from all vote docs in forums
                for (const comm of knownCommunities) {
                  const threadsSnap = await getDocs(collection(db, "forums", comm, "threads"));
                  for (const t of threadsSnap.docs) {
                    const authorUid = t.data().authorUid;
                    if (!authorUid) continue;
                    const votesSnap = await getDocs(collection(db, "forums", comm, "threads", t.id, "votes"));
                    for (const v of votesSnap.docs) {
                      const saitGain = v.data().saitGain || 0;
                      if (saitGain !== 0) {
                        await updateDoc(doc(db, "users", authorUid), { forumKarma: (await getDoc(doc(db, "users", authorUid))).data()?.forumKarma + saitGain });
                      }
                    }
                  }
                }
                showToast("تم إعادة حساب الصيت بنجاح");
              } catch { showToast("حدث خطأ أثناء إعادة الحساب"); }
              setRecalcSait(false);
            }} disabled={recalcSait} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all disabled:opacity-50">
              {recalcSait ? <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> : <RefreshCw size={12} />}
              إعادة حساب الصيت
            </button>
            <button onClick={() => setPurgeOpen(true)} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all">
              <Trash2 size={12} />
              حذف كل البيانات
            </button>
            <button onClick={toggleMaintenance} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all", maintenanceOn ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-white/5 text-nf-dim border border-white/10 hover:text-white")}>
              <Wrench size={12} />
              {maintenanceOn ? "الصيانة شغّالة" : "فعّل صيانة"}
            </button>
            <button onClick={onBack} className="flex items-center gap-1 px-3 py-1 rounded-lg border border-nf-border text-xs font-medium text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">
              <ArrowRight size={12} />
              العودة للموقع
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto p-5">
        {/* Title + Stats */}
        <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-nf-border-2">
          <div className="text-lg font-bold text-white">البلاغات</div>
          <div className="flex gap-5 text-[13px]">
            <span className="text-nf-accent">بانتظار <strong>{pendingCount}</strong></span>
            <span className="text-nf-muted">تمت <strong>{reviewedCount}</strong></span>
            <span className="text-nf-dim">مرفوض <strong>{dismissedCount}</strong></span>
            <span className="text-nf-muted">الكل <strong>{reports.length}</strong></span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 mb-4">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold border-b-2 transition-colors",
                filter === f.id ? "text-nf-accent border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
              {f.label}
              {f.count > 0 && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                filter === f.id ? "bg-nf-accent/20 text-nf-accent" : "bg-nf-secondary text-nf-dim")}>{f.count}</span>}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nf-dim" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
              className="w-[200px] bg-nf-input border border-nf-border-2 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
          </div>
          <span className="text-[11px] text-nf-dim mr-2">{filtered.length} بلاغ</span>
          <button onClick={loadReports} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-nf-border-2 text-[11px] font-semibold text-nf-dim hover:text-nf-muted hover:border-nf-border transition-colors">
            <RefreshCw size={12} /> تحديث
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-nf-secondary flex items-center justify-center mb-3 border border-nf-border-2">
              <FileText size={24} className="text-nf-dim" />
            </div>
            <p className="text-sm font-semibold text-nf-muted">لا توجد بلاغات</p>
            <p className="text-xs text-nf-dim mt-1">ستظهر هنا عند تلقي بلاغات جديدة</p>
          </div>
        ) : (
          <div className="flex flex-col border-t border-nf-border-2">
            {filtered.map(r => (
              <div key={r.id} className="flex gap-4 py-3.5 border-b border-nf-border-2/30 hover:bg-nf-accent/5 -mx-3 px-3 transition-colors">
                {/* Status bar */}
                <div className={cn("w-1 min-w-[4px] h-10 rounded-full mt-1", (statusStyle[r.status] || statusStyle.dismissed).bar)} />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-nf-dim uppercase tracking-wider">
                      {r.type === "post" ? <FileText size={10} /> : <MessageSquare size={10} />}
                      {r.type === "post" ? "منشور" : "تعليق"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-nf-secondary text-nf-muted">{catMap[r.category] || r.category || "-"}</span>
                    {r.targetId && (
                      <button onClick={() => r.type === "post" ? onPostClick?.(r.targetId) : null}
                        className="flex items-center gap-1 text-[11px] text-nf-accent hover:underline mr-auto">
                        <ExternalLink size={10} />
                        {r.type === "post" ? "عرض المنشور" : "عرض التعليق"}
                      </button>
                    )}
                  </div>
                  {r.reason && (
                    <p onClick={() => setDetailId(r.id)} className="text-[13px] text-nf-text leading-snug line-clamp-2 cursor-pointer hover:text-white transition-colors">
                      {r.reason}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-nf-dim">
                    <span className="flex items-center gap-1.5">
                      <User size={10} />
                      {r.reporterName || "مجهول"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ar", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 items-start flex-wrap justify-end min-w-[180px]">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => handleAction("review", r.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-nf-accent/40 text-[11px] font-semibold text-nf-accent hover:bg-nf-accent/10 transition-colors">
                        <CheckCircle size={11} /> مراجعة
                      </button>
                      <button onClick={() => handleAction("dismiss", r.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                        رفض
                      </button>
                      {r.type === "post" && r.targetId && (
                        <button onClick={() => handleAction("delete-post", r.id, r.targetId)} disabled={deletingPost} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-400/30 text-[11px] font-semibold text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50">
                          <Trash2 size={11} /> حذف
                        </button>
                      )}
                      {r.type === "comment" && r.targetId && r.postId && (
                        <button onClick={() => handleAction("delete-comment", r.id, `${r.postId}|${r.targetId}`)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-400/30 text-[11px] font-semibold text-red-400 hover:bg-red-400/10 transition-colors">
                          <Trash2 size={11} /> حذف تعليق
                        </button>
                      )}
                    </>
                  )}
                  {r.status === "reviewed" && (
                    <>
                      <button onClick={() => handleAction("reopen", r.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                        <RotateCcw size={11} /> إعادة
                      </button>
                      <button onClick={() => handleAction("dismiss", r.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                        رفض
                      </button>
                    </>
                  )}
                  {r.status === "dismissed" && (
                    <>
                      <button onClick={() => handleAction("reopen", r.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                        <RotateCcw size={11} /> إعادة
                      </button>
                      <button onClick={() => handleAction("review", r.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-nf-accent/40 text-[11px] font-semibold text-nf-accent hover:bg-nf-accent/10 transition-colors">
                        <CheckCircle size={11} /> مراجعة
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDetailId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-[480px] bg-nf-primary border border-nf-border rounded-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-nf-border-2">
                <h3 className="text-sm font-bold text-white">تفاصيل البلاغ</h3>
                <button onClick={() => setDetailId(null)} className="p-1 rounded-lg text-nf-dim hover:text-white hover:bg-nf-hover transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-0">
                {[
                  { label: "الحالة", value: statusLabels[detailReport.status] || detailReport.status, isStatus: true },
                  { label: "النوع", value: detailReport.type === "post" ? "منشور" : "تعليق" },
                  { label: "الفئة", value: catMap[detailReport.category] || detailReport.category || "-" },
                  { label: "المبلّغ", value: detailReport.reporterName || "مجهول" },
                  { label: "UID", value: detailReport.reportedBy || "-", isUid: true },
                  { label: "التاريخ", value: detailReport.createdAt ? new Date(detailReport.createdAt).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-" },
                ].map((row, i) => (
                  <div key={i} className="flex py-2.5 border-b border-nf-border-2/30 last:border-0">
                    <span className="w-20 text-[11px] font-bold text-nf-dim uppercase tracking-wider">{row.label}</span>
                    <span className={cn("flex-1 text-[13px]",
                      (row as any).isUid ? "text-nf-dim text-[11px] font-mono" :
                      (row as any).isStatus ? (statusStyle[detailReport.status] || statusStyle.dismissed).text :
                      "text-nf-text")}>{row.value}</span>
                  </div>
                ))}
                {detailReport.targetId && (
                  <div className="flex py-2.5 border-b border-nf-border-2/30">
                    <span className="w-20 text-[11px] font-bold text-nf-dim uppercase tracking-wider">الهدف</span>
                    <button onClick={() => { setDetailId(null); onPostClick?.(detailReport.targetId); }} className="flex items-center gap-1 text-[13px] text-nf-accent hover:underline">
                      <ExternalLink size={12} /> فتح المنشور
                    </button>
                  </div>
                )}
                {detailReport.reason && (
                  <div className="flex flex-col gap-2 py-2.5">
                    <span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">السبب</span>
                    <p className="text-[13px] text-nf-text leading-relaxed">{detailReport.reason}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 px-4 py-3 border-t border-nf-border-2 bg-nf-secondary/30">
                {detailReport.status === "pending" && (
                  <>
                    <button onClick={() => handleAction("review", detailReport.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-nf-accent/40 text-[11px] font-semibold text-nf-accent hover:bg-nf-accent/10 transition-colors">
                      <CheckCircle size={12} /> مراجعة
                    </button>
                    <button onClick={() => handleAction("dismiss", detailReport.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                      رفض
                    </button>
                    {detailReport.type === "post" && detailReport.targetId && (
                      <button onClick={() => handleAction("delete-post", detailReport.id, detailReport.targetId)} disabled={deletingPost} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-400/30 text-[11px] font-semibold text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50">
                        <Trash2 size={12} /> حذف
                      </button>
                    )}
                    {detailReport.type === "comment" && detailReport.targetId && detailReport.postId && (
                      <button onClick={() => handleAction("delete-comment", detailReport.id, `${detailReport.postId}|${detailReport.targetId}`)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-400/30 text-[11px] font-semibold text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={12} /> حذف تعليق
                      </button>
                    )}
                  </>
                )}
                {detailReport.status === "reviewed" && (
                  <>
                    <button onClick={() => handleAction("reopen", detailReport.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                      <RotateCcw size={12} /> إعادة
                    </button>
                    <button onClick={() => handleAction("dismiss", detailReport.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                      رفض
                    </button>
                  </>
                )}
                {detailReport.status === "dismissed" && (
                  <>
                    <button onClick={() => handleAction("reopen", detailReport.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-nf-border text-[11px] font-semibold text-nf-dim hover:bg-nf-hover transition-colors">
                      <RotateCcw size={12} /> إعادة
                    </button>
                    <button onClick={() => handleAction("review", detailReport.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-nf-accent/40 text-[11px] font-semibold text-nf-accent hover:bg-nf-accent/10 transition-colors">
                      <CheckCircle size={12} /> مراجعة
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purge All Data Modal */}
      <AnimatePresence>
        {purgeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { if (!purging) setPurgeOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-[420px] bg-nf-primary border border-red-500/30 rounded-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-nf-border-2 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <Trash2 size={16} className="text-red-400" />
                  <h3 className="text-sm font-bold text-red-400">حذف كل البيانات</h3>
                </div>
                <button onClick={() => { if (!purging) setPurgeOpen(false); }} className="p-1 rounded-lg text-nf-dim hover:text-white hover:bg-nf-hover transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[13px] text-nf-text leading-relaxed">
                  سيتم حذف <strong className="text-red-400">جميع</strong> المنشورات والتعليقات والأصوات والمنتدى والحسابات والبلاغات والمجتمعات نهائياً. لا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <p className="text-[11px] text-nf-dim mb-2">اكتب <strong className="text-red-400">"حذف الكل"</strong> للتأكيد:</p>
                  <input
                    type="text"
                    value={purgeConfirm}
                    onChange={e => setPurgeConfirm(e.target.value)}
                    disabled={purging}
                    placeholder='حذف الكل'
                    className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-sm text-white placeholder:text-nf-dim outline-none focus:border-red-500/40 transition-colors"
                    dir="rtl"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={purgeAllData}
                    disabled={purging || purgeConfirm !== "حذف الكل"}
                    className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      purgeConfirm === "حذف الكل" && !purging
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-red-500/20 text-red-400/50 cursor-not-allowed")}
                  >
                    {purging ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري الحذف...
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        حذف نهائي
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setPurgeOpen(false); setPurgeConfirm(""); }}
                    disabled={purging}
                    className="flex-1 py-2 rounded-lg border border-nf-border text-xs font-semibold text-nf-dim hover:bg-nf-hover hover:text-white transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-2 rounded-lg bg-nf-secondary border border-nf-border text-[12px] font-semibold text-white shadow-lg"
            >
              {msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
