"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  community: string;
  onAccept: () => Promise<void>;
  onDecline: () => void;
  requireLogin: boolean;
  onLogin: () => void;
}

export default function InviteAcceptDialog({ community, onAccept, onDecline, requireLogin, onLogin }: Props) {
  const [commMeta, setCommMeta] = useState<{ img?: string; shortDesc?: string; memberCount?: number } | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "communities", community)).then(s => {
      if (s.exists()) setCommMeta({ img: s.data().img, shortDesc: s.data().shortDesc, memberCount: s.data().memberCount });
    }).catch(() => {});
  }, [community]);

  const handleAccept = async () => {
    if (requireLogin) { onLogin(); return; }
    setAccepting(true);
    await onAccept();
    setAccepting(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onDecline} />
      <div className="relative bg-nf-primary border border-nf-border-2/60 rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Community banner placeholder */}
        <div className="h-20 bg-gradient-to-br from-nf-secondary to-nf-body flex items-end px-5 pb-0 relative">
          <div className="absolute inset-0 opacity-30" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }} />
        </div>

        {/* Avatar overlapping banner */}
        <div className="px-5 -mt-6 mb-4 relative">
          {commMeta?.img
            ? <img src={commMeta.img} alt="" className="w-12 h-12 rounded-full border-4 border-nf-primary object-cover" />
            : <div className="w-12 h-12 rounded-full border-4 border-nf-primary bg-nf-secondary flex items-center justify-center text-[11px] text-nf-accent font-bold">n/</div>
          }
        </div>

        <div className="px-5 pb-5">
          <h2 className="text-[18px] font-bold text-nf-text mb-1">دعوة للانضمام</h2>
          <p className="text-[14px] text-nf-muted mb-1">
            تمت دعوتك للانضمام إلى <span className="text-nf-text font-semibold">n/{community}</span>
          </p>
          {commMeta?.shortDesc && (
            <p className="text-[12px] text-nf-dim mb-1">{commMeta.shortDesc}</p>
          )}
          {commMeta?.memberCount != null && (
            <p className="text-[12px] text-nf-dim flex items-center gap-1 mb-4">
              <Users size={11} /> {commMeta.memberCount.toLocaleString()} عضو
            </p>
          )}
          {!commMeta?.shortDesc && !commMeta?.memberCount && <div className="mb-4" />}

          {requireLogin ? (
            <div className="space-y-2">
              <p className="text-[12px] text-nf-dim mb-3">سجّل دخولك لقبول الدعوة</p>
              <button onClick={onLogin}
                className="w-full py-2.5 rounded-xl bg-nf-accent text-white text-[13px] font-bold hover:opacity-90 transition-opacity">
                تسجيل الدخول
              </button>
              <button onClick={onDecline}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium text-nf-muted hover:bg-nf-hover transition-colors">
                رفض
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleAccept} disabled={accepting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-nf-accent text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                {accepting ? "جاري الانضمام..." : <><Check size={15} /> قبول الدعوة</>}
              </button>
              <button onClick={onDecline}
                className="px-4 py-2.5 rounded-xl border border-nf-border-2 text-[13px] font-medium text-nf-muted hover:bg-nf-hover transition-colors">
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
