"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { Users, Shield, Crown, UserMinus, UserPlus, Search, Check, Copy, Link2, ChevronDown, Eye } from "lucide-react";

interface Member {
  uid: string; name: string; photo: string;
  role: "owner"|"admin"|"moderator"|"member";
  joinedAt: string;
  permissions?: Record<string, boolean>;
  showInModerators?: boolean;
}

const ROLE_ORDER = { owner: 0, admin: 1, moderator: 2, member: 3 };

// All available permissions
const ALL_PERMISSIONS = [
  { id: "managePosts",    label: "إدارة المنشورات",   desc: "حذف وتثبيت وإخفاء المنشورات" },
  { id: "manageComments", label: "إدارة التعليقات",   desc: "حذف التعليقات المخالفة" },
  { id: "manageMembers",  label: "إدارة الأعضاء",     desc: "إزالة الأعضاء من المجتمع" },
  { id: "manageSettings", label: "إعدادات المجتمع",   desc: "تعديل وصف وقوانين المجتمع" },
  { id: "reviewReports",  label: "مراجعة البلاغات",   desc: "مراجعة والرد على بلاغات الأعضاء" },
];

// Default permissions per role
const DEFAULT_PERMS = {
  admin:     { managePosts: true, manageComments: true, manageMembers: true, manageSettings: true, reviewReports: true },
  moderator: { managePosts: true, manageComments: true, manageMembers: false, manageSettings: false, reviewReports: true },
  member:    { managePosts: false, manageComments: false, manageMembers: false, manageSettings: false, reviewReports: false },
};

