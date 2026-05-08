"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { doc, updateDoc, getDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { linkWithPopup, unlink, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { ArrowRight, User, Shield, LogOut, Palette, Bell, Globe, Check, Camera, AlertTriangle, Sparkles, Key, ChevronDown, Link2, Unlink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "./I18nProvider";
import { useToast } from "./ToastProvider";

function IconX() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#fff"/></svg>; }
function IconYouTube() { return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/><path d="M9.545 15.568V8.432L15.818 12z" fill="#fff"/></svg>; }
function IconGitHub() { return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="#fff"/></svg>; }
function IconSteam() { return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M11.502 18.003l-2.09-1.442a1.29 1.29 0 0 1-.398-1.666 1.28 1.28 0 0 1 1.532-.623l1.898.633.418-1.858a1.284 1.284 0 0 1 1.796-.856 1.29 1.29 0 0 1 .577 1.748l-1.012 2.024a1.29 1.29 0 0 1-1.878.478z" fill="#fff"/><path d="M22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12z" fill="none" stroke="#fff" strokeWidth="1.5"/></svg>; }
function IconDiscord() { return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.393-.406-.874-.618-1.25a.077.077 0 0 0-.079-.036 19.74 19.74 0 0 0-4.885 1.515.07.07 0 0 0-.032.028C.533 9.046-.32 13.56.1 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.423 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.926.077.077 0 0 1-.008-.126c.126-.094.252-.192.372-.301a.074.074 0 0 1 .078-.012c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.1.246.204.373.302a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.926.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028c1.96-.607 3.949-1.522 6.002-3.029a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029z" fill="#5865F2"/></svg>; }
function IconWebsite() { return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#00e5ff"/></svg>; }
function IconTwitch() { return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="#9146FF"/></svg>; }
function IconGoogle() { return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>; }

const TRANSLATE_LANGS = [
  { id: "en", label: "English", sub: "إنجليزي", flag: "🇺🇸" },
  { id: "ar", label: "العربية", sub: "Arabic", flag: "🇸🇦" },
  { id: "fr", label: "Français", sub: "فرنسي", flag: "🇫🇷" },
  { id: "de", label: "Deutsch", sub: "ألماني", flag: "🇩🇪" },
  { id: "es", label: "Español", sub: "إسباني", flag: "🇪🇸" },
  { id: "tr", label: "Türkçe", sub: "تركي", flag: "🇹🇷" },
  { id: "ja", label: "日本語", sub: "ياباني", flag: "🇯🇵" },
  { id: "ko", label: "한국어", sub: "كوري", flag: "🇰🇷" },
  { id: "zh", label: "中文", sub: "صيني", flag: "🇨🇳" },
  { id: "ru", label: "Русский", sub: "روسي", flag: "🇷🇺" },
];

function TranslationLangSelector() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("nf-ai-translate-lang") || "en");
  const ref = useRef<HTMLDivElement>(null);
  const current = TRANSLATE_LANGS.find(l => l.id === lang) || TRANSLATE_LANGS[0];
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-semibold transition-all border bg-nf-secondary/30 border-nf-border/10 hover:border-nf-border/25">
        <span className="text-lg leading-none">{current.flag}</span>
        <span className="flex-1 text-right text-nf-text">{current.label}</span>
        <span className="text-[9px] text-nf-dim/40">{current.sub}</span>
        <ChevronDown size={12} className={cn("shrink-0 transition-transform opacity-40", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-white/10 shadow-xl shadow-black/40 overflow-hidden" style={{ backgroundColor: "rgba(18,18,20,0.92)", backdropFilter: "blur(20px) saturate(1.2)" }}>
          <div className="py-0.5 max-h-[240px] overflow-y-auto">
            {TRANSLATE_LANGS.map(l => (
              <button key={l.id} onClick={() => { setLang(l.id); localStorage.setItem("nf-ai-translate-lang", l.id); setOpen(false); }} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold transition-all", lang === l.id ? "bg-nf-accent/10 text-nf-accent" : "text-nf-muted hover:bg-white/5")}>
                <span className="text-lg leading-none">{l.flag}</span>
                <span className="flex-1 text-right">{l.label}</span>
                <span className="text-[9px] opacity-40">{l.sub}</span>
                {lang === l.id && <Check size={10} className="text-nf-accent shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const socialFields = [
  { id: "twitter", label: "X (Twitter)", placeholder: "https://x.com/username", bg: "#000", icon: IconX },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel", bg: "#ff0000", icon: IconYouTube },
  { id: "github", label: "GitHub", placeholder: "https://github.com/username", bg: "#333", icon: IconGitHub },
  { id: "steam", label: "Steam", placeholder: "https://steamcommunity.com/id/username", bg: "#1b2838", icon: IconSteam },
  { id: "discord", label: "Discord", placeholder: "https://discord.gg/invite-code", bg: "#5865f2", icon: IconDiscord },
  { id: "website", labelKey: "sp.personalWebsite", placeholder: "https://your-site.com", bg: "#0d1117", icon: IconWebsite },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={cn("w-9 h-5 rounded-full transition-colors relative shrink-0", on ? "bg-nf-accent" : "bg-nf-border")}>
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", on ? "left-0.5" : "left-[18px]")} />
    </button>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <p className="text-[12px] text-white font-medium">{label}</p>
        {sub && <p className="text-[10px] text-nf-dim mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("account");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [notifVotes, setNotifVotes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifAwards, setNotifAwards] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [hideActivity, setHideActivity] = useState(false);
  const [showOnline, setShowOnline] = useState(true);
  const [langLocal, setLangLocal] = useState("ar");
  const [compactMode, setCompactMode] = useState(false);
  const [accentColor, setAccentColor] = useState("#a0a0a0");
  const [bannerUrl, setBannerUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({ twitter: "", youtube: "", github: "", steam: "", discord: "", website: "" });
  const [linkedProviders, setLinkedProviders] = useState<{ id: string; email?: string; name?: string }[]>([]);

  useEffect(() => {
    const s = localStorage.getItem("nf-dark");
    if (s !== null) setDarkMode(s === "true");
    const l = localStorage.getItem("nf-lang");
    if (l) setLangLocal(l);
    const c = localStorage.getItem("nf-compact");
    if (c) setCompactMode(c === "true");
    const ac = localStorage.getItem("nf-accent");
    if (ac) setAccentColor(ac);
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(s => {
      if (s.exists()) {
        const d = s.data();
        setBio(d.bio || "");
        setProfilePrivate(d.profilePrivate || false);
        setHideActivity(d.hideActivity || false);
        setShowOnline(d.showOnline !== false);
        setBannerUrl(d.bannerUrl || "");
        setPhotoUrl(d.photoURL || user?.photoURL || "");
        setSocialLinks(d.socialLinks || { twitter: "", youtube: "", github: "", steam: "", discord: "", website: "" });
        setNotifVotes(d.notifVotes !== false);
        setNotifComments(d.notifComments !== false);
        setNotifMentions(d.notifMentions !== false);
        setNotifFollows(d.notifFollows !== false);
        setNotifAwards(d.notifAwards !== false);
        setEmailNotifs(d.emailNotifs || false);
        setLinkedProviders(d.linkedProviders || []);
      }
    }).catch(() => {});
  }, [user]);

  const saveAll = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName, photoURL: photoUrl, bio, bannerUrl, profilePrivate, hideActivity, showOnline, socialLinks,
        notifVotes, notifComments, notifMentions, notifFollows, notifAwards, emailNotifs,
      });
      // Update Firebase Auth profile too
      try { const { updateProfile } = await import("firebase/auth"); if (user) await updateProfile(user, { displayName, photoURL: photoUrl || undefined }); } catch {}
      localStorage.setItem("nf-compact", String(compactMode));
      localStorage.setItem("nf-accent", accentColor);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast("تم حفظ الإعدادات", "success");
    } catch {}
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("nf-dark", String(next));
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
  };

  const changeLang = (l: string) => {
    setLangLocal(l);
    setLang(l as "ar" | "en");
    localStorage.setItem("nf-lang", l);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changeAccent = (c: string) => {
    setAccentColor(c);
    localStorage.setItem("nf-accent", c);
    document.documentElement.style.setProperty("--nf-accent", c);
  };

  const updateSocial = (id: string, val: string) => {
    setSocialLinks(prev => ({ ...prev, [id]: val }));
  };

  const handleDownloadData = async () => {
    if (!user) return;
    try {
      const data: Record<string, any> = { profile: {}, posts: [], comments: [], following: [], followers: [], communities: [], saved: [] };
      // Profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) data.profile = { id: user.uid, ...userDoc.data() };
      // Posts
      const postsSnap = await getDocs(query(collection(db, "posts"), where("authorUid", "==", user.uid)));
      for (const p of postsSnap.docs) {
        const postData: any = { id: p.id, ...p.data() };
        const commentsSnap = await getDocs(collection(db, "posts", p.id, "comments"));
        postData.comments = commentsSnap.docs.map(c => ({ id: c.id, ...c.data() }));
        data.posts.push(postData);
      }
      // Following
      const followingSnap = await getDocs(collection(db, "users", user.uid, "following"));
      data.following = followingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Followers
      const followersSnap = await getDocs(collection(db, "users", user.uid, "followers"));
      data.followers = followersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Communities
      const commSnap = await getDocs(collection(db, "users", user.uid, "communities"));
      data.communities = commSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Saved
      const savedSnap = await getDocs(collection(db, "users", user.uid, "saved"));
      data.saved = savedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `northfall-data-${user.displayName || user.uid}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("تم تحميل بياناتك بنجاح", "success");
    } catch (e) {
      console.error(e);
      toast("حدث خطأ أثناء تحميل البيانات", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleting) return;
    const expected = (user.displayName || "") + "DELETE";
    if (deleteConfirm.trim() !== expected) {
      alert(`اكتب "${expected}" للتأكيد`);
      return;
    }
    setDeleting(true);
    try {
      // Delete user's posts
      const postsSnap = await getDocs(query(collection(db, "posts"), where("authorUid", "==", user.uid)));
      for (const p of postsSnap.docs) {
        // Delete comments on each post
        const commentsSnap = await getDocs(collection(db, "posts", p.id, "comments"));
        for (const c of commentsSnap.docs) await deleteDoc(c.ref);
        await deleteDoc(p.ref);
      }
      // Delete user's comments on other posts
      const allPostsSnap = await getDocs(collection(db, "posts"));
      for (const p of allPostsSnap.docs) {
        const commentsSnap = await getDocs(query(collection(db, "posts", p.id, "comments"), where("authorUid", "==", user.uid)));
        for (const c of commentsSnap.docs) await deleteDoc(c.ref);
      }
      // Delete user doc and subcollections
      const followingSnap = await getDocs(collection(db, "users", user.uid, "following"));
      for (const f of followingSnap.docs) await deleteDoc(f.ref);
      const followersSnap = await getDocs(collection(db, "users", user.uid, "followers"));
      for (const f of followersSnap.docs) await deleteDoc(f.ref);
      const communitiesSnap = await getDocs(collection(db, "users", user.uid, "communities"));
      for (const c of communitiesSnap.docs) await deleteDoc(c.ref);
      await deleteDoc(doc(db, "users", user.uid));
      // Delete Firebase Auth user
      await user.delete();
      logout();
    } catch (e: any) {
      console.error("Delete account error:", e);
      alert(e.message || "حدث خطأ أثناء حذف الحساب");
    } finally {
      setDeleting(false);
    }
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  // AI settings state
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiProvider, setAiProvider] = useState<string>("deepseek");
  const [aiModel, setAiModel] = useState(0);
  const [aiConnected, setAiConnected] = useState<"unknown" | "testing" | "ok" | "fail">("unknown");

  const AI_MODELS = [
    { name: "GPT-3.5 تجريبي", provider: "chatanywhere", model: "gpt-3.5-turbo", free: true, desc: "مجاني للتجربة — لا يحتاج مفتاح مدفوع" },
    { name: "DeepSeek Chat", provider: "deepseek", model: "deepseek-chat", free: true, desc: "مجاني وسريع — احصل على مفتاح من platform.deepseek.com" },
    { name: "Gemini 2.0 Flash", provider: "gemini", model: "gemini-2.0-flash", free: true, desc: "سريع من جوجل، ممتاز للردود القصيرة" },
    { name: "Groq Llama 3.3", provider: "groq", model: "llama-3.3-70b-versatile", free: true, desc: "أسرع نموذج، استجابة فورية" },
    { name: "Groq Gemma 2", provider: "groq", model: "gemma2-9b-it", free: true, desc: "خفيف وسريع من Groq" },
    { name: "Mistral Small", provider: "mistral", model: "mistral-small-latest", free: true, desc: "نموذج صغير من Mistral، مجاني" },
    { name: "GPT-4o Mini", provider: "chatgpt", model: "gpt-4o-mini", free: false, desc: "نسخة مصغرة من GPT-4، رخيصة" },
    { name: "GPT-4.1 Nano", provider: "chatgpt", model: "gpt-4.1-nano", free: false, desc: "أصغر نموذج OpenAI، سريع" },
    { name: "Gemini 2.5 Flash", provider: "gemini", model: "gemini-2.5-flash-preview-05-20", free: false, desc: "أحدث Gemini، ذكاء عالي" },
    { name: "Claude 3.5 Haiku", provider: "claude", model: "claude-3-5-haiku-20241022", free: false, desc: "سريع ورخيص من Anthropic" },
    { name: "Mistral Medium", provider: "mistral", model: "mistral-medium-latest", free: false, desc: "نموذج متوسط، توازن بين السرعة والذكاء" },
  ];

  useEffect(() => {
    const k = localStorage.getItem("nf-ai-key") || "";
    const p = localStorage.getItem("nf-ai-provider") || "deepseek";
    const m = parseInt(localStorage.getItem("nf-ai-model") || "0");
    setAiApiKey(k); setAiProvider(p); setAiModel(m);
  }, []);

  const saveAiSettings = () => {
    localStorage.setItem("nf-ai-key", aiApiKey);
    localStorage.setItem("nf-ai-provider", aiProvider);
    localStorage.setItem("nf-ai-model", String(aiModel));
    toast(t("gen.saved"));
  };

  const testAiConnection = async () => {
    setAiConnected("testing");
    try {
      const sel = AI_MODELS[aiModel];
      const effectiveProvider = sel.provider;
      const effectiveModel = sel.model;
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: effectiveProvider, model: effectiveModel, apiKey: aiApiKey, messages: [{ role: "user", content: "Hi" }], maxTokens: 5 }),
      });
      const data = await res.json();
      const ok = data?.choices?.[0]?.message || data?.candidates?.[0]?.content || data?.content?.[0]?.text;
      setAiConnected(ok ? "ok" : "fail");
    } catch { setAiConnected("fail"); }
  };

  const sections = [
    { id: "account", label: t("sp.account"), icon: User },
    { id: "linked", label: "الحسابات المرتبطة", icon: Link2 },
    { id: "appearance", label: t("sp.appearance"), icon: Palette },
    { id: "notifications", label: t("sp.notifications"), icon: Bell },
    { id: "privacy", label: t("sp.privacy"), icon: Shield },
    { id: "ai", label: "الذكاء الاصطناعي", icon: Sparkles },
    { id: "language", label: t("sp.language"), icon: Globe },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-nf-dim hover:text-white text-[12px] transition-colors">
            {lang === "ar" ? <ArrowRight size={16} /> : <ArrowRight size={16} className="rotate-180" />}
            {t("sp.back")}
          </button>
          <span className="text-[15px] font-bold text-white">{t("sp.settings")}</span>
        </div>
        <button onClick={saveAll} className="h-8 px-5 rounded-lg bg-nf-accent/15 text-nf-accent text-[11px] font-bold hover:bg-nf-accent/25 transition-colors flex items-center gap-1.5">
          <Check size={12} />{t("gen.saveChanges")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Sidebar - horizontal on mobile, vertical on desktop */}
        <div className="sm:w-[160px] shrink-0 flex sm:flex-col gap-0.5 sm:border-r border-nf-border-2/50 sm:pr-3 overflow-x-auto pb-2 sm:pb-0">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn("flex items-center gap-2 sm:w-full px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-colors shrink-0",
                  activeSection === s.id ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-white")}>
                <Icon size={13} />
                <span>{s.label}</span>
              </button>
            );
          })}
          {user && (
            <button onClick={logout} className="flex items-center gap-2 sm:w-full mt-0 sm:mt-3 px-2.5 py-2 rounded-lg text-[11px] font-semibold text-red-400 hover:bg-red-400/5 transition-colors shrink-0">
              <LogOut size={13} />
              <span>{t("gen.logOut")}</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "account" && (
            <div className="space-y-4">
              <div className="p-4">
                <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">{t("sp.accountInfo")}</h3>
                {/* Banner Preview */}
                <div className="relative h-[80px] rounded-lg overflow-hidden mb-3">
                  <img src={bannerUrl || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-nf-primary/90 to-transparent" />
                </div>
                <div className="mb-3">
                  <label className="text-[10px] text-nf-dim mb-1 block">رابط البانر</label>
                  <input type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://example.com/banner.jpg" className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-nf-secondary overflow-hidden border border-nf-border-2">
                      {photoUrl || user?.photoURL ? <img src={photoUrl || user?.photoURL || ""} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl text-nf-muted font-bold">{(displayName || t("gen.user"))[0]}</div>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{displayName || t("gen.user")}</p>
                    <p className="text-[10px] text-nf-dim truncate">{user?.email || ""}</p>
                    <p className="text-[10px] text-green-400 flex items-center gap-0.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />متصل</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-nf-dim mb-1 block">رابط الصورة الشخصية</label>
                    <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] text-nf-dim mb-1 block">{t("sp.displayName")}</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-nf-accent/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] text-nf-dim mb-1 block">{t("sp.bio")}</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={2} placeholder={t("sp.bioPlaceholder")} className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors resize-none" />
                    <span className="text-[9px] text-nf-dim">{bio.length}/200</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">{t("sp.socialLinks")}</h3>
                <div className="space-y-2">
                  {socialFields.map((f) => {
                    const IconComp = f.icon;
                    const label = f.labelKey ? t(f.labelKey) : (typeof f.label === "string" ? f.label : "");
                    return (
                      <div key={f.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-nf-secondary/50 text-nf-muted">
                          <IconComp />
                        </div>
                        <input type="url" value={socialLinks[f.id] || ""} onChange={(e) => updateSocial(f.id, e.target.value)} placeholder={f.placeholder}
                          className="flex-1 bg-nf-input border border-nf-border-2 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2">منطقة الخطر</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-white font-medium">حذف الحساب</p>
                    <p className="text-[9px] text-nf-dim">هذا الإجراء لا يمكن التراجع عنه</p>
                  </div>
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors">حذف</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "linked" && (
            <div className="space-y-4">
              <div className="p-4">
                <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-1">الحسابات المرتبطة</h3>
                <p className="text-[9px] text-nf-dim mb-4">اربط حساباتك لتسجيل الدخول بسهولة وعرضها في بروفايلك</p>

                {/* OAuth-linked accounts: Google & GitHub */}
                <div className="space-y-2 mb-6">
                  {/* Google */}
                  {(() => {
                    const gp = linkedProviders.find(p => p.id === "google.com");
                    return (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-nf-secondary/30 border border-nf-border-2/50">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 shrink-0"><IconGoogle /></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-white">Google</div>
                          {gp ? (
                            <div className="text-[9px] text-nf-dim truncate">
                              {gp.email || gp.name || "مربوط"}
                            </div>
                          ) : (
                            <div className="text-[9px] text-nf-dim">غير مربوط</div>
                          )}
                        </div>
                        {gp ? (
                          <button
                            onClick={async () => {
                              if (!user) return;
                              try {
                                await unlink(user, "google.com");
                              } catch {}
                              const updated = linkedProviders.filter(x => x.id !== "google.com");
                              setLinkedProviders(updated);
                              await updateDoc(doc(db, "users", user.uid), { linkedProviders: updated });
                              toast("تم إلغاء ربط Google", "info");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors"
                          >
                            <Unlink size={11} /> إلغاء الربط
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!user) return;
                              try {
                                const provider = new GoogleAuthProvider();
                                const result = await linkWithPopup(user, provider);
                                const entry = { id: "google.com", email: result.user.email || undefined, name: result.user.displayName || undefined };
                                const updated = [...linkedProviders.filter(x => x.id !== "google.com"), entry];
                                setLinkedProviders(updated);
                                await updateDoc(doc(db, "users", user.uid), { linkedProviders: updated });
                                toast("تم ربط Google بنجاح", "success");
                              } catch (e: any) {
                                console.error("Google link error:", e?.code, e?.message);
                                if (e?.code === "auth/email-already-in-use" || e?.code === "auth/credential-already-in-use") {
                                  const entry = { id: "google.com", email: e?.customData?.email || user?.email || undefined, name: undefined };
                                  const updated = [...linkedProviders.filter(x => x.id !== "google.com"), entry];
                                  setLinkedProviders(updated);
                                  await updateDoc(doc(db, "users", user.uid), { linkedProviders: updated });
                                  toast("تم ربط Google (نفس البريد مستخدم بحساب آخر في Firebase)", "success");
                                } else if (e?.code === "auth/popup-closed-by-user") {
                                  toast("تم إغلاق النافذة", "error");
                                } else {
                                  toast(`فشل ربط Google: ${e?.message || e?.code || "خطأ"}`, "error");
                                }
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-nf-accent text-white hover:bg-nf-accent/80 transition-colors"
                          >
                            <Link2 size={11} /> ربط
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* GitHub */}
                  {(() => {
                    const gp = linkedProviders.find(p => p.id === "github.com");
                    return (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-nf-secondary/30 border border-nf-border-2/50">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 shrink-0"><IconGitHub /></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-white">GitHub</div>
                          {gp ? (
                            <div className="text-[9px] text-nf-dim truncate">
                              {gp.name || gp.email || "مربوط"}
                            </div>
                          ) : (
                            <div className="text-[9px] text-nf-dim">غير مربوط</div>
                          )}
                        </div>
                        {gp ? (
                          <button
                            onClick={async () => {
                              if (!user) return;
                              try {
                                await unlink(user, "github.com");
                              } catch {}
                              const updated = linkedProviders.filter(x => x.id !== "github.com");
                              setLinkedProviders(updated);
                              await updateDoc(doc(db, "users", user.uid), { linkedProviders: updated });
                              toast("تم إلغاء ربط GitHub", "info");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors"
                          >
                            <Unlink size={11} /> إلغاء الربط
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!user) return;
                              try {
                                const provider = new GithubAuthProvider();
                                const result = await linkWithPopup(user, provider);
                                const entry = { id: "github.com", email: result.user.email || undefined, name: result.user.displayName || undefined };
                                const updated = [...linkedProviders.filter(x => x.id !== "github.com"), entry];
                                setLinkedProviders(updated);
                                await updateDoc(doc(db, "users", user.uid), { linkedProviders: updated });
                                toast("تم ربط GitHub بنجاح", "success");
                              } catch (e: any) {
                                console.error("GitHub link error:", e?.code, e?.message);
                                if (e?.code === "auth/email-already-in-use" || e?.code === "auth/credential-already-in-use") {
                                  const entry = { id: "github.com", email: e?.customData?.email || user?.email || undefined, name: undefined };
                                  const updated = [...linkedProviders.filter(x => x.id !== "github.com"), entry];
                                  setLinkedProviders(updated);
                                  await updateDoc(doc(db, "users", user.uid), { linkedProviders: updated });
                                  toast("تم ربط GitHub (نفس البريد مستخدم بحساب آخر في Firebase)", "success");
                                } else if (e?.code === "auth/popup-closed-by-user") {
                                  toast("تم إغلاق النافذة", "error");
                                } else {
                                  toast(`فشل ربط GitHub: ${e?.message || e?.code || "خطأ"}`, "error");
                                }
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-nf-accent text-white hover:bg-nf-accent/80 transition-colors"
                          >
                            <Link2 size={11} /> ربط
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="p-4">
              <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">{t("sp.appearance")}</h3>
              <SettingRow label={t("sp.darkMode")} sub="قريباً">
                <span className="text-[10px] text-nf-dim/50 font-bold tracking-widest uppercase">SOON</span>
              </SettingRow>
              <SettingRow label={t("sp.compactFont")} sub="تصغير حجم الخط">
                <Toggle on={compactMode} onToggle={() => { setCompactMode(!compactMode); document.documentElement.classList.toggle("text-sm"); }} />
              </SettingRow>
              <SettingRow label="لون التمييز" sub="اختر لون accent">
                <div className="flex gap-1">
                  {["#a0a0a0", "#ff4444", "#4488ff", "#44cc88", "#ff8800", "#cc44ff"].map(c => (
                    <button key={c} onClick={() => changeAccent(c)} className={cn("w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform", accentColor === c ? "border-white scale-110" : "border-nf-border-2")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </SettingRow>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="p-4">
              <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">{t("sp.notifications")}</h3>
              <p className="text-[9px] text-nf-dim mb-2">إشعارات الموقع</p>
              <SettingRow label={t("sp.notifVotes")} sub="عند تصويت منشورك">
                <Toggle on={notifVotes} onToggle={() => setNotifVotes(!notifVotes)} />
              </SettingRow>
              <SettingRow label={t("sp.notifComments")} sub="عند التعليق على منشورك">
                <Toggle on={notifComments} onToggle={() => setNotifComments(!notifComments)} />
              </SettingRow>
              <SettingRow label={t("sp.notifMentions")} sub="عند الإشارة إليك">
                <Toggle on={notifMentions} onToggle={() => setNotifMentions(!notifMentions)} />
              </SettingRow>
              <SettingRow label="متابعين جدد" sub="عند متابعة حسابك">
                <Toggle on={notifFollows} onToggle={() => setNotifFollows(!notifFollows)} />
              </SettingRow>
              <SettingRow label="جوائز" sub="عند حصولك على جائزة">
                <Toggle on={notifAwards} onToggle={() => setNotifAwards(!notifAwards)} />
              </SettingRow>
              <div className="mt-3 pt-3">
                <p className="text-[9px] text-nf-dim mb-2">إشعارات البريد</p>
                <SettingRow label="إشعارات البريد" sub="استلام إشعارات عبر البريد">
                  <Toggle on={emailNotifs} onToggle={() => setEmailNotifs(!emailNotifs)} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div className="p-4">
              <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">{t("sp.privacy")}</h3>
              <SettingRow label={t("sp.privateProfile")} sub="إخفاء الملف الشخصي">
                <Toggle on={profilePrivate} onToggle={() => setProfilePrivate(!profilePrivate)} />
              </SettingRow>
              <SettingRow label={t("sp.hideActivity")} sub="إخفاء النشاط الأخير">
                <Toggle on={hideActivity} onToggle={() => setHideActivity(!hideActivity)} />
              </SettingRow>
              <SettingRow label="إظهار حالة الاتصال" sub="السماح للآخرين برؤية أنك متصل">
                <Toggle on={showOnline} onToggle={() => setShowOnline(!showOnline)} />
              </SettingRow>
              <div className="mt-3 pt-3">
                <p className="text-[9px] text-nf-dim mb-2">بياناتك</p>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-[11px] text-white font-medium">تحميل بياناتك</span>
                    <p className="text-[9px] text-nf-dim">تصدير جميع بياناتك كملف JSON</p>
                  </div>
                  <button onClick={handleDownloadData} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-nf-accent bg-nf-accent/5 border border-nf-accent/20 hover:bg-nf-accent/10 transition-colors">تحميل</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "ai" && (
            <div className="p-4 space-y-4">
              <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">إعدادات الذكاء الاصطناعي</h3>
              <p className="text-[9px] text-nf-dim/50 mb-4">اختر المزود والنموذج وأضف مفتاح API لاستخدام أدوات AI في المنشورات والمنتدى</p>
              {/* Provider */}
              <div>
                <label className="text-[9px] text-nf-dim font-bold mb-1.5 block uppercase tracking-wider">المزود</label>
                <p className="text-[8px] text-nf-dim/40 mb-2">الشركة التي توفر خدمة الذكاء الاصطناعي</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["chatanywhere", "deepseek", "groq", "mistral", "gemini", "chatgpt", "claude"] as const).map(p => (
                    <button key={p} onClick={() => { setAiProvider(p); const idx = AI_MODELS.findIndex(m => m.provider === p); if (idx >= 0) setAiModel(idx); }} className={cn("py-2 rounded-lg text-[10px] font-bold transition-all border", aiProvider === p ? "bg-nf-accent/10 text-nf-accent border-nf-accent/20" : "bg-nf-secondary/30 text-nf-dim border-nf-border/10 hover:border-nf-border/25")}>{p === "chatgpt" ? "ChatGPT" : p === "chatanywhere" ? "تجريبي" : p.charAt(0).toUpperCase() + p.slice(1)}</button>
                  ))}
                </div>
              </div>
              {/* Model */}
              {AI_MODELS.filter(m => m.provider === aiProvider).length > 0 && (
                <div>
                  <label className="text-[9px] text-nf-dim font-bold mb-1.5 block uppercase tracking-wider">النموذج</label>
                  <p className="text-[8px] text-nf-dim/40 mb-2">النموذج المستخدم — المجانية أسرع، المدفوعة أذكى</p>
                  <div className="flex flex-col gap-1">
                    {AI_MODELS.filter(m => m.provider === aiProvider).map(m => {
                      const gi = AI_MODELS.indexOf(m);
                      return (
                        <button key={gi} onClick={() => setAiModel(gi)} className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-semibold transition-all border", aiModel === gi ? "bg-nf-accent/10 text-nf-accent border-nf-accent/20" : "bg-nf-secondary/30 text-nf-dim border-nf-border/10 hover:border-nf-border/25")}>
                          <span>{m.name}</span>
                          <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", m.free ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>{m.free ? "مجاني" : "مدفوع"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Model desc */}
              {AI_MODELS[aiModel] && (
                <div className="bg-nf-secondary/20 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-nf-dim font-bold">{AI_MODELS[aiModel].name}</p>
                  <p className="text-[9px] text-nf-dim/50">{AI_MODELS[aiModel].desc}</p>
                </div>
              )}
              {/* Translation */}
              <div className="border-t border-nf-border/10 pt-4">
                <label className="text-[9px] text-nf-dim font-bold mb-1.5 block uppercase tracking-wider">لغة الترجمة</label>
                <p className="text-[8px] text-nf-dim/40 mb-2">عند استخدام أداة الترجمة، يترجم لهذه اللغة — أو العكس إذا كانت اللغة نفسها</p>
                <TranslationLangSelector />
                <p className="text-[8px] text-nf-dim/30 mt-2">ذكي: إذا المنشور عربي يترجم للغة المختارة، وإذا المنشور بنفس اللغة يترجم للعربية</p>
              </div>
              {/* API Key */}
              <div className="border-t border-nf-border/10 pt-4">
                <label className="text-[9px] text-nf-dim font-bold mb-1.5 block uppercase tracking-wider">مفتاح API</label>
                <p className="text-[8px] text-nf-dim/40 mb-2">مفتاح الدخول — احصل عليه مجاناً من موقع المزود</p>
                <div className="relative">
                  <input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} placeholder="sk-..." className="w-full bg-nf-secondary/30 rounded-lg px-4 py-2.5 text-[11px] text-white placeholder:text-nf-dim/30 outline-none focus:ring-1 focus:ring-nf-accent/20 font-mono border border-nf-border/10 focus:border-nf-accent/20 transition-all" dir="ltr" />
                  <Key size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nf-dim/25" />
                </div>
              </div>
              {/* Test + Save */}
              <div className="flex gap-2">
                <button onClick={saveAiSettings} className="flex-1 bg-nf-accent hover:bg-nf-accent/80 text-white text-[11px] font-bold py-2.5 rounded-lg transition-all">حفظ الإعدادات</button>
                {aiApiKey && (
                  <button onClick={testAiConnection} disabled={aiConnected === "testing"} className={cn("px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all border", aiConnected === "ok" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/15" : aiConnected === "fail" ? "bg-red-400/10 text-red-400 border-red-400/15" : aiConnected === "testing" ? "bg-nf-accent/10 text-nf-accent border-nf-accent/15" : "bg-nf-secondary/30 text-nf-dim border-nf-border/10 hover:border-nf-accent/15")}>
                    {aiConnected === "testing" ? "اختبار..." : aiConnected === "ok" ? "متصل" : aiConnected === "fail" ? "فشل" : "اختبار"}
                  </button>
                )}
              </div>
              {aiApiKey && (
                <button onClick={() => { setAiApiKey(""); localStorage.removeItem("nf-ai-key"); setAiConnected("unknown"); }} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors">حذف المفتاح</button>
              )}
            </div>
          )}

          {activeSection === "language" && (
            <div className="p-4">
              <h3 className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">{t("sp.language")}</h3>
              {[
                { id: "ar", label: "العربية", sub: "Arabic", flag: "🇸🇦" },
                { id: "en", label: "English", sub: "الإنجليزية", flag: "🇺🇸" },
              ].map((l) => (
                <button key={l.id} onClick={() => changeLang(l.id)}
                  className={cn("flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors mb-1",
                    lang === l.id ? "bg-nf-accent/10 border border-nf-accent/30" : "border border-transparent hover:bg-nf-hover")}>
                  <span className="text-lg">{l.flag}</span>
                  <div className="flex-1 text-right">
                    <p className={cn("text-[12px] font-semibold", lang === l.id ? "text-nf-accent" : "text-white")}>{l.label}</p>
                    <p className="text-[10px] text-nf-dim">{l.sub}</p>
                  </div>
                  {lang === l.id && <Check size={14} className="text-nf-accent shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-nf-accent text-white text-[11px] font-bold px-4 py-2 rounded-lg z-50 flex items-center gap-1.5">
          <Check size={12} />{t("gen.saved")}
        </motion.div>
      )}

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-[420px] bg-nf-primary border border-nf-border rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">حذف الحساب نهائياً</h3>
                  <p className="text-[10px] text-nf-dim">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
              </div>

              <div className="space-y-3 mb-4 text-[12px] text-nf-text-2 leading-relaxed">
                <p>سيتم حذف جميع بياناتك بشكل نهائي، بما في ذلك:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-nf-muted mr-4">
                  <li>جميع منشوراتك وتعليقاتك</li>
                  <li>المتابعين والمتابَعين</li>
                  <li>الإعدادات والروابط الاجتماعية</li>
                  <li>جميع الإشعارات والمحفوظات</li>
                </ul>
                <p className="text-red-400 font-semibold text-[11px]">لن تتمكن من استعادة حسابك بعد الحذف.</p>
              </div>

              <div className="mb-4">
                <label className="text-[10px] text-nf-dim mb-1.5 block">
                  للتأكيد، اكتب: <span className="text-red-400 font-bold font-mono">{user?.displayName || ""}DELETE</span>
                </label>
                <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={`${user?.displayName || ""}DELETE`}
                  className="w-full bg-nf-input border border-red-400/20 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-nf-dim outline-none focus:border-red-400/40 transition-colors font-mono" />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleDeleteAccount} disabled={deleting || deleteConfirm.trim() !== (user?.displayName || "") + "DELETE"}
                  className={cn("flex-1 px-4 py-2 rounded-lg text-[11px] font-bold transition-colors",
                    deleting ? "text-nf-dim cursor-wait bg-nf-secondary" :
                    deleteConfirm.trim() === (user?.displayName || "") + "DELETE" ? "text-white bg-red-500 hover:bg-red-600" :
                    "text-nf-dim bg-nf-secondary border border-nf-border cursor-not-allowed")}>
                  {deleting ? "جاري الحذف..." : "تأكيد الحذف النهائي"}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium text-nf-muted hover:text-white border border-nf-border hover:bg-nf-hover transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
