"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./AuthProvider";
import { doc, updateDoc, getDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { reauthenticateWithPopup, GoogleAuthProvider, signOut, type User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  removeLinkedAccount,
  restoreSession,
  setShowAccountPickerSetting,
  clearPickerSkipped,
  getShowAccountPickerSetting,
} from "@/lib/account-switcher";
import { ArrowRight, User, Shield, LogOut, Palette, Bell, Globe, Check, Sparkles, Key, ChevronDown, Monitor, Heart, ExternalLink } from "lucide-react";
import { getPostBorderedPref, setPostBorderedPref } from "@/lib/user-display-prefs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "./I18nProvider";
import { useToast } from "./ToastProvider";
import TranslateLangPicker, { langBadge } from "./TranslateLangPicker";
import AiSettingsPanel from "./AiSettingsPanel";
import { useClassicTabs } from "./ClassicTabsProvider";
import ComposeSelect from "./ComposeSelect";
import "./rich-editor.css";
import { SiX, SiYoutube, SiGithub, SiSteam, SiDiscord } from "react-icons/si";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import type { IconType } from "react-icons";

const socialFields: {
  id: string;
  label?: string;
  labelKey?: string;
  placeholder: string;
  bg: string;
  icon: IconType;
  iconColor?: string;
}[] = [
  { id: "twitter", label: "X (Twitter)", placeholder: "https://x.com/username", bg: "#000000", icon: SiX },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel", bg: "#ff0000", icon: SiYoutube },
  { id: "github", label: "GitHub", placeholder: "https://github.com/username", bg: "#24292f", icon: SiGithub },
  { id: "steam", label: "Steam", placeholder: "https://steamcommunity.com/id/username", bg: "#1b2838", icon: SiSteam },
  { id: "discord", label: "Discord", placeholder: "https://discord.gg/invite-code", bg: "#5865f2", icon: SiDiscord },
  { id: "website", labelKey: "sp.personalWebsite", placeholder: "https://your-site.com", bg: "#2563eb", icon: HiOutlineGlobeAlt, iconColor: "#fff" },
];

const TRANSLATE_LANGS = [
  { id: "en", label: "English", sub: "إنجليزي", flag: "🇺🇸" },
  { id: "ar", label: "العربية", sub: "Arabic", flag: "🇸🇦" },
  { id: "fr", label: "Français", sub: "فرنسي", flag: "🇫🇷" },
  { id: "de", label: "Deutsch", sub: "ألماني", flag: "🇩🇪" },
  { id: "es", label: "Español", sub: "إسباني", flag: "🇪🇸" },
  { id: "pt", label: "Português", sub: "برتغالي", flag: "🇧🇷" },
  { id: "it", label: "Italiano", sub: "إيطالي", flag: "🇮🇹" },
  { id: "nl", label: "Nederlands", sub: "هولندي", flag: "🇳🇱" },
  { id: "pl", label: "Polski", sub: "بولندي", flag: "🇵🇱" },
  { id: "ru", label: "Русский", sub: "روسي", flag: "🇷🇺" },
  { id: "tr", label: "Türkçe", sub: "تركي", flag: "🇹🇷" },
  { id: "fa", label: "فارسی", sub: "فارسي", flag: "🇮🇷" },
  { id: "ur", label: "اردو", sub: "أردو", flag: "🇵🇰" },
  { id: "hi", label: "हिन्दी", sub: "هندي", flag: "🇮🇳" },
  { id: "bn", label: "বাংলা", sub: "بنغالي", flag: "🇧🇩" },
  { id: "id", label: "Indonesia", sub: "إندونيسي", flag: "🇮🇩" },
  { id: "ms", label: "Melayu", sub: "ملايو", flag: "🇲🇾" },
  { id: "th", label: "ภาษาไทย", sub: "تايلاندي", flag: "🇹🇭" },
  { id: "vi", label: "Tiếng Việt", sub: "فيتنامي", flag: "🇻🇳" },
  { id: "ja", label: "日本語", sub: "ياباني", flag: "🇯🇵" },
  { id: "ko", label: "한국어", sub: "كوري", flag: "🇰🇷" },
  { id: "zh", label: "中文 (简体)", sub: "صيني مبسط", flag: "🇨🇳" },
  { id: "zh-TW", label: "中文 (繁體)", sub: "صيني تقليدي", flag: "🇹🇼" },
  { id: "uk", label: "Українська", sub: "أوكراني", flag: "🇺🇦" },
  { id: "cs", label: "Čeština", sub: "تشيكي", flag: "🇨🇿" },
  { id: "sv", label: "Svenska", sub: "سويدي", flag: "🇸🇪" },
  { id: "no", label: "Norsk", sub: "نرويجي", flag: "🇳🇴" },
  { id: "da", label: "Dansk", sub: "دنماركي", flag: "🇩🇰" },
  { id: "fi", label: "Suomi", sub: "فنلندي", flag: "🇫🇮" },
  { id: "el", label: "Ελληνικά", sub: "يوناني", flag: "🇬🇷" },
  { id: "he", label: "עברית", sub: "عبري", flag: "🇮🇱" },
  { id: "ro", label: "Română", sub: "روماني", flag: "🇷🇴" },
  { id: "hu", label: "Magyar", sub: "مجري", flag: "🇭🇺" },
  { id: "sk", label: "Slovenčina", sub: "سلوفاكي", flag: "🇸🇰" },
  { id: "bg", label: "Български", sub: "بلغاري", flag: "🇧🇬" },
  { id: "hr", label: "Hrvatski", sub: "كرواتي", flag: "🇭🇷" },
  { id: "sr", label: "Српски", sub: "صربي", flag: "🇷🇸" },
  { id: "lt", label: "Lietuvių", sub: "ليتواني", flag: "🇱🇹" },
  { id: "lv", label: "Latviešu", sub: "لاتفي", flag: "🇱🇻" },
  { id: "et", label: "Eesti", sub: "إستوني", flag: "🇪🇪" },
  { id: "sw", label: "Kiswahili", sub: "سواحيلي", flag: "🇰🇪" },
  { id: "am", label: "አማርኛ", sub: "أمهري", flag: "🇪🇹" },
  { id: "af", label: "Afrikaans", sub: "أفريكانز", flag: "🇿🇦" },
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
        <span className="w-7 h-7 rounded-md bg-nf-secondary/60 border border-nf-border-2/50 flex items-center justify-center text-[10px] font-bold text-nf-muted uppercase shrink-0">{langBadge(current.id)}</span>
        <span className="flex-1 text-right text-nf-text">{current.label}</span>
        <span className="text-[11px] text-nf-dim/40">{current.sub}</span>
        <ChevronDown size={12} className={cn("shrink-0 transition-transform opacity-40", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-nf-border-2 shadow-xl overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
          <div className="py-0.5 max-h-[240px] overflow-y-auto">
            {TRANSLATE_LANGS.map(l => (
              <button key={l.id} onClick={() => { setLang(l.id); localStorage.setItem("nf-ai-translate-lang", l.id); setOpen(false); }} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold transition-all", lang === l.id ? "bg-nf-accent/10 text-nf-accent" : "text-nf-muted hover:bg-nf-hover")}>
                <span className="w-6 h-6 rounded-md bg-nf-secondary/50 border border-nf-border-2/40 flex items-center justify-center text-[9px] font-bold text-nf-dim uppercase shrink-0">{langBadge(l.id)}</span>
                <span className="flex-1 text-right text-nf-text">{l.label}</span>
                <span className="text-[11px] opacity-40 text-nf-dim">{l.sub}</span>
                {lang === l.id && <Check size={10} className="text-nf-accent shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={cn("w-9 h-5 rounded-full transition-colors relative shrink-0 direction-ltr", on ? "bg-nf-accent" : "bg-nf-border")} style={{ direction: "ltr" }}>
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-nf-muted font-medium">{label}</p>
        {sub && <p className="text-[10px] text-nf-dim/80 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { isClassic, setIsClassic } = useClassicTabs();
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
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [hideActivity, setHideActivity] = useState(false);
  const [showOnline, setShowOnline] = useState(true);
  const [langLocal, setLangLocal] = useState("ar");
  const [compactMode, setCompactMode] = useState(false);
  const [imageCarousel, setImageCarousel] = useState(true);
  const [postBordered, setPostBordered] = useState(false);
  const [accentColor, setAccentColor] = useState("#a0a0a0");
  const [bannerUrl, setBannerUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({ twitter: "", youtube: "", github: "", steam: "", discord: "", website: "" });
  const [mutedWords, setMutedWords] = useState<string[]>([]);
  const [mutedWordInput, setMutedWordInput] = useState("");
  // Advanced privacy states
  const [allowFollowers, setAllowFollowers] = useState(true);
  const [showPostHistory, setShowPostHistory] = useState(true);
  const [showVoteHistory, setShowVoteHistory] = useState(false);
  const [hideSaved, setHideSaved] = useState(false);
  const [allowMentions, setAllowMentions] = useState<"all" | "following" | "none">("all");
  const [allowDirectMessages, setAllowDirectMessages] = useState<"all" | "following" | "none">("all");
  const [hideFromSearch, setHideFromSearch] = useState(false);
  const [showKarma, setShowKarma] = useState(true);
  const [privacyTab, setPrivacyTab] = useState<"profile" | "content" | "muted">("profile");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ visibility: true, interactions: true, data: false });
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  useEffect(() => {
    if (!showDeleteConfirm) return;
    document.documentElement.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [showDeleteConfirm]);

  useEffect(() => {
    const s = localStorage.getItem("nf-dark");
    if (s !== null) setDarkMode(s === "true");
    const l = localStorage.getItem("nf-lang");
    if (l) setLangLocal(l);
    const c = localStorage.getItem("nf-compact");
    if (c) setCompactMode(c === "true");
    const ic = localStorage.getItem("nf-image-carousel");
    if (ic !== null) setImageCarousel(ic !== "false");
    setPostBordered(getPostBorderedPref());
    const ac = localStorage.getItem("nf-accent");
    if (ac) setAccentColor(ac);
    setShowAccountPicker(getShowAccountPickerSetting());
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
        setMutedWords(d.mutedWords || []);
        setAllowFollowers(d.allowFollowers !== false);
        setShowPostHistory(d.showPostHistory !== false);
        setShowVoteHistory(d.showVoteHistory || false);
        setHideSaved(d.hideSaved || false);
        setAllowMentions(d.allowMentions || "all");
        setAllowDirectMessages(d.allowDirectMessages || "all");
        setHideFromSearch(d.hideFromSearch || false);
        setShowKarma(d.showKarma !== false);
        if (d.showAccountPicker !== undefined) setShowAccountPicker(d.showAccountPicker);
      }
    }).catch(() => {});
  }, [user]);

  const saveAll = async () => {
    if (!user) return;
    localStorage.setItem("nf-ai-key", aiApiKey);
    localStorage.setItem("nf-ai-provider", aiProvider);
    localStorage.setItem("nf-ai-model", String(aiModel));
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName, photoURL: photoUrl, bio, bannerUrl, profilePrivate, hideActivity, showOnline, socialLinks,
        notifVotes, notifComments, notifMentions, notifFollows, notifAwards, mutedWords,
        allowFollowers, showPostHistory, showVoteHistory, hideSaved, allowMentions, allowDirectMessages, hideFromSearch, showKarma,
        showAccountPicker,
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

  const addMutedWord = async () => {
    const word = mutedWordInput.trim().toLowerCase();
    if (!word || mutedWords.includes(word) || !user) return;
    const updated = [...mutedWords, word];
    setMutedWords(updated);
    setMutedWordInput("");
    try { await updateDoc(doc(db, "users", user.uid), { mutedWords: updated }); } catch {}
  };

  const removeMutedWord = async (word: string) => {
    if (!user) return;
    const updated = mutedWords.filter(w => w !== word);
    setMutedWords(updated);
    try { await updateDoc(doc(db, "users", user.uid), { mutedWords: updated }); } catch {}
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
    const deletedUid = user.uid;

    const deleteAuthUser = async (u: FirebaseUser) => {
      try {
        await u.delete();
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "auth/requires-recent-login") {
          await reauthenticateWithPopup(u, new GoogleAuthProvider());
          await u.delete();
          return;
        }
        throw err;
      }
    };

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
      await deleteAuthUser(user);

      const remaining = removeLinkedAccount(deletedUid);
      setShowDeleteConfirm(false);
      setDeleteConfirm("");

      if (remaining.length >= 1) {
        setShowAccountPickerSetting(true);
        clearPickerSkipped();
        const switched = await restoreSession(remaining[0].refreshToken);
        if (switched.success) {
          window.location.href = "/app";
          return;
        }
      }

      await signOut(auth);
      logout();
      window.location.href = "/app";
    } catch (e: any) {
      console.error("Delete account error:", e);
      if (e?.code === "auth/popup-closed-by-user") {
        alert("تم إلغاء تأكيد الهوية. لم يُحذف الحساب.");
      } else if (e?.code === "auth/requires-recent-login") {
        alert("يجب تأكيد Google مرة واحدة فقط لحذف الحساب.");
      } else {
        alert(e.message || "حدث خطأ أثناء حذف الحساب");
      }
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
    { name: "Gemini 2.5 Flash", provider: "gemini", model: "gemini-2.5-flash", free: false, desc: "أحدث Gemini، ذكاء عالي" },
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
        <span className="text-[15px] font-bold text-nf-text">{t("sp.settings")}</span>
        <button onClick={saveAll} className="h-8 px-5 rounded-lg bg-nf-accent/15 text-nf-accent text-[11px] font-bold hover:bg-nf-accent/25 transition-colors flex items-center gap-1.5">
          <Check size={12} />{t("gen.saveChanges")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Sidebar - horizontal on mobile, vertical on desktop */}
        <div className="sm:w-[160px] shrink-0 flex sm:flex-col gap-0.5 sm:pr-3 overflow-x-auto pb-2 sm:pb-0">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn("flex items-center gap-2 sm:w-full px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-colors shrink-0",
                  activeSection === s.id ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-text")}>
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
        <div className="flex-1 min-w-0 text-[13px] leading-relaxed nf-settings-panel">
          {activeSection === "account" && (
            <div className="space-y-6">

              {/* Profile card */}
              <div className="p-4">
                <p className="text-[13px] font-semibold text-nf-text mb-4">معلومات الحساب</p>

                {/* Banner + avatar متداخلان — بدون خلفية ملونة */}
                <div className="relative mb-10">
                  <div className="relative h-[88px] rounded-xl overflow-hidden border border-nf-border-2/50 bg-transparent">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)]/80 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute -bottom-5 right-4 z-10">
                    <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-[3px] border-[var(--bg-body)] bg-nf-secondary/30 shadow-md">
                      {photoUrl || user?.photoURL ? (
                        <img src={photoUrl || user?.photoURL || ""} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-nf-muted">
                          {(displayName || "U")[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 right-[calc(4rem+1rem)] left-0 min-w-0">
                    <p className="text-[14px] font-bold text-nf-text truncate">{displayName || t("gen.user")}</p>
                    <p className="text-[11px] text-nf-dim truncate">{user?.email || ""}</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-nf-dim mb-1.5 block">رابط الصورة الشخصية</label>
                    <input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full bg-transparent border border-nf-border-2/60 rounded-lg px-3 py-2 text-[12px] text-nf-text placeholder:text-nf-dim/45 outline-none focus:border-nf-accent/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-nf-dim mb-1.5 block">رابط البانر</label>
                    <input type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full bg-transparent border border-nf-border-2/60 rounded-lg px-3 py-2 text-[12px] text-nf-text placeholder:text-nf-dim/45 outline-none focus:border-nf-accent/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-nf-dim mb-1.5 block">{t("sp.displayName")}</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-transparent border border-nf-border-2/60 rounded-lg px-3 py-2 text-[12px] text-nf-text outline-none focus:border-nf-accent/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-nf-dim mb-1.5 block">{t("sp.bio")}</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={200} rows={3}
                      placeholder={t("sp.bioPlaceholder")}
                      className="w-full bg-transparent border border-nf-border-2/60 rounded-lg px-3 py-2 text-[12px] text-nf-text placeholder:text-nf-dim/45 outline-none focus:border-nf-accent/40 transition-colors resize-none" />
                    <p className="text-[10px] text-nf-dim/70 mt-1 text-left">{bio.length}/200</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-[13px] font-semibold text-nf-text mb-1">دعم المشروع</p>
                <p className="text-[12px] text-nf-dim mb-3 leading-relaxed">
                  شريط التبرع يظهر أعلى التطبيق ويمكن إغلاقه مؤقتاً؛ يعود بعد تحديث الصفحة.
                </p>
                <a
                  href="https://ko-fi.com/northfallcommunity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-nf-text bg-white/[0.05] border border-white/[0.08] hover:border-nf-accent/30 transition-colors"
                >
                  <Heart size={14} className="text-red-400" fill="currentColor" />
                  تبرع عبر Ko-fi
                  <ExternalLink size={12} className="text-nf-dim" />
                </a>
              </div>

              {/* Account Picker */}
              <div className="p-4">
                <p className="text-[13px] font-semibold text-nf-text mb-3">شاشة الإقلاع</p>
                <SettingRow label="إظهار شاشة اختيار الحساب عند الدخول" sub="تفتح لما ترجع للموقع وعندك أكثر من حساب. تختار أي حساب تدخل فيه.">
                  <Toggle on={showAccountPicker} onToggle={() => { const next = !showAccountPicker; setShowAccountPicker(next); setShowAccountPickerSetting(next); }} />
                </SettingRow>
              </div>

              {/* Danger zone */}
              <div className="p-4">
                <p className="text-[13px] font-semibold text-red-400 mb-3">منطقة الخطر</p>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-[12px] text-nf-text font-medium">حذف الحساب</p>
                    <p className="text-[10px] text-nf-dim mt-0.5">هذا الإجراء لا يمكن التراجع عنه</p>
                  </div>
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors">
                    حذف
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeSection === "appearance" && (
            <div className="p-4 space-y-6">
              <div>
                <p className="text-[13px] font-semibold text-nf-text mb-3">{t("sp.appearance")}</p>
                <SettingRow label={t("sp.darkMode")} sub="تبديل بين الوضع الداكن والمضيء">
                  <Toggle on={darkMode} onToggle={toggleDark} />
                </SettingRow>
                <SettingRow label="الثيم الكلاسيكي" sub="تبويبات مستقلة + تصميم كثيف بدون حواف دائرية">
                  <Toggle on={isClassic} onToggle={() => setIsClassic(!isClassic)} />
                </SettingRow>
                <SettingRow label={t("sp.compactFont")} sub="تصغير حجم الخط لعرض أكثر">
                  <Toggle on={compactMode} onToggle={() => { setCompactMode(!compactMode); document.documentElement.classList.toggle("text-sm"); }} />
                </SettingRow>
                <SettingRow label="عرض الصور كسلايدر" sub="تنقل بين الصور بسهم، أو اعرضها كلها تحت بعض">
                  <Toggle on={imageCarousel} onToggle={() => { const next = !imageCarousel; setImageCarousel(next); localStorage.setItem("nf-image-carousel", String(next)); window.dispatchEvent(new CustomEvent("nf-prefs-changed")); }} />
                </SettingRow>
                <SettingRow label="إطار حول المنشورات" sub="مربع بحدود خفيفة حول كل منشور في الفيد">
                  <Toggle
                    on={postBordered}
                    onToggle={() => {
                      const next = !postBordered;
                      setPostBordered(next);
                      setPostBorderedPref(next);
                    }}
                  />
                </SettingRow>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-nf-text mb-2">لون التمييز</p>
                <p className="text-[12px] text-nf-dim mb-3">يؤثر على الأزرار والروابط والعناصر التفاعلية</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { color: "#a0a0a0", label: "رمادي" },
                    { color: "#ff4444", label: "أحمر" },
                    { color: "#4488ff", label: "أزرق" },
                    { color: "#44cc88", label: "أخضر" },
                    { color: "#ff8800", label: "برتقالي" },
                    { color: "#cc44ff", label: "بنفسجي" },
                  ].map(({ color, label }) => (
                    <button key={color} onClick={() => changeAccent(color)}
                      title={label}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 hover:scale-110 transition-all",
                        accentColor === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:border-white/40"
                      )}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
                {/* Preview */}
                <div className="mt-4 p-3 rounded-lg bg-nf-secondary/30 border border-nf-border-2/50">
                  <p className="text-[10px] text-nf-dim mb-2">معاينة</p>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-colors" style={{ backgroundColor: accentColor }}>زر رئيسي</button>
                    <span className="text-[11px] font-semibold" style={{ color: accentColor }}>رابط نصي</span>
                    <div className="w-8 h-4 rounded-full relative" style={{ backgroundColor: accentColor }}>
                      <span className="absolute top-0.5 left-[18px] w-3 h-3 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <div className="px-4 py-4">
                <p className="text-[13px] font-semibold text-nf-text mb-3">إشعارات النشاط</p>
                <SettingRow label={t("sp.notifVotes")} sub="عند تصويت أحد على منشورك">
                  <Toggle on={notifVotes} onToggle={() => setNotifVotes(!notifVotes)} />
                </SettingRow>
                <SettingRow label={t("sp.notifComments")} sub="عند تعليق أحد على منشورك">
                  <Toggle on={notifComments} onToggle={() => setNotifComments(!notifComments)} />
                </SettingRow>
                <SettingRow label={t("sp.notifMentions")} sub="عند الإشارة إليك بـ @">
                  <Toggle on={notifMentions} onToggle={() => setNotifMentions(!notifMentions)} />
                </SettingRow>
                <SettingRow label="متابعون جدد" sub="عند متابعة شخص لحسابك">
                  <Toggle on={notifFollows} onToggle={() => setNotifFollows(!notifFollows)} />
                </SettingRow>
                <div className="relative">
                  <SettingRow label="جوائز" sub="عند حصولك على جائزة من مستخدم">
                    <Toggle on={notifAwards} onToggle={() => setNotifAwards(!notifAwards)} />
                  </SettingRow>
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 rounded-lg pointer-events-auto cursor-not-allowed">
                    <span className="text-[12px] font-bold text-white/90 tracking-wide">قريباً</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div>
              <div className="nf-settings-subtabs">
                {([
                  { id: "profile", label: "الملف الشخصي" },
                  { id: "content", label: "المحتوى" },
                  { id: "muted",   label: "الكلمات المكتومة" },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setPrivacyTab(tab.id)}
                    className={cn("nf-settings-subtab",
                      privacyTab === tab.id ? "nf-settings-subtab--active" : "nf-settings-subtab--idle")}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {privacyTab === "profile" && (
                <div className="px-4 pb-4 space-y-1">

                  {/* Section: Visibility */}
                  <div>
                    <button onClick={() => setOpenSections(p => ({ ...p, visibility: !p.visibility }))}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-nf-hover/40 transition-colors">
                      <span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">الظهور والاكتشاف</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={cn("text-nf-dim transition-transform", openSections.visibility ? "rotate-180" : "")}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                    {openSections.visibility && (
                      <div className="px-4 pb-3 space-y-0">
                        <SettingRow label="ملف شخصي خاص" sub="فقط المتابعون يمكنهم رؤية منشوراتك">
                          <Toggle on={profilePrivate} onToggle={() => setProfilePrivate(!profilePrivate)} />
                        </SettingRow>
                        <SettingRow label="إخفاء من نتائج البحث" sub="لن يظهر حسابك في بحث المستخدمين">
                          <Toggle on={hideFromSearch} onToggle={() => setHideFromSearch(!hideFromSearch)} />
                        </SettingRow>
                        <SettingRow label="إظهار حالة الاتصال" sub="السماح للآخرين برؤية أنك متصل الآن">
                          <Toggle on={showOnline} onToggle={() => setShowOnline(!showOnline)} />
                        </SettingRow>
                        <SettingRow label="إظهار الصيت" sub="عرض رصيد الصيت على ملفك الشخصي">
                          <Toggle on={showKarma} onToggle={() => setShowKarma(!showKarma)} />
                        </SettingRow>
                      </div>
                    )}
                  </div>

                  {/* Section: Interactions */}
                  <div>
                    <button onClick={() => setOpenSections(p => ({ ...p, interactions: !p.interactions }))}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-nf-hover/40 transition-colors">
                      <span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">التفاعلات والتواصل</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={cn("text-nf-dim transition-transform", openSections.interactions ? "rotate-180" : "")}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                    {openSections.interactions && (
                      <div className="px-4 pb-3 space-y-0">
                        <SettingRow label="السماح بالمتابعة" sub="يمكن للآخرين متابعة حسابك">
                          <Toggle on={allowFollowers} onToggle={() => setAllowFollowers(!allowFollowers)} />
                        </SettingRow>
                        <SettingRow label="إخفاء النشاط الأخير" sub="إخفاء آخر وقت نشاط لك">
                          <Toggle on={hideActivity} onToggle={() => setHideActivity(!hideActivity)} />
                        </SettingRow>
                        <SettingRow label="من يمكنه الإشارة إليك" sub="التحكم في من يستطيع @mention حسابك">
                          <ComposeSelect
                            value={allowMentions}
                            onChange={setAllowMentions}
                            options={[
                              { value: "all", label: "الجميع" },
                              { value: "following", label: "المتابَعون فقط" },
                              { value: "none", label: "لا أحد" },
                            ]}
                            className="min-w-[8rem]"
                          />
                        </SettingRow>
                        <SettingRow label="من يمكنه مراسلتك" sub="التحكم في من يستطيع إرسال رسائل مباشرة">
                          <ComposeSelect
                            value={allowDirectMessages}
                            onChange={setAllowDirectMessages}
                            options={[
                              { value: "all", label: "الجميع" },
                              { value: "following", label: "المتابَعون فقط" },
                              { value: "none", label: "لا أحد" },
                            ]}
                            className="min-w-[8rem]"
                          />
                        </SettingRow>
                      </div>
                    )}
                  </div>

                  {/* Section: Data */}
                  <div>
                    <button onClick={() => setOpenSections(p => ({ ...p, data: !p.data }))}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-nf-hover/40 transition-colors">
                      <span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">بياناتك</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={cn("text-nf-dim transition-transform", openSections.data ? "rotate-180" : "")}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                    {openSections.data && (
                      <div className="px-4 pb-3 space-y-0">
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-[12px] text-nf-text font-medium">تحميل بياناتك</p>
                            <p className="text-[10px] text-nf-dim mt-0.5">تصدير جميع بياناتك كملف JSON</p>
                          </div>
                          <button onClick={handleDownloadData} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-nf-accent bg-nf-accent/5 border border-nf-accent/20 hover:bg-nf-accent/10 transition-colors">تحميل</button>
                        </div>
                        <div className="flex items-center justify-between py-3 mt-1">
                          <div>
                            <p className="text-[12px] text-red-400 font-medium">حذف الحساب</p>
                            <p className="text-[10px] text-nf-dim mt-0.5">هذا الإجراء لا يمكن التراجع عنه</p>
                          </div>
                          <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors">حذف</button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ── Content Privacy ── */}
              {privacyTab === "content" && (
                <div className="space-y-6">
                  {/* Post history */}
                  <div className="px-4 py-4">
                    <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">سجل المنشورات</p>
                    <SettingRow label="إظهار منشوراتك للعموم" sub="يمكن لأي شخص رؤية منشوراتك وتعليقاتك">
                      <Toggle on={showPostHistory} onToggle={() => setShowPostHistory(!showPostHistory)} />
                    </SettingRow>
                    <SettingRow label="إخفاء سجل التصويت" sub="لا يرى أحد المنشورات التي صوّت عليها">
                      <Toggle on={!showVoteHistory} onToggle={() => setShowVoteHistory(!showVoteHistory)} />
                    </SettingRow>
                    <SettingRow label="إخفاء المحفوظات" sub="لا يظهر تبويب المحفوظات لأي شخص آخر في ملفك">
                      <Toggle on={hideSaved} onToggle={() => setHideSaved(!hideSaved)} />
                    </SettingRow>
                  </div>

                  {/* Social links — redesigned */}
                  <div className="px-4 py-4">
                    <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-4">الروابط الاجتماعية</p>
                    <div className="space-y-3">
                      {socialFields.map((f) => {
                        const IconComp = f.icon;
                        const label = f.labelKey ? t(f.labelKey) : (typeof f.label === "string" ? f.label : "");
                        const val = socialLinks[f.id] || "";
                        return (
                          <div key={f.id}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: f.bg }}>
                                <IconComp size={13} color={f.iconColor || "#ffffff"} />
                              </div>
                              <span className="text-[11px] font-semibold text-nf-text">{label}</span>
                              {val && (
                                <a href={val} target="_blank" rel="noopener noreferrer"
                                  className="mr-auto text-[10px] text-nf-accent hover:underline truncate max-w-[120px]">
                                  مفتوح
                                </a>
                              )}
                            </div>
                            <input
                              type="url"
                              value={val}
                              onChange={e => updateSocial(f.id, e.target.value)}
                              placeholder={f.placeholder}
                              className="w-full bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-[11px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent/50 transition-colors"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Export data */}
                  <div className="px-4 py-4">
                    <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-3">بياناتك</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] text-nf-text font-medium">تحميل بياناتك</p>
                        <p className="text-[10px] text-nf-dim mt-0.5">تصدير جميع بياناتك كملف JSON</p>
                      </div>
                      <button onClick={handleDownloadData}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-nf-accent bg-nf-accent/5 border border-nf-accent/20 hover:bg-nf-accent/10 transition-colors">
                        تحميل
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Muted Words ── */}
              {privacyTab === "muted" && (
                <div className="px-4 py-4">
                  <p className="text-[12px] font-semibold text-nf-text mb-1">الكلمات المكتومة</p>
                  <p className="text-[11px] text-nf-dim mb-4">المنشورات التي تحتوي على هذه الكلمات لن تظهر في الفيد الخاص بك</p>

                  {/* Input */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={mutedWordInput}
                      onChange={e => setMutedWordInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMutedWord(); } }}
                      placeholder="اكتب كلمة أو عبارة ثم اضغط Enter..."
                      className="flex-1 bg-nf-input border border-nf-border-2 rounded-lg px-3 py-2 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/40 transition-colors"
                    />
                    <button
                      onClick={addMutedWord}
                      disabled={!mutedWordInput.trim()}
                      className="px-4 py-2 rounded-lg text-[11px] font-bold bg-nf-accent/10 text-nf-accent border border-nf-accent/20 hover:bg-nf-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      إضافة
                    </button>
                  </div>

                  {/* Count badge */}
                  {mutedWords.length > 0 && (
                    <p className="text-[10px] text-nf-dim mb-2">{mutedWords.length} كلمة مكتومة</p>
                  )}

                  {/* Tags */}
                  {mutedWords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {mutedWords.map(word => (
                        <span key={word} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nf-secondary border border-nf-border-2 text-[12px] text-nf-text font-medium">
                          {word}
                          <button onClick={() => removeMutedWord(word)}
                            className="text-nf-dim hover:text-red-400 transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-nf-border-2/50 rounded-xl">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-nf-dim/40 mb-2">
                        <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"/>
                      </svg>
                      <p className="text-[12px] text-nf-dim">لا توجد كلمات مكتومة</p>
                      <p className="text-[10px] text-nf-dim/50 mt-1">أضف كلمات لإخفاء المنشورات التي تحتوي عليها</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {activeSection === "ai" && (
            <AiSettingsPanel
              aiModel={aiModel}
              setAiModel={setAiModel}
              setAiProvider={setAiProvider}
              aiModels={AI_MODELS}
              aiApiKey={aiApiKey}
              setAiApiKey={setAiApiKey}
              aiConnected={aiConnected}
              onTest={testAiConnection}
              onDeleteKey={() => {
                setAiApiKey("");
                localStorage.removeItem("nf-ai-key");
                setAiConnected("unknown");
              }}
            />
          )}

          {activeSection === "language" && (
            <div className="p-4">
              <h3 className="text-[13px] font-semibold text-nf-text mb-3">{t("sp.language")}</h3>
              {[
                { id: "ar", label: "العربية", sub: "Arabic", flag: "🇸🇦" },
                { id: "en", label: "English", sub: "الإنجليزية", flag: "🇺🇸" },
              ].map((l) => (
                <button key={l.id} onClick={() => changeLang(l.id)}
                  className={cn("flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors mb-1",
                    lang === l.id ? "bg-nf-accent/10 border border-nf-accent/30" : "border border-transparent hover:bg-nf-hover")}>
                  <span className="text-lg">{l.flag}</span>
                  <div className="flex-1 text-right">
                    <p className={cn("text-[12px] font-semibold", lang === l.id ? "text-nf-accent" : "text-nf-text")}>{l.label}</p>
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
      {showDeleteConfirm && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10055] bg-[#0a0a0a]/95 flex items-center justify-center p-4"
          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }}
        >
          <div
            dir="rtl"
            role="alertdialog"
            aria-modal
            className="w-full max-w-[420px] bg-nf-card border border-nf-border-2 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-nf-text">حذف الحساب نهائياً</h3>
                <p className="text-[11px] text-nf-dim mt-1">هذا الإجراء لا يمكن التراجع عنه</p>
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
                <p className="text-[11px] text-nf-dim">إذا بقيت حسابات مربوطة، ستظهر نافذة اختيار الحساب بعد الحذف.</p>
              </div>

              <div className="mb-4">
                <label className="text-[10px] text-nf-dim mb-1.5 block">
                  للتأكيد، اكتب: <span className="text-red-400 font-bold font-mono">{user?.displayName || ""}DELETE</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={`${user?.displayName || ""}DELETE`}
                  className="w-full bg-nf-card border border-red-400/20 rounded-lg px-3 py-2.5 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:border-red-400/40 transition-colors font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm.trim() !== (user?.displayName || "") + "DELETE"}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-[11px] font-bold transition-colors",
                    deleting ? "text-nf-dim cursor-wait bg-nf-secondary" :
                    deleteConfirm.trim() === (user?.displayName || "") + "DELETE" ? "text-white bg-red-500 hover:bg-red-600" :
                    "text-nf-dim bg-nf-secondary border border-nf-border cursor-not-allowed"
                  )}
                >
                  {deleting ? "جاري الحذف..." : "تأكيد الحذف النهائي"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium text-nf-muted hover:text-nf-text border border-nf-border hover:bg-nf-hover transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}
