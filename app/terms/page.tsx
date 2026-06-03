"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
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

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-8">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="p-2.5 bg-amber-400/10 rounded-xl text-amber-400">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">شروط الخدمة / Terms of Service</h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">تاريخ التحديث: يونيو 2026 / Last Updated: June 2026</p>
          </div>
        </div>

        {/* Content Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Arabic Terms */}
          <div className="space-y-6 text-xs text-zinc-300 leading-relaxed text-right" dir="rtl">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-2">1. الموافقة على الشروط</h2>
              <p>
                باستخدامك لمنصة <strong>NorthFall</strong>، فإنك توافق على الالتزام بشروط الخدمة هذه، وجميع القوانين المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام المنصة.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-2">2. سلوك المستخدم ومحتوى المنشورات</h2>
              <p>
                أنت مسؤول بالكامل عن أي منشورات، أو تعليقات، أو وسائط تشاركها على المنصة.
              </p>
              <ul className="list-disc list-inside space-y-1.5 pr-2 text-zinc-400">
                <li>يجب عدم نشر أي محتوى ينتهك حقوق الملكية الفكرية أو حقوق النشر والطباعة.</li>
                <li>يجب ألا يحتوي المحتوى على تحرش، أو تنمر، أو ترويج للكراهية والعنف.</li>
                <li>أنت مسؤول بالكامل عن صحة وسلامة الروابط أو ملفات الوسائط التي تختار مشاركتها من حساب Google Drive الخاص بك.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-2">3. إنهاء وإلغاء الحسابات</h2>
              <p>
                نحتفظ بالحق الكامل في تعديل أو حذف أي محتوى يخالف هذه الشروط، وكذلك تعليق أو إنهاء حساب أي مستخدم ينتهك هذه السياسات بشكل متكرر دون إشعار مسبق.
              </p>
            </section>
          </div>

          {/* English Terms */}
          <div className="space-y-6 text-xs text-zinc-300 leading-relaxed text-left font-sans" dir="ltr">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-l-4 border-amber-400 pl-2 font-sans">1. Acceptance of Terms</h2>
              <p>
                By accessing or using <strong>NorthFall</strong>, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-l-4 border-amber-400 pl-2 font-sans">2. User Conduct & Content</h2>
              <p>
                You are solely responsible for the posts, comments, and media you submit to the platform.
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
                <li>You must not post content that violates copyrights, trademarks, or intellectual property rights.</li>
                <li>You must not share media or text promoting harassment, hate speech, violence, or spam.</li>
                <li>You assume full liability for any files and media URLs you choose to share from your personal Google Drive account.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-l-4 border-amber-400 pl-2 font-sans">3. Moderation & Termination</h2>
              <p>
                We reserve the right to remove any post, community, or comment that violates these guidelines. We may suspend or terminate user accounts for repeated violations of these terms at our sole discretion.
              </p>
            </section>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#121316] border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-sans">
          <span>© 2026 NorthFall. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-amber-400 underline decoration-zinc-700 underline-offset-4 transition-colors">عن المنصة / About Us</Link>
            <span className="text-zinc-700">|</span>
            <Link href="/privacy" className="hover:text-amber-400 underline decoration-zinc-700 underline-offset-4 transition-colors">سياسة الخصوصية / Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
