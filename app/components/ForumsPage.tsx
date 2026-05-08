"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Pin, Lock, ChevronRight, Plus, Clock,
  User, Send, X, Flame, Search, Eye, Bookmark, ArrowRight,
  CheckCircle2, AlertCircle, Link2, Play, ExternalLink, MoreHorizontal, Trash2,
  Edit3, Copy, MessageCircle, Bold, Italic, Code, Image, Video,
  ArrowLeft, ArrowUp, ThumbsUp, ThumbsDown, Share2, Reply, Home, Star,
  HelpCircle, Lightbulb, Bug, Sparkles, BookOpen, Menu, Calendar, MessageCirclePlus,
  LogIn, Settings, Bell, TrendingUp, Shield, Award, BarChart3, Users, Activity, RotateCcw, ChevronDown, Check,
  FileCode, TextQuote, Strikethrough, Heading2, List, ListOrdered, AlertTriangle, Minus, Filter, UserPlus, SlidersHorizontal, Flag, Key, Zap, RefreshCw, Globe, Megaphone, Maximize2, Minimize2, Download, FileText, ChevronLeft, Quote
} from "lucide-react";
import { collection, getDocs, query, orderBy, limit, addDoc, doc, updateDoc, deleteDoc, setDoc, increment, getDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  fetchCommunityThreads, fetchAllCommunityThreads, fetchUserThreads,
  fetchReplies as fetchRepliesHelper, createThread, addReply,
  updateReply, deleteReply as deleteReplyHelper, deleteThread as deleteThreadHelper,
  voteThread, incrementViews, fetchUserProfile, saveUserProfile, searchUserByName,
  fetchCommunityStats, clearProfileCache,
  type ForumThread as ForumThreadType, type ReplyData as ReplyDataType, type UserProfile as UserProfileType
} from "@/lib/firebase-forum";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import ShareModal from "./ShareModal";
import ReportModal from "./ReportModal";
import ReactMarkdown from "react-markdown";

const AI_PROMPT = `أنت مساعد NorthFall — مساعد ذكي احترافي لمنصة مجتمعية عربية متخصصة في تطوير الألعاب والمحتوى الرقمي.

---

عن منصة NorthFall (أنت تعرف كل شيء عنها بالتفصيل الممل):

المنصة:
* اسمها NorthFall — منصة مجتمعية عربية متخصصة في تطوير الألعاب والمحتوى الرقمي
* الموقع: https://northfall.vercel.app
* تعمل بـ Next.js + React + TailwindCSS + Firebase (Firestore + Auth)
* التصميم: داكن (dark theme)، ألوان أساسية: accent (#7c3aed بنفسجي)، secondary، dim
* تدعم RTL (عربي) بالكامل

المجتمعات المتاحة (5 مجتمعات):
1. Unity — لتطوير الألعاب بمحرك Unity، يشمل C# وShader وAsset Store
2. Unreal — لتطوير الألعاب بمحرك Unreal Engine، يشمل Blueprint وC++ وNanite/Lumen
3. Godot — لتطوير الألعاب بمحرك Godot، يشمل GDScript وC# والـ Nodes
4. Blender — للنمذجة والأنيميشن والرندر، يشمل Modeling وSculpting وEEVEE/Cycles
5. عام — للنقاشات العامة عن الألعاب والتقنية والإبداع

أنواع المواضيع (6 أنواع):
* نقاش (discussion) — نقاش مفتوح
* سؤال (question) — سؤال يحتاج إجابة
* توتوريال (tutorial) — شرح تعليمي
* عرض مشروع (showcase) — عرض مشروع أو عمل
* مشكلة (issue) — مشكلة تحتاج حل
* فكرة (idea) — اقتراح أو فكرة جديدة

الميزات الكاملة:
* المنتدى: إنشاء مواضيع، إضافة ردود، تعديل/حذف المنشورات والردود
* التصويت: up/down على المواضيع، مع عداد الصوت
* الحفظ: حفظ المواضيع للمطالعة لاحقاً
* المتابعة: متابعة مجتمعات ومستخدمين
* الإشعارات: تنبيهات بالردود والتفاعلات
* البروفايل: نبذة شخصية، صورة بنر، روابط اجتماعية (GitHub, Twitter, YouTube, LinkedIn, Discord, Website)، عدد المتابعين، عدد المواضيع، الكارما
* الذكاء الاصطناعي: مدمج في المنتدى والتطبيق
* المشاركة: رابط الموضوع + Embed
* الإبلاغ: بلاغ عن محتوى مخالف
* Markdown: تنسيق كامل في المواضيع والردود (عناوين، كود، اقتباسات، قوائم، صور، فيديو، خط فاصل)
* عرض المجتمع: عدد المواضيع والردود لكل مجتمع
* الأعضاء المتصلون: عرض من متصل الآن
* سجل القراءة: تتبع المواضيع المقروءة

أدوات الذكاء الاصطناعي في المنتدى:
* محادثة ذكية: مساعد يرد على الأسئلة ويعرف كل شيء عن المنصة
* ملخص الموضوع: تلخيص الموضوع وكل الردود
* اقتراح رد: اقتراح رد مناسب بناءً على المحتوى
* أدوات الموضوع: ترجمة، شرح، توسيع، تصحيح، وسوم، نص محسّن
* أدوات الردود: شرح، ترجمة، تصحيح، نقاط، تحسين
* أنماط الكتابة: احترافي، إبداعي، عفوي، مبرمج
* اكتشاف @منشن: عند ذكر مستخدم يعرض بروفايله
* اكتشاف "اعرض بروفايلي": يعرض بطاقة بروفايل المستخدم

أدوات الذكاء الاصطناعي في التطبيق (PostCard/PostDetail):
* اشرح لي — شرح مبسط للمنشور
* لخّص — تلخيص مختصر
* ترجمة — ترجمة للغة المختارة
* تصحيح — تصحيح لغوي
* وسوم — اقتراح كلمات مفتاحية
* نص محسّن — نسخة محسّنة جاهزة للنشر

نماذج الذكاء الاصطناعي المتاحة:
* GPT-3.5 تجريبي (مجاني — ChatAnywhere)
* DeepSeek Chat (مجاني)
* Gemini 2.0 Flash (مجاني)
* Groq Llama 3.3 (مجاني)
* Groq Gemma 2 (مجاني)
* Mistral Small (مجاني)
* GPT-4o Mini (مدفوع)
* GPT-4.1 Nano (مدفوع)
* Gemini 2.5 Flash (مدفوع)
* Claude 3.5 Haiku (مدفوع)
* Mistral Medium (مدفوع)

الإعدادات:
* مفتاح API — المستخدم يضيف مفتاحه أو يستخدم التجريبي بدون مفتاح
* اختيار المزود والنموذج
* لغة الترجمة: إنجليزية، عربية، فرنسية، ألمانية، إسبانية، تركية، يابانية، كورية، صينية، روسية
* وضع المحادثة: احترافي / إبداعي / عفوي / مبرمج

قاعدة البيانات:
* Firestore: forums/{community}/threads/{threadId}/replies/{replyId}
* users/{uid} — بيانات المستخدم
* كل مجتمع collection منفصل

---

قواعد أساسية:
* افهم السؤال أولاً قبل الإجابة
* لا تكتب رد سريع أو سطحي
* نظّم الإجابة بشكل واضح ومنطقي
* لا تستخدم أسلوب رسمي ممل أو روبوتي
* لا تستخدم عناوين مثل "مجالات المناقشة" أو "الخطوات التالية"
* لا تكرر نفس الجمل أو الترحيب في كل رد
* لا تستخدم إيموجي

---

أسلوب الكتابة:
* اكتب بشكل طبيعي كأنك إنسان
* استخدم لغة عربية واضحة (فصحى بسيطة)
* خلي الأسلوب مريح وسلس
* لا تبالغ في الشرح، لكن لا تختصر بشكل مخل
* إذا الموضوع طويل → قسّمه بشكل ذكي

---

التفكير:
* فكّر قبل ما ترد
* إذا السؤال غير واضح → وضّح أو اسأل
* إذا في أكثر من حل → اعرض الأفضل أولاً
* إذا في خطأ عند المستخدم → صححه بأسلوب محترم

---

عند طلب شرح:
* ابدأ بالفكرة الأساسية
* ثم التفاصيل
* ثم مثال عملي (إذا ممكن)

---

عند طلب كتابة (موضوع / بوست):
* اكتب محتوى كامل وجاهز للنشر
* استخدم تنسيق واضح (فقرات، نقاط)
* اجعل النص جذاب وسهل القراءة

---

عند طلب برمجة:
* أعطِ كود نظيف وواضح
* أضف شرح بسيط ومباشر
* لا تكتب كود معقد بدون سبب

---

ممنوع:
* الردود العشوائية أو غير المرتبطة بالسؤال
* استخدام أسلوب مقال جامد
* الحشو بدون فائدة
* الخروج عن الموضوع

---

هدفك النهائي:
تقديم أفضل إجابة ممكنة، بشكل احترافي، واضح، ومفيد فعلاً للمستخدم. أنت تعرف NorthFall أفضل من أي حد — استخدم هالمعرفة لمساعدة المستخدمين.`;

const allCommunities = [
  { name: "Unity", img: "/assets/images/unitylogo.png", banner: "/assets/images/bannerunity.png", desc: "مكانك لو حابب تتعلم Unity وتشارك مشاريعك مع مطورين عرب.\nتواصل، اسأل، واطلع شغلك للعالم.", shortDesc: "تطوير ألعاب بيونتي — شارك تجاربك وأسئلتك", members: 0, threads: 0, replies: 0, founded: "2026", rules: ["احترام الجميع، لا للتحرش أو التنمر", "المحتوى يجب أن يكون متعلق بـ Unity", "لا سبام أو إعلانات غير مصرح بها", "شارك الكود والمشاريع بمصادر موثوقة", "لا تكرر المنشورات"], mods: [{ name: "NorthFall", role: "صانع المجتمع" }], tags: ["Unity", "GameDev", "C#", "3D", "2D", "AR/VR"], bookmarks: [{ label: "Unity Documentation", url: "https://docs.unity3d.com" }, { label: "Unity Learn", url: "https://learn.unity.com" }, { label: "Unity Asset Store", url: "https://assetstore.unity.com" }, { label: "Unity Forum", url: "https://forum.unity.com" }, { label: "Unity Discord", url: "https://discord.gg/unity" }] },
  { name: "Unreal", img: "/assets/images/unreallogo.svg", banner: "/assets/images/bannerunity.png", desc: "مجتمع مطوري Unreal Engine — تعلم Blueprints وC++\nواصل رحلتك في صناعة الألعاب مع مجتمع عربي داعم.", shortDesc: "تطوير ألعاب بأنريل — Blueprints وC++", members: 0, threads: 0, replies: 0, founded: "2026", rules: ["احترام الجميع، لا للتحرش أو التنمر", "المحتوى يجب أن يكون متعلق بـ Unreal Engine", "لا سبام أو إعلانات غير مصرح بها", "شارك مصادرك ومشاريعك بروابط موثوقة", "لا تكرر المنشورات"], mods: [{ name: "NorthFall", role: "صانع المجتمع" }], tags: ["Unreal", "Blueprints", "C++", "Nanite", "Lumen", "UE5"], bookmarks: [{ label: "Unreal Documentation", url: "https://docs.unrealengine.com" }, { label: "Unreal Learn", url: "https://learn.unrealengine.com" }, { label: "Unreal Marketplace", url: "https://www.unrealengine.com/marketplace" }, { label: "Unreal Forums", url: "https://forums.unrealengine.com" }] },
  { name: "Godot", img: "/assets/images/godotlogo.png", banner: "/assets/images/bannerunity.png", desc: "مجتمع المحرك المفتوح المصدر Godot — من البداية للاحتراف\nاكتشف قوة GDScript وC# في بيئة مجانية بالكامل.", shortDesc: "المحرك المفتوح المصدر — GDScript وC#", members: 0, threads: 0, replies: 0, founded: "2026", rules: ["احترام الجميع، لا للتحرش أو التنمر", "المحتوى يجب أن يكون متعلق بـ Godot", "لا سبام أو إعلانات غير مصرح بها", "شارك الكود المصدري whenever possible", "لا تكرر المنشورات"], mods: [{ name: "NorthFall", role: "صانع المجتمع" }], tags: ["Godot", "GDScript", "OpenSource", "2D", "3D", "Indie"], bookmarks: [{ label: "Godot Documentation", url: "https://docs.godotengine.org" }, { label: "Godot Learn", url: "https://docs.godotengine.org/en/stable/getting_started/introduction/index.html" }, { label: "Godot Asset Library", url: "https://godotengine.org/asset-library" }, { label: "Godot Discord", url: "https://discord.gg/godotengine" }] },
  { name: "Blender", img: "/assets/images/logoblender.png", banner: "/assets/images/bannerunity.png", desc: "مجتمع Blender العربي — نمذجة، رسم، وتحريك ثلاثي الأبعاد\nمن البداية للمشاريع الاحترافية مع مجتمع مبدعين.", shortDesc: "نمذجة ورسم وتحريك ثلاثي الأبعاد", members: 0, threads: 0, replies: 0, founded: "2026", rules: ["احترام الجميع، لا للتحرش أو التنمر", "المحتوى يجب أن يكون متعلق بـ Blender", "لا سبام أو إعلانات غير مصرح بها", "شارك ملفات Blender بمصادر موثوقة", "لا تكرر المنشورات"], mods: [{ name: "NorthFall", role: "صانع المجتمع" }], tags: ["Blender", "3D", "Modeling", "Animation", "Sculpting", "Eevee"], bookmarks: [{ label: "Blender Documentation", url: "https://docs.blender.org" }, { label: "Blender Tutorials", url: "https://www.blender.org/support/tutorials/" }, { label: "Blender Market", url: "https://blendermarket.com" }, { label: "Blender Artists", url: "https://blenderartists.org" }] },
  { name: "عام", img: "", banner: "/assets/images/bannerunity.png", desc: "نقاشات عامة حول تطوير الألعاب والبرمجة والمشاريع التقنية\nمكانك للتبادل المعرفي وبناء مجتمع مطورين عرب أقوى.", shortDesc: "نقاشات عامة حول تطوير الألعاب والبرمجة", members: 0, threads: 0, replies: 0, founded: "2026", rules: ["احترام الجميع، لا للتحرش أو التنمر", "المحتوى يجب أن يكون متعلق بتطوير الألعاب أو البرمجة", "لا سبام أو إعلانات غير مصرح بها", "شارك بفائدة وأضف قيمة للنقاش", "لا تكرر المنشورات"], mods: [{ name: "NorthFall", role: "صانع المجتمع" }], tags: ["GameDev", "Programming", "عربي", "Indie", "تعلم", "مشاريع"], bookmarks: [{ label: "GameDev Stack", url: "https://gamedev.stackexchange.com" }, { label: "Itch.io", url: "https://itch.io" }, { label: "Game Jolt", url: "https://gamejolt.com" }] },
];

const threadTypes = [
  { id: "discussion", label: "نقاش", icon: MessageCircle, color: "text-nf-accent", bg: "bg-nf-accent/10" },
  { id: "question", label: "سؤال", icon: HelpCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
  { id: "tutorial", label: "توتوريال", icon: BookOpen, color: "text-green-400", bg: "bg-green-400/10" },
  { id: "showcase", label: "عرض مشروع", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: "bug", label: "مشكلة", icon: Bug, color: "text-red-400", bg: "bg-red-400/10" },
  { id: "idea", label: "فكرة", icon: Lightbulb, color: "text-yellow-400", bg: "bg-yellow-400/10" },
];

type ViewMode = "list" | "thread" | "new" | "profile" | "community" | "ai";
type SortMode = "latest" | "popular" | "pinned" | "unsolved" | "views";

interface ForumThread {
  id: string; title: string; body: string; authorName: string; authorUid: string; authorPhoto?: string;
  community: string; pinned?: boolean; locked?: boolean; solved?: boolean; replyCount: number;
  lastReplyAt?: string; lastReplyBy?: string; lastReplyByPhoto?: string; createdAt: string;
  tags?: string[]; views?: number; type?: string; votes?: number;
}

interface ReplyData {
  id: string; text: string; authorName: string; authorUid: string; authorPhoto?: string;
  createdAt: string; votes?: number; edited?: boolean; quotedThreadId?: string;
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  try {
    const d = typeof ts === "string" ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date(ts));
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "الآن"; if (s < 3600) return `${Math.floor(s / 60)}د`; if (s < 86400) return `${Math.floor(s / 3600)}س`; if (s < 2592000) return `${Math.floor(s / 86400)}ي`; return `${Math.floor(s / 2592000)}ش`;
  } catch { return ""; }
}

function formatDate(ts: any): string {
  if (!ts) return "";
  try { const d = typeof ts === "string" ? new Date(ts) : (ts.toDate ? ts.toDate() : new Date(ts)); return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

function getTypeInfo(type?: string) { return threadTypes.find(tt => tt.id === type) || threadTypes[0]; }

function extractUrls(text: string): { url: string; type: "youtube" | "streamable" | "twitch" | "twitter" | "vimeo" | "image" | "link" }[] {
  const urlRegex = /https?:\/\/[^\s<>"']+/g; const matches = text.match(urlRegex) || [];
  return matches.map(url => {
    if (/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(url)) return { url, type: "youtube" as const };
    if (/streamable\.com\//.test(url)) return { url, type: "streamable" as const };
    if (/twitch\.tv\//.test(url)) return { url, type: "twitch" as const };
    if (/(?:twitter\.com|x\.com)\//.test(url)) return { url, type: "twitter" as const };
    if (/vimeo\.com\//.test(url)) return { url, type: "vimeo" as const };
    if (/\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) return { url, type: "image" as const };
    return { url, type: "link" as const };
  });
}

function getYouTubeId(url: string): string | null { const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/); return m ? m[1] : null; }
function getStreamableId(url: string): string | null { const m = url.match(/streamable\.com\/([a-zA-Z0-9]+)/); return m ? m[1] : null; }
function getTwitchVideo(url: string): { channel: string | null; video: string | null } { const chM = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/); const vidM = url.match(/twitch\.tv\/videos\/([0-9]+)/); return { channel: chM ? chM[1] : null, video: vidM ? vidM[1] : null }; }
function getVimeoId(url: string): string | null { const m = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/); return m ? m[1] : null; }

// VS Code Dark+ theme colors for syntax highlighting
const HL_C = {
  kw: "#c586c0", kw2: "#569cd6", fn: "#dcdcaa", num: "#b5cea8", str: "#ce9178",
  cm: "#6a9955", prop: "#9cdcfe", val: "#ce9178", tag: "#569cd6", attr: "#9cdcfe",
  sel: "#d7ba7d", hex: "#d7ba7d", type: "#4ec9b0", op: "#d4d4d4", var_: "#9cdcfe", bool: "#569cd6",
};

function hlCode(code: string, lang: string): string {
  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  type Seg = { t: string; v: string };
  const segs: Seg[] = [];
  const re = /\/\*[\s\S]*?\*\/|\/\/.*$|(["'`])(?:(?!\1)[^\\]|\\.)*\1/gm;
  let li = 0, m: RegExpExecArray | null;
  while ((m = re.exec(esc)) !== null) {
    if (m.index > li) segs.push({ t: "c", v: esc.slice(li, m.index) });
    segs.push({ t: m[0].startsWith("/*") || m[0].startsWith("//") ? "cm" : "s", v: m[0] });
    li = m.index + m[0].length;
  }
  if (li < esc.length) segs.push({ t: "c", v: esc.slice(li) });
  return segs.map(s => s.t === "cm" ? `<span style="color:${HL_C.cm};font-style:italic">${s.v}</span>` : s.t === "s" ? `<span style="color:${HL_C.str}">${s.v}</span>` : hlz(s.v, lang)).join("");
}

function hlz(s: string, lang: string): string {
  const l = lang.toLowerCase();
  const kw = (w: string, c = HL_C.kw) => { s = s.replace(new RegExp(`\\b(${w})\\b`, "g"), `<span style="color:${c}">$1</span>`); };
  const nm = () => { s = s.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:${HL_C.num}">$1</span>`); };
  const fn = () => { s = s.replace(/(\w+)\s*\(/g, `<span style="color:${HL_C.fn}">$1</span>(`); };
  const hx = () => { s = s.replace(/(#[0-9a-fA-F]{3,8})/g, `<span style="color:${HL_C.hex}">$1</span>`); };
  const un = () => { s = s.replace(/(\d+)(px|em|rem|%|vh|vw|s|ms|deg|fr)/g, `<span style="color:${HL_C.num}">$1$2</span>`); };
  const vr = () => { s = s.replace(/(\$[\w]+)/g, `<span style="color:${HL_C.var_}">$1</span>`); };
  if (["css","scss","less","sass"].includes(l)) { s = s.replace(/([\w\-]+)\s*:/g, `<span style="color:${HL_C.prop}">$1</span>:`); hx(); un(); nm(); }
  else if (["js","ts","javascript","typescript","jsx","tsx"].includes(l)) { kw("const|let|var|function|return|if|else|for|while|do|switch|case|break|default|try|catch|throw|finally|yield|of|in|void|delete|super|static|new|typeof|instanceof"); kw("class|import|export|from|as|extends|implements|interface|type|enum|declare|readonly|abstract|async|await|require", HL_C.kw2); kw("true|false|null|undefined|NaN|Infinity|this", HL_C.bool); nm(); fn(); }
  else if (["python","py"].includes(l)) { kw("def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|global|nonlocal|async|await|del|assert"); kw("True|False|None|self|print", HL_C.kw2); nm(); fn(); }
  else if (["csharp","cs"].includes(l)) { kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|finally|new|yield|async|await"); kw("using|namespace|class|struct|interface|enum|public|private|protected|internal|static|readonly|const|virtual|override|abstract|sealed|this|base|ref|out|in", HL_C.kw2); kw("void|int|long|float|double|bool|string|var|null|true|false", HL_C.type); nm(); fn(); }
  else if (["gdscript","gd"].includes(l)) { kw("return|if|elif|else|for|while|break|continue|pass|match|yield|await"); kw("func|class|extends|var|const|onready|export|signal|enum|static|self|super|true|false|null|preload|load", HL_C.kw2); kw("void|int|float|bool|String|Vector2|Vector3|Color|Array|Dictionary", HL_C.type); nm(); fn(); }
  else if (["cpp","c","h","java","kotlin","kt","rust","rs","go","golang","ruby","rb","php","swift","sql","bash","sh","shell","lua","dart"].includes(l)) { kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|new|delete|typeof|instanceof|yield|async|await"); kw("const|let|var|function|class|import|export|from|as|extends|implements|interface|type|enum|static|this|super|def|print|self|fn|pub|use|mod|func|struct|enum|impl|trait|nil|null|true|false", HL_C.kw2); nm(); fn(); }
  else { kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|new|typeof|instanceof|yield|async|await"); kw("const|let|var|function|class|import|export|from|as|extends|implements|interface|type|enum|static|this|super|def|print|self", HL_C.kw2); nm(); fn(); }
  return s;
}

function hlInline(text: string): string {
  let s = text;
  s = s.replace(/\*\*(.+?)\*\*/g, '<b style="color:#fff;font-weight:700">$1</b>');
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i style="color:#ccc">$1</i>');
  s = s.replace(/~~(.+?)~~/g, '<span style="text-decoration:line-through;color:#6a6d6f">$1</span>');
  s = s.replace(/`(.+?)`/g, '<code style="background:#222;padding:1px 6px;border-radius:4px;font-size:13px;color:#ce9178;font-family:monospace;border:1px solid #333">$1</code>');
  // Link: [text](url) — but NOT [size=N] or [/size]
  s = s.replace(/\[([^\]\[]+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" class="text-nf-accent hover:underline">$1</a>');
  return s;
}

function CodeBlockWithCopy({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => {
    const extMap: Record<string, string> = { "javascript": "js", "typescript": "ts", "python": "py", "csharp": "cs", "cpp": "cpp", "c": "c", "html": "html", "css": "css", "json": "json", "gdscript": "gd" };
    const ext = extMap[lang.toLowerCase()] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const highlighted = hlCode(code, lang);
  const lines = code.split("\n");
  const lineNums = lines.map((_, i) => i + 1).join("\n");
  const langLabel = lang || "code";
  return (
    <div className="my-2 rounded-lg overflow-hidden border border-[#3c3c3c]">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <span className="text-[10px] text-[#858585] font-mono">{langLabel}</span>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="flex items-center gap-1 text-[9px] text-[#858585] hover:text-[#ccc] transition-colors font-mono">
            <Download size={10} /> تنزيل
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1 text-[9px] text-[#858585] hover:text-[#ccc] transition-colors font-mono">
            {copied ? <><Check size={10} className="text-[#28c840]" /> تم النسخ</> : <><Copy size={10} /> نسخ</>}
          </button>
        </div>
      </div>
      {/* Code area with line numbers - max height with scroll */}
      <div className="flex bg-[#1e1e1e] max-h-[500px] overflow-y-auto group/code relative">
        <div className="py-2 pl-2.5 pr-1.5 text-right select-none border-r border-[#3c3c3c] shrink-0 sticky left-0 z-10 bg-[#1e1e1e]">
          <pre className="font-mono text-[11px] leading-[1.5] text-[#555]">{lineNums}</pre>
        </div>
        <pre className="flex-1 px-3 py-2 font-mono text-[11px] leading-[1.5] overflow-x-auto" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    </div>
  );
}

function renderBody(text: string, onMentionClick?: (name: string) => void) {
  const elements: React.JSX.Element[] = [];

  // Step 1: Extract code blocks from ORIGINAL text first (preserve whitespace)
  const codeBlocks: { start: number; end: number; lang: string; code: string }[] = [];
  const codeRe = /```(\w*)\n([\s\S]*?)```/g;
  let cm: RegExpExecArray | null;
  while ((cm = codeRe.exec(text)) !== null) {
    codeBlocks.push({ start: cm.index, end: cm.index + cm[0].length, lang: cm[1] || "", code: cm[2] });
  }

  // Step 2: Remove code blocks from text, replace with placeholder
  // Use \x01\x02 as delimiters (not \x00 which gets eaten by whitespace collapse)
  let cleanText = text;
  for (let i = codeBlocks.length - 1; i >= 0; i--) {
    cleanText = cleanText.substring(0, codeBlocks[i].start) + `\x01CODE${i}\x02` + cleanText.substring(codeBlocks[i].end);
  }
  // Replace horizontal rules with placeholder BEFORE collapsing whitespace
  cleanText = cleanText.replace(/\n\s*-{3,}\s*\n/g, "\n\x01HR\x02\n");
  cleanText = cleanText.replace(/\n\s*\*{3,}\s*\n/g, "\n\x01HR\x02\n");
  cleanText = cleanText.replace(/\n\s*_{3,}\s*\n/g, "\n\x01HR\x02\n");

  // Pre-process [size=N]...[/size] BEFORE image/video/URL extraction
  // This prevents \x01\x02 placeholders from interfering with the regex
  const sizeBlocks: { size: number; content: string }[] = [];
  cleanText = cleanText.replace(/\[size=(\d+)\]([\s\S]+?)\[\/size\]/g, (_, sz, content) => {
    const n = Math.min(Math.max(parseInt(sz), 12), 28);
    const idx = sizeBlocks.length;
    sizeBlocks.push({ size: n, content: content.trim() });
    return `\x01SIZE${idx}\x02`;
  });

  // Replace markdown images ![](url) with inline placeholder
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: { url: string; alt: string }[] = [];
  let im: RegExpExecArray | null;
  while ((im = imgRe.exec(cleanText)) !== null) {
    const idx = images.length;
    images.push({ alt: im[1], url: im[2] });
    cleanText = cleanText.substring(0, im.index) + `\x01IMG${idx}\x02` + cleanText.substring(im.index + im[0].length);
    imgRe.lastIndex = 0;
  }

  // Replace video embeds [▶ فيديو](url) with inline placeholder
  const vidRe = /\[▶ فيديو\]\(([^)]+)\)/g;
  const videos: string[] = [];
  let vm: RegExpExecArray | null;
  while ((vm = vidRe.exec(cleanText)) !== null) {
    const idx = videos.length;
    videos.push(vm[1]);
    cleanText = cleanText.substring(0, vm.index) + `\x01VID${idx}\x02` + cleanText.substring(vm.index + vm[0].length);
    vidRe.lastIndex = 0;
  }

  // Extract remaining URLs (not already replaced as images/videos)
  const urls = extractUrls(cleanText);
  // Replace URLs with inline placeholders
  urls.forEach((u, i) => {
    cleanText = cleanText.replace(u.url, `\x01URL${i}\x02`);
  });

  // Collapse whitespace but preserve paragraph breaks (double newlines)
  cleanText = cleanText.replace(/\n{2,}/g, "\n\n");
  cleanText = cleanText.replace(/[ \t]{2,}/g, " ").trim();

  // Helper: render a media element by type
  const renderMedia = (type: string, url: string, idx: number) => {
    if (type === "youtube") { const vid = getYouTubeId(url); if (vid) return <div key={`yt-${idx}`} className="rounded-xl overflow-hidden my-3 max-w-[720px]"><div className="relative w-full" style={{ paddingBottom: "56.25%" }}><iframe src={`https://www.youtube.com/embed/${vid}`} className="absolute inset-0 w-full h-full" allowFullScreen /></div></div>; }
    if (type === "streamable") { const sid = getStreamableId(url); if (sid) return <div key={`st-${idx}`} className="rounded-xl overflow-hidden my-3 max-w-[720px]"><div className="relative w-full" style={{ paddingBottom: "56.25%" }}><iframe src={`https://streamable.com/e/${sid}`} className="absolute inset-0 w-full h-full" allowFullScreen /></div></div>; }
    if (type === "twitch") { const tw = getTwitchVideo(url); if (tw.video) return <div key={`tw-${idx}`} className="rounded-xl overflow-hidden my-3 max-w-[720px]"><div className="relative w-full" style={{ paddingBottom: "56.25%" }}><iframe src={`https://player.twitch.tv/?video=${tw.video}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&muted=true`} className="absolute inset-0 w-full h-full" allowFullScreen /></div></div>; if (tw.channel) return <a key={`tw-${idx}`} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-nf-secondary rounded-lg my-2 hover:bg-nf-secondary/40 text-[14px] text-purple-400 font-bold"><Play size={15} /> تويتش — {tw.channel}</a>; }
    if (type === "twitter") return <a key={`x-${idx}`} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-nf-secondary rounded-lg my-2 hover:bg-nf-secondary/40 text-[14px] text-nf-accent font-bold"><ExternalLink size={15} /> إكس / تويتر</a>;
    if (type === "vimeo") { const vid = getVimeoId(url); if (vid) return <div key={`vm-${idx}`} className="rounded-xl overflow-hidden my-3 max-w-[720px]"><div className="relative w-full" style={{ paddingBottom: "56.25%" }}><iframe src={`https://player.vimeo.com/video/${vid}`} className="absolute inset-0 w-full h-full" allowFullScreen /></div></div>; }
    if (type === "image") {
      const imgName = decodeURIComponent(url.split('/').pop() || "صورة").split('?')[0];
      return <div key={`img-${idx}`} className="my-4 group relative block">
        <img src={url} alt={imgName} className="max-w-[720px] rounded-xl max-h-[420px] object-contain cursor-pointer hover:brightness-90 transition-all" onClick={() => {
          const overlay = document.createElement('div');
          overlay.className = 'fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center cursor-zoom-out';
          overlay.onclick = () => overlay.remove();
          const img = document.createElement('img');
          img.src = url; img.className = 'max-w-[95vw] max-h-[95vh] object-contain rounded-lg';
          overlay.appendChild(img); document.body.appendChild(overlay);
        }} />
        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{imgName}</div>
      </div>;
    }
    return <a key={`link-${idx}`} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-nf-secondary rounded-lg my-2 hover:bg-nf-secondary/40 text-[14px] text-nf-accent font-medium group"><Link2 size={15} /> <span className="truncate max-w-[300px] group-hover:underline">{url}</span></a>;
  };

  // Placeholder regex: matches \x01TYPE IDX\x02
  const phRe = /\x01(\w+)(\d+)\x02/g;

  // Step 3: Parse the remaining markdown
  if (cleanText) {
    const lines = cleanText.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block placeholder
      const codeMatch = line.match(/^\x01CODE(\d+)\x02$/);
      if (codeMatch) {
        const idx = parseInt(codeMatch[1]);
        const cb = codeBlocks[idx];
        if (cb) elements.push(<CodeBlockWithCopy key={`code-${idx}`} code={cb.code} lang={cb.lang} />);
        continue;
      }

      // Image placeholder (inline) — standalone on its own line
      const imgMatch = line.match(/^\x01IMG(\d+)\x02$/);
      if (imgMatch) {
        const idx = parseInt(imgMatch[1]);
        const img = images[idx];
        if (img) elements.push(renderMedia("image", img.url, idx));
        continue;
      }

      // Video placeholder (inline)
      const vidMatch = line.match(/^\x01VID(\d+)\x02$/);
      if (vidMatch) {
        const idx = parseInt(vidMatch[1]);
        const url = videos[idx];
        if (url) {
          const uType = extractUrls(url);
          if (uType.length > 0) elements.push(renderMedia(uType[0].type, uType[0].url, idx));
          else elements.push(<a key={`vid-${idx}`} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-nf-secondary rounded-lg my-2 hover:bg-nf-secondary/40 text-[14px] text-nf-accent font-bold"><Play size={15} /> فيديو</a>);
        }
        continue;
      }

      // URL placeholder (inline) — standalone on its own line
      const urlMatch = line.match(/^\x01URL(\d+)\x02$/);
      if (urlMatch) {
        const idx = parseInt(urlMatch[1]);
        const u = urls[idx];
        if (u) elements.push(renderMedia(u.type, u.url, idx));
        continue;
      }

      // Size block placeholder — renders content with custom font size
      const sizeMatch = line.match(/^\x01SIZE(\d+)\x02/);
      if (sizeMatch) {
        const idx = parseInt(sizeMatch[1]);
        const sb = sizeBlocks[idx];
        if (sb) {
          const bold = sb.size >= 20 ? "font-weight:600;" : "";
          // Process content lines with hlInline for bold/italic/etc
          const contentHtml = sb.content.split('\n').map(l => hlInline(l)).join('<br/>');
          elements.push(<div key={`size-${idx}`} style={{ fontSize: `${sb.size}px`, lineHeight: '2.2' }} className="text-nf-text mt-4 mb-4 py-2" dangerouslySetInnerHTML={{ __html: contentHtml }} />);
          // Handle remaining text on the same line after the placeholder
          const remaining = line.slice(sizeMatch[0].length).trim();
          if (remaining) {
            const parts = remaining.split(/(@\S+)/g);
            let p = "";
            parts.forEach((part) => {
              if (part.startsWith("@") && part.length > 1) {
                const mentionName = part.slice(1);
                p += `<span class="text-blue-400 font-semibold cursor-pointer hover:text-blue-300 transition-colors mention-link" data-mention="${mentionName}">@${mentionName}</span>`;
              } else {
                p += hlInline(part);
              }
            });
            if (p.trim()) elements.push(<p key={`size-rem-${idx}`} className="text-[15px] text-nf-text leading-[2.2] mt-4" dangerouslySetInnerHTML={{ __html: p }} onClick={(e) => { const t = (e.target as HTMLElement).closest('.mention-link'); if (t) { const name = t.getAttribute('data-mention'); if (name && onMentionClick) onMentionClick(name); } }} />);
          }
        }
        continue;
      }

      // Indented code
      if (line.startsWith("    ") || line.startsWith("\t")) {
        const highlighted = hlCode(line.trimStart(), "");
        elements.push(<div key={i} className="bg-[#1e1e1e] rounded-lg px-4 py-2 font-mono text-[13px] border-r-2 border-[#6a9955]/40 my-1" dangerouslySetInnerHTML={{ __html: highlighted }} />);
        continue;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        const quoted = hlInline(line.slice(2));
        elements.push(<blockquote key={i} className="border-r-2 border-nf-accent/40 pr-4 my-1.5 text-[14px] text-nf-dim italic" dangerouslySetInnerHTML={{ __html: quoted }} />);
        continue;
      }

      // Heading
      if (line.startsWith("### ")) { elements.push(<h4 key={i} className="text-[14px] font-bold text-nf-accent mt-2 mb-1" dangerouslySetInnerHTML={{ __html: hlInline(line.slice(4)) }} />); continue; }
      if (line.startsWith("## ")) { elements.push(<h3 key={i} className="text-[15px] font-bold text-white mt-2 mb-1" dangerouslySetInnerHTML={{ __html: hlInline(line.slice(3)) }} />); continue; }
      if (line.startsWith("# ")) { elements.push(<h2 key={i} className="text-[17px] font-bold text-white mt-3 mb-1" dangerouslySetInnerHTML={{ __html: hlInline(line.slice(2)) }} />); continue; }

      // Horizontal rule (placeholder or raw)
      if (line === "\x01HR\x02" || line.match(/^---+$|^\*\*\*+$|^___+$/)) { elements.push(<hr key={i} className="my-4 border-nf-border" />); continue; }

      // Table
      if (line.includes("|") && line.trim().startsWith("|")) {
        const tableRows: string[][] = [];
        let j = i;
        while (j < lines.length && lines[j].includes("|") && lines[j].trim().startsWith("|")) {
          const row = lines[j].split("|").map(c => c.trim()).filter(c => c !== "");
          if (row.every(cell => /^[-:]+$/.test(cell))) { j++; continue; }
          tableRows.push(row);
          j++;
        }
        if (tableRows.length > 0) {
          const maxCols = Math.max(...tableRows.map(r => r.length));
          elements.push(
            <div key={`table-${i}`} className="my-2 overflow-x-auto rounded-lg border border-nf-border text-[11px]">
              <table className="w-full">
                <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri} className={ri === 0 ? "bg-nf-secondary/30" : "border-t border-nf-border/50"}>
                    {Array.from({ length: maxCols }).map((_, ci) => {
                      const cell = row[ci] || "";
                      const formatted = hlInline(cell);
                      return ri === 0
                        ? <th key={ci} className="px-2.5 py-1.5 text-right font-bold text-white" dangerouslySetInnerHTML={{ __html: formatted }} />
                        : <td key={ci} className="px-2.5 py-1.5 text-nf-muted" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    })}
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          );
          i = j - 1;
          continue;
        }
      }

      // Bulleted list
      if (line.match(/^[-*]\s/)) {
        const item = hlInline(line.replace(/^[-*]\s/, ""));
        elements.push(<div key={i} className="flex items-start gap-2.5 my-1"><span className="text-nf-accent mt-1">•</span><span className="text-[14px] text-nf-text flex-1 leading-[2]" dangerouslySetInnerHTML={{ __html: item }} /></div>);
        continue;
      }

      // Numbered list
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)?.[1] || "1";
        const item = hlInline(line.replace(/^\d+\.\s/, ""));
        elements.push(<div key={i} className="flex items-start gap-2.5 my-1"><span className="text-nf-accent font-bold text-[12px] mt-1 min-w-[16px] text-left">{num}.</span><span className="text-[14px] text-nf-text flex-1 leading-[2]" dangerouslySetInnerHTML={{ __html: item }} /></div>);
        continue;
      }

      // Empty line
      if (!line.trim()) { elements.push(<div key={i} className="h-2" />); continue; }

      // Normal paragraph with @mention support + inline media placeholders within text
      // Split by placeholders, render text parts with hlInline, render media parts inline
      const inlineParts: React.ReactNode[] = [];
      let remaining = line;
      let partIdx = 0;
      const inlinePhRe = /\x01(\w+)(\d+)\x02/g;
      let lastIdx = 0;
      let m: RegExpExecArray | null;
      inlinePhRe.lastIndex = 0;
      while ((m = inlinePhRe.exec(remaining)) !== null) {
        // Text before placeholder
        if (m.index > lastIdx) {
          const txt = remaining.substring(lastIdx, m.index);
          inlineParts.push(<span key={`txt-${partIdx++}`} dangerouslySetInnerHTML={{ __html: hlInline(txt) }} />);
        }
        const phType = m[1];
        const phIdx = parseInt(m[2]);
        if (phType === "IMG" && images[phIdx]) {
          inlineParts.push(renderMedia("image", images[phIdx].url, phIdx));
        } else if (phType === "VID" && videos[phIdx]) {
          const uType = extractUrls(videos[phIdx]);
          if (uType.length > 0) inlineParts.push(renderMedia(uType[0].type, uType[0].url, phIdx));
          else inlineParts.push(<a key={`vid-${phIdx}`} href={videos[phIdx]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-nf-secondary rounded-lg my-2 hover:bg-nf-secondary/40 text-[14px] text-nf-accent font-bold"><Play size={15} /> فيديو</a>);
        } else if (phType === "URL" && urls[phIdx]) {
          inlineParts.push(renderMedia(urls[phIdx].type, urls[phIdx].url, phIdx));
        } else if (phType === "SIZE" && sizeBlocks[phIdx]) {
          const sb = sizeBlocks[phIdx];
          const contentHtml = hlInline(sb.content);
          inlineParts.push(<span key={`size-${phIdx}`} style={{ fontSize: `${sb.size}px`, fontWeight: sb.size >= 20 ? 600 : undefined }} className="text-nf-text" dangerouslySetInnerHTML={{ __html: contentHtml }} />);
        }
        lastIdx = m.index + m[0].length;
      }
      // Remaining text after last placeholder
      if (lastIdx < remaining.length) {
        const txt = remaining.substring(lastIdx);
        inlineParts.push(<span key={`txt-${partIdx++}`} dangerouslySetInnerHTML={{ __html: hlInline(txt) }} />);
      }

      // Build paragraph with @mention support
      if (inlineParts.length > 0) {
        // Check if any part is a non-text element (media, size, etc) - if so, use inlineParts
        const hasSpecial = inlineParts.some(p => p && typeof p === 'object' && 'key' in (p as any) && !String((p as any).key).startsWith('txt-'));
        if (hasSpecial) {
          elements.push(<div key={`t-${i}`} className="text-[15px] text-nf-text leading-[2.2]">{inlineParts}</div>);
        } else {
          // Pure text paragraph with @mention support
          const parts = line.split(/(@\S+)/g);
          let p = "";
          parts.forEach((part) => {
            if (part.startsWith("@") && part.length > 1) {
              const mentionName = part.slice(1);
              p += `<span class="text-blue-400 font-semibold cursor-pointer hover:text-blue-300 transition-colors mention-link" data-mention="${mentionName}">@${mentionName}</span>`;
            } else {
              p += hlInline(part);
            }
          });
          if (p.trim()) elements.push(<p key={`t-${i}`} className="text-[15px] text-nf-text leading-[2.2]" dangerouslySetInnerHTML={{ __html: p }} onClick={(e) => { const t = (e.target as HTMLElement).closest('.mention-link'); if (t) { const name = t.getAttribute('data-mention'); if (name && onMentionClick) onMentionClick(name); } }} />);
        }
      }
    }
  }

  return <>{elements}</>;
}

function UserHoverCard({ name, photo, uid, children }: { name: string; photo?: string; uid: string; children: React.ReactNode }) {
  const [profile, setProfile] = useState<{ name: string; photo?: string; role: string; bio?: string; posts?: number; joinDate?: string; karma?: number; followers?: number; following?: number; isOnline?: boolean } | null>(null);
  const [show, setShow] = useState(false); const [loaded, setLoaded] = useState(false); const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadProfile = useCallback(async () => { if (loaded) return; try { const snap = await getDoc(doc(db, "users", uid)); if (snap.exists()) { const d = snap.data(); setProfile({ name: d.displayName || name, photo: d.photoURL || photo, role: d.role || "عضو", bio: d.bio, posts: d.postCount, joinDate: d.createdAt, karma: d.karma || 0, isOnline: d.lastSeen ? (Date.now() - new Date(d.lastSeen).getTime()) < 600000 : false }); } else setProfile({ name, photo, role: "عضو" }); setLoaded(true); } catch { setProfile({ name, photo, role: "عضو" }); setLoaded(true); } }, [uid, name, photo, loaded]);
  const handleEnter = () => { timeoutRef.current = setTimeout(() => { setShow(true); loadProfile(); }, 350); };
  const handleLeave = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => setShow(false), 200); };
  useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);
  return (
    <span className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>{show && profile && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.12 }} className="absolute z-50 bottom-full mb-2 right-0 w-[340px] bg-nf-card rounded-xl overflow-hidden border border-nf-border shadow-xl shadow-black/30" onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }} onMouseLeave={handleLeave}>
          {/* Banner */}
          <div className="relative h-[60px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-l from-nf-accent/20 via-nf-secondary to-nf-accent/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-nf-card to-transparent" />
          </div>
          {/* Main info */}
          <div className="px-5 -mt-6 relative z-10 pb-4">
            <div className="flex items-end gap-3 mb-3">
              {profile.photo ? <img src={profile.photo} alt="" className="w-14 h-14 rounded-full object-cover border-3 border-nf-card" /> : <div className="w-14 h-14 rounded-full bg-nf-muted flex items-center justify-center text-white text-[22px] font-bold border-3 border-nf-card">{(profile.name || "م")[0]}</div>}
              <div className="flex-1 min-w-0 pb-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-nf-text truncate inline-flex items-center gap-1.5">{profile.name}{(uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[16px] h-[16px] inline" />}</p>
                  {profile.isOnline && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-nf-accent font-medium">@{profile.name}</p>
              </div>
            </div>
            {profile.bio && <p className="text-[12px] text-nf-dim leading-[1.7] mb-3 line-clamp-2">{profile.bio}</p>}
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
              <div className="bg-nf-secondary/60 rounded-lg p-2">
                <div className="text-[13px] font-bold text-nf-text">{profile.posts || 0}</div>
                <div className="text-[9px] text-nf-dim">موضوع</div>
              </div>
              <div className="bg-nf-secondary/60 rounded-lg p-2">
                <div className="text-[13px] font-bold text-nf-text">{profile.karma || 0}</div>
                <div className="text-[9px] text-nf-dim">تأثير</div>
              </div>
              <div className="bg-nf-secondary/60 rounded-lg p-2">
                <div className="text-[13px] font-bold text-nf-text">{profile.followers || 0}</div>
                <div className="text-[9px] text-nf-dim">متابع</div>
              </div>
              <div className="bg-nf-secondary/60 rounded-lg p-2">
                <div className="text-[13px] font-bold text-nf-text">{profile.following || 0}</div>
                <div className="text-[9px] text-nf-dim">يتابع</div>
              </div>
            </div>
            {/* Role + join date */}
            <div className="flex items-center justify-between text-[11px] text-nf-dim font-medium border-t border-nf-border/50 pt-2.5">
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", profile.role === "مشرف" ? "bg-nf-accent/10 text-nf-accent" : profile.role === "إداري" ? "bg-red-400/10 text-red-400" : "bg-nf-secondary text-nf-dim")}>{profile.role}</span>
              {profile.joinDate && <span className="flex items-center gap-1"><Calendar size={10} className="text-nf-accent" /> انضم {timeAgo(profile.joinDate)}</span>}
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>
    </span>
  );
}

export default function ForumsPage() {
  const { user } = useAuth();
  const [selectedCommunity, setSelectedCommunity] = useState("عام");
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [allThreads, setAllThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // URL-based navigation for forum
  const getForumUrl = (newView: ViewMode, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ view: newView, ...extra });
    return `${window.location.pathname}?${params.toString()}`;
  };
  const navigateForum = (newView: ViewMode, extra: Record<string, string> = {}) => {
    setViewMode(newView);
    const url = getForumUrl(newView, extra);
    window.history.pushState({ view: newView, ...extra }, "", url);
    // Update browser tab title (like Reddit)
    const titleMap: Record<string, string> = {
      list: extra.community ? `n/${extra.community}` : "المنتدى",
      thread: extra.threadTitle || "موضوع",
      new: "موضوع جديد",
      profile: extra.profileName || "بروفايل",
      community: extra.community ? `n/${extra.community}` : "مجتمع",
      ai: "ذكاء اصطناعي",
    };
    document.title = (titleMap[newView] || "المنتدى") + " — Northfall Forum";
  };

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view") as ViewMode | null;
    if (v && ["list", "thread", "new", "profile", "community", "ai"].includes(v)) {
      setViewMode(v);
      const c = params.get("community"); if (c) setSelectedCommunity(c);
      const t = params.get("threadId"); if (t) { setActiveThreadId(t); openThread(t); }
      const u = params.get("profileUid"); if (u) { setProfileUid(u); setViewMode("profile"); }
      // Set tab title on direct URL load (new tab)
      const tt = params.get("threadTitle");
      const titleMap: Record<string, string> = {
        list: c ? `n/${c}` : "المنتدى",
        thread: tt || "موضوع",
        new: "موضوع جديد",
        profile: "بروفايل",
        community: c ? `n/${c}` : "مجتمع",
        ai: "ذكاء اصطناعي",
      };
      document.title = (titleMap[v] || "المنتدى") + " — Northfall Forum";
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view") as ViewMode | null;
      if (v && ["list", "thread", "new", "profile", "community", "ai"].includes(v)) {
        setViewMode(v);
        const c = params.get("community"); if (c) setSelectedCommunity(c);
        const t = params.get("threadId"); if (t) setActiveThreadId(t);
        const u = params.get("profileUid"); if (u) setProfileUid(u);
      } else {
        setViewMode("list");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const [newTitle, setNewTitle] = useState(""); const [newBody, setNewBody] = useState(""); const [newTags, setNewTags] = useState("");
  const [newCommunity, setNewCommunity] = useState(selectedCommunity); const [newType, setNewType] = useState("discussion");
  const [creating, setCreating] = useState(false);
  const [newPreview, setNewPreview] = useState(false);
  const [createBlur, setCreateBlur] = useState(false);
  // Reset blur when entering new thread view
  useEffect(() => { if (viewMode === "new") setCreateBlur(false); }, [viewMode]);
  const [profileTab, setProfileTab] = useState<"threads" | "replies" | "saved" | "awards">("threads");
  const [replies, setReplies] = useState<Record<string, ReplyData[]>>({});
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [savedThreads, setSavedThreads] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replySort, setReplySort] = useState<"oldest" | "newest">("oldest");
  const [replyTimeFilter, setReplyTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [replyPreview, setReplyPreview] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down">>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [quotedThreadId, setQuotedThreadId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [aiReplyContext, setAiReplyContext] = useState<string | null>(null);
  const [userPostCount, setUserPostCount] = useState(0);
  const [userJoinDate, setUserJoinDate] = useState<string>("");
  const [userBio, setUserBio] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("عضو");
  const [myProfileData, setMyProfileData] = useState<{ name: string; photo?: string; role: string; bio?: string; posts?: number; joinDate?: string; bannerUrl?: string; socialLinks?: Record<string, string>; followerCount?: number; followingCount?: number; isOnline?: boolean } | null>(null);
  const fetchMyProfile = async () => {
    if (!user) return null;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      let pd: any = { name: authorName, photo: authorPhoto, role: "عضو" };
      if (snap.exists()) {
        const d = snap.data();
        // Convert Firestore Timestamp to readable date
        let joinDateStr = "";
        if (d.createdAt) {
          try {
            const ts: any = d.createdAt;
            const date = ts.toDate ? ts.toDate() : new Date(ts);
            joinDateStr = date.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
          } catch { joinDateStr = String(d.createdAt); }
        }
        pd = { name: d.displayName || authorName, photo: d.photoURL || authorPhoto, role: d.role || "عضو", bio: d.bio || "", posts: d.postCount || 0, joinDate: joinDateStr, bannerUrl: d.bannerUrl || "", socialLinks: d.socialLinks || {}, isOnline: d.lastSeen ? (Date.now() - new Date(d.lastSeen).getTime()) < 600000 : false };
      }
      try { const fSnap = await getDocs(collection(db, "users", user.uid, "followers")); pd.followerCount = fSnap.size; const f2Snap = await getDocs(collection(db, "users", user.uid, "following")); pd.followingCount = f2Snap.size; } catch {}
      // Count actual threads from Firestore if postCount is 0 or missing
      if (!pd.posts || pd.posts === 0) {
        let actualCount = 0;
        try {
          for (const comm of allCommunities) {
            try { const tq = query(collection(db, "forums", comm.name, "threads"), where("authorUid", "==", user.uid)); const ts = await getDocs(tq); actualCount += ts.size; } catch {}
          }
        } catch {}
        // Fallback to allThreads
        if (actualCount === 0) {
          actualCount = allThreads.filter(t => t.authorUid === user.uid).length;
        }
        pd.posts = actualCount;
      }
      setMyProfileData(pd);
      return pd;
    } catch {
      const fallback = { name: authorName, photo: authorPhoto, role: userRole, bio: userBio, posts: allThreads.filter(t => t.authorUid === user?.uid).length || userPostCount, joinDate: userJoinDate, bannerUrl: "", socialLinks: {} as Record<string, string> };
      setMyProfileData(fallback);
      return fallback;
    }
  };
  const [lastReadHistory, setLastReadHistory] = useState<Record<string, { community: string; title: string; time: number }>>({});
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortOrderDropdownOpen, setSortOrderDropdownOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [threadSort, setThreadSort] = useState<"newest" | "oldest">("newest");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [communitySearch, setCommunitySearch] = useState("");
  const [joinedComms, setJoinedComms] = useState<{ name: string; img: string }[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportTarget, setReportTarget] = useState<"thread" | "reply">("thread");
  const [reportTargetId, setReportTargetId] = useState("");
  const [linkInputOpen, setLinkInputOpen] = useState<"new-link" | "new-image" | "new-video" | "reply-link" | "reply-image" | "reply-video" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [sizeMenuOpen, setSizeMenuOpen] = useState<"new" | "reply" | null>(null);
  const savedSel = useRef<{ ref: React.RefObject<HTMLTextAreaElement | null>; start: number; end: number; setter: (v: string | ((p: string) => string)) => void; getter: string } | null>(null);
  const saveSelection = (ref: React.RefObject<HTMLTextAreaElement | null>, setter: (v: string | ((p: string) => string)) => void, getter: string) => {
    const ta = ref.current;
    if (ta) savedSel.current = { ref, start: ta.selectionStart, end: ta.selectionEnd, setter, getter };
  };
  const applyFontSize = (sz: number) => {
    setFontSize(sz);
    if (savedSel.current) {
      const { ref, start, end, setter, getter } = savedSel.current;
      const ta = ref.current;
      if (ta) {
        const selected = getter.substring(start, end);
        const before = `[size=${sz}]`;
        const after = `[/size]\n`;
        const replacement = selected ? `${before}${selected}${after}` : `${before}${after}`;
        setter(getter.substring(0, start) + replacement + getter.substring(end));
        setTimeout(() => { ta.focus(); if (selected) { ta.selectionStart = start + before.length; ta.selectionEnd = start + before.length + selected.length; } else { ta.selectionStart = ta.selectionEnd = start + before.length; } }, 0);
      }
    }
    setSizeMenuOpen(null);
    savedSel.current = null;
  };
  const resetFontSize = () => {
    setFontSize(18);
  };
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState<"new" | "reply" | null>(null);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiProvider, setAiProvider] = useState<"chatgpt" | "gemini" | "claude" | "deepseek" | "groq" | "mistral" | "chatanywhere">("chatanywhere");
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConnected, setAiConnected] = useState<"unknown" | "testing" | "ok" | "fail">("unknown");
  const [aiMode, setAiMode] = useState<"pro" | "creative" | "casual" | "code">("pro");
  const [aiModeDropdown, setAiModeDropdown] = useState(false);
  const aiModeDropdownRef = useRef<HTMLDivElement>(null);
  // AI Chat state
  const [aiMessages, setAiMessages] = useState<{ id: string; role: "user" | "assistant"; content: string; isTyping?: boolean; ts?: number }[]>([]);
  // AI chat does NOT persist — fresh conversation each time
  const [aiInput, setAiInput] = useState("");
  const [aiModel, setAiModel] = useState(0);
  const [aiModelDropdown, setAiModelDropdown] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);
  const aiChatScrollRef = useRef<HTMLDivElement>(null);
  const [aiShowScrollBtn, setAiShowScrollBtn] = useState(false);
  const [aiResponseTimes, setAiResponseTimes] = useState<Record<string, number>>({});
  const [aiTypingPhase, setAiTypingPhase] = useState(0);
  const aiModelDropdownRef = useRef<HTMLDivElement>(null);
  // Typing animation: tracks how many chars are revealed per message id
  const [aiTypingProgress, setAiTypingProgress] = useState<Record<string, number>>({});
  // Enhanced AI features
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [aiMsgFeedback, setAiMsgFeedback] = useState<Record<string, "up" | "down">>({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiThreadSummary, setAiThreadSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiToolResult, setAiToolResult] = useState<{ label: string; text: string } | null>(null);
  const [aiToolLoading, setAiToolLoading] = useState(false);
  const [aiReplyResult, setAiReplyResult] = useState<Record<string, { label: string; text: string }>>({});
  const [aiReplyLoading, setAiReplyLoading] = useState<string | null>(null);
  const AI_MODELS = [
    { name: "GPT-3.5 تجريبي", provider: "chatanywhere", model: "gpt-3.5-turbo", free: true },
    { name: "DeepSeek Chat", provider: "deepseek", model: "deepseek-chat", free: true },
    { name: "Gemini 2.0 Flash", provider: "gemini", model: "gemini-2.0-flash", free: true },
    { name: "Groq Llama 3.3", provider: "groq", model: "llama-3.3-70b-versatile", free: true },
    { name: "Groq Gemma 2", provider: "groq", model: "gemma2-9b-it", free: true },
    { name: "Mistral Small", provider: "mistral", model: "mistral-small-latest", free: true },
    { name: "GPT-4o Mini", provider: "chatgpt", model: "gpt-4o-mini", free: false },
    { name: "GPT-4.1 Nano", provider: "chatgpt", model: "gpt-4.1-nano", free: false },
    { name: "Gemini 2.5 Flash", provider: "gemini", model: "gemini-2.5-flash-preview-05-20", free: false },
    { name: "Claude 3.5 Haiku", provider: "claude", model: "claude-3-5-haiku-20241022", free: false },
    { name: "Mistral Medium", provider: "mistral", model: "mistral-medium-latest", free: false },
  ];
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const newBodyRef = useRef<HTMLTextAreaElement>(null);
  const [searchFilter, setSearchFilter] = useState<"all"|"threads"|"replies"|"users"|"communities">("all");
  const [searchSort, setSearchSort] = useState<"relevance"|"newest"|"top">("relevance");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedSearchIdx, setSelectedSearchIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{ name: string; photo?: string; role: string; bio?: string; posts?: number; joinDate?: string; bannerUrl?: string; socialLinks?: Record<string, string>; threads?: ForumThread[]; followerCount?: number; followingCount?: number; isOnline?: boolean } | null>(null);
  const [authorCache, setAuthorCache] = useState<Record<string, { bannerUrl?: string; bio?: string; role?: string; joinDate?: string; isOnline?: boolean; followerCount?: number; followingCount?: number; karma?: number; postCount?: number; socialLinks?: Record<string, string> }>>({});
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [editSocialLinks, setEditSocialLinks] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState("");
  const [sharePostTitle, setSharePostTitle] = useState("");
  const [communityViewData, setCommunityViewData] = useState<typeof allCommunities[0] | null>(null);
  const [communityThreadCount, setCommunityThreadCount] = useState(0);
  const [communityReplyCount, setCommunityReplyCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<{ uid: string; name: string; photo?: string; role?: string }[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [viewedThreads, setViewedThreads] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null); const replyEndRef = useRef<HTMLDivElement>(null);

  const authorName = user?.displayName || "مستخدم"; const authorPhoto = user?.photoURL || ""; const authorUid = user?.uid || "anon";

  // Toast helper
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2000); };

  // Persist saved threads
  useEffect(() => { try { const s = localStorage.getItem("nf-saved-threads"); if (s) setSavedThreads(new Set(JSON.parse(s))); } catch {} }, []);
  useEffect(() => { if (savedThreads.size > 0) localStorage.setItem("nf-saved-threads", JSON.stringify([...savedThreads])); }, [savedThreads]);

  // Fetch joined communities from Firebase
  useEffect(() => {
    if (!user) { setJoinedComms([]); return; }
    async function fetchJoined() {
      try {
        const snap = await getDocs(collection(db, "users", user!.uid, "communities"));
        const commImgMap: Record<string, string> = {};
        allCommunities.forEach(c => { commImgMap[c.name] = c.img || ""; });
        const items = snap.docs.map(d => {
          const name = d.data().name || d.id;
          return { name, img: commImgMap[name] || "" };
        });
        setJoinedComms(items);
      } catch (e) { console.error(e); }
    }
    fetchJoined();
  }, [user]);

  // Persist followed communities
  const [followedCommunities, setFollowedCommunities] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  useEffect(() => { try { const f = localStorage.getItem("nf-followed-communities"); if (f) setFollowedCommunities(new Set(JSON.parse(f))); } catch {} }, []);
  useEffect(() => { if (followedCommunities.size > 0) localStorage.setItem("nf-followed-communities", JSON.stringify([...followedCommunities])); }, [followedCommunities]);
  useEffect(() => { try { const f = localStorage.getItem("nf-followed-users"); if (f) setFollowedUsers(new Set(JSON.parse(f))); } catch {} }, []);
  useEffect(() => { if (followedUsers.size > 0) localStorage.setItem("nf-followed-users", JSON.stringify([...followedUsers])); }, [followedUsers]);

  // AI Settings Persistence
  useEffect(() => { try { const m = localStorage.getItem("nf-ai-mode"); if (m) setAiMode(m as any); } catch {} }, []);
  useEffect(() => { if (aiMode !== "pro") localStorage.setItem("nf-ai-mode", aiMode); else localStorage.removeItem("nf-ai-mode"); }, [aiMode]);
  const toggleFollow = (name: string) => { const n = new Set(followedCommunities); if (n.has(name)) { n.delete(name); showToast("تم إلغاء المتابعة"); } else { n.add(name); showToast("تم المتابعة ✓"); } setFollowedCommunities(n); };
  const toggleFollowUser = async (uid: string) => {
    if (!user) return;
    const n = new Set(followedUsers);
    const isFollowing = n.has(uid);
    if (isFollowing) { n.delete(uid); } else { n.add(uid); }
    setFollowedUsers(n);
    try {
      const followerDocRef = doc(db, "users", uid, "followers", user.uid);
      const followingDocRef = doc(db, "users", user.uid, "following", uid);
      if (isFollowing) {
        await deleteDoc(followerDocRef);
        await deleteDoc(followingDocRef);
      } else {
        await setDoc(followerDocRef, { uid: user.uid, name: user.displayName || "مستخدم", photo: user.photoURL || "", followedAt: new Date().toISOString() });
        await setDoc(followingDocRef, { uid, followedAt: new Date().toISOString() });
      }
      // Update authorCache if loaded
      if (authorCache[uid]) {
        const newCount = isFollowing ? Math.max(0, (authorCache[uid].followerCount || 0) - 1) : (authorCache[uid].followerCount || 0) + 1;
        setAuthorCache(prev => ({ ...prev, [uid]: { ...prev[uid], followerCount: newCount } }));
      }
      showToast(isFollowing ? "تم إلغاء المتابعة" : "تم المتابعة ✓");
    } catch {
      // Revert on error
      const revert = new Set(followedUsers);
      if (isFollowing) revert.add(uid); else revert.delete(uid);
      setFollowedUsers(revert);
      showToast("حدث خطأ");
    }
  };

  // Persist votes
  useEffect(() => { try { const v = localStorage.getItem("nf-user-votes"); if (v) setUserVotes(JSON.parse(v)); } catch {} }, []);
  useEffect(() => { if (Object.keys(userVotes).length > 0) localStorage.setItem("nf-user-votes", JSON.stringify(userVotes)); }, [userVotes]);

  // Persist AI settings
  useEffect(() => { try { const k = localStorage.getItem("nf-ai-key"); if (k) { setAiApiKey(k); setAiConnected("unknown"); } const p = localStorage.getItem("nf-ai-provider") || "chatanywhere"; if (p) setAiProvider(p as any); } catch {} }, []);
  useEffect(() => { if (aiApiKey) localStorage.setItem("nf-ai-key", aiApiKey); }, [aiApiKey]);
  useEffect(() => { localStorage.setItem("nf-ai-provider", aiProvider); }, [aiProvider]);

  // AI System Prompt
  const AI_PROMPT = `أنت NorthFall AI — مساعد ذكي متقدم داخل منصة NorthFall.

الهوية:
- اسمك: NorthFall AI
- أنت جزء من المنصة — لست خدمة خارجية
- المنصة: NorthFall — مجتمع متخصص لصنّاع الألعاب والمحتوى الرقمي
- هدفك: مساعدة المستخدمين في كل شيء يخص المنصة والمحتوى والبرمجة والتقنية

معرفتك بالموقع:
- المجتمعات: Unity، Unreal، Godot، Blender، عام
- كل مجتمع فيه مواضيع وردود مع تصويت
- المستخدم يقدر: إنشاء موضوع، الرد، التصويت، الحفظ، المتابعة، تعديل بروفايله، الإبلاغ
- البروفايل: اسم، صورة، بانر، نبذة، روابط (X/YouTube/GitHub/Steam/Discord/موقع)، مواضيع، متابعين، دور
- أنواع المواضيع: نقاش، سؤال، تعليمي، مشروع، مشكلة، إعلان
- تنسيق Markdown مدعوم بالكامل
- الذكاء الاصطناعي متوفر في كل مكان: في المواضيع، الردود، المحادثة، إعدادات AI

مساعدة المستخدمين في الموقع — أهم شيء عندك:
- إذا سأل "كيف استخدم الموقع" أو "ساعدني بالموقع": اشرح له كل شي بالتفصيل
- اشرح المجتمعات: كل مجتمع مختص بموضوع معين، يقدر ينشئ مواضيع ويرد
- اشرح كيف ينشئ موضوع: يختار مجتمع → موضوع جديد → عنوان + محتوى → ينشر
- اشرح التفاعل: تصويت، حفظ، متابعة، رد، إبلاغ
- اشرح البروفايل: تعديل البايو، البانر، روابط التواصل، الصورة
- اشرح الإشعارات: تظهر عند الرد على موضوعه أو متابعته
- اشرح الذكاء الاصطناعي: يقدر يشرح، يلخص، يترجم، يوسع، يصحح، يقترح وسوم، يستخرج نقاط، يكتب حجة مضادة
- اشرح الإعدادات: يقدر يغير مزود AI، النموذج، مفتاح API، لغة الترجمة
- ساعد المستخدم الجديد خطوة بخطوة — كن صبور وواضح

معرفتك التقنية العميقة:
- Unity: MonoBehaviour، Coroutines، ScriptableObjects، ECS/DOTS، Shader Graph، URP/HDRP، NavMesh، Animator، Timeline، Cinemachine، Addressables، UI Toolkit، Input System، 2D/3D physics، Particle System، Post Processing
- Unreal: Blueprints، UMG، Material Editor، Niagara، Lumen، Nanite، World Partition، GAS، Enhanced Input، MetaHuman، Sequencer، C++ macros
- Godot: Nodes، Signals، GDScript، Scenes، ShaderLanguage، TileMap، NavigationRegion، AnimationPlayer، GDExtension، C#
- Blender: Modeling، Sculpting، UV، Shader Nodes، Geometry Nodes، Rigging، Animation، Compositing، Grease Pencil، Eevee/Cycles
- البرمجة: C#، C++، GDScript، Python، JavaScript، Rust، design patterns، SOLID، data structures
- Game Design: Level design، balancing، progression، UI/UX، narrative، procedural generation، networking
- Graphics: Shaders (HLSL، GLSL)، PBR، rendering، optimization، LOD
- Audio: FMOD، Wwise، spatial audio

طريقة التفكير:
1. حلل الطلب بعمق — ماذا يريد فعلاً؟
2. فكر بأفضل طريقة للإجابة
3. نظم الأفكار ثم اكتب رد نهائي واضح
4. لا تشرح خطوات التفكير
5. اربط بالسياق السابق تلقائياً
6. إذا سأل عن مشكلة تقنية: تشخيص ثم حل خطوة بخطوة
7. إذا سأل عن مقارنة: استخدم جدول

الذاكرة:
- تذكر كل ما قاله المستخدم في المحادثة
- اربط الأسئلة المتتابعة بالسياق
- إذا ذكر معلومة عن نفسه، استخدمها دائماً
- لا تسأل عن شيء أخبرك به مسبقاً

أسلوب الرد:
- بدون إيموجي نهائياً
- بدون تشكيل (فتحة، ضمة، كسرة، شدة) — عربي نظيف
- احكي باللهجة الأردنية — خليك عادي وودي، مو فصحى رسمية
- رد عميق ومنظم
- لا تكرر الجمل
- لا تبدأ بتحية — ادخل في الموضوع فوراً
- خاطب المستخدم باسمه الحقيقي
- كن مباشراً وصريحاً
- ردود طويلة ومفصلة — اشرح بعمق وأعطِ أمثلة وكود كامل
- لا تكتب كود مقطوع — اكتب الكود كاملاً من البداية للنهاية
- لا تختصر الكود بـ ... أو // باقي الكود — اكتبه كاملاً
- نظم ردك بأقسام — كل قسم بعنوان ## أو ### مع محتوى تحته

تنسيق Markdown — قواعد لا يمكن كسرها أبداً:
- ممنوع HTML نهائياً — لا تكتب أي tag HTML أبداً
- ممنوع BBCode — لا تكتب [size] [color] [b] أو أي كود BBCode أبداً
- إذا أردت عنوان كبير — اكتب ## العنوان
- إذا أردت عنوان فرعي — اكتب ### العنوان
- ممنوع #### أو ##### — فقط ## و ### مسموحين
- كل رد لازم يبدأ بـ ## العنوان الرئيسي تلقائياً بدون استثناء
- نظم ردك بأقسام: كل فكرة جديدة = عنوان ### جديد
- لا تكتب **عنوان** أبداً — العريض للكلمات داخل الفقرة فقط
- لا تكتب عنوان كسطر عادي — دائماً بـ ## أو ###
- القوائم: - للنقاط، 1. للمرقمة
- كود سطري: كلمة بين backtick واحد
- بلوك كود: ثلاث backticks ثم language ثم كود ثم ثلاث backticks — اكتب الكود كاملاً بدون قطع
- اقتباس: > نص
- مائل: *نص* — للكلمات المهمة داخل فقرة
- روابط: [النص](الرابط)

شرح الكود — قواعد خاصة:
- إذا طُلب شرح كود، لا تفكك كل سطر لوحده تحت #### عنوان
- لا تكتب #### using UnityEngine ثم شرح — هذا مقرف ومزعج
- بدل ذلك: اكتب الكود كامل في بلوك ثم اشرحه سطر سطر كفقرة عادية أو بقائمة
- مثال صحيح: اكتب الكود كامل في بلوك كود ثم اشرحه بقائمة مختصرة تحته
- مثال خاطئ (لا تفعل هذا أبداً): تفكك الكود سطر سطر تحت #### — هذا أسلوب مقرف!

الجداول — قواعد صارمة:
عند المقارنة أو عرض بيانات، استخدم جدول Markdown الصحيح:
| المعيار | الخيار أ | الخيار ب |
|---|---|---|
| السرعة | سريع | بطيء |
| السهولة | متوسط | سهل |

قواعد الجدول:
- السطر الأول: عناوين الأعمدة بين |
- السطر الثاني: |---| لكل عمود — هذا السطر إلزامي
- باقي الأسطر: البيانات بين |
- لا تضيف مسافات زائدة قبل أو بعد |
- كل سطر في الجدول لازم يبدأ وينتهي بـ |

إذا طُلب عرض بروفايل المستخدم:
- ستعطى لك بياناته الحقيقية كاملة — استخدمها كما هي
- اكتب وصفاً احترافياً بناءً على بياناته الفعلية فقط
- اذكر اسمه الحقيقي دائماً — لا تسمّيه NorthFall (هذا اسم المنصة)
- اذكر عدد المواضيع الفعلي والنبذة الحقيقية والروابط الحقيقية
- إذا عنده روابط اجتماعية، اذكر كل رابط بصيغة: [المنصة](الرابط)
- لا تخترع أي بيانات — لا تخترع مواضيع، لا تخترع روابط، لا تخترع نبذة
- إذا عدد المواضيع أكبر من 0، اذكر ذلك وأشيد بمشاركاته
- إذا النبذة فارغة، اقترح نبذة احترافية بناءً على اسمه ودوره

إذا طلب "ساعدني بالموقع" أو "كيف استخدم الموقع":
- اشرح أقسام الموقع: المجتمعات (Unity/Unreal/Godot/Blender/عام)، المواضيع، الردود، الإشعارات، البروفايل
- اشرح كيف ينشئ موضوعاً: يختار مجتمع → يضغط "موضوع جديد" → يكتب العنوان والمحتوى → ينشر
- اشرح التفاعل: تصويت، حفظ الموضوع، متابعة مستخدمين، الرد على المواضيع
- اشرح البروفايل: تعديل البايو، البانر، روابط التواصل الاجتماعي
- اشرح الإشعارات: تظهر عند الرد على موضوعك أو متابعتك
- اشرح الذكاء الاصطناعي: يمكنه تحسين النصوص، كتابة مواضيع، شرح مفاهيم

قواعد صارمة:
- التزم بالسؤال فقط — لا تخرج عن المطلوب
- إذا لم تفهم السؤال → اسأل عن التوضيح بدل الرد العشوائي
- لا تكتب كلام خارج الموضوع
- لا تعطي ردود ضعيفة أو قصيرة بدون فائدة
- احكي باللهجة الأردنية — عادي وودي، مو رسمي
- لا تستخدم أي إيموجي أبداً
- لا تكرر نفس المعلومة بصيغ مختلفة
- لا تستخدم أسلوب روبوتي — كن طبيعياً واحترافياً
- اكتب كأنك صاحبك مش روبوت
- لا تستخدم أسلوب مقالات رسمي زائد
- لا تقسّم الرد بشكل رسمي مبالغ فيه
- اجعل الرد طبيعي، مباشر، وواضح
- لا تسمّ المستخدم NorthFall أبداً — هذا اسم المنصة وليس اسمه
- إذا سُئلت عن شيء لا تعرفه، قل ذلك بصراحة بدل التخمين
- مجالك: تطوير الألعاب، المنصة، البرمجة، التصميم، الشيدرات، الصوت، المنتديات، المساعدة التقنية، تحسين المحتوى، النصائح العامة
- إذا سُئلت عن شيء خارج نطاقك (سياسة، طب، أنمي، رياضة، طبخ، سفر، دين، فلسفة) اعتذر بلطف: "هاد مو تخصصي، بس إذا بدك مساعدة بأشياء تخص المنصة أو البرمجة أو الألعاب أنا جاهز"

أنت مساعد احترافي متقدم هدفه تحسين جودة المحتوى وتجربة المستخدم داخل المنتدى. خليك عادي، احكي باللهجة الأردنية، وكن صديق المستخدم.`;

  // AI Config for stable, high-quality responses
  const AI_CONFIG = {
    temperature: 0.5,
    top_p: 0.92,
    presence_penalty: 0.15,
    frequency_penalty: 0.2,
    max_tokens: 4000,
  };

  // Helper: call AI via server proxy
  const callAI = async (provider: string, model: string, messages: { role: string; content: string }[], systemPrompt?: string): Promise<string> => {
    const contextMessages = messages.slice(-16);
    const key = aiApiKey || "";
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, messages: contextMessages, apiKey: key, systemPrompt, ...AI_CONFIG }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (provider === "gemini") return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (provider === "claude") return data.content?.[0]?.text || "";
    return data.choices?.[0]?.message?.content || "";
  };

  // Test API connection
  const testAiConnection = async () => {
    setAiConnected("testing");
    try {
      const res = await fetch(`/api/ai?provider=${aiProvider}&apiKey=${encodeURIComponent(aiApiKey || "")}`);
      const data = await res.json();
      setAiConnected(data.ok ? "ok" : "fail");
    } catch {
      setAiConnected("fail");
    }
  };

  const aiImprove = async (text: string, setter: (v: string | ((p: string) => string)) => void) => {
    if (!text.trim()) { showToast("اكتب نص أولاً"); return; }
    if (aiApiKey) {
      setAiLoading(true);
      try {
        const improved = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `حسّن هذا النص لمنتدى NorthFall. أعد صياغته بشكل احترافي مع الحفاظ على المعنى والأسلوب. أضف تنسيق Markdown إذا مناسب. أجب بالنص المحسّن فقط بدون شرح:\n\n${text}` }], `أنت محرر محترف في منتدى NorthFall. حسّن النص مع الحفاظ على المعنى. أجب بالنص المحسّن فقط بدون أي شرح أو مقدمات أو إيموجي.`);
        if (improved && improved.trim()) {
          setter(improved);
          showToast("تم التحسين بالذكاء الاصطناعي ✓");
        } else {
          showToast("الذكاء الاصطناعي لم يرجع نتيجة");
        }
      } catch (err: any) {
        showToast(`خطأ: ${(err?.message || "").slice(0, 80)}`);
      }
      setAiLoading(false);
    } else {
      showToast("أضف API key من الذكاء الاصطناعي أولاً");
    }
  };

  // AI Chat send
  // Dynamic system prompt with user context
  const getAISystemPrompt = () => {
    const userName = user?.displayName || "مستخدم";
    const modePrompts: Record<string, string> = {
      pro: `\n\n[وضع احترافي مفعّل]
أنت الآن في وضع احترافي. التزم بهذه القواعد بالإضافة للقواعد الأساسية:
- نظّم ردك بعناوين Markdown وقوائم
- استخدم الجداول للمقارنات
- فصّل الإجابة أكثر من المعتاد`,
      creative: `\n\n[وضع إبداعي مفعّل]
أنت الآن في وضع إبداعي. غيّر شخصيتك قليلاً:
- استخدم أسلوب مشوّق وقصصي أحياناً
- استخدم تشبيهات من عالم الألعاب والتقنية`,
      casual: `\n\n[وضع عفوي مفعّل]
أنت الآن في وضع عفوي. التزم بالتالي:
- ردود قصيرة جداً ومباشرة
- لغة يومية بسيطة
- لا تستخدم Markdown المعقد`,
      code: `\n\n[وضع مبرمج مفعّل]
أنت الآن في وضع البرمجة:
- ركز على كتابة الأكواد وحل المشاكل البرمجية
- اشرح الكود بوضوح
- اقترح أفضل الممارسات (Best Practices)`,
    };
    return `${AI_PROMPT}\n\nالمستخدم الحالي اسمه: ${userName}.${modePrompts[aiMode] || ""}`;
  };

  const aiChatSend = async (overrideInput?: string | React.FormEvent) => {
    // Abort any ongoing generation first
    if (aiGenerating) { aiAbortRef.current?.abort(); setAiGenerating(false); setAiLoading(false); setAiMessages(p => p.filter(m => !m.isTyping)); }
    const isEvent = overrideInput && typeof (overrideInput as any).preventDefault === 'function';
    if (isEvent) (overrideInput as React.FormEvent).preventDefault();
    const actualText = typeof overrideInput === "string" ? overrideInput : aiInput;
    if (!actualText.trim() && !aiReplyContext) return;
    const inputText = actualText.trim();
    const contextText = aiReplyContext;
    if (typeof overrideInput !== "string") setAiInput("");
    setAiReplyContext(null);

    // Detect "اعرض بروفايلي" typed manually
    if (/اعرض?\s?بروفايلي|بروفايلي|عرض\s?البروفايل|شوف\s?بروفايلي/.test(inputText) && user) {
      const pd = await fetchMyProfile();
      const userDisplay = { id: Math.random().toString(36).slice(2), role: "user" as const, content: inputText, isTyping: false, ts: Date.now() };
      const cardId = `profile-${Date.now()}`;
      const profileCard = { id: cardId, role: "assistant" as const, content: "__PROFILE_CARD__", isTyping: false, ts: Date.now() };
      const aiTypingId = `ai-${Date.now()}`;
      const aiTyping = { id: aiTypingId, role: "assistant" as const, content: "", isTyping: true, ts: Date.now() };
      setAiMessages(p => [...p, userDisplay, profileCard, aiTyping]);
      if (aiApiKey && pd) {
        setAiGenerating(true);
        try {
          const realName = pd.name === "NorthFall" ? (user?.displayName !== "NorthFall" ? user?.displayName : pd.name) : pd.name;
          const socialLinksStr = pd.socialLinks ? Object.entries(pd.socialLinks as Record<string, string>).filter(([, v]) => (v as string).trim()).map(([k, v]) => `[${k}](${(v as string).trim()})`).join(" — ") : "لا توجد";
          const profileContext = `اكتب وصف بروفايل مختصر وجذاب للمستخدم التالي. استخدم البيانات أدناه فقط ولا تخترع أي شيء.

بيانات المستخدم الحقيقية:
- الاسم: ${realName}
- الدور: ${pd.role || "عضو"}
- النبذة: "${pd.bio || "لا توجد نبذة"}"
- عدد المواضيع: ${pd.posts || 0}
- تاريخ الانضمام: ${pd.joinDate || "غير محدد"}
- متابعين: ${pd.followerCount || 0}
- متابَعين: ${pd.followingCount || 0}
- الروابط: ${socialLinksStr}

قواعد صارمة جداً:
1. لا تسمّ المستخدم NorthFall أبداً — هذا اسم المنصة. اسمه الحقيقي هو ${realName}
2. لا تخترع أي بيانات — لا مهارات، لا اهتمامات، لا إحصائيات غير المذكورة أعلاه
3. لا تقل "لا تتوفر معلومات" — إذا بيانات غير متوفرة، لا تذكرها أصلاً
4. اذكر الروابط بصيغة Markdown: [الاسم](الرابط) — استخدم الروابط أعلاه فقط
5. كن مختصراً — لا تتجاوز 6 أسطر
6. لا تكتب أقسام مثل "إحصائيات" أو "مهارات" أو "اهتمامات"
7. اكتب فقرة واحدة مدمجة وجذابة`;
          const prevMsgs = aiMessages.filter(m => !m.isTyping && m.content !== "__PROFILE_CARD__" && !m.content.startsWith("__MENTION_CARD__")).slice(-8).map(m => ({ role: m.role, content: m.content }));
          const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [...prevMsgs, { role: "user", content: profileContext }], getAISystemPrompt());
          setAiMessages(p => p.map(m => m.id === aiTypingId ? { ...m, content: result || "لم أستطع توليد وصف", isTyping: false } : m));
        } catch (err: any) {
          setAiMessages(p => p.map(m => m.id === aiTypingId ? { ...m, content: `خطأ: ${(err?.message || "").slice(0, 80)}`, isTyping: false } : m));
        } finally { setAiGenerating(false); }
      }
      return;
    }

    // Detect @mention — search Firestore for user and show their profile card
    const mentionMatch = inputText.match(/@(\S+)/);
    if (mentionMatch && mentionMatch[1]) {
      const mentionedName = mentionMatch[1];
      try {
        const found = await searchUserByName(mentionedName);
        if (found) {
          const mUid = found.uid;
          const mName = found.name || mentionedName;
          const mPhoto = found.photo || "";
          const mRole = found.role || "عضو";
          const mBio = found.bio || "";
          const mBanner = found.bannerUrl || "";
          const mPosts = found.posts || 0;
          const mSocialLinks = found.socialLinks || {};
          const userDisplay = { id: Math.random().toString(36).slice(2), role: "user" as const, content: inputText, isTyping: false, ts: Date.now() };
          const mentionCardId = `mention-${Date.now()}`;
          // Encode all data safely using JSON
          const mentionData = JSON.stringify({ uid: mUid, name: mName, photo: mPhoto, role: mRole, bio: mBio, banner: mBanner, posts: mPosts, socialLinks: mSocialLinks });
          const mentionCard = { id: mentionCardId, role: "assistant" as const, content: `__MENTION_CARD__${mentionData}`, isTyping: false };
          setAiMessages(p => [...p, userDisplay, mentionCard]);
          // Also send to AI if there's more text beyond the mention
          const remainingText = inputText.replace(/@\S+/, "").trim();
          if (remainingText && aiApiKey) {
            const aiTypingId = `ai-${Date.now()}`;
            setAiMessages(p => [...p, { id: aiTypingId, role: "assistant" as const, content: "", isTyping: true }]);
            try {
              const prevMsgs = aiMessages.filter(m => !m.isTyping && m.content !== "__PROFILE_CARD__" && !m.content.startsWith("__MENTION_CARD__")).slice(-6).map(m => ({ role: m.role, content: m.content }));
              const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [...prevMsgs, { role: "user", content: `المستخدم ذكر @${mName}. بياناته: الاسم: ${mName}, الدور: ${mRole}, النبذة: ${mBio || "لا توجد"}, عدد المواضيع: ${mPosts}. ${remainingText}` }], getAISystemPrompt());
              setAiMessages(p => p.map(m => m.id === aiTypingId ? { ...m, content: result || "لم أستطع توليد رد", isTyping: false } : m));
            } catch (err: any) {
              setAiMessages(p => p.map(m => m.id === aiTypingId ? { ...m, content: `خطأ: ${(err?.message || "").slice(0, 80)}`, isTyping: false } : m));
            }
          }
          return;
        }
      } catch {}
    }

    // Smart Writing Enhancement — detect enhancement commands and use specialized prompts
    const WRITING_MODES: Record<string, { match: RegExp; systemPrompt: string }> = {
      "improve": { match: /حسّن نصي باحترافية|حسّن نصي|حسّن الكتابة/, systemPrompt: "أنت محرر محترف للمنتديات العربية. حسّن النص بأسلوب احترافي وراقي مع الحفاظ على المعنى. أضف تنسيق Markdown مناسب (عناوين، قوائم، كود). أجب بالنص المحسّن فقط بدون مقدمات أو شرح." },
      "topic": { match: /حوّله لموضوع مميز|حوّله لموضوع|اكتب موضوع/, systemPrompt: "أنت كاتب محتوى محترف للمنتديات. حوّل النص لموضوع منتدى مميز بعنوان جذاب وتنسيق Markdown احترافي (عناوين، قوائم، اقتباسات، خطوط فاصلة). أجب بالموضوع كاملاً مع العنوان في السطر الأول." },
      "literary": { match: /أسلوب أدبي وفني|أسلوب أدبي|اكتب بأدب/, systemPrompt: "أنت أديب وكاتب فني. أعد كتابة النص بأسلوب أدبي فني راقٍ مع بلاغة وجمال لغوي. استخدم تشبيهات واستعارات. أجب بالنص المُعاد كتابته فقط." },
      "grammar": { match: /صحح أخطائي النحوية|صحح أخطائي|صحح النص/, systemPrompt: "أنت مدقق لغوي محترف. صحح الأخطاء النحوية والإملائية والأسلوبية في النص. أجب بالنص المصحح فقط بدون شرح الأخطاء." },
      "expand": { match: /وسّع وفصّل|وسّع النص|فصّل أكثر/, systemPrompt: "وسّع النص وأضف تفاصيل وأمثلة وتوضيحات مع الحفاظ على المعنى الأصلي. أجب بالنص الموسّع فقط." },
      "condense": { match: /اختصر وركّز|اختصر النص|ركّز النص/, systemPrompt: "اختصر النص مع الحفاظ على النقاط الأساسية. أجب بالنص المختصر فقط." },
      "translate": { match: /ترجم لي|ترجم النص/, systemPrompt: `ترجم النص بلغة طبيعية وسلسة. إذا النص عربي ترجمه لل${({en:"الإنجليزية",ar:"العربية",fr:"الفرنسية",de:"الألمانية",es:"الإسبانية",tr:"التركية",ja:"اليابانية",ko:"الكورية",zh:"الصينية",ru:"الروسية"})[localStorage.getItem("nf-ai-translate-lang")||"en"]||"الإنجليزية"}، وإذا النص بنفس لغة الهدف ترجمه للعربية. أجب بالترجمة فقط.` },
      "gamedesign": { match: /صمم لي لعبة كاملة|صمم لي لعبة|صمم لعبة/, systemPrompt: "أنت مصمم ألعاب محترف. صمم لعبة كاملة بالتفصيل: الفكرة، الميكانيكيات، نظام التقدم، واجهة المستخدم، المستويات، نظام القتال/التفاعل، نظام النقاط، التلويح. اكتب تصميم اللعبة كوثيقة GDD احترافية مع عناوين وأقسام مفصلة." },
      "debug": { match: /حل مشكلة تقنية|حل مشكلة|حل خطأ|debug/, systemPrompt: "أنت مبرمج خبير في حل المشاكل التقنية. حل المشكلة خطوة بخطوة: 1) تشخيص السبب 2) الحل المقترح 3) الكود المصحح 4) كيفية الاختبار. كن دقيقاً وعملياً." },
      "shader": { match: /اكتب شيدر مخصص|اكتب شيدر|شيدر/, systemPrompt: "أنت خبير شيدرات. اكتب شيدر كامل مع شرح كل جزء. حدد اللغة (HLSL/GLSL/Shader Graph). اكتب الكود كاملاً قابل للنسخ والتشغيل." },
      "organize": { match: /نظم مشروعي|نظم المشروع|تنظيم مشروع/, systemPrompt: "أنت مدير مشاريع تقنية. نظم المشروع بوضع: هيكل الملفات، خطة التطوير مرتبة زمنياً، الأولويات، المهام المطلوبة، التقنيات المناسبة. اكتب خطة عمل مفصلة." },
      "sitehelp": { match: /كيف استخدم الموقع|ساعدني بالموقع|كيف الموقع|شرح الموقع|موقعكم كيف/, systemPrompt: "أنت دليل استخدام منصة NorthFall. اشرح كيفية استخدام الموقع بالتفصيل خطوة بخطوة باللهجة الأردنية. اشرح: المجتمعات، إنشاء المواضيع، التفاعل، البروفايل، الإشعارات، الذكاء الاصطناعي، الإعدادات. كن صبور وواضح وودي." },
      "tips": { match: /نصيحة|نصائح|افضل طريقة|كيف احسن|كيف أتحسن|نصائحلي/, systemPrompt: "أنت مستشار محترف باللهجة الأردنية. أعط نصائح عملية ومفيدة بناءً على سؤال المستخدم. كن ودود ومباشر. اكتب 3-5 نصائح عملية مع أمثلة." },
      "compare": { match: /قارن بين|مقارنة|ايهما افضل|أفضل|شو الفرق/, systemPrompt: "أنت محلل تقني محترف. قارن بين الخيارات المذكورة باستخدام جدول Markdown مع أعمدة: المعيار، الخيار أ، الخيار ب. ثم اكتب خلاصة بتوصية واضحة. كن موضوعي ودقيق." },
      "review": { match: /راجع|مراجعة|تقييم|شو رأيك/, systemPrompt: "أنت ناقد بناء ومحترف باللهجة الأردنية. راجع المحتوى المقدم: اذكر الإيجابيات والسلبيات، أعط تقييم من 10، واقترح تحسينات عملية. كن صادق وموضوعي." },
    };
    let writingSystemPrompt: string | undefined;
    for (const mode of Object.values(WRITING_MODES)) {
      if (mode.match.test(inputText)) { writingSystemPrompt = mode.systemPrompt; break; }
    }

    // Normal AI chat
    const userMsg = { id: Math.random().toString(36).slice(2), role: "user" as const, content: inputText, isTyping: false, ts: Date.now() };
    const typingId = Math.random().toString(36).slice(2);
    const requestStartTime = Date.now();
    const currentMessages = [...aiMessages, userMsg]; // Build full message list including new user msg
    setAiMessages(p => [...p, userMsg, { id: typingId, role: "assistant" as const, content: "", isTyping: true, ts: Date.now() }]);
    const sel = AI_MODELS[aiModel];
    if (aiApiKey) {
      setAiGenerating(true);
      const abortCtrl = new AbortController();
      aiAbortRef.current = abortCtrl;
      try {
        const rawMsgs = currentMessages.filter(m => !m.isTyping && m.content !== "__PROFILE_CARD__" && !m.content.startsWith("__MENTION_CARD__")).map(m => ({ role: m.role, content: m.content }));
        
        // Handle Reply Context in prompt
        if (contextText && rawMsgs.length > 0) {
          const lastMsg = rawMsgs[rawMsgs.length - 1];
          lastMsg.content = `[المستخدم قام بالرد على هذا النص]: "${contextText}"\n\n[رسالة المستخدم]: ${inputText || "اشرح لي هذا أكثر"}`;
        }

        // Merge consecutive same-role messages to prevent API errors
        const merged: { role: string; content: string }[] = [];
        for (const m of rawMsgs) {
          const last = merged[merged.length - 1];
          if (last && last.role === m.role) { last.content += "\n" + m.content; }
          else { merged.push({ ...m }); }
        }
        const finalSystemPrompt = writingSystemPrompt ? `${typeof AI_PROMPT !== "undefined" ? AI_PROMPT : ""}\n\n[أمر خاص للمستخدم]:\n${writingSystemPrompt}` : getAISystemPrompt();
        const improved = await callAI(sel.provider, sel.model, merged, finalSystemPrompt);
        if (abortCtrl.signal.aborted) return;
        // Auto-fix: strip any HTML tags the AI might have used and convert to markdown
        const fixHtml = (text: string) => {
          // Convert <big>text</big> or <span style="font-size...">text</span> to ## text
          let fixed = text
            .replace(/<big>(.*?)<\/big>/gi, '## $1')
            .replace(/<span\s+style=["']font-size:\s*\d+px["']\s*>(.*?)<\/span>/gi, '## $1')
            .replace(/<span\s+style=["']font-size:\s*\d+["']\s*>(.*?)<\/span>/gi, '## $1')
            .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, (_, p1, _off, full) => { const tag = full.match(/<h([1-3])/)?.[1]; return tag === '1' ? `## ${p1}` : tag === '2' ? `## ${p1}` : `### ${p1}`; })
            .replace(/<b>(.*?)<\/b>/gi, '**$1**')
            .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<i>(.*?)<\/i>/gi, '*$1*')
            .replace(/<em>(.*?)<\/em>/gi, '*$1*')
            .replace(/<small>(.*?)<\/small>/gi, '$1')
            .replace(/<mark>(.*?)<\/mark>/gi, '$1')
            .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1')
            .replace(/<br\s*\/?>/gi, '\n');
          // If first line is short plain text (looks like a title), auto-add ##
          const lines = fixed.split('\n');
          const firstNonEmpty = lines.findIndex(l => l.trim());
          if (firstNonEmpty >= 0 && !lines[firstNonEmpty].trim().startsWith('#') && !lines[firstNonEmpty].trim().startsWith('```') && !lines[firstNonEmpty].trim().startsWith('|') && lines[firstNonEmpty].trim().length < 60) {
            lines[firstNonEmpty] = '## ' + lines[firstNonEmpty].trim();
          }
          return lines.join('\n');
        };
        const finalContent = improved ? fixHtml(improved) : improved;
        setAiResponseTimes(p => ({ ...p, [typingId]: Math.round((Date.now() - requestStartTime) / 100) / 10 }));
        setAiMessages(p => p.map(m => m.id === typingId ? { ...m, content: finalContent || "لم أستطع توليد رد", isTyping: false } : m));
      } catch (err: any) {
        if (abortCtrl.signal.aborted) return;
        const msg = err?.message || "";
        setAiMessages(p => p.map(m => m.id === typingId ? { ...m, content: `خطأ: ${msg.slice(0, 100)}`, isTyping: false } : m));
      } finally {
        setAiGenerating(false);
        aiAbortRef.current = null;
      }
    } else {
      const fullPrompt = `${getAISystemPrompt()}\n\n${userMsg.content}`;
      try { await navigator.clipboard.writeText(fullPrompt); } catch { const tmp = document.createElement("textarea"); tmp.value = fullPrompt; document.body.appendChild(tmp); tmp.select(); document.execCommand("copy"); document.body.removeChild(tmp); }
      const urls: Record<string, string> = { chatgpt: "https://chatgpt.com/", gemini: "https://gemini.google.com/app", claude: "https://claude.ai/new", deepseek: "https://chat.deepseek.com/", groq: "https://chat.groq.com/", mistral: "https://chat.mistral.ai/" };
      window.open(urls[sel.provider] || "https://chat.deepseek.com/", "_blank");
      setAiMessages(p => p.map(m => m.id === typingId ? { ...m, content: "تم نسخ الرسالة! الصقها في الذكاء الاصطناعي ثم انسخ الرد هنا", isTyping: false } : m));
      setAiGenerating(false);
    }
  };
  // Typing animation: reveal chars progressively when AI responds
  const aiMessagesRef = useRef(aiMessages);
  aiMessagesRef.current = aiMessages;
  // Initialize progress for new completed messages
  useEffect(() => {
    const newMsgs = aiMessages.filter(m => m.role === "assistant" && !m.isTyping && m.content && !(m.id in aiTypingProgress));
    if (newMsgs.length === 0) return;
    setAiTypingProgress(prev => { const n = { ...prev }; newMsgs.forEach(m => { n[m.id] = 0; }); return n; });
  }, [aiMessages]);
  // Single animation loop using ref — avoids useEffect cleanup clearing timers
  useEffect(() => {
    // Only run animation loop when in AI view and there are messages that need typing animation
    if (viewMode !== "ai") return;
    const hasActiveTyping = aiMessages.some(m => m.role === "assistant" && !m.isTyping && m.content && (aiTypingProgress[m.id] ?? 0) < m.content.length);
    if (!hasActiveTyping) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      setAiTypingProgress(prev => {
        const msgs = aiMessagesRef.current;
        let changed = false;
        const next = { ...prev };
        for (const m of msgs) {
          if (m.role !== "assistant" || m.isTyping || !m.content) continue;
          const cur = next[m.id];
          if (cur === undefined || cur >= m.content.length) continue;
          const step = Math.max(2, Math.floor(m.content.length / 60));
          next[m.id] = Math.min(cur + step, m.content.length);
          changed = true;
        }
        return changed ? next : prev;
      });
      setTimeout(tick, 30);
    };
    const id = setTimeout(tick, 30);
    return () => { active = false; clearTimeout(id); };
  }, [viewMode, aiMessages, aiTypingProgress]);
  useEffect(() => { if (viewMode === "ai") aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, aiTypingProgress]);
  useEffect(() => { if (!aiGenerating) return; const id = setInterval(() => setAiTypingPhase(p => (p + 1) % 3), 2000); return () => clearInterval(id); }, [aiGenerating]);
  useEffect(() => { const h = (e: MouseEvent) => { if (aiModelDropdownRef.current && !aiModelDropdownRef.current.contains(e.target as Node)) setAiModelDropdown(false); if (aiModeDropdownRef.current && !aiModeDropdownRef.current.contains(e.target as Node)) setAiModeDropdown(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  useEffect(() => { if (!user) return; async function fetchUserProfile() { try { const snap = await getDoc(doc(db, "users", user!.uid)); if (snap.exists()) { const d = snap.data(); setUserPostCount(d.postCount || 0); if (d.createdAt) setUserJoinDate(d.createdAt); setUserBio(d.bio || ""); setUserRole(d.role || "عضو"); } } catch {} } fetchUserProfile(); }, [user]);

  useEffect(() => { if (!user) { setUnreadCount(0); return; } async function fetchUnread() { try { const q = query(collection(db, "users", user!.uid, "notifications"), where("read", "==", false)); const snap = await getDocs(q); setUnreadCount(snap.size); } catch {} } fetchUnread(); const interval = setInterval(fetchUnread, 30000); return () => clearInterval(interval); }, [user]);

  useEffect(() => { const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null); if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDropdown(false); if (userMenuOpen && !(e.target as HTMLElement).closest('.user-menu-trigger')) setUserMenuOpen(false); if (typeDropdownOpen) setTypeDropdownOpen(false); if (sizeMenuOpen && !(e.target as HTMLElement).closest('[data-size-menu]')) { setSizeMenuOpen(null); savedSel.current = null; } if (emojiMenuOpen && !(e.target as HTMLElement).closest('[data-emoji-menu]')) setEmojiMenuOpen(null); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, [userMenuOpen, typeDropdownOpen, sizeMenuOpen, emojiMenuOpen]);

  // Search history
  useEffect(() => { try { const h = localStorage.getItem("nf-forum-search-history"); if (h) setSearchHistory(JSON.parse(h).slice(0, 5)); } catch {} }, []);

  // Floating Selection Toolbar — only show after mouseup to avoid breaking selection
  useEffect(() => {
    const handleMouseDown = () => {
      // Hide popup when user starts a new selection
      setSelectionRect(null);
      setSelectedText("");
    };
    const handleMouseUp = () => {
      // Small delay to let the browser finalize selection
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") {
          setSelectionRect(null);
          setSelectedText("");
          return;
        }
        
        let node = selection.anchorNode;
        let isAiMsg = false;
        while (node) {
          if (node instanceof HTMLElement && node.classList.contains("ai-markdown")) {
            isAiMsg = true;
            break;
          }
          node = node.parentNode;
        }
        if (!isAiMsg) {
          setSelectionRect(null);
          setSelectedText("");
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionRect(rect);
        setSelectedText(selection.toString().trim());
      }, 10);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  const addSearchHistory = (q: string) => { if (!q.trim()) return; const updated = [q, ...searchHistory.filter(h => h !== q)].slice(0, 5); setSearchHistory(updated); localStorage.setItem("nf-forum-search-history", JSON.stringify(updated)); };
  const clearSearchHistory = () => { setSearchHistory([]); localStorage.removeItem("nf-forum-search-history"); };

  // Forum search logic
  useEffect(() => { if (!searchQuery.trim()) { setSearchResults([]); return; } const timer = setTimeout(async () => { setSearching(true); try { const qLower = searchQuery.toLowerCase(); let results: any[] = [];
  // Thread matches - search both current community and all threads
  const allSearchableThreads = [...threads, ...allThreads.filter(at => !threads.some(t => t.id === at.id))];
  const threadMatches = allSearchableThreads.filter(t => t.title.toLowerCase().includes(qLower) || t.body?.toLowerCase().includes(qLower) || t.tags?.some(tag => tag.toLowerCase().includes(qLower)) || t.authorName.toLowerCase().includes(qLower) || t.community.toLowerCase().includes(qLower)).map(t => ({ ...t, _type: "thread" as const }));
  // Community matches
  const commMatches = allCommunities.filter(c => c.name.toLowerCase().includes(qLower) || c.desc.toLowerCase().includes(qLower)).map(c => ({ ...c, _type: "community" as const }));
  // User matches from Firebase users collection
  const userMap = new Map<string, any>();
  try {
    const uSnap = await getDocs(query(collection(db, "users"), limit(20)));
    uSnap.docs.forEach(d => {
      const data = d.data();
      if (data.displayName?.toLowerCase().includes(qLower) && !userMap.has(d.id)) {
        userMap.set(d.id, { id: `user-${d.id}`, uid: d.id, name: data.displayName, photo: data.photoURL || undefined, _type: "user" as const });
      }
    });
  } catch {}
  // Also add thread authors not already in the map
  allSearchableThreads.forEach(t => { if (t.authorName.toLowerCase().includes(qLower) && !userMap.has(t.authorUid)) userMap.set(t.authorUid, { id: `user-${t.authorUid}`, uid: t.authorUid, name: t.authorName, photo: t.authorPhoto, _type: "user" as const }); });
  const userMatches = Array.from(userMap.values());
  // Reply matches
  const replyMatches: any[] = []; Object.values(replies).forEach(rArr => rArr.forEach(r => { if (r.text.toLowerCase().includes(qLower) || r.authorName.toLowerCase().includes(qLower)) replyMatches.push({ ...r, _type: "reply" as const }); }));
  // Apply filter
  if (searchFilter === "all") results = [...commMatches, ...userMatches, ...threadMatches, ...replyMatches];
  else if (searchFilter === "threads") results = threadMatches;
  else if (searchFilter === "replies") results = replyMatches;
  else if (searchFilter === "users") results = userMatches;
  else if (searchFilter === "communities") results = commMatches;
  // Apply sort
  if (searchSort === "newest") results.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  else if (searchSort === "top") results.sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0));
  else if (searchSort === "relevance") results.sort((a: any, b: any) => { let sa = 0, sb = 0; if (a.title?.toLowerCase().includes(qLower)) sa += 3; if (b.title?.toLowerCase().includes(qLower)) sb += 3; if (a.community?.toLowerCase().includes(qLower)) sa += 2; if (b.community?.toLowerCase().includes(qLower)) sb += 2; sa += (a.votes || 0) * 0.01; sb += (b.votes || 0) * 0.01; return sb - sa; });
  setSearchResults(results.slice(0, 12));
  setShowSearchDropdown(true); setSelectedSearchIdx(-1);
  } catch {} setSearching(false); }, 250); return () => clearTimeout(timer); }, [searchQuery, searchFilter, searchSort, threads, allThreads, replies]);

  // Keyboard navigation for search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => { if (!showSearchDropdown) { if (e.key === "ArrowDown" && (searchHistory.length > 0 || searchResults.length > 0)) setShowSearchDropdown(true); return; } const total = searchResults.length || searchHistory.length; if (e.key === "ArrowDown") { e.preventDefault(); setSelectedSearchIdx(i => Math.min(i + 1, total - 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedSearchIdx(i => Math.max(i - 1, -1)); } else if (e.key === "Enter" && selectedSearchIdx >= 0) { e.preventDefault(); const item = searchResults[selectedSearchIdx]; if (item) handleSearchResultClick(item); } else if (e.key === "Escape") { setShowSearchDropdown(false); searchInputRef.current?.blur(); } };

  const handleSearchResultClick = (r: any) => { addSearchHistory(searchQuery); if (r._type === "thread") { if (r.community && r.community !== selectedCommunity) setSelectedCommunity(r.community); openThread(r.id); } else if (r._type === "community") { openCommunity(allCommunities.find(c => c.name === r.name) || { name: r.name, img: r.img || "", banner: "", desc: "", shortDesc: "", members: r.members || 0, threads: 0, replies: 0, founded: "", rules: [], mods: [], tags: [], bookmarks: [] }); } else if (r._type === "user") openProfile(r.uid, r.name, r.photo); else if (r._type === "reply") openThread(r.threadId || activeThreadId || ""); setShowSearchDropdown(false); };

  // Cmd+K shortcut
  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchInputRef.current?.focus(); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);

  // Fetch online users
  useEffect(() => {
    async function fetchOnline() {
      try {
        const tenMinAgo = new Date(Date.now() - 600000).toISOString();
        const snap = await getDocs(collection(db, "users"));
        const all = snap.docs.map(d => ({ uid: d.id, name: d.data().displayName || "مستخدم", photo: d.data().photoURL || undefined, role: d.data().role, lastSeen: d.data().lastSeen || "" }));
        setOnlineUsers(all.filter(u => u.lastSeen && u.lastSeen >= tenMinAgo));
        setTotalMembers(all.length);
      } catch {}
    }
    fetchOnline();
    const interval = setInterval(fetchOnline, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { async function load() { setLoading(true); try { const data = await fetchCommunityThreads(selectedCommunity); setThreads(data); } catch { setThreads([]); } finally { setLoading(false); } } load(); }, [selectedCommunity]);

  // Fetch all threads from all communities for sidebar
  useEffect(() => { async function load() { try { const data = await fetchAllCommunityThreads(allCommunities, 5); setAllThreads(data); } catch {} } load(); }, []);

  // Lazy-load author data for hover cards
  const fetchAuthorCache = async (uid: string) => {
    if (authorCache[uid]) return;
    try {
      const profile = await fetchUserProfile(uid);
      const data: any = { role: profile.role, bio: profile.bio || "", bannerUrl: profile.bannerUrl || "", joinDate: profile.joinDate || "", isOnline: profile.isOnline || false, postCount: profile.posts || 0, socialLinks: profile.socialLinks || {}, followerCount: profile.followerCount || 0, followingCount: profile.followingCount || 0 };
      const userThreads = allThreads.filter(t => t.authorUid === uid);
      data.karma = userThreads.reduce((s: number, t: any) => s + (t.votes || 0), 0);
      setAuthorCache(prev => ({ ...prev, [uid]: data }));
    } catch {}
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await saveUserProfile(user.uid, { bio: editBio, bannerUrl: editBannerUrl, socialLinks: editSocialLinks });
      // Update local state
      if (profileData) setProfileData({ ...profileData, bio: editBio, bannerUrl: editBannerUrl, socialLinks: editSocialLinks });
      setAuthorCache(prev => ({ ...prev, [user.uid]: { ...prev[user.uid], bio: editBio, bannerUrl: editBannerUrl, socialLinks: editSocialLinks } }));
      setUserBio(editBio);
      setProfileEditOpen(false);
      showToast("تم حفظ التغييرات ✓");
    } catch { showToast("فشل حفظ التغييرات"); }
  };

  const openProfile = async (uid: string, name: string, photo?: string) => {
    setProfileUid(uid); navigateForum("profile", { profileUid: uid });
    try {
      const profile = await fetchUserProfile(uid, name, photo);
      let pd: any = { ...profile };
      // Fetch user threads from Firestore
      const userThreads = await fetchUserThreads(uid, allCommunities, 10);
      // Fallback: use allThreads if Firestore returned nothing
      if (userThreads.length === 0) {
        const fromAll = allThreads.filter(t => t.authorUid === uid);
        pd.threads = fromAll.slice(0, 15);
      } else {
        pd.threads = userThreads;
      }
      setProfileData(pd);
    } catch {
      const fromAll = allThreads.filter(t => t.authorUid === uid);
      setProfileData({ name, photo, role: "عضو", threads: fromAll.slice(0, 15) });
    }
  };

  const fetchReplies = async (threadId: string) => { try { const data = await fetchRepliesHelper(selectedCommunity, threadId); setReplies(prev => ({ ...prev, [threadId]: data })); } catch {} };
  const fetchRepliesForCommunity = async (threadId: string, community: string) => { try { const data = await fetchRepliesHelper(community, threadId); setReplies(prev => ({ ...prev, [threadId]: data })); } catch {} };
  const openThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId) || allThreads.find(t => t.id === threadId);
    setActiveThreadId(threadId); navigateForum("thread", { threadId, community: thread?.community || selectedCommunity, threadTitle: thread?.title || "" });
    const threadCommunity = thread?.community || selectedCommunity;
    fetchRepliesForCommunity(threadId, threadCommunity);
    // Save to read history
    if (thread) {
      const entry = { community: threadCommunity, title: thread.title, time: Date.now() };
      setLastReadHistory(prev => { const n = { ...prev, [threadId]: entry }; try { localStorage.setItem("forum_readHistory", JSON.stringify(n)); } catch {} return n; });
    }
    // Only update views once per session
    if (!viewedThreads.has(threadId)) {
      setViewedThreads(prev => new Set(prev).add(threadId));
      if (threadId && !threadId.includes("-")) {
        try { incrementViews(threadCommunity, threadId); } catch {}
      }
      setThreads(prev => prev.map(th => th.id === threadId ? { ...th, views: (th.views || 0) + 1 } : th));
    }
  };
  const backToList = () => { navigateForum("list", { community: selectedCommunity }); setActiveThreadId(null); setMenuOpen(null); setEditingReply(null); setReplyingTo(null); setProfileUid(null); setProfileData(null); };

  // Load read history on mount
  useEffect(() => { try { const saved = localStorage.getItem("forum_readHistory"); if (saved) setLastReadHistory(JSON.parse(saved)); } catch {} }, []);

  // Close dropdowns on outside click (use click, not mousedown, so item clicks fire first)
  useEffect(() => { const handler = (e: MouseEvent) => { if (sortDropdownOpen) setSortDropdownOpen(false); if (sortOrderDropdownOpen) setSortOrderDropdownOpen(false); if (typeDropdownOpen) setTypeDropdownOpen(false); }; if (sortDropdownOpen || sortOrderDropdownOpen || typeDropdownOpen) setTimeout(() => document.addEventListener("click", handler), 10); return () => document.removeEventListener("click", handler); }, [sortDropdownOpen, sortOrderDropdownOpen, typeDropdownOpen]);
  const handleVote = (threadId: string, dir: "up" | "down") => {
    const prev = userVotes[threadId];
    // Find community for this thread
    const thread = threads.find(t => t.id === threadId) || allThreads.find(t => t.id === threadId);
    const threadCommunity = thread?.community || selectedCommunity;
    const isRealDoc = threadId && !threadId.includes("-");
    if (prev === dir) {
      // Remove vote - decrement Firebase
      setUserVotes(p => { const n = { ...p }; delete n[threadId]; return n; });
      if (isRealDoc) {
        try {
          const delta = prev === "up" ? -1 : 1;
          voteThread(threadCommunity, threadId, delta);
        } catch {}
      }
      setThreads(p => p.map(th => th.id === threadId ? { ...th, votes: (th.votes || 0) + (prev === "up" ? -1 : 1) } : th));
      return;
    }
    // New vote or change vote
    setUserVotes(p => ({ ...p, [threadId]: dir }));
    let delta = dir === "up" ? 1 : -1;
    if (prev) delta = prev === "up" ? -2 : 2;
    if (isRealDoc) {
      try { voteThread(threadCommunity, threadId, delta); } catch {}
    }
    setThreads(p => p.map(th => th.id === threadId ? { ...th, votes: (th.votes || 0) + delta } : th));
  };
  const handleCreateThread = async () => { if (!newTitle.trim()) return; setCreating(true); setCreateBlur(true); try { const tagsArr = newTags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5); const threadData = { title: newTitle.trim(), body: newBody.trim(), authorName, authorUid, authorPhoto, community: newCommunity, pinned: false, locked: false, solved: false, replyCount: 0, views: 0, votes: 0, createdAt: new Date().toISOString(), tags: tagsArr, type: newType }; const docId = await createThread(newCommunity, threadData); if (newCommunity === selectedCommunity) setThreads(prev => [{ id: docId, ...threadData }, ...prev]); setNewTitle(""); setNewBody(""); setNewTags(""); setNewType("discussion"); setCreating(false); setTimeout(() => { setViewMode("list"); setTimeout(() => setCreateBlur(false), 100); }, 500); } catch { setCreateBlur(false); setCreating(false); } };
  const handleReply = async (threadId: string) => { if (!replyText.trim()) return; try { const rd = { text: replyText.trim(), authorName, authorUid, authorPhoto, createdAt: new Date().toISOString(), votes: 0, ...(quotedThreadId ? { quotedThreadId } : {}) }; await addReply(selectedCommunity, threadId, rd); setReplies(prev => ({ ...prev, [threadId]: [...(prev[threadId] || []), { id: "temp-" + Date.now(), ...rd }] })); setThreads(p => p.map(th => th.id === threadId ? { ...th, replyCount: th.replyCount + 1, lastReplyAt: new Date().toISOString(), lastReplyBy: authorName } : th)); setReplyText(""); setReplyingTo(null); setQuotedThreadId(null); setTimeout(() => replyEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); } catch {} };
  const handleDeleteReply = async (threadId: string, replyId: string) => { try { await deleteReplyHelper(selectedCommunity, threadId, replyId); setReplies(p => ({ ...p, [threadId]: (p[threadId] || []).filter(r => r.id !== replyId) })); setThreads(p => p.map(th => th.id === threadId ? { ...th, replyCount: Math.max(0, th.replyCount - 1) } : th)); setMenuOpen(null); } catch {} };
  const handleEditReply = async (threadId: string, replyId: string) => { if (!editText.trim()) return; try { await updateReply(selectedCommunity, threadId, replyId, editText.trim()); setReplies(p => ({ ...p, [threadId]: (p[threadId] || []).map(r => r.id === replyId ? { ...r, text: editText.trim(), edited: true } : r) })); setEditingReply(null); setEditText(""); setMenuOpen(null); } catch {} };

  const handleDeleteThread = async (threadId: string, community: string) => {
    try {
      await deleteThreadHelper(community, threadId);
      setThreads(p => p.filter(t => t.id !== threadId));
      setAllThreads(p => p.filter(t => t.id !== threadId));
      setMenuOpen(null);
      backToList();
      showToast("تم حذف المنشور");
    } catch { showToast("فشل حذف المنشور"); }
  };

  // Open community profile view
  const openCommunity = async (comm: typeof allCommunities[0]) => {
    setCommunityViewData(comm);
    setCommunityThreadCount(0);
    setCommunityReplyCount(0);
    try {
      const stats = await fetchCommunityStats(comm.name);
      setCommunityThreadCount(stats.threadCount);
      setCommunityReplyCount(stats.replyCount);
    } catch {}
    navigateForum("community", { community: comm.name });
  };

  // Copy with toast
  const copyText = async (text: string) => { try { await navigator.clipboard.writeText(text); showToast("تم النسخ ✓"); } catch { showToast("فشل النسخ"); } };
  // Open share modal
  const openShare = (postId: string, postTitle: string) => { setSharePostId(postId); setSharePostTitle(postTitle); setShareModalOpen(true); };

  // Wrap selected text in textarea with markdown
  const wrapSelection = (ref: React.RefObject<HTMLTextAreaElement | null>, before: string, after: string, setter: (v: string | ((p: string) => string)) => void, getter: string) => {
    const ta = ref.current;
    if (!ta) { setter(prev => `${prev}${before}نص${after}`); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = getter.substring(start, end);
    const replacement = selected ? `${before}${selected}${after}` : `${before}نص${after}`;
    setter(getter.substring(0, start) + replacement + getter.substring(end));
    setTimeout(() => { ta.focus(); ta.selectionStart = start + before.length; ta.selectionEnd = start + before.length + (selected || "نص").length; }, 0);
  };

  // Clear formatting from selected text
  const clearFormatting = (ref: React.RefObject<HTMLTextAreaElement | null>, setter: (v: string | ((p: string) => string)) => void, getter: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = getter.substring(start, end);
    if (!selected) return;
    // Remove all markdown formatting
    const cleared = selected
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1') // Italic
      .replace(/~~(.+?)~~/g, '$1') // Strikethrough
      .replace(/`(.+?)`/g, '$1') // Code
      .replace(/\[size=\d+\](.+?)\[\/size\]/g, '$1') // Size
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
      .replace(/\[▶ فيديو\]\(.+?\)/g, '') // Videos
      .replace(/!\[([^\]]*)\]\(.+?\)/g, '$1') // Images
      .replace(/^> /gm, ''); // Blockquotes
    setter(getter.substring(0, start) + cleared + getter.substring(end));
    setTimeout(() => { ta.focus(); ta.selectionStart = start; ta.selectionEnd = start + cleared.length; }, 0);
  };

  // Insert emoji
  const insertEmoji = (ref: React.RefObject<HTMLTextAreaElement | null>, emoji: string, setter: (v: string | ((p: string) => string)) => void, getter: string) => {
    const ta = ref.current;
    if (!ta) { setter(getter + emoji); setEmojiMenuOpen(null); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = getter.substring(start, end);
    const replacement = selected ? `${emoji}${selected}` : emoji;
    setter(getter.substring(0, start) + replacement + getter.substring(end));
    setTimeout(() => { ta.focus(); ta.selectionStart = start + emoji.length; ta.selectionEnd = start + emoji.length + (selected ? selected.length : 0); }, 0);
    setEmojiMenuOpen(null);
  };

  const openTableModal = () => {
    const data: string[][] = [];
    for (let r = 0; r < tableRows; r++) {
      const row: string[] = [];
      for (let c = 0; c < tableCols; c++) row.push(r === 0 ? `عنوان ${c + 1}` : "");
      data.push(row);
    }
    setTableData(data);
    setTableModalOpen(true);
  };

  const updateTableCell = (r: number, c: number, val: string) => {
    setTableData(prev => { const nd = prev.map(row => [...row]); nd[r][c] = val; return nd; });
  };

  const addTableRow = () => {
    setTableRows(r => r + 1);
    setTableData(prev => [...prev, Array(tableCols).fill("")]);
  };

  const addTableCol = () => {
    setTableCols(c => c + 1);
    setTableData(prev => prev.map(row => [...row, ""]));
  };

  const removeTableRow = () => {
    if (tableRows <= 1) return;
    setTableRows(r => r - 1);
    setTableData(prev => prev.slice(0, -1));
  };

  const removeTableCol = () => {
    if (tableCols <= 1) return;
    setTableCols(c => c - 1);
    setTableData(prev => prev.map(row => row.slice(0, -1)));
  };

  const insertTableFromModal = () => {
    const header = `| ${tableData[0].join(" | ")} |`;
    const sep = `| ${tableData[0].map(() => "---").join(" | ")} |`;
    const rows = tableData.slice(1).map(row => `| ${row.join(" | ")} |`).join("\n");
    const table = `\n${header}\n${sep}\n${rows}\n`;
    const isReply = viewMode === "thread";
    const ref = isReply ? replyTextareaRef : newBodyRef;
    const setter = isReply ? setReplyText : setNewBody;
    const getter = isReply ? replyText : newBody;
    const ta = ref.current;
    if (ta) {
      const pos = ta.selectionStart;
      setter(getter.substring(0, pos) + table + getter.substring(pos));
      setTimeout(() => ta.focus(), 0);
    } else {
      setter(prev => `${prev}${table}`);
    }
    setTableModalOpen(false);
  };


  const filteredThreads = threads.filter(th => { if (typeFilter !== "all" && th.type !== typeFilter) return false; if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); if (!th.title.toLowerCase().includes(q) && !th.body?.toLowerCase().includes(q) && !th.tags?.some(t => t.toLowerCase().includes(q))) return false; } if (timeFilter !== "all") { const now = Date.now(); const cutoff = timeFilter === "today" ? now - 86400000 : timeFilter === "week" ? now - 86400000 * 7 : now - 86400000 * 30; if (new Date(th.createdAt).getTime() < cutoff) return false; } return true; });
  const sortedThreads = [...filteredThreads].sort((a, b) => { if (sortMode === "pinned") return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); if (sortMode === "popular") return (b.replyCount || 0) - (a.replyCount || 0); if (sortMode === "unsolved") return (a.solved ? 0 : 1) - (b.solved ? 0 : 1); if (sortMode === "views") return (b.views || 0) - (a.views || 0); const timeDiff = (b.createdAt || "").localeCompare(a.createdAt || ""); return threadSort === "oldest" ? -timeDiff : timeDiff; });
  const pinnedThreads = sortedThreads.filter(t => t.pinned); const regularThreads = sortedThreads.filter(t => !t.pinned);
  const activeThread = activeThreadId ? (threads.find(t => t.id === activeThreadId) || allThreads.find(t => t.id === activeThreadId)) : null;
  const activeReplies = activeThreadId ? (replies[activeThreadId] || []) : [];

  // Update tab title when thread data loads (important for new tabs)
  useEffect(() => {
    if (viewMode === "thread" && activeThread?.title) {
      document.title = `${activeThread.title} — Northfall Forum`;
    }
  }, [activeThread?.title, viewMode]);
  const sortedReplies = (() => { let f = [...activeReplies]; if (replyTimeFilter !== "all") { const now = Date.now(); const cutoff = replyTimeFilter === "today" ? now - 86400000 : replyTimeFilter === "week" ? now - 86400000 * 7 : now - 86400000 * 30; f = f.filter(r => new Date(r.createdAt).getTime() > cutoff); } if (replySort === "newest") f.reverse(); return f; })();
  const activeTypeInfo = activeThread ? getTypeInfo(activeThread.type) : threadTypes[0];

  return (
    <div className="min-h-screen flex flex-col bg-nf-body text-nf-text" dir="rtl">
      <header className="sticky top-0 z-50 border-b border-nf-border" style={{ backgroundColor: "#222224" }}>
        <div className="flex items-center h-[56px] px-4">
          {/* Left - Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-nf-muted hover:text-white lg:hidden rounded-lg hover:bg-nf-secondary/40 transition-colors"><Menu size={20} /></button>
            <div className="flex flex-col">
              <span className="text-[10px] text-nf-dim font-medium leading-none mb-0.5">منتدى</span>
              <a href="/app" className="text-[16px] font-bold text-nf-text hover:text-nf-accent transition-colors leading-none">NorthFall</a>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 px-8 max-w-2xl mx-auto hidden md:block">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث سريع..." className="w-full bg-nf-body border border-nf-border rounded-lg pr-10 pl-3 py-2 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent transition-colors" />
            </div>
          </div>

          {/* Right - Nav + User */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Stats */}
            <div className="hidden xl:flex items-center gap-3 px-3 border-l border-nf-border">
              <div className="flex items-center gap-1.5 text-[11px] text-nf-dim">
                <MessageSquare size={12} />
                <span className="font-bold text-nf-text">{sortedThreads.length}</span>
                <span>موضوع</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-nf-dim">
                <Users size={12} />
                <span className="font-bold text-nf-text">{new Set(allThreads.map(t => t.authorUid)).size}</span>
                <span>عضو</span>
              </div>
            </div>
            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-1 px-3 border-l border-nf-border">
              <button onClick={backToList} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-nf-muted hover:text-white hover:bg-nf-secondary/40 transition-colors">الرئيسية</button>
              <button onClick={() => navigateForum("new")} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-nf-accent border border-nf-accent/30 hover:bg-nf-accent/10 transition-colors">+ موضوع</button>
              <a href="/app" className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-nf-muted hover:text-white hover:bg-nf-secondary/40 transition-colors">التطبيق</a>
            </div>
            {/* Notifications */}
            <button className="hidden sm:flex p-2 rounded-lg text-nf-muted hover:text-white hover:bg-nf-secondary/40 transition-colors relative">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-nf-accent rounded-full" />}
            </button>
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-nf-secondary/40 transition-colors border border-transparent hover:border-nf-border">
                  {user.photoURL ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-nf-secondary flex items-center justify-center text-nf-text text-[11px] font-bold">{(user.displayName || "م")[0]}</div>}
                  <ChevronDown size={10} className={cn("text-nf-dim shrink-0 transition-transform", userMenuOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.1 }} className="absolute top-full mt-1 left-0 w-[220px] bg-nf-card border border-nf-border rounded-lg z-50 overflow-hidden shadow-xl shadow-black/30">
                      {/* User info */}
                      <div className="px-3 py-2.5 border-b border-nf-border/50">
                        <div className="flex items-center gap-2.5">
                          {user.photoURL ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-nf-secondary flex items-center justify-center text-nf-text text-[12px] font-bold">{(user.displayName || "م")[0]}</div>}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-nf-text truncate">{user.displayName}</p>
                            <p className="text-[10px] text-nf-dim">{userRole} · {userPostCount} موضوع</p>
                          </div>
                        </div>
                      </div>
                      {/* Menu items */}
                      <div className="py-0.5">
                        <button onClick={() => { openProfile(user.uid, user.displayName || "مستخدم", user.photoURL || undefined); setUserMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-secondary/40 hover:text-white transition-colors"><User size={14} className="shrink-0 text-nf-dim" /> البروفايل</button>
                        <button onClick={() => { openProfile(user.uid, user.displayName || "مستخدم", user.photoURL || undefined); setUserMenuOpen(false); setTimeout(() => setProfileTab("saved"), 100); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-secondary/40 hover:text-white transition-colors"><Bookmark size={14} className="shrink-0 text-nf-dim" /> المحفوظات</button>
                        <button onClick={() => { setUserMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-secondary/40 hover:text-white transition-colors"><Bell size={14} className="shrink-0 text-nf-dim" /> الإشعارات</button>
                        <button onClick={() => { navigateForum("new"); setUserMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-secondary/40 hover:text-white transition-colors"><Plus size={14} className="shrink-0 text-nf-dim" /> موضوع جديد</button>
                        <a href="/app" className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-muted hover:bg-nf-secondary/40 hover:text-white transition-colors"><Settings size={14} className="shrink-0 text-nf-dim" /> الإعدادات</a>
                      </div>
                      <div className="border-t border-nf-border/50 py-0.5">
                        <a href="/app" className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-nf-accent hover:bg-nf-accent/5 transition-colors"><ArrowRight size={14} className="shrink-0" /> العودة للتطبيق</a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a href="/app" className="flex items-center gap-1.5 text-[13px] font-bold text-nf-text hover:text-white transition-colors bg-nf-secondary/50 hover:bg-nf-secondary px-4 py-2 rounded-lg"><LogIn size={15} /> دخول</a>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={cn("w-[240px] bg-nf-body border-r border-nf-border overflow-y-auto flex-shrink-0 sticky top-[56px] h-[calc(100vh-56px)] py-3 flex flex-col", viewMode === "ai" ? "hidden" : sidebarOpen ? "block" : "hidden lg:block")}>
          {/* Community Search */}
          <div className="px-3 mb-3">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim" />
              <input type="text" value={communitySearch} onChange={e => setCommunitySearch(e.target.value)} placeholder="ابحث عن مجتمع..." className="w-full bg-nf-secondary/60 rounded-lg pr-9 pl-3 py-2 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent transition-all" />
            </div>
          </div>

          {/* Browse */}
          <div className="px-3 mb-2">
            <div className="text-[11px] font-bold text-nf-dim uppercase tracking-wider px-2 mb-1.5">تصفح</div>
            <div className="space-y-0.5">
              {[
                { icon: Home, label: "الرئيسية", id: "home", active: viewMode === "list" },
                { icon: Flame, label: "الأكثر شعبية", id: "popular", active: sortMode === "popular" && viewMode === "list" },
                { icon: Clock, label: "الأحدث", id: "new", active: sortMode === "latest" && viewMode === "list" },
                { icon: TrendingUp, label: "الأعلى تصويت", id: "top", active: false },
                { icon: CheckCircle2, label: "غير محلول", id: "unsolved", active: sortMode === "unsolved" && viewMode === "list" },
              ].map(item => (
                <button key={item.id} onClick={() => { backToList(); if (item.id === "popular") setSortMode("popular"); else if (item.id === "unsolved") setSortMode("unsolved"); else if (item.id === "new") setSortMode("latest"); else if (item.id === "top") setSortMode("views"); }} className={cn("w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all", item.active ? "bg-nf-accent/10 text-nf-accent" : "text-nf-muted hover:bg-nf-secondary/40 hover:text-nf-text")}>
                  <item.icon size={16} className={cn("shrink-0", item.active ? "text-nf-accent" : "text-nf-dim")} /><span>{item.label}</span>
                </button>
              ))}
              <button onClick={() => navigateForum("ai")} className={cn("ai-btn w-full", viewMode === "ai" && "ai-btn-active")}>
                <Sparkles size={16} className="ai-btn-icon" />
                <span className="ai-btn-letter" style={{ animationDelay: "0s" }}>ذكاء اصطناعي</span>
              </button>
            </div>
          </div>

          {/* Personal */}
          {user && (
            <div className="px-3 mb-2">
              <div className="text-[11px] font-bold text-nf-dim uppercase tracking-wider px-2 mb-1.5">شخصي</div>
              <div className="space-y-0.5">
                {[
                  { icon: User, label: "البروفايل", id: "profile", onClick: () => openProfile(user.uid, user.displayName || "مستخدم", user.photoURL || undefined) },
                  { icon: Bookmark, label: "المحفوظات", id: "saved", onClick: () => { openProfile(user.uid, user.displayName || "مستخدم", user.photoURL || undefined); setTimeout(() => setProfileTab("saved"), 100); } },
                  { icon: Bell, label: "الإشعارات", id: "notifs", onClick: () => {} },
                  { icon: Plus, label: "موضوع جديد", id: "newthread", onClick: () => navigateForum("new") },
                ].map(item => (
                  <button key={item.id} onClick={item.onClick} className={cn("w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-medium text-nf-muted hover:bg-nf-secondary/40 hover:text-white transition-all", item.id === "newthread" && "text-nf-accent hover:bg-nf-accent/10")}>
                    <item.icon size={16} className={cn("shrink-0", item.id === "newthread" ? "text-nf-accent" : "text-nf-dim")} /><span>{item.label}</span>
                    {item.id === "notifs" && unreadCount > 0 && <span className="mr-auto px-1.5 py-0.5 rounded-full bg-nf-accent text-white text-[9px] font-bold min-w-[18px] text-center">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* My Communities */}
          {user && joinedComms.length > 0 && (
            <div className="px-3 mb-2">
              <div className="text-[10px] font-bold text-nf-accent uppercase tracking-wider px-2 mb-1.5">مجتمعاتي</div>
              <div className="space-y-0.5">
                {joinedComms.map(comm => (
                  <div key={comm.name} onClick={() => { setSelectedCommunity(comm.name); navigateForum("list", { community: comm.name }); }} className={cn("w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer", selectedCommunity === comm.name ? "bg-nf-accent/10 text-nf-accent" : "text-nf-muted hover:bg-nf-secondary/40 hover:text-white")}>
                    {comm.img ? <img src={comm.img} alt="" className="w-[18px] h-[18px] rounded-full opacity-80" /> : <div className="w-[18px] h-[18px] rounded-full bg-nf-accent/20 flex items-center justify-center text-[8px] text-nf-accent font-bold">n/</div>}
                    <span>n/{comm.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Communities */}
          <div className="px-3 mb-2">
            <div className="text-[10px] font-bold text-nf-dim uppercase tracking-wider px-2 mb-1.5">المجتمعات</div>
            <div className="px-2 pb-1.5">
              <div className="relative">
                <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-nf-dim" />
                <input type="text" value={communitySearch} onChange={e => setCommunitySearch(e.target.value)} placeholder="ابحث عن مجتمع..." className="w-full bg-nf-secondary border border-nf-border/40 rounded-md pr-7 pl-2 py-1 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:border-nf-accent/30 transition-colors" />
                {communitySearch && <button onClick={() => setCommunitySearch("")} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-nf-dim hover:text-white text-[10px]">✕</button>}
              </div>
            </div>
            <div className="space-y-0.5">
              {allCommunities.filter(c => !communitySearch || c.name.toLowerCase().includes(communitySearch.toLowerCase())).map(comm => (
                <div key={comm.name} onClick={() => { setSelectedCommunity(comm.name); navigateForum("list", { community: comm.name }); }} className={cn("w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer", selectedCommunity === comm.name ? "bg-nf-accent/10 text-nf-accent" : "text-nf-muted hover:bg-nf-secondary/40 hover:text-white")}>
                  {comm.img ? <img src={comm.img} alt="" className="w-[18px] h-[18px] rounded-full opacity-60" /> : <div className="w-[18px] h-[18px] rounded-full bg-nf-accent/20 flex items-center justify-center text-[8px] text-nf-accent font-bold">n/</div>}
                  <span>n/{comm.name}</span>
                </div>
              ))}
              {communitySearch && allCommunities.filter(c => c.name.toLowerCase().includes(communitySearch.toLowerCase())).length === 0 && (
                <p className="text-[10px] text-nf-dim px-3 py-2 text-center">لا توجد نتائج</p>
              )}
            </div>
          </div>

          {/* System */}
          <div className="px-3 mb-2">
            <div className="text-[10px] font-bold text-nf-dim uppercase tracking-wider px-2 mb-1.5">النظام</div>
            <div className="space-y-0.5">
              {[
                { icon: Settings, label: "الإعدادات", id: "settings" },
                { icon: HelpCircle, label: "المساعدة", id: "help" },
                { icon: Shield, label: "القوانين", id: "rules" },
              ].map(item => (
                <button key={item.id} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-medium text-nf-muted hover:bg-nf-secondary/40 hover:text-white transition-all">
                  <item.icon size={16} className="shrink-0 text-nf-dim" /><span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto px-3.5 py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-nf-dim mb-2">
              <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px] font-mono">⌘K</kbd> بحث</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[9px] font-mono">⌘N</kbd> منشور جديد</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-nf-muted">
              <a href="#" className="hover:text-white">سياسة الخصوصية</a>
              <span className="text-nf-dim">•</span>
              <a href="#" className="hover:text-white">اتفاقية الاستخدام</a>
            </div>
            <p className="text-[11px] text-nf-dim mt-1.5 text-center">© 2026 NorthFall. جميع الحقوق محفوظة</p>
          </div>
        </aside>

        {/* MAIN content */}
        <main className="flex-1 py-5 px-6 overflow-y-auto">
          <div className="w-full max-w-none">
            <AnimatePresence mode="wait">

              {/* PROFILE VIEW */}
              {viewMode === "profile" && profileData && (
                <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button onClick={backToList} className="flex items-center gap-1.5 text-[13px] text-nf-accent hover:underline mb-4 font-bold"><ArrowLeft size={14} /> العودة</button>

                  <div className="bg-nf-card rounded-lg overflow-hidden mb-5">
                    {/* Banner */}
                    <div className="relative h-[140px] overflow-hidden">
                      <img src={profileData.bannerUrl || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-nf-card to-transparent" />
                    </div>

                    {/* Header - avatar overlaps banner */}
                    <div className="flex items-start gap-5 px-6 -mt-8 relative z-10 pb-4">
                      <div className="shrink-0">
                        {profileData.photo ? <img src={profileData.photo} alt="" className="w-[72px] h-[72px] rounded-full object-cover border-[3px] border-nf-card" /> : <div className="w-[72px] h-[72px] rounded-full bg-nf-muted flex items-center justify-center text-white text-[26px] font-bold border-[3px] border-nf-card">{(profileData.name || "م")[0]}</div>}
                      </div>
                      <div className="flex-1 min-w-0 pt-3">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h1 className="text-[22px] font-bold text-nf-text">{profileData.name}</h1>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-nf-accent/10 text-nf-accent font-bold">{profileData.role}</span>
                          <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded", profileData.isOnline ? "bg-green-400/10 text-green-400" : "bg-nf-secondary text-nf-dim")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", profileData.isOnline ? "bg-green-400" : "bg-nf-dim")} />
                            {profileData.isOnline ? "متصل" : "غير متصل"}
                          </span>
                          {user?.uid === profileUid && <a href="/app" className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-nf-secondary text-nf-dim hover:text-nf-text hover:bg-nf-accent/10 text-[11px] font-bold transition-colors mr-auto"><Settings size={12} /> تعديل البروفايل</a>}
                        </div>
                        <p className="text-[12px] text-nf-dim font-medium">u/{profileData.name}</p>
                        {profileData.bio && <p className="text-[13px] text-nf-dim leading-[1.8] mt-1.5 max-w-[500px]">{profileData.bio}</p>}
                        {/* Social Links */}
                        {profileData.socialLinks && Object.values(profileData.socialLinks).some(v => v.trim()) && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {Object.entries(profileData.socialLinks).filter(([, v]) => v.trim()).map(([key, val]) => {
                              const socialMeta: Record<string, { label: string }> = {
                                twitter: { label: "X" }, youtube: { label: "YouTube" }, github: { label: "GitHub" },
                                steam: { label: "Steam" }, discord: { label: "Discord" }, website: { label: "موقع" },
                              };
                              const meta = socialMeta[key];
                              if (!meta) return null;
                              return <a key={key} href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-nf-secondary text-nf-muted hover:bg-nf-accent/10 hover:text-nf-accent transition-colors"><ExternalLink size={10} />{meta.label}</a>;
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats bar - flat */}
                    <div className="flex items-center gap-1.5 px-6 pb-4 flex-wrap">
                      {[
                        { label: "تأثير", value: profileData.threads?.reduce((s, t) => s + (t.votes || 0), 0) || 0, icon: Star },
                        { label: "مواضيع", value: profileData.threads?.length || 0, icon: MessageCircle },
                        { label: "متابعين", value: profileData.followerCount || 0, icon: Users },
                        { label: "متابَعين", value: profileData.followingCount || 0, icon: User },
                        { label: "مشاهدات", value: profileData.threads?.reduce((s, t) => s + (t.views || 0), 0) || 0, icon: Eye },
                      ].map((stat, i) => { const SI = stat.icon; return (
                        <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nf-secondary text-[11px] text-nf-dim font-medium">
                          <SI size={11} className="text-nf-accent" />
                          <span className="font-bold text-nf-text">{stat.value}</span> {stat.label}
                        </span>
                      ); })}
                      {profileData.joinDate && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nf-secondary text-[11px] text-nf-dim font-medium"><Calendar size={11} className="text-nf-accent" /> انضم {timeAgo(profileData.joinDate)}</span>}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 mb-4 bg-nf-card rounded-lg p-1">
                    {[
                      { icon: MessageCircle, label: "المواضيع", id: "threads" as const },
                      { icon: Reply, label: "الردود", id: "replies" as const },
                      { icon: Bookmark, label: "المحفوظات", id: "saved" as const },
                      { icon: Award, label: "الإنجازات", id: "awards" as const },
                    ].map(tab => { const TI = tab.icon; return (
                      <button key={tab.id} onClick={() => setProfileTab(tab.id)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-colors", profileTab === tab.id ? "bg-nf-secondary/50 text-white" : "text-nf-muted hover:bg-nf-secondary/40 hover:text-white")}>
                        <TI size={13} /><span>{tab.label}</span>
                      </button>
                    ); })}
                  </div>

                  {/* Tab content */}
                  {profileTab === "threads" && (
                    profileData.threads && profileData.threads.length > 0 ? profileData.threads.map(thread => (
                      <div key={thread.id} onClick={() => { setSelectedCommunity(thread.community); openThread(thread.id); }} className="bg-nf-card rounded-xl mb-3 hover:bg-[#2e2e30] cursor-pointer transition-all p-5 border border-nf-border/20 group">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                            <ArrowUp size={14} className={cn("transition-colors", (thread.votes || 0) > 0 ? "text-green-400" : "text-nf-dim")} />
                            <span className="text-[12px] font-bold text-nf-text">{thread.votes || 0}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {(() => { const ti = getTypeInfo(thread.type); const TI = ti.icon; return <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold", ti.bg, ti.color)}><TI size={9} />{ti.label}</span>; })()}
                              <span className="text-[15px] font-bold text-nf-text truncate group-hover:text-nf-accent transition-colors">{thread.title}</span>
                              {thread.solved && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-400/10 text-green-400 font-bold">✓ محلول</span>}
                            </div>
                            {thread.body && <p className="text-[12px] text-nf-dim leading-[1.8] line-clamp-2 mb-2">{thread.body.replace(/[#*_`\[\]\(\)]/g, "").slice(0, 150)}</p>}
                            <div className="flex items-center gap-3 text-[11px] text-nf-dim font-medium">
                              <span className="text-nf-accent">{thread.community}</span>
                              <span>{timeAgo(thread.createdAt)}</span>
                              <span className="flex items-center gap-1"><MessageSquare size={10} /> {thread.replyCount} رد</span>
                              <span className="flex items-center gap-1"><Eye size={10} /> {thread.views || 0}</span>
                              {thread.tags && thread.tags.length > 0 && <span className="bg-nf-accent/10 text-nf-accent px-1.5 py-0.5 rounded text-[9px] font-bold">{thread.tags[0]}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : <p className="text-[14px] text-nf-dim text-center py-10">لا توجد مواضيع بعد</p>
                  )}

                  {profileTab === "saved" && (
                    (() => {
                      const allLoaded = [...allThreads, ...threads];
                      const unique = new Map<string, ForumThread>();
                      allLoaded.forEach(t => unique.set(t.id, t));
                      const savedList = [...unique.values()].filter(t => savedThreads.has(t.id));
                      return savedList.length > 0 ? savedList.map(thread => (
                        <div key={thread.id} onClick={() => { setSelectedCommunity(thread.community); openThread(thread.id); }} className="bg-nf-card rounded-xl mb-3 hover:bg-[#2e2e30] cursor-pointer transition-all p-5 border border-nf-border/20 group">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                              <ArrowUp size={14} className={cn("transition-colors", (thread.votes || 0) > 0 ? "text-green-400" : "text-nf-dim")} />
                              <span className="text-[12px] font-bold text-nf-text">{thread.votes || 0}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                {(() => { const ti = getTypeInfo(thread.type); const TI = ti.icon; return <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold", ti.bg, ti.color)}><TI size={9} />{ti.label}</span>; })()}
                                <span className="text-[15px] font-bold text-nf-text truncate group-hover:text-nf-accent transition-colors">{thread.title}</span>
                              </div>
                              {thread.body && <p className="text-[12px] text-nf-dim leading-[1.8] line-clamp-2 mb-2">{thread.body.replace(/[#*_`\[\]\(\)]/g, "").slice(0, 150)}</p>}
                              <div className="flex items-center gap-3 text-[11px] text-nf-dim font-medium">
                                <span className="text-nf-accent">{thread.community}</span>
                                <span>{timeAgo(thread.createdAt)}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={10} /> {thread.replyCount} رد</span>
                                <span className="flex items-center gap-1"><Eye size={10} /> {thread.views || 0}</span>
                                <button onClick={e => { e.stopPropagation(); const n = new Set(savedThreads); n.delete(thread.id); setSavedThreads(n); showToast("تم إزالة الحفظ"); }} className="text-nf-accent hover:underline mr-auto">إزالة</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : <p className="text-[14px] text-nf-dim text-center py-10">لا توجد محفوظات</p>;
                    })()
                  )}

                  {profileTab === "replies" && (
                    <p className="text-[14px] text-nf-dim text-center py-10">قريباً</p>
                  )}

                  {profileTab === "awards" && (
                    <p className="text-[14px] text-nf-dim text-center py-10">قريباً</p>
                  )}
                </motion.div>
              )}

              {/* THREAD VIEW */}
              {viewMode === "thread" && activeThread && (
                <motion.div key="thread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-[12px] text-nf-dim font-medium mb-4">
                    <button onClick={backToList} className="flex items-center gap-1.5 text-nf-accent hover:underline font-bold"><ArrowLeft size={13} /> المنتدى</button>
                    <ChevronRight size={11} className="text-nf-border" />
                    <span className="text-nf-text font-bold">{activeThread.community}</span>
                    <ChevronRight size={11} className="text-nf-border" />
                    <span className="truncate max-w-[300px]">{activeThread.title}</span>
                  </div>

                  {/* Thread header with timeline sidebar */}
                  <div className="flex gap-4 mb-5">
                    {/* Main content */}
                    <div className="flex-1 bg-nf-card rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {(() => { const TI = activeTypeInfo.icon; return <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold", activeTypeInfo.bg, activeTypeInfo.color)}><TI size={11} />{activeTypeInfo.label}</span>; })()}
                        {activeThread.tags?.map(tag => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-nf-secondary text-nf-dim font-medium">{tag}</span>)}
                        {activeThread.solved && <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-400/10 text-green-400 text-[10px] font-bold"><CheckCircle2 size={10} /> محلول</span>}
                        {activeThread.locked && <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 text-[10px] font-bold"><Lock size={10} /> مغلق</span>}
                        {activeThread.pinned && <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-nf-accent/10 text-nf-accent text-[10px] font-bold"><Pin size={10} /> مثبّت</span>}
                        <div className="flex items-center gap-3 mr-auto text-[11px] text-nf-dim font-medium">
                          <span className="flex items-center gap-1"><Eye size={11} />{activeThread.views || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={11} />{activeReplies.length || activeThread.replyCount}</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(activeThread.createdAt)}</span>
                        </div>
                      </div>
                      <h1 className="text-[26px] font-bold text-nf-text leading-[1.3] mb-5">{activeThread.title}</h1>
                      <div className="flex gap-4">
                        {/* Author with hover card */}
                        <div className="relative group shrink-0" onMouseEnter={() => fetchAuthorCache(activeThread.authorUid)}>
                          <div className="flex flex-col items-center gap-1.5 w-[52px]" onClick={() => openProfile(activeThread.authorUid, activeThread.authorName, activeThread.authorPhoto)}>
                            {activeThread.authorPhoto ? <img src={activeThread.authorPhoto} alt="" className="w-11 h-11 rounded-full object-cover cursor-pointer" /> : <div className="w-11 h-11 rounded-full bg-nf-muted flex items-center justify-center text-white text-[15px] font-bold cursor-pointer">{(activeThread.authorName || "م")[0]}</div>}
                            <span className="text-[11px] font-bold text-nf-text hover:text-nf-accent cursor-pointer text-center inline-flex items-center gap-0.5">{activeThread.authorName}{(activeThread.authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[10px] h-[10px] inline" />}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-nf-accent/10 text-nf-accent font-bold">صاحب</span>
                          </div>
                          {/* Hover Profile Card */}
                          <div className="absolute top-0 right-full mr-2 w-[520px] bg-nf-card rounded-xl shadow-2xl border border-nf-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                            {/* Banner */}
                            <div className="relative h-[120px] overflow-hidden">
                              <img src={authorCache[activeThread.authorUid]?.bannerUrl || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-nf-card via-nf-card/30 to-transparent" />
                              {activeThread.authorPhoto && <img src={activeThread.authorPhoto} alt="" className="absolute bottom-2 left-4 w-16 h-16 rounded-full object-cover border-[3px] border-nf-card shadow-lg" />}
                            </div>
                            <div className="px-5 pt-1 pb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <div>
                                  <p className="text-[17px] font-bold text-nf-text inline-flex items-center gap-1.5">{activeThread.authorName}{(activeThread.authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[16px] h-[16px] inline" />}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[11px] text-nf-accent">@{activeThread.authorName}</p>
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent font-bold">{authorCache[activeThread.authorUid]?.role || "عضو"}</span>
                                    <span className={cn("flex items-center gap-1 text-[9px] font-bold", authorCache[activeThread.authorUid]?.isOnline ? "text-green-400" : "text-nf-dim")}>
                                      <span className={cn("w-1.5 h-1.5 rounded-full", authorCache[activeThread.authorUid]?.isOnline ? "bg-green-400" : "bg-nf-dim")} />
                                      {authorCache[activeThread.authorUid]?.isOnline ? "متصل الآن" : "غير متصل"}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] px-2 py-1 rounded-full bg-nf-accent/10 text-nf-accent font-bold">صاحب المنشور</span>
                              </div>
                              {/* Bio */}
                              {authorCache[activeThread.authorUid]?.bio && <p className="text-[11px] text-nf-dim leading-[1.7] mb-2.5 line-clamp-2">{authorCache[activeThread.authorUid].bio}</p>}
                              {/* Stats row */}
                              <div className="flex items-center gap-4 mb-2.5 border-t border-nf-border/40 pt-2.5 text-[11px]">
                                <span className="text-nf-dim"><span className="font-bold text-nf-text text-[13px]">{authorCache[activeThread.authorUid]?.karma ?? sortedThreads.filter(t => t.authorUid === activeThread.authorUid).reduce((s, t) => s + (t.votes || 0), 0)}</span> تأثير</span>
                                <span className="text-nf-dim"><span className="font-bold text-nf-text text-[13px]">{sortedThreads.filter(t => t.authorUid === activeThread.authorUid).length}</span> موضوع</span>
                                <span className="text-nf-dim"><span className="font-bold text-nf-text text-[13px]">{activeReplies.filter(r => r.authorUid === activeThread.authorUid).length}</span> رد</span>
                                <span className="text-nf-dim"><span className="font-bold text-nf-text text-[13px]">{authorCache[activeThread.authorUid]?.followerCount ?? "—"}</span> متابِع</span>
                                <span className="text-nf-dim"><span className="font-bold text-nf-text text-[13px]">{authorCache[activeThread.authorUid]?.followingCount ?? "—"}</span> متابَع</span>
                                <span className="text-nf-dim"><span className="font-bold text-nf-text text-[13px]">{allThreads.filter(t => t.authorUid === activeThread.authorUid).reduce((s, t) => s + (t.views || 0), 0)}</span> مشاهدة</span>
                              </div>
                              {/* Join date */}
                              {authorCache[activeThread.authorUid]?.joinDate && <div className="flex items-center gap-1.5 mb-2 text-[9px] text-nf-dim"><Calendar size={9} className="text-nf-accent" /> انضم {timeAgo(authorCache[activeThread.authorUid].joinDate!)}</div>}
                              {/* Social links */}
                              {authorCache[activeThread.authorUid]?.socialLinks && Object.values(authorCache[activeThread.authorUid].socialLinks!).some(v => v?.trim()) && (
                                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                  {Object.entries(authorCache[activeThread.authorUid].socialLinks!).filter(([, v]) => v?.trim()).map(([key, val]) => {
                                    const labels: Record<string, string> = { twitter: "X", youtube: "YouTube", github: "GitHub", steam: "Steam", discord: "Discord", website: "موقع" };
                                    return <a key={key} href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-nf-secondary text-[9px] text-nf-accent font-bold hover:bg-nf-accent/10 transition-colors"><ExternalLink size={8} />{labels[key] || key}</a>;
                                  })}
                                </div>
                              )}
                              {/* Communities */}
                              <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                                {[...new Set(allThreads.filter(t => t.authorUid === activeThread.authorUid).map(t => t.community))].slice(0, 5).map(c => (
                                  <span key={c} className="px-2 py-0.5 rounded bg-nf-secondary text-[9px] text-nf-dim font-bold">{c}</span>
                                ))}
                              </div>
                              {/* Badges */}
                              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                {authorCache[activeThread.authorUid]?.role === "مشرف" && <span className="px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 text-[8px] font-bold">🛡 مشرف</span>}
                                <span className="px-2 py-0.5 rounded-full bg-nf-secondary text-nf-dim text-[8px] font-bold">🏆 قريباً</span>
                              </div>
                              {/* Action buttons */}
                              <div className="flex items-center gap-2">
                                <button onClick={() => openProfile(activeThread.authorUid, activeThread.authorName, activeThread.authorPhoto)} className="flex-1 bg-nf-accent/15 hover:bg-nf-accent/25 text-nf-accent text-[11px] font-bold py-2 rounded-lg transition-colors">عرض البروفايل</button>
                                <button onClick={() => setReplyingTo(activeThread.id)} className="px-3 py-2 rounded-lg bg-nf-secondary text-nf-dim hover:text-nf-text hover:bg-nf-secondary/60 text-[11px] font-bold transition-colors"><MessageSquare size={12} /></button>
                                {user?.uid !== activeThread.authorUid && <button onClick={() => toggleFollowUser(activeThread.authorUid)} className={cn("px-3 py-2 rounded-lg text-[11px] font-bold transition-colors", followedUsers.has(activeThread.authorUid) ? "bg-nf-accent/20 text-nf-accent" : "bg-nf-accent/10 text-nf-accent hover:bg-nf-accent/20")}>{followedUsers.has(activeThread.authorUid) ? "متابَع ✓" : "متابعة"}</button>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                        {activeThread.body && <div className="text-[16px] leading-[2.2] text-nf-text">{renderBody(activeThread.body, (name) => { const t = threads.find(t => t.authorName === name); if (t) openProfile(t.authorUid, name, t.authorPhoto); })}</div>}

                        {/* Inline AI Summary */}
                        <AnimatePresence>
                          {(aiSummaryLoading || aiThreadSummary) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, scale: 0.97 }}
                              animate={{ opacity: 1, height: "auto", scale: 1 }}
                              exit={{ opacity: 0, height: 0, scale: 0.97 }}
                              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 rounded-xl border border-nf-accent/10 bg-gradient-to-br from-nf-accent/3 via-nf-card to-nf-accent/2 p-4 relative">
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-nf-accent/15 to-transparent" />
                                <div className="flex items-center gap-2 mb-3">
                                  <motion.div animate={aiSummaryLoading ? { rotate: 360 } : {}} transition={aiSummaryLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}} className="w-5 h-5 rounded-md bg-nf-accent/10 flex items-center justify-center">
                                    <Sparkles size={10} className="text-nf-accent" />
                                  </motion.div>
                                  <span className="text-[11px] font-extrabold text-nf-accent/70">ملخص الموضوع</span>
                                  <span className="text-[9px] text-nf-dim/30">{activeReplies.length} رد</span>
                                  {aiThreadSummary && (
                                    <button onClick={() => { navigator.clipboard.writeText(aiThreadSummary).catch(() => {}); showToast("تم نسخ الملخص"); }} className="mr-auto text-[9px] text-nf-dim/30 hover:text-nf-accent transition-colors"><Copy size={10} /></button>
                                  )}
                                </div>
                                {aiSummaryLoading ? (
                                  <div className="flex items-center gap-1.5 py-2">
                                    {[0,1,2,3,4].map(i => (
                                      <motion.span key={i} animate={{ height: [4, 12, 4], opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }} className="w-[2px] rounded-full bg-nf-accent/30" />
                                    ))}
                                    <span className="text-[10px] text-nf-accent/30 mr-2">يولّد الملخص...</span>
                                  </div>
                                ) : (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-[13px] leading-[2] text-nf-text/80">
                                    <ReactMarkdown components={{ h3: ({ children }: any) => <h3 className="text-[14px] font-bold text-nf-accent/60 mt-2 mb-1">{children}</h3>, p: ({ children }: any) => <p className="my-0.5">{children}</p>, ul: ({ children }: any) => <ul className="list-disc list-outside mr-4 space-y-0.5 my-1">{children}</ul>, li: ({ children }: any) => <li className="text-nf-dim/70">{children}</li> }}>{aiThreadSummary}</ReactMarkdown>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* AI Tool Result */}
                        <AnimatePresence>
                          {aiToolResult && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, scale: 0.97 }}
                              animate={{ opacity: 1, height: "auto", scale: 1 }}
                              exit={{ opacity: 0, height: 0, scale: 0.97 }}
                              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 rounded-xl border border-nf-accent/10 bg-gradient-to-br from-nf-accent/3 via-nf-card to-nf-accent/2 p-4 relative">
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-nf-accent/15 to-transparent" />
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-5 h-5 rounded-md bg-nf-accent/10 flex items-center justify-center"><Sparkles size={10} className="text-nf-accent" /></div>
                                  <span className="text-[11px] font-extrabold text-nf-accent/70">{aiToolResult.label}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(aiToolResult.text).catch(() => {}); showToast("تم النسخ"); }} className="mr-auto text-[9px] text-nf-dim/30 hover:text-nf-accent transition-colors"><Copy size={10} /></button>
                                  <button onClick={() => setAiToolResult(null)} className="text-[9px] text-nf-dim/30 hover:text-nf-text transition-colors"><X size={10} /></button>
                                </div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-[13px] leading-[2] text-nf-text/80">
                                  <ReactMarkdown components={{ h2: ({ children }: any) => <h2 className="text-[15px] font-bold text-nf-accent/60 mt-2 mb-1">{children}</h2>, h3: ({ children }: any) => <h3 className="text-[14px] font-bold text-nf-accent/50 mt-2 mb-1">{children}</h3>, p: ({ children }: any) => <p className="my-0.5">{children}</p>, ul: ({ children }: any) => <ul className="list-disc list-outside mr-4 space-y-0.5 my-1">{children}</ul>, li: ({ children }: any) => <li className="text-nf-dim/70">{children}</li>, code: ({ children, className }: any) => { const lang = className?.replace("language-", ""); return lang ? <code className="text-[11px] bg-nf-secondary/40 px-1 py-0.5 rounded text-nf-accent/70">{children}</code> : <code className="text-[11px] bg-nf-secondary/40 px-1 py-0.5 rounded text-nf-accent/70">{children}</code>; } }}>{aiToolResult.text}</ReactMarkdown>
                                </motion.div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>


                        <div className="flex items-center justify-between mt-5 pt-3 border-t border-nf-border">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => setReplyingTo(activeThread.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-nf-dim hover:text-nf-accent hover:bg-nf-secondary/40 font-bold transition-colors"><Reply size={13} /> رد</button>
                            <button onClick={() => { setQuotedThreadId(activeThread.id); setReplyingTo(activeThread.id); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-nf-dim hover:text-nf-accent hover:bg-nf-secondary/40 font-bold transition-colors"><Quote size={13} /> اقتباس</button>
                            <button onClick={() => openShare(activeThread.id, activeThread.title)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-nf-dim hover:text-nf-accent hover:bg-nf-secondary/40 font-medium transition-colors"><Share2 size={12} /> مشاركة</button>
                            <button onClick={() => copyText(`${window.location.origin}/forum?view=thread&threadId=${activeThread.id}&community=${activeThread.community}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-nf-dim hover:text-nf-accent hover:bg-nf-secondary/40 font-medium transition-colors"><Link2 size={12} /> نسخ الرابط</button>
                            <button onClick={() => { const n = new Set(savedThreads); if (n.has(activeThread.id)) { n.delete(activeThread.id); showToast("تم إزالة الحفظ"); } else { n.add(activeThread.id); showToast("تم الحفظ ✓"); } setSavedThreads(n); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors", savedThreads.has(activeThread.id) ? "text-nf-accent hover:bg-nf-secondary/40" : "text-nf-dim hover:text-nf-accent hover:bg-nf-secondary/40")}><Bookmark size={12} fill={savedThreads.has(activeThread.id) ? "currentColor" : "none"} /> حفظ</button>
                            {/* AI Summary button */}
                            <button onClick={async () => {
                              if (aiThreadSummary) { setAiThreadSummary(null); return; }
                              setAiSummaryLoading(true);
                              try {
                                const allRepliesText = activeReplies.map(r => `${r.authorName}: ${r.text}`).join("\n");
                                const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `لخّص هذا الموضوع وكل الردود بشكل مختصر (5-6 أسطر). اذكر الأفكار الرئيسية والنقاط المهمة:\n\nالموضوع: ${activeThread.title}\n${activeThread.body || ""}\n\nالردود:\n${allRepliesText || "لا توجد ردود"}` }], "أنت مساعد في منتدى. لخّص الموضوع والردود بشكل مختصر ومفيد. أجب بالعربية فقط بدون إيموجي. استخدم ### للعناوين.");
                                if (result?.trim()) setAiThreadSummary(result.trim());
                              } catch (err: any) { showToast(`خطأ: ${(err?.message || "").slice(0, 60)}`); }
                              finally { setAiSummaryLoading(false); }
                            }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all", aiThreadSummary ? "text-nf-accent bg-nf-accent/10" : "text-nf-dim hover:text-nf-accent hover:bg-nf-accent/5")}><Sparkles size={12} className={aiSummaryLoading ? "animate-spin" : ""} /> {aiThreadSummary ? "إخفاء الملخص" : "ملخص"}</button>
                            {/* AI Smart Reply */}
                            <button onClick={async () => {
                              const allRepliesText = activeReplies.slice(-5).map(r => `${r.authorName}: ${r.text}`).join("\n");
                              try {
                                const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `اقترح رد مناسب على هذا الموضوع بناءً على المحتوى والردود السابقة. اكتب رداً مفيداً يضيف للنقاش:\n\nالموضوع: ${activeThread.title}\n${activeThread.body || ""}\n\nآخر الردود:\n${allRepliesText || "لا توجد ردود"}` }], "أنت عضو في منتدى. اقترح رد مفيد ومناسب يضيف للنقاش. أجب بالرد المقترح فقط بدون شرح. بدون إيموجي.");
                                if (result && result.trim()) {
                                  setReplyText(result.trim());
                                  showToast("تم اقتراح رد — حرّره في حقل الرد");
                                } else { showToast("لم يُولّد اقتراح"); }
                              } catch (err: any) { showToast(`خطأ: ${(err?.message || "").slice(0, 60)}`); }
                            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-nf-dim hover:text-nf-accent hover:bg-nf-accent/5 font-medium transition-colors"><Zap size={12} /> اقتراح رد</button>
                            {user?.uid === activeThread.authorUid && (
                              <button onClick={() => { const comm = activeThread.community; const nextSolved = !activeThread.solved; updateDoc(doc(db, "forums", comm, "threads", activeThread.id), { solved: nextSolved }); setThreads(p => p.map(th => th.id === activeThread.id ? { ...th, solved: nextSolved } : th)); showToast(nextSolved ? "تم حل الموضوع ✓" : "تم إلغاء الحل"); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors", activeThread.solved ? "text-nf-dim hover:text-nf-text hover:bg-nf-secondary/40" : "text-green-400 hover:bg-green-400/10")}><CheckCircle2 size={12} /> {activeThread.solved ? "إلغاء الحل" : "تم الحل"}</button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* AI Tools Dropdown - matches model selector style */}
                            <div className="relative" ref={aiModeDropdownRef}>
                              <button onClick={() => setAiModelDropdown(!aiModelDropdown)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold text-nf-dim/50 hover:text-nf-dim hover:bg-nf-secondary/30 transition-all whitespace-nowrap border border-nf-border/6 hover:border-nf-border/15">
                                <Sparkles size={8} className="text-nf-accent/50" />
                                <span>AI</span>
                                <ChevronDown size={8} className={cn("shrink-0 transition-transform opacity-40", aiModelDropdown && "rotate-180")} />
                              </button>
                              <AnimatePresence>
                                {aiModelDropdown && (
                                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.1 }} className="absolute right-0 top-full mt-1 z-[9999] rounded-xl border border-nf-border/15 shadow-xl shadow-black/30 min-w-[180px] overflow-y-auto py-0.5" style={{ backgroundColor: "rgba(24,24,26,0.95)", backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}>
                                    <div className="px-2.5 pt-1 pb-0.5 flex items-center gap-1"><Sparkles size={9} className="text-nf-accent/40" /><span className="text-[7px] font-bold text-nf-dim/50 uppercase tracking-wider">أدوات ذكية</span></div>
                                    {[
                                      { icon: Globe, label: "ترجم للإنجليزية", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `ترجم هذا النص للإنجليزية بشكل احترافي:\n\n${(activeThread.body || "").slice(0, 2000)}` }], "أنت مترجم محترف. ترجم النص فقط بدون أي شرح."); if (r?.trim()) setAiToolResult({ label: "الترجمة", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: BookOpen, label: "اشرح لي", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `اشرح هذا الموضوع بطريقة مبسطة للمبتدئين:\n\n${activeThread.title}\n${(activeThread.body || "").slice(0, 1500)}` }], "أنت معلم صبور. اشرح الموضوع ببساطة مع أمثلة. بدون إيموجي. استخدم ### للعناوين."); if (r?.trim()) setAiToolResult({ label: "الشرح", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: Maximize2, label: "وسّع الموضوع", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `وسّع هذا الموضوع وأضف تفاصيل أكثر وأمثلة عملية:\n\n${activeThread.title}\n${(activeThread.body || "").slice(0, 1500)}` }], "أنت كاتب محترف. وسّع الموضوع بأفكار جديدة وأمثلة. بدون إيموجي. استخدم ### للعناوين."); if (r?.trim()) setAiToolResult({ label: "التوسيع", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: Edit3, label: "صحح الأخطاء", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `صحح الأخطاء اللغوية والنحوية في هذا النص:\n\n${(activeThread.body || "").slice(0, 2000)}` }], "أنت مدقق لغوي. صحح الأخطاء فقط وأعد النص المصحح. بدون شرح."); if (r?.trim()) setAiToolResult({ label: "التصحيح", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: List, label: "لخّص النقاط", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `لخّص هذا الموضوع في نقاط مختصرة:\n\n${activeThread.title}\n${(activeThread.body || "").slice(0, 2000)}` }], "أنت ملخص محترف. لخّص بالنقاط فقط. بدون إيموجي. استخدم ### للعناوين."); if (r?.trim()) setAiToolResult({ label: "التلخيص", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: MessageCircle, label: "حلل الردود", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const repliesText = activeReplies.slice(0, 10).map(r => `${r.authorName}: ${r.text}`).join("\n"); const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `حلل الردود على هذا الموضوع. ما هي الآراء الرئيسية؟ هل هناك اتفاق أو خلاف؟:\n\nالموضوع: ${activeThread.title}\n\nالردود:\n${repliesText || "لا توجد ردود"}` }], "أنت محلل. حلل الآراء والنقاط الرئيسية. بدون إيموجي. استخدم ### للعناوين."); if (r?.trim()) setAiToolResult({ label: "تحليل الردود", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: Lightbulb, label: "أفكار مرتبطة", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `اقترح 5 أفكار مرتبطة بهذا الموضوع يمكن كتابة مواضيع عنها:\n\n${activeThread.title}\n${(activeThread.body || "").slice(0, 1000)}` }], "أنت مبدع. اقترح أفكار مرتبطة فقط. بدون إيموجي. استخدم ### للعناوين."); if (r?.trim()) setAiToolResult({ label: "أفكار مرتبطة", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: Heading2, label: "اقترح عنوان", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `اقترح 3 عناوين أفضل لهذا الموضوع:\n\n${activeThread.title}\n${(activeThread.body || "").slice(0, 500)}` }], "أنت محرر. اقترح عناوين جذابة ومختصرة فقط. كل عنوان في سطر منفصل. بدون إيموجي."); if (r?.trim()) setAiToolResult({ label: "عناوين مقترحة", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                      { icon: Filter, label: "أنشئ وسوم", action: async () => {  setAiToolLoading(true); setAiToolResult(null); setAiModelDropdown(false); try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `أنشئ 5 وسوم (hashtags) مناسبة لهذا الموضوع:\n\n${activeThread.title}\n${(activeThread.body || "").slice(0, 500)}` }], "أنت خبير وسوم. أنشئ وسوم قصيرة ومناسبة فقط. كل وسم في سطر. بدون إيموجي. بدون #."); if (r?.trim()) setAiToolResult({ label: "وسوم مقترحة", text: r.trim() }); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiToolLoading(false); } } },
                                    ].map((tool) => { const TI = tool.icon; return <button key={tool.label} onClick={tool.action} disabled={aiToolLoading} className={cn("w-[calc(100%-4px)] flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all rounded-lg mx-0.5", aiToolLoading ? "opacity-30" : "text-nf-text/80 hover:bg-white/4")}><TI size={10} className="text-nf-accent/40" /><span className="flex-1 text-right">{tool.label}</span></button>; })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <button onClick={() => handleVote(activeThread.id, "up")} className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors", userVotes[activeThread.id] === "up" ? "bg-green-400/10 text-green-400" : "text-nf-dim hover:text-nf-accent hover:bg-nf-secondary/40")}><ThumbsUp size={13} />{activeThread.votes || 0}</button>
                            <button onClick={() => handleVote(activeThread.id, "down")} className={cn("px-2.5 py-1.5 rounded-lg text-[12px] transition-colors", userVotes[activeThread.id] === "down" ? "bg-red-400/10 text-red-400" : "text-nf-dim hover:text-nf-accent hover:bg-nf-secondary/40")}><ThumbsDown size={13} /></button>
                            <div className="relative" ref={menuOpen === activeThread.id ? menuRef : undefined}>
                              <button onClick={() => setMenuOpen(menuOpen === activeThread.id ? null : activeThread.id)} className="p-1.5 rounded-lg text-nf-dim hover:text-nf-text hover:bg-nf-secondary/40 transition-colors"><MoreHorizontal size={14} /></button>
                              {menuOpen === activeThread.id && (
                                <div className="absolute left-0 top-8 bg-nf-card rounded-lg py-1.5 z-20 min-w-[140px] shadow-lg border border-nf-border" ref={menuRef}>
                                  <button onClick={() => { setReportTarget("thread"); setReportTargetId(activeThread.id); setReportModalOpen(true); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-red-400 hover:bg-red-400/10 font-medium"><Flag size={11} /> أبلغ عن المنشور</button>
                                  {user?.uid === activeThread.authorUid && <button onClick={() => { if (confirm("هل أنت متأكد من حذف هذا المنشور؟")) handleDeleteThread(activeThread.id, activeThread.community); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-red-400 hover:bg-red-400/10 font-medium"><Trash2 size={11} /> حذف المنشور</button>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Timeline Sidebar - like the image */}
                    <div className="w-[60px] shrink-0 hidden md:flex flex-col items-center py-4">
                      {/* Top date */}
                      <div className="text-[10px] text-nf-dim mb-2">{new Date(activeThread.createdAt).toLocaleDateString('ar-SA', {month: 'short', day: 'numeric'})}</div>
                      {/* Pagination indicator */}
                      <div className="bg-nf-card rounded-lg px-2 py-1 mb-2">
                        <span className="text-[11px] font-bold text-nf-text">1</span>
                        <span className="text-[10px] text-nf-dim">/{Math.ceil(activeReplies.length / 5) || 1}</span>
                      </div>
                      {/* Vertical line */}
                      <div className="flex-1 w-px bg-nf-border my-2 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-nf-accent" />
                      </div>
                      {/* Bottom date */}
                      <div className="text-[10px] text-nf-dim mt-2">
                        {activeReplies.length > 0 ? timeAgo(activeReplies[activeReplies.length - 1]?.createdAt) : timeAgo(activeThread.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Replies section - flat cards with timeline */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[16px] font-bold text-nf-text flex items-center gap-2"><MessageCircle size={16} className="text-nf-accent" /> {activeReplies.length} ردود</h3>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setReplySort("oldest")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all", replySort === "oldest" ? "border-nf-accent text-nf-accent bg-nf-accent/5" : "border-nf-border text-nf-dim hover:text-nf-text hover:border-nf-accent/40 hover:bg-nf-secondary/30")}><Clock size={11} /> الأقدم</button>
                        <button onClick={() => setReplySort("newest")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all", replySort === "newest" ? "border-nf-accent text-nf-accent bg-nf-accent/5" : "border-nf-border text-nf-dim hover:text-nf-text hover:border-nf-accent/40 hover:bg-nf-secondary/30")}><Flame size={11} /> الأحدث</button>
                      </div>
                    </div>
                    {/* Time filter */}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-[10px] text-nf-dim ml-1">الفترة:</span>
                      {[{id:"all" as const,l:"الكل"},{id:"today" as const,l:"اليوم"},{id:"week" as const,l:"هالأسبوع"},{id:"month" as const,l:"هالشهر"}].map(f => (
                        <button key={f.id} onClick={() => setReplyTimeFilter(f.id)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors", replyTimeFilter === f.id ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-nf-muted hover:bg-nf-secondary/30")}>{f.l}</button>
                      ))}
                    </div>
                    {sortedReplies.length === 0 && activeReplies.length > 0 && (
                      <div className="text-center py-8"><p className="text-[12px] text-nf-dim">لا توجد ردود في هذه الفترة</p></div>
                    )}
                    {sortedReplies.map((reply, i) => (
                      <Fragment key={reply.id || i}>
                      <div id={`reply-${reply.id}`} className={cn("bg-nf-card rounded-xl mb-3 p-5 group/reply shadow-sm border border-nf-border/20", i > 0 && sortedReplies[i-1]?.authorUid === reply.authorUid && "mt-1")}>
                        <div className="flex gap-4">
                          {/* Vote column */}
                          <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                            <button onClick={() => handleVote(reply.id, "up")} className={cn("p-1 rounded-md transition-colors", userVotes[reply.id] === "up" ? "text-green-400 bg-green-400/10" : "text-nf-dim hover:text-green-400 hover:bg-green-400/5")}><ArrowUp size={16} /></button>
                            <span className={cn("text-[13px] font-bold", userVotes[reply.id] === "up" ? "text-green-400" : userVotes[reply.id] === "down" ? "text-red-400" : "text-nf-text")}>{reply.votes || 0}</span>
                            <button onClick={() => handleVote(reply.id, "down")} className={cn("p-1 rounded-md transition-colors", userVotes[reply.id] === "down" ? "text-red-400 bg-red-400/10" : "text-nf-dim hover:text-red-400 hover:bg-red-400/5")}><ThumbsDown size={14} /></button>
                          </div>
                          {/* Reply content */}
                          <div className="flex-1 min-w-0">
                            {/* Reply author with hover card */}
                            <div className="relative group shrink-0 mb-2 inline-block" onMouseEnter={() => fetchAuthorCache(reply.authorUid)}>
                              <span className="flex items-center gap-2 cursor-pointer" onClick={() => openProfile(reply.authorUid, reply.authorName, reply.authorPhoto)}>
                                {reply.authorPhoto ? <img src={reply.authorPhoto} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-nf-muted flex items-center justify-center text-white text-[10px] font-bold">{(reply.authorName || "م")[0]}</div>}
                                <span className="text-[13px] font-medium text-nf-accent hover:text-nf-accent/80 transition-colors inline-flex items-center gap-1">{reply.authorName}{(reply.authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[14px] h-[14px] inline" />}</span>
                                {reply.authorUid === activeThread.authorUid && <span className="text-[9px] px-1.5 py-0.5 rounded bg-nf-accent/10 text-nf-accent font-bold">صاحب</span>}
                              </span>
                              {/* Hover Profile Card */}
                              <div className="absolute top-full mt-1 right-0 w-[480px] bg-nf-card rounded-xl shadow-2xl border border-nf-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                                {/* Banner */}
                                <div className="relative h-[100px] overflow-hidden">
                                  <img src={authorCache[reply.authorUid]?.bannerUrl || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-nf-card via-nf-card/30 to-transparent" />
                                  {reply.authorPhoto && <img src={reply.authorPhoto} alt="" className="absolute bottom-2 left-3 w-14 h-14 rounded-full object-cover border-[3px] border-nf-card shadow-lg" />}
                                </div>
                                <div className="px-4 pt-1 pb-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div>
                                      <p className="text-[16px] font-bold text-nf-text inline-flex items-center gap-1.5">{reply.authorName}{(reply.authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[15px] h-[15px] inline" />}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-nf-accent">@{reply.authorName}</p>
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent font-bold">{authorCache[reply.authorUid]?.role || "عضو"}</span>
                                        <span className={cn("flex items-center gap-1 text-[9px] font-bold", authorCache[reply.authorUid]?.isOnline ? "text-green-400" : "text-nf-dim")}>
                                          <span className={cn("w-1.5 h-1.5 rounded-full", authorCache[reply.authorUid]?.isOnline ? "bg-green-400" : "bg-nf-dim")} />
                                          {authorCache[reply.authorUid]?.isOnline ? "متصل الآن" : "غير متصل"}
                                        </span>
                                      </div>
                                    </div>
                                    {reply.authorUid === activeThread.authorUid && <span className="text-[9px] px-2 py-1 rounded-full bg-nf-accent/10 text-nf-accent font-bold">صاحب المنشور</span>}
                                  </div>
                                  {/* Bio */}
                                  {authorCache[reply.authorUid]?.bio && <p className="text-[10px] text-nf-dim leading-[1.6] mb-2 line-clamp-2">{authorCache[reply.authorUid].bio}</p>}
                                  {/* Stats row */}
                                  <div className="flex items-center gap-3 mb-2 border-t border-nf-border/40 pt-2 text-[10px]">
                                    <span className="text-nf-dim"><span className="font-bold text-nf-text text-[12px]">{authorCache[reply.authorUid]?.karma ?? "—"}</span> تأثير</span>
                                    <span className="text-nf-dim"><span className="font-bold text-nf-text text-[12px]">{sortedThreads.filter(t => t.authorUid === reply.authorUid).length}</span> موضوع</span>
                                    <span className="text-nf-dim"><span className="font-bold text-nf-text text-[12px]">{activeReplies.filter(r => r.authorUid === reply.authorUid).length}</span> رد</span>
                                    <span className="text-nf-dim"><span className="font-bold text-nf-text text-[12px]">{authorCache[reply.authorUid]?.followerCount ?? "—"}</span> متابِع</span>
                                    <span className="text-nf-dim"><span className="font-bold text-nf-text text-[12px]">{authorCache[reply.authorUid]?.followingCount ?? "—"}</span> متابَع</span>
                                  </div>
                                  {/* Join date */}
                                  {authorCache[reply.authorUid]?.joinDate && <div className="flex items-center gap-1.5 mb-1.5 text-[9px] text-nf-dim"><Calendar size={9} className="text-nf-accent" /> انضم {timeAgo(authorCache[reply.authorUid].joinDate!)}</div>}
                                  {/* Social links */}
                                  {authorCache[reply.authorUid]?.socialLinks && Object.values(authorCache[reply.authorUid].socialLinks!).some(v => v?.trim()) && (
                                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                      {Object.entries(authorCache[reply.authorUid].socialLinks!).filter(([, v]) => v?.trim()).map(([key, val]) => {
                                        const labels: Record<string, string> = { twitter: "X", youtube: "YouTube", github: "GitHub", steam: "Steam", discord: "Discord", website: "موقع" };
                                        return <a key={key} href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-nf-secondary text-[9px] text-nf-accent font-bold hover:bg-nf-accent/10 transition-colors"><ExternalLink size={8} />{labels[key] || key}</a>;
                                      })}
                                    </div>
                                  )}
                                  {/* Communities */}
                                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                    {[...new Set(allThreads.filter(t => t.authorUid === reply.authorUid).map(t => t.community))].slice(0, 4).map(c => (
                                      <span key={c} className="px-2 py-0.5 rounded bg-nf-secondary text-[9px] text-nf-dim font-bold">{c}</span>
                                    ))}
                                  </div>
                                  {/* Badges */}
                                  <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                                    {authorCache[reply.authorUid]?.role === "مشرف" && <span className="px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 text-[8px] font-bold">🛡 مشرف</span>}
                                    <span className="px-2 py-0.5 rounded-full bg-nf-secondary text-nf-dim text-[8px] font-bold">🏆 قريباً</span>
                                  </div>
                                  {/* Action buttons */}
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => openProfile(reply.authorUid, reply.authorName, reply.authorPhoto)} className="flex-1 bg-nf-accent/15 hover:bg-nf-accent/25 text-nf-accent text-[10px] font-bold py-1.5 rounded-lg transition-colors">عرض البروفايل</button>
                                    <button onClick={() => setReplyText(`@${reply.authorName} `)} className="px-3 py-1.5 rounded-lg bg-nf-secondary text-nf-dim hover:text-nf-text hover:bg-nf-secondary/60 text-[10px] font-bold transition-colors"><MessageSquare size={11} /></button>
                                    {user?.uid !== reply.authorUid && <button onClick={() => toggleFollowUser(reply.authorUid)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors", followedUsers.has(reply.authorUid) ? "bg-nf-accent/20 text-nf-accent" : "bg-nf-accent/10 text-nf-accent hover:bg-nf-accent/20")}>{followedUsers.has(reply.authorUid) ? "متابَع ✓" : "متابعة"}</button>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className="text-[ssddadsa11px] text-nf-dim font-medium mr-2">{formatDate(reply.createdAt)}</span>
                            {reply.edited && <span className="text-[10px] text-nf-dim px-1.5 py-0.5 rounded bg-nf-secondary font-bold mr-1">معدّل</span>}
                            {editingReply === reply.id ? (
                              <div className="space-y-3">
                                <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-nf-secondary rounded-lg px-4 py-3 text-[15px] text-nf-text outline-none leading-[1.8] focus:ring-1 focus:ring-nf-accent min-h-[100px]" autoFocus />
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleEditReply(activeThreadId!, reply.id)} className="bg-nf-accent hover:bg-nf-accent/80 text-white text-[12px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"><CheckCircle2 size={12} /> حفظ</button>
                                  <button onClick={() => setEditingReply(null)} className="text-nf-dim hover:text-nf-text text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-nf-secondary/40">إلغاء</button>
                                </div>
                              </div>
                            ) : <>
                              {reply.quotedThreadId && (() => {
                                const qt = threads.find(t => t.id === reply.quotedThreadId) || allThreads.find(t => t.id === reply.quotedThreadId);
                                if (!qt) return null;
                                return (
                                  <div onClick={() => openThread(qt.id)} className="mb-3 rounded-lg border border-nf-border-2/40 bg-[#16161a] px-4 pt-3 pb-2 cursor-pointer hover:bg-[#1c1c22] hover:border-nf-border-2/70 transition-all duration-150">
                                    <div className="flex items-center gap-2 text-[12px] mb-1.5">
                                      <div className="w-4 h-4 rounded-full bg-nf-secondary overflow-hidden shrink-0">
                                        {qt.authorPhoto ? <img src={qt.authorPhoto} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[7px] text-nf-muted font-bold">{(qt.authorName || "U")[0]}</div>}
                                      </div>
                                      <span className="font-semibold text-nf-accent">{qt.community}</span>
                                      <span className="text-nf-dim">·</span>
                                      <span className="text-nf-muted">u/{qt.authorName}</span>
                                      <span className="text-nf-dim">·</span>
                                      <span className="text-nf-muted">{timeAgo(qt.createdAt)}</span>
                                    </div>
                                    {qt.title && <h4 className="text-[14px] font-bold text-white/80 leading-snug mb-1">{qt.title}</h4>}
                                    {qt.body && <p className="text-[12px] text-nf-text-2/80 leading-relaxed line-clamp-2">{qt.body.replace(/[#*_`\[\]\(\)]/g, "").slice(0, 150)}</p>}
                                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-nf-border-2/30 text-nf-dim">
                                      <button onClick={(e) => { e.stopPropagation(); setQuotedThreadId(qt.id); setReplyingTo(activeThreadId); setReplyText(`@${qt.authorName} `); }} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] hover:bg-nf-hover hover:text-white transition-colors"><Quote size={9} />اقتباس</button>
                                    </div>
                                  </div>
                                );
                              })()}
                              <div className="text-[16px] text-nf-text leading-[2.2]">{renderBody(reply.text, (name) => { const t = threads.find(t => t.authorName === name); if (t) openProfile(t.authorUid, name, t.authorPhoto); })}</div>
                            </>}
                            <div className="flex items-center gap-4 mt-4">
                              <button onClick={() => { setReplyingTo(reply.id); setReplyText(`@${reply.authorName} `); }} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-bold transition-colors"><Reply size={12} /> رد</button>
                              <button onClick={() => { setQuotedThreadId(activeThread.id); setReplyingTo(activeThreadId); setReplyText(`@${reply.authorName} `); }} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-bold transition-colors"><Quote size={12} /> اقتباس</button>
                              <button onClick={() => { copyText(reply.text); }} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-medium transition-colors"><Copy size={11} /> نسخ</button>
                              <button onClick={() => openShare(activeThread.id, activeThread.title)} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-medium transition-colors"><Share2 size={11} /> مشاركة</button>
                              {/* AI tools for reply - per-reply state */}
                              <button onClick={async () => {
                                                                setAiReplyLoading(reply.id); setAiReplyResult(p => { const n = {...p}; delete n[reply.id]; return n; });
                                try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `لخّص ما قاله هذا الشخص في رده بشكل مختصر (3-4 أسطر). اشرح الفكرة الرئيسية ببساطة:\n\n${reply.text}` }], "أنت مساعد في منتدى. لخّص رد الشخص بشكل مختصر ومفيد. أجب بالعربية فقط بدون إيموجي."); if (r?.trim()) setAiReplyResult(p => ({ ...p, [reply.id]: { label: "شرح", text: r.trim() } })); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiReplyLoading(null); }
                              }} className={cn("flex items-center gap-1.5 text-[12px] font-medium transition-all", aiReplyLoading === reply.id ? "text-nf-accent/40" : "text-nf-dim hover:text-nf-accent")}><Sparkles size={11} className={aiReplyLoading === reply.id ? "animate-spin" : ""} /> شرح</button>
                              <button onClick={async () => {
                                                                setAiReplyLoading(reply.id); setAiReplyResult(p => { const n = {...p}; delete n[reply.id]; return n; });
                                try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `ترجم هذا الرد ل${({en:"الإنجليزية",ar:"العربية",fr:"الفرنسية",de:"الألمانية",es:"الإسبانية",tr:"التركية",ja:"اليابانية",ko:"الكورية",zh:"الصينية",ru:"الروسية"})[localStorage.getItem("nf-ai-translate-lang")||"en"]||"الإنجليزية"} بشكل احترافي:\n\n${reply.text}` }], "أنت مترجم محترف. ترجم النص فقط بدون أي شرح. إذا النص بنفس لغة الهدف، ترجمه للعربية."); if (r?.trim()) setAiReplyResult(p => ({ ...p, [reply.id]: { label: "ترجمة", text: r.trim() } })); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiReplyLoading(null); }
                              }} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-medium transition-colors"><Globe size={11} /> ترجم</button>
                              <button onClick={async () => {
                                                                setAiReplyLoading(reply.id); setAiReplyResult(p => { const n = {...p}; delete n[reply.id]; return n; });
                                try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `صحح الأخطاء اللغوية والنحوية في هذا الرد:\n\n${reply.text}` }], "أنت مدقق لغوي. صحح الأخطاء فقط وأعد النص المصحح. بدون شرح."); if (r?.trim()) setAiReplyResult(p => ({ ...p, [reply.id]: { label: "تصحيح", text: r.trim() } })); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiReplyLoading(null); }
                              }} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-medium transition-colors"><Edit3 size={11} /> صحح</button>
                              <button onClick={async () => {
                                                                setAiReplyLoading(reply.id); setAiReplyResult(p => { const n = {...p}; delete n[reply.id]; return n; });
                                try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `استخرج أهم النقاط الرئيسية من هذا الرد كقائمة مختصرة:\n\n${reply.text}` }], "أنت مساعد بيستخرج النقاط الرئيسية. اكتب قائمة مختصرة بالعربية بدون إيموجي."); if (r?.trim()) setAiReplyResult(p => ({ ...p, [reply.id]: { label: "نقاط", text: r.trim() } })); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiReplyLoading(null); }
                              }} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-medium transition-colors"><FileText size={11} /> نقاط</button>
                              <button onClick={async () => {
                                                                setAiReplyLoading(reply.id); setAiReplyResult(p => { const n = {...p}; delete n[reply.id]; return n; });
                                try { const r = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `حسّن هذا الرد بأسلوب احترافي وجذاب مع الحفاظ على المعنى:\n\n${reply.text}` }], "أنت محرر محترف. حسّن النص بأسلوب احترافي. أجب بالنص المحسّن فقط بدون شرح."); if (r?.trim()) setAiReplyResult(p => ({ ...p, [reply.id]: { label: "تحسين", text: r.trim() } })); } catch (e: any) { showToast(`خطأ: ${(e?.message || "").slice(0, 60)}`); } finally { setAiReplyLoading(null); }
                              }} className="flex items-center gap-1.5 text-[12px] text-nf-dim hover:text-nf-accent font-medium transition-colors"><Sparkles size={11} /> حسّن</button>
                              <div className="relative ml-auto" ref={menuOpen === reply.id ? menuRef : undefined}>
                                <button onClick={() => setMenuOpen(menuOpen === reply.id ? null : reply.id)} className="text-nf-dim hover:text-nf-accent p-1 rounded hover:bg-nf-secondary/40"><MoreHorizontal size={14} /></button>
                                {menuOpen === reply.id && (
                                  <div className="absolute left-0 top-7 bg-nf-card rounded-lg py-1.5 z-20 min-w-[130px] shadow-lg border border-nf-border" ref={menuRef}>
                                    <button onClick={() => { copyText(reply.text); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-nf-dim hover:bg-nf-secondary/40 hover:text-nf-text font-medium"><Copy size={11} /> نسخ</button>
                                    <button onClick={() => { setReplyingTo(reply.id); setReplyText(`@${reply.authorName} `); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-nf-dim hover:bg-nf-secondary/40 hover:text-nf-text font-medium"><Reply size={11} /> رد</button>
                                    <button onClick={() => { setEditingReply(reply.id); setEditText(reply.text); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-nf-dim hover:bg-nf-secondary/40 hover:text-nf-text font-medium"><Edit3 size={11} /> تعديل</button>
                                    <button onClick={() => handleDeleteReply(activeThreadId!, reply.id)} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-red-400 hover:bg-red-400/10 font-medium"><Trash2 size={11} /> حذف</button>
                                    <button onClick={() => { setReportTarget("reply"); setReportTargetId(reply.id); setReportModalOpen(true); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-red-400 hover:bg-red-400/10 font-medium"><Flag size={11} /> أبلغ</button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Per-reply AI result - appears attached to the reply */}
                            <AnimatePresence>
                              {(aiReplyLoading === reply.id || aiReplyResult[reply.id]) && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                  <div className="mt-3 rounded-lg border border-nf-accent/8 bg-gradient-to-br from-nf-accent/3 via-nf-card to-nf-accent/2 p-3 relative">
                                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-nf-accent/10 to-transparent" />
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <Sparkles size={9} className="text-nf-accent/50" />
                                      <span className="text-[9px] font-bold text-nf-accent/60">{aiReplyResult[reply.id]?.label || "جارٍ التوليد..."}</span>
                                      {aiReplyResult[reply.id] && <button onClick={() => { navigator.clipboard.writeText(aiReplyResult[reply.id].text).catch(() => {}); showToast("تم النسخ"); }} className="mr-auto text-[8px] text-nf-dim/25 hover:text-nf-accent transition-colors"><Copy size={8} /></button>}
                                      {aiReplyResult[reply.id] && <button onClick={() => setAiReplyResult(p => { const n = {...p}; delete n[reply.id]; return n; })} className="text-[8px] text-nf-dim/25 hover:text-nf-text transition-colors"><X size={8} /></button>}
                                    </div>
                                    {aiReplyLoading === reply.id && !aiReplyResult[reply.id] ? (
                                      <div className="flex items-center gap-1 py-1">
                                        {[0,1,2,3].map(i => <motion.span key={i} animate={{ height: [3, 10, 3], opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }} className="w-[2px] rounded-full bg-nf-accent/30" />)}
                                        <span className="text-[9px] text-nf-accent/30 mr-1">يولّد...</span>
                                      </div>
                                    ) : (
                                      <div className="text-[12px] leading-[2] text-nf-text/70">{aiReplyResult[reply.id]?.text}</div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                      {/* Inline reply box for this specific reply */}
                      {replyingTo === reply.id && !activeThread.locked && (
                        <div className="bg-nf-card/80 rounded-xl p-4 mt-2 border border-nf-accent/20 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-1.5 text-[12px] text-nf-accent font-bold"><Reply size={12} /> رد على {reply.authorName}</span>
                            <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="text-nf-dim hover:text-nf-accent p-1 rounded hover:bg-nf-secondary/40"><X size={14} /></button>
                          </div>
                          <div className="flex items-center gap-2.5 mb-3">
                            {user?.photoURL ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-nf-muted flex items-center justify-center text-white text-[11px] font-bold">م</div>}
                            <span className="text-[12px] text-nf-text font-medium">{authorName}</span>
                          </div>
                          <textarea ref={replyTextareaRef} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="اكتب ردك..." className="w-full bg-nf-secondary rounded-lg px-3.5 py-2.5 text-[14px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent leading-[1.8] min-h-[80px]" autoFocus />
                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => wrapSelection(replyTextareaRef, "**", "**", setReplyText, replyText)} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors" title="عريض"><Bold size={12} /></button>
                              <button onClick={() => wrapSelection(replyTextareaRef, "*", "*", setReplyText, replyText)} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors" title="مائل"><Italic size={12} /></button>
                              <button onClick={() => wrapSelection(replyTextareaRef, "`", "`", setReplyText, replyText)} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors" title="كود"><Code size={12} /></button>
                              <button onClick={() => { setLinkInputOpen(linkInputOpen === "reply-link" ? null : "reply-link"); setLinkUrl(""); setLinkText(""); }} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors" title="رابط"><Link2 size={12} /></button>
                              <button onClick={() => { setLinkInputOpen(linkInputOpen === "reply-image" ? null : "reply-image"); setLinkUrl(""); }} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors" title="صورة"><Image size={12} /></button>
                              <button onClick={() => wrapSelection(replyTextareaRef, "- ", "", setReplyText, replyText)} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors" title="قائمة"><List size={12} /></button>
                              <button onClick={() => wrapSelection(replyTextareaRef, "1. ", "", setReplyText, replyText)} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors" title="قائمة مرقمة"><ListOrdered size={12} /></button>
                              <button onClick={() => setReplyText(p => `${p}\n> اقتباس\n`)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="اقتباس"><TextQuote size={13} /></button>
                              <button onClick={() => clearFormatting(replyTextareaRef, setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" title="مسح التنسيق"><RotateCcw size={13} /></button>
                              <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                              <button onClick={async () => {
                                if (!replyText.trim()) { return; }
                                const original = replyText;
                                setReplyText("⏳ يحسّن الذكاء الاصطناعي...");
                                try {
                                  const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `حسّن هذا النص للمنتدى مع الحفاظ على المعنى والأسلوب. أعد الصياغة فقط بدون شرح:\n\n${original}` }], "أنت محرر محترف. حسّن النص مع الحفاظ على المعنى. أجب بالنص المحسّن فقط بدون أي شرح أو مقدمات.");
                                  setReplyText(result || original);
                                } catch { setReplyText(original); showToast("فشل التحسين"); }
                              }} className="p-1 text-nf-accent/60 hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors flex items-center gap-0.5" title="حسّن بالذكاء الاصطناعي"><Sparkles size={12} /><span className="text-[8px] font-bold">AI</span></button>
                              <div className="relative" data-emoji-menu>
                                <button onMouseDown={e => { e.preventDefault(); saveSelection(replyTextareaRef, setReplyText, replyText); setEmojiMenuOpen(emojiMenuOpen === "reply" ? null : "reply"); }} className={cn("p-1.5 rounded transition-colors", emojiMenuOpen === "reply" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="رموز">😊</button>
                                {emojiMenuOpen === "reply" && (
                                  <div className="absolute top-full mt-1 right-0 bg-nf-card rounded-lg p-2 z-30 shadow-xl border border-nf-border/60 grid grid-cols-6 gap-1 min-w-[180px]">
                                    {["😀", "😂", "😍", "👍", "👎", "❤️", "🔥", "⭐", "✨", "💡", "🎉", "🚀", "💯", "👀", "🤔", "😢", "😡", "👋", "🙏", "👏"].map(emoji => (
                                      <button key={emoji} onClick={() => insertEmoji(replyTextareaRef, emoji, setReplyText, replyText)} className="p-1 hover:bg-nf-accent/10 rounded text-[18px] transition-colors">{emoji}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button onClick={() => handleReply(activeThreadId!)} disabled={!replyText.trim()} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-colors", replyText.trim() ? "bg-nf-accent hover:bg-nf-accent/80 text-white" : "bg-nf-secondary text-nf-dim cursor-not-allowed")}><Send size={12} /> نشر</button>
                          </div>
                        </div>
                      )}
                      </Fragment>
                    ))}
                    {activeReplies.length === 0 && !loading && (
                      <div className="text-center py-10">
                        <MessageCirclePlus size={32} className="mx-auto text-nf-border/50 mb-3" />
                        <p className="text-[14px] font-bold text-nf-dim mb-1">لا توجد ردود بعد</p>
                        <p className="text-[12px] text-nf-dim/70">كن أول من يرد على هذا الموضوع</p>
                        {!activeThread.locked && <button onClick={() => setReplyingTo(activeThread.id)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-nf-border hover:border-nf-accent hover:text-nf-accent text-nf-text text-[12px] font-bold transition-colors"><Reply size={14} /> اكتب رد</button>}
                      </div>
                    )}
                    <div ref={replyEndRef} />
                  </div>

                  {/* Reply box - show when not replying to a specific reply */}
                  {!activeThread.locked && !sortedReplies.some(r => r.id === replyingTo) && (
                    <div className="bg-nf-card rounded-xl p-5 shadow-sm border border-nf-border/20"
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={e => { e.preventDefault(); e.stopPropagation(); const text = e.dataTransfer.getData('text/plain'); if (text) setReplyText(prev => prev + text); const files = e.dataTransfer.files; if (files.length > 0) { Array.from(files).forEach(f => { if (f.type.startsWith('image/')) { setReplyText(prev => `${prev}\n![${f.name}](اسحب الصورة هنا)\n`); showToast(`تم إضافة ${f.name} — ارفع الصورة أولاً ثم ضع الرابط`); } }); } }}>
                      {/* Reply-to indicator */}
                      {replyingTo && !quotedThreadId && (
                        <div className="flex items-center justify-between px-4 py-2 mb-4 bg-nf-accent/5 rounded-lg">
                          <span className="flex items-center gap-1.5 text-[12px] text-nf-accent font-bold"><Reply size={12} /> رد على {activeReplies.find(r => r.id === replyingTo)?.authorName || "الموضوع"}</span>
                          <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="text-nf-dim hover:text-nf-accent p-1 rounded hover:bg-nf-secondary/40"><X size={14} /></button>
                        </div>
                      )}
                      {/* Quote preview */}
                      {quotedThreadId && (() => {
                        const qt = threads.find(t => t.id === quotedThreadId) || allThreads.find(t => t.id === quotedThreadId);
                        if (!qt) return null;
                        return (
                          <div className="mb-4 rounded-lg border border-nf-border-2/40 bg-[#16161a] overflow-hidden">
                            <div className="px-3 pt-2.5 pb-2">
                              <div className="flex items-center gap-1.5 text-[11px] mb-1">
                                <Quote size={10} className="text-nf-accent" />
                                <span className="font-semibold text-nf-accent">{qt.community}</span>
                                <span className="text-nf-dim">·</span>
                                <span className="text-nf-muted">u/{qt.authorName}</span>
                              </div>
                              {qt.title && <h4 className="text-[13px] font-bold text-white/80 leading-snug mb-0.5">{qt.title}</h4>}
                              {qt.body && <p className="text-[11px] text-nf-text-2/80 leading-relaxed line-clamp-2">{qt.body.replace(/[#*_`\[\]\(\)]/g, "").slice(0, 100)}</p>}
                            </div>
                            <div className="flex items-center justify-between px-3 py-1 border-t border-nf-border-2/30">
                              <span className="text-[9px] text-nf-dim">سيتم اقتباس هذا الموضوع</span>
                              <button onClick={() => setQuotedThreadId(null)} className="text-[9px] text-nf-dim hover:text-red-400 flex items-center gap-1 transition-colors"><X size={9} />إزالة</button>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-3 mb-4">
                        {user?.photoURL ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-nf-muted flex items-center justify-center text-white text-[13px] font-bold">م</div>}
                        <div>
                          <span className="text-[13px] text-nf-text font-medium">{authorName}</span>
                          <span className="text-[11px] text-nf-dim font-medium mr-2"> · رد في <span className="text-nf-accent font-medium">{activeThread.community}</span></span>
                        </div>
                      </div>
                      {/* Edit/Preview toggle */}
                      <div className="flex items-center gap-1 mb-2">
                        <button onClick={() => setReplyPreview(false)} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors", !replyPreview ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-nf-text")}>تحرير</button>
                        <button onClick={() => setReplyPreview(true)} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors", replyPreview ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-nf-text")}>معاينة</button>
                      </div>
                      {/* Markdown toolbar */}
                      {!replyPreview && (
                        <>
                        <div className="flex items-center gap-0.5 mb-2 bg-nf-secondary rounded-lg px-2 py-1.5 flex-wrap">
                          <button onClick={() => wrapSelection(replyTextareaRef, "**", "**", setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="عريض"><Bold size={13} /></button>
                          <button onClick={() => wrapSelection(replyTextareaRef, "*", "*", setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="مائل"><Italic size={13} /></button>
                          <button onClick={() => wrapSelection(replyTextareaRef, "~~", "~~", setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="مشطوب"><Strikethrough size={13} /></button>
                          <button onClick={() => wrapSelection(replyTextareaRef, "`", "`", setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="كود سطري"><Code size={13} /></button>
                          <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                          <button onClick={() => wrapSelection(replyTextareaRef, "```\n", "\n```", setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="بلوك كود"><FileCode size={13} /></button>
                          <button onClick={() => wrapSelection(replyTextareaRef, "> ", "", setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="اقتباس"><TextQuote size={13} /></button>
                          <button onClick={openTableModal} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="جدول"><BarChart3 size={13} /></button>
                          <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                          <button onClick={() => { setLinkInputOpen(linkInputOpen === "reply-link" ? null : "reply-link"); setLinkUrl(""); setLinkText(""); }} className={cn("p-1.5 rounded transition-colors", linkInputOpen === "reply-link" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="رابط"><Link2 size={13} /></button>
                          <button onClick={() => { setLinkInputOpen(linkInputOpen === "reply-image" ? null : "reply-image"); setLinkUrl(""); setLinkText(""); }} className={cn("p-1.5 rounded transition-colors", linkInputOpen === "reply-image" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="صورة"><Image size={13} /></button>
                          <button onClick={() => { setLinkInputOpen(linkInputOpen === "reply-video" ? null : "reply-video"); setLinkUrl(""); setLinkText(""); }} className={cn("p-1.5 rounded transition-colors", linkInputOpen === "reply-video" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="فيديو"><Video size={13} /></button>
                          <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                          <button onClick={() => setReplyText(p => `${p}\n\n---\n\n`)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="خط فاصل"><Minus size={13} /></button>
                          <button onClick={() => wrapSelection(replyTextareaRef, "# ", "", setReplyText, replyText)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="عنوان"><Heading2 size={13} /></button>
                          <button onClick={() => setReplyText(p => `${p}\n- عنصر قائمة\n`)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="قائمة"><List size={13} /></button>
                          <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                          <div className="relative" data-size-menu>
                            <button onMouseDown={e => { e.preventDefault(); saveSelection(replyTextareaRef, setReplyText, replyText); setSizeMenuOpen(sizeMenuOpen === "reply" ? null : "reply"); }} className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-0.5", sizeMenuOpen === "reply" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="حجم الخط">{fontSize} <ChevronDown size={8} /></button>
                            {sizeMenuOpen === "reply" && (
                              <div className="absolute top-full mt-1 right-0 bg-nf-card rounded-lg py-1 z-30 min-w-[56px] shadow-xl border border-nf-border/60">
                                {[12,14,16,18,20,22,24,26,28].map(s => (
                                  <button key={s} onMouseDown={e => { e.preventDefault(); applyFontSize(s); }} className={cn("w-full px-3 py-1 text-right hover:bg-nf-accent/10 transition-colors", s === fontSize ? "text-nf-accent font-bold" : "text-nf-dim")} style={{ fontSize: `${Math.min(s, 18)}px` }}>{s}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={resetFontSize} className="p-1 text-nf-muted hover:text-nf-accent rounded transition-colors text-[9px]" title="حجم عادي">Aa</button>
                          <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                          <button onClick={() => aiImprove(replyText, setReplyText)} disabled={aiLoading} className={cn("p-1.5 rounded transition-colors flex items-center gap-1", aiLoading ? "text-nf-dim cursor-wait" : "text-nf-accent/60 hover:text-nf-accent hover:bg-nf-accent/10")} title="تحسين بالذكاء الاصطناعي">{aiLoading ? <div className="w-3 h-3 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" /> : <Sparkles size={13} />}</button>
                          <button onClick={() => setAiSettingsOpen(true)} className="p-1.5 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="إعدادات الذكاء الاصطناعي"><Settings size={13} /></button>
                        </div>
                        {/* Inline link/image/video input */}
                        {linkInputOpen && linkInputOpen.startsWith("reply-") && (
                          <div className="flex items-center gap-2 bg-nf-secondary/70 px-3 py-2 mb-2 rounded-lg animate-[slideDown_0.15s_ease-out]">
                            {linkInputOpen === "reply-link" && <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="نص الرابط" className="w-[120px] bg-nf-card rounded px-2.5 py-1.5 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent" />}
                            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && linkUrl.trim()) { e.preventDefault(); if (linkInputOpen === "reply-link") setReplyText(p => `${p}${linkText.trim() ? `[${linkText}](${linkUrl})` : linkUrl}`); else if (linkInputOpen === "reply-image") setReplyText(p => `${p}![](${linkUrl})`); else if (linkInputOpen === "reply-video") setReplyText(p => `${p}[▶ فيديو](${linkUrl})`); setLinkInputOpen(null); } }} placeholder={linkInputOpen === "reply-link" ? "https://..." : linkInputOpen === "reply-image" ? "رابط الصورة..." : "رابط اليوتيوب..."} className="flex-1 bg-nf-card rounded px-2.5 py-1.5 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent" dir="ltr" autoFocus />
                            <button onClick={() => {
                              if (!linkUrl.trim()) return;
                              if (linkInputOpen === "reply-link") setReplyText(p => `${p}${linkText.trim() ? `[${linkText}](${linkUrl})` : linkUrl}`);
                              else if (linkInputOpen === "reply-image") setReplyText(p => `${p}![](${linkUrl})`);
                              else if (linkInputOpen === "reply-video") setReplyText(p => `${p}[▶ فيديو](${linkUrl})`);
                              setLinkInputOpen(null);
                            }} className="px-3 py-1.5 rounded-lg bg-nf-accent hover:bg-nf-accent/80 text-white text-[10px] font-bold transition-colors">إضافة</button>
                            <button onClick={() => setLinkInputOpen(null)} className="p-1 text-nf-dim hover:text-nf-accent"><X size={12} /></button>
                          </div>
                        )}
                        </>
                      )}
                      {replyPreview ? (
                        <div className="w-full min-h-[120px] bg-nf-secondary rounded-lg px-4 py-3 text-[15px] text-nf-text leading-[1.8]">
                          {replyText.trim() ? renderBody(replyText, (name) => { const t = threads.find(t => t.authorName === name); if (t) openProfile(t.authorUid, name, t.authorPhoto); }) : <span className="text-nf-dim">لا يوجد محتوى للمعاينة</span>}
                        </div>
                      ) : (
                        <textarea ref={replyTextareaRef} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={replyingTo ? `اكتب ردك...` : "شارك في النقاش..."} className="w-full bg-nf-secondary rounded-lg px-4 py-3 text-[15px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent leading-[1.8] min-h-[120px]" />
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-nf-dim font-medium">{replyText.length > 0 ? `${replyText.length} حرف` : ""}</span>
                          {replyText.trim() && aiApiKey && (
                            <button onClick={async () => {
                              const original = replyText;
                              setReplyText("⏳ يحسّن الذكاء الاصطناعي...");
                              try {
                                const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `حسّن هذا الرد للمنتدى مع الحفاظ على المعنى. أعد الصياغة فقط بدون شرح:\n\n${original}` }], "أنت محرر محترف. حسّن النص مع الحفاظ على المعنى. أجب بالنص المحسّن فقط.");
                                setReplyText(result || original);
                              } catch { setReplyText(original); showToast("فشل التحسين"); }
                            }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-nf-accent/60 hover:text-nf-accent hover:bg-nf-accent/10 transition-colors"><Sparkles size={10} /> حسّن</button>
                          )}
                        </div>
                        <button onClick={() => handleReply(activeThreadId!)} disabled={!replyText.trim()} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors", replyText.trim() ? "bg-nf-accent hover:bg-nf-accent/80 text-white" : "bg-nf-secondary text-nf-dim cursor-not-allowed")}><Send size={14} /> نشر الرد</button>
                      </div>
                    </div>
                  )}
                  {activeThread.locked && <div className="bg-nf-card rounded-lg p-5 text-center"><span className="text-[13px] text-nf-dim flex items-center justify-center gap-2 font-bold"><Lock size={14} /> هذا الموضوع مقفل ولا يمكن الرد عليه</span></div>}
                </motion.div>
              )}

              {/* NEW THREAD */}
              {viewMode === "new" && (
                <motion.div key="new" initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: createBlur ? "blur(10px) brightness(1.5)" : "blur(0px)" }} exit={{ opacity: 0, filter: "blur(10px)" }} transition={{ duration: 0.5, ease: "easeOut" }} style={createBlur ? { pointerEvents: "none" } : {}}>
                  <button onClick={backToList} className="flex items-center gap-1.5 text-[13px] text-nf-accent hover:underline mb-4 font-bold"><ArrowLeft size={14} /> العودة</button>
                  <div className="bg-nf-card rounded-lg p-6">
                    <h2 className="text-[18px] font-bold text-nf-text mb-5">إنشاء موضوع جديد</h2>
                    <div className="space-y-5">
                      <div><label className="text-[12px] font-bold text-nf-dim mb-2 block">نوع الموضوع</label><div className="flex items-center gap-2 flex-wrap">{threadTypes.map(tt => { const TI = tt.icon; return <button key={tt.id} onClick={() => setNewType(tt.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-bold transition-colors", newType === tt.id ? cn(tt.bg, tt.color) : "bg-nf-secondary text-nf-dim hover:bg-nf-secondary/40 hover:text-nf-text")}><TI size={13} />{tt.label}</button>; })}</div></div>
                      <div><label className="text-[12px] font-bold text-nf-dim mb-2 block">التصنيف</label><div className="flex items-center gap-2 flex-wrap">{allCommunities.map(c => <button key={c.name} onClick={() => setNewCommunity(c.name)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-bold transition-colors", newCommunity === c.name ? "bg-nf-accent/10 text-nf-accent" : "bg-nf-secondary text-nf-dim hover:bg-nf-secondary/40 hover:text-nf-text")}>{c.img && <img src={c.img} alt="" className="w-4 h-4 rounded object-cover" />}{c.name}</button>)}</div></div>
                      <div className="relative">
                        <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="عنوان الموضوع" className="w-full bg-nf-secondary rounded-lg px-4 py-3 text-[17px] font-bold text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent pr-12" />
                        <button onClick={async () => {
                          if (!newBody.trim()) { showToast("اكتب المحتوى أولاً"); return; }
                          try {
                            const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `اقترح عنوان جذاب ومختصر (6 كلمات أو أقل) لموضوع بالعربية عن:\n\n${newBody.slice(0, 300)}` }], "اقترح عنوان واحد فقط. بدون إيموجي. بدون علامات تنصيص. أجب بالعنوان فقط.");
                            if (result && result.trim()) setNewTitle(result.trim().replace(/^["'«»]/, "").replace(/["'«»]$/, ""));
                          } catch (err: any) { showToast(`خطأ: ${(err?.message || "").slice(0, 60)}`); }
                        }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-nf-dim/40 hover:text-nf-accent hover:bg-nf-accent/10 transition-colors" title="اقتراح عنوان بالذكاء الاصطناعي"><Sparkles size={16} /></button>
                      </div>
                      {/* Preview toggle */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => setNewPreview(false)} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors", !newPreview ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-nf-text")}>تحرير</button>
                        <button onClick={() => setNewPreview(true)} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors", newPreview ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-nf-text")}>معاينة</button>
                      </div>
                      {newPreview ? (
                        <div className="bg-nf-card rounded-xl border border-nf-border/8 overflow-hidden">
                          {/* Preview header — like a real thread */}
                          <div className="px-5 py-4 border-b border-nf-border/6">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {(() => { const tt = threadTypes.find(t => t.id === newType); if (!tt) return null; const TI = tt.icon; return <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold", tt.bg, tt.color)}><TI size={10} />{tt.label}</span>; })()}
                              <span className="bg-nf-accent/10 text-nf-accent px-2.5 py-1 rounded-lg text-[10px] font-bold">{newCommunity}</span>
                            </div>
                            {newTitle.trim() ? <h1 className="text-[20px] font-bold text-nf-text leading-snug">{newTitle}</h1> : <span className="text-nf-dim/30 text-[16px]">بدون عنوان</span>}
                            <div className="flex items-center gap-3 mt-2.5">
                              <span className="text-[10px] text-nf-dim/40">بواسطة {authorName}</span>
                              <span className="text-[10px] text-nf-dim/30">الآن</span>
                            </div>
                          </div>
                          {/* Preview body */}
                          <div className="px-5 py-4">
                            {newBody.trim() ? <div className="text-[15px] text-nf-text leading-[2.2]">{renderBody(newBody)}</div> : <span className="text-nf-dim/30">لا يوجد محتوى</span>}
                          </div>
                          {/* Preview tags */}
                          {newTags.trim() && (
                            <div className="px-5 py-3 border-t border-nf-border/6 flex items-center gap-1.5 flex-wrap">
                              {newTags.split(",").map((t, i) => t.trim() && <span key={i} className="bg-nf-accent/10 text-nf-accent px-2.5 py-0.5 rounded text-[10px] font-bold">#{t.trim()}</span>)}
                            </div>
                          )}
                          {/* Preview actions — fake */}
                          <div className="px-5 py-2.5 border-t border-nf-border/6 flex items-center gap-3">
                            <span className="text-[11px] text-nf-dim/30 flex items-center gap-1"><ThumbsUp size={12} /> 0</span>
                            <span className="text-[11px] text-nf-dim/30 flex items-center gap-1"><MessageCircle size={12} /> 0 ردود</span>
                            <span className="text-[11px] text-nf-dim/30 flex items-center gap-1"><Eye size={12} /> 0 مشاهدة</span>
                          </div>
                        </div>
                      ) : (
                      <>
                      {/* Formatting toolbar - enhanced */}
                      <div className="flex items-center gap-0.5 bg-nf-secondary/50 rounded-t-lg px-2 py-1.5 flex-wrap">
                        <button onClick={() => wrapSelection(newBodyRef, "**", "**", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="عريض"><Bold size={14} /></button>
                        <button onClick={() => wrapSelection(newBodyRef, "*", "*", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="مائل"><Italic size={14} /></button>
                        <button onClick={() => wrapSelection(newBodyRef, "~~", "~~", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="يتوسطه خط"><Strikethrough size={14} /></button>
                        <button onClick={() => wrapSelection(newBodyRef, "`", "`", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="كود"><Code size={14} /></button>
                        <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                        <button onClick={() => wrapSelection(newBodyRef, "```\n", "\n```", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="بلوك كود"><FileCode size={14} /></button>
                        <button onClick={() => wrapSelection(newBodyRef, "> ", "", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="اقتباس"><TextQuote size={14} /></button>
                        <button onClick={openTableModal} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="جدول"><BarChart3 size={14} /></button>
                        <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                        <button onClick={() => { setLinkInputOpen(linkInputOpen === "new-link" ? null : "new-link"); setLinkUrl(""); setLinkText(""); }} className={cn("p-2 rounded transition-colors", linkInputOpen === "new-link" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="رابط"><Link2 size={14} /></button>
                        <button onClick={() => { setLinkInputOpen(linkInputOpen === "new-image" ? null : "new-image"); setLinkUrl(""); setLinkText(""); }} className={cn("p-2 rounded transition-colors", linkInputOpen === "new-image" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="صورة"><Image size={14} /></button>
                        <button onClick={() => { setLinkInputOpen(linkInputOpen === "new-video" ? null : "new-video"); setLinkUrl(""); setLinkText(""); }} className={cn("p-2 rounded transition-colors", linkInputOpen === "new-video" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="فيديو"><Video size={14} /></button>
                        <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                        <button onClick={() => { const ta = newBodyRef.current; if (ta) { const pos = ta.selectionStart; const before = newBody.substring(0, pos); const after = newBody.substring(pos); const nl = before.endsWith('\n') ? '' : '\n'; setNewBody(before + nl + '\n---\n' + after); setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = pos + nl.length + 4; }, 0); } else { setNewBody(p => `${p}\n\n---\n\n`); } }} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="خط فاصل"><Minus size={14} /></button>
                        <button onClick={() => wrapSelection(newBodyRef, "# ", "", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="عنوان"><Heading2 size={14} /></button>
                        <button onClick={() => wrapSelection(newBodyRef, "- ", "", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="قائمة"><List size={14} /></button>
                        <button onClick={() => wrapSelection(newBodyRef, "1. ", "", setNewBody, newBody)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="قائمة مرقمة"><ListOrdered size={14} /></button>
                        <button onClick={() => clearFormatting(newBodyRef, setNewBody, newBody)} className="p-2 text-nf-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" title="مسح التنسيق"><RotateCcw size={14} /></button>
                        <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                        <button onClick={async () => {
                          if (!newBody.trim()) { showToast("اكتب المحتوى أولاً"); return; }
                          showToast("جارٍ التحسين...");
                          try {
                            const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `حسّن هذا النص وجعله احترافياً ومناسباً لمنتدى. حافظ على المعنى لكن اجعله أفضل أسلوباً وتنسيقاً:\n\n${newBody}` }], "أنت محرر محترف. حسّن النص فقط وأعده محسناً. بدون شرح. بدون إيموجي. أجب بالنص المحسّن فقط.");
                            if (result && result.trim()) { setNewBody(result.trim()); showToast("تم التحسين ✓"); }
                          } catch (err: any) { showToast(`خطأ: ${(err?.message || "").slice(0, 60)}`); }
                        }} className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded transition-colors flex items-center gap-1" title="تحسين بالذكاء الاصطناعي"><Sparkles size={14} /></button>
                        <div className="relative" data-emoji-menu>
                          <button onMouseDown={e => { e.preventDefault(); saveSelection(newBodyRef, setNewBody, newBody); setEmojiMenuOpen(emojiMenuOpen === "new" ? null : "new"); }} className={cn("p-2 rounded transition-colors", emojiMenuOpen === "new" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="رموز">😊</button>
                          {emojiMenuOpen === "new" && (
                            <div className="absolute top-full mt-1 right-0 bg-nf-card rounded-lg p-2 z-30 shadow-xl border border-nf-border/60 grid grid-cols-6 gap-1 min-w-[180px]">
                              {["😀", "😂", "😍", "👍", "👎", "❤️", "🔥", "⭐", "✨", "💡", "🎉", "🚀", "💯", "👀", "🤔", "😢", "😡", "👋", "🙏", "👏"].map(emoji => (
                                <button key={emoji} onClick={() => insertEmoji(newBodyRef, emoji, setNewBody, newBody)} className="p-1 hover:bg-nf-accent/10 rounded text-[18px] transition-colors">{emoji}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                        <div className="relative" data-size-menu>
                          <button onMouseDown={e => { e.preventDefault(); saveSelection(newBodyRef, setNewBody, newBody); setSizeMenuOpen(sizeMenuOpen === "new" ? null : "new"); }} className={cn("px-2 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-0.5", sizeMenuOpen === "new" ? "text-nf-accent bg-nf-accent/10" : "text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10")} title="حجم الخط">{fontSize} <ChevronDown size={9} /></button>
                          {sizeMenuOpen === "new" && (
                            <div className="absolute top-full mt-1 right-0 bg-nf-card rounded-lg py-1 z-30 min-w-[60px] shadow-xl border border-nf-border/60">
                              {[12,14,16,18,20,22,24,26,28].map(s => (
                                <button key={s} onMouseDown={e => { e.preventDefault(); applyFontSize(s); }} className={cn("w-full px-3 py-1.5 text-right hover:bg-nf-accent/10 transition-colors", s === fontSize ? "text-nf-accent font-bold" : "text-nf-dim")} style={{ fontSize: `${Math.min(s, 18)}px` }}>{s}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={resetFontSize} className="p-1.5 text-nf-muted hover:text-nf-accent rounded transition-colors text-[10px]" title="حجم عادي">Aa</button>
                        <div className="h-4 w-px bg-nf-border/50 mx-0.5" />
                        <button onClick={() => aiImprove(newBody, setNewBody)} disabled={aiLoading} className={cn("p-2 rounded transition-colors flex items-center gap-1", aiLoading ? "text-nf-dim cursor-wait" : "text-nf-accent/60 hover:text-nf-accent hover:bg-nf-accent/10")} title="تحسين بالذكاء الاصطناعي">{aiLoading ? <div className="w-3.5 h-3.5 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" /> : <Sparkles size={14} />}</button>
                        <button onClick={() => setAiSettingsOpen(true)} className="p-2 text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 rounded transition-colors" title="إعدادات الذكاء الاصطناعي"><Settings size={14} /></button>
                      </div>
                      {/* Inline link/image/video input */}
                      {linkInputOpen && linkInputOpen.startsWith("new-") && (
                        <div className="flex items-center gap-2 bg-nf-secondary/70 px-3 py-2 border-b border-nf-border/30 animate-[slideDown_0.15s_ease-out]">
                          {linkInputOpen === "new-link" && <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="نص الرابط" className="w-[120px] bg-nf-card rounded px-2.5 py-1.5 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent" />}
                          <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && linkUrl.trim()) { e.preventDefault(); if (linkInputOpen === "new-link") setNewBody(p => `${p}${linkText.trim() ? `[${linkText}](${linkUrl})` : linkUrl}`); else if (linkInputOpen === "new-image") setNewBody(p => `${p}![](${linkUrl})`); else if (linkInputOpen === "new-video") setNewBody(p => `${p}[▶ فيديو](${linkUrl})`); setLinkInputOpen(null); } }} placeholder={linkInputOpen === "new-link" ? "https://..." : linkInputOpen === "new-image" ? "رابط الصورة..." : "رابط اليوتيوب..."} className="flex-1 bg-nf-card rounded px-2.5 py-1.5 text-[11px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent" dir="ltr" autoFocus />
                          <button onClick={() => {
                            if (!linkUrl.trim()) return;
                            if (linkInputOpen === "new-link") setNewBody(p => `${p}${linkText.trim() ? `[${linkText}](${linkUrl})` : linkUrl}`);
                            else if (linkInputOpen === "new-image") setNewBody(p => `${p}![](${linkUrl})`);
                            else if (linkInputOpen === "new-video") setNewBody(p => `${p}[▶ فيديو](${linkUrl})`);
                            setLinkInputOpen(null);
                          }} className="px-3 py-1.5 rounded-lg bg-nf-accent hover:bg-nf-accent/80 text-white text-[10px] font-bold transition-colors">إضافة</button>
                          <button onClick={() => setLinkInputOpen(null)} className="p-1 text-nf-dim hover:text-nf-accent"><X size={12} /></button>
                        </div>
                      )}
                      <div className="relative">
                        <div className="absolute inset-0 pointer-events-none overflow-hidden bg-nf-secondary border-t-0 rounded-b-lg px-4 py-3 text-[14px] leading-[1.8] min-h-[200px] whitespace-pre-wrap break-words" aria-hidden="true">
                          {newBody.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                            /^https?:\/\//.test(part) ? <span key={i} className="text-nf-accent underline">{part}</span> : <span key={i} className="text-transparent">{part}</span>
                          )}
                        </div>
                        <textarea ref={newBodyRef} value={newBody} onChange={e => setNewBody(e.target.value)} placeholder={"اكتب محتوى الموضوع...\n\nحدد نص ثم اضغط أزرار التنسيق\nروابط وصور تظهر تلقائياً"} className="relative w-full bg-transparent border-t-0 rounded-b-lg px-4 py-3 text-[14px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent leading-[1.8] min-h-[200px] caret-white" />
                      </div>
                      {/* Tags + options row */}
                      <div className="flex items-center gap-2">
                        <input type="text" value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="وسوم: مساعدة, توتوريال (افصل بفاصلة)" className="flex-1 bg-nf-secondary rounded-lg px-4 py-2.5 text-[13px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent font-medium" />
                        {newBody.trim() && aiApiKey && (
                          <button onClick={async () => {
                            try {
                              const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: `اقترح 3-5 وسوم (كلمات مفتاحية) منفصلة بفاصلة لهذا الموضوع. أجب بالوسوم فقط بدون شرح:\n\n${newBody.slice(0, 300)}` }], "اقترح وسوم فقط. بدون شرح. بدون إيموجي. أجب بالوسوم مفصولة بفاصلة.");
                              if (result && result.trim()) setNewTags(result.trim());
                            } catch (err: any) { showToast(`خطأ: ${(err?.message || "").slice(0, 60)}`); }
                          }} className="flex items-center gap-1 px-2.5 py-2.5 rounded-lg text-[9px] font-bold text-nf-accent/60 hover:text-nf-accent hover:bg-nf-accent/10 transition-colors bg-nf-secondary border border-nf-border/4" title="اقتراح وسوم بالذكاء الاصطناعي"><Sparkles size={10} /> وسوم</button>
                        )}
                      </div>
                      </>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-nf-dim">{newBody.length} حرف</span>
                        <button onClick={handleCreateThread} disabled={!newTitle.trim() || creating} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors", newTitle.trim() ? "bg-nf-accent hover:bg-nf-accent/80 text-white" : "bg-nf-secondary text-nf-dim cursor-not-allowed")}>{creating ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />} نشر</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {viewMode === "ai" && (
                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col h-[calc(100vh-80px)] relative">
                  <AnimatePresence>
                    {selectionRect && selectedText && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-[9999] flex items-center gap-1 bg-nf-card border border-nf-border/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-xl px-2 py-1.5 pointer-events-none"
                        style={{ top: selectionRect.top - 50, left: selectionRect.left + selectionRect.width / 2, transform: "translateX(-50%)" }}
                      >
                        <button onMouseDown={(e) => { e.preventDefault(); aiChatSend(`اشرح لي هذا النص بالتفصيل:\n\n"${selectedText}"`); setSelectionRect(null); }} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-nf-accent/10 hover:text-nf-accent text-nf-text rounded-lg text-[11px] font-bold transition-all whitespace-nowrap pointer-events-auto">
                          <Sparkles size={11} /> اشرح
                        </button>
                        <button onMouseDown={(e) => { e.preventDefault(); setAiReplyContext(selectedText); document.querySelector<HTMLInputElement>(".ai-chat-input")?.focus(); setSelectionRect(null); }} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-400/10 hover:text-blue-400 text-nf-text rounded-lg text-[11px] font-bold transition-all whitespace-nowrap pointer-events-auto">
                          <MessageCirclePlus size={11} /> تعقيب
                        </button>
                        <button onMouseDown={(e) => { e.preventDefault(); aiChatSend(`قم بترجمة هذا النص إلى الإنجليزية (أو العربية إذا كان بالإنجليزية):\n\n"${selectedText}"`); setSelectionRect(null); }} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-green-400/10 hover:text-green-400 text-nf-text rounded-lg text-[11px] font-bold transition-all whitespace-nowrap pointer-events-auto">
                          <Globe size={11} /> ترجمة
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Minimal top bar */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-nf-border/4">
                    <button onClick={backToList} className="p-1.5 rounded-lg text-nf-dim/50 hover:text-nf-text hover:bg-nf-secondary/40 transition-colors"><ArrowLeft size={16} /></button>
                    <div className="flex items-center gap-2">
                      {aiMessages.length > 0 && <span className="text-[8px] text-nf-dim/25 tabular-nums">{aiMessages.filter(m => m.role === "user").length} رسالة</span>}
                      <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded-full border", aiMode === "pro" ? "bg-nf-accent/8 text-nf-accent border-nf-accent/15" : aiMode === "creative" ? "bg-purple-400/8 text-purple-400 border-purple-400/15" : aiMode === "casual" ? "bg-green-400/8 text-green-400 border-green-400/15" : "bg-blue-400/8 text-blue-400 border-blue-400/15")}>
                        {aiMode === "pro" ? "احترافي" : aiMode === "creative" ? "إبداعي" : aiMode === "casual" ? "عفوي" : "مبرمج"}
                      </span>
                      <button onClick={() => { if (confirm("هل تريد مسح المحادثة بالكامل؟")) setAiMessages([]); }} className="p-1 rounded-lg text-nf-dim/25 hover:text-red-400 hover:bg-red-400/8 transition-all" title="مسح"><Trash2 size={12} /></button>
                    </div>
                  </div>

                  {/* AI Generation Progress Bar */}
                  {aiGenerating && (
                    <div className="h-[2px] bg-nf-border/4 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-nf-accent/0 via-nf-accent/80 to-nf-accent/0 animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: "40%", animation: "shimmer 2s ease-in-out infinite" }} />
                    </div>
                  )}

                  {/* Messages area — centered like ChatGPT */}
                  <div ref={aiChatScrollRef} onScroll={() => { const el = aiChatScrollRef.current; if (el) setAiShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200); }} className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
                    <div className="max-w-[780px] mx-auto px-6 h-full">
                    {aiMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-5 px-2">
                        {/* Hero — clean and minimal */}
                        <div className="flex flex-col items-center gap-3 relative">
                          <div className="absolute w-[140px] h-[140px] bg-nf-accent/8 blur-[80px] rounded-full pointer-events-none" />
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
                            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 via-nf-accent/15 to-nf-accent/5 flex items-center justify-center border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_40px_rgba(var(--nf-accent-rgb),0.06)]"
                          >
                            <Sparkles size={24} className="text-nf-accent relative z-10" style={{ filter: "drop-shadow(0 0 8px rgba(160,160,160,0.3))" }} />
                          </motion.div>
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }} className="text-center relative z-10">
                            <h2 className="text-[24px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-nf-dim/50 mb-1 tracking-tight leading-tight">NorthFall AI</h2>
                            <p className="text-[12px] text-nf-dim/40 leading-relaxed max-w-[340px]">{aiConnected === "ok" ? "مساعدك الذكي — جاهز لمساعدتك" : aiApiKey ? "اختبر الاتصال من الإعدادات أولاً" : "أضف مفتاح API من الإعدادات لبدء المحادثة"}</p>
                          </motion.div>
                        </div>
                        {/* Quick suggestion cards */}
                        {aiConnected === "ok" && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="grid grid-cols-2 gap-2 max-w-[400px] w-full">
                            {[
                              { icon: Code, label: "اكتب كود", desc: "C#, GDScript, JS", color: "blue" },
                              { icon: BarChart3, label: "قارن محركات", desc: "Unity vs Unreal vs Godot", color: "green" },
                              { icon: Bug, label: "حل مشكلة", desc: "أخبرني بالخطأ", color: "red" },
                              { icon: Lightbulb, label: "أفكار لعبة", desc: "اقتراحات إبداعية", color: "yellow" },
                            ].map((card, i) => {
                              const CI = card.icon;
                              const colors: Record<string, string> = {
                                blue: "hover:border-blue-400/20 hover:bg-blue-400/5",
                                green: "hover:border-green-400/20 hover:bg-green-400/5",
                                red: "hover:border-red-400/20 hover:bg-red-400/5",
                                yellow: "hover:border-yellow-400/20 hover:bg-yellow-400/5",
                              };
                              const iconColors: Record<string, string> = {
                                blue: "text-blue-400/50",
                                green: "text-green-400/50",
                                red: "text-red-400/50",
                                yellow: "text-yellow-400/50",
                              };
                              return (
                                <button key={i} onClick={() => aiChatSend(card.label + " " + card.desc)} className={cn("flex flex-col items-start gap-1 p-3 rounded-xl border border-nf-border/8 bg-nf-card/50 transition-all text-right", colors[card.color])}>
                                  <CI size={14} className={iconColors[card.color]} />
                                  <span className="text-[11px] font-bold text-nf-text">{card.label}</span>
                                  <span className="text-[9px] text-nf-dim/40">{card.desc}</span>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 pb-6 py-4">
                        {aiMessages.map((msg, msgIdx) => (
                          <div key={msg.id} className="group/msg">
                            {msg.role === "user" && (
                              <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex justify-end mt-5 mb-1 px-1">
                                <div className="flex flex-col items-end gap-1 max-w-[75%]">
                                  <div className="bg-gradient-to-br from-nf-accent/15 via-nf-accent/10 to-nf-accent/5 border border-nf-accent/15 rounded-2xl rounded-tl-sm px-4 py-3 text-nf-text shadow-[0_2px_12px_rgba(var(--nf-accent-rgb),0.06)]">
                                    <p className="text-[14px] leading-[1.9] whitespace-pre-wrap font-medium">{msg.content}</p>
                                  </div>
                                  <div className="flex items-center gap-2 px-1">
                                    <span className="text-[8px] text-nf-dim/25">{msg.ts ? new Date(msg.ts).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(msg.content).catch(() => {}); showToast("تم نسخ الرسالة"); }} className="text-[8px] text-nf-dim/20 hover:text-nf-accent/60 transition-colors"><Copy size={8} /></button>
                                    <button onClick={() => { setAiInput(msg.content); setAiMessages(p => p.filter(m => m.id !== msg.id)); aiTextareaRef.current?.focus(); }} className="text-[8px] text-nf-dim/20 hover:text-nf-accent/60 transition-colors"><Edit3 size={9} /></button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                            {msg.role === "assistant" && (
                              <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }} className="mt-5 mb-1">
                                <div className="flex gap-2.5">
                                <div className={cn("flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-nf-accent/15 to-nf-accent/5 border border-nf-accent/10 flex items-center justify-center mt-1 transition-all", msg.isTyping && "animate-pulse border-nf-accent/30 shadow-[0_0_12px_rgba(var(--nf-accent-rgb),0.15)]")}>
                                  <Sparkles size={12} className="text-nf-accent/80" />
                                </div>
                                <div className="flex-1 min-w-0 text-nf-text">
                                  {/* Content type badge */}
                                  {!msg.isTyping && msg.content !== "__PROFILE_CARD__" && msg.content.length > 20 && (
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      {(() => {
                                        const c = msg.content;
                                        if (c.includes("```")) return <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-400/8 text-blue-400/60 border border-blue-400/10 font-bold flex items-center gap-1"><Code size={7} /> كود</span>;
                                        if (c.includes("|---|") || (c.split("|").length > 6 && c.includes("|"))) return <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-400/8 text-green-400/60 border border-green-400/10 font-bold flex items-center gap-1"><BarChart3 size={7} /> جدول</span>;
                                        if (c.includes("##")) return <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-nf-accent/8 text-nf-accent/60 border border-nf-accent/10 font-bold flex items-center gap-1"><BookOpen size={7} /> شرح</span>;
                                        if (c.includes("- ") && c.split("\n").length > 5) return <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-400/8 text-yellow-400/60 border border-yellow-400/10 font-bold flex items-center gap-1"><List size={7} /> نقاط</span>;
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                  {msg.isTyping ? (
                                    <div className="flex flex-col gap-2 px-1 py-3">
                                      {/* Wave animation */}
                                      <div className="flex items-center gap-[3px]">
                                        {[0,1,2,3,4].map(i => (
                                          <motion.span
                                            key={i}
                                            animate={{ height: [4, 14, 4], opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                                            className="w-[3px] rounded-full bg-gradient-to-t from-nf-accent/30 to-nf-accent"
                                          />
                                        ))}
                                      </div>
                                      {/* Rotating status */}
                                      <motion.span
                                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-[10px] text-nf-accent/50 font-medium"
                                      >
                                        {["يفكر...", "يحلل السؤال...", "يكتب الرد..."][aiTypingPhase]}
                                      </motion.span>
                                    </div>
                                  ) : (
                                <>
                                  {msg.role === "assistant" ? (
                                    msg.content === "__PROFILE_CARD__" ? (
                                      /* Full Visual Profile Card — real data from Firebase */
                                      <div className="bg-nf-card rounded-xl border border-nf-border/6 overflow-hidden max-w-[380px]">
                                        <div className="relative h-[90px] overflow-hidden">
                                          <img src={myProfileData?.bannerUrl || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-gradient-to-t from-nf-card via-nf-card/40 to-transparent" />
                                        </div>
                                        <div className="px-4 -mt-7 relative z-10 pb-4">
                                          <div className="flex items-start gap-3">
                                            <div className="shrink-0">
                                              {myProfileData?.photo ? <img src={myProfileData.photo} alt="" className="w-14 h-14 rounded-full object-cover border-3 border-nf-card" /> : <div className="w-14 h-14 rounded-full bg-nf-secondary flex items-center justify-center text-nf-text text-[20px] font-bold border-3 border-nf-card">{authorName[0]}</div>}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-2">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[14px] font-bold text-nf-text">{authorName}</span>
                                                <span className="text-[8px] px-2 py-0.5 rounded bg-nf-accent/10 text-nf-accent font-semibold">{myProfileData?.role || userRole}</span>
                                                <span className={cn("flex items-center gap-1 text-[8px] font-semibold px-2 py-0.5 rounded", myProfileData?.isOnline ? "bg-green-400/10 text-green-400" : "bg-nf-secondary text-nf-dim/50")}>
                                                  <span className={cn("w-1.5 h-1.5 rounded-full", myProfileData?.isOnline ? "bg-green-400" : "bg-nf-dim/30")} />
                                                  {myProfileData?.isOnline ? "متصل" : "غير متصل"}
                                                </span>
                                              </div>
                                              <span className="text-[10px] text-nf-dim/40">u/{authorName}</span>
                                            </div>
                                          </div>
                                          {myProfileData?.bio && <p className="text-[11px] text-nf-dim/70 leading-[1.8] mt-3 border-t border-nf-border/6 pt-3">{myProfileData.bio}</p>}
                                          {myProfileData?.socialLinks && Object.values(myProfileData.socialLinks).some(v => v.trim()) && (
                                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                              {Object.entries(myProfileData.socialLinks).filter(([, v]) => v.trim()).map(([key, val]) => {
                                                const socialMeta: Record<string, { label: string; domain: string }> = { twitter: { label: "X", domain: "x.com" }, youtube: { label: "YouTube", domain: "youtube.com" }, github: { label: "GitHub", domain: "github.com" }, steam: { label: "Steam", domain: "steamcommunity.com" }, discord: { label: "Discord", domain: "discord.gg" }, website: { label: "الموقع", domain: "" } };
                                                const meta = socialMeta[key];
                                                if (!meta) return null;
                                                return <a key={key} href={val.startsWith("http") ? val : `https://${val}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors border border-blue-500/10 hover:border-blue-500/20 underline underline-offset-2"><ExternalLink size={9} />{meta.label}</a>;
                                              })}
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            {[
                                              { label: "مواضيع", value: myProfileData?.posts || 0, icon: MessageCircle },
                                              { label: "متابعين", value: myProfileData?.followerCount || 0, icon: Users },
                                              { label: "متابَعين", value: myProfileData?.followingCount || 0, icon: User },
                                            ].map((stat, i) => { const SI = stat.icon; return (
                                              <span key={i} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-nf-secondary/40 text-[9px] text-nf-dim/50 font-medium">
                                                <SI size={9} className="text-nf-accent/50" />
                                                <span className="font-bold text-nf-text">{stat.value}</span> {stat.label}
                                              </span>
                                            ); })}
                                            {myProfileData?.joinDate && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-nf-secondary/40 text-[9px] text-nf-dim/50 font-medium"><Calendar size={9} className="text-nf-accent/50" /> انضم {timeAgo(myProfileData.joinDate)}</span>}
                                          </div>
                                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-nf-border/6">
                                            <button onClick={() => { navigator.clipboard.writeText(myProfileData?.bio || "").catch(() => {}); showToast("تم نسخ البايو"); }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-nf-dim/30 hover:text-nf-text hover:bg-nf-secondary/40 text-[9px] font-medium transition-colors"><Copy size={9} /> نسخ البايو</button>
                                            <button onClick={() => { openProfile(authorUid, authorName, authorPhoto); }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-nf-dim/30 hover:text-nf-accent hover:bg-nf-accent/5 text-[9px] font-medium transition-colors"><ExternalLink size={9} /> عرض كامل</button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : msg.content.startsWith("__MENTION_CARD__") ? (
                                      /* Mention Card — profile for @mentioned user */
                                      (() => {
                                        let mData: any = {};
                                        try { mData = JSON.parse(msg.content.replace("__MENTION_CARD__", "")); } catch {}
                                        return (
                                          <div className="bg-nf-card rounded-xl border border-nf-border/6 overflow-hidden max-w-[320px]">
                                            {mData.banner && (
                                              <div className="relative h-[50px] overflow-hidden">
                                                <img src={mData.banner} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-nf-card to-transparent" />
                                              </div>
                                            )}
                                            <div className={cn("px-4 pb-3", mData.banner ? "-mt-5 relative z-10" : "pt-3")}>
                                              <div className="flex items-center gap-3">
                                                <div className="shrink-0">
                                                  {mData.photo ? <img src={mData.photo} alt="" className={cn("rounded-full object-cover border-2 border-nf-card", mData.banner ? "w-10 h-10" : "w-10 h-10")} /> : <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-nf-text text-[16px] font-bold border-2 border-nf-card">{(mData.name || "م")[0]}</div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[12px] font-bold text-nf-text">{mData.name || "مستخدم"}</span>
                                                    <span className="text-[7px] px-1.5 py-0.5 rounded bg-nf-accent/10 text-nf-accent font-semibold">{mData.role || "عضو"}</span>
                                                  </div>
                                                  <span className="text-[9px] text-nf-dim/40">u/{mData.name || "مستخدم"}</span>
                                                </div>
                                              </div>
                                              {mData.bio && <p className="text-[10px] text-nf-dim/60 leading-[1.6] mt-2 border-t border-nf-border/4 pt-2">{mData.bio}</p>}
                                              {mData.socialLinks && Object.values(mData.socialLinks as Record<string, string>).some((v: string) => v?.trim()) && (
                                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                  {Object.entries(mData.socialLinks as Record<string, string>).filter(([, v]) => v?.trim()).map(([key, val]) => {
                                                    const socialMeta: Record<string, string> = { twitter: "X", youtube: "YouTube", github: "GitHub", steam: "Steam", discord: "Discord", website: "الموقع" };
                                                    const label = socialMeta[key];
                                                    if (!label) return null;
                                                    return <a key={key} href={val} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-semibold bg-nf-secondary/60 text-nf-dim/50 hover:bg-blue-500/10 hover:text-blue-400 transition-colors border border-nf-border/4"><ExternalLink size={7} />{label}</a>;
                                                  })}
                                                </div>
                                              )}
                                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                {mData.posts > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-nf-secondary/40 text-[8px] text-nf-dim/50 font-medium"><MessageCircle size={8} className="text-nf-accent/50" /><span className="font-bold text-nf-text">{mData.posts}</span> موضوع</span>}
                                              </div>
                                              <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-nf-border/4">
                                                <button onClick={() => { openProfile(mData.uid, mData.name, mData.photo); }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-nf-dim/30 hover:text-blue-400 hover:bg-blue-400/5 text-[9px] font-medium transition-colors"><ExternalLink size={9} /> عرض البروفايل</button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <div className="ai-markdown text-[13px] leading-[1.9] relative">
                                        {(() => {
                                          const markdownComponents = {
                                            code({ node, inline, className, children, ...props }: any) {
                                              const match = /language-(\w+)/.exec(className || "");
                                              const lang = match ? match[1] : "";
                                              const isBlock = !inline && (node?.position?.start?.line !== node?.position?.end?.line || className || (String(children).includes('\n')));
                                              if (isBlock) {
                                                const rawCode = node?.children?.map((c: any) => c.value || '').join('') || String(children).replace(/\n$/, "");
                                                return <CodeBlockWithCopy code={rawCode} lang={lang} />;
                                              }
                                              return <code className="bg-nf-secondary/40 text-nf-text px-1.5 py-0.5 rounded text-[12px] font-mono border border-nf-border/6" {...props}>{children}</code>;
                                            },
                                            a({ node, href, children, ...props }: any) {
                                              return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" {...props}>{children}</a>;
                                            },
                                            table({ children, node, ...props }: any) {
                                              const tableMd = () => {
                                                const rows = node?.children || [];
                                                return rows.map((row: any) => {
                                                  const cells = row.children?.filter((c: any) => c.tagName === 'th' || c.tagName === 'td') || [];
                                                  return '| ' + cells.map((c: any) => c.children?.map((ch: any) => ch.value || '').join('') || '').join(' | ') + ' |';
                                                }).join('\n');
                                              };
                                              return <div className="relative group/table overflow-x-auto my-2 rounded-lg border border-nf-border/10">
                                                <table className="w-full text-[12px]" {...props}>{children}</table>
                                                <button onClick={() => { navigator.clipboard.writeText(tableMd()).catch(() => {}); showToast("تم نسخ الجدول ✓"); }} className="absolute top-1 left-1 opacity-0 group-hover/table:opacity-100 p-1 rounded bg-nf-secondary/80 hover:bg-nf-accent/20 text-nf-dim hover:text-nf-accent transition-all border border-nf-border/20" title="نسخ الجدول"><Copy size={10} /></button>
                                              </div>;
                                            },
                                            thead({ children, ...props }: any) {
                                              return <thead className="bg-nf-accent/5">{children}</thead>;
                                            },
                                            th({ children, ...props }: any) {
                                              return <th className="px-3 py-2 text-right font-bold text-nf-text border-b border-nf-border/10" {...props}>{children}</th>;
                                            },
                                            td({ children, ...props }: any) {
                                              return <td className="px-3 py-2 text-nf-dim/80 border-b border-nf-border/6" {...props}>{children}</td>;
                                            },
                                            blockquote({ children, ...props }: any) {
                                              return <blockquote className="border-r-4 border-nf-accent/30 bg-nf-accent/5 pr-4 py-2 my-2 rounded-l-lg" {...props}>{children}</blockquote>;
                                            },
                                            h1({ children, ...props }: any) {
                                              return <h1 className="text-[26px] font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-nf-text via-nf-text to-nf-dim/70 mt-5 mb-3 leading-tight" style={{ animation: 'headingReveal 0.6s ease-out' }} {...props}>{children}</h1>;
                                            },
                                            h2({ children, ...props }: any) {
                                              return <h2 className="text-[24px] font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-nf-text via-nf-text to-nf-dim/60 mt-5 mb-3 leading-tight" style={{ animation: 'headingReveal 0.5s ease-out' }} {...props}>{children}</h2>;
                                            },
                                            h3({ children, ...props }: any) {
                                              return <h3 className="text-[18px] font-bold text-nf-text/90 mt-3 mb-2" style={{ animation: 'headingReveal 0.4s ease-out' }} {...props}>{children}</h3>;
                                            },
                                            ul({ children, ...props }: any) {
                                              return <ul className="list-disc list-outside mr-4 space-y-0.5 my-1" {...props}>{children}</ul>;
                                            },
                                            ol({ children, ...props }: any) {
                                              return <ol className="list-decimal list-outside mr-4 space-y-0.5 my-1" {...props}>{children}</ol>;
                                            },
                                            li({ children, ...props }: any) {
                                              return <li className="text-nf-dim/80 leading-[1.8]" {...props}>{children}</li>;
                                            },
                                            hr({ ...props }: any) {
                                              return <hr className="my-4 border-0 h-[1px] bg-gradient-to-l from-transparent via-nf-accent/20 to-transparent" {...props} />;
                                            },
                                            p({ children, ...props }: any) {
                                              return <p className="my-1.5 leading-[1.9]" {...props}>{children}</p>;
                                            }
                                          };
                                          
                                          if (aiTypingProgress[msg.id] > 0 && aiTypingProgress[msg.id] < msg.content.length) {
                                            return (
                                              <>
                                                <div>
                                                  <ReactMarkdown components={markdownComponents}>{msg.content.slice(0, aiTypingProgress[msg.id])}</ReactMarkdown>
                                                </div>
                                                <span className="inline-block w-[2px] h-[15px] bg-nf-accent/80 animate-pulse mr-0.5 align-middle rounded-full shadow-[0_0_6px_rgba(var(--nf-accent-rgb),0.4)]" />
                                              </>
                                            );
                                          } else {
                                            return (
                                              <div>
                                                <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    )
                                  ) : (
                                    <div className="whitespace-pre-wrap leading-[1.8] text-[13px]">{msg.content}</div>
                                  )}
                                  {msg.role === "assistant" && !msg.isTyping && msg.content && msg.content !== "__PROFILE_CARD__" && !msg.content.startsWith("__MENTION_CARD__") && (!aiTypingProgress[msg.id] || aiTypingProgress[msg.id] >= msg.content.length) && (
                                    <div className="flex flex-col gap-2 mt-3">
                                      <span className="text-[8px] text-nf-dim/20">{msg.ts ? new Date(msg.ts).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : ""}{aiResponseTimes[msg.id] ? ` · ${aiResponseTimes[msg.id]}s` : ""}</span>
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => setAiMsgFeedback(p => ({ ...p, [msg.id]: p[msg.id] === "up" ? undefined as any : "up" }))} className={cn("p-1.5 rounded-lg transition-all", aiMsgFeedback[msg.id] === "up" ? "text-green-400 bg-green-400/10" : "text-nf-dim/30 hover:text-nf-dim hover:bg-nf-secondary/30")}><ThumbsUp size={13} /></button>
                                        <button onClick={() => setAiMsgFeedback(p => ({ ...p, [msg.id]: p[msg.id] === "down" ? undefined as any : "down" }))} className={cn("p-1.5 rounded-lg transition-all", aiMsgFeedback[msg.id] === "down" ? "text-red-400 bg-red-400/10" : "text-nf-dim/30 hover:text-nf-dim hover:bg-nf-secondary/30")}><ThumbsDown size={13} /></button>
                                        <div className="w-px h-4 bg-nf-border/15 mx-1" />
                                        <button onClick={() => { navigator.clipboard.writeText(msg.content).catch(() => {}); showToast("تم النسخ"); }} className="p-1.5 rounded-lg text-nf-dim/30 hover:text-nf-dim hover:bg-nf-secondary/30 transition-all"><Copy size={13} /></button>
                                        <button onMouseDown={(e) => {
                                          e.preventDefault();
                                          const sel = window.getSelection()?.toString();
                                          const qt = sel || (msg.content.length > 100 ? msg.content.slice(0, 100) + "..." : msg.content);
                                          setAiReplyContext(qt);
                                          aiTextareaRef.current?.focus();
                                        }} className="p-1.5 rounded-lg text-nf-dim/30 hover:text-blue-400 hover:bg-blue-400/10 transition-all"><Reply size={13} /></button>
                                        <button onClick={() => { setReplyText(prev => prev + msg.content); if (!replyingTo && activeThread) setReplyingTo(activeThread.id); showToast("تم الإدراج في الرد"); }} className="p-1.5 rounded-lg text-nf-dim/30 hover:text-nf-accent hover:bg-nf-accent/10 transition-all"><Send size={13} /></button>
                                        <button onClick={() => { setNewBody(msg.content); navigateForum("new"); showToast("تم نقل المحتوى لموضوع جديد"); }} className="p-1.5 rounded-lg text-nf-dim/30 hover:text-green-400 hover:bg-green-400/10 transition-all"><Plus size={13} /></button>
                                        {msgIdx === aiMessages.length - 1 && (
                                          <button onClick={async () => {
                                            const lastUserMsg = [...aiMessages].reverse().find(m => m.role === "user");
                                            if (!lastUserMsg || !aiApiKey) return;
                                            const regenId = Math.random().toString(36).slice(2);
                                            setAiMessages(p => [...p.slice(0, -1), { id: regenId, role: "assistant", content: "", isTyping: true }]);
                                            setAiGenerating(true);
                                            try {
                                              const recent = aiMessages.filter(m => !m.isTyping && m.id !== msg.id).slice(-4);
                                              const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [...recent, { role: "user", content: lastUserMsg.content }], getAISystemPrompt());
                                              setAiMessages(p => p.map(m => m.id === regenId ? { ...m, content: result || "لم أستطع توليد رد", isTyping: false } : m));
                                            } catch (err: any) {
                                              setAiMessages(p => p.map(m => m.id === regenId ? { ...m, content: `خطأ: ${(err?.message || "").slice(0, 80)}`, isTyping: false } : m));
                                            } finally { setAiGenerating(false); }
                                          }} className="p-1.5 rounded-lg text-nf-dim/30 hover:text-nf-dim hover:bg-nf-secondary/30 transition-all"><RefreshCw size={13} /></button>
                                        )}
                                      </div>
                                      
                                      {/* Follow-up Suggestions for the last message */}
                                      {msgIdx === aiMessages.length - 1 && (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                          {(() => {
                                            const txt = msg.content.toLowerCase();
                                            let suggestions = [];
                                            if (txt.includes("```") || txt.includes("كود") || txt.includes("برمج")) {
                                              suggestions = [
                                                { text: "اشرح الكود سطراً بسطر", icon: Code },
                                                { text: "هل يمكن تحسينه؟", icon: Zap },
                                                { text: "كيف أستخدمه في مشروعي؟", icon: Lightbulb }
                                              ];
                                            } else if (txt.includes("خطأ") || txt.includes("مشكلة") || txt.includes("error")) {
                                              suggestions = [
                                                { text: "كيف أتجنب هذا الخطأ؟", icon: Shield },
                                                { text: "هل هناك حلول أخرى؟", icon: List },
                                                { text: "اشرح سبب الخطأ", icon: Bug }
                                              ];
                                            } else if (txt.includes("قصة") || txt.includes("لعبة") || txt.includes("تصميم")) {
                                              suggestions = [
                                                { text: "أعطني أفكاراً إبداعية أكثر", icon: Sparkles },
                                                { text: "كيف أطبق هذا برمجياً؟", icon: Code },
                                                { text: "لخّص الأفكار في نقاط", icon: List }
                                              ];
                                            } else if (txt.includes("|") || txt.includes("مقارنة") || txt.includes("جدول")) {
                                              suggestions = [
                                                { text: "أضف معايير أخرى للمقارنة", icon: SlidersHorizontal },
                                                { text: "أي خيار تنصحني به؟", icon: Lightbulb },
                                                { text: "اشرح الفرق بالتفصيل", icon: BookOpen }
                                              ];
                                            } else if (txt.includes("شرح") || txt.includes("كيف") || txt.includes("خطوة")) {
                                              suggestions = [
                                                { text: "أعطني مثال تطبيقي", icon: Code },
                                                { text: "ما هي الأخطاء الشائعة؟", icon: AlertTriangle },
                                                { text: "هل يوجد طريقة أبسط؟", icon: Minimize2 }
                                              ];
                                            } else {
                                              suggestions = [
                                                { text: "اشرح أكثر بتفصيل", icon: Sparkles },
                                                { text: "أعطني مثال عملي", icon: Code },
                                                { text: "لخّص في نقاط", icon: List },
                                                { text: "قارن بين الخيارات", icon: SlidersHorizontal }
                                              ];
                                            }
                                            return suggestions.map((s, i) => {
                                              const SI = s.icon;
                                              return (
                                                <button key={i} onClick={() => aiChatSend(s.text)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-nf-border/10 bg-nf-secondary/20 hover:bg-nf-secondary/40 hover:border-nf-accent/15 text-nf-dim/60 hover:text-nf-text text-[10px] font-medium transition-all">
                                                  <SI size={10} className="text-nf-accent/50" /> {s.text}
                                                </button>
                                              )
                                            });
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                                  )}
                                </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ))}
                        <div ref={aiChatEndRef} />
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Input bar — ChatGPT/Claude style */}
                  <div className="flex-shrink-0 pt-2 pb-4 relative z-10">
                    <div className="max-w-[780px] mx-auto px-4">
                    {/* Suggestion chips — horizontal scroll strip with arrows */}
                    <div className="relative flex items-center gap-1">
                      <button onClick={() => { const el = document.getElementById('ai-chips-scroll'); if (el) el.scrollBy({ left: -120, behavior: 'smooth' }); }} className="shrink-0 w-5 h-5 rounded-full bg-nf-secondary/60 hover:bg-nf-accent/20 text-nf-dim/40 hover:text-nf-accent flex items-center justify-center transition-all"><ChevronRight size={10} /></button>
                      <div id="ai-chips-scroll" className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none flex-1">
                        {[
                        { q: "حسّن نصي", icon: Sparkles },
                        { q: "موضوع مميز", icon: FileCode },
                        { q: "أسلوب أدبي", icon: BookOpen },
                        { q: "صحح أخطائي", icon: Edit3 },
                        { q: "وسّع وفصّل", icon: Maximize2 },
                        { q: "اختصر", icon: Minimize2 },
                        { q: "ترجم لي", icon: Globe },
                        { q: "اكتب كود", icon: Code },
                        { q: "حل مشكلة", icon: Bug },
                        { q: "نظّم مشروعي", icon: BarChart3 },
                        { q: "اقترح عنوان", icon: Lightbulb },
                        { q: "لخّص موضوع", icon: FileCode },
                        { q: "اقترح رد", icon: Reply },
                        { q: "حسّن وصف البروفايل", icon: User, profile: true },
                        { q: "ساعدني بالموقع", icon: HelpCircle },
                        { q: "قارن تقنيات", icon: SlidersHorizontal },
                        { q: "اشرح لي", icon: BookOpen },
                        { q: "اكتب إعلان", icon: Megaphone },
                      ].map(item => { const II = item.icon; return (
                        <button key={item.q} onClick={async () => {
                          if ((item as any).profile && user) {
                            const pd = await fetchMyProfile();
                            const userDisplay = { id: `u-${Date.now()}`, role: "user" as const, content: "حسّن وصف البروفايل", isTyping: false, ts: Date.now() };
                            const aiTypingId = `ai-${Date.now()}`;
                            setAiMessages(p => [...p, userDisplay, { id: aiTypingId, role: "assistant" as const, content: "", isTyping: true, ts: Date.now() }]);
                            if (aiApiKey && pd) {
                              setAiGenerating(true);
                              try {
                                const realName = pd.name === "NorthFall" ? (user?.displayName !== "NorthFall" ? user?.displayName : pd.name) : pd.name;
                                const socialLinksStr = pd.socialLinks ? Object.entries(pd.socialLinks as Record<string, string>).filter(([, v]) => (v as string).trim()).map(([k, v]) => `[${k}](${(v as string).trim()})`).join(" — ") : "لا توجد";
                                const profileContext = `اكتب وصف بروفايل مختصر وجذاب للمستخدم التالي. استخدم البيانات أدناه فقط ولا تخترع أي شيء.

بيانات المستخدم الحقيقية:
- الاسم: ${realName}
- الدور: ${pd.role || "عضو"}
- النبذة: "${pd.bio || "لا توجد نبذة"}"
- عدد المواضيع: ${pd.posts || 0}
- تاريخ الانضمام: ${pd.joinDate || "غير محدد"}
- متابعين: ${pd.followerCount || 0}
- متابَعين: ${pd.followingCount || 0}
- الروابط: ${socialLinksStr}

قواعد صارمة جداً:
1. لا تسمّ المستخدم NorthFall أبداً — هذا اسم المنصة. اسمه الحقيقي هو ${realName}
2. لا تخترع أي بيانات — لا مهارات، لا اهتمامات، لا إحصائيات غير المذكورة أعلاه
3. لا تقل "لا تتوفر معلومات" — إذا بيانات غير متوفرة، لا تذكرها أصلاً
4. اذكر الروابط بصيغة Markdown: [الاسم](الرابط) — استخدم الروابط أعلاه فقط
5. كن مختصراً — لا تتجاوز 6 أسطر
6. لا تكتب أقسام مثل "إحصائيات" أو "مهارات" أو "اهتمامات"
7. اكتب فقرة واحدة مدمجة وجذابة`;
                                const result = await callAI(AI_MODELS[aiModel].provider, AI_MODELS[aiModel].model, [{ role: "user", content: profileContext }], getAISystemPrompt());
                                setAiMessages(p => p.map(m => m.id === aiTypingId ? { ...m, content: result || "لم أستطع توليد وصف", isTyping: false } : m));
                              } catch (err: any) {
                                setAiMessages(p => p.map(m => m.id === aiTypingId ? { ...m, content: `خطأ: ${(err?.message || "").slice(0, 80)}`, isTyping: false } : m));
                              } finally { setAiGenerating(false); }
                            }
                          } else {
                            setAiInput(item.q);
                            aiTextareaRef.current?.focus();
                          }
                        }} className="flex items-center gap-1.5 shrink-0 bg-nf-secondary/25 hover:bg-nf-secondary/50 border border-nf-border/6 hover:border-nf-accent/15 rounded-full px-3 py-1 transition-all group">
                          <II size={10} className="text-nf-accent/40 group-hover:text-nf-accent transition-colors" />
                          <span className="text-[9px] text-nf-dim/45 group-hover:text-nf-text font-semibold transition-colors whitespace-nowrap">{item.q}</span>
                        </button>
                      ); })}
                      </div>
                      <button onClick={() => { const el = document.getElementById('ai-chips-scroll'); if (el) el.scrollBy({ left: 120, behavior: 'smooth' }); }} className="shrink-0 w-5 h-5 rounded-full bg-nf-secondary/60 hover:bg-nf-accent/20 text-nf-dim/40 hover:text-nf-accent flex items-center justify-center transition-all"><ChevronLeft size={10} /></button>
                    </div>
                    <AnimatePresence>
                      {aiReplyContext && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="mb-2 bg-nf-accent/5 border-r-4 border-nf-accent px-4 py-2.5 rounded-xl flex items-center justify-between group backdrop-blur-md">
                          <div className="flex-1 min-w-0 pl-4">
                            <p className="text-[9px] font-black text-nf-accent uppercase mb-0.5 tracking-[0.1em] flex items-center gap-1.5"><Reply size={9} strokeWidth={3} /> الرد على النقطة:</p>
                            <p className="text-[12px] text-nf-dim italic truncate opacity-70 leading-relaxed font-medium">"{aiReplyContext}"</p>
                          </div>
                          <button type="button" onClick={() => setAiReplyContext(null)} className="p-1.5 rounded-full hover:bg-nf-accent/10 text-nf-dim/30 hover:text-nf-accent transition-all group-hover:scale-110 active:scale-95"><X size={14} strokeWidth={2.5} /></button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative bg-nf-card/90 rounded-2xl border border-nf-border/8 focus-within:border-nf-accent/20 focus-within:shadow-[0_0_24px_rgba(var(--nf-accent-rgb),0.08)] transition-all" style={{ backdropFilter: "blur(16px)" }}>
                      {/* Context hint bar — shows when viewing a thread */}
                      {activeThread && viewMode === "ai" && (
                        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                          <MessageSquare size={10} className="text-nf-accent/40 shrink-0" />
                          <span className="text-[9px] text-nf-dim/40 truncate">سياق: {activeThread.title}</span>
                          <button onClick={() => aiChatSend(`لخّص لي هذا الموضوع:\n\nالعنوان: ${activeThread.title}\nالمحتوى:\n${activeThread.body?.slice(0, 1500) || ""}`)} className="shrink-0 text-[8px] font-bold text-nf-accent/50 hover:text-nf-accent bg-nf-accent/5 hover:bg-nf-accent/10 px-2 py-0.5 rounded-md transition-colors border border-nf-accent/8">لخّص الموضوع</button>
                        </div>
                      )}
                      <textarea
                        ref={aiTextareaRef}
                        value={aiInput}
                        onChange={e => { setAiInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); aiChatSend(); } }}
                        placeholder="اكتب رسالتك لـ NorthFall AI..."
                        rows={1}
                        className="ai-chat-input w-full bg-transparent text-nf-text text-[14px] placeholder:text-nf-dim/35 outline-none min-w-0 font-medium resize-none overflow-hidden px-4 pt-3 pb-2 leading-[1.8]"
                        style={{ maxHeight: "160px" }}
                      />
                      <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
                        <div className="flex items-center gap-1">
                          {aiInput.trim() && <span className="text-[8px] text-nf-dim/20 tabular-nums">{aiInput.trim().split(/\s+/).filter(Boolean).length} كلمة</span>}
                          {aiInput.trim() && <span className="text-[8px] text-nf-dim/15">·</span>}
                          {aiInput.trim() && <span className="text-[8px] text-nf-dim/20 tabular-nums">{aiInput.length} حرف</span>}
                          {/* Mode dropdown */}
                          <div className="relative" ref={aiModeDropdownRef}>
                            <button onClick={(e) => { e.stopPropagation(); setAiModeDropdown(!aiModeDropdown); setAiModelDropdown(false); }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold text-nf-dim/50 hover:text-nf-dim hover:bg-nf-secondary/30 transition-all whitespace-nowrap border border-nf-border/6 hover:border-nf-border/15">
                              <Shield size={8} className="text-nf-accent/50" />
                              <span>{aiMode === "pro" ? "احترافي" : aiMode === "creative" ? "إبداعي" : aiMode === "casual" ? "عفوي" : "مبرمج"}</span>
                              <ChevronDown size={8} className={cn("shrink-0 transition-transform opacity-40", aiModeDropdown && "rotate-180")} />
                            </button>
                            <AnimatePresence>
                              {aiModeDropdown && (
                                <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.1 }} className="absolute bottom-full right-0 mb-1 z-[9999] rounded-xl border border-nf-border/15 shadow-xl shadow-black/30 min-w-[160px] overflow-y-auto py-0.5" style={{ backgroundColor: "rgba(24,24,26,0.95)", backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}>
                                  <div className="px-2.5 pt-1 pb-0.5 flex items-center gap-1"><Shield size={9} className="text-nf-accent/40" /><span className="text-[7px] font-bold text-nf-dim/50 uppercase tracking-wider">الوضع</span></div>
                                  {[
                                    { id: "pro" as const, label: "احترافي", icon: Shield, color: "text-nf-accent" },
                                    { id: "creative" as const, label: "إبداعي", icon: Sparkles, color: "text-purple-400" },
                                    { id: "casual" as const, label: "عفوي", icon: MessageCircle, color: "text-green-400" },
                                    { id: "code" as const, label: "مبرمج", icon: Code, color: "text-blue-400" },
                                  ].map(m => { const MI = m.icon; return (
                                    <button key={m.id} onClick={() => { setAiMode(m.id); setAiModeDropdown(false); }} className={cn("w-[calc(100%-4px)] flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all rounded-lg mx-0.5", aiMode === m.id ? `${m.color} bg-nf-accent/8 font-bold` : "text-nf-text/80 hover:bg-white/4")}>
                                      <MI size={10} className={aiMode === m.id ? m.color : "text-nf-dim/40"} />
                                      <span className="flex-1 text-right">{m.label}</span>
                                      {aiMode === m.id && <Check size={10} className="text-nf-accent shrink-0" />}
                                    </button>
                                  ); })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {/* Model selector */}
                          <div className="relative" ref={aiModelDropdownRef}>
                            <button onClick={(e) => { e.stopPropagation(); setAiModelDropdown(!aiModelDropdown); setAiModeDropdown(false); }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold text-nf-dim/50 hover:text-nf-dim hover:bg-nf-secondary/30 transition-all whitespace-nowrap border border-nf-border/6 hover:border-nf-border/15">
                              <Sparkles size={8} className="text-nf-accent/50" />
                              <span>{AI_MODELS[aiModel].name}</span>
                              {!AI_MODELS[aiModel].free && <span className="text-[6px] font-bold text-amber-400 bg-amber-400/8 px-0.5 py-0.5 rounded">PRO</span>}
                              <ChevronDown size={8} className={cn("shrink-0 transition-transform opacity-40", aiModelDropdown && "rotate-180")} />
                            </button>
                            <AnimatePresence>
                              {aiModelDropdown && (
                                <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.1 }} className="absolute bottom-full right-0 mb-1 z-[9999] rounded-xl border border-nf-border/15 shadow-xl shadow-black/30 min-w-[200px] max-h-[320px] overflow-y-auto py-0.5" style={{ backgroundColor: "rgba(24,24,26,0.95)", backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}>
                                  <div className="px-2.5 pt-1 pb-0.5 flex items-center gap-1"><Sparkles size={9} className="text-nf-accent/40" /><span className="text-[7px] font-bold text-nf-dim/50 uppercase tracking-wider">مجاني</span></div>
                                  {AI_MODELS.filter(m => m.free).map((m, idx) => {
                                    const isSelected = AI_MODELS[aiModel].name === m.name;
                                    return (
                                    <button key={idx} onClick={() => { setAiModel(AI_MODELS.indexOf(m)); setAiModelDropdown(false); }} className={cn("w-[calc(100%-4px)] flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all rounded-lg mx-0.5", isSelected ? "text-nf-accent bg-nf-accent/8 font-bold" : "text-nf-text/80 hover:bg-white/4")}>
                                      <span className="flex-1 text-right">{m.name}</span>
                                      <span className="text-[7px] text-nf-dim/40 font-medium">{m.provider}</span>
                                      {isSelected && <Check size={10} className="text-nf-accent shrink-0" />}
                                    </button>
                                  ); })}
                                  <div className="mx-2.5 my-0.5 border-t border-white/4" />
                                  <div className="px-2.5 pt-0.5 pb-0.5 flex items-center gap-1"><Zap size={9} className="text-nf-accent/40" /><span className="text-[7px] font-bold text-nf-dim/50 uppercase tracking-wider">مدفوع</span></div>
                                  {AI_MODELS.filter(m => !m.free).map((m, idx) => {
                                    const isSelected = AI_MODELS[aiModel].name === m.name;
                                    return (
                                    <button key={idx} onClick={() => { setAiModel(AI_MODELS.indexOf(m)); setAiModelDropdown(false); }} className={cn("w-[calc(100%-4px)] flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] transition-all rounded-lg mx-0.5", isSelected ? "text-nf-accent bg-nf-accent/8 font-bold" : "text-nf-text/80 hover:bg-white/4")}>
                                      <span className="flex-1 text-right">{m.name}</span>
                                      <span className="text-[6px] font-bold text-amber-400 bg-amber-400/8 px-0.5 py-0.5 rounded">PRO</span>
                                      {isSelected && <Check size={10} className="text-nf-accent shrink-0" />}
                                    </button>
                                  ); })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          {/* Settings button next to model selector */}
                          <button onClick={() => setAiSettingsOpen(true)} className="p-1 rounded-lg text-nf-dim/25 hover:text-nf-dim hover:bg-nf-secondary/30 transition-colors border border-transparent hover:border-nf-border/10" title="إعدادات API"><Settings size={12} /></button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {aiGenerating && (
                            <button onClick={() => { aiAbortRef.current?.abort(); setAiGenerating(false); setAiLoading(false); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-400/10 hover:bg-red-400/20 text-red-400 text-[9px] font-bold transition-all border border-red-400/15">
                              <div className="w-1.5 h-1.5 rounded-sm bg-red-400" /> إيقاف
                            </button>
                          )}
                          <button onClick={() => aiChatSend()} disabled={!aiInput.trim() && !aiGenerating} className={cn("p-2 rounded-xl transition-all", aiInput.trim() ? "bg-nf-accent hover:bg-nf-accent/80 text-white shadow-[0_0_12px_rgba(var(--nf-accent-rgb),0.2)]" : "bg-nf-secondary/30 text-nf-dim/20 cursor-not-allowed")}>
                            <ArrowUp size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mt-1.5 px-0.5">
                      <span className="text-[9px] text-nf-dim/20">NorthFall AI قد يُنتج معلومات غير دقيقة. تحقق من المعلومات المهمة.</span>
                    </div>
                    </div>
                    {/* Scroll to bottom button */}
                    <AnimatePresence>
                      {aiShowScrollBtn && (
                        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-24 left-1/2 -translate-x-1/2 p-2 rounded-full bg-nf-card/90 border border-nf-border/15 text-nf-dim/60 hover:text-nf-accent hover:border-nf-accent/20 transition-all shadow-lg z-20" style={{ backdropFilter: "blur(12px)" }}>
                          <ChevronDown size={16} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* COMMUNITY PROFILE VIEW */}
              {viewMode === "community" && communityViewData && (
                <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button onClick={backToList} className="flex items-center gap-1.5 text-[13px] text-nf-accent hover:underline mb-4 font-bold"><ArrowLeft size={14} /> العودة</button>

                  <div className="bg-nf-card rounded-lg overflow-hidden mb-5">
                    {/* Banner with user photo overlay */}
                    <div className="relative h-[160px] overflow-hidden">
                      <img src={communityViewData.banner || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-nf-card via-nf-card/40 to-transparent" />
                      {/* User photo in bottom-right of banner */}
                      {user?.photoURL && <img src={user.photoURL} alt="" className="absolute bottom-3 left-4 w-10 h-10 rounded-full object-cover border-2 border-nf-card shadow-lg" />}
                    </div>

                    {/* Header - logo overlaps banner */}
                    <div className="flex items-start gap-4 px-5 -mt-10 relative z-10 pb-3">
                      <div className="shrink-0">
                        {communityViewData.img ? <img src={communityViewData.img} alt="" className="w-[72px] h-[72px] rounded-2xl object-cover border-[3px] border-nf-card shadow-lg" /> : <div className="w-[72px] h-[72px] rounded-2xl bg-nf-accent/20 flex items-center justify-center text-[26px] text-nf-accent font-bold border-[3px] border-nf-card">{communityViewData.name[0]}</div>}
                      </div>
                      <div className="flex-1 min-w-0 pt-3">
                        <h1 className="text-[22px] font-bold text-nf-text leading-tight">{communityViewData.name}</h1>
                        <p className="text-[12px] text-nf-dim font-medium mt-0.5">n/{communityViewData.name}</p>
                        <p className="text-[12px] text-nf-dim leading-[1.8] mt-1.5 max-w-[520px]">{communityViewData.shortDesc || communityViewData.desc}</p>
                      </div>
                    </div>

                    {/* Stats - flat info rows */}
                    <div className="px-5 py-2.5 space-y-1">
                      <div className="flex items-center gap-5 text-[11px]">
                        <span className="text-nf-dim"><span className="font-medium text-nf-text text-[13px]">{communityThreadCount}</span> موضوع</span>
                        <span className="text-nf-dim"><span className="font-medium text-nf-text text-[13px]">{communityReplyCount.toLocaleString()}</span> رد</span>
                        <span className="text-nf-dim"><span className="font-medium text-nf-text text-[13px]">{new Set(allThreads.filter(t => t.community === communityViewData.name).map(t => t.authorUid)).size}</span> عضو</span>
                        <span className="text-nf-dim"><span className="font-medium text-nf-text text-[13px]">{allThreads.filter(t => t.community === communityViewData.name).reduce((s, t) => s + (t.views || 0), 0).toLocaleString()}</span> مشاهدات</span>
                      </div>
                      {communityViewData.founded && <p className="text-[10px] text-nf-dim flex items-center gap-1.5"><Calendar size={10} className="text-nf-accent" /> تأسس {communityViewData.founded}</p>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 px-1 mb-4">
                    <button onClick={() => { setSelectedCommunity(communityViewData.name); backToList(); }} className="flex-1 bg-nf-accent/15 hover:bg-nf-accent/25 text-nf-accent text-[12px] font-bold py-2 rounded-lg flex items-center justify-center transition-colors">تصفح المواضيع</button>
                    <button onClick={() => { navigateForum("new", { community: communityViewData.name }); setNewCommunity(communityViewData.name); }} className="flex-1 bg-nf-accent/15 hover:bg-nf-accent/25 text-nf-accent text-[12px] font-bold py-2 rounded-lg flex items-center justify-center transition-colors">موضوع جديد</button>
                    <button onClick={() => toggleFollow(communityViewData.name)} className={cn("px-3.5 py-2 rounded-lg text-[12px] font-bold transition-colors", followedCommunities.has(communityViewData.name) ? "bg-nf-accent/10 text-nf-accent" : "bg-nf-secondary text-nf-muted hover:bg-nf-accent/10 hover:text-nf-accent")}>{followedCommunities.has(communityViewData.name) ? "متابَع ✓" : "متابعة"}</button>
                    <button onClick={() => openShare(communityViewData.name, `n/${communityViewData.name}`)} className="px-3 py-2 rounded-lg bg-nf-secondary text-nf-muted hover:bg-nf-accent/10 hover:text-nf-accent text-[12px] font-bold transition-colors"><Share2 size={13} /></button>
                  </div>

                  {/* About section */}
                  <div className="bg-nf-card rounded-lg p-4 mb-4 border border-nf-border/20">
                    <h3 className="text-[13px] font-bold text-nf-text mb-3 flex items-center gap-2"><BookOpen size={13} className="text-nf-accent" /> عن {communityViewData.name}</h3>
                    <p className="text-[12px] text-nf-dim leading-[2] mb-4 whitespace-pre-line">{communityViewData.desc}</p>

                    {/* Rules */}
                    {communityViewData.rules && communityViewData.rules.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[11px] text-nf-dim mb-2 flex items-center gap-1.5"><Shield size={11} className="text-nf-accent" /> قوانين المجتمع</h4>
                        <ol className="space-y-1 mr-4">
                          {communityViewData.rules.map((rule, i) => (
                            <li key={i} className="text-[11px] text-nf-dim leading-[1.8] list-decimal">{rule}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Moderators */}
                    {communityViewData.mods && communityViewData.mods.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[11px] text-nf-dim mb-2 flex items-center gap-1.5"><Shield size={11} className="text-nf-accent" /> المشرفون</h4>
                        <div className="space-y-1">
                          {communityViewData.mods.map((mod, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[11px] text-nf-accent font-medium">u/{mod.name}</span>
                              <span className="text-[9px] text-nf-dim bg-nf-secondary px-1.5 py-0.5 rounded">{mod.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {communityViewData.tags && communityViewData.tags.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[11px] text-nf-dim mb-2 flex items-center gap-1.5"><Sparkles size={11} className="text-nf-accent" /> الوسوم</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {communityViewData.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-nf-accent/10 text-nf-accent text-[10px] font-medium">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bookmarks */}
                    {communityViewData.bookmarks && communityViewData.bookmarks.length > 0 && (
                      <div>
                        <h4 className="text-[11px] text-nf-dim mb-2 flex items-center gap-1.5"><Bookmark size={11} className="text-nf-accent" /> روابط مفيدة</h4>
                        <div className="space-y-1">
                          {communityViewData.bookmarks.map((bm, i) => (
                            <a key={i} href={bm.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] text-nf-muted hover:text-nf-accent transition-colors py-0.5"><ExternalLink size={10} /> {bm.label}</a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent threads - bigger, flat */}
                  {(() => {
                    const commThreads = allThreads.filter(t => t.community === communityViewData.name).slice(0, 6);
                    if (commThreads.length === 0) return (
                      <div className="text-center py-16">
                        <MessageCirclePlus size={32} className="mx-auto text-nf-border mb-3" />
                        <p className="text-[16px] font-bold text-nf-dim mb-1">لا توجد مواضيع بعد</p>
                        <p className="text-[13px] text-nf-dim mb-4">ابدأ أول نقاش في {communityViewData.name}</p>
                        <button onClick={() => { navigateForum("new", { community: communityViewData.name }); setNewCommunity(communityViewData.name); }} className="bg-nf-accent/15 hover:bg-nf-accent/25 text-nf-accent text-[13px] font-bold px-6 py-2.5 rounded-lg inline-flex items-center gap-2 transition-colors">أنشئ أول موضوع</button>
                      </div>
                    );
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[15px] font-bold text-nf-text flex items-center gap-2"><TrendingUp size={15} className="text-nf-accent" /> أحدث المواضيع</h3>
                          <button onClick={() => { setSelectedCommunity(communityViewData.name); backToList(); }} className="text-[12px] text-nf-accent font-bold hover:underline">عرض الكل</button>
                        </div>
                        <div className="space-y-2.5">
                          {commThreads.map(t => (
                            <a key={t.id} href={getForumUrl("thread", { threadId: t.id, community: t.community })} onClick={e => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); setSelectedCommunity(t.community); openThread(t.id); } }} className="block w-full bg-nf-card rounded-xl p-4 text-right hover:bg-[#2e2e30] transition-all group border border-nf-border/20">
                              <div className="flex items-start gap-3">
                                {/* Author photo */}
                                <div className="shrink-0 pt-0.5">
                                  {t.authorPhoto ? <img src={t.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-nf-secondary flex items-center justify-center text-[11px] text-nf-text font-bold">{(t.authorName || "م")[0]}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[15px] text-nf-text font-bold truncate group-hover:text-nf-accent transition-colors">{t.title}</p>
                                  <div className="flex items-center gap-2.5 mt-2 text-[11px] text-nf-dim">
                                    <span className="text-nf-accent font-medium">{t.authorName}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1"><MessageSquare size={10} /> {t.replyCount} رد</span>
                                    <span className="flex items-center gap-1"><Eye size={10} /> {t.views || 0}</span>
                                    <span>·</span>
                                    <span>{timeAgo(t.createdAt)}</span>
                                    {t.tags && t.tags.length > 0 && (
                                      <span className="text-nf-accent bg-nf-accent/10 px-1.5 py-0.5 rounded text-[9px] font-bold">{t.tags[0]}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* LIST VIEW */}
              {viewMode === "list" && (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-[11px] text-nf-dim font-medium mb-2">
                    <Home size={11} />
                    <span>المنتدى</span>
                    <ChevronRight size={10} />
                    <span className="text-nf-text font-bold">{selectedCommunity}</span>
                  </div>

                  {/* Flat hero header */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="text-[20px] font-bold text-nf-text cursor-pointer hover:text-nf-accent transition-colors" onClick={() => { const c = allCommunities.find(c => c.name === selectedCommunity); if (c) openCommunity(c); }}>{selectedCommunity}</h1>
                        <span className="text-[12px] text-nf-dim font-medium">{sortedThreads.length} موضوع · {new Set(allThreads.filter(t => t.community === selectedCommunity).map(t => t.authorUid)).size} عضو</span>
                      </div>
                      <button onClick={() => navigateForum("new")} className="border border-nf-border hover:border-nf-accent hover:text-nf-accent text-nf-text text-[12px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors bg-transparent"><Plus size={14} /> موضوع جديد</button>
                    </div>
                    {/* Forum Search Bar - powerful with dropdown */}
                    <div className="relative mb-3" ref={searchRef}>
                      <div className={cn("group flex items-center rounded-xl px-4 gap-2.5 transition-all border", showSearchDropdown ? "bg-nf-card border-nf-border rounded-b-none shadow-lg shadow-black/20" : "bg-nf-body border-nf-border hover:bg-nf-secondary/50 focus-within:bg-nf-card focus-within:border-nf-accent/30 focus-within:shadow-lg focus-within:shadow-black/20")}>
                        <Search size={16} className={cn("shrink-0 transition-colors", showSearchDropdown ? "text-nf-accent" : "text-nf-dim")} />
                        <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }} onFocus={() => setShowSearchDropdown(true)} onKeyDown={handleSearchKeyDown} placeholder="ابحث في المواضيع والردود والوسوم..." className="flex-1 bg-transparent border-none outline-none text-[14px] text-nf-text placeholder:text-nf-dim/70 py-2.5" />
                        {searching && <div className="w-4 h-4 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin shrink-0" />}
                        {searchQuery && <button onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="text-nf-dim hover:text-white transition-colors shrink-0 p-0.5"><X size={14} /></button>}
                        {!searchQuery && !showSearchDropdown && <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-nf-secondary/60 text-[10px] text-nf-dim font-mono border border-nf-border">⌘K</kbd>}
                      </div>

                      {/* Search Dropdown */}
                      <AnimatePresence>
                        {showSearchDropdown && (
                          <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.1 }} className="absolute mt-0 left-0 right-0 bg-nf-card border border-t-0 border-nf-border rounded-b-xl overflow-hidden shadow-xl shadow-black/30 z-50">
                            {/* Filter tabs */}
                            <div className="flex items-center border-b border-nf-border/50">
                              {[{id:"all",l:"الكل"},{id:"threads",l:"مواضيع"},{id:"replies",l:"ردود"},{id:"users",l:"أعضاء"},{id:"communities",l:"مجتمعات"}].map(f => (
                                <button key={f.id} onClick={() => setSearchFilter(f.id as any)} className={cn("px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors", searchFilter === f.id ? "text-nf-accent border-nf-accent" : "text-nf-dim border-transparent hover:text-nf-muted")}>{f.l}</button>
                              ))}
                            </div>
                            {/* Sort row */}
                            <div className="flex items-center gap-1 px-3 py-1 border-b border-nf-border/30 bg-nf-secondary/10">
                              <span className="text-[11px] text-nf-dim ml-1">ترتيب:</span>
                              {[{id:"relevance" as const,icon:Sparkles,l:"أهمية"},{id:"newest" as const,icon:Clock,l:"الأحدث"},{id:"top" as const,icon:Flame,l:"الأعلى"}].map(s => {
                                const Icon = s.icon;
                                return <button key={s.id} onClick={() => setSearchSort(s.id)} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all", searchSort === s.id ? "bg-nf-accent/10 text-nf-accent" : "text-nf-dim hover:text-nf-muted hover:bg-nf-secondary/40")}><Icon size={11} />{s.l}</button>;
                              })}
                            </div>

                            {/* Content */}
                            {!searchQuery.trim() ? (
                              <div className="py-1.5">
                                {searchHistory.length > 0 && (
                                  <div className="px-3 py-1.5">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[12px] font-bold text-nf-dim uppercase tracking-wider">أحدث البحوث</span>
                                      <button onClick={clearSearchHistory} className="text-[11px] text-nf-dim hover:text-nf-accent transition-colors flex items-center gap-1"><RotateCcw size={10} />مسح السجل</button>
                                    </div>
                                    {searchHistory.map((h, i) => (
                                      <button key={h} onClick={() => setSearchQuery(h)} className={cn("flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] transition-colors", selectedSearchIdx === i ? "bg-nf-secondary/50 text-white" : "text-nf-muted hover:bg-nf-secondary/40")}><Clock size={13} className="text-nf-dim shrink-0" /><span className="flex-1 text-right truncate">{h}</span></button>
                                    ))}
                                  </div>
                                )}
                                <div className="px-3 py-1.5 border-t border-nf-border/30">
                                  <span className="text-[12px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">الأكثر رواجاً</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {["Unity","Unreal","Godot","Blender","نقاش","سؤال"].map(tag => (
                                      <button key={tag} onClick={() => setSearchQuery(tag)} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-nf-secondary/40 text-[12px] text-nf-muted hover:text-nf-accent hover:bg-nf-accent/10 transition-all"><TrendingUp size={11} className="text-nf-accent" />{tag}</button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div ref={searchResultsRef} className="py-1 max-h-[320px] overflow-y-auto">
                                {/* Communities */}
                                {searchResults.filter(r => r._type === "community").length > 0 && (
                                  <><div className="px-3 pt-1.5 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">مجتمعات</span></div>
                                  {searchResults.filter(r => r._type === "community").map((r: any, idx: number) => {
                                    const globalIdx = searchResults.indexOf(r);
                                    return (
                                      <button key={r.id || r.name} onClick={() => handleSearchResultClick(r)} onMouseEnter={() => setSelectedSearchIdx(globalIdx)} className={cn("flex items-center gap-3 w-full px-3 py-2.5 transition-colors", selectedSearchIdx === globalIdx ? "bg-nf-secondary/50" : "hover:bg-nf-secondary/50")}>
                                        {r.img ? <img src={r.img} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-nf-border" /> : <div className="w-9 h-9 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0 border border-nf-border"><MessageSquare size={14} className="text-nf-accent" /></div>}
                                        <div className="flex-1 min-w-0 text-right"><p className="text-[13px] font-bold text-white">{r.name}</p><span className="text-[11px] text-nf-dim">{new Set(allThreads.filter(t => t.community === r.name).map(t => t.authorUid)).size} عضو</span></div>
                                      </button>
                                    );
                                  })}</>
                                )}
                                {/* Users */}
                                {searchResults.filter(r => r._type === "user").length > 0 && (
                                  <><div className="px-3 pt-2 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">أعضاء</span></div>
                                  {searchResults.filter(r => r._type === "user").map((r: any) => {
                                    const globalIdx = searchResults.indexOf(r);
                                    return (
                                      <button key={r.id} onClick={() => handleSearchResultClick(r)} onMouseEnter={() => setSelectedSearchIdx(globalIdx)} className={cn("flex items-center gap-3 w-full px-3 py-2.5 transition-colors", selectedSearchIdx === globalIdx ? "bg-nf-secondary/50" : "hover:bg-nf-secondary/50")}>
                                        {r.photo ? <img src={r.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-nf-border" /> : <div className="w-9 h-9 rounded-full bg-nf-accent/10 flex items-center justify-center text-sm font-bold text-nf-accent shrink-0 border border-nf-border">{(r.name || "م")[0]}</div>}
                                        <div className="flex-1 min-w-0 text-right"><p className="text-[13px] font-bold text-white">{r.name}</p><span className="text-[11px] text-nf-dim">عضو</span></div>
                                        <User size={14} className="text-nf-dim shrink-0" />
                                      </button>
                                    );
                                  })}</>
                                )}
                                {/* Threads */}
                                {searchResults.filter(r => r._type === "thread").length > 0 && (
                                  <><div className="px-3 pt-2 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">مواضيع</span></div>
                                  {searchResults.filter(r => r._type === "thread").map((r: any) => {
                                    const globalIdx = searchResults.indexOf(r);
                                    return (
                                      <button key={r.id} onClick={() => handleSearchResultClick(r)} onMouseEnter={() => setSelectedSearchIdx(globalIdx)} className={cn("flex items-start gap-3 w-full px-3 py-2.5 transition-colors", selectedSearchIdx === globalIdx ? "bg-nf-secondary/50" : "hover:bg-nf-secondary/50")}>
                                        <div className="w-9 h-9 rounded-lg bg-nf-secondary flex items-center justify-center shrink-0 border border-nf-border"><MessageCircle size={14} className="text-nf-dim" /></div>
                                        <div className="flex-1 min-w-0 text-right">
                                          <p className="text-[13px] font-bold text-white leading-snug">{r.title}</p>
                                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span className="text-[11px] text-nf-accent bg-nf-accent/10 px-2 py-0.5 rounded">{r.community}</span>
                                            <span className="text-[11px] text-nf-dim">{r.authorName}</span>
                                            <span className="text-[11px] text-nf-dim"><ArrowUp size={9} className="inline text-green-400" />{r.votes || 0}</span>
                                            <span className="text-[11px] text-nf-dim"><MessageSquare size={9} className="inline" />{r.replyCount}</span>
                                            {r.createdAt && <span className="text-[11px] text-nf-dim">{timeAgo(r.createdAt)}</span>}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}</>
                                )}
                                {/* Replies */}
                                {searchResults.filter(r => r._type === "reply").length > 0 && (
                                  <><div className="px-3 pt-2 pb-0.5"><span className="text-[11px] font-bold text-nf-dim uppercase tracking-wider">ردود</span></div>
                                  {searchResults.filter(r => r._type === "reply").slice(0, 3).map((r: any, idx: number) => {
                                    const globalIdx = searchResults.indexOf(r);
                                    return (
                                      <button key={r.id || idx} onClick={() => handleSearchResultClick(r)} onMouseEnter={() => setSelectedSearchIdx(globalIdx)} className={cn("flex items-center gap-3 w-full px-3 py-2.5 transition-colors", selectedSearchIdx === globalIdx ? "bg-nf-secondary/50" : "hover:bg-nf-secondary/50")}>
                                        {r.authorPhoto ? <img src={r.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-nf-muted flex items-center justify-center text-white text-[12px] font-bold shrink-0">{(r.authorName || "م")[0]}</div>}
                                        <div className="flex-1 min-w-0 text-right"><p className="text-[12px] text-nf-text leading-snug line-clamp-1">{r.text}</p><span className="text-[10px] text-nf-dim">{r.authorName}</span></div>
                                      </button>
                                    );
                                  })}</>
                                )}
                              </div>
                            ) : !searching ? (
                              <div className="p-6 text-center"><Search size={18} className="mx-auto text-nf-dim/30 mb-2" /><p className="text-[12px] text-nf-muted">لا توجد نتائج</p><p className="text-[10px] text-nf-dim mt-1">"{searchQuery}"</p></div>
                            ) : null}

                            {/* Footer */}
                            <div className="flex items-center justify-between px-4 py-2 border-t border-nf-border/30 bg-nf-secondary/20">
                              <div className="flex items-center gap-3 text-[11px] text-nf-dim">
                                <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[10px]">↵</kbd> فتح</span>
                                <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[10px]">↑↓</kbd> تنقل</span>
                                <span><kbd className="px-1.5 py-0.5 rounded bg-nf-secondary text-[10px]">esc</kbd> إغلاق</span>
                              </div>
                              <span className="text-[11px] text-nf-dim">{searchResults.length} نتيجة</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Filter chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {threadTypes.map(tt => { const TI = tt.icon; return (
                        <button key={tt.id} onClick={() => setSearchQuery(prev => prev ? `${prev} ${tt.label}` : tt.label)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors", searchQuery.includes(tt.label) ? "border-nf-accent text-nf-accent bg-nf-accent/5" : "border-nf-border text-nf-dim hover:text-nf-text hover:border-nf-accent/40 hover:bg-nf-secondary/30")}>
                          <TI size={11} />{tt.label}
                        </button>
                      ); })}
                    </div>
                  </div>

                  {/* Tabs + Dropdowns */}
                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    {[
                      { id: "latest" as const, l: "الأحدث", icon: Clock },
                      { id: "popular" as const, l: "الأكثر ردود", icon: MessageSquare },
                      { id: "views" as const, l: "المشاهدات", icon: Eye },
                      { id: "pinned" as const, l: "المثبّتة", icon: Pin },
                      { id: "unsolved" as const, l: "غير محلول", icon: AlertCircle },
                    ].map(s => { const SI = s.icon; return (
                      <button key={s.id} onClick={() => setSortMode(s.id)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all", sortMode === s.id ? "border-nf-accent text-nf-accent bg-nf-accent/5" : "border-nf-border text-nf-dim hover:text-nf-text hover:border-nf-accent/40 hover:bg-nf-secondary/30")}>
                        <SI size={12} />{s.l}
                      </button>
                    ); })}
                    {/* Combined Time + Sort dropdown */}
                    <div className="relative">
                      <button onClick={() => setSortDropdownOpen(!sortDropdownOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-nf-border text-nf-dim hover:text-nf-text hover:border-nf-accent/40 hover:bg-nf-secondary/30 transition-all">
                        <SlidersHorizontal size={12} />{timeFilter === "all" ? "الفترة" : timeFilter === "today" ? "اليوم" : timeFilter === "week" ? "هالأسبوع" : "هالشهر"} · {threadSort === "newest" ? "الأحدث" : "الأقدم"}<ChevronDown size={10} />
                      </button>
                      {sortDropdownOpen && (
                        <div onClick={e => e.stopPropagation()} className="absolute top-full mt-1 right-0 bg-nf-card border border-nf-border rounded-lg shadow-xl z-30 py-1.5 min-w-[160px]">
                          <div className="px-3 py-1 text-[9px] font-bold text-nf-dim uppercase tracking-wider">الفترة</div>
                          {[{id:"all" as const,l:"الكل"},{id:"today" as const,l:"اليوم"},{id:"week" as const,l:"هالأسبوع"},{id:"month" as const,l:"هالشهر"}].map(f => (
                            <button key={f.id} onClick={() => { setTimeFilter(f.id); setSortDropdownOpen(false); }} className={cn("w-full px-3 py-1.5 text-[11px] text-right transition-colors", timeFilter === f.id ? "text-nf-accent bg-nf-accent/5 font-bold" : "text-nf-dim hover:text-nf-text hover:bg-nf-secondary/40")}>{f.l}</button>
                          ))}
                          <div className="mx-2 my-1 h-px bg-nf-border/40" />
                          <div className="px-3 py-1 text-[9px] font-bold text-nf-dim uppercase tracking-wider">الترتيب</div>
                          <button onClick={() => { setThreadSort("newest"); setSortDropdownOpen(false); }} className={cn("w-full px-3 py-1.5 text-[11px] text-right transition-colors", threadSort === "newest" ? "text-nf-accent bg-nf-accent/5 font-bold" : "text-nf-dim hover:text-nf-text hover:bg-nf-secondary/40")}>الأحدث</button>
                          <button onClick={() => { setThreadSort("oldest"); setSortDropdownOpen(false); }} className={cn("w-full px-3 py-1.5 text-[11px] text-right transition-colors", threadSort === "oldest" ? "text-nf-accent bg-nf-accent/5 font-bold" : "text-nf-dim hover:text-nf-text hover:bg-nf-secondary/40")}>الأقدم</button>
                        </div>
                      )}
                    </div>
                    {/* Type filter dropdown */}
                    <div className="relative">
                      <button onClick={() => setTypeDropdownOpen(!typeDropdownOpen)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all", typeFilter !== "all" ? "border-nf-accent text-nf-accent bg-nf-accent/5" : "border-nf-border text-nf-dim hover:text-nf-text hover:border-nf-accent/40 hover:bg-nf-secondary/30")}>
                        <Filter size={12} />{typeFilter === "all" ? "النوع" : threadTypes.find(t => t.id === typeFilter)?.label || typeFilter}<ChevronDown size={10} />
                      </button>
                      {typeDropdownOpen && (
                        <div onClick={e => e.stopPropagation()} className="absolute top-full mt-1 right-0 bg-nf-card border border-nf-border rounded-lg shadow-xl z-30 py-1 min-w-[140px]">
                          <button onClick={() => { setTypeFilter("all"); setTypeDropdownOpen(false); }} className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-right transition-colors", typeFilter === "all" ? "text-nf-accent bg-nf-accent/5 font-bold" : "text-nf-dim hover:text-nf-text hover:bg-nf-secondary/40")}><Filter size={11} /> الكل</button>
                          {threadTypes.map(tt => { const TI = tt.icon; return (
                            <button key={tt.id} onClick={() => { setTypeFilter(tt.id); setTypeDropdownOpen(false); }} className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-right transition-colors", typeFilter === tt.id ? "text-nf-accent bg-nf-accent/5 font-bold" : "text-nf-dim hover:text-nf-text hover:bg-nf-secondary/40")}><TI size={11} /> {tt.label}</button>
                          ); })}
                        </div>
                      )}
                    </div>
                  </div>

                  {pinnedThreads.length > 0 && sortMode !== "popular" && (
                    <div className="mb-1">
                      <div className="flex items-center gap-2 px-3 py-1.5"><Pin size={10} className="text-nf-dim" /><span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">مثبّتة</span></div>
                      {pinnedThreads.map(thread => <ThreadRow key={thread.id} thread={thread} onOpen={() => openThread(thread.id)} saved={savedThreads.has(thread.id)} onSave={() => { const n = new Set(savedThreads); if (n.has(thread.id)) { n.delete(thread.id); showToast("تم إزالة الحفظ"); } else { n.add(thread.id); showToast("تم الحفظ ✓"); } setSavedThreads(n); }} userVotes={userVotes} onVote={handleVote} openProfile={openProfile} onShare={() => openShare(thread.id, thread.title)} isVisited={!!lastReadHistory[thread.id]} />)}
                    </div>
                  )}
                  {loading ? (
                    <div className="flex flex-col gap-3">
                      {[0,1,2,3,4,5].map(i => (
                        <div key={i} className="bg-nf-card rounded-xl p-4 animate-pulse">
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center gap-2 shrink-0 w-[48px]">
                              <div className="w-10 h-10 rounded-full bg-nf-secondary" />
                              <div className="w-5 h-5 rounded bg-nf-secondary" />
                              <div className="w-8 h-3 rounded bg-nf-secondary" />
                              <div className="w-5 h-5 rounded bg-nf-secondary" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2"><div className="w-14 h-3 rounded bg-nf-secondary" /><div className="w-[60%] h-5 rounded bg-nf-secondary" /></div>
                              <div className="w-full h-4 rounded bg-nf-secondary" />
                              <div className="w-[80%] h-4 rounded bg-nf-secondary" />
                              <div className="flex items-center gap-3"><div className="w-12 h-3 rounded bg-nf-secondary" /><div className="w-10 h-3 rounded bg-nf-secondary" /><div className="w-8 h-3 rounded bg-nf-secondary" /></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : regularThreads.length === 0 && pinnedThreads.length === 0 ? (
                    <div className="text-center py-20"><MessageCirclePlus size={28} className="mx-auto text-nf-border mb-3" /><p className="text-[15px] font-bold text-nf-dim mb-1">لا توجد مواضيع بعد</p><p className="text-[13px] text-nf-dim">ابدأ نقاشاً في {selectedCommunity}</p></div>
                  ) : (
                    (sortMode === "pinned" ? sortedThreads : regularThreads).map(thread => <ThreadRow key={thread.id} thread={thread} onOpen={() => openThread(thread.id)} href={getForumUrl("thread", { threadId: thread.id, community: thread.community })} saved={savedThreads.has(thread.id)} onSave={() => { const n = new Set(savedThreads); if (n.has(thread.id)) { n.delete(thread.id); showToast("تم إزالة الحفظ"); } else { n.add(thread.id); showToast("تم الحفظ ✓"); } setSavedThreads(n); }} userVotes={userVotes} onVote={handleVote} openProfile={openProfile} onShare={() => openShare(thread.id, thread.title)} isVisited={!!lastReadHistory[thread.id]} />)
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* RIGHT SIDEBAR - hidden in AI chat view */}
        {viewMode !== "ai" && (
        <aside className="hidden xl:block w-[280px] bg-nf-body border-l border-nf-border overflow-y-auto flex-shrink-0 sticky top-[56px] h-[calc(100vh-56px)] py-4 px-3 space-y-3">
          {/* Browse Communities - Card */}
          <div className="bg-nf-secondary/30 rounded-xl p-3.5 border border-nf-border/20">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles size={14} className="text-nf-accent" />
              <h3 className="text-[12px] font-semibold text-nf-muted">تصفح المجتمعات</h3>
            </div>
            <div className="space-y-0.5">
              {allCommunities.map(comm => (
                <button key={comm.name} onClick={() => openCommunity(comm)} className={cn("w-full flex items-center gap-2.5 p-2 rounded-lg text-right transition-all group", selectedCommunity === comm.name ? "bg-nf-secondary/60" : "hover:bg-nf-secondary/40")}>
                  {comm.img ? <img src={comm.img} alt="" className="w-7 h-7 rounded-md object-cover" /> : <div className="w-7 h-7 rounded-md bg-nf-accent/10 flex items-center justify-center text-[11px] text-nf-accent font-bold">{comm.name[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[11px] font-bold truncate transition-colors", selectedCommunity === comm.name ? "text-nf-accent" : "text-nf-muted group-hover:text-nf-text")}>{comm.name}</p>
                    <p className="text-[9px] text-nf-dim">{new Set(allThreads.filter(t => t.community === comm.name).map(t => t.authorUid)).size} عضو · {allThreads.filter(t => t.community === comm.name).length} موضوع</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* What's New - Card */}
          <div className="bg-nf-secondary/30 rounded-xl p-3.5 border border-nf-border/20">
            <div className="flex items-center gap-2 mb-2.5">
              <TrendingUp size={14} className="text-nf-accent" />
              <h3 className="text-[12px] font-semibold text-nf-muted">إيش الجديد؟</h3>
            </div>
            <div className="space-y-0.5">
              {(allThreads.length > 0 ? allThreads : sortedThreads).slice(0, 5).map((thread) => (
                <button key={thread.id} onClick={() => openThread(thread.id)} className="w-full text-right p-2 rounded-lg hover:bg-nf-secondary/40 transition-colors group">
                  <p className="text-[11px] text-nf-muted leading-relaxed group-hover:text-nf-accent transition-colors line-clamp-2">{thread.title}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-nf-dim">
                    <span className="text-nf-accent/70">{thread.community}</span>
                    <span>·</span>
                    <span>{thread.authorName}</span>
                    <span>·</span>
                    <span>{timeAgo(thread.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Members - Card */}
          <div className="bg-nf-secondary/30 rounded-xl p-3.5 border border-nf-border/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-nf-accent" />
                <h3 className="text-[12px] font-semibold text-nf-muted">أعضاء نشيطون</h3>
              </div>
              {totalMembers > 0 && <span className="text-[9px] text-nf-dim font-bold">{onlineUsers.length} متصل · {totalMembers} عضو</span>}
            </div>
            <div className="flex items-center -space-x-2 rtl:space-x-reverse">
              {onlineUsers.slice(0, 20).map((u) => (
                <button key={u.uid} onClick={() => openProfile(u.uid, u.name, u.photo)} className="group relative shrink-0" title={u.name}>
                  {u.photo ? (
                    <img src={u.photo} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-nf-card group-hover:border-nf-accent transition-all group-hover:scale-110 group-hover:z-10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-nf-secondary flex items-center justify-center text-[10px] text-nf-dim font-bold border-2 border-nf-card group-hover:border-nf-accent transition-all group-hover:scale-110 group-hover:z-10">{(u.name || "م")[0]}</div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-nf-card" />
                </button>
              ))}
              {onlineUsers.length > 20 && (
                <span className="shrink-0 w-8 h-8 rounded-full bg-nf-accent/20 flex items-center justify-center text-[10px] text-nf-accent font-bold border-2 border-nf-card">+{onlineUsers.length - 20}</span>
              )}
            </div>
          </div>

          {/* Followed Users - Card */}
          {followedUsers.size > 0 && (
          <div className="bg-nf-secondary/30 rounded-xl p-3.5 border border-nf-border/20">
            <div className="flex items-center gap-2 mb-2.5">
              <UserPlus size={14} className="text-nf-accent" />
              <h3 className="text-[12px] font-semibold text-nf-muted">متابَعون</h3>
              <span className="text-[9px] text-nf-dim font-bold">{followedUsers.size}</span>
            </div>
            <div className="space-y-0.5">
              {[...followedUsers].slice(0, 8).map(uid => {
                const onlineU = onlineUsers.find(u => u.uid === uid);
                const isOnline = !!onlineU;
                return (
                  <button key={uid} onClick={() => openProfile(uid, onlineU?.name || "مستخدم", onlineU?.photo)} className="w-full flex items-center gap-2 text-right p-1.5 rounded-lg hover:bg-nf-secondary/40 transition-colors group">
                    <div className="relative shrink-0">
                      {onlineU?.photo ? <img src={onlineU.photo} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] text-nf-dim font-bold">{(onlineU?.name || "م")[0]}</div>}
                      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-nf-card" />}
                    </div>
                    <span className="text-[11px] text-nf-dim group-hover:text-nf-accent transition-colors truncate">{onlineU?.name || "مستخدم"}</span>
                  </button>
                );
              })}
              {followedUsers.size > 8 && <span className="text-[10px] text-nf-dim px-1.5">+{followedUsers.size - 8} آخرين</span>}
            </div>
          </div>
          )}

          {/* Site Rules - Card */}
          <div className="bg-nf-secondary/30 rounded-xl p-3.5 border border-nf-border/20">
            <div className="flex items-center gap-2 mb-2.5">
              <Shield size={14} className="text-nf-accent" />
              <h3 className="text-[12px] font-semibold text-nf-muted">قوانين الموقع</h3>
            </div>
            <div className="space-y-1.5 text-[10px] text-nf-dim">
              <div className="flex gap-1.5">
                <span className="text-nf-accent font-bold">1</span>
                <span>احترام الجميع</span>
              </div>
              <div className="flex gap-1.5">
                <span className="text-nf-accent font-bold">2</span>
                <span>لا سبام أو إعلانات</span>
              </div>
              <div className="flex gap-1.5">
                <span className="text-nf-accent font-bold">3</span>
                <span>محتوى مناسب للجميع</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-1">
            <p className="text-[9px] text-nf-dim">© 2025 NorthFall</p>
          </div>
        </aside>
        )}
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-nf-accent text-white text-[13px] font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-nf-accent/20">
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {profileEditOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setProfileEditOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-nf-card rounded-xl p-6 w-[500px] max-w-[95vw] max-h-[85vh] overflow-y-auto border border-nf-border shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-nf-text">تعديل البروفايل</h2>
                <button onClick={() => setProfileEditOpen(false)} className="text-nf-dim hover:text-nf-text transition-colors"><X size={18} /></button>
              </div>

              {/* Banner preview */}
              <div className="relative h-[100px] rounded-lg overflow-hidden mb-4 border border-nf-border/30">
                <img src={editBannerUrl || "/assets/images/bannerunity.png"} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-nf-card/50 to-transparent" />
                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                  {user?.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-nf-card" />}
                  <span className="text-[12px] font-bold text-white drop-shadow">{user?.displayName}</span>
                </div>
              </div>

              {/* Banner URL */}
              <div className="mb-4">
                <label className="text-[12px] font-bold text-nf-text mb-1.5 block">رابط البانر</label>
                <input value={editBannerUrl} onChange={e => setEditBannerUrl(e.target.value)} placeholder="https://example.com/banner.png" className="w-full bg-nf-secondary rounded-lg px-4 py-2.5 text-[13px] text-nf-text outline-none focus:ring-1 focus:ring-nf-accent placeholder:text-nf-dim" />
              </div>

              {/* Bio */}
              <div className="mb-4">
                <label className="text-[12px] font-bold text-nf-text mb-1.5 block">النبذة</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="اكتب نبذة عنك..." className="w-full bg-nf-secondary rounded-lg px-4 py-3 text-[13px] text-nf-text outline-none leading-[1.8] focus:ring-1 focus:ring-nf-accent placeholder:text-nf-dim min-h-[80px]" />
              </div>

              {/* Social Links */}
              <div className="mb-5">
                <label className="text-[12px] font-bold text-nf-text mb-2 block">روابط التواصل</label>
                <div className="space-y-2">
                  {["twitter", "youtube", "github", "steam", "discord", "website"].map(key => {
                    const labels: Record<string, string> = { twitter: "X / Twitter", youtube: "YouTube", github: "GitHub", steam: "Steam", discord: "Discord", website: "موقع شخصي" };
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[11px] text-nf-dim font-bold w-[90px] text-left shrink-0">{labels[key]}</span>
                        <input value={editSocialLinks[key] || ""} onChange={e => setEditSocialLinks(prev => ({ ...prev, [key]: e.target.value }))} placeholder={`رابط ${labels[key]}`} className="flex-1 bg-nf-secondary rounded-lg px-3 py-2 text-[12px] text-nf-text outline-none focus:ring-1 focus:ring-nf-accent placeholder:text-nf-dim" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center gap-3">
                <button onClick={handleSaveProfile} className="flex-1 bg-nf-accent hover:bg-nf-accent/80 text-white text-[13px] font-bold py-2.5 rounded-lg transition-colors">حفظ التغييرات</button>
                <button onClick={() => setProfileEditOpen(false)} className="px-5 py-2.5 rounded-lg bg-nf-secondary text-nf-dim hover:text-nf-text text-[13px] font-bold transition-colors">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} postId={sharePostId} postTitle={sharePostTitle} />

      {/* Report Modal */}
      <ReportModal open={reportModalOpen} onClose={() => { setReportModalOpen(false); setReportReason(""); }} type={reportTarget === "thread" ? "post" : "comment"} targetId={reportTargetId} />

      {/* Table Editor Modal */}
      <AnimatePresence>
        {tableModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setTableModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-nf-card rounded-xl p-5 w-[540px] max-w-[95vw] max-h-[85vh] overflow-y-auto border border-nf-border shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-nf-text flex items-center gap-2"><BarChart3 size={15} className="text-nf-accent" /> إنشاء جدول</h3>
                <button onClick={() => setTableModalOpen(false)} className="text-nf-dim hover:text-nf-accent p-1"><X size={16} /></button>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 bg-nf-secondary rounded-lg px-2.5 py-1">
                  <span className="text-[11px] text-nf-dim font-bold">صفوف</span>
                  <button onClick={removeTableRow} className="w-7 h-7 rounded bg-nf-secondary text-nf-text flex items-center justify-center hover:bg-nf-accent/10 hover:text-nf-accent font-bold text-[14px]">−</button>
                  <span className="text-[14px] font-bold text-nf-text w-6 text-center">{tableRows}</span>
                  <button onClick={addTableRow} className="w-7 h-7 rounded bg-nf-secondary text-nf-text flex items-center justify-center hover:bg-nf-accent/10 hover:text-nf-accent font-bold text-[14px]">+</button>
                </div>
                <div className="flex items-center gap-1.5 bg-nf-secondary rounded-lg px-2.5 py-1">
                  <span className="text-[11px] text-nf-dim font-bold">أعمدة</span>
                  <button onClick={removeTableCol} className="w-7 h-7 rounded bg-nf-secondary text-nf-text flex items-center justify-center hover:bg-nf-accent/10 hover:text-nf-accent font-bold text-[14px]">−</button>
                  <span className="text-[14px] font-bold text-nf-text w-6 text-center">{tableCols}</span>
                  <button onClick={addTableCol} className="w-7 h-7 rounded bg-nf-secondary text-nf-text flex items-center justify-center hover:bg-nf-accent/10 hover:text-nf-accent font-bold text-[14px]">+</button>
                </div>
              </div>
              {/* Editable table */}
              {tableData.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-nf-border mb-4">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-nf-accent/5">
                        {tableData[0].map((cell, ci) => (
                          <th key={ci} className="border-b border-nf-border px-2 py-1.5">
                            <input type="text" value={cell} onChange={e => updateTableCell(0, ci, e.target.value)} className="w-full bg-transparent text-center font-bold text-nf-accent text-[12px] outline-none placeholder:text-nf-dim/50" placeholder={`عنوان ${ci + 1}`} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.slice(1).map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? "" : "bg-nf-secondary/20"}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="border-b border-nf-border/30 px-2 py-1.5">
                              <input type="text" value={cell} onChange={e => updateTableCell(ri + 1, ci, e.target.value)} className="w-full bg-transparent text-center text-nf-text text-[12px] outline-none placeholder:text-nf-dim/40" placeholder="بيان" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Markdown preview */}
              {tableData.length > 0 && (
                <div className="mb-4">
                  <span className="text-[10px] text-nf-dim font-bold mb-1 block">معاينة Markdown:</span>
                  <pre className="bg-nf-secondary rounded-lg px-3 py-2 text-[10px] text-nf-dim font-mono overflow-x-auto leading-relaxed">{`| ${tableData[0].join(" | ")} |\n| ${tableData[0].map(() => "---").join(" | ")} |\n${tableData.slice(1).map(row => `| ${row.join(" | ")} |`).join("\n")}`}</pre>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={insertTableFromModal} className="flex-1 bg-nf-accent hover:bg-nf-accent/80 text-white text-[13px] font-bold py-2.5 rounded-lg transition-colors">إدراج الجدول</button>
                <button onClick={() => setTableModalOpen(false)} className="flex-1 bg-nf-secondary text-nf-dim hover:text-nf-text text-[13px] font-bold py-2.5 rounded-lg transition-colors">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Settings Panel */}
      <AnimatePresence>
        {aiSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm" onClick={() => setAiSettingsOpen(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-[320px] max-w-[85vw] bg-nf-card border-l border-nf-border/10 flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-nf-border/8">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-nf-accent/10 flex items-center justify-center"><Sparkles size={13} className="text-nf-accent" /></div>
                  <span className="text-[13px] font-bold text-nf-text">الإعدادات</span>
                </div>
                <button onClick={() => setAiSettingsOpen(false)} className="p-1.5 rounded-lg text-nf-dim/50 hover:text-nf-text hover:bg-nf-secondary/40 transition-colors"><X size={14} /></button>
              </div>
              {/* Panel content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Provider */}
                <div>
                  <label className="text-[9px] text-nf-dim font-bold mb-2 block uppercase tracking-wider">المزود</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { id: "chatanywhere", label: "تجريبي" },
                      { id: "deepseek", label: "DeepSeek" },
                      { id: "groq", label: "Groq" },
                      { id: "mistral", label: "Mistral" },
                      { id: "gemini", label: "Gemini" },
                      { id: "chatgpt", label: "ChatGPT" },
                      { id: "claude", label: "Claude" },
                    ] as const).map(p => (
                      <button key={p.id} onClick={() => setAiProvider(p.id)} className={cn("py-2 rounded-lg text-[10px] font-bold transition-all border", aiProvider === p.id ? "bg-nf-accent/10 text-nf-accent border-nf-accent/20" : "bg-nf-secondary/30 text-nf-dim border-nf-border/10 hover:border-nf-border/25")}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* API Key */}
                <div>
                  <label className="text-[9px] text-nf-dim font-bold mb-1.5 block uppercase tracking-wider">مفتاح API</label>
                  <div className="relative">
                    <input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} placeholder={aiProvider === "chatgpt" ? "sk-proj-..." : aiProvider === "gemini" ? "AIza..." : aiProvider === "deepseek" ? "sk-..." : aiProvider === "groq" ? "gsk_..." : aiProvider === "mistral" ? "..." : "sk-ant-api03-..."} className="w-full bg-nf-secondary/30 rounded-lg px-3.5 py-2.5 text-[11px] text-nf-text placeholder:text-nf-dim/30 outline-none focus:ring-1 focus:ring-nf-accent/20 font-mono border border-nf-border/10 focus:border-nf-accent/20 transition-all" dir="ltr" />
                    <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-nf-dim/25" />
                  </div>
                  {/* Connection status */}
                  {aiApiKey && (
                    <div className="mt-2.5">
                      <button onClick={testAiConnection} disabled={aiConnected === "testing"} className={cn("w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all border", aiConnected === "ok" ? "bg-green-400/10 text-green-400 border-green-400/15" : aiConnected === "fail" ? "bg-red-400/10 text-red-400 border-red-400/15" : aiConnected === "testing" ? "bg-nf-accent/10 text-nf-accent border-nf-accent/15" : "bg-nf-secondary/30 text-nf-dim border-nf-border/10 hover:border-nf-accent/15")}>
                        {aiConnected === "testing" ? <><div className="w-2.5 h-2.5 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" /> اختبار...</> : aiConnected === "ok" ? <><Check size={11} /> متصل بنجاح</> : aiConnected === "fail" ? <><AlertCircle size={11} /> فشل الاتصال</> : <><Zap size={11} /> اختبار الاتصال</>}
                      </button>
                    </div>
                  )}
                  <p className="text-[9px] text-nf-dim/30 mt-1.5 leading-relaxed">{aiApiKey ? "الإرسال يعمل مباشرة عبر API بعد الحفظ" : "بدون مفتاح — سيتم نسخ الرسالة وفتح موقع AI"}</p>
                </div>
              </div>
              {/* Panel footer */}
              <div className="px-5 py-4 border-t border-nf-border/8 space-y-2">
                <button onClick={() => { localStorage.setItem("nf-ai-key", aiApiKey); localStorage.setItem("nf-ai-provider", aiProvider); setAiSettingsOpen(false); if (aiApiKey) testAiConnection(); }} className="w-full bg-nf-accent hover:bg-nf-accent/80 text-white text-[11px] font-bold py-2.5 rounded-lg transition-all">حفظ</button>
                {aiApiKey && <button onClick={() => { setAiApiKey(""); localStorage.removeItem("nf-ai-key"); setAiConnected("unknown"); }} className="w-full bg-nf-secondary/30 text-red-400 hover:bg-red-400/5 text-[11px] font-bold py-2 rounded-lg transition-colors border border-red-400/10">حذف المفتاح</button>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThreadRow({ thread, onOpen, saved, onSave, userVotes, onVote, openProfile, onShare, isVisited, href }: {
  thread: ForumThread; onOpen: () => void; saved: boolean; onSave: () => void;
  userVotes: Record<string, "up" | "down">; onVote: (id: string, dir: "up" | "down") => void;
  openProfile: (uid: string, name: string, photo?: string) => void; onShare: () => void; isVisited?: boolean; href?: string;
}) {
  const typeInfo = getTypeInfo(thread.type); const TypeIcon = typeInfo.icon;
  const excerpt = thread.body ? thread.body.replace(/[#*_`\[\]\(\)]/g, "").slice(0, 120) + (thread.body.length > 120 ? "…" : "") : "";
  const hasMedia = thread.body && extractUrls(thread.body).some(u => u.type === "youtube" || u.type === "streamable" || u.type === "image" || u.type === "twitch" || u.type === "vimeo");
  const userVote = userVotes[thread.id];
  const isNew = thread.createdAt && (Date.now() - new Date(thread.createdAt).getTime()) < 86400000 * 2;
  return (
    <a href={href || "#"} onClick={e => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); onOpen(); } }} className={cn("block bg-nf-card rounded-xl mb-2.5 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md border border-nf-border/20 hover:border-nf-accent/20", isVisited ? "opacity-80 hover:opacity-100" : "")}>
      <div className="flex p-4 gap-4">
        {/* Left: avatar + vote */}
        <div className="flex flex-col items-center gap-2 shrink-0 w-[48px]" onClick={e => e.stopPropagation()}>
          <button onClick={(e) => { e.stopPropagation(); openProfile(thread.authorUid, thread.authorName, thread.authorPhoto); }} className="cursor-pointer">
            {thread.authorPhoto ? <img src={thread.authorPhoto} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-nf-border/30" /> : <div className="w-10 h-10 rounded-full bg-nf-secondary flex items-center justify-center text-[14px] text-nf-text font-bold">{(thread.authorName || "م")[0]}</div>}
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => onVote(thread.id, "up")} className={cn("p-1 rounded hover:bg-nf-secondary/40 transition-colors", userVote === "up" ? "text-green-400" : "text-nf-dim")}><ThumbsUp size={14} /></button>
            <span className={cn("text-[13px] font-bold", (thread.votes || 0) > 0 ? "text-green-400" : (thread.votes || 0) < 0 ? "text-red-400" : "text-nf-dim")}>{thread.votes || 0}</span>
            <button onClick={() => onVote(thread.id, "down")} className={cn("p-1 rounded hover:bg-nf-secondary/40 transition-colors", userVote === "down" ? "text-red-400" : "text-nf-dim")}><ThumbsDown size={14} /></button>
          </div>
        </div>
        {/* Right: content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-[15px] font-bold truncate transition-colors leading-snug", isVisited ? "text-nf-dim" : "text-nf-text")}>{thread.title}</span>
                {isNew && <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-nf-accent/15 text-nf-accent">جديد</span>}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium">
                {thread.community && <span className="px-2 py-0.5 rounded-md bg-nf-accent/10 text-nf-accent font-bold text-[10px]">{thread.community}</span>}
                <span className="flex items-center gap-1 text-nf-dim"><TypeIcon size={10} /> {typeInfo.label}</span>
                {thread.tags?.slice(0, 3).map(tag => <span key={tag} className="px-2 py-0.5 rounded-md bg-nf-secondary text-[10px] text-nf-text font-bold">{tag}</span>)}
                {thread.pinned && <span className="flex items-center gap-1 text-nf-accent text-[10px]"><Pin size={9} /> مثبّت</span>}
                {thread.locked && <span className="flex items-center gap-1 text-nf-dim text-[10px]"><Lock size={9} /> مقفول</span>}
                {thread.solved && <span className="flex items-center gap-1 text-green-400 text-[10px]"><CheckCircle2 size={9} /> محلول</span>}
                {(thread.votes || 0) >= 5 && <span className="flex items-center gap-1 text-orange-400 text-[10px]"><TrendingUp size={9} /> رائج</span>}
                {hasMedia && <span className="flex items-center gap-1 text-nf-accent text-[10px]"><Play size={9} /> ميديا</span>}
              </div>
            </div>
          </div>
          {/* Excerpt */}
          {excerpt && <p className="text-[13px] text-nf-dim font-medium mb-3 line-clamp-2 leading-relaxed">{excerpt}</p>}
          {/* Bottom bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-nf-dim font-medium">
              <span onClick={e => { e.stopPropagation(); openProfile(thread.authorUid, thread.authorName, thread.authorPhoto); }} className="text-nf-text font-bold hover:text-nf-accent cursor-pointer inline-flex items-center gap-1">{thread.authorName}{(thread.authorUid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2") && <img src="/assets/favicon/verified.png" alt="موثّق" className="w-[14px] h-[14px] inline" />}</span>
              <span className="text-nf-dim">{timeAgo(thread.createdAt)}</span>
              <span className="flex items-center gap-1"><MessageSquare size={11} /> {thread.replyCount} رد</span>
              <span className="flex items-center gap-1"><Eye size={11} /> {thread.views || 0}</span>
              {thread.lastReplyBy && <span className="flex items-center gap-1 text-nf-dim"><ArrowRight size={10} /> آخر رد: <span className="text-nf-text font-bold">{thread.lastReplyBy}</span> {thread.lastReplyAt && timeAgo(thread.lastReplyAt)}</span>}
            </div>
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <button onClick={onSave} className={cn("p-1.5 rounded-lg hover:bg-nf-secondary/40 transition-colors", saved ? "text-nf-accent" : "text-nf-dim")}><Bookmark size={14} fill={saved ? "currentColor" : "none"} /></button>
              <button onClick={onShare} className="p-1.5 rounded-lg text-nf-dim hover:bg-nf-secondary/40 hover:text-nf-text transition-colors"><Share2 size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
