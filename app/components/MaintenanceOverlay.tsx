"use client";
import React, { useState, useEffect } from "react";
import { Wrench, ShieldCheck } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

const OWNER_UIDS = ["bn6vKOGvIeUdF91P0fzMEbFZfGr2", "OUJAuK34FoTpFyJqgOVjCH9c4Kf1"];

export default function MaintenanceOverlay({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "maintenance"), (snap) => {
      if (snap.exists()) {
        setActive(!!snap.data().active);
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // Auto-create doc if missing so admin toggle works
  useEffect(() => {
    if (!loading) {
      setDoc(doc(db, "system", "maintenance"), { active: false }, { merge: true }).catch(() => {});
    }
  }, [loading]);

  const isOwner = OWNER_UIDS.includes(user?.uid || "");

  if (loading) return null;

  // Owners always pass through
  if (isOwner) {
    return (
      <>
        {children}
        {active && (
          <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
            <Wrench size={12} />
            وضع الصيانة شغال
          </div>
        )}
      </>
    );
  }

  // Non-owners: blocked if active
  if (active) {
    return (
      <div className="fixed inset-0 z-[999] bg-[#0a0a0b] flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
            <Wrench size={24} className="text-white/30" />
          </div>

          <h1 className="text-2xl font-black text-white mb-2">تحت الصيانة</h1>

          <div className="w-10 h-px bg-white/10 mx-auto mb-4" />

          <p className="text-[13px] text-white/40 leading-relaxed mb-1">
            الموقع حاليا تحت الصيانة لتحديثات جديدة
          </p>
          <p className="text-[11px] text-white/25">
            رجعولك شوي
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
            <span className="text-[10px] text-white/30 font-semibold">جاري العمل</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
