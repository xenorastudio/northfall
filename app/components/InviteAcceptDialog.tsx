"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Check, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  community: string;
  onAccept: () => Promise<void>;
  onDecline: () => void;
  requireLogin: boolean;
  onLogin: () => void;
}

export default function InviteAcceptDialog({ community, onAccept, onDecline, requireLogin, onLogin }: Props) {
  const [commMeta, setCommMeta] = useState<{ img?: string; banner?: string; shortDesc?: string; memberCount?: number; creatorName?: string } | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getDoc(doc(db, "communities", community)).catch(() => null);
      if (!s?.exists()) return;
      const data = s.data();
      let creatorName = "";
      if (data.creatorUid) {
        const uSnap = await getDoc(doc(db, "users", data.creatorUid)).catch(() => null);
        creatorName = uSnap?.data()?.displayName || "";
      }
      setCommMeta({ img: data.img, banner: data.banner, shortDesc: data.shortDesc, memberCount: data.memberCount, creatorName });
    })();
  }, [community]);

  const handleAccept = async () => {
    if (requireLogin) { onLogin(); return; }
    setAccepting(true);
    await onAccept();
    setAccepting(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ direction: "rtl" }}>
      {/* Full background */}
      <div className="absolute inset-0 bg-nf-body" />

      {/* Banner */}
      <div className="relative h-[220px] sm:h-[280px] shrink-0">
        {commMeta?.banner
          ? <img src={commMeta.banner} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-nf-body via-nf-body/30 to-transparent" />

        {/* Close button */}
        <button onClick={onDecline}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center px-4 -mt-16 pb-8 overflow-y-auto">
        <div className="w-full max-w-[480px]">

          {/* Avatar */}
          <div className="mb-4">
            {commMeta?.img
              ? <img src={commMeta.img} alt="" className="w-20 h-20 rounded-full border-4 border-nf-body object-cover shadow-xl" />
              : <div className="w-20 h-20 rounded-full border-4 border-nf-body bg-nf-secondary flex items-center justify-center text-[16px] text-nf-accent font-bold shadow-xl">n/</div>
            }
          </div>

          {/* Community name */}
          <h1 className="text-[26px] font-black text-nf-text mb-1">n/{community}</h1>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-[13px] text-nf-dim">
            {commMeta?.memberCount != null && (
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {commMeta.memberCount.toLocaleString()} عضو
              </span>
            )}
            {commMeta?.creatorName && (
              <span className="flex items-center gap-1.5">
                <Shield size={13} />
                أُسس بواسطة u/{commMeta.creatorName}
              </span>
            )}
          </div>

          {/* Description */}
          {commMeta?.shortDesc && (
            <p className="text-[14px] text-nf-muted leading-relaxed mb-6">{commMeta.shortDesc}</p>
          )}

          {/* Invite message */}
          <div className="bg-nf-secondary/40 border border-nf-border-2/40 rounded-xl px-4 py-3.5 mb-6">
            <p className="text-[14px] text-nf-text font-medium">
              تمت دعوتك للانضمام إلى هذا المجتمع
            </p>
            <p className="text-[12px] text-nf-dim mt-1">
              بعد القبول ستظهر منشورات هذا المجتمع في فيدك
            </p>
          </div>

          {/* Actions */}
          {requireLogin ? (
            <div className="space-y-3">
              <p className="text-[13px] text-nf-dim text-center mb-2">سجّل دخولك لقبول الدعوة</p>
              <button onClick={onLogin}
                className="w-full py-3 rounded-xl bg-nf-accent text-white text-[14px] font-bold hover:opacity-90 transition-opacity">
                تسجيل الدخول
              </button>
              <button onClick={onDecline}
                className="w-full py-3 rounded-xl text-[14px] font-medium text-nf-muted hover:bg-nf-hover transition-colors">
                رفض الدعوة
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleAccept} disabled={accepting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-nf-accent text-white text-[14px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                {accepting ? "جاري الانضمام..." : <><Check size={16} /> قبول الدعوة</>}
              </button>
              <button onClick={onDecline}
                className="px-5 py-3 rounded-xl border border-nf-border-2 text-[14px] font-medium text-nf-muted hover:bg-nf-hover transition-colors">
                رفض
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
