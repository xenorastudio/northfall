"use client";

import Link from "next/link";

export default function AboutPage() {
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
            حول منصة نورثفال / About NorthFall
          </h1>
        </div>

        {/* Stacked Minimalist Sections */}
        <div className="space-y-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>منصة نورثفال / What is NorthFall</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-right" dir="rtl">
              <p>
                <strong>نورثفال (NorthFall)</strong> هي شبكة اجتماعية ومجتمع تفاعلي مفتوح يهدف إلى توفير بيئة خصبة للاعبين، مطوري الألعاب، المبرمجين، والمبدعين العرب لمشاركة أفكارهم، ونشر منشوراتهم، ومناقشة اهتماماتهم عبر منصة واحدة متكاملة.
              </p>
              <p>
                تسهّل المنصة التواصل وبناء روابط حقيقية من خلال أنظمة متقدمة للتصويت، والتعليقات، والجوائز التفاعلية، والهاشتاغات المخصصة، والألعاب المشتركة.
              </p>
            </div>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-left font-sans" dir="ltr">
              <p>
                <strong>NorthFall</strong> is an open social platform and interactive community designed to connect Arabic-speaking gamers, game developers, programmers, and creators. It serves as a centralized hub to publish updates, start forum threads, and discuss niche interests.
              </p>
              <p>
                We foster engagement through advanced voting mechanisms, community categorization, customized feeds, real-time interactive dashboards, awards, and in-browser games.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>تكامل Google Drive / Google Drive OAuth Integration</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-right" dir="rtl">
              <p>
                تتكامل المنصة مع Google OAuth و Google Drive API لمساعدتك على اختيار وعرض صورك وفيديوهاتك مباشرة من حساب Google Drive الخاص بك داخل منشوراتك.
              </p>
              <p className="font-semibold text-nf-text">
                * خصوصيتك أولوية: تتم عملية اختيار الملفات بالكامل على جهازك (Client-side) عبر واجهة Google Picker، ولا نقوم بحفظ أو معالجة أو رفع أي من ملفاتك أو بياناتك الخاصة على خوادمنا على الإطلاق.
              </p>
            </div>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-left font-sans" dir="ltr">
              <p>
                We use Google OAuth & Drive Picker (via the read-only scope <code className="bg-nf-secondary text-amber-400 font-mono px-1 rounded">https://www.googleapis.com/auth/drive.readonly</code>) to let you select and embed photos or videos from your Google Drive into posts.
              </p>
              <p className="font-semibold text-nf-text">
                * 100% Client-Side Privacy: The file selection process happens entirely client-side. We never upload, save, or share any of your files or personal account metadata on our databases.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>روابط هامة / Document Portal</u>
            </h2>
            <div className="flex flex-col gap-2 text-xs font-sans">
              <Link href="/privacy" className="text-nf-accent hover:underline font-bold">
                سياسة الخصوصية / Privacy Policy
              </Link>
              <Link href="/terms" className="text-nf-accent hover:underline font-bold">
                شروط الخدمة / Terms of Service
              </Link>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-nf-border-2/40 pt-6 text-[10px] text-nf-dim font-sans">
          <span>© 2026 NorthFall. All rights reserved.</span>
        </div>

      </div>
    </div>
  );
}
