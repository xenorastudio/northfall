import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin-server";

/** POST { postId } — increment views (Admin SDK, bypasses client rules). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
    if (!postId || postId.length > 128) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const db = await getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
    }

    const ref = db.collection("posts").doc(postId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const current = (snap.data()?.views as number) || 0;
    await ref.update({ views: current + 1 });
    return NextResponse.json({ views: current + 1 });
  } catch (e) {
    console.error("[post-view]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
