/** Server-only Firebase Admin (optional — requires FIREBASE_SERVICE_ACCOUNT + firebase-admin). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAdminFirestore(): Promise<any | null> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const adminImport = new Function('return import("firebase-admin")')();
    const admin: {
      apps: { length: number }[];
      initializeApp: (cfg: unknown) => void;
      credential: { cert: (sa: unknown) => unknown };
      firestore: () => {
        collection: (name: string) => {
          doc: (id: string) => {
            get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
            update: (data: Record<string, unknown>) => Promise<void>;
          };
        };
      };
    } = await adminImport;
    if (!admin.apps.length) {
      const sa = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    }
    return admin.firestore();
  } catch (e) {
    console.warn("[firebase-admin-server]", e);
    return null;
  }
}
