"use client";

import { useData } from "./DataProvider";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { Users, Gamepad2, MessageSquare, Rss, TrendingUp, Plus } from "lucide-react";

interface Props {
  onCommunityClick: (name: string) => void;
  onCreatePost: () => void;
  onGamesClick: () => void;
  onForumsClick: () => void;
}

export default function FeedWelcome({ onCommunityClick, onCreatePost, onGamesClick, onForumsClick }: Props) {
  const { communities } = useData();
  const { user } = useAuth();

  const topComms = communities
    .sort((a, b) => (b.members || 0) - (a.members || 0))
    .slice(0, 6);

  return (
    <div className="space-y-3 mt-4" style={{ direction: "rtl" }}>

      {/* Welcome card */}
      <div className="rounded-xl border border-nf-border-2/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-nf-border-2/30">
          <p className="text-[13px] font-bold text-nf-text">مرحباً بك في NorthFall 👋</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[12px] text-nf-muted leading-relaxed mb-3">
            مجتمعك العربي — شارك أفكارك، انضم لمجتمعات، وتفاعل مع ناس تشاركك نفس الاهتمامات.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onCreatePost}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-nf-accent text-white text-[12px] font-bold hover:opacity-90 transition-opacity">
              <Plus size={14} /> أنشئ منشوراً
            </button>
            <button onClick={onForumsClick}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-nf-border-2 text-nf-muted text-[12px] font-medium hover:bg-nf-hover transition-colors">
              <MessageSquare size={14} /> المنتدى
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onGamesClick}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-nf-border-2/50 hover:border-nf-border-2 hover:bg-nf-secondary/20 transition-all text-right">
          <div className="w-8 h-8 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0">
            <Gamepad2 size={15} className="text-nf-accent" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-nf-text">مكتبة الألعاب</p>
            <p className="text-[10px] text-nf-dim">اكتشف ألعابك</p>
          </div>
        </button>
        <button onClick={onForumsClick}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-nf-border-2/50 hover:border-nf-border-2 hover:bg-nf-secondary/20 transition-all text-right">
          <div className="w-8 h-8 rounded-lg bg-nf-accent/10 flex items-center justify-center shrink-0">
            <MessageSquare size={15} className="text-nf-accent" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-nf-text">المنتدى</p>
            <p className="text-[10px] text-nf-dim">نقاشات عميقة</p>
          </div>
        </button>
      </div>

      {/* Suggested communities */}
      {topComms.length > 0 && (
        <div className="rounded-xl border border-nf-border-2/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-nf-border-2/30">
            <TrendingUp size={13} className="text-nf-accent" />
            <p className="text-[13px] font-bold text-nf-text">مجتمعات مقترحة</p>
          </div>
          <div className="divide-y divide-nf-border-2/20">
            {topComms.map((c, i) => (
              <button key={c.name} onClick={() => onCommunityClick(c.name)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-nf-secondary/20 transition-colors text-right">
                <span className="text-[11px] text-nf-dim/40 w-4 shrink-0">{i + 1}</span>
                {c.img
                  ? <img src={c.img} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] text-nf-accent font-bold shrink-0">n/</div>
                }
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[13px] font-medium text-nf-text truncate">n/{c.name}</p>
                  {(c.members || 0) > 0 && (
                    <p className="text-[10px] text-nf-dim flex items-center gap-1">
                      <Users size={9} /> {c.members?.toLocaleString()} عضو
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-nf-accent border border-nf-accent/30 px-2 py-0.5 rounded-full shrink-0">انضم</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl border border-nf-border-2/50 px-4 py-3">
        <p className="text-[11px] font-bold text-nf-dim uppercase tracking-wider mb-2.5">نصائح سريعة</p>
        <div className="space-y-2">
          {[
            { icon: "⌘K", text: "بحث سريع" },
            { icon: "⌘N", text: "منشور جديد" },
            { icon: "🔥", text: "الرائج — أفضل المنشورات" },
            { icon: "✨", text: "جديد — آخر المنشورات" },
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono bg-nf-secondary px-1.5 py-0.5 rounded text-nf-muted shrink-0">{tip.icon}</span>
              <span className="text-[11px] text-nf-dim">{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
