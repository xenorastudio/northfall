import * as admin from "firebase-admin";
import { Metadata } from "next";
import ThreadRedirect from "./redirect";

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

async function findThread(id: string) {
  const app = getAdmin();
  if (!app) return null;
  try {
    const communities = await app.firestore().collection("forums").get();
    for (const comm of communities.docs) {
      const snap = await app.firestore().collection("forums").doc(comm.id).collection("threads").doc(id).get();
      if (snap.exists) {
        const d = snap.data() as Record<string, unknown>;
        return { ...d, id: snap.id, community: comm.id } as { id: string; community: string; title?: string; body?: string; authorPhoto?: string; [key: string]: unknown };
      }
    }
  } catch {}
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const thread = await findThread(id);
  if (!thread) return { title: "NorthFall" };

  const images: { url: string; width?: number; height?: number }[] = [];

  const bodyText = typeof thread.body === "string" ? thread.body : "";

  const mdImg = bodyText.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  const rawImgUrl = mdImg
    ? mdImg[2]
    : bodyText.match(/https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif|ico|heic|heif|avif)(?:[?#][^\s)]*)?/i)?.[0];

  const authorPhoto = typeof thread.authorPhoto === "string" ? thread.authorPhoto : null;

  if (rawImgUrl) {
    images.push({ url: rawImgUrl, width: 1200, height: 630 });
  } else if (authorPhoto) {
    images.push({ url: authorPhoto, width: 256, height: 256 });
  }

  const title = thread.title ? `${thread.title} — NorthFall` : "NorthFall";
  const description = bodyText
    ? bodyText.replace(/<[^>]*>/g, "").replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "").slice(0, 200) || "منشور في NorthFall"
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
      card: images.length > 0 ? "summary" : "summary",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThreadRedirect id={id} />;
}
