"use client";

import { useState } from "react";
import { Bell, ChevronDown, Gamepad2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "browse", label: "Browse" },
  { id: "devlogs", label: "Developer Logs" },
  { id: "jams", label: "Jams" },
  { id: "dashboard", label: "Dashboard" },
  { id: "feed", label: "Feed" },
  { id: "community", label: "Community" },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

export default function LaunchesNavbar() {
  const [activeNav, setActiveNav] = useState<NavId>("browse");
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 min-h-[52px]">
        {/* Logo + primary nav */}
        <div className="flex items-center gap-2 lg:gap-4 shrink-0 min-w-0">
          <a
            href="/launches"
            className="flex items-center gap-2 shrink-0 text-slate-900 hover:opacity-80 transition-opacity"
            aria-label="Launches home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#fa5c5c] text-white">
              <Gamepad2 size={18} strokeWidth={2.25} />
            </span>
            <span className="hidden sm:inline text-[15px] font-bold tracking-tight text-slate-900">
              Launches
            </span>
          </a>

          <nav
            className="hidden xl:flex items-center gap-0.5"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={cn(
                    "relative px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors",
                    isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full bg-[#fa5c5c]"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center min-w-0 max-w-xl mx-auto">
          <label className="relative w-full max-w-[420px]">
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for games, jams, tags or creators"
              className={cn(
                "w-full h-9 rounded-md border border-slate-200 bg-slate-100/90",
                "pl-3 pr-9 text-[13px] text-slate-900 placeholder:text-slate-400",
                "outline-none focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200/80 transition-all"
              )}
            />
            <Search
              size={16}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              aria-hidden
            />
          </label>
        </div>

        {/* Notifications + profile */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={2} />
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-md pl-1 pr-2 py-1 hover:bg-slate-100 transition-colors max-w-[160px]"
            aria-label="User menu"
          >
            <span className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center text-[11px] font-bold text-slate-600">
              u
            </span>
            <span className="hidden md:inline text-[13px] font-semibold text-slate-800 truncate">
              u/username
            </span>
            <ChevronDown size={14} className="hidden md:block text-slate-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Mobile / tablet nav strip */}
      <nav
        className="xl:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-none border-t border-slate-100"
        aria-label="Main navigation mobile"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "relative shrink-0 px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap rounded-md transition-colors",
                isActive
                  ? "text-slate-900 bg-slate-100"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#fa5c5c]" aria-hidden />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
