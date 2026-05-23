"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { ChevronRight, Users, Shield, Crown, UserMinus, UserPlus, Search, Check, Copy, Link2, ChevronDown } from "lucide-react";

interface Member {
  uid: string;
  name: string;
  photo: string;
  role: "owner" | "admin" | "moderator" | "member";
  joinedAt: string;
}

const ROLES = [
  { id: "admin" as const, label: "مشرف", desc: "يمكنه إدارة المنشورات والأعضاء", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  { id: "moderator" as const, label: "ناظم", desc: "يمكنه إدارة المنشورات فقط", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { id: "member" as const, label: "عضو", desc: "عضو عادي بدون صلاحيات إضافية", color: "text-nf-dim bg-nf-secondary border-nf-border-2" },
];

const ROLE_ORDER = { owner: 0, admin: 1, moderator: 2, member: 3 };

export default function CommunityMembersPage({ communityName, onBack }: { communityName: string; onBack: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"members" | "invite">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myRole, setMyRole] = useState<Member["role"]>("member");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
    try {
      await updateDoc(doc(db, "communities", communityName, "members", uid), { role: newRole });
      setMembers(prev => prev.map(m => m.uid === uid ? { ...m, role: newRole } : m).sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3)));
    } catch {}
    setOpenMenu(null);
  };

  const removeMember = async (uid: string) => {
    if (!canManage || !confirm("إزالة هذا العضو؟")) return;
    try {
      await deleteDoc(doc(db, "communities", communityName, "members", uid));
      await deleteDoc(doc(db, "users", uid, "communities", communityName));
      setMembers(prev => prev.filter(m => m.uid !== uid));
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
  const staff = members.filter(m => m.role !== "member");

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
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

      {/* Members tab */}
      {tab === "members" && (
        <div className="flex gap-6 items-start">
          {/* List */}
          <div className="flex-1 min-w-0">
            <div className="relative mb-4">
              <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن عضو..."
                className="w-full bg-nf-secondary border border-nf-border-2 rounded-xl pr-9 pl-3 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-nf-secondary/20 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16"><Users size={28} className="text-nf-dim/20 mx-auto mb-2" /><p className="text-[13px] text-nf-muted">لا توجد نتائج</p></div>
            ) : (
              <div className="space-y-1">
                {filtered.map(m => {
                  const isMe = m.uid === user?.uid;
                  const isOwner = m.role === "owner";
                  const roleInfo = ROLES.find(r => r.id === m.role);
                  return (
                    <div key={m.uid} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-nf-border-2/30 hover:bg-nf-secondary/20 transition-colors">
                      {m.photo ? <img src={m.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-nf-border-2/50" />
                        : <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-[14px] font-bold text-nf-text shrink-0">{m.name[0]?.toUpperCase()}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-nf-text truncate">{m.name}</span>
                          {isMe && <span className="text-[10px] text-nf-dim">(أنت)</span>}
                        </div>
                        {m.joinedAt && <p className="text-[10px] text-nf-dim mt-0.5">انضم {new Date(m.joinedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short" })}</p>}
                      </div>
                      {/* Role badge + dropdown */}
                      <div className="relative shrink-0">
                        <button onClick={() => canManage && !isOwner && !isMe ? setOpenMenu(openMenu === m.uid ? null : m.uid) : undefined}
                          className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                            isOwner ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" : (roleInfo?.color || "text-nf-dim bg-nf-secondary border-nf-border-2"),
                            canManage && !isOwner && !isMe ? "cursor-pointer hover:opacity-80" : "cursor-default")}>
                          {isOwner ? <Crown size={11} /> : m.role !== "member" ? <Shield size={11} /> : null}
                          {isOwner ? "مالك" : roleInfo?.label || "عضو"}
                          {canManage && !isOwner && !isMe && <ChevronDown size={10} />}
                        </button>
                        {openMenu === m.uid && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute left-0 top-full mt-1 bg-nf-primary border border-nf-border-2 rounded-xl overflow-hidden z-20 w-[220px] shadow-xl">
                              <div className="px-3 py-2 border-b border-nf-border-2/30">
                                <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">تغيير الصلاحية</p>
                              </div>
                              {ROLES.map(role => (
                                <button key={role.id} onClick={() => changeRole(m.uid, role.id)}
                                  className={cn("w-full flex items-start gap-3 px-3 py-2.5 text-right transition-colors hover:bg-nf-hover",
                                    m.role === role.id ? "bg-nf-hover" : "")}>
                                  <div className="flex-1 min-w-0">
                                    <div className={cn("text-[12px] font-semibold", m.role === role.id ? "text-nf-accent" : "text-nf-text")}>{role.label}</div>
                                    <div className="text-[10px] text-nf-dim mt-0.5">{role.desc}</div>
                                  </div>
                                  {m.role === role.id && <Check size={13} className="text-nf-accent shrink-0 mt-0.5" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {canManage && !isOwner && !isMe && (
                        <button onClick={() => removeMember(m.uid)} className="p-1.5 rounded-lg text-nf-dim hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0">
                          <UserMinus size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Staff sidebar */}
          <div className="w-[260px] shrink-0 sticky top-[calc(var(--nav-total-height)+16px)]">
            <div className="rounded-xl border border-nf-border-2/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-nf-border-2/30 flex items-center gap-2">
                <Shield size={13} className="text-nf-accent" />
                <p className="text-[12px] font-bold text-nf-text">الطاقم ({staff.length})</p>
              </div>
              {staff.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-[12px] text-nf-dim">لا يوجد طاقم بعد</p>
                  <p className="text-[10px] text-nf-dim/60 mt-1">ارفع صلاحيات أعضاء من القائمة</p>
                </div>
              ) : (
                <div className="divide-y divide-nf-border-2/20">
                  {staff.map(m => (
                    <div key={m.uid} className="flex items-center gap-2.5 px-4 py-2.5">
                      {m.photo ? <img src={m.photo} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        : <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center text-[11px] font-bold text-nf-text shrink-0">{m.name[0]?.toUpperCase()}</div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-nf-text truncate">{m.name}</p>
                      </div>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                        m.role === "owner" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
                        m.role === "admin" ? "text-red-400 bg-red-400/10 border-red-400/30" :
                        "text-blue-400 bg-blue-400/10 border-blue-400/30")}>
                        {m.role === "owner" ? "مالك" : m.role === "admin" ? "مشرف" : "ناظم"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite tab */}
      {tab === "invite" && (
        <div className="max-w-[680px] space-y-6">
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
                <div className="py-8 text-center"><p className="text-[13px] text-nf-muted">لا يوجد متابَعون لدعوتهم</p><p className="text-[11px] text-nf-dim mt-1">تابع مستخدمين لتظهر هنا</p></div>
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
