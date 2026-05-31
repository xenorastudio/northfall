import { NextRequest, NextResponse } from "next/server";

const FIREBASE_API_KEY = "AIzaSyD2rbBw37_HLLEDWW8Ym5Cmwz3HOaD6KOk";
const FIREBASE_SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`;
const FIREBASE_REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;
const FIREBASE_LOOKUP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;

/**
 * POST /api/auth/switch
 *
 * Accepts a Firebase refresh token and exchanges it for fresh auth tokens.
 * Returns the uid + display info so the client can restore the session.
 *
 * For production deployments with firebase-admin configured, set
 * FIREBASE_SERVICE_ACCOUNT env var and this route will mint custom tokens
 * for fully seamless account switching (no redirect needed).
 */
export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { error: "refreshToken is required" },
        { status: 400 }
      );
    }

    // ── Mode 1: Custom token via firebase-admin (preferred) ──────
    // If FIREBASE_SERVICE_ACCOUNT is set, use Admin SDK to mint a
    // custom token for the user identified by the refreshToken.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        // Dynamic import — guarded by env var so firebase-admin is not
        // required at compile time. TypeScript can't resolve the module
        // if it's not installed, so we use a Function constructor.
        const adminImport = new Function(
          'return import("firebase-admin")'
        )();
        const admin: any = await adminImport;

        if (!admin.apps.length) {
          const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          admin.initializeApp({ credential: admin.credential.cert(sa) });
        }

        // First, exchange refreshToken for idToken to get the uid
        const refreshRes = await fetch(FIREBASE_REFRESH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });

        if (!refreshRes.ok) {
          return NextResponse.json(
            { error: "Invalid refresh token" },
            { status: 401 }
          );
        }

        const tokenData = await refreshRes.json();
        const uid = tokenData.user_id;

        // Mint a custom token for this uid
        const customToken = await admin.auth().createCustomToken(uid);

        // Fetch user profile
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(uid)
          .get();
        const userData = userDoc.data();

        return NextResponse.json({
          method: "custom-token",
          customToken,
          uid,
          refreshToken: tokenData.refresh_token,
          displayName: userData?.displayName || "",
          photoURL: userData?.photoURL || "",
          email: userData?.email || "",
        });
      } catch (e) {
        console.error("Admin SDK error, falling back to REST:", e);
        // Fall through to REST mode
      }
    }

    // ── Mode 2: REST API exchange (works without Admin SDK) ──────
    const res = await fetch(FIREBASE_REFRESH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Token refresh failed", detail: errText },
        { status: 401 }
      );
    }

    const data = await res.json();

    // Fetch user profile for display info
    let displayName = "";
    let photoURL = "";
    let email = "";

    try {
      const lookupRes = await fetch(FIREBASE_LOOKUP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: data.id_token }),
      });
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        const providerInfo = lookupData.users?.[0]?.providerUserInfo?.[0];
        displayName = lookupData.users?.[0]?.displayName || providerInfo?.displayName || "";
        photoURL = lookupData.users?.[0]?.photoUrl || providerInfo?.photoUrl || "";
        email = lookupData.users?.[0]?.email || providerInfo?.email || "";
      }
    } catch {
      // Profile fetch is best-effort
    }

    return NextResponse.json({
      method: "rest",
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      uid: data.user_id,
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
