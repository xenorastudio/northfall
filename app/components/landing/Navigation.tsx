"use client";

import { useState } from "react";
import Link from "next/link";
import { User, ChevronDown, Settings, LogOut, Shield, Bookmark, Bell } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AnimatePresence, motion } from "framer-motion";

export function Navigation() {
  const { user, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try { await signOut(auth); } catch {}
    setShowMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
      <nav className="w-full px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-bold text-[17px] tracking-tight text-white">
            NorthFall
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-[14px] text-white/40 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/[0.05]">Features</a>
            <a href="#communities" className="text-[14px] text-white/40 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/[0.05]">Communities</a>
            <a href="#discussions" className="text-[14px] text-white/40 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/[0.05]">Discussions</a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/[0.1]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center ring-1 ring-white/[0.1]">
                    <User size={14} className="text-white/40" />
                  </div>
                )}
                <ChevronDown size={13} className={`text-white/20 transition-transform ${showMenu ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 w-[220px] bg-black/90 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/60"
                  >
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-[13px] font-medium text-white/80 truncate">{user.displayName || "User"}</p>
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{user.email || ""}</p>
                    </div>
                    <div className="py-1">
                      {[
                        { icon: User, label: "Profile", href: "/app?view=profile" },
                        { icon: Bookmark, label: "Saved", href: "/app?view=profile" },
                        { icon: Bell, label: "Notifications", href: "/app?view=notifs" },
                        { icon: Settings, label: "Settings", href: "/app?view=settings" },
                        { icon: Shield, label: "Admin Panel", href: "/app?view=admin" },
                      ].map((item, i) => (
                        <Link key={i} href={item.href} onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
                          <item.icon size={14} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-white/[0.06] py-1">
                      <button onClick={handleSignOut} className="flex items-center gap-2.5 w-full px-4 py-2 text-[12px] text-red-400/40 hover:text-red-400 hover:bg-red-400/[0.04] transition-all">
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/app" className="text-[14px] text-white/30 hover:text-white/60 transition-colors">Log in</Link>
              <Link href="/app" className="inline-flex items-center justify-center px-5 py-2 text-[14px] font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors">Get Started</Link>
            </>
          )}

          <button type="button" className="md:hidden p-1.5 -mr-1.5 text-white/30 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.04] bg-black/80 backdrop-blur-xl">
          <div className="w-full px-6 py-4 space-y-1">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2 text-[14px] text-white/30 hover:text-white transition-colors">Features</a>
            <a href="#communities" onClick={() => setMobileOpen(false)} className="block py-2 text-[14px] text-white/30 hover:text-white transition-colors">Communities</a>
            <a href="#discussions" onClick={() => setMobileOpen(false)} className="block py-2 text-[14px] text-white/30 hover:text-white transition-colors">Discussions</a>
            {!user && <a href="/app" className="block py-2 text-[14px] text-white/30 hover:text-white transition-colors">Log in</a>}
          </div>
        </div>
      )}
    </header>
  );
}
