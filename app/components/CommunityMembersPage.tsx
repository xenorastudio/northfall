"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { ChevronRight, Users, Shield, Crown, UserMinus, UserPlus, Search, Check, Copy, Link2, ChevronDown, FileText, Eye, MessageSquare, Settings } from "lucide-react";

interface Member { uid: string; name: string; photo: string; role: "owner"|"admin"|"moderator"|"member"; joinedAt: string; }

const ROLE_ORDER = { owner: 0, admin: 1, moderator: 2, member: 3 };

const PERMISSIONS = {
  admin: [
    { icon: FileText,     label: "إدارة المنشورات",  desc: "حذف وتثبيت وإخفاء المنشورات" },
    { icon: Users,        label: "إدارة الأعضاء",    desc: "إزالة الأعضاء وتغيير صلاحياتهم" },
    { icon: Settings,     label: "إعدادات المجتمع",  desc: "تعديل وصف وقوانين المجتمع" },
    { icon: MessageSquare,label: "إدارة التعليقات",  desc: "حذف التعليقات المخالفة" },
    { icon: Eye,          label: "مراجعة البلاغات",  desc: "مراجعة والرد على بلاغات الأعضاء" },
  ],
  moderator: [
    { icon: FileText,     label: "إدارة المنشورات",  desc: "حذف وتثبيت وإخفاء المنشورات" },
    { icon: MessageSquare,label: "إدارة التعليقات",  desc: "حذف التعليقات المخالفة" },
    { icon: Eye,          label: "مراجعة البلاغات",  desc: "مراجعة والرد على بلاغات الأعضاء" },
  ],
  member: [] as { icon: typeof FileText; label: string; desc: string }[],
};

const ROLE_META = {
  owner:     { label: "مالك", color: "text-amber-500",  dot: "bg-amber-500",  icon: Crown   },
  admin:     { label: "مشرف", color: "text-red-400",    dot: "bg-red-400",    icon: Shield  },
  moderator: { label: "ناظم", color: "text-blue-400",   dot: "bg-blue-400",   icon: Shield  },
  member:    { label: "عضو",  color: "text-nf-dim",     dot: "bg-nf-dim/40",  icon: Users   },
};

