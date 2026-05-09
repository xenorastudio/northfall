"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { ArrowLeft, Search, Globe, Zap, CheckCircle2, XCircle, Loader2, ExternalLink, Shield } from "lucide-react";

const SITE_URL = "https://www.northfall.blog";

interface SubmitResult {
  engine: string;
  status: "idle" | "loading" | "success" | "error";
  message: string;
}

const ENGINES = [
  { id: "google-ping", name: "Google Sitemap Ping", url: `https://www.google.com/ping?sitemap=${SITE_URL}/sitemap.xml`, type: "ping" },
  { id: "google-index", name: "Google Index Now", url: `https://indexing.googleapis.com/v3/urlNotifications:publish`, type: "info" },
  { id: "bing-ping", name: "Bing Sitemap Submit", url: `https://www.bing.com/ping?sitemap=${SITE_URL}/sitemap.xml`, type: "ping" },
  { id: "bing-indexnow", name: "Bing IndexNow", url: `https://www.bing.com/indexnow?url=${SITE_URL}&key=key&keyLocation=${SITE_URL}/key.txt`, type: "info" },
  { id: "yandex", name: "Yandex Webmaster", url: `https://webmaster.yandex.com/`, type: "link" },
  { id: "baidu", name: "Baidu Webmaster", url: `https://ziyuan.baidu.com/`, type: "link" },
];

const PAGES_TO_SUBMIT = [
  { url: "/", label: "الرئيسية" },
  { url: "/app", label: "التطبيق" },
  { url: "/forum", label: "المنتدى" },
  { url: "/community/Unity", label: "مجتمع Unity" },
  { url: "/community/Unreal", label: "مجتمع Unreal" },
  { url: "/community/Godot", label: "مجتمع Godot" },
  { url: "/community/Blender", label: "مجتمع Blender" },
];

