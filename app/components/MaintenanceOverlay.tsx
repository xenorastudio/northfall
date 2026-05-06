"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, ShieldCheck, X } from "lucide-react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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

  const isOwner = OWNER_UIDS.includes(user?.uid || "");

  if (loading) return null;

  const showMaintenance = active && !bypassed && !isOwner;

  return (
    <>
      {showMaintenance ? (
        <div className="fixed inset-0 z-[999] bg-[#0a0a0b] flex items-center justify-center overflow-hidden" dir="rtl">
          {/* Animated background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nf-accent/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-[80px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 text-center max-w-md px-6"
          >
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center mx-auto mb-8"
            >
              <Wrench size={36} className="text-nf-accent" />
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl font-black text-white mb-3 tracking-tight">الموقع تحت الصيانة</h1>

            {/* Divider */}
            <div className="w-16 h-0.5 bg-nf-accent/30 mx-auto mb-5 rounded-full" />

            {/* Message */}
            <p className="text-sm text-white/50 leading-relaxed mb-2">
              عم نشتغل على تحسينات جديدة للموقع، رجعولك شوي
            </p>
            <p className="text-xs text-white/30">
              الموقع رح يرجع في أقرب وقت ممكن
            </p>

            {/* Status badge */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] text-white/40 font-semibold">جاري الصيانة</span>
            </div>

            {/* Owner bypass */}
            {isOwner && (
              <button
                onClick={() => setBypassed(true)}
                className="mt-6 block mx-auto text-[11px] text-nf-accent/60 hover:text-nf-accent transition-colors flex items-center gap-1"
              >
                <ShieldCheck size={12} /> دخول كصاحب الموقع
              </button>
            )}
          </motion.div>
        </div>
      ) : (
        <>
          {children}
          {/* Owner floating toggle */}
          {isOwner && active && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setBypassed(!bypassed)}
              className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold hover:bg-amber-500/20 transition-colors shadow-lg"
            >
              <Wrench size={13} />
              {bypassed ? "وضع الصيانة شغال" : "شوف الصيانة"}
            </motion.button>
          )}
        </>
      )}
    </>
  );
}
