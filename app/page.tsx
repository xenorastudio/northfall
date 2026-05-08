"use client";

import Link from "next/link";
import { Navigation } from "./components/landing/Navigation";
import { Hero } from "./components/landing/Hero";
import { Features } from "./components/landing/Features";
import { Communities } from "./components/landing/Communities";
import { Discussions } from "./components/landing/Discussions";
import { Testimonials, CTA, Footer } from "./components/landing/Bottom";
import AuthProvider from "./components/AuthProvider";

const faqItems = [
  { q: "ما هو NorthFall؟", a: "NorthFall هي منصة المجتمعات العربية الأولى للألعاب والتقنية. تجمع مطوري الألعاب والفنانين واللاعبين العرب في مكان واحد للنقاش والمشاركة والتعلم." },
  { q: "ما هي المجتمعات المتوفرة على NorthFall؟", a: "يتوفر على NorthFall مجتمعات لـ Unity و Unreal Engine و Godot و Blender، بالإضافة لأقسام للألعاب والنقاشات العامة." },
  { q: "هل NorthFall مجاني؟", a: "نعم، NorthFall مجاني بالكامل. يمكنك التسجيل والمشاركة في المجتمعات ونشر المحتوى والتعليق بدون أي رسوم." },
  { q: "كيف أنضم لمجتمع على NorthFall؟", a: "سجّل حساب مجاني ثم اختر المجتمع الذي تريده مثل Unity أو Unreal أو Godot أو Blender وابدأ بالمشاركة فوراً." },
  { q: "هل يمكنني نشر لعبة أو مشروعي على NorthFall؟", a: "نعم! يمكنك نشر مشاريعك وألعابك في المجتمع المناسب والحصول على تعليقات وتقييمات من المجتمع العربي." },
];

export default function LandingPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a,
      },
    })),
  };

  return (
    <AuthProvider>
      <main className="min-h-screen bg-[#1e1e20] text-[#e0e0e0]" style={{ direction: "ltr" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <Navigation />
        <Hero />
        <section id="features" aria-label="Features">
          <Features />
        </section>
        <section id="communities" aria-label="Communities">
          <Communities />
        </section>
        <section id="discussions" aria-label="Discussions">
          <Discussions />
        </section>

        {/* FAQ Section */}
        <section id="faq" aria-label="الأسئلة الشائعة" className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">الأسئلة الشائعة</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-medium text-[15px] hover:bg-white/[0.02] transition-colors">
                  {item.q}
                  <svg className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-4 text-white/50 text-[14px] leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        <Testimonials />
        <CTA />
        <Footer />

        {/* Internal links for search engine crawlers */}
        <nav aria-label="Site map" className="sr-only">
          <Link href="/app">الرئيسية</Link>
          <Link href="/NewPage">المنتدى</Link>
          <Link href="/community/Unity">مجتمع Unity</Link>
          <Link href="/community/Unreal">مجتمع Unreal</Link>
          <Link href="/community/Godot">مجتمع Godot</Link>
          <Link href="/community/Blender">مجتمع Blender</Link>
        </nav>
      </main>
    </AuthProvider>
  );
}