export default function SeoToolsPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const isOwner = user?.uid === "bn6vKOGvIeUdF91P0fzMEbFZfGr2";
  const [results, setResults] = useState<Record<string, SubmitResult>>({});
  const [blastMode, setBlastMode] = useState(false);
  const [blastCount, setBlastCount] = useState(10);
  const [blasting, setBlasting] = useState(false);
  const [blastLog, setBlastLog] = useState<string[]>([]);

  if (!isOwner) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield size={40} className="text-nf-dim mb-3" />
      <p className="text-sm font-semibold text-nf-muted">غير مصرح بالدخول</p>
      <button onClick={onBack} className="mt-3 px-4 py-1.5 rounded-lg border border-nf-border text-xs text-nf-muted hover:bg-nf-hover hover:text-white transition-colors">العودة</button>
    </div>
  );

  const updateResult = (id: string, status: SubmitResult["status"], message: string) => {
    setResults(prev => ({ ...prev, [id]: { engine: id, status, message } }));
  };

  const submitSitemap = async (engineId: string) => {
    const engine = ENGINES.find(e => e.id === engineId);
    if (!engine) return;

    updateResult(engineId, "loading", "جاري الإرسال...");

    if (engine.type === "link") {
      window.open(engine.url, "_blank");
      updateResult(engineId, "success", "تم فتح الرابط — أضف الموقع يدوياً");
      return;
    }

    if (engine.type === "info") {
      updateResult(engineId, "success", "يتطلب API Key — استخدم الروابط أدناه");
      return;
    }

    try {
      // Use fetch with no-cors for ping URLs (they return opaque response but the ping still registers)
      await fetch(engine.url, { mode: "no-cors" });
      updateResult(engineId, "success", "تم إرسال الـ sitemap بنجاح ✓");
    } catch {
      updateResult(engineId, "error", "فشل الإرسال — جرّب يدوياً");
    }
  };

  const submitAllPings = async () => {
    const pings = ENGINES.filter(e => e.type === "ping");
    for (const engine of pings) {
      await submitSitemap(engine.id);
    }
  };

  const runBlast = async () => {
    setBlasting(true);
    setBlastLog([]);
    const log = (msg: string) => setBlastLog(prev => [...prev, msg]);

    for (let i = 0; i < blastCount; i++) {
      // Ping Google with each page URL
      for (const page of PAGES_TO_SUBMIT) {
        const fullUrl = `${SITE_URL}${page.url}`;
        try {
          await fetch(`https://www.google.com/ping?sitemap=${fullUrl}`, { mode: "no-cors" });
          log(`[${i + 1}/${blastCount}] ✓ Google: ${page.label}`);
        } catch {
          log(`[${i + 1}/${blastCount}] ✗ Google: ${page.label}`);
        }
      }
      // Ping Bing with each page URL
      for (const page of PAGES_TO_SUBMIT) {
        const fullUrl = `${SITE_URL}${page.url}`;
        try {
          await fetch(`https://www.bing.com/ping?sitemap=${fullUrl}`, { mode: "no-cors" });
          log(`[${i + 1}/${blastCount}] ✓ Bing: ${page.label}`);
        } catch {
          log(`[${i + 1}/${blastCount}] ✗ Bing: ${page.label}`);
        }
      }
      // Small delay between rounds
      if (i < blastCount - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    log("✓ انتهى الـ Blast!");
    setBlasting(false);
  };

  const getStatusIcon = (status: SubmitResult["status"]) => {
    switch (status) {
      case "loading": return <Loader2 size={14} className="animate-spin text-nf-accent" />;
      case "success": return <CheckCircle2 size={14} className="text-green-400" />;
      case "error": return <XCircle size={14} className="text-red-400" />;
      default: return <div className="w-3.5 h-3.5 rounded-full bg-nf-secondary border border-nf-border" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-nf-hover text-nf-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Search size={18} className="text-nf-accent" />
            أدوات SEO
          </h1>
          <p className="text-[11px] text-nf-dim mt-0.5">إرسال الموقع لمحركات البحث وتحسين الظهور</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 text-center">
          <Globe size={16} className="mx-auto text-nf-accent mb-1" />
          <p className="text-[10px] text-nf-dim">الصفحات</p>
          <p className="text-sm font-bold text-white">{PAGES_TO_SUBMIT.length}</p>
        </div>
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 text-center">
          <Search size={16} className="mx-auto text-nf-accent mb-1" />
          <p className="text-[10px] text-nf-dim">محركات</p>
          <p className="text-sm font-bold text-white">{ENGINES.filter(e => e.type === "ping").length}</p>
        </div>
        <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-3 text-center">
          <Zap size={16} className="mx-auto text-yellow-400 mb-1" />
          <p className="text-[10px] text-nf-dim">Sitemap</p>
          <p className="text-sm font-bold text-green-400">✓</p>
        </div>
      </div>

      {/* Submit Sitemap */}
      <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">إرسال Sitemap</h3>
          <button
            onClick={submitAllPings}
            className="px-3 py-1.5 rounded-lg bg-nf-accent/15 text-nf-accent text-[11px] font-bold hover:bg-nf-accent/25 transition-colors"
          >
            إرسال الكل
          </button>
        </div>
        <div className="space-y-2">
          {ENGINES.map(engine => {
            const r = results[engine.id];
            return (
              <div key={engine.id} className="flex items-center justify-between bg-nf-primary/60 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(r?.status || "idle")}
                  <span className="text-xs text-nf-text">{engine.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r && <span className="text-[10px] text-nf-dim">{r.message}</span>}
                  {engine.type === "link" ? (
                    <a href={engine.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-nf-hover text-nf-muted hover:text-white transition-colors">
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <button
                      onClick={() => submitSitemap(engine.id)}
                      disabled={r?.status === "loading"}
                      className="px-2.5 py-1 rounded-md bg-nf-accent/10 text-nf-accent text-[10px] font-bold hover:bg-nf-accent/20 transition-colors disabled:opacity-50"
                    >
                      إرسال
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blast Mode */}
      <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            <h3 className="text-sm font-bold text-white">Blast Mode</h3>
          </div>
          <button
            onClick={() => setBlastMode(!blastMode)}
            className={blastMode ? "text-yellow-400 text-[10px] font-bold" : "text-nf-dim text-[10px] font-bold"}
          >
            {blastMode ? "مفعّل" : "مطفأ"}
          </button>
        </div>
        {blastMode && (
          <>
            <p className="text-[10px] text-nf-dim mb-3">
              يرسل كل صفحات الموقع لـ Google و Bing عدة مرات لتسريع الأرشفة. كل دورة ترسل {PAGES_TO_SUBMIT.length * 2} طلب.
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-nf-muted">عدد الدورات:</span>
              <input
                type="range"
                min={1}
                max={100}
                value={blastCount}
                onChange={e => setBlastCount(Number(e.target.value))}
                className="flex-1 accent-nf-accent"
              />
              <span className="text-xs font-bold text-white w-8 text-center">{blastCount}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-nf-dim">إجمالي الطلبات: {blastCount * PAGES_TO_SUBMIT.length * 2}</span>
              <button
                onClick={runBlast}
                disabled={blasting}
                className="px-4 py-1.5 rounded-lg bg-yellow-400/15 text-yellow-400 text-[11px] font-bold hover:bg-yellow-400/25 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {blasting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {blasting ? "جاري..." : "تشغيل Blast"}
              </button>
            </div>
            {blastLog.length > 0 && (
              <div className="bg-nf-primary/80 rounded-lg p-2 max-h-[200px] overflow-y-auto text-[9px] font-mono text-nf-dim space-y-0.5">
                {blastLog.map((log, i) => (
                  <p key={i} className={log.includes("✓") ? "text-green-400/70" : log.includes("✗") ? "text-red-400/70" : ""}>{log}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Direct Links */}
      <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-white mb-3">روابط مباشرة</h3>
        <div className="space-y-1.5">
          {[
            { label: "Google Search Console", url: "https://search.google.com/search-console?resource_id=https://www.northfall.blog/" },
            { label: "Bing Webmaster Tools", url: "https://www.bing.com/webmasters?siteUrl=https://www.northfall.blog/" },
            { label: "Google PageSpeed Insights", url: `https://pagespeed.web.dev/analysis?url=${SITE_URL}/` },
            { label: "Google Rich Results Test", url: `https://search.google.com/test/rich-results?url=${SITE_URL}/` },
            { label: "Schema Markup Validator", url: `https://validator.schema.org/#url=${SITE_URL}` },
            { label: "GTmetrix Performance", url: `https://gtmetrix.com/?url=${SITE_URL}/` },
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-nf-hover transition-colors group"
            >
              <span className="text-xs text-nf-muted group-hover:text-white transition-colors">{link.label}</span>
              <ExternalLink size={12} className="text-nf-dim group-hover:text-nf-accent transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Pages to Submit */}
      <div className="bg-nf-secondary/40 border border-nf-border-2/60 rounded-lg p-4">
        <h3 className="text-sm font-bold text-white mb-3">الصفحات المُرسلة</h3>
        <div className="space-y-1">
          {PAGES_TO_SUBMIT.map(page => (
            <div key={page.url} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-nf-primary/40">
              <span className="text-xs text-nf-muted">{page.label}</span>
              <span className="text-[10px] text-nf-dim font-mono">{SITE_URL}{page.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
