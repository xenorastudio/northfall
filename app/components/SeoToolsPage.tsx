"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { ArrowLeft, Zap, Loader2, Shield, Globe, StopCircle, ExternalLink, RotateCw, Activity, CheckCircle2, XCircle, Clock, BarChart3, Link2, AlertTriangle } from "lucide-react";

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
  { label: "Google Search Console", url: "https://search.google.com/search-console?resource_id=https://www.northfall.blog/", icon: "G" },
  { label: "Bing Webmaster Tools", url: "https://www.bing.com/webmasters?siteUrl=https://www.northfall.blog/", icon: "B" },
  { label: "PageSpeed Insights", url: "https://pagespeed.web.dev/analysis?url=https://www.northfall.blog/", icon: "P" },
  { label: "Rich Results Test", url: "https://search.google.com/test/rich-results?url=https://www.northfall.blog/", icon: "R" },
  { label: "Schema Validator", url: "https://validator.schema.org/#url=https://www.northfall.blog", icon: "S" },
  { label: "GTmetrix", url: "https://gtmetrix.com/?url=https://www.northfall.blog/", icon: "G" },
  { label: "Lighthouse Report", url: "https://developer.chrome.com/docs/lighthouse/overview/", icon: "L" },
  { label: "Robots.txt Tester", url: "https://search.google.com/search-console/robots-testing-tool?resource_id=https://www.northfall.blog/", icon: "R" },
];

type BlastStatus = "idle" | "running" | "paused" | "done";

