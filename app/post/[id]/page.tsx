import * as admin from "firebase-admin";
import { Metadata } from "next";
import PostRedirect from "./redirect";

function getAdmin() {
  if (admin.apps.length) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return admin;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const app = getAdmin();
  if (!app) return { title: "NorthFall" };

  try {
    const snap = await app.firestore().collection("posts").doc(id).get();
    if (!snap.exists) return { title: "NorthFall" };
    const post = snap.data();

    const images: { url: string; width?: number; height?: number }[] = [];

    const imgFromField = post?.imageUrls?.length
      ? post.imageUrls.filter((u: string) => u?.trim())
      : post?.imageUrl?.trim()
        ? [post.imageUrl]
        : [];

    if (imgFromField.length > 0) {
      images.push({ url: imgFromField[0], width: 1200, height: 630 });
    } else {
      const body = typeof post?.body === "string" ? post.body : "";
      const mdImg = body.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      const rawImg = mdImg
        ? mdImg[2]
        : body.match(/https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif|ico|heic|heif|avif)(?:[?#][^\s)]*)?/i)?.[0];
      if (rawImg) {
        images.push({ url: rawImg, width: 1200, height: 630 });
      } else if (post?.authorPhoto) {
        images.push({ url: post.authorPhoto, width: 256, height: 256 });
      }
    }

    const title = post?.title ? `${post.title} — NorthFall` : "NorthFall";
    const description = post?.body
      ? post.body.replace(/<[^>]*>/g, "").slice(0, 200)
      : "منشور في NorthFall";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images,
        siteName: "NorthFall",
        locale: "ar_AR",
      },
      twitter: {
        card: images.length > 0 ? "summary_large_image" : "summary",
        title,
        description,
        images: images.map((i) => i.url),
      },
      other: {
        "fc:frame": "ImageView",
        "fc:frame:image": images[0]?.url || "",
      },
    };
  } catch {
    return { title: "NorthFall" };
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostRedirect id={id} />;
}
