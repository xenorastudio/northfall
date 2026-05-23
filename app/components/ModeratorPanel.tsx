"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { ChevronRight, Shield, Trash2, Pin, EyeOff, Flag, Check, X, AlertTriangle, FileText, MessageSquare, Users } from "lucide-react";

interface Post { id: string; title: string; authorName: string; authorUid: string; createdAt: string; votes: number; isPinned?: boolean; isHidden?: boolean; }
interface Report { id: string; postId: string; postTitle: string; reason: string; reporterName: string; createdAt: string; status: string; }

interface Props {
  communityName: string;
  onBack: () => void;
  onPostClick?: (id: string) => void;
}

export default function ModeratorPanel({ communityName, onBack, onPostClick }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"posts"|"reports">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPerms, setMyPerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    // Get my permissions
    getDoc(doc(db, "communities", communityName)).then(commSnap => {
      if (commSnap.data()?.creatorUid === user.uid) {
        setMyPerms({ managePosts: true, manageComments: true, manageMembers: true, manageSettings: true, reviewReports: true });
        return;
      }
      getDoc(doc(db, "communities", communityName, "members", user.uid)).then(s => {
        if (s.exists()) setMyPerms(s.data().permissions || {});
      }).catch(() => {});
    }).catch(() => {});
  }, [user?.uid, communityName]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Posts
        const postsSnap = await getDocs(query(collection(db, "posts"), where("community", "==", communityName), orderBy("createdAt", "desc"), limit(30)));
        setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
        // Reports
        const reportsSnap = await getDocs(query(collection(db, "reports"), where("community", "==", communityName), orderBy("createdAt", "desc"), limit(20))).catch(() => null);
        if (reportsSnap) setReports(reportsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
      } catch {}
      setLoading(false);
    })();
  }, [communityName]);

  const deletePost = async (postId: string) => {
    if (!confirm("حذف هذا المنشور نهائياً؟")) return;
    await deleteDoc(doc(db, "posts", postId)).catch(() => {});
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const togglePin = async (postId: string, current: boolean) => {
    await updateDoc(doc(db, "posts", postId), { isPinned: !current }).catch(() => {});
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !current } : p));
  };

  const toggleHide = async (postId: string, current: boolean) => {
    await updateDoc(doc(db, "posts", postId), { isHidden: !current }).catch(() => {});
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isHidden: !current } : p));
  };

  const resolveReport = async (reportId: string) => {
    await updateDoc(doc(db, "reports", reportId), { status: "resolved" }).catch(() => {});
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: "resolved" } : r));
  };

  const TABS = [
    { id: "posts" as const, label: "المنشورات", icon: FileText, show: myPerms.managePosts },
    { id: "reports" as const, label: "البلاغات", icon: Flag, show: myPerms.reviewReports },
  ].filter(t => t.show);

  return (
    <div className="w-full max-w-[860px]" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text transition-colors">
          <ChevronRight size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center shrink-0">
          <Shield size={16} className="text-nf-accent" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-nf-text">لوحة الإشراف</h1>
          <p className="text-[12px] text-nf-dim">n/{communityName}</p>
        </div>
      </div>

      {/* Tabs */}
      {TABS.length > 0 && (
        <div className="flex border-b border-nf-border-2/30 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 -mb-px transition-colors",
                tab === t.id ? "text-nf-text border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-nf-secondary/20 animate-pulse" />)}</div>
      ) : (
        <>
          {/* Posts tab */}
          {tab === "posts" && (
            <div className="space-y-1.5">
              {posts.length === 0 ? (
                <div className="text-center py-16 text-nf-dim"><FileText size={24} className="mx-auto mb-3 opacity-20" /><p>لا توجد منشورات</p></div>
              ) : posts.map((p, idx) => (
                <div key={p.id}>
                  {idx > 0 && <div className="h-px bg-nf-border-2/20 mx-1" />}
                  <div className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-nf-secondary/20 transition-colors">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPostClick?.(p.id)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {p.isPinned && <Pin size={11} className="text-nf-accent shrink-0" />}
                        {p.isHidden && <EyeOff size={11} className="text-nf-dim shrink-0" />}
                        <p className={cn("text-[13px] font-medium truncate", p.isHidden ? "text-nf-dim line-through" : "text-nf-text")}>{p.title}</p>
                      </div>
                      <p className="text-[11px] text-nf-dim">u/{p.authorName} · {p.votes || 0} نقطة</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => togglePin(p.id, !!p.isPinned)} title={p.isPinned ? "إلغاء التثبيت" : "تثبيت"}
                        className={cn("p-1.5 rounded-lg transition-colors", p.isPinned ? "text-nf-accent" : "text-nf-dim hover:text-nf-accent hover:bg-nf-accent/10")}>
                        <Pin size={13} />
                      </button>
                      <button onClick={() => toggleHide(p.id, !!p.isHidden)} title={p.isHidden ? "إظهار" : "إخفاء"}
                        className={cn("p-1.5 rounded-lg transition-colors", p.isHidden ? "text-nf-accent" : "text-nf-dim hover:text-nf-muted hover:bg-nf-secondary")}>
                        <EyeOff size={13} />
                      </button>
                      <button onClick={() => deletePost(p.id)} title="حذف"
                        className="p-1.5 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reports tab */}
          {tab === "reports" && (
            <div className="space-y-2">
              {reports.length === 0 ? (
                <div className="text-center py-16 text-nf-dim"><Flag size={24} className="mx-auto mb-3 opacity-20" /><p>لا توجد بلاغات</p></div>
              ) : reports.map(r => (
                <div key={r.id} className={cn("flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors",
                  r.status === "resolved" ? "border-nf-border-2/20 opacity-50" : "border-nf-border-2/50 bg-nf-secondary/10")}>
                  <AlertTriangle size={15} className={cn("shrink-0 mt-0.5", r.status === "resolved" ? "text-nf-dim" : "text-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-nf-text truncate cursor-pointer hover:underline" onClick={() => onPostClick?.(r.postId)}>
                      {r.postTitle || "منشور محذوف"}
                    </p>
                    <p className="text-[11px] text-nf-dim mt-0.5">{r.reason} · بواسطة {r.reporterName}</p>
                  </div>
                  {r.status !== "resolved" && (
                    <button onClick={() => resolveReport(r.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-green-400 border border-green-400/30 hover:bg-green-400/10 transition-colors shrink-0">
                      <Check size={11} /> تم الحل
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
