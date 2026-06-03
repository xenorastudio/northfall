"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { textDirAttr } from "@/lib/display-text";

type HighlightPost = {
  id: string;
  title: string;
  body?: string;
  community: string;
  authorName: string;
  authorPhoto?: string;
  authorUid?: string;
  votes: number;
  commentCount: number;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: string;
  flair?: string;
  flairBg?: string;
  flairTextColor?: string;
};

type Slot = {
  post: HighlightPost;
  badge: string;
  badgeColor: string;
  icon: typeof Flame;
};

/** يظهر مع منشور واحد على الأقل (حتى 3 بطاقات) */
const MIN_POSTS_TO_SHOW = 1;

type Props = {
  communityName: string;
  postCount?: number;
  onPostClick: (id: string) => void;
};

function timeAgo(ts: string) {
  try {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)} د`;
    if (s < 86400) return `${Math.floor(s / 3600)} س`;
    return `${Math.floor(s / 86400)} ي`;
  } catch {
    return "";
  }
}

function pickSlots(posts: HighlightPost[]): Slot[] {
  const withTitle = posts.filter((p) => p.title?.trim());
  if (!withTitle.length) return [];

  const used = new Set<string>();
  const take = (pick: HighlightPost | undefined, badge: string, badgeColor: string, icon: typeof Flame): Slot | null => {
    if (!pick || used.has(pick.id)) return null;
    used.add(pick.id);
    return { post: pick, badge, badgeColor, icon };
  };

  const byVotes = [...withTitle].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const byComments = [...withTitle].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
  const byNew = [...withTitle].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });
  const hot = [...withTitle]
    .filter((p) => (p.votes || 0) >= 2)
    .sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const slots: Slot[] = [];
  const add = (s: Slot | null) => {
    if (s) slots.push(s);
  };

  add(take(byVotes[0], "أعلى", "text-amber-400", TrendingUp));
  add(take(byNew[0], "جديد", "text-sky-400", Clock));
  add(take(byComments[0], "نقاش", "text-violet-400", MessageSquare));
  add(take(hot[0] || byVotes[1], "رائج", "text-orange-400", Flame));

  let i = 0;
  while (slots.length < 3 && i < withTitle.length) {
    const p = withTitle[i++];
    add(take(p, "مميز", "text-nf-muted", Flame));
  }

  return slots.slice(0, 3);
}

export default function CommunityHighlights({
  communityName,
  postCount = 0,
  onPostClick,
}: Props) {
  const [posts, setPosts] = useState<HighlightPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "posts"), where("community", "==", communityName), limit(60))
        );
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HighlightPost)));
      } catch {
        setPosts([]);
      }
      setLoading(false);
    })();
  }, [communityName]);

  const postsWithTitle = useMemo(
    () => posts.filter((p) => typeof p.title === "string" && p.title.trim().length > 0),
    [posts]
  );
  const slots = useMemo(() => pickSlots(posts), [posts]);

  const canShow = postsWithTitle.length >= MIN_POSTS_TO_SHOW && slots.length >= MIN_POSTS_TO_SHOW;

  const gridClass =
    slots.length === 3
      ? "grid grid-cols-1 sm:grid-cols-3 gap-3"
      : slots.length === 2
        ? "grid grid-cols-2 gap-3"
        : "grid grid-cols-1 gap-3";

  if (loading) {
    if (postCount === 0) return null;
    return (
      <div className="mb-4">
        <div className={gridClass}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[152px] rounded-2xl bg-nf-secondary/12 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!canShow) return null;

  return (
    <section className="mb-4">
      <div className={cn(gridClass)}>
        {slots.map(({ post, badge, badgeColor, icon: Icon }) => {
          const cover = post.imageUrl || post.imageUrls?.[0];

          return (
            <button
              key={post.id}
              type="button"
              onClick={() => onPostClick(post.id)}
              className="relative rounded-2xl overflow-hidden text-right group cursor-pointer border border-nf-border-2/25 hover:border-nf-border-2/55 hover:shadow-lg hover:shadow-black/15 transition-all h-[152px] min-w-0"
            >
              {cover ? (
                <>
                  <img
                    src={cover}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15" />
                </>
              ) : (
                <div className="absolute inset-0 nf-highlight-no-cover" />
              )}

              <span className={cn("absolute top-2.5 right-2.5 text-[9px] font-bold flex items-center gap-0.5", badgeColor)}>
                <Icon size={9} />
                {badge}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-3">
                <p
                  className="text-[12px] font-bold nf-highlight-title nf-bidi-text leading-snug line-clamp-2"
                  dir={textDirAttr(post.title)}
                >
                  {post.title}
                </p>

                {post.body && (
                  <p className="text-[9px] nf-highlight-meta/70 leading-relaxed line-clamp-1 mt-0.5 mb-1.5 opacity-70" dir={textDirAttr(post.body)}>
                    {post.body.replace(/<[^>]*>/g, "").slice(0, 80)}{post.body.length > 80 ? "..." : ""}
                  </p>
                )}

                <div className="flex items-center gap-2.5 text-[10px] nf-highlight-meta">
                  <span>{Math.max(0, post.votes || 0)} تصويت</span>
                  <span>{post.commentCount || 0} تعليق</span>
                  {post.createdAt && <span className="mr-auto opacity-75">{timeAgo(post.createdAt)}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