export default function SeoToolsPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const isOwner = user?.uid === OWNER_UID;
  const [targetUrl, setTargetUrl] = useState("https://www.northfall.blog/");
  const [repeatCount, setRepeatCount] = useState(1000);
  const [speed, setSpeed] = useState<"fast" | "normal" | "slow">("fast");
  const [status, setStatus] = useState<BlastStatus>("idle");
  const [sent, setSent] = useState(0);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [tab, setTab] = useState<"blast" | "links" | "pages">("blast");
  const [useAllPages, setUseAllPages] = useState(true);
  const stopRef = useRef(false);
  const sentRef = useRef(0);
  const errorsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const blastStartTimeRef = useRef(0);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => {
      const next = [...prev, `[${ts}] ${msg}`];
      if (next.length > 500) return next.slice(-300);
      return next;
    });
  }, []);

  const startBlast = async () => {
    if (status === "running") return;
    setStatus("running");
    setSent(0);
    setErrors(0);
    sentRef.current = 0;
    errorsRef.current = 0;
    setElapsed(0);
    setLogs([]);
    stopRef.current = false;
    blastStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

    const urls = useAllPages ? SITE_PAGES : (targetUrl.trim() ? [targetUrl.trim()] : SITE_PAGES);
    const delay = speed === "fast" ? 50 : speed === "normal" ? 200 : 500;
    const total = urls.length * repeatCount * PING_ENDPOINTS.length;

    addLog(`بدء Blast: ${urls.length} رابط x ${repeatCount.toLocaleString()} تكرار x ${PING_ENDPOINTS.length} محرك = ${total.toLocaleString()} طلب`);
    addLog(`السرعة: ${delay}ms | الوضع: ${speed}`);

    for (let round = 0; round < repeatCount; round++) {
      if (stopRef.current) {
        addLog("تم الايقاف يدويا");
        break;
      }

      for (const url of urls) {
        if (stopRef.current) break;

        for (const engine of PING_ENDPOINTS) {
          if (stopRef.current) break;

          try {
            await fetch(engine.url(url), { mode: "no-cors", cache: "no-store" });
            sentRef.current++;
            setSent(sentRef.current);
          } catch {
            errorsRef.current++;
            setErrors(errorsRef.current);
          }

          if (delay > 50) await new Promise(r => setTimeout(r, delay));
        }
      }

      const currentTotal = (round + 1) * urls.length * PING_ENDPOINTS.length;
      const pct = Math.round(((round + 1) / repeatCount) * 100);

      if ((round + 1) % 10 === 0 || round === 0 || round === repeatCount - 1) {
        addLog(`الدورة ${round + 1}/${repeatCount} (${pct}%) -- تم ${currentTotal.toLocaleString()}/${total.toLocaleString()}`);
      }

      // Yield to UI thread in fast mode
      if (delay <= 50 && round % 3 === 0) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    const finalSent = sentRef.current;
    const finalErrors = errorsRef.current;
    const duration = ((Date.now() - blastStartTimeRef.current) / 1000).toFixed(1);
    const avgRate = parseFloat(duration) > 0 ? Math.round((finalSent + finalErrors) / parseFloat(duration)) : 0;
    addLog(`انتهى -- النجاح: ${finalSent.toLocaleString()} | الاخطاء: ${finalErrors.toLocaleString()} | المدة: ${duration}s | المعدل: ${avgRate}/s`);
    setStatus("done");
  };

  const stopBlast = () => {
    stopRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("done");
  };

  const resetBlast = () => {
    setSent(0);
    setErrors(0);
    setElapsed(0);
    setLogs([]);
    setStatus("idle");
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  if (!isOwner) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield size={40} className="text-nf-dim mb-3" />
      <p className="text-sm font-semibold text-nf-muted">غير مصرح بالدخول</p>
      <button onClick={onBack} className="mt-3 px-4 py-1.5 rounded-lg border border-nf-border text-xs text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">العودة</button>
    </div>
  );

  const urls = useAllPages ? SITE_PAGES : (targetUrl.trim() ? [targetUrl.trim()] : SITE_PAGES);
  const totalRequests = urls.length * repeatCount * PING_ENDPOINTS.length;
  const progress = totalRequests > 0 ? (sent / totalRequests) * 100 : 0;
  const ratePerSec = elapsed > 0 ? Math.round(sent / elapsed) : 0;
  const errorRate = (sent + errors) > 0 ? ((errors / (sent + errors)) * 100).toFixed(1) : "0";
  const eta = ratePerSec > 0 ? Math.round((totalRequests - sent) / ratePerSec) : 0;
  const running = status === "running";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-nf-hover text-nf-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-nf-accent" />
            ادوات SEO
          </h1>
          <p className="text-[11px] text-nf-dim mt-0.5">ارسال الموقع لمحركات البحث بشكل متكرر</p>
        </div>
        {running && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-nf-accent/10 text-nf-accent text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-nf-accent animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-nf-border mb-5">
        {[
          { id: "blast" as const, label: "Blast", icon: Zap },
          { id: "links" as const, label: "روابط", icon: Globe },
          { id: "pages" as const, label: "الصفحات", icon: Link2 },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${tab === t.id ? "border-nf-accent text-nf-accent" : "border-transparent text-nf-dim hover:text-white"}`}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "blast" && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="px-3 py-2.5 rounded-lg bg-nf-secondary/50 border border-nf-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={11} className="text-green-400" />
                <span className="text-[9px] text-nf-dim uppercase tracking-wider">مرسل</span>
              </div>
              <p className="text-lg font-bold text-green-400">{formatNumber(sent)}</p>
              <p className="text-[8px] text-nf-dim">{sent.toLocaleString()}</p>
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-nf-secondary/50 border border-nf-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle size={11} className="text-red-400" />
                <span className="text-[9px] text-nf-dim uppercase tracking-wider">اخطاء</span>
              </div>
              <p className="text-lg font-bold text-red-400">{formatNumber(errors)}</p>
              <p className="text-[8px] text-nf-dim">{errorRate}%</p>
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-nf-secondary/50 border border-nf-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 size={11} className="text-nf-accent" />
                <span className="text-[9px] text-nf-dim uppercase tracking-wider">السرعة</span>
              </div>
              <p className="text-lg font-bold text-nf-accent">{ratePerSec}</p>
              <p className="text-[8px] text-nf-dim">طلب/ثانية</p>
            </div>
          </div>

          {/* Time + ETA Row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nf-secondary/50 border border-nf-border/50">
              <Clock size={12} className="text-nf-dim" />
              <div>
                <p className="text-[9px] text-nf-dim">الوقت المنقضي</p>
                <p className="text-sm font-bold text-white">{formatTime(elapsed)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nf-secondary/50 border border-nf-border/50">
              <AlertTriangle size={12} className="text-nf-dim" />
              <div>
                <p className="text-[9px] text-nf-dim">الوقت المتبقي</p>
                <p className="text-sm font-bold text-white">{running ? formatTime(eta) : "--:--"}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {(running || status === "done") && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-nf-dim flex items-center gap-1.5">
                  {running && <Loader2 size={11} className="animate-spin text-nf-accent" />}
                  {running ? "جاري الارسال..." : status === "done" ? "اكتمل" : ""}
                </span>
                <span className="text-[10px] text-nf-accent font-bold">{Math.round(progress)}% -- {sent.toLocaleString()} / {totalRequests.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-nf-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${status === "done" ? "bg-green-400" : "bg-nf-accent"}`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Config */}
          <div className="space-y-4 mb-4">
            {/* URL Mode */}
            <div>
              <label className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">الهدف</label>
              <div className="flex gap-1.5 mb-2">
                <button
                  onClick={() => setUseAllPages(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${useAllPages ? "bg-nf-accent/15 text-nf-accent border border-nf-accent/20" : "bg-nf-secondary text-nf-dim border border-nf-border hover:text-white"}`}
                >
                  كل الصفحات ({SITE_PAGES.length})
                </button>
                <button
                  onClick={() => setUseAllPages(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${!useAllPages ? "bg-nf-accent/15 text-nf-accent border border-nf-accent/20" : "bg-nf-secondary text-nf-dim border border-nf-border hover:text-white"}`}
                >
                  رابط محدد
                </button>
              </div>
              {!useAllPages && (
                <input
                  type="url"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://www.northfall.blog/"
                  className="w-full px-3 py-2 rounded-lg bg-nf-secondary border border-nf-border text-xs text-white placeholder-nf-dim focus:outline-none focus:border-nf-accent transition-colors"
                  disabled={running}
                />
              )}
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
                  disabled={running}
                />
                <input
                  type="number"
                  value={repeatCount}
                  onChange={e => setRepeatCount(Math.max(1, Number(e.target.value)))}
                  className="w-24 px-2 py-1.5 rounded-lg bg-nf-secondary border border-nf-border text-xs text-white text-center focus:outline-none focus:border-nf-accent transition-colors"
                  disabled={running}
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[100, 1000, 10000, 100000, 1000000].map(n => (
                  <button key={n} onClick={() => setRepeatCount(n)} disabled={running} className={`px-2.5 py-1 rounded text-[9px] font-bold transition-colors disabled:opacity-40 ${repeatCount === n ? "bg-nf-accent/15 text-nf-accent" : "bg-nf-secondary text-nf-dim hover:text-white"}`}>
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
                  { id: "fast" as const, label: "سريع", desc: "50ms", detail: "~20/s" },
                  { id: "normal" as const, label: "عادي", desc: "200ms", detail: "~5/s" },
                  { id: "slow" as const, label: "بطيء", desc: "500ms", detail: "~2/s" },
                ].map(s => (
                  <button key={s.id} onClick={() => setSpeed(s.id)} disabled={running} className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-40 ${speed === s.id ? "bg-nf-accent/15 text-nf-accent border border-nf-accent/20" : "bg-nf-secondary text-nf-dim border border-nf-border hover:text-white"}`}>
                    {s.label}
                    <span className="block text-[8px] text-nf-dim mt-0.5">{s.desc} ({s.detail})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Engines Info */}
            <div>
              <label className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-1.5 block">محركات البحث</label>
              <div className="flex gap-1.5">
                {PING_ENDPOINTS.map(e => (
                  <div key={e.name} className="flex-1 px-3 py-2 rounded-lg bg-nf-secondary/50 border border-nf-border/50 text-center">
                    <p className="text-[10px] font-bold text-nf-muted">{e.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total + Buttons */}
            <div className="flex items-center justify-between py-3 border-t border-nf-border">
              <div>
                <p className="text-[9px] text-nf-dim uppercase tracking-wider">اجمالي الطلبات</p>
                <p className="text-base font-bold text-white">{totalRequests.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {status === "idle" && (
                  <button
                    onClick={startBlast}
                    className="px-5 py-2.5 rounded-lg bg-nf-accent/15 text-nf-accent text-xs font-bold hover:bg-nf-accent/25 transition-colors flex items-center gap-2"
                  >
                    <Zap size={14} />
                    تشغيل
                  </button>
                )}
                {running && (
                  <button
                    onClick={stopBlast}
                    className="px-5 py-2.5 rounded-lg bg-red-400/15 text-red-400 text-xs font-bold hover:bg-red-400/25 transition-colors flex items-center gap-2"
                  >
                    <StopCircle size={14} />
                    ايقاف
                  </button>
                )}
                {status === "done" && (
                  <>
                    <button
                      onClick={resetBlast}
                      className="px-4 py-2.5 rounded-lg bg-nf-secondary text-nf-dim text-xs font-bold hover:text-white transition-colors flex items-center gap-2"
                    >
                      <RotateCw size={13} />
                      اعادة
                    </button>
                    <button
                      onClick={startBlast}
                      className="px-5 py-2.5 rounded-lg bg-nf-accent/15 text-nf-accent text-xs font-bold hover:bg-nf-accent/25 transition-colors flex items-center gap-2"
                    >
                      <Zap size={14} />
                      تشغيل مجددا
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Log */}
          {logs.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">السجل</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-nf-dim">{logs.length} سطر</span>
                  <button onClick={() => setLogs([])} className="text-[9px] text-nf-dim hover:text-white transition-colors">مسح</button>
                </div>
              </div>
              <div className="bg-nf-secondary rounded-lg p-2.5 max-h-[200px] overflow-y-auto text-[9px] font-mono leading-relaxed border border-nf-border/30">
                {logs.map((log, i) => (
                  <p key={i} className={
                    log.includes("انتهى") ? "text-green-400 font-bold" :
                    log.includes("ايقاف") ? "text-yellow-400" :
                    log.includes("اخطاء") || log.includes("خطأ") ? "text-red-400" :
                    "text-nf-dim"
                  }>{log}</p>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
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
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-nf-hover transition-colors group"
            >
              <span className="w-7 h-7 rounded-lg bg-nf-secondary border border-nf-border/50 flex items-center justify-center text-[10px] font-bold text-nf-muted group-hover:text-nf-accent group-hover:border-nf-accent/30 transition-colors">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-nf-muted group-hover:text-white transition-colors truncate">{link.label}</p>
                <p className="text-[9px] text-nf-dim font-mono truncate">{new URL(link.url).hostname}</p>
              </div>
              <ExternalLink size={13} className="text-nf-dim group-hover:text-nf-accent transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}

      {tab === "pages" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider">صفحات الموقع</p>
            <span className="text-[9px] text-nf-dim">{SITE_PAGES.length} صفحة</span>
          </div>
          <div className="space-y-0.5">
            {SITE_PAGES.map((page, i) => {
              const path = page.replace("https://www.northfall.blog", "");
              return (
                <div key={page} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-nf-hover/50 transition-colors">
                  <span className="w-5 h-5 rounded bg-nf-secondary border border-nf-border/50 flex items-center justify-center text-[9px] font-bold text-nf-dim">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-nf-muted truncate">{path || "/"}</p>
                    <p className="text-[9px] text-nf-dim font-mono truncate">{page}</p>
                  </div>
                  {PING_ENDPOINTS.map(e => (
                    <span key={e.name} className="text-[8px] text-nf-dim px-1.5 py-0.5 rounded bg-nf-secondary/50">{e.name}</span>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="mt-4 px-3 py-2.5 rounded-lg bg-nf-secondary/50 border border-nf-border/50">
            <p className="text-[10px] text-nf-dim">كل صفحة ترسل لـ {PING_ENDPOINTS.length} محركات بحث في كل دورة. عدد الطلبات الكلي = {SITE_PAGES.length} x {repeatCount.toLocaleString()} x {PING_ENDPOINTS.length} = {(SITE_PAGES.length * repeatCount * PING_ENDPOINTS.length).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
