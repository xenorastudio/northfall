import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var not set");
  const sa = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return admin;
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    const app = getAdminApp();
    const customToken = await app.auth().createCustomToken(uid.trim());

    let displayName = "";
    let photoURL = "";
    let email = "";
    try {
      const userDoc = await app
        .firestore()
        .collection("users")
        .doc(uid.trim())
        .get();
      const userData = userDoc.data();
      if (userData) {
        displayName = userData.displayName || "";
        photoURL = userData.photoURL || "";
        email = userData.email || "";
      }
    } catch {
      // best-effort
    }

    return NextResponse.json({
      customToken,
      uid: uid.trim(),
      displayName,
      photoURL,
      email,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
