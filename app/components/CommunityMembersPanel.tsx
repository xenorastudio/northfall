"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import {
  Shield, Crown, UserMinus, Check, ChevronRight,
  Users, UserPlus, Copy, Link2, Search, Star
} from "lucide-react";

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
  const [tab, setTab] = useState<"members" | "staff" | "invite">("members");
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
  const [memberSearch, setMemberSearch] = useState("");

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
  const allMembers = memberSearch.trim()
    ? members.filter(m => m.displayName.toLowerCase().includes(memberSearch.toLowerCase()))
    : members;

  const TABS = [
    { id: "members" as const, label: "الأعضاء", count: members.length },
    { id: "staff" as const, label: "الطاقم", count: staff.length },
    { id: "invite" as const, label: "دعوة", count: null },
  ];

  return (
    <div className="fixed inset-0 z-[1100] flex" style={{ direction: "rtl" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      {/* Full-page panel — slides from right */}
      <div className="relative mr-auto w-full max-w-[900px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        style={{ backgroundColor: "var(--bg-primary)", borderRight: "1px solid var(--border-secondary)" }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-secondary)" }}>
          <button onClick={onClose} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
            <ChevronRight size={16} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center shrink-0">
            <Users size={14} className="text-nf-accent" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-nf-text">إدارة الأعضاء</h2>
            <p className="text-[11px] text-nf-dim">n/{communityName} · {members.length} عضو</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex shrink-0 px-6" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors",
                tab === t.id ? "text-nf-text border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  tab === t.id ? "bg-nf-accent/15 text-nf-accent" : "bg-nf-secondary text-nf-dim")}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex">

          {/* ── Members tab ── */}
          {tab === "members" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="px-6 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                <div className="relative">
                  <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
                  <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                    placeholder="ابحث عن عضو..."
                    className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-9 pl-3 py-2 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-6 space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-nf-secondary/20 animate-pulse" />)}
                  </div>
                ) : allMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <Users size={32} className="text-nf-dim/20 mb-3" />
                    <p className="text-[13px] font-semibold text-nf-muted">لا توجد نتائج</p>
                  </div>
                ) : (
                  <div className="divide-y divide-nf-border-2/20">
                    {allMembers.map(m => {
                      const isMe = m.uid === user?.uid;
                      const isOwnerRole = m.role === "owner";
                      return (
                        <div key={m.uid} className="flex items-center gap-4 px-6 py-3.5 hover:bg-nf-secondary/20 transition-colors">
                          {/* Avatar */}
                          {m.photoURL
                            ? <img src={m.photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-nf-border-2/50" />
                            : <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-[14px] font-bold text-nf-text shrink-0">{m.displayName[0]?.toUpperCase()}</div>
                          }
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-nf-text truncate">{m.displayName}</span>
                              {isMe && <span className="text-[10px] text-nf-dim">(أنت)</span>}
                            </div>
                            {m.joinedAt && (
                              <p className="text-[10px] text-nf-dim mt-0.5">
                                انضم {new Date(m.joinedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short" })}
                              </p>
                            )}
                          </div>
                          {/* Role badge */}
                          <div className="relative shrink-0">
                            <button
                              onClick={() => canManage && !isOwnerRole && !isMe ? setOpenRoleMenu(openRoleMenu === m.uid ? null : m.uid) : undefined}
                              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold",
                                ROLE_COLORS[m.role],
                                canManage && !isOwnerRole && !isMe ? "cursor-pointer hover:opacity-80" : "cursor-default")}>
                              {m.role === "owner" ? <Crown size={10} /> : m.role !== "member" ? <Shield size={10} /> : null}
                              {ROLE_LABELS[m.role]}
                            </button>
                            {openRoleMenu === m.uid && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenRoleMenu(null)} />
                                <div className="absolute left-0 top-full mt-1 bg-nf-primary border border-nf-border-2 rounded-xl overflow-hidden z-20 min-w-[130px] shadow-xl">
                                  {(["admin", "moderator", "member"] as const).map(role => (
                                    <button key={role} onClick={() => changeRole(m.uid, role)}
                                      className={cn("w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-medium transition-colors hover:bg-nf-hover text-right",
                                        m.role === role ? "text-nf-accent" : "text-nf-muted")}>
                                      {ROLE_LABELS[role]}
                                      {m.role === role && <Check size={11} className="text-nf-accent" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          {/* Remove */}
                          {canManage && !isOwnerRole && !isMe && (
                            <button onClick={() => removeMember(m.uid)}
                              className="p-1.5 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0">
                              <UserMinus size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Staff tab ── */}
          {tab === "staff" && (
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-2">
                  {[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-nf-secondary/20 animate-pulse" />)}
                </div>
              ) : staff.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <Shield size={32} className="text-nf-dim/20 mb-3" />
                  <p className="text-[14px] font-bold text-nf-muted mb-1">لا يوجد طاقم بعد</p>
                  <p className="text-[12px] text-nf-dim">ادعُ أعضاء وارفع صلاحياتهم من تاب الأعضاء</p>
                </div>
              ) : (
                <div className="divide-y divide-nf-border-2/20">
                  {staff.map(m => (
                    <div key={m.uid} className="flex items-center gap-4 px-6 py-3.5 hover:bg-nf-secondary/20 transition-colors">
                      {m.photoURL
                        ? <img src={m.photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-nf-border-2/50" />
                        : <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-[14px] font-bold text-nf-text shrink-0">{m.displayName[0]?.toUpperCase()}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-semibold text-nf-text">{m.displayName}</span>
                        {m.uid === user?.uid && <span className="text-[10px] text-nf-dim mr-1.5">(أنت)</span>}
                      </div>
                      <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold", ROLE_COLORS[m.role])}>
                        {m.role === "owner" ? <Crown size={10} /> : <Shield size={10} />}
                        {ROLE_LABELS[m.role]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Invite tab ── */}
          {tab === "invite" && (
            <div className="flex-1 overflow-y-auto">
              {/* Invite link */}
              <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                <p className="text-[12px] font-bold text-nf-text mb-3 flex items-center gap-2">
                  <Link2 size={13} className="text-nf-accent" /> رابط الدعوة
                </p>
                <div className="flex items-center gap-2">
                  <input readOnly value={inviteLink}
                    className="flex-1 bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[11px] text-nf-dim font-mono outline-none truncate" />
                  <button onClick={copyLink}
                    className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all shrink-0",
                      copiedLink ? "text-green-400 border-green-400/30 bg-green-400/5" : "text-nf-muted border-nf-border-2 hover:text-nf-text hover:bg-nf-hover")}>
                    {copiedLink ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ</>}
                  </button>
                </div>
                <p className="text-[10px] text-nf-dim mt-2">الدعوة تُرسل كإشعار — الشخص يقبل أو يرفض</p>
              </div>

              {/* Following list */}
              <div className="px-6 py-4">
                <p className="text-[12px] font-bold text-nf-text mb-3 flex items-center gap-2">
                  <UserPlus size={13} className="text-nf-accent" /> دعوة من المتابَعين
                </p>
                {loadingFriends ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-nf-secondary/20 animate-pulse" />)}
                  </div>
                ) : friends.length === 0 ? (
                  <div className="py-10 text-center rounded-xl bg-nf-secondary/10 border border-nf-border-2/20">
                    <p className="text-[13px] text-nf-muted">لا يوجد متابَعون لدعوتهم</p>
                    <p className="text-[11px] text-nf-dim mt-1">تابع مستخدمين لتظهر هنا</p>
                  </div>
                ) : (
                  <div className="divide-y divide-nf-border-2/20">
                    {friends.map(f => {
                      const sent = invitedUids.has(f.uid);
                      return (
                        <div key={f.uid} className="flex items-center gap-4 py-3 hover:bg-nf-secondary/10 rounded-xl px-2 transition-colors">
                          {f.photoURL
                            ? <img src={f.photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-nf-border-2/50" />
                            : <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-[14px] font-bold text-nf-text shrink-0">{f.displayName[0]?.toUpperCase()}</div>
                          }
                          <p className="flex-1 text-[13px] font-medium text-nf-text truncate">{f.displayName}</p>
                          <button
                            onClick={() => !sent && inviteUser(f)}
                            disabled={sent || invitingUid === f.uid}
                            className={cn("px-4 py-2 rounded-xl text-[12px] font-semibold transition-all shrink-0 border",
                              sent
                                ? "text-nf-dim border-nf-border-2 cursor-default"
                                : "text-nf-accent border-nf-accent/30 hover:bg-nf-accent/10 disabled:opacity-50")}>
                            {sent ? "✓ أُرسلت" : invitingUid === f.uid ? "..." : "دعوة"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
