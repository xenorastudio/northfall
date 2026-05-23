"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import {
  ChevronRight, Users, Shield, Crown, UserMinus, UserPlus,
  Search, Check, Copy, Link2, ChevronDown, FileText, Trash2,
  Eye, MessageSquare, Settings
} from "lucide-react";

interface Member {
  uid: string;
  name: string;
  photo: string;
  role: "owner" | "admin" | "moderator" | "member";
  joinedAt: string;
}

const ROLE_ORDER = { owner: 0, admin: 1, moderator: 2, member: 3 };

const PERMISSIONS = {
  admin: [
    { icon: FileText, label: "إدارة المنشورات", desc: "حذف وتثبيت وإخفاء المنشورات" },
    { icon: Users, label: "إدارة الأعضاء", desc: "إزالة الأعضاء وتغيير صلاحياتهم" },
    { icon: Settings, label: "إعدادات المجتمع", desc: "تعديل وصف وقوانين المجتمع" },
    { icon: MessageSquare, label: "إدارة التعليقات", desc: "حذف التعليقات المخالفة" },
    { icon: Eye, label: "مراجعة البلاغات", desc: "مراجعة والرد على بلاغات الأعضاء" },
  ],
  moderator: [
    { icon: FileText, label: "إدارة المنشورات", desc: "حذف وتثبيت وإخفاء المنشورات" },
    { icon: MessageSquare, label: "إدارة التعليقات", desc: "حذف التعليقات المخالفة" },
    { icon: Eye, label: "مراجعة البلاغات", desc: "مراجعة والرد على بلاغات الأعضاء" },
  ],
  member: [],
};

const ROLE_META = {
  owner:     { label: "مالك",   color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: Crown },
  admin:     { label: "مشرف",   color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    icon: Shield },
  moderator: { label: "ناظم",   color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   icon: Shield },
  member:    { label: "عضو",    color: "text-nf-dim",     bg: "bg-nf-secondary",  border: "border-nf-border-2",   icon: Users },
};

