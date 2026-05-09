"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { ArrowLeft, Zap, Loader2, Shield, Globe, StopCircle, Search, ExternalLink, RotateCw, Timer, Activity } from "lucide-react";

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

const QUICK_LINKS = [
  { label: "Google Search Console", url: "https://search.google.com/search-console?resource_id=https://www.northfall.blog/" },
  { label: "Bing Webmaster", url: "https://www.bing.com/webmasters?siteUrl=https://www.northfall.blog/" },
  { label: "PageSpeed Insights", url: "https://pagespeed.web.dev/analysis?url=https://www.northfall.blog/" },
  { label: "Rich Results Test", url: "https://search.google.com/test/rich-results?url=https://www.northfall.blog/" },
  { label: "Schema Validator", url: "https://validator.schema.org/#url=https://www.northfall.blog" },
  { label: "GTmetrix", url: "https://gtmetrix.com/?url=https://www.northfall.blog/" },
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
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [tab, setTab] = useState<"blast" | "links">("blast");
  const stopRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    setElapsed(0);
    setLogs([]);
    stopRef.current = false;

    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

    const urls = targetUrl.trim() ? [targetUrl.trim()] : SITE_PAGES;
    const delay = speed === "fast" ? 50 : speed === "normal" ? 200 : 500;

    addLog(`بدء Blast: ${urls.length} رابط x ${repeatCount} مرة x ${PING_ENDPOINTS.length} محرك = ${(urls.length * repeatCount * PING_ENDPOINTS.length).toLocaleString()} طلب`);

    for (let round = 0; round < repeatCount; round++) {
      if (stopRef.current) {
        addLog("تم الإيقاف");
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

          if (delay > 50) await new Promise(r => setTimeout(r, delay));
        }
      }

      if ((round + 1) % 10 === 0 || round === 0) {
        const total = (round + 1) * urls.length * PING_ENDPOINTS.length;
        addLog(`الدورة ${round + 1}/${repeatCount} -- تم ${total.toLocaleString()} طلب`);
      }

      if (delay <= 50 && round % 5 === 4) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    addLog(`انتهى -- المرسل: ${(sent + errors).toLocaleString()} | النجاح: ${sent.toLocaleString()} | الاخطاء: ${errors.toLocaleString()}`);
    setRunning(false);
  };

  const stopBlast = () => {
    stopRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!isOwner) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield size={40} className="text-nf-dim mb-3" />
      <p className="text-sm font-semibold text-nf-muted">غير مصرح بالدخول</p>
      <button onClick={onBack} className="mt-3 px-4 py-1.5 rounded-lg border border-nf-border text-xs text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">العودة</button>
    </div>
  );

  const totalRequests = (targetUrl.trim() ? 1 : SITE_PAGES.length) * repeatCount * PING_ENDPOINTS.length;
  const progress = totalRequests > 0 ? (sent / totalRequests) * 100 : 0;
  const ratePerSec = elapsed > 0 ? Math.round(sent / elapsed) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-nf-hover text-nf-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-nf-accent" />
            ادوات الاداء
          </h1>
          <p className="text-[11px] text-nf-dim mt-0.5">ارسال الموقع لمحركات البحث -- كرر ملايين المرات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-nf-border mb-4">
        <button onClick={() => setTab("blast")} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-colors ${tab === "blast" ? "border-nf-accent text-nf-accent" : "border-transparent text-nf-dim hover:text-white"}`}>
          <Zap size={13} />
          Blast
        </button>
        <button onClick={() => setTab("links")} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-colors ${tab === "links" ? "border-nf-accent text-nf-accent" : "border-transparent text-nf-dim hover:text-white"}`}>
          <Globe size={13} />
          روابط
        </button>
      </div>

      {tab === "blast" && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="px-3 py-2 text-center">
              <p className="text-[9px] text-nf-dim uppercase tracking-wider">تم الارسال</p>
              <p className="text-base font-bold text-nf-accent">{sent.toLocaleString()}</p>
            </div>
            <div className="px-3 py-2 text-center">
              <p className="text-[9px] text-nf-dim uppercase tracking-wider">اخطاء</p>
              <p className="text-base font-bold text-red-400">{errors.toLocaleString()}</p>
            </div>
            <div className="px-3 py-2 text-center">
              <p className="text-[9px] text-nf-dim uppercase tracking-wider">السرعة</p>
              <p className="text-base font-bold text-white">{ratePerSec}/s</p>
            </div>
            <div className="px-3 py-2 text-center">
              <p className="text-[9px] text-nf-dim uppercase tracking-wider">الوقت</p>
              <p className="text-base font-bold text-white">{formatTime(elapsed)}</p>
            </div>
          </div>

          {/* Progress */}
          {running && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-nf-dim flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin text-nf-accent" />
                  جاري الارسال...
                </span>
                <span className="text-[10px] text-nf-accent font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-nf-secondary overflow-hidden">
                <div className="h-full rounded-full bg-nf-accent transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            </div>
          )}

          {/* Config */}
          <div className="space-y-4 mb-4">
            {/* URL */}
            <div>
              <label className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">رابط الموقع</label>
              <input
                type="url"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://www.northfall.blog/"
                className="w-full px-3 py-2 rounded-lg bg-nf-secondary border border-nf-border text-xs text-white placeholder-nf-dim focus:outline-none focus:border-nf-accent transition-colors"
              />
              <p className="text-[9px] text-nf-dim mt-1">اتركه فارغ لارسال كل صفحات الموقع ({SITE_PAGES.length} صفحات)</p>
            </div>

            {/* Repeat */}
            <div>
              <label className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">عدد التكرار</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={100}
                  max={1000000}
                  step={100}
                  value={repeatCount}
                  onChange={e => setRepeatCount(Number(e.target.value))}
                  className="flex-1 accent-nf-accent"
                />
                <input
                  type="number"
                  value={repeatCount}
                  onChange={e => setRepeatCount(Math.max(1, Number(e.target.value)))}
                  className="w-24 px-2 py-1.5 rounded-lg bg-nf-secondary border border-nf-border text-xs text-white text-center focus:outline-none focus:border-nf-accent transition-colors"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[100, 1000, 10000, 100000, 1000000].map(n => (
                  <button key={n} onClick={() => setRepeatCount(n)} className={`px-2.5 py-1 rounded text-[9px] font-bold transition-colors ${repeatCount === n ? "bg-nf-accent/15 text-nf-accent" : "bg-nf-secondary text-nf-dim hover:text-white"}`}>
                    {n >= 1000000 ? `${n / 1000000}M` : n >= 1000 ? `${n / 1000}K` : n}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div>
              <label className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">السرعة</label>
              <div className="flex gap-1.5">
                {[
                  { id: "fast" as const, label: "سريع", desc: "50ms" },
                  { id: "normal" as const, label: "عادي", desc: "200ms" },
                  { id: "slow" as const, label: "بطيء", desc: "500ms" },
                ].map(s => (
                  <button key={s.id} onClick={() => setSpeed(s.id)} className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${speed === s.id ? "bg-nf-accent/15 text-nf-accent border border-nf-accent/20" : "bg-nf-secondary text-nf-dim border border-nf-border hover:text-white"}`}>
                    {s.label}
                    <span className="block text-[8px] text-nf-dim mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total + Buttons */}
            <div className="flex items-center justify-between py-2 border-t border-nf-border">
              <div>
                <p className="text-[9px] text-nf-dim uppercase tracking-wider">اجمالي الطلبات</p>
                <p className="text-sm font-bold text-white">{totalRequests.toLocaleString()}</p>
              </div>
              {!running ? (
                <button
                  onClick={startBlast}
                  className="px-5 py-2 rounded-lg bg-nf-accent/15 text-nf-accent text-xs font-bold hover:bg-nf-accent/25 transition-colors flex items-center gap-2"
                >
                  <Zap size={14} />
                  تشغيل
                </button>
              ) : (
                <button
                  onClick={stopBlast}
                  className="px-5 py-2 rounded-lg bg-red-400/15 text-red-400 text-xs font-bold hover:bg-red-400/25 transition-colors flex items-center gap-2"
                >
                  <StopCircle size={14} />
                  ايقاف
                </button>
              )}
            </div>
          </div>

          {/* Log */}
          {logs.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">السجل</span>
                <button onClick={() => setLogs([])} className="text-[9px] text-nf-dim hover:text-white transition-colors">مسح</button>
              </div>
              <div className="bg-nf-secondary rounded-lg p-2 max-h-[180px] overflow-y-auto text-[9px] font-mono leading-relaxed">
                {logs.map((log, i) => (
                  <p key={i} className={log.startsWith("انتهى") ? "text-green-400" : log.startsWith("تم الايقاف") ? "text-yellow-400" : "text-nf-dim"}>{log}</p>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* Pages list */}
          <div>
            <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-2">الصفحات المرسلة</p>
            <div className="space-y-0.5">
              {SITE_PAGES.map(page => (
                <div key={page} className="flex items-center justify-between px-3 py-1.5 text-[10px]">
                  <span className="text-nf-muted">{page.replace("https://www.northfall.blog", "")}</span>
                  <span className="text-nf-dim font-mono">{page}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "links" && (
        <div className="space-y-1">
          {QUICK_LINKS.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-nf-hover transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink size={13} className="text-nf-dim group-hover:text-nf-accent transition-colors" />
                <span className="text-xs text-nf-muted group-hover:text-white transition-colors">{link.label}</span>
              </div>
              <span className="text-[9px] text-nf-dim font-mono">{new URL(link.url).hostname}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
