"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { Shield, Crown, UserMinus, UserPlus, Copy, Check, Link2, X, ChevronDown } from "lucide-react";

interface Member {
  uid: string;
  displayName: string;
  photoURL: string;
  role: "owner" | "admin" | "moderator" | "member";
  joinedAt: string;
}

interface Friend {
  uid: string;
  displayName: string;
  photoURL: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك", admin: "مشرف", moderator: "ناظم", member: "عضو",
};
const ROLE_COLORS: Record<string, string> = {
  owner:     "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  admin:     "text-red-400   bg-red-400/10   border-red-400/30",
  moderator: "text-blue-400  bg-blue-400/10  border-blue-400/30",
  member:    "text-nf-dim    bg-nf-secondary border-nf-border-2",
};
const ROLE_ORDER = { owner: 0, admin: 1, moderator: 2, member: 3 };

export default function CommunityMembersPanel({
  communityName, onClose,
}: { communityName: string; onClose: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"staff" | "invite">("staff");
  const [members, setMembers] = useState<Member[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [myRole, setMyRole] = useState<Member["role"]>("member");
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitingUid, setInvitingUid] = useState<string | null>(null);
  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = btoa(`${communityName}:${Date.now()}:${Math.random().toString(36).slice(2)}`);
    const base = typeof window !== "undefined" ? window.location.origin : "https://northfall.blog";
    setInviteLink(`${base}/app?invite=${token}&c=${encodeURIComponent(communityName)}`);
  }, [communityName]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "communities", communityName, "members"));
        const list: Member[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          let displayName = data.displayName || "";
          let photoURL = data.photoURL || "";
          const role: Member["role"] = data.role || "member";
          if (!displayName) {
            try {
              const uSnap = await getDoc(doc(db, "users", d.id));
              if (uSnap.exists()) {
                displayName = uSnap.data().displayName || d.id.slice(0, 8);
                photoURL = uSnap.data().photoURL || "";
              }
            } catch {}
          }
          list.push({ uid: d.id, displayName: displayName || d.id.slice(0, 8), photoURL, role, joinedAt: data.joinedAt || "" });
        }
        list.sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3));
        setMembers(list);
        const me = list.find(m => m.uid === user?.uid);
        setMyRole(me?.role || "member");
      } catch {}
      setLoading(false);
    })();
  }, [communityName, user?.uid]);

  useEffect(() => {
    if (tab !== "invite" || !user) return;
    (async () => {
      setLoadingFriends(true);
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "following"));
        const list: Friend[] = [];
        for (const d of snap.docs) {
          const uid = d.id;
          if (members.find(m => m.uid === uid)) continue;
          try {
            const uSnap = await getDoc(doc(db, "users", uid));
            if (uSnap.exists()) {
              list.push({ uid, displayName: uSnap.data().displayName || uid.slice(0, 8), photoURL: uSnap.data().photoURL || "" });
            }
          } catch {}
        }
        setFriends(list);
      } catch {}
      setLoadingFriends(false);
    })();
  }, [tab, user, members]);

  const canManage = myRole === "owner" || myRole === "admin";

  // Send invite notification only — don't add to members yet
  const inviteUser = async (f: Friend) => {
    if (!user || invitingUid) return;
    setInvitingUid(f.uid);
    try {
      await addDoc(collection(db, "users", f.uid, "notifications"), {
        type: "invite",
        text: `${user.displayName || "مستخدم"} دعاك للانضمام إلى n/${communityName}`,
        community: communityName,
        communityInvite: true,
        fromUid: user.uid,
        fromName: user.displayName || "مستخدم",
        fromPhoto: user.photoURL || "",
        read: false,
        createdAt: new Date().toISOString(),
      });
      setInvitedUids(prev => new Set([...prev, f.uid]));
    } catch {}
    setInvitingUid(null);
  };

  const changeRole = async (uid: string, newRole: Member["role"]) => {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, "communities", communityName, "members", uid), { role: newRole });
      setMembers(prev =>
        prev.map(m => m.uid === uid ? { ...m, role: newRole } : m)
          .sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3))
      );
    } catch {}
    setOpenRoleMenu(null);
  };

  const removeMember = async (uid: string) => {
    if (!canManage) return;
    if (!confirm("هل تريد إزالة هذا العضو؟")) return;
    try {
      await deleteDoc(doc(db, "communities", communityName, "members", uid));
      await deleteDoc(doc(db, "users", uid, "communities", communityName));
      setMembers(prev => prev.filter(m => m.uid !== uid));
    } catch {}
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const staff = members.filter(m => m.role !== "member");

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4" style={{ direction: "rtl" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-nf-primary border border-nf-border-2 rounded-2xl w-full max-w-[480px] max-h-[82vh] flex flex-col shadow-2xl">

        {/* Header — clean, no icons */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-nf-border-2 shrink-0">
          <div>
            <h2 className="text-[14px] font-bold text-nf-text">إدارة الأعضاء</h2>
            <p className="text-[11px] text-nf-dim mt-0.5">n/{communityName} · {members.length} عضو</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Tabs — text only */}
        <div className="flex border-b border-nf-border-2 shrink-0">
          {(["staff", "invite"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("flex-1 py-2.5 text-[12px] font-semibold transition-colors border-b-2",
                tab === t ? "text-nf-text border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
              {t === "staff" ? "الطاقم" : "دعوة"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Staff */}
          {tab === "staff" && (
            <div className="p-4">
              {loading ? (
                <div className="space-y-2 pt-2">
                  {[1,2].map(i => <div key={i} className="h-12 rounded-xl bg-nf-secondary/20 animate-pulse" />)}
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[13px] font-semibold text-nf-muted">لا يوجد طاقم بعد</p>
                  <p className="text-[11px] text-nf-dim mt-1">ادعُ أعضاء وارفع صلاحياتهم</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {staff.map(m => {
                    const isMe = m.uid === user?.uid;
                    const isOwner = m.role === "owner";
                    return (
                      <div key={m.uid} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-nf-secondary/20 transition-colors">
                        {m.photoURL
                          ? <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          : <div className="w-8 h-8 rounded-full bg-nf-secondary flex items-center justify-center text-[12px] font-bold text-nf-text shrink-0">{m.displayName[0]?.toUpperCase()}</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-nf-text truncate">
                            {m.displayName}{isMe && <span className="text-nf-dim text-[10px] mr-1">(أنت)</span>}
                          </p>
                        </div>
                        <div className="relative shrink-0">
                          <button
                            onClick={() => canManage && !isOwner && !isMe ? setOpenRoleMenu(openRoleMenu === m.uid ? null : m.uid) : undefined}
                            className={cn("flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold",
                              ROLE_COLORS[m.role],
                              canManage && !isOwner && !isMe ? "cursor-pointer" : "cursor-default")}>
                            {m.role === "owner" ? <Crown size={9} /> : <Shield size={9} />}
                            {ROLE_LABELS[m.role]}
                            {canManage && !isOwner && !isMe && <ChevronDown size={8} />}
                          </button>
                          {openRoleMenu === m.uid && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenRoleMenu(null)} />
                              <div className="absolute left-0 top-full mt-1 bg-nf-primary border border-nf-border-2 rounded-xl overflow-hidden z-20 min-w-[120px] shadow-xl">
                                {(["admin", "moderator", "member"] as const).map(role => (
                                  <button key={role} onClick={() => changeRole(m.uid, role)}
                                    className={cn("w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium transition-colors hover:bg-nf-hover text-right",
                                      m.role === role ? "text-nf-accent" : "text-nf-muted")}>
                                    {ROLE_LABELS[role]}
                                    {m.role === role && <Check size={10} className="text-nf-accent" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        {canManage && !isOwner && !isMe && (
                          <button onClick={() => removeMember(m.uid)}
                            className="p-1 rounded text-nf-dim hover:text-red-400 transition-colors shrink-0">
                            <UserMinus size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {members.length > 0 && (
                <p className="text-[10px] text-nf-dim text-center mt-4 pt-3 border-t border-nf-border-2/20">
                  {members.length} عضو في المجتمع
                </p>
              )}
            </div>
          )}

          {/* Invite */}
          {tab === "invite" && (
            <div className="p-4 space-y-4">
              {/* Friends */}
              <div>
                <p className="text-[11px] font-semibold text-nf-dim mb-2.5">المتابَعون</p>
                {loadingFriends ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-11 rounded-xl bg-nf-secondary/20 animate-pulse" />)}
                  </div>
                ) : friends.length === 0 ? (
                  <div className="py-8 text-center rounded-xl bg-nf-secondary/10 border border-nf-border-2/20">
                    <p className="text-[12px] text-nf-muted">لا يوجد متابَعون لدعوتهم</p>
                    <p className="text-[10px] text-nf-dim mt-1">تابع مستخدمين لتظهر هنا</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {friends.map(f => {
                      const sent = invitedUids.has(f.uid);
                      return (
                        <div key={f.uid} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-nf-secondary/20 transition-colors">
                          {f.photoURL
                            ? <img src={f.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            : <div className="w-8 h-8 rounded-full bg-nf-secondary flex items-center justify-center text-[12px] font-bold text-nf-text shrink-0">{f.displayName[0]?.toUpperCase()}</div>
                          }
                          <p className="flex-1 text-[13px] font-medium text-nf-text truncate">{f.displayName}</p>
                          <button
                            onClick={() => !sent && inviteUser(f)}
                            disabled={sent || invitingUid === f.uid}
                            className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 border",
                              sent
                                ? "text-nf-dim border-nf-border-2 cursor-default"
                                : "text-nf-accent border-nf-accent/30 hover:bg-nf-accent/10 disabled:opacity-50")}>
                            {sent ? "أُرسلت" : invitingUid === f.uid ? "..." : "دعوة"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Invite link */}
              <div className="border-t border-nf-border-2/30 pt-4">
                <p className="text-[11px] font-semibold text-nf-dim mb-2">رابط الدعوة</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={inviteLink}
                    className="flex-1 !bg-nf-secondary border border-nf-border-2 rounded-lg px-3 py-2 text-[10px] text-nf-dim font-mono outline-none truncate" />
                  <button onClick={copyLink}
                    className={cn("px-3 py-2 rounded-lg text-[11px] font-semibold border transition-all shrink-0",
                      copiedLink ? "text-green-400 border-green-400/30" : "text-nf-muted border-nf-border-2 hover:text-nf-text")}>
                    {copiedLink ? "تم" : "نسخ"}
                  </button>
                </div>
                <p className="text-[10px] text-nf-dim mt-1.5">الدعوة تُرسل كإشعار — الشخص يقبل أو يرفض</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
