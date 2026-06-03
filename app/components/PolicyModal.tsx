"use client";

import { useEffect, useState } from "react";
import { X, ShieldCheck, FileText } from "lucide-react";

export default function PolicyModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("nf-open-policy-modal", handleOpen);
    return () => window.removeEventListener("nf-open-policy-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 cursor-pointer" 
        onClick={() => setIsOpen(false)}
      />

      {/* Flat Premium Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-xl border border-nf-border-2 bg-nf-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nf-border-2/50 px-6 py-4">
          <h2 className="text-sm font-black text-nf-text flex items-center gap-2">
            <ShieldCheck size={16} className="text-nf-accent" />
            سياسة الخصوصية وشروط الخدمة / Privacy Policy & Terms
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors"
            type="button"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-300 leading-relaxed text-right" dir="rtl">
          
          {/* ARABIC VERSION */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-nf-text border-r-4 border-nf-accent pr-2.5">سياسة الخصوصية (Privacy Policy)</h3>
            <p>
              نحن في <strong>NorthFall</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية تعاملنا مع بياناتك عند استخدام موقعنا.
            </p>
            
            <div className="space-y-2 bg-nf-secondary/20 p-4 rounded-lg border border-nf-border-2/40">
              <h4 className="font-bold text-nf-text">تكامل Google Drive واستخدام البيانات:</h4>
              <p>
                يطلب تطبيقنا الوصول إلى ملفات Google Drive الخاصة بك عبر نطاق الصلاحية (Scope) التالي:
                <code className="block mt-1 font-mono text-[10px] text-amber-400 bg-black/35 p-1 rounded text-left" dir="ltr">
                  https://www.googleapis.com/auth/drive.readonly
                </code>
                يُستخدم هذا الإذن حصرياً للسماح لك باختيار الصور ومقاطع الفيديو من حساب Google Drive الخاص بك عبر واجهة **Google Picker** الرسمية، وعرضها داخل منشوراتك في مجتمعاتنا.
              </p>
              <p className="text-zinc-400">
                <strong>سرية البيانات:</strong> لا يقوم تطبيقنا بحفظ، تحميل، أو مشاركة أي من ملفاتك أو معلوماتك الشخصية على خوادمنا. تتم عملية الاختيار بالكامل على جهازك، ويتم حفظ روابط الملفات التي تختارها أنت فقط لغرض العرض المباشر داخل كروت المنشورات.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-nf-text">البيانات التي نجمعها:</h4>
              <p>
                عند تسجيل الدخول باستخدام حساب Google الخاص بك (OAuth)، نقوم فقط بحفظ اسمك، بريدك الإلكتروني، وصورتك الشخصية لإنشاء ملفك الشخصي في المنصة.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-nf-text border-r-4 border-nf-accent pr-2.5">شروط الخدمة (Terms of Service)</h3>
            <p>
              باستخدامك لمنصة NorthFall، فإنك توافق على الالتزام بالشروط التالية:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pr-2">
              <li>يجب عدم نشر أي محتوى ينتهك حقوق الملكية الفكرية أو يحتوي على إساءة.</li>
              <li>أنت مسؤول بالكامل عن أي ملفات أو وسائط تختار مشاركتها من حساب Google Drive الخاص بك.</li>
              <li>نحتفظ بالحق في إزالة أي منشور أو تعليق يخالف معايير مجتمعنا.</li>
            </ul>
          </section>

          <hr className="border-nf-border-2/40 my-6" />

          {/* ENGLISH VERSION */}
          <div className="text-left space-y-6 font-sans text-zinc-400" dir="ltr">
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-nf-text border-l-4 border-nf-accent pl-2.5">Privacy Policy</h3>
              <p>
                At <strong>NorthFall</strong>, we value your privacy. This policy outlines how we handle your personal data when using our platform.
              </p>
              
              <div className="space-y-2 bg-nf-secondary/20 p-4 rounded-lg border border-nf-border-2/40">
                <h4 className="font-bold text-nf-text">Google Drive Integration & OAuth Scopes:</h4>
                <p>
                  Our application requests access to your Google Drive files through the following OAuth scope:
                  <code className="block mt-1 font-mono text-[10px] text-amber-400 bg-black/35 p-1 rounded text-left">
                    https://www.googleapis.com/auth/drive.readonly
                  </code>
                  This scope is used strictly to allow you to select your own images or videos from Google Drive using the official **Google Picker** interface and display them inside your NorthFall posts.
                </p>
                <p className="text-zinc-500">
                  <strong>Data Protection:</strong> We do not download, store, or share your Google Drive files or metadata on our servers. The file selection process happens entirely client-side, and we only save the direct displayable links for the files you explicitly choose to publish.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-nf-text">Information We Collect:</h4>
                <p>
                  When signing in via Google Auth, we retrieve your public profile information (name, email, and profile picture) to set up and customize your account on the platform.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-nf-text border-l-4 border-nf-accent pl-2.5">Terms of Service</h3>
              <p>
                By accessing or using NorthFall, you agree to comply with the following terms:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>You may not publish copyrighted content or any media that violates public laws or community guidelines.</li>
                <li>You are solely responsible for the files and media you choose to publish from your Google Drive account.</li>
                <li>We reserve the right to remove any posts or restrict account access for violations of these terms.</li>
              </ul>
            </section>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-nf-border-2/50 px-6 py-4 bg-nf-secondary/10">
          <button 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-lg bg-nf-secondary hover:bg-nf-hover text-xs font-bold text-nf-text transition-colors"
            type="button"
          >
            إغلاق / Close
          </button>
        </div>

      </div>
    </div>
  );
}