export default function CommunityMembersPage({ communityName, onBack }: { communityName: string; onBack: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"members" | "invite">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myRole, setMyRole] = useState<Member["role"]>("member");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState<Member[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set());
  const [invitingUid, setInvitingUid] = useState<string | null>(null);

  useEffect(() => {
    const token = btoa(`${communityName}:${Date.now()}`);
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
          let name = data.displayName || "";
          let photo = data.photoURL || "";
          if (!name) {
            const uSnap = await getDoc(doc(db, "users", d.id)).catch(() => null);
            if (uSnap?.exists()) { name = uSnap.data().displayName || ""; photo = uSnap.data().photoURL || ""; }
          }
          list.push({ uid: d.id, name: name || d.id.slice(0, 8), photo, role: data.role || "member", joinedAt: data.joinedAt || "" });
        }
        list.sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3));
        setMembers(list);
        setMyRole(list.find(m => m.uid === user?.uid)?.role || "member");
      } catch {}
      setLoading(false);
    })();
  }, [communityName, user?.uid]);

  useEffect(() => {
    if (tab !== "invite" || !user) return;
    (async () => {
      setLoadingFollowing(true);
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "following"));
        const list: Member[] = [];
        for (const d of snap.docs) {
          if (members.find(m => m.uid === d.id)) continue;
          const uSnap = await getDoc(doc(db, "users", d.id)).catch(() => null);
          if (uSnap?.exists()) {
            list.push({ uid: d.id, name: uSnap.data().displayName || d.id.slice(0, 8), photo: uSnap.data().photoURL || "", role: "member", joinedAt: "" });
          }
        }
        setFollowing(list);
      } catch {}
      setLoadingFollowing(false);
    })();
  }, [tab, user, members]);

  const canManage = myRole === "owner" || myRole === "admin";

  const changeRole = async (uid: string, newRole: "admin" | "moderator" | "member") => {
    if (!canManage) return;
    setSavingUid(uid);
    try {
      await updateDoc(doc(db, "communities", communityName, "members", uid), { role: newRole });
      setMembers(prev =>
        prev.map(m => m.uid === uid ? { ...m, role: newRole } : m)
          .sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3))
      );
    } catch {}
    setSavingUid(null);
  };

  const removeMember = async (uid: string) => {
    if (!canManage || !confirm("إزالة هذا العضو من المجتمع؟")) return;
    try {
      await deleteDoc(doc(db, "communities", communityName, "members", uid));
      await deleteDoc(doc(db, "users", uid, "communities", communityName));
      setMembers(prev => prev.filter(m => m.uid !== uid));
      setExpanded(null);
    } catch {}
  };

  const inviteUser = async (f: Member) => {
    if (!user || invitingUid) return;
    setInvitingUid(f.uid);
    try {
      await addDoc(collection(db, "users", f.uid, "notifications"), {
        type: "invite", text: `${user.displayName || "مستخدم"} دعاك للانضمام إلى n/${communityName}`,
        community: communityName, communityInvite: true, fromUid: user.uid,
        fromName: user.displayName || "مستخدم", fromPhoto: user.photoURL || "",
        read: false, createdAt: new Date().toISOString(),
      });
      setInvitedUids(prev => new Set([...prev, f.uid]));
    } catch {}
    setInvitingUid(null);
  };

  const copyLink = () => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const filtered = search.trim() ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase())) : members;

  return (
    <div className="w-full max-w-[860px]" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
          <ChevronRight size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-nf-accent/10 border border-nf-accent/20 flex items-center justify-center shrink-0">
          <Users size={16} className="text-nf-accent" />
        </div>
        <div>
          <h1 className="text-[20px] font-black text-nf-text">إدارة الأعضاء</h1>
          <p className="text-[12px] text-nf-dim">n/{communityName} · {members.length} عضو</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-nf-border-2/40">
        {[
          { id: "members" as const, label: "الأعضاء", count: members.length },
          { id: "invite" as const, label: "دعوة", count: null },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
              tab === t.id ? "text-nf-text border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
            {t.label}
            {t.count !== null && <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", tab === t.id ? "bg-nf-accent/15 text-nf-accent" : "bg-nf-secondary text-nf-dim")}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Members tab ── */}
      {tab === "members" && (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن عضو..."
              className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-9 pl-3 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-nf-secondary/20 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16"><Users size={28} className="text-nf-dim/20 mx-auto mb-2" /><p className="text-[13px] text-nf-muted">لا توجد نتائج</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(m => {
                const isMe = m.uid === user?.uid;
                const isOwner = m.role === "owner";
                const isOpen = expanded === m.uid;
                const meta = ROLE_META[m.role];
                const RoleIcon = meta.icon;
                const perms = PERMISSIONS[m.role as keyof typeof PERMISSIONS] || [];

                return (
                  <div key={m.uid} className={cn("rounded-xl border transition-all duration-200 overflow-hidden",
                    isOpen ? "border-nf-accent/30 bg-nf-secondary/20" : "border-nf-border-2/40 hover:border-nf-border-2")}>

                    {/* Member row — clickable to expand */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : m.uid)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 text-right"
                    >
                      {/* Avatar */}
                      {m.photo
                        ? <img src={m.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-nf-border-2/50" />
                        : <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-[14px] font-bold text-nf-text shrink-0">{m.name[0]?.toUpperCase()}</div>
                      }

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {isMe && <span className="text-[10px] text-nf-dim">(أنت)</span>}
                          <span className="text-[14px] font-semibold text-nf-text truncate">{m.name}</span>
                        </div>
                        {m.joinedAt && (
                          <p className="text-[11px] text-nf-dim mt-0.5">
                            انضم {new Date(m.joinedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })}
                          </p>
                        )}
                      </div>

                      {/* Role badge */}
                      <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shrink-0", meta.color, meta.bg, meta.border)}>
                        <RoleIcon size={11} />
                        {meta.label}
                      </span>

                      {/* Chevron */}
                      {canManage && !isOwner && !isMe && (
                        <ChevronDown size={15} className={cn("text-nf-dim shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                      )}
                    </button>

                    {/* ── Expanded panel ── */}
                    {isOpen && canManage && !isOwner && !isMe && (
                      <div className="px-4 pb-4 border-t border-nf-border-2/30">

                        {/* Role selector */}
                        <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mt-3 mb-2.5">الصلاحية</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {(["admin", "moderator", "member"] as const).map(role => {
                            const rm = ROLE_META[role];
                            const RIcon = rm.icon;
                            const isSelected = m.role === role;
                            return (
                              <button key={role} onClick={() => changeRole(m.uid, role)} disabled={savingUid === m.uid}
                                className={cn("flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all",
                                  isSelected ? `${rm.bg} ${rm.border} ${rm.color}` : "border-nf-border-2/40 text-nf-muted hover:border-nf-border-2 hover:bg-nf-secondary/40")}>
                                <RIcon size={16} />
                                <span className="text-[12px] font-bold">{rm.label}</span>
                                {isSelected && <Check size={11} className="opacity-70" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Permissions list for current role */}
                        {perms.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-2">
                              صلاحيات {ROLE_META[m.role].label}
                            </p>
                            <div className="space-y-1.5">
                              {perms.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-nf-secondary/30">
                                  <p.icon size={13} className="text-nf-accent shrink-0" />
                                  <div>
                                    <p className="text-[12px] font-semibold text-nf-text">{p.label}</p>
                                    <p className="text-[10px] text-nf-dim">{p.desc}</p>
                                  </div>
                                  <Check size={12} className="text-green-400 mr-auto shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Remove button */}
                        <button onClick={() => removeMember(m.uid)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-red-400 hover:bg-red-400/10 transition-colors border border-red-400/20 hover:border-red-400/40">
                          <UserMinus size={14} />
                          إزالة من المجتمع
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Invite tab ── */}
      {tab === "invite" && (
        <div className="space-y-5">
          {/* Invite link */}
          <div className="rounded-xl border border-nf-border-2/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-nf-border-2/30 flex items-center gap-2">
              <Link2 size={13} className="text-nf-accent" />
              <p className="text-[13px] font-bold text-nf-text">رابط الدعوة</p>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="flex-1 bg-nf-secondary border border-nf-border-2 rounded-xl px-3 py-2.5 text-[11px] text-nf-dim font-mono outline-none truncate" />
                <button onClick={copyLink} className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all shrink-0",
                  copied ? "text-green-400 border-green-400/30 bg-green-400/5" : "text-nf-muted border-nf-border-2 hover:text-nf-text hover:bg-nf-hover")}>
                  {copied ? <><Check size={13} /> تم</> : <><Copy size={13} /> نسخ</>}
                </button>
              </div>
              <p className="text-[11px] text-nf-dim mt-2">الدعوة تُرسل كإشعار — الشخص يقبل أو يرفض</p>
            </div>
          </div>

          {/* Following */}
          <div className="rounded-xl border border-nf-border-2/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-nf-border-2/30 flex items-center gap-2">
              <UserPlus size={13} className="text-nf-accent" />
              <p className="text-[13px] font-bold text-nf-text">دعوة من المتابَعين</p>
            </div>
            <div className="px-5 py-4">
              {loadingFollowing ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-nf-secondary/20 animate-pulse" />)}</div>
              ) : following.length === 0 ? (
                <div className="py-8 text-center"><p className="text-[13px] text-nf-muted">لا يوجد متابَعون لدعوتهم</p></div>
              ) : (
                <div className="space-y-1.5">
                  {following.map(f => {
                    const sent = invitedUids.has(f.uid);
                    return (
                      <div key={f.uid} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-nf-secondary/20 transition-colors">
                        {f.photo ? <img src={f.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          : <div className="w-9 h-9 rounded-full bg-nf-secondary flex items-center justify-center text-[13px] font-bold text-nf-text shrink-0">{f.name[0]?.toUpperCase()}</div>}
                        <p className="flex-1 text-[13px] font-medium text-nf-text truncate">{f.name}</p>
                        <button onClick={() => !sent && inviteUser(f)} disabled={sent || invitingUid === f.uid}
                          className={cn("px-4 py-2 rounded-xl text-[12px] font-semibold transition-all shrink-0 border",
                            sent ? "text-nf-dim border-nf-border-2 cursor-default" : "text-nf-accent border-nf-accent/30 hover:bg-nf-accent/10 disabled:opacity-50")}>
                          {sent ? "✓ أُرسلت" : invitingUid === f.uid ? "..." : "دعوة"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
