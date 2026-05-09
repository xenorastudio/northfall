"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { ArrowLeft, Zap, Loader2, Shield, Flame, Globe, StopCircle } from "lucide-react";

const OWNER_UID = "bn6vKOGvIeUdF91P0fzMEbFZfGr2";

const PING_ENDPOINTS = [
  { name: "Google", url: (u: string) => `https://www.google.com/ping?sitemap=${encodeURIComponent(u)}` },
  { name: "Bing", url: (u: string) => `https://www.bing.com/ping?sitemap=${encodeURIComponent(u)}` },
  { name: "Google Crawl", url: (u: string) => `https://www.google.com/webmasters/sitemaps/ping?sitemap=${encodeURIComponent(u)}` },
];

const SITE_PAGES = [
  "https://www.northfall.blog/",
  "https://www.northfall.blog/app",
  "https://www.northfall.blog/forum",
  "https://www.northfall.blog/community/Unity",
  "https://www.northfall.blog/community/Unreal",
  "https://www.northfall.blog/community/Godot",
  "https://www.northfall.blog/community/Blender",
];

export default function SeoToolsPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const isOwner = user?.uid === OWNER_UID;
  const [targetUrl, setTargetUrl] = useState("https://www.northfall.blog/");
  const [repeatCount, setRepeatCount] = useState(1000);
  const [speed, setSpeed] = useState<"fast" | "normal" | "slow">("fast");
  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState(0);
  const [errors, setErrors] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => {
      const next = [...prev, msg];
      if (next.length > 500) return next.slice(-300);
      return next;
    });
  }, []);

  const startBlast = async () => {
    if (running) return;
    setRunning(true);
    setSent(0);
    setErrors(0);
    setLogs([]);
    stopRef.current = false;

    const urls = targetUrl.trim() ? [targetUrl.trim()] : SITE_PAGES;
    const delay = speed === "fast" ? 50 : speed === "normal" ? 200 : 500;

    addLog(`🚀 بدء Blast: ${urls.length} رابط × ${repeatCount} مرة × ${PING_ENDPOINTS.length} محرك = ${urls.length * repeatCount * PING_ENDPOINTS.length} طلب`);

    for (let round = 0; round < repeatCount; round++) {
      if (stopRef.current) {
        addLog("⏹ تم الإيقاف");
        break;
      }

      for (const url of urls) {
        if (stopRef.current) break;

        for (const engine of PING_ENDPOINTS) {
          if (stopRef.current) break;

          try {
            await fetch(engine.url(url), { mode: "no-cors", cache: "no-store" });
            setSent(prev => prev + 1);
          } catch {
            setErrors(prev => prev + 1);
          }

          // Minimal delay between requests
          if (delay > 50) await new Promise(r => setTimeout(r, delay));
        }
      }

      // Log progress every 10 rounds
      if ((round + 1) % 10 === 0 || round === 0) {
        const total = (round + 1) * urls.length * PING_ENDPOINTS.length;
        addLog(`⚡ الدورة ${round + 1}/${repeatCount} — تم إرسال ${total} طلب`);
      }

      // Small delay between rounds to avoid overwhelming
      if (delay <= 50 && round % 5 === 4) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    addLog(`✅ انتهى! المُرسل: ${sent + errors} | النجاح: ${sent} | الأخطاء: ${errors}`);
    setRunning(false);
  };

  const stopBlast = () => {
    stopRef.current = true;
  };

  if (!isOwner) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield size={40} className="text-nf-dim mb-3" />
      <p className="text-sm font-semibold text-nf-muted">غير مصرح بالدخول</p>
      <button onClick={onBack} className="mt-3 px-4 py-1.5 rounded-lg border border-nf-border text-xs text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">العودة</button>
    </div>
  );

  const totalRequests = (targetUrl.trim() ? 1 : SITE_PAGES.length) * repeatCount * PING_ENDPOINTS.length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-nf-hover text-nf-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame size={18} className="text-orange-400" />
            أدوات الأداء
          </h1>
          <p className="text-[11px] text-nf-dim mt-0.5">إرسال الموقع لمحركات البحث — كرّر ملايين المرات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 text-center">
          <p className="text-[10px] text-nf-dim">تم الإرسال</p>
          <p className="text-lg font-bold text-green-400">{sent.toLocaleString()}</p>
        </div>
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 text-center">
          <p className="text-[10px] text-nf-dim">أخطاء</p>
          <p className="text-lg font-bold text-red-400">{errors.toLocaleString()}</p>
        </div>
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 text-center">
          <p className="text-[10px] text-nf-dim">إجمالي مطلوب</p>
          <p className="text-lg font-bold text-white">{running ? totalRequests.toLocaleString() : "—"}</p>
        </div>
      </div>

      {/* Config */}
      <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-4 mb-4 space-y-4">
        {/* URL Input */}
        <div>
          <label className="text-[11px] font-bold text-nf-dim mb-1.5 block">رابط الموقع</label>
          <input
            type="url"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            placeholder="https://www.northfall.blog/"
            className="w-full px-3 py-2 rounded-lg bg-nf-primary border border-nf-border-2 text-xs text-white placeholder-nf-dim focus:outline-none focus:border-nf-accent"
          />
          <p className="text-[9px] text-nf-dim mt-1">اتركه فارغ لإرسال كل صفحات الموقع ({SITE_PAGES.length} صفحات)</p>
        </div>

        {/* Repeat Count */}
        <div>
          <label className="text-[11px] font-bold text-nf-dim mb-1.5 block">عدد التكرار</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={100}
              max={1000000}
              step={100}
              value={repeatCount}
              onChange={e => setRepeatCount(Number(e.target.value))}
              className="flex-1 accent-orange-400"
            />
            <input
              type="number"
              value={repeatCount}
              onChange={e => setRepeatCount(Math.max(1, Number(e.target.value)))}
              className="w-24 px-2 py-1.5 rounded-lg bg-nf-primary border border-nf-border-2 text-xs text-white text-center focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[100, 1000, 10000, 100000, 1000000].map(n => (
              <button key={n} onClick={() => setRepeatCount(n)} className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${repeatCount === n ? "bg-orange-400/20 text-orange-400" : "bg-nf-primary text-nf-dim hover:text-white"}`}>
                {n >= 1000000 ? `${n / 1000000}M` : n >= 1000 ? `${n / 1000}K` : n}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="text-[11px] font-bold text-nf-dim mb-1.5 block">السرعة</label>
          <div className="flex gap-2">
            {[
              { id: "fast" as const, label: "⚡ سريع", desc: "50ms" },
              { id: "normal" as const, label: "🔄 عادي", desc: "200ms" },
              { id: "slow" as const, label: "🐢 بطيء", desc: "500ms" },
            ].map(s => (
              <button key={s.id} onClick={() => setSpeed(s.id)} className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${speed === s.id ? "bg-orange-400/20 text-orange-400 border border-orange-400/30" : "bg-nf-primary text-nf-dim border border-nf-border-2 hover:text-white"}`}>
                {s.label}
                <span className="block text-[8px] text-nf-dim">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Total estimate */}
        <div className="bg-nf-primary/60 rounded-lg p-3 flex items-center justify-between">
          <span className="text-[10px] text-nf-dim">إجمالي الطلبات المتوقعة</span>
          <span className="text-sm font-bold text-orange-400">{totalRequests.toLocaleString()}</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {!running ? (
            <button
              onClick={startBlast}
              className="flex-1 px-4 py-2.5 rounded-lg bg-orange-400/20 text-orange-400 text-sm font-bold hover:bg-orange-400/30 transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              تشغيل — إرسال {totalRequests.toLocaleString()} طلب
            </button>
          ) : (
            <button
              onClick={stopBlast}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-400/20 text-red-400 text-sm font-bold hover:bg-red-400/30 transition-colors flex items-center justify-center gap-2"
            >
              <StopCircle size={16} />
              إيقاف
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {running && (
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-nf-dim flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-orange-400" />
              جاري الإرسال...
            </span>
            <span className="text-[10px] text-nf-accent">{Math.round((sent / totalRequests) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-nf-primary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-orange-400 to-yellow-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (sent / totalRequests) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-nf-dim">السجل</span>
            <button onClick={() => setLogs([])} className="text-[9px] text-nf-dim hover:text-white">مسح</button>
          </div>
          <div className="bg-nf-primary/80 rounded-lg p-2 max-h-[200px] overflow-y-auto text-[9px] font-mono space-y-0.5">
            {logs.map((log, i) => (
              <p key={i} className={log.includes("✅") ? "text-green-400" : log.includes("⏹") ? "text-yellow-400" : log.includes("🚀") ? "text-orange-400" : "text-nf-dim"}>{log}</p>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Globe size={14} /> روابط مباشرة</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Google Search Console", url: "https://search.google.com/search-console?resource_id=https://www.northfall.blog/" },
            { label: "Bing Webmaster", url: "https://www.bing.com/webmasters?siteUrl=https://www.northfall.blog/" },
            { label: "PageSpeed Insights", url: "https://pagespeed.web.dev/analysis?url=https://www.northfall.blog/" },
            { label: "Rich Results Test", url: "https://search.google.com/test/rich-results?url=https://www.northfall.blog/" },
          ].map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-nf-primary/60 text-[10px] text-nf-muted hover:text-white hover:bg-nf-hover transition-colors text-center">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
