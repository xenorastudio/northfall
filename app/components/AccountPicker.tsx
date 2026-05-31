"use client";

import { useRef } from "react";
import { useAuth } from "./AuthProvider";
import {
  getLinkedAccounts,
  getAccountCache,
  getLastActiveUid,
} from "@/lib/account-switcher";

export default function AccountPicker({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const { user, switchAccount, switchingUid } = useAuth();
  const accounts = getLinkedAccounts();
  const cache = getAccountCache();
  const lastActiveUid = getLastActiveUid();
  const activeUid = lastActiveUid || accounts[0]?.uid || null;
  const dismissed = useRef(false);
  const targetAcc = switchingUid && switchingUid !== "__adding__"
    ? accounts.find((a) => a.uid === switchingUid)
    : null;

  const handleSelect = (uid: string) => {
    if (dismissed.current) return;
    dismissed.current = true;
    if (uid === user?.uid) { onDismiss(); return; }
    switchAccount(uid);
  };

  const handleEnter = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none"
      style={{
        backgroundColor: "var(--bg-body)",
        fontFamily: "var(--font-noto-kufi)",
        animation: "af 0.4s ease-out",
      }}
    >
      <style>{`@keyframes af{from{opacity:0;transform:scale(1.02)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Decorative gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 60%)",
        }}
      />

      {targetAcc ? (
        /* ─── Full-screen loading state ─── */
        <div className="relative flex flex-col items-center gap-6" style={{ animation: "af 0.35s ease-out" }}>
          {/* Skeleton shimmer card */}
          <div className="flex flex-col items-center gap-3 w-[120px]">
            <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-full" style={{ backgroundColor: "var(--bg-secondary)", animation: "sh 1.2s ease-in-out infinite" }} />
            <div className="h-3 w-20 rounded-full" style={{ backgroundColor: "var(--bg-secondary)", animation: "sh 1.2s ease-in-out 0.1s infinite" }} />
            <div className="h-2 w-14 rounded-full" style={{ backgroundColor: "var(--bg-secondary)", animation: "sh 1.2s ease-in-out 0.2s infinite" }} />
          </div>
          <style>{`@keyframes sh{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>

          <p className="text-[13px] md:text-[14px] font-semibold" style={{ color: "var(--text-secondary)" }}>
            جاري التحميل
          </p>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)", animation: "ld 0.8s ease-in-out infinite" }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)", animation: "ld 0.8s ease-in-out 0.15s infinite" }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)", animation: "ld 0.8s ease-in-out 0.3s infinite" }} />
          </div>
          <style>{`@keyframes ld{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
        </div>
      ) : (
        <>
          {/* Welcome text */}
          <div className="relative mb-10 md:mb-14 text-center px-6">
            <p className="text-[28px] md:text-[34px] font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
              أهلاً بك مجدداً
            </p>
            <p className="text-[12px] leading-relaxed mt-3 max-w-[400px] mx-auto" style={{ color: "var(--text-dim)" }}>
              يسرنا رؤيتك من جديد. اختر الحساب الذي تريد استخدامه للمتابعة، أو يمكنك الدخول مباشرة بالحساب الحالي. يمكنك دائماً التبديل بين حساباتك من القائمة الجانبية.
            </p>
          </div>

          {/* Account avatars — flat, always in one row */}
          <div className="flex items-start justify-center gap-5 md:gap-8 px-6 mx-auto" style={{ maxWidth: 640 }}>
            {accounts.map((acc, i) => {
              const isActive = acc.uid === activeUid;
              const accCache = cache[acc.uid];

              return (
                <button
                  key={acc.uid}
                  onClick={() => handleSelect(acc.uid)}
                  disabled={dismissed.current}
                  className="flex flex-col items-center gap-3 transition-all duration-200 w-[100px] md:w-[120px] disabled:opacity-30"
                  style={{ animation: `af 0.4s ease-out ${i * 0.06}s both` }}
                >
                  <div className="relative w-16 h-16 md:w-[72px] md:h-[72px]">
                    <div
                      className="w-full h-full rounded-full overflow-hidden transition-all duration-300 will-change-transform hover:scale-105 hover:brightness-110"
                      style={{
                        border: isActive
                          ? "2px solid var(--accent)"
                          : "2px solid transparent",
                        transition: "border-color 0.25s, transform 0.3s, filter 0.3s",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      {acc.photoURL ? (
                        <img
                          src={acc.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-secondary)" }}>
                          {(acc.displayName || "U")[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[12px] font-semibold text-center truncate w-full" style={{ color: "var(--text-secondary)" }}>
                    {acc.displayName || "مستخدم"}
                  </p>

                  <div className="flex items-center gap-2.5 text-[9px]" style={{ color: "var(--text-dim)" }}>
                    <span>{accCache?.karma ?? 0} صيت</span>
                    <span style={{ color: "var(--accent)" }}>{accCache?.xp ?? 0} XP</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Enter button */}
          <div className="mt-12 md:mt-16 text-center" style={{ animation: "af 0.4s ease-out 0.3s both" }}>
            <button
              onClick={handleEnter}
              disabled={dismissed.current}
              className="px-6 py-2.5 rounded-xl text-[12px] transition-all duration-200 disabled:opacity-30"
              style={{
                color: "var(--text-dim)",
                border: "1px solid var(--border-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.color = "var(--text-dim)";
              }}
            >
              دخول كـ {accounts.find((a) => a.uid === user?.uid)?.displayName || "المستخدم الحالي"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
