"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
            سياسة الخصوصية / Privacy Policy
          </h1>
          <p className="text-[10px] text-nf-dim mt-1 font-sans">آخر تحديث: يونيو 2026 / Last Updated: June 2026</p>
        </div>

        {/* Stacked Minimalist Sections */}
        <div className="space-y-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>1. نظرة عامة / Overview</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed text-right" dir="rtl">
              نحن في <strong>NorthFall</strong> ملتزمون تماماً بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيف نقوم بجمع واستخدام ومعالجة معلوماتك عند استخدام منصتنا.
            </div>
            <div className="text-xs text-nf-muted leading-relaxed text-left font-sans" dir="ltr">
              At <strong>NorthFall</strong>, we respect your privacy. This policy outlines how we handle your personal data and integration scopes when you access our community platform.
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>2. تكامل خدمات Google واستخدام البيانات / Google Drive Scope</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-right" dir="rtl">
              <p>
                تتطلب منصتنا صلاحيات محددة عبر بروتوكول OAuth للتكامل مع خدمات Google لتقديم الميزات التالية:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li><strong className="text-nf-text">تسجيل الدخول (Google SignIn):</strong> نقوم فقط بقراءة وحفظ اسمك، بريدك الإلكتروني، وصورتك الشخصية لإنشاء وتوثيق حسابك على منصتنا.</li>
                <li>
                  <strong className="text-nf-text">نطاق Google Drive (drive.readonly):</strong> نطلب صلاحية القراءة فقط للملفات عبر رابط الصلاحية:
                  <code className="block mt-1 font-mono text-[10px] text-amber-400 bg-nf-secondary p-1.5 rounded text-left" dir="ltr">
                    https://www.googleapis.com/auth/drive.readonly
                  </code>
                  يُستخدم هذا الإذن حصرياً للسماح لك باختيار الصور ومقاطع الفيديو من حساب Google Drive الخاص بك عبر واجهة Google Picker الرسمية وعرضها داخل منشوراتك.
                </li>
                <li><strong className="text-nf-text">سرية الملفات:</strong> تتم قراءة الروابط وعرضها محلياً بالكامل (Client-side). لا نقوم برفع، أو تخزين، أو مشاركة أي من ملفاتك الشخصية أو محتويات Drive على خوادمنا نهائياً.</li>
              </ul>
            </div>
            <div className="text-xs text-nf-muted leading-relaxed space-y-2 text-left font-sans" dir="ltr">
              <p>
                Our platform utilizes Google OAuth to verify identity and allow you to select media directly from Google Drive:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 font-sans">
                <li><strong className="text-nf-text">Google Auth:</strong> We only collect your public profile details (name, email, profile picture) to securely create and verify your user profile.</li>
                <li>
                  <strong className="text-nf-text">Google Drive Scope (drive.readonly):</strong> We request read-only access to files via the scope:
                  <code className="block mt-1 font-mono text-[10px] text-amber-400 bg-nf-secondary p-1.5 rounded text-left">
                    https://www.googleapis.com/auth/drive.readonly
                  </code>
                  This is used solely to let you choose photos and videos from your Drive via the secure Google Picker interface to embed them within your NorthFall community posts.
                </li>
                <li><strong className="text-nf-text">Data Protection:</strong> File processing is completed entirely in your local browser (client-side). We do not upload, copy, store, or share your Drive files or metadata on our backend servers.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-nf-text uppercase tracking-wider">
              <u>3. حماية البيانات ومشاركتها / Data Security</u>
            </h2>
            <div className="text-xs text-nf-muted leading-relaxed text-right" dir="rtl">
              نحن لا نبيع أو نؤجر أو نشارك أي بيانات شخصية خاصة بمستخدمينا مع أي جهات خارجية. جميع بيانات الحساب مشفرة ومحفوظة بأمان عبر قواعد بيانات Firebase الآمنة.
            </div>
            <div className="text-xs text-nf-muted leading-relaxed text-left font-sans" dir="ltr">
              We do not sell, rent, or distribute any user data to third parties. All user authentication and account credentials are encrypted and stored using secure Firebase infrastructure.
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-nf-border-2/40 pt-6 text-[10px] text-nf-dim font-sans flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 NorthFall. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:underline text-nf-accent font-bold">حول المنصة / About Us</Link>
            <span className="text-nf-border-2">|</span>
            <Link href="/terms" className="hover:underline text-nf-accent font-bold">شروط الخدمة / Terms of Service</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
