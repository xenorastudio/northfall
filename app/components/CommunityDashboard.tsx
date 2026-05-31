"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

interface CommunityDashboardProps {
  communityName: string;
  onBack: () => void;
  onEdit: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function CommunityDashboard({ communityName: rawName, onBack, onEdit, showToast }: CommunityDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const communityName = rawName.replace(/^n\//, "");
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "communities", communityName));
        if (!snap.exists()) { showToast("المجتمع غير موجود", "error"); onBack(); return; }
        const data = snap.data();
        setMeta(data);
        // Allow owner AND staff (admin/moderator) to access dashboard
        const isOwner = user?.uid === data.creatorUid;
        if (!isOwner) {
          const memberSnap = await getDoc(doc(db, "communities", communityName, "members", user!.uid)).catch(() => null);
          const role = memberSnap?.data()?.role;
          const perms = memberSnap?.data()?.permissions || {};
          const canManage =
            role === "owner" ||
            role === "admin" ||
            role === "moderator" ||
            perms.manageSettings === true;
          if (!canManage) {
            showToast("ليس لديك صلاحية للوصول", "error"); onBack(); return;
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [communityName, user]);

  if (loading) return <div className="w-full px-4 py-20 text-center"><div className="w-5 h-5 border-2 border-nf-accent border-t-nf-accent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* Banner */}
      <div className="relative w-full h-[200px] rounded-2xl overflow-hidden">
        {meta?.banner ? (
          <img src={meta.banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-l from-nf-secondary to-nf-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-nf-primary via-nf-primary to-transparent" />
        <button onClick={onBack} className="absolute top-4 right-4 text-nf-muted hover:text-nf-text text-xs z-10 bg-nf-primary px-3 py-1.5 rounded-full backdrop-blur-sm border border-nf-border">←</button>
      </div>

      {/* Logo + Name + Edit */}
      <div className="flex items-center justify-between px-1 -mt-7 relative z-10">
        <div className="flex items-center gap-3">
          {meta?.img ? (
            <img src={meta.img} alt="" className="w-14 h-14 rounded-full border-4 border-nf-primary bg-nf-primary shadow-lg object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full border-4 border-nf-primary bg-nf-secondary shadow-lg flex items-center justify-center text-nf-accent font-bold text-base">n/</div>
          )}
          <div>
            <h1 className="text-lg font-bold text-nf-text">n/{communityName}</h1>
            <p className="text-[11px] text-nf-muted mt-0.5">{meta?.shortDesc || ""}</p>
          </div>
        </div>
        <a href={`/community/${encodeURIComponent(rawName)}/edit`} className="px-5 py-2 rounded-lg text-xs font-bold bg-nf-text text-nf-body border border-nf-text hover:opacity-90 transition-opacity" style={{ textDecoration: "none" }}>
          تعديل المجتمع
        </a>
      </div>
    </div>
  );
}
