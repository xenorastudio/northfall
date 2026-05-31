import { NextRequest, NextResponse } from "next/server";
import {
  computePostHideScore,
  rankPostsWithHideLearning,
  type NegativeSignal,
} from "@/lib/feed-hide-ranking";
import type { PostCategorySource } from "@/lib/post-category";

/** POST — ترتيب دفعة منشورات حسب إشارات Hide (Firestore، ليس Prisma). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const posts = Array.isArray(body?.posts) ? body.posts : [];
    const negativeSignals: NegativeSignal[] = Array.isArray(body?.negativeSignals)
      ? body.negativeSignals
      : [];
    const mode = body?.mode === "new" || body?.mode === "top" ? body.mode : "hot";
    const affinitiesRaw = body?.categoryAffinities;
    const communityCategoriesRaw = body?.communityCategories;

    const categoryAffinities = new Map<string, number>();
    if (affinitiesRaw && typeof affinitiesRaw === "object") {
      for (const [k, v] of Object.entries(affinitiesRaw)) {
        if (typeof v === "number") categoryAffinities.set(k, v);
      }
    }

    const communityCategories = new Map<string, string>();
    if (communityCategoriesRaw && typeof communityCategoriesRaw === "object") {
      for (const [k, v] of Object.entries(communityCategoriesRaw)) {
        if (typeof v === "string") communityCategories.set(k.toLowerCase(), v);
      }
    }

    const ctx = { negativeSignals, categoryAffinities, communityCategories };

    type FeedPost = {
      id: string;
      votes?: number;
      commentCount?: number;
      createdAt?: string;
      community?: string;
      flair?: string;
      hashtags?: string[];
    };

    const normalized = posts
      .filter((p: unknown) => p && typeof (p as FeedPost).id === "string")
      .map((p: FeedPost) => ({
        id: p.id,
        votes: p.votes,
        commentCount: p.commentCount,
        createdAt: p.createdAt,
        community: p.community,
        flair: p.flair,
        hashtags: p.hashtags,
      })) as (FeedPost & PostCategorySource)[];

    const ranked = rankPostsWithHideLearning(normalized, ctx, mode);

    return NextResponse.json({
      orderedIds: ranked.map((p) => p.id),
      scores: ranked.map((p) => ({ id: p.id, score: computePostHideScore(p, ctx) })),
    });
  } catch (e) {
    console.error("[api/feed]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
