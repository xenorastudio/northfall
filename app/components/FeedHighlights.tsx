"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowUp, MessageSquare, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { textDirAttr } from "@/lib/display-text";

interface HighlightPost {
  id: string;
  title: string;
  community: string;
  authorName: string;
  authorPhoto?: string;
  votes: number;
  commentCount: number;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: string;
  flair?: string;
}

interface Props {
  onPostClick: (id: string) => void;
  onCommunityClick: (name: string) => void;
}

function timeAgo(ts: string) {
  try {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}د`;
    if (s < 86400) return `${Math.floor(s / 3600)}س`;
    return `${Math.floor(s / 86400)}ي`;
  } catch {
    return "";
  }
}

export default function FeedHighlights({ onPostClick, onCommunityClick }: Props) {
  const [posts, setPosts] = useState<HighlightPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "posts"), orderBy("votes", "desc"), limit(3))
        );
        setPosts(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as HighlightPost))
            .filter((p) => p.title?.trim())
        );
      } catch {
        setPosts([]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[130px] rounded-xl bg-nf-secondary/15 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );
  }

  if (!posts.length) return null;

  const slots = [...posts, ...Array(Math.max(0, 3 - posts.length)).fill(null)].slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {slots.map((post, i) => {
        if (!post) {
          return (
            <div
              key={`empty-${i}`}
              className="rounded-xl border border-dashed border-nf-border-2/25 flex items-center justify-center h-[130px]"
            >
              <p className="text-[11px] text-nf-dim/30">لا يوجد منشور</p>
            </div>
          );
        }

        const cover = post.imageUrl || post.imageUrls?.[0];
        const isHot = (post.votes || 0) >= 5;

        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onPostClick(post.id)}
            className="relative rounded-xl overflow-hidden text-right group cursor-pointer border border-nf-border-2/30 hover:border-nf-border-2/70 transition-all duration-200 h-[130px]"
          >
            {cover ? (
              <>
                <img
                  src={cover}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
              </>
            ) : (
              <div className="absolute inset-0 nf-highlight-no-cover" />
            )}

            {isHot && (
              <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                <Flame size={9} className="text-orange-400" />
                <span className="text-[8px] text-orange-400 font-bold">رائج</span>
              </div>
            )}

            <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-[9px] text-white/60 font-bold">{i + 1}</span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <span
                role="presentation"
                onClick={(e) => {
                  e.stopPropagation();
                  onCommunityClick(post.community);
                }}
                className="text-[9px] text-nf-accent/80 hover:text-nf-accent mb-0.5 block transition-colors cursor-pointer"
              >
                n/{post.community}
              </span>
              <p
                className="text-[11px] font-semibold nf-highlight-title nf-bidi-text leading-snug line-clamp-2 mb-1.5"
                dir={textDirAttr(post.title)}
              >
                {post.title}
              </p>
              <div className="flex items-center gap-2 text-[9px] nf-highlight-meta">
                <span className="flex items-center gap-0.5">
                  <ArrowUp size={9} className={cn(post.votes > 0 && "text-orange-400")} />
                  {post.votes || 0}
                </span>
                <span className="flex items-center gap-0.5">
                  <MessageSquare size={8} />
                  {post.commentCount || 0}
                </span>
                {post.createdAt && <span className="mr-auto">{timeAgo(post.createdAt)}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
