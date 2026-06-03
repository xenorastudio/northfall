"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-nf-body text-nf-text px-6 py-12 flex flex-col font-sans selection:bg-nf-accent selection:text-black">
      <div className="max-w-3xl mx-auto w-full space-y-10">
        
        {/* Navigation back */}
        <div>
          <Link href="/app" className="text-xs text-nf-accent hover:underline font-bold">
            ← العودة للرئيسية / Back to Home
          </Link>
        </div>

        {/* Page Title */}
        <div className="border-b border-nf-border-2/40 pb-4">
          <h1 className="text-2xl font-black text-nf-text tracking-wide">
            شروط الخدمة / Terms of Service
          </h1>
          <p className="text-[10px] text-nf-dim mt-1 font-sans">آخر تحديث: يونيو 2026 / Last Updated: June 2026</p>
        </div>

        {/* Stacked Minimalist Sections */}
        <div className="space-y-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>1. الموافقة على الشروط / Acceptance of Terms</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed text-right" dir="rtl">
              باستخدامك لمنصة <strong>NorthFall</strong>، فإنك توافق على الالتزام بشروط الخدمة هذه، وجميع القوانين المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام المنصة.
            </div>
            <div className="text-xs text-nf-muted leading-relaxed text-left font-sans" dir="ltr">
              By accessing or using <strong>NorthFall</strong>, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>2. سلوك المستخدم ومحتوى المنشورات / User Conduct</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-right" dir="rtl">
              <p>
                أنت مسؤول بالكامل عن أي منشورات، أو تعليقات، أو وسائط تشاركها على المنصة:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li>يجب عدم نشر أي محتوى ينتهك حقوق الملكية الفكرية أو حقوق النشر والطباعة.</li>
                <li>يجب ألا يحتوي المحتوى على تحرش، أو تنمر، أو ترويج للكراهية والعنف.</li>
                <li>أنت مسؤول بالكامل عن صحة وسلامة الروابط أو ملفات الوسائط التي تختار مشاركتها من حساب Google Drive الخاص بك.</li>
              </ul>
            </div>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-left font-sans" dir="ltr">
              <p>
                You are solely responsible for the posts, comments, and media you submit to the platform:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 font-sans">
                <li>You must not post content that violates copyrights, trademarks, or intellectual property rights.</li>
                <li>You must not share media or text promoting harassment, hate speech, violence, or spam.</li>
                <li>You assume full liability for any files and media URLs you choose to share from your personal Google Drive account.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>3. إنهاء الحسابات وإلغاء المحتوى / Moderation</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed text-right" dir="rtl">
              نحتفظ بالحق الكامل في تعديل أو حذف أي محتوى يخالف هذه الشروط، وكذلك تعليق أو إنهاء حساب أي مستخدم ينتهك هذه السياسات بشكل متكرر دون إشعار مسبق.
            </div>
            <div className="text-xs text-nf-muted leading-relaxed text-left font-sans" dir="ltr">
              We reserve the right to remove any post, community, or comment that violates these guidelines. We may suspend or terminate user accounts for repeated violations of these terms at our sole discretion.
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-nf-border-2/40 pt-6 text-[10px] text-nf-dim font-sans flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 NorthFall. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:underline text-nf-accent font-bold">حول المنصة / About Us</Link>
            <span className="text-nf-border-2">|</span>
            <Link href="/privacy" className="hover:underline text-nf-accent font-bold">سياسة الخصوصية / Privacy Policy</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
