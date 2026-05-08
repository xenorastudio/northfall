"use client";
import React, { useState, useEffect } from "react";
import { Wrench, ShieldCheck } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

const OWNER_UIDS = ["bn6vKOGvIeUdF91P0fzMEbFZfGr2", "OUJAuK34FoTpFyJqgOVjCH9c4Kf1"];

export default function MaintenanceOverlay({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkMaintenance() {
      try {
        const snap = await getDoc(doc(db, "system", "maintenance"));
        if (snap.exists()) {
          setActive(!!snap.data().active);
        } else {
          await setDoc(doc(db, "system", "maintenance"), { active: false }).catch(() => {});
        }
      } catch {}
      setLoading(false);
    }
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 60000);
    return () => clearInterval(interval);
  }, []);

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
          <h1 className="text-5xl font-black text-white mb-4">تحت الصيانة</h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
