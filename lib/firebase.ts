import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2rbBw37_HLLEDWW8Ym5Cmwz3HOaD6KOk",
  authDomain: "northfall-b8ec4.firebaseapp.com",
  databaseURL: "https://northfall-b8ec4-default-rtdb.firebaseio.com",
  projectId: "northfall-b8ec4",
  storageBucket: "northfall-b8ec4.firebasestorage.app",
  messagingSenderId: "271792383366",
  appId: "1:271792383366:web:821c93067e1f61b7293807",
  measurementId: "G-21NT45WGE7",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore with offline persistence & unlimited cache
const db = getApps().length === 0
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED, tabManager: persistentSingleTabManager({}) }),
    })
  : getFirestore(app);

// Auth persistence - stay logged in across tabs/sessions
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

export { app, db, auth };
