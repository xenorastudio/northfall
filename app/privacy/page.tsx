"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">سياسة الخصوصية / Privacy Policy</h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">تاريخ التحديث: يونيو 2026 / Last Updated: June 2026</p>
          </div>
        </div>

        {/* Content Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Arabic Policy */}
          <div className="space-y-6 text-xs text-zinc-300 leading-relaxed text-right" dir="rtl">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-2">1. نظرة عامة</h2>
              <p>
                نحن في <strong>NorthFall</strong> ملتزمون تماماً بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيف نقوم بجمع واستخدام ومعالجة معلوماتك عند استخدام منصتنا.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-2">2. تكامل خدمات Google واستخدام البيانات</h2>
              <p>
                تتطلب منصتنا صلاحيات محددة عبر بروتوكول OAuth للتكامل مع خدمات Google لتقديم الميزات التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 pr-2 text-zinc-400">
                <li>
                  <strong className="text-white">تسجيل الدخول (Google SignIn):</strong> نقوم فقط بقراءة وحفظ اسمك، بريدك الإلكتروني، وصورتك الشخصية لإنشاء وتوثيق حسابك على منصتنا.
                </li>
                <li>
                  <strong className="text-white">نطاق Google Drive (drive.readonly):</strong> نطلب صلاحية القراءة فقط للملفات عبر رابط الصلاحية:
                  <code className="block mt-1 font-mono text-[10px] text-amber-400 bg-black/35 p-1.5 rounded text-left" dir="ltr">
                    https://www.googleapis.com/auth/drive.readonly
                  </code>
                  يُستخدم هذا الإذن حصرياً للسماح لك باختيار الصور ومقاطع الفيديو من حساب Google Drive الخاص بك عبر واجهة **Google Picker** الرسمية، وعرضها داخل منشوراتك.
                </li>
                <li>
                  <strong className="text-white">سرية الملفات:</strong> تتم قراءة الروابط وعرضها محلياً بالكامل (Client-side). لا نقوم برفع، أو تخزين، أو مشاركة أي من ملفاتك الشخصية أو محتويات Drive على خوادمنا نهائياً.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-r-4 border-amber-400 pr-2">3. حماية البيانات ومشاركتها</h2>
              <p>
                نحن لا نبيع أو نؤجر أو نشارك أي بيانات شخصية خاصة بمستخدمينا مع أي جهات خارجية. جميع بيانات الحساب مشفرة ومحفوظة بأمان عبر قواعد بيانات Firebase الآمنة.
              </p>
            </section>
          </div>

          {/* English Policy */}
          <div className="space-y-6 text-xs text-zinc-300 leading-relaxed text-left font-sans" dir="ltr">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-l-4 border-amber-400 pl-2">1. Overview</h2>
              <p>
                At <strong>NorthFall</strong>, we respect your privacy. This policy outlines how we handle your personal data and integration scopes when you access our community platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-l-4 border-amber-400 pl-2">2. Google Integration & Data Usage</h2>
              <p>
                Our platform utilizes Google OAuth to verify identity and allow you to select media directly from Google Drive:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-400">
                <li>
                  <strong className="text-white">Google Auth:</strong> We only collect your public profile details (name, email, profile picture) to securely create and verify your user profile.
                </li>
                <li>
                  <strong className="text-white">Google Drive Scope (drive.readonly):</strong> We request read-only access to files via the scope:
                  <code className="block mt-1 font-mono text-[10px] text-amber-400 bg-black/35 p-1.5 rounded text-left font-mono">
                    https://www.googleapis.com/auth/drive.readonly
                  </code>
                  This is used solely to let you choose photos and videos from your Drive via the secure **Google Picker** interface to embed them within your NorthFall community posts.
                </li>
                <li>
                  <strong className="text-white">Data Protection:</strong> File processing is completed entirely in your local browser (client-side). We do not upload, copy, store, or share your Drive files or metadata on our backend servers.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white border-l-4 border-amber-400 pl-2">3. Data Sharing & Security</h2>
              <p>
                We do not sell, rent, or distribute any user data to third parties. All user authentication and account credentials are encrypted and stored using secure Firebase infrastructure.
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
            <Link href="/terms" className="hover:text-amber-400 underline decoration-zinc-700 underline-offset-4 transition-colors">شروط الخدمة / Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