const ROLE_META = {
  owner:     { label: "مالك",  color: "text-amber-500", dot: "bg-amber-500",  icon: Crown  },
  admin:     { label: "مشرف",  color: "text-red-400",   dot: "bg-red-400",    icon: Shield },
  moderator: { label: "ناظم",  color: "text-blue-400",  dot: "bg-blue-400",   icon: Shield },
  member:    { label: "عضو",   color: "text-nf-dim",    dot: "bg-nf-dim/40",  icon: Users  },
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
  const [saving, setSaving] = useState<string|null>(null);
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
          const permissions = data.permissions || DEFAULT_PERMS[role as keyof typeof DEFAULT_PERMS] || DEFAULT_PERMS.member;
          list.push({ uid: d.id, name: name || d.id.slice(0, 8), photo, role, joinedAt: data.joinedAt || "", permissions, showInModerators: data.showInModerators ?? (role !== "member") });
        }
        if (iAmCreator && !list.find(m => m.uid === user!.uid)) {
          const uSnap = await getDoc(doc(db, "users", user!.uid)).catch(() => null);
          list.push({ uid: user!.uid, name: uSnap?.data()?.displayName || user!.displayName || "أنت", photo: uSnap?.data()?.photoURL || user!.photoURL || "", role: "owner", joinedAt: new Date().toISOString(), permissions: DEFAULT_PERMS.admin, showInModerators: true });
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

  const saveMember = async (uid: string, updates: Partial<Member>) => {
    if (!canManage) return;
    setSaving(uid);
    try {
      await setDoc(doc(db, "communities", communityName, "members", uid), updates, { merge: true });
      setMembers(prev => prev.map(m => m.uid === uid ? { ...m, ...updates } : m).sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3)));
      setExpanded(uid);
    } catch (e) { console.error(e); }
    setSaving(null);
  };

  const togglePermission = (uid: string, permId: string, current: boolean) => {
    const m = members.find(x => x.uid === uid);
    if (!m) return;
    const newPerms = { ...(m.permissions || {}), [permId]: !current };
    // Determine role from permissions
    const hasAll = ALL_PERMISSIONS.every(p => newPerms[p.id]);
    const hasNone = ALL_PERMISSIONS.every(p => !newPerms[p.id]);
    const newRole: Member["role"] = hasAll ? "admin" : hasNone ? "member" : "moderator";
    saveMember(uid, { permissions: newPerms, role: newRole });
  };

  const toggleShowInModerators = (uid: string, current: boolean) => {
    saveMember(uid, { showInModerators: !current });
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
      {/* Tabs */}
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

      {/* Members tab */}
      {tab === "members" && (
        <div>
          <div className="relative mb-5">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nf-dim pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن عضو..."
              className="w-full bg-nf-secondary/50 border border-nf-border-2/50 rounded-xl pr-10 pl-4 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-all" />
          </div>

          {loading ? (
            <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-[60px] bg-nf-secondary/20 animate-pulse rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-nf-dim"><Users size={24} className="mx-auto mb-3 opacity-20" /><p className="text-[14px]">لا توجد نتائج</p></div>
          ) : (
            <div>
              {filtered.map((m, idx) => {
                const isMe = m.uid === user?.uid;
                const isOwner = m.role === "owner";
                const isOpen = expanded === m.uid;
                const meta = ROLE_META[m.role];
                const canExpand = canManage && !isOwner && !isMe;
                const perms = m.permissions || DEFAULT_PERMS[m.role as keyof typeof DEFAULT_PERMS] || DEFAULT_PERMS.member;

                return (
                  <div key={m.uid}>
                    {idx > 0 && <div className="h-px bg-nf-border-2/20 mx-1" />}

                    {/* Row */}
                    <div className={cn("flex items-center gap-3.5 px-2 py-3.5 rounded-lg transition-colors",
                      canExpand ? "cursor-pointer hover:bg-nf-secondary/30" : "",
                      isOpen && "bg-nf-secondary/20")}
                      onClick={() => canExpand && setExpanded(isOpen ? null : m.uid)}>
                      {m.photo
                        ? <img src={m.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        : <div className="w-9 h-9 rounded-full bg-nf-secondary flex items-center justify-center text-[13px] font-semibold text-nf-muted shrink-0">{m.name[0]?.toUpperCase()}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-nf-text truncate">{m.name}</span>
                          {isMe && <span className="text-[11px] text-nf-dim">(أنت)</span>}
                        </div>
                        {m.joinedAt && <p className="text-[11px] text-nf-dim mt-0.5">انضم {new Date(m.joinedAt).toLocaleDateString("ar-SA", { month: "short", year: "numeric" })}</p>}
                      </div>
                      <div className={cn("flex items-center gap-1.5 text-[12px] font-medium shrink-0", meta.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", meta.dot)} />
                        {meta.label}
                      </div>
                      {canExpand && <ChevronDown size={14} className={cn("text-nf-dim/50 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />}
                    </div>

                    {/* Expanded */}
                    {isOpen && canExpand && (
                      <div className="mx-2 mb-3 rounded-xl bg-nf-secondary/15 border border-nf-border-2/25 overflow-hidden">

                        {/* Permissions toggles */}
                        <div className="px-4 pt-4 pb-3">
                          <p className="text-[11px] font-semibold text-nf-dim uppercase tracking-wider mb-3">الصلاحيات</p>
                          <div className="space-y-2.5">
                            {ALL_PERMISSIONS.map(p => {
                              const isOn = !!(perms as any)[p.id];
                              return (
                                <div key={p.id} className="flex items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-nf-text">{p.label}</p>
                                    <p className="text-[11px] text-nf-dim">{p.desc}</p>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); togglePermission(m.uid, p.id, isOn); }}
                                    disabled={saving === m.uid}
                                    className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
                                      isOn ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200",
                                      isOn ? "right-0.5" : "left-0.5")} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Show in moderators toggle */}
                        <div className="border-t border-nf-border-2/20 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-nf-text flex items-center gap-1.5">
                                <Eye size={13} className="text-nf-accent" />
                                إظهار في قائمة المشرفين
                              </p>
                              <p className="text-[11px] text-nf-dim">يظهر اسمه في sidebar المجتمع</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleShowInModerators(m.uid, m.showInModerators ?? false); }}
                              disabled={saving === m.uid}
                              className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
                                m.showInModerators ? "bg-nf-accent" : "bg-nf-secondary border border-nf-border-2")}>
                              <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200",
                                m.showInModerators ? "right-0.5" : "left-0.5")} />
                            </button>
                          </div>
                        </div>

                        {/* Remove */}
                        <div className="border-t border-nf-border-2/20 px-4 py-3">
                          <button onClick={(e) => { e.stopPropagation(); removeMember(m.uid); }}
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

      {/* Invite tab */}
      {tab === "invite" && (
        <div className="space-y-6">
          <div>
            <p className="text-[13px] font-semibold text-nf-text mb-2">رابط الدعوة</p>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink} className="flex-1 bg-nf-secondary/50 border border-nf-border-2/50 rounded-xl px-3.5 py-2.5 text-[11px] text-nf-dim font-mono outline-none truncate" />
              <button onClick={copyLink} className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium border transition-all shrink-0",
                copied ? "text-green-400 border-green-400/30" : "text-nf-muted border-nf-border-2/50 hover:text-nf-text hover:border-nf-border-2")}>
                {copied ? <><Check size={12} /> تم</> : <><Copy size={12} /> نسخ</>}
              </button>
            </div>
            <p className="text-[11px] text-nf-dim mt-1.5">الدعوة تُرسل كإشعار — الشخص يقبل أو يرفض</p>
          </div>
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
                            sent ? "text-nf-dim border-nf-border-2/40 cursor-default" : "text-nf-accent border-nf-accent/30 hover:bg-nf-accent/10 disabled:opacity-50")}>
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
