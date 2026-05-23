"use client";

import { useState, useEffect } from "react";
import { Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";

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
  const [category, setCategory] = useState("gaming");
  const [modLevel, setModLevel] = useState<"open" | "moderate" | "restrict">("restrict");
  const [discordInvite, setDiscordInvite] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "beginners" | "experts">("all");
  const [welcomeBotEnabled, setWelcomeBotEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showInForum, setShowInForum] = useState(true);

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
        setCategory(data.category || "gaming");
        setModLevel(data.modLevel || "restrict");
        setDiscordInvite(data.discordInvite || "");
        setTargetAudience(data.targetAudience || "all");
        setWelcomeBotEnabled(data.welcomeBotEnabled !== false);
        setWelcomeMessage(data.welcomeMessage || "");
        setRules(data.rules || []);
        setTags(data.tags || []);
        setBookmarks(data.bookmarks || []);
        setStats(data.stats || []);
        setShowInForum(data.showInForum !== false);
      } catch (e) {
        console.error(e);
        showToast("خطأ في تحميل بيانات المجتمع", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [communityName, user]);

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
        category,
        modLevel,
        discordInvite: discordInvite.trim(),
        targetAudience,
        welcomeBotEnabled,
        welcomeMessage: sanitizeText(welcomeMessage),
        rules: rules.map(sanitizeText).filter(Boolean),
        tags: tags.map(sanitizeText).filter(Boolean),
        bookmarks: bookmarks
          .map((b) => ({ label: sanitizeText(b.label), url: b.url.trim() }))
          .filter((b) => b.label && isValidHttpUrl(b.url)),
        stats: stats
          .map((s) => ({ label: sanitizeText(s.label), value: sanitizeText(s.value) }))
          .filter((s) => s.label && s.value),
        showInForum,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

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
            <input value={shortDesc} onChange={e => setShortDesc(e.target.value)}
              className="w-full !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-nf-dim block mb-1">الوصف الكامل</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
              className="w-full !bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent transition-colors resize-none leading-relaxed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-nf-dim block mb-1">التصنيف</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full !bg-nf-body border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text outline-none focus:border-nf-accent">
                <option value="gamedev">🎮 تطوير ألعاب</option>
                <option value="gaming">🕹️ ألعاب</option>
                <option value="art3d">🎨 فن وتصميم</option>
                <option value="programming">💻 برمجة</option>
                <option value="showcase">✨ عرض مشاريع</option>
                <option value="discussion">💬 نقاشات</option>
                <option value="tutorial">📚 تعليم وشروحات</option>
                <option value="news">📰 أخبار وتقنية</option>
                <option value="music">🎵 موسيقى وصوتيات</option>
                <option value="animation">🎬 أنيميشن وفيديو</option>
                <option value="hardware">🖥️ أجهزة وهاردوير</option>
                <option value="mobile">📱 تطبيقات موبايل</option>
                <option value="ai">🤖 ذكاء اصطناعي</option>
                <option value="security">🔐 أمن معلومات</option>
                <option value="science">🔬 علوم وبحوث</option>
                <option value="sports">⚽ رياضة</option>
                <option value="photography">📷 تصوير</option>
                <option value="writing">✍️ كتابة وقصص</option>
                <option value="finance">💰 مال وأعمال</option>
                <option value="health">🏥 صحة ولياقة</option>
                <option value="travel">✈️ سفر وسياحة</option>
                <option value="food">🍕 طعام وطبخ</option>
                <option value="movies">🎥 أفلام ومسلسلات</option>
                <option value="books">📖 كتب وقراءة</option>
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
            {rules.map((rule, idx) => {
              const [title, detail] = rule.includes(" || ") ? rule.split(" || ") : [rule, ""];
              const isOpen = expandedRuleIdx === idx;
              return (
                <div key={idx} className="border-b border-nf-border-2/30 last:border-0">
                  <div className="flex items-center gap-3 py-2.5">
                    <span className="text-[11px] font-bold text-nf-accent shrink-0 w-4">{idx + 1}</span>
                    <button type="button" onClick={() => setExpandedRuleIdx(isOpen ? null : idx)}
                      className="flex-1 text-right text-[13px] text-nf-text">{title}</button>
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

        {/* Bookmarks */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">روابط مفيدة</p>
          <div className="grid grid-cols-2 gap-3">
            <input value={bookmarkLabel} onChange={e => setBookmarkLabel(e.target.value)} placeholder="الاسم"
              className="!bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
            <input value={bookmarkUrl} onChange={e => setBookmarkUrl(e.target.value)} placeholder="https://..."
              className="!bg-transparent border-b border-nf-border-2 px-0 py-2 text-[13px] text-nf-text font-mono placeholder:text-nf-dim/40 outline-none focus:border-nf-accent transition-colors" />
          </div>
          <button type="button" onClick={addBookMark} disabled={!bookmarkLabel.trim() || !bookmarkUrl.trim()}
            className="text-[12px] font-semibold text-nf-accent hover:text-nf-accent/70 disabled:opacity-40 transition-colors">
            + إضافة رابط
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
          <button type="button" onClick={onBack} disabled={saving}
            className="text-[12px] text-nf-dim hover:text-nf-text transition-colors">
            إلغاء
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl bg-nf-accent text-nf-primary text-[13px] font-bold hover:bg-nf-accent/80 disabled:opacity-40 transition-colors flex items-center gap-2">
            {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-nf-primary/30 border-t-nf-primary animate-spin" /> جاري الحفظ...</> : "حفظ"}
          </button>
        </div>

      </div>
    </div>
  );
}
