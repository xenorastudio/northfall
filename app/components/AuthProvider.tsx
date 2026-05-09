"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef).catch(() => null);
        const isNew = !userSnap?.exists();
        setDoc(userRef, {
          lastSeen: new Date().toISOString(),
          displayName: u.displayName || "",
          photoURL: u.photoURL || "",
          email: u.email || "",
          ...(isNew ? { createdAt: new Date().toISOString() } : {}),
        }, { merge: true }).catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  // Update lastSeen every 2 minutes while user is active
  useEffect(() => {
    if (!user) return;
    const updatePresence = () => {
      setDoc(doc(db, "users", user.uid), { lastSeen: new Date().toISOString() }, { merge: true }).catch(() => {});
    };
    const interval = setInterval(updatePresence, 120000);
    updatePresence();
    return () => clearInterval(interval);
  }, [user]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
