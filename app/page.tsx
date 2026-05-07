"use client";

import { Navigation } from "./components/landing/Navigation";
import { Hero } from "./components/landing/Hero";
import { Features } from "./components/landing/Features";
import { Communities } from "./components/landing/Communities";
import { Discussions } from "./components/landing/Discussions";
import { Testimonials, CTA, Footer } from "./components/landing/Bottom";
import AuthProvider from "./components/AuthProvider";

export default function LandingPage() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-[#1e1e20] text-[#e0e0e0]" style={{ direction: "ltr" }}>
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
        <Testimonials />
        <CTA />
        <Footer />
      </main>
    </AuthProvider>
  );
}