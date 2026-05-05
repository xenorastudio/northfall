import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