export default function CommunityMembersPage({ communityName, onBack }: { communityName: string; onBack: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"members"|"invite">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myRole, setMyRole] = useState<Member["role"]>("member");
  const [isCreator, setIsCreator] = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [savingUid, setSavingUid] = useState<string|null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState<Member[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set());
  const [invitingUid, setInvitingUid] = useState<string|null>(null);

  useEffect(() => {
    const token = btoa(`${communityName}:${Date.now()}`);
    const base = typeof window !== "undefined" ? window.location.origin : "https://northfall.blog";
    setInviteLink(`${base}/app?invite=${token}&c=${encodeURIComponent(communityName)}`);
  }, [communityName]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const commSnap = await getDoc(doc(db, "communities", communityName)).catch(() => null);
        const creatorUid = commSnap?.data()?.creatorUid || "";
        const iAmCreator = !!user && user.uid === creatorUid;
        setIsCreator(iAmCreator);
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
          const role: Member["role"] = d.id === creatorUid ? "owner" : (data.role || "member");
          list.push({ uid: d.id, name: name || d.id.slice(0, 8), photo, role, joinedAt: data.joinedAt || "" });
        }
        if (iAmCreator && !list.find(m => m.uid === user!.uid)) {
          const uSnap = await getDoc(doc(db, "users", user!.uid)).catch(() => null);
          list.push({ uid: user!.uid, name: uSnap?.data()?.displayName || user!.displayName || "أنت", photo: uSnap?.data()?.photoURL || user!.photoURL || "", role: "owner", joinedAt: new Date().toISOString() });
        }
        list.sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3));
        setMembers(list);
        setMyRole(iAmCreator ? "owner" : (list.find(m => m.uid === user?.uid)?.role || "member"));
      } catch (e) { console.error(e); }
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
          if (uSnap?.exists()) list.push({ uid: d.id, name: uSnap.data().displayName || d.id.slice(0, 8), photo: uSnap.data().photoURL || "", role: "member", joinedAt: "" });
        }
        setFollowing(list);
      } catch {}
      setLoadingFollowing(false);
    })();
  }, [tab, user, members]);

  const canManage = isCreator || myRole === "owner" || myRole === "admin";

  const changeRole = async (uid: string, newRole: "admin"|"moderator"|"member") => {
    if (!canManage) return;
    setSavingUid(uid);
    // Optimistic update — keep expanded open
    setMembers(prev =>
      prev.map(m => m.uid === uid ? { ...m, role: newRole } : m)
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3))
    );
    // Keep the panel expanded after role change
    setExpanded(uid);
    try {
      await setDoc(
        doc(db, "communities", communityName, "members", uid),
        { role: newRole },
        { merge: true }
      );
    } catch (e) {
      console.error("changeRole failed:", e);
      // Revert on error — reload members
      window.location.reload();
    }
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
    <div className="w-full max-w-[720px]" style={{ direction: "rtl" }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text transition-colors">
          <ChevronRight size={18} />
        </button>
        <div>
          <h1 className="text-[22px] font-bold text-nf-text">إدارة الأعضاء</h1>
          <p className="text-[13px] text-nf-dim mt-0.5">n/{communityName} · {members.length} عضو</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-nf-border-2/30 mb-6">
        {[
          { id: "members" as const, label: "الأعضاء", count: members.length },
          { id: "invite"  as const, label: "دعوة",    count: null },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-5 py-3 text-[14px] font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "text-nf-text border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>
            {t.label}
            {t.count !== null && (
              <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full font-medium",
                tab === t.id ? "bg-nf-accent/15 text-nf-accent" : "bg-nf-secondary text-nf-dim")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Members tab ── */}
      {tab === "members" && (
        <div>
          {/* Search */}
          <div className="relative mb-5">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن عضو..."
              className="w-full bg-nf-secondary/50 border border-nf-border-2/50 rounded-xl pr-10 pl-4 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 focus:bg-nf-secondary transition-all" />
          </div>

          {loading ? (
            <div className="space-y-px">
              {[1,2,3].map(i => <div key={i} className="h-[60px] bg-nf-secondary/20 animate-pulse" style={{ animationDelay: `${i*80}ms` }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-nf-dim">
              <Users size={24} className="mx-auto mb-3 opacity-20" />
              <p className="text-[14px]">لا توجد نتائج</p>
            </div>
          ) : (
            <div>
              {filtered.map((m, idx) => {
                const isMe = m.uid === user?.uid;
                const isOwner = m.role === "owner";
                const isOpen = expanded === m.uid;
                const meta = ROLE_META[m.role];
                const perms = PERMISSIONS[m.role as keyof typeof PERMISSIONS] || [];
                // canExpand: owner can manage anyone except themselves, admin can manage members/moderators
                const canExpand = canManage && !isOwner && !isMe;

                return (
                  <div key={m.uid}>
                    {/* Divider */}
                    {idx > 0 && <div className="h-px bg-nf-border-2/20 mx-1" />}

                    {/* Member row */}
                    <div
                      className={cn("flex items-center gap-3.5 px-2 py-3.5 rounded-lg transition-colors",
                        canExpand ? "cursor-pointer hover:bg-nf-secondary/30" : "",
                        isOpen && "bg-nf-secondary/20")}
                      onClick={() => canExpand && setExpanded(isOpen ? null : m.uid)}
                    >
                      {/* Avatar */}
                      {m.photo
                        ? <img src={m.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        : <div className="w-9 h-9 rounded-full bg-nf-secondary flex items-center justify-center text-[13px] font-semibold text-nf-muted shrink-0">{m.name[0]?.toUpperCase()}</div>
                      }

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-nf-text truncate">{m.name}</span>
                          {isMe && <span className="text-[11px] text-nf-dim">(أنت)</span>}
                        </div>
                        {m.joinedAt && (
                          <p className="text-[11px] text-nf-dim mt-0.5">
                            انضم {new Date(m.joinedAt).toLocaleDateString("ar-SA", { month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>

                      {/* Role */}
                      <div className={cn("flex items-center gap-1.5 text-[12px] font-medium shrink-0", meta.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", meta.dot)} />
                        {meta.label}
                      </div>

                      {/* Arrow */}
                      {canExpand && (
                        <ChevronDown size={14} className={cn("text-nf-dim/50 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                      )}
                    </div>

                    {/* ── Expanded panel ── */}
                    {isOpen && canExpand && (
                      <div className="mx-2 mb-3 rounded-xl bg-nf-secondary/20 border border-nf-border-2/30 overflow-hidden">

                        {/* Role selector */}
                        <div className="px-4 pt-4 pb-3">
                          <p className="text-[11px] font-semibold text-nf-dim uppercase tracking-wider mb-3">الصلاحية</p>
                          <div className="flex gap-2">
                            {(["admin", "moderator", "member"] as const).map(role => {
                              const rm = ROLE_META[role];
                              const isCurrent = m.role === role;
                              return (
                                <button key={role}
                                  onClick={(e) => { e.stopPropagation(); changeRole(m.uid, role); }}
                                  disabled={savingUid === m.uid || isCurrent}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-medium transition-all border",
                                    isCurrent
                                      ? `${rm.color} bg-nf-secondary border-nf-border-2 cursor-default`
                                      : "text-nf-dim border-nf-border-2/50 hover:bg-nf-secondary hover:text-nf-muted hover:border-nf-border-2"
                                  )}>
                                  {isCurrent && <Check size={12} />}
                                  {savingUid === m.uid && !isCurrent ? "..." : rm.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Permissions */}
                        {perms.length > 0 && (
                          <div className="border-t border-nf-border-2/20 px-4 py-3">
                            <p className="text-[11px] font-semibold text-nf-dim uppercase tracking-wider mb-2.5">
                              ما يستطيع {meta.label} فعله
                            </p>
                            <div className="space-y-2">
                              {perms.map((p, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                  <Check size={12} className="text-nf-accent/60 shrink-0" />
                                  <span className="text-[12px] text-nf-muted">{p.label}</span>
                                  <span className="text-[11px] text-nf-dim/60 truncate">— {p.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {m.role === "member" && (
                          <div className="border-t border-nf-border-2/20 px-4 py-3">
                            <p className="text-[12px] text-nf-dim">لا توجد صلاحيات إضافية</p>
                          </div>
                        )}

                        {/* Remove */}
                        <div className="border-t border-nf-border-2/20 px-4 py-3">
                          <button onClick={() => removeMember(m.uid)}
                            className="flex items-center gap-2 text-[12px] text-red-400/80 hover:text-red-400 transition-colors">
                            <UserMinus size={13} />
                            إزالة من المجتمع
                          </button>
                        </div>
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
        <div className="space-y-6">

          {/* Invite link */}
          <div>
            <p className="text-[13px] font-semibold text-nf-text mb-2">رابط الدعوة</p>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink}
                className="flex-1 bg-nf-secondary/50 border border-nf-border-2/50 rounded-xl px-3.5 py-2.5 text-[11px] text-nf-dim font-mono outline-none truncate" />
              <button onClick={copyLink}
                className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium border transition-all shrink-0",
                  copied ? "text-green-400 border-green-400/30" : "text-nf-muted border-nf-border-2/50 hover:text-nf-text hover:border-nf-border-2")}>
                {copied ? <><Check size={12} /> تم</> : <><Copy size={12} /> نسخ</>}
              </button>
            </div>
            <p className="text-[11px] text-nf-dim mt-1.5">الدعوة تُرسل كإشعار — الشخص يقبل أو يرفض</p>
          </div>

          {/* Following */}
          <div>
            <p className="text-[13px] font-semibold text-nf-text mb-3">ادعُ من تتابعهم</p>
            {loadingFollowing ? (
              <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-14 bg-nf-secondary/20 animate-pulse rounded-lg" />)}</div>
            ) : following.length === 0 ? (
              <p className="text-[13px] text-nf-dim py-6 text-center">لا يوجد متابَعون لدعوتهم</p>
            ) : (
              <div>
                {following.map((f, idx) => {
                  const sent = invitedUids.has(f.uid);
                  return (
                    <div key={f.uid}>
                      {idx > 0 && <div className="h-px bg-nf-border-2/20 mx-1" />}
                      <div className="flex items-center gap-3.5 px-2 py-3">
                        {f.photo ? <img src={f.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          : <div className="w-9 h-9 rounded-full bg-nf-secondary flex items-center justify-center text-[13px] font-semibold text-nf-muted shrink-0">{f.name[0]?.toUpperCase()}</div>}
                        <p className="flex-1 text-[14px] font-medium text-nf-text truncate">{f.name}</p>
                        <button onClick={() => !sent && inviteUser(f)} disabled={sent || invitingUid === f.uid}
                          className={cn("px-4 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 border",
                            sent ? "text-nf-dim border-nf-border-2/40 cursor-default"
                                 : "text-nf-accent border-nf-accent/30 hover:bg-nf-accent/10 disabled:opacity-50")}>
                          {sent ? "✓ أُرسلت" : invitingUid === f.uid ? "..." : "دعوة"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
