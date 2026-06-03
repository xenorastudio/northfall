"use client";

import Link from "next/link";
import { ArrowLeft, Globe, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0e0f11] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#121316] px-4 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-white tracking-wider">NorthFall</span>
          </div>
          <Link
            href="/app"
            className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 rounded-lg font-sans"
          >
            <ArrowLeft size={14} />
            <span>العودة للمنصة / Back to App</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-12">
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            حول منصة نورثفال / About NorthFall
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            منصة تفاعلية متكاملة تجمع المجتمعات وصنّاع المحتوى العربي في مساحة واحدة آمنة ومبتكرة.
          </p>
        </section>

        {/* Dual Column About & Google OAuth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Arabic Column */}
          <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 text-right" dir="rtl">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2 bg-amber-400/10 rounded-lg text-amber-400">
                <Globe size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">رسالة المنصة وأهدافها</h2>
            </div>
            
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-medium">
              <p>
                <strong>نورثفال (NorthFall)</strong> هي شبكة اجتماعية ومجتمع تفاعلي مفتوح يهدف إلى توفير بيئة خصبة للاعبين، مطوري الألعاب، المبرمجين، والمبدعين العرب لمشاركة أفكارهم، ونشر منشوراتهم، ومناقشة اهتماماتهم عبر منصة واحدة متكاملة.
              </p>
              <p>
                تسهّل المنصة التواصل وبناء روابط حقيقية من خلال أنظمة متقدمة للتصويت، والتعليقات، والجوائز التفاعلية، والهاشتاغات المخصصة، والألعاب المشتركة.
              </p>
              <div className="bg-amber-400/5 border border-amber-400/10 p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-400" />
                  تكامل Google Drive وخصوصية البيانات:
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  تتكامل نورثفال مع خدمات Google OAuth و Google Drive API للسماح للمستخدمين بتحديد ملفات الصور ومقاطع الفيديو من حساباتهم الشخصية في Google Drive وعرضها داخل منشوراتهم.
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                  * خصوصيتك أولوية: تتم عملية اختيار الملفات بالكامل على جهازك (Client-side)، ولا نقوم بحفظ أو معالجة أو رفع أي من ملفاتك أو بياناتك الخاصة على خوادمنا على الإطلاق.
                </p>
              </div>
            </div>
          </div>

          {/* English Column */}
          <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 text-left" dir="ltr">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2 bg-amber-400/10 rounded-lg text-amber-400">
                <Globe size={20} />
              </div>
              <h2 className="text-lg font-bold text-white font-sans">Platform Mission & Functionality</h2>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
              <p>
                <strong>NorthFall</strong> is an open social platform and interactive community designed to connect Arabic-speaking gamers, game developers, programmers, and creators. It serves as a centralized hub to publish updates, start forum threads, and discuss niche interests.
              </p>
              <p>
                We foster engagement through advanced voting mechanisms, community categorization, customized feeds, real-time interactive dashboards, awards, and in-browser games.
              </p>
              <div className="bg-amber-400/5 border border-amber-400/10 p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                  <ShieldCheck size={14} className="text-amber-400" />
                  Google Drive Integration & Security Disclosure:
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  NorthFall implements official Google OAuth and Picker integrations to grant users the ability to attach their personal pictures and videos from Google Drive directly to their posts.
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                  * 100% Client-Side Privacy: The application accesses Google Drive via the <code className="bg-black/40 text-amber-400 font-mono px-1 rounded">drive.readonly</code> scope. We never upload, save, or share any of your files or personal account metadata on our databases.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links Card */}
        <div className="bg-[#121316] border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-sans">
          <span>© 2026 NorthFall. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-amber-400 underline decoration-zinc-700 underline-offset-4 transition-colors">سياسة الخصوصية / Privacy Policy</Link>
            <span className="text-zinc-700">|</span>
            <Link href="/terms" className="hover:text-amber-400 underline decoration-zinc-700 underline-offset-4 transition-colors">شروط الخدمة / Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
