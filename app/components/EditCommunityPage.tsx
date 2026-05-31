"use client";

import { useState, useEffect } from "react";
import { Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { COMMUNITY_CATEGORIES, categoryToStoreValue, parseStoredCategory } from "@/lib/community-categories";
import { buildCommunityTagsField } from "@/lib/user-interests";

interface EditCommunityPageProps {
  communityName: string;
  onBack: () => void;
  onSaved: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const sanitizeText = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && !!parsed.hostname;
  } catch {
    return false;
  }
};

export default function EditCommunityPage({ communityName, onBack, onSaved, showToast }: EditCommunityPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // All editable fields
  const [shortDesc, setShortDesc] = useState("");
  const [desc, setDesc] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#a0a0a0");
  const [feedLayout, setFeedLayout] = useState<"classic" | "grid">("classic");
  const [langCode, setLangCode] = useState("ar");
  const [category, setCategory] = useState("");
  const [isMature, setIsMature] = useState(false);
  const [modLevel, setModLevel] = useState<"open" | "moderate" | "restrict">("restrict");
  const [discordInvite, setDiscordInvite] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "beginners" | "experts">("all");
  const [welcomeBotEnabled, setWelcomeBotEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showInForum, setShowInForum] = useState(true);
  const [flatSidebar, setFlatSidebar] = useState(false);
  const [communityType, setCommunityType] = useState<"public" | "restricted" | "private">("public");

  // Rules
  const [rules, setRules] = useState<string[]>([]);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [expandedRuleIdx, setExpandedRuleIdx] = useState<number | null>(null);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<{ label: string; url: string }[]>([]);
  const [bookmarkLabel, setBookmarkLabel] = useState("");
  const [bookmarkUrl, setBookmarkUrl] = useState("");

  // Useful Links
  const [usefulLinks, setUsefulLinks] = useState<{ label: string; url: string }[]>([]);
  const [usefulLinkLabel, setUsefulLinkLabel] = useState("");
  const [usefulLinkUrl, setUsefulLinkUrl] = useState("");

  // Draft Cache states
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Stats
  const [stats, setStats] = useState<{ label: string; value: string }[]>([]);
  const [statLabel, setStatLabel] = useState("");
  const [statValue, setStatValue] = useState("");

  // Load existing data
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "communities", communityName));
        if (!snap.exists()) {
          showToast("المجتمع غير موجود", "error");
          onBack();
          return;
        }
        const data = snap.data();
        
        if (user?.uid !== data.creatorUid) {
          // Check if user is admin/moderator
          const memberSnap = await getDoc(doc(db, "communities", communityName, "members", user!.uid)).catch(() => null);
          const role = memberSnap?.data()?.role;
          if (role !== "admin" && role !== "moderator") {
            showToast("ليس لديك صلاحية لتعديل هذا المجتمع", "error");
            onBack();
            return;
          }
        }
        setIsCreator(true);

        setShortDesc(data.shortDesc || "");
        setDesc(data.desc || "");
        setLogoUrl(data.img || "");
        setBannerUrl(data.banner || "");
        setAccentColor(data.accentColor || "#a0a0a0");
        setFeedLayout(data.feedLayout || "classic");
        setLangCode(data.langCode || "ar");
        setCategory(parseStoredCategory(data.category).selected);
        setIsMature(!!data.isMature);
        const loadedCType = data.communityType || (data.modLevel === "restrict" ? "private" : data.modLevel === "moderate" ? "restricted" : "public");
        setCommunityType(loadedCType);
        setModLevel(data.modLevel || "restrict");
        setDiscordInvite(data.discordInvite || "");
        setTargetAudience(data.targetAudience || "all");
        setWelcomeBotEnabled(data.welcomeBotEnabled !== false);
        setWelcomeMessage(data.welcomeMessage || "");
        setRules(data.rules || []);
        setTags(data.tags || []);
        setBookmarks(data.bookmarks || []);
        setUsefulLinks(data.usefulLinks || []);
        setStats(data.stats || []);
        setShowInForum(data.showInForum !== false);
        setFlatSidebar(data.flatSidebar || false);

        setIsLoaded(true);

        const draft = localStorage.getItem("nf-community-edit-draft-" + communityName);
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            const dbRules = data.rules || [];
            const dbTags = data.tags || [];
            const dbBookmarks = data.bookmarks || [];
            const dbUsefulLinks = data.usefulLinks || [];
            
            const hasDiff = 
              parsed.shortDesc !== (data.shortDesc || "") ||
              parsed.desc !== (data.desc || "") ||
              parsed.logoUrl !== (data.img || "") ||
              parsed.bannerUrl !== (data.banner || "") ||
              parsed.accentColor !== (data.accentColor || "#a0a0a0") ||
              parsed.feedLayout !== (data.feedLayout || "classic") ||
              parsed.langCode !== (data.langCode || "ar") ||
              parsed.category !== (data.category || "gaming") ||
              parsed.modLevel !== (data.modLevel || "restrict") ||
              parsed.communityType !== (data.communityType || "public") ||
              parsed.discordInvite !== (data.discordInvite || "") ||
              parsed.targetAudience !== (data.targetAudience || "all") ||
              parsed.welcomeBotEnabled !== (data.welcomeBotEnabled !== false) ||
              parsed.welcomeMessage !== (data.welcomeMessage || "") ||
              parsed.showInForum !== (data.showInForum !== false) ||
              parsed.flatSidebar !== (data.flatSidebar || false) ||
              JSON.stringify(parsed.rules) !== JSON.stringify(dbRules) ||
              JSON.stringify(parsed.tags) !== JSON.stringify(dbTags) ||
              JSON.stringify(parsed.bookmarks) !== JSON.stringify(dbBookmarks) ||
              JSON.stringify(parsed.usefulLinks) !== JSON.stringify(dbUsefulLinks);
              
            if (hasDiff) {
              setDraftData(parsed);
              setShowDraftModal(true);
            }
          } catch (e) {
            console.error("Error loading draft", e);
          }
        }
      } catch (e) {
        console.error(e);
        showToast("خطأ في تحميل بيانات المجتمع", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [communityName, user]);

  useEffect(() => {
    if (!isLoaded) return;
    const draftObj = {
      shortDesc, desc, logoUrl, bannerUrl, accentColor, feedLayout, langCode,
      category, modLevel, discordInvite, targetAudience, welcomeBotEnabled,
      welcomeMessage, rules, tags, bookmarks, usefulLinks, showInForum, flatSidebar,
      communityType, isMature
    };
    localStorage.setItem("nf-community-edit-draft-" + communityName, JSON.stringify(draftObj));
  }, [
    isLoaded, shortDesc, desc, logoUrl, bannerUrl, accentColor, feedLayout, langCode,
    category, modLevel, discordInvite, targetAudience, welcomeBotEnabled,
    welcomeMessage, rules, tags, bookmarks, usefulLinks, showInForum, flatSidebar, communityName,
    communityType, isMature
  ]);

  const restoreDraft = () => {
    if (draftData) {
      setShortDesc(draftData.shortDesc || "");
      setDesc(draftData.desc || "");
      setLogoUrl(draftData.logoUrl || "");
      setBannerUrl(draftData.bannerUrl || "");
      setAccentColor(draftData.accentColor || "#a0a0a0");
      setFeedLayout(draftData.feedLayout || "classic");
      setLangCode(draftData.langCode || "ar");
      setCategory(parseStoredCategory(draftData.category).selected);
      if (typeof draftData.isMature === "boolean") setIsMature(draftData.isMature);
      setModLevel(draftData.modLevel || "restrict");
      setCommunityType(draftData.communityType || "public");
      setDiscordInvite(draftData.discordInvite || "");
      setTargetAudience(draftData.targetAudience || "all");
      setWelcomeBotEnabled(draftData.welcomeBotEnabled !== false);
      setWelcomeMessage(draftData.welcomeMessage || "");
      setRules(draftData.rules || []);
      setTags(draftData.tags || []);
      setBookmarks(draftData.bookmarks || []);
      setUsefulLinks(draftData.usefulLinks || []);
      setShowInForum(draftData.showInForum !== false);
      setFlatSidebar(draftData.flatSidebar || false);
    }
    setShowDraftModal(false);
  };

  const discardDraft = () => {
    localStorage.removeItem("nf-community-edit-draft-" + communityName);
    setShowDraftModal(false);
  };

  const addRule = () => {
    const cleanTitle = sanitizeText(newRuleTitle);
    const cleanDesc = sanitizeText(newRuleDesc);
    if (!cleanTitle) return;
    const combinedRule = cleanTitle + (cleanDesc ? " || " + cleanDesc : "");
    if (rules.some((r) => r.split(" || ")[0].toLowerCase() === cleanTitle.toLowerCase())) {
      showToast("هذا القانون موجود مسبقاً", "error");
      return;
    }
    setRules([...rules, combinedRule]);
    setNewRuleTitle("");
    setNewRuleDesc("");
  };

  const addTag = () => {
    const cleanTag = sanitizeText(newTag);
    if (!cleanTag) return;
    if (tags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
      showToast("هذا الوسم موجود مسبقاً", "error");
      return;
    }
    setTags([...tags, cleanTag]);
    setNewTag("");
  };

  const addBookMark = () => {
    const cleanLabel = sanitizeText(bookmarkLabel);
    const cleanUrl = bookmarkUrl.trim();
    if (!cleanLabel || !cleanUrl) return;
    if (!isValidHttpUrl(cleanUrl)) {
      showToast("رابط المرجع غير صالح", "error");
      return;
    }
    setBookmarks([...bookmarks, { label: cleanLabel, url: cleanUrl }]);
    setBookmarkLabel("");
    setBookmarkUrl("");
  };

  const addUsefulLink = () => {
    const cleanLabel = sanitizeText(usefulLinkLabel);
    const cleanUrl = usefulLinkUrl.trim();
    if (!cleanLabel || !cleanUrl) return;
    if (!isValidHttpUrl(cleanUrl)) {
      showToast("رابط المرجع غير صالح", "error");
      return;
    }
    setUsefulLinks([...usefulLinks, { label: cleanLabel, url: cleanUrl }]);
    setUsefulLinkLabel("");
    setUsefulLinkUrl("");
  };

  const addStat = () => {
    const cleanLabel = sanitizeText(statLabel);
    const cleanValue = sanitizeText(statValue);
    if (!cleanLabel || !cleanValue) return;
    setStats([...stats, { label: cleanLabel, value: cleanValue }]);
    setStatLabel("");
    setStatValue("");
  };

  const handleSave = async () => {
    if (!user || !isCreator) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "communities", communityName), {
        shortDesc: sanitizeText(shortDesc),
        desc: sanitizeText(desc),
        img: logoUrl.trim(),
        banner: bannerUrl.trim(),
        accentColor,
        feedLayout,
        langCode,
        category: categoryToStoreValue(category),
        isMature: !!isMature,
        communityType,
        modLevel: communityType === "private" ? "restrict" : communityType === "restricted" ? "moderate" : "open",
        discordInvite: discordInvite.trim(),
        targetAudience,
        welcomeBotEnabled,
        welcomeMessage: sanitizeText(welcomeMessage),
        rules: rules.map(sanitizeText).filter(Boolean),
        tags: buildCommunityTagsField(categoryToStoreValue(category), tags.map(sanitizeText).filter(Boolean)),
        bookmarks: bookmarks
          .map((b) => ({ label: sanitizeText(b.label), url: b.url.trim() }))
          .filter((b) => b.label && isValidHttpUrl(b.url)),
        usefulLinks: usefulLinks
          .map((b) => ({ label: sanitizeText(b.label), url: b.url.trim() }))
          .filter((b) => b.label && isValidHttpUrl(b.url)),
        stats: stats
          .map((s) => ({ label: sanitizeText(s.label), value: sanitizeText(s.value) }))
          .filter((s) => s.label && s.value),
        showInForum,
        flatSidebar,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      localStorage.removeItem("nf-community-edit-draft-" + communityName);
      showToast("تم حفظ التغييرات بنجاح!", "success");
      onSaved();
    } catch (e: any) {
      showToast(`حدث خطأ: ${e?.message || "يرجى المحاولة لاحقاً"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[680px] mx-auto px-4 py-10 text-center">
        <div className="w-6 h-6 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-nf-dim mt-3">جاري التحميل...</p>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="w-full max-w-[640px] mx-auto px-4 py-10 text-center">
        <div className="w-5 h-5 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-6" style={{ direction: "rtl" }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-nf-dim hover:text-nf-text text-[12px] transition-colors">
          <ChevronUp size={14} className="rotate-90" /> رجوع
        </button>
        <h1 className="text-[15px] font-bold text-nf-text">تعديل n/{communityName}</h1>
      </div>

      <div className="space-y-5">

        {/* Basics */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">الوصف</p>
          <div>
            <label className="text-[11px] text-nf-dim block mb-1">الوصف القصير</label>
            <input value={shortDesc} onChange={e => setShortDesc(e.target.value)} maxLength={300}
              className="w-full !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent transition-colors" />
            <div className="text-[10px] text-nf-dim mt-1 text-left">{shortDesc.length} / 300</div>
          </div>
          <div>
            <label className="text-[11px] text-nf-dim block mb-1">الوصف الكامل</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} maxLength={3000}
              className="w-full !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent transition-colors resize-none leading-relaxed" />
            <div className="text-[10px] text-nf-dim mt-1 text-left">{desc.length} / 3000</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-nf-dim block mb-1">التصنيف</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full !bg-nf-body border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent">
                {COMMUNITY_CATEGORIES.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-nf-dim block mb-1">اللغة</label>
              <select value={langCode} onChange={e => setLangCode(e.target.value)}
                className="w-full !bg-nf-body border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent">
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="both">عربي + English</option>
              </select>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 px-3 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-2">
            <div className="flex-1">
              <p className="text-[12px] font-bold text-nf-text">مجتمع مخصص لفئة +18</p>
              <p className="text-[10px] text-nf-dim mt-1 leading-relaxed">
                تفعيل هذا الخيار يعني أن مجتمعك قد يحتوي على مناقشات حساسة، تجارب معقدة، أو لقطات ألعاب قوية.
                سيُطلب من الزوار تأكيد عمرهم قبل الدخول أو التفاعل.
              </p>
            </div>
            <button type="button" onClick={() => setIsMature(p => !p)}
              className={cn("w-11 h-6 rounded-full transition-all relative shrink-0",
                isMature ? "bg-amber-500" : "bg-nf-border-2")}>
              <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                isMature ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>

          {/* Privacy Type Selector */}
          <div className="pt-2">
            <label className="text-[11px] text-nf-dim block mb-1">خصوصية المجتمع</label>
            <select value={communityType} onChange={e => setCommunityType(e.target.value as any)}
              className="w-full !bg-nf-body border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent">
              <option value="public">🔓 عام (Public) - يستطيع أي شخص رؤية المنشورات والنشر</option>
              <option value="restricted">🔒 شبه خاص (Restricted) - يستطيع أي شخص رؤية المنشورات، ولكن المشرفين فقط ينشرون</option>
              <option value="private">👁️ خاص (Private) - المشرفون والأعضاء المعتمدون فقط يستطيعون رؤية المجتمع</option>
            </select>
          </div>
        </div>

        <div className="h-px bg-nf-border-2/30" />

        {/* Branding */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">الهوية البصرية</p>
          <div>
            <label className="text-[11px] text-nf-dim block mb-1">رابط الشعار</label>
            <div className="flex items-center gap-3">
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
                className="flex-1 !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text font-mono outline-none focus:border-nf-accent transition-colors" />
              {logoUrl && <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-nf-border-2 shrink-0" onError={e => (e.currentTarget.style.display="none")} />}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-nf-dim block mb-1">رابط البانر</label>
            <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..."
              className="w-full !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text font-mono outline-none focus:border-nf-accent transition-colors" />
            {bannerUrl && (
              <div className="mt-2 h-14 rounded-lg overflow-hidden border border-nf-border-2/50">
                <img src={bannerUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display="none")} />
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] text-nf-dim block mb-2">تخطيط المنشورات</label>
            <div className="flex gap-2">
              {([{ id: "classic", l: "كلاسيكي" }, { id: "grid", l: "شبكة" }] as const).map(opt => (
                <button key={opt.id} type="button" onClick={() => setFeedLayout(opt.id)}
                  className={cn("flex-1 py-1.5 rounded-lg border text-[12px] font-medium transition-all",
                    feedLayout === opt.id ? "border-nf-accent text-nf-accent" : "border-nf-border-2 text-nf-dim hover:text-nf-text")}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-nf-border-2/30" />

        {/* Rules */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">القوانين</p>
          <div className="space-y-0">
            {rules.map((rule: any, idx) => {
              const title = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[0] : rule) : (rule.title || "");
              const detail = typeof rule === "string" ? (rule.includes(" || ") ? rule.split(" || ")[1] : "") : (rule.body || "");
              const isOpen = expandedRuleIdx === idx;
              return (
                <div key={idx} className="border-b border-nf-border-2/30 last:border-0">
                  <div className="flex items-center gap-3.5 py-3">
                    <span className="w-5 h-5 rounded-full bg-nf-accent/15 border border-nf-accent/35 flex items-center justify-center text-[10px] font-black text-nf-accent shrink-0 shadow-sm select-none">
                      {idx + 1}
                    </span>
                    <button type="button" onClick={() => setExpandedRuleIdx(isOpen ? null : idx)}
                      className="flex-1 text-right text-[13px] font-bold text-nf-text hover:text-nf-accent transition-colors">{title}</button>
                    <ChevronDown size={13} className={cn("text-nf-dim shrink-0 transition-transform cursor-pointer", isOpen && "rotate-180")}
                      onClick={() => setExpandedRuleIdx(isOpen ? null : idx)} />
                    <button type="button" onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                      className="text-nf-dim hover:text-red-400 transition-colors shrink-0"><Trash2 size={12} /></button>
                  </div>
                  {isOpen && detail && (
                    <p className="text-[11px] text-nf-muted leading-relaxed pb-2.5 pr-5">{detail}</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="space-y-2 pt-1">
            <input value={newRuleTitle} onChange={e => setNewRuleTitle(e.target.value)} placeholder="عنوان القانون"
              className="w-full !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
            <textarea value={newRuleDesc} onChange={e => setNewRuleDesc(e.target.value)}
              placeholder="شرح القانون..." rows={3}
              className="w-full !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[12px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors resize-none leading-relaxed" />
            <button type="button" onClick={addRule} disabled={!newRuleTitle.trim()}
              className="text-[12px] font-semibold text-nf-accent hover:text-nf-accent/70 disabled:opacity-40 transition-colors">
              + إضافة قانون
            </button>
          </div>
        </div>

        <div className="h-px bg-nf-border-2/30" />

        {/* Tags */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">الوسوم</p>
          <div className="flex items-center gap-3">
            <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()}
              placeholder="أضف وسماً..."
              className="flex-1 !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
            <button type="button" onClick={addTag} disabled={!newTag.trim()}
              className="text-[12px] font-semibold text-nf-accent hover:text-nf-accent/70 disabled:opacity-40 transition-colors shrink-0">
              إضافة
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-nf-secondary/50 border border-nf-border-2/50 text-[11px] text-nf-muted">
                  #{tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-400 transition-colors"><X size={9} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-nf-border-2/30" />

        {/* Bookmarks & Useful Links */}
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">روابط المجتمع (Community Bookmarks)</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={bookmarkLabel} onChange={e => setBookmarkLabel(e.target.value)} placeholder="الاسم"
                className="!bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
              <input value={bookmarkUrl} onChange={e => setBookmarkUrl(e.target.value)} placeholder="https://..."
                className="!bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text font-mono placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
            </div>
            <button type="button" onClick={addBookMark} disabled={!bookmarkLabel.trim() || !bookmarkUrl.trim()}
              className="text-[12px] font-semibold text-nf-accent hover:text-nf-accent/70 disabled:opacity-40 transition-colors">
              + إضافة رابط مجتمع
            </button>
            {bookmarks.length > 0 && (
              <div className="space-y-0">
                {bookmarks.map((bm, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-nf-border-2/20 last:border-0">
                    <span className="text-[12px] text-nf-text">{bm.label}</span>
                    <button onClick={() => setBookmarks(bookmarks.filter((_, i) => i !== idx))} className="text-nf-dim hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">روابط مفيدة (Useful Links)</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={usefulLinkLabel} onChange={e => setUsefulLinkLabel(e.target.value)} placeholder="الاسم"
                className="!bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
              <input value={usefulLinkUrl} onChange={e => setUsefulLinkUrl(e.target.value)} placeholder="https://..."
                className="!bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text font-mono placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
            </div>
            <button type="button" onClick={addUsefulLink} disabled={!usefulLinkLabel.trim() || !usefulLinkUrl.trim()}
              className="text-[12px] font-semibold text-nf-accent hover:text-nf-accent/70 disabled:opacity-40 transition-colors">
              + إضافة رابط مفيد
            </button>
            {usefulLinks.length > 0 && (
              <div className="space-y-0">
                {usefulLinks.map((ul, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-nf-border-2/20 last:border-0">
                    <span className="text-[12px] text-nf-text">{ul.label}</span>
                    <button onClick={() => setUsefulLinks(usefulLinks.filter((_, i) => i !== idx))} className="text-nf-dim hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-nf-border-2/30" />

        {/* Visibility */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-[13px] font-medium text-nf-text">الظهور في المنتدى</p>
            <p className="text-[10px] text-nf-dim mt-0.5">يظهر مجتمعك في قائمة المجتمعات</p>
          </div>
          <button type="button" onClick={() => setShowInForum(p => !p)}
            className={cn("w-10 h-5 rounded-full transition-all relative shrink-0", showInForum ? "bg-nf-accent" : "bg-nf-border-2")}>
            <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", showInForum ? "left-[22px]" : "left-0.5")} />
          </button>
        </div>



        {/* Save */}
        <div className="flex items-center justify-between pt-3 border-t border-nf-border-2/30">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} disabled={saving}
              className="text-[12px] text-nf-dim hover:text-nf-text transition-colors">
              إلغاء
            </button>
            <button type="button" onClick={() => {
              localStorage.setItem("nf-community-preview", JSON.stringify({
                name: communityName,
                shortDesc: shortDesc.trim(),
                desc: desc.trim(),
                logoUrl: logoUrl.trim(),
                bannerUrl: bannerUrl.trim(),
                category,
                communityType,
                rules: rules.map((r, i) => {
                  if (typeof r === "string") {
                    const parts = r.includes(" || ") ? r.split(" || ") : [r, ""];
                    return { title: parts[0], body: parts[1] || "" };
                  }
                  return r;
                }),
                tags: tags.map((t, i) => ({ text: t, color: i })),
                bookmarks,
                usefulLinks,
                flatSidebar,
                isPreview: true,
                timestamp: Date.now()
              }));
              window.open("/app?community=" + encodeURIComponent(communityName) + "&preview=true", "_blank");
            }}
              className="text-[12px] text-nf-accent hover:underline font-bold transition-all">
              👁 معاينة قبل النشر
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => {
              const draftObj = {
                shortDesc, desc, logoUrl, bannerUrl, accentColor, feedLayout, langCode,
                category, modLevel, discordInvite, targetAudience, welcomeBotEnabled,
                welcomeMessage, rules, tags, bookmarks, usefulLinks, showInForum, flatSidebar,
                communityType, isMature
              };
              localStorage.setItem("nf-community-edit-draft-" + communityName, JSON.stringify(draftObj));
              showToast("تم حفظ المسودة محلياً بنجاح!", "success");
            }}
              className="px-4 py-2 rounded-xl bg-[#1d1f20] hover:bg-[#282a2b] border border-white/[0.06] text-[12px] font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              حفظ المسودة
            </button>
            
            <button type="button" onClick={() => {
              const saved = localStorage.getItem("nf-community-edit-draft-" + communityName);
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  setDraftData(parsed);
                  setShowDraftModal(true);
                } catch {
                  showToast("فشل في تحميل المسودة", "error");
                }
              } else {
                showToast("لا توجد مسودة محفوظة لهذا المجتمع", "info");
              }
            }}
              className="px-4 py-2 rounded-xl bg-[#1d1f20] hover:bg-[#282a2b] border border-white/[0.06] text-[12px] font-bold text-[#a8aaac] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              استعادة المسودة
            </button>

            <button type="button" onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 transition-colors flex items-center gap-2 cursor-pointer">
              {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-nf-primary/30 border-t-nf-primary animate-spin" /> جاري النشر...</> : "نشر"}
            </button>
          </div>
        </div>

      {showDraftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#121314] border border-white/5 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200" style={{ direction: "rtl", textAlign: "right" }}>
            <h3 className="text-sm font-bold text-white mb-2">استعادة التعديلات غير المحفوظة</h3>
            <p className="text-xs text-nf-muted leading-relaxed mb-6">
              لقد وجدت مسودة لتعديلات سابقة قمت بها على مجتمع <strong>n/{communityName}</strong> ولم تنشر بعد. هل ترغب في استعادة هذه التعديلات ومواصلة العمل عليها؟
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={discardDraft} className="px-4 py-2 rounded-xl text-[11px] font-bold text-nf-dim hover:text-white transition-colors bg-white/5 hover:bg-white/10">
                تجاهل والبدء من جديد
              </button>
              <button onClick={restoreDraft} className="px-4 py-2 rounded-xl text-[11px] font-bold bg-nf-accent text-nf-primary hover:bg-nf-accent/80 transition-colors">
                استعادة المسودة
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
