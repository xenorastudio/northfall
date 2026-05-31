"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, lazy, Suspense } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  LinkedAccount,
  getLinkedAccounts,
  syncCurrentUserToLinkedAccounts,
  restoreSession,
  addNewAccount,
  removeLinkedAccount,
  getPendingSwitchUid,
  clearPendingSwitch,
  getShowAccountPickerSetting,
} from "@/lib/account-switcher";

const AccountPicker = lazy(() => import("./AccountPicker"));

interface AuthContextType {
  user: User | null;
  loading: boolean;
  linkedAccounts: LinkedAccount[];
  switchingUid: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (uid: string) => Promise<void>;
  addAccount: () => Promise<void>;
  removeAccount: (uid: string) => void;
  refreshLinkedAccounts: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  linkedAccounts: [], switchingUid: null,
  signIn: async () => {},
  logout: async () => {},
  switchAccount: async () => {},
  addAccount: async () => {},
  removeAccount: () => {},
  refreshLinkedAccounts: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [switchingUid, setSwitchingUid] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const pickerDismissedRef = useRef(false);

  // Detect return from account switch — clear flag and let
  // onAuthStateChanged pick up the new user's session.
  // The page already reloaded (from switchAccount), so just
  // clean up the flag here.
  useEffect(() => {
    const pendingUid = getPendingSwitchUid();
    if (pendingUid) {
      clearPendingSwitch();
    }
  }, []);

  // ── Account Picker Startup Logic ─────────────────────────────────
  // Shows a PlayStation-style boot screen when:
  //   - User is signed in
  //   - Setting "showAccountPickerOnStartup" is enabled
  //   - More than 1 linked account exists
  //   - Not yet dismissed this page session (ref resets on reload)
  //
  // Every page load/refresh triggers a fresh check. The picker
  // blocks the site until the user explicitly enters
  // (clicks active account or skip button).
  useEffect(() => {
    if (loading) return;
    if (switchingUid) return; // don't dismiss picker during active account switch
    if (!user) { setShowPicker(false); return; }
    if (!getShowAccountPickerSetting()) { setShowPicker(false); return; }
    const accounts = getLinkedAccounts();
    if (accounts.length < 2) { setShowPicker(false); return; }
    if (pickerDismissedRef.current) { setShowPicker(false); return; }
    setShowPicker(true);
  }, [loading, user, switchingUid]);

  // Core auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        syncCurrentUserToLinkedAccounts();
        setLinkedAccounts(getLinkedAccounts());

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

  // Update lastSeen every 2 minutes
  useEffect(() => {
    if (!user) return;
    const updatePresence = () => {
      setDoc(doc(db, "users", user.uid), { lastSeen: new Date().toISOString() }, { merge: true }).catch(() => {});
    };
    const interval = setInterval(updatePresence, 120000);
    updatePresence();
    return () => clearInterval(interval);
  }, [user]);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // ── Token-based account switching ────────────────────────────────

  const switchAccount = useCallback(async (uid: string) => {
    if (uid === user?.uid) return;

    const accounts = getLinkedAccounts();
    const target = accounts.find((a) => a.uid === uid);
    if (!target) return;

    setSwitchingUid(uid);

    // Set flag so post-reload we know this was a switch
    sessionStorage.setItem("nf-switching-to", uid);

    const result = await restoreSession(target.refreshToken);

    if (result.success) {
      // Force full page reload — Firebase Auth will initialize with the
      // new user's session from IndexedDB persistence
      window.location.reload();
    } else {
      // Token-based switching failed — clean up
      sessionStorage.removeItem("nf-switching-to");
      setSwitchingUid(null);
      setLinkedAccounts(getLinkedAccounts());

      // If token is dead, remove the account
      if (result.error?.includes("expired") || result.error?.includes("invalid")) {
        removeLinkedAccount(uid);
        setLinkedAccounts(getLinkedAccounts());
      }
    }
  }, [user?.uid]);

  const addAccount = useCallback(async () => {
    if (linkedAccounts.length >= 4) return;
    setSwitchingUid("__adding__");
    try {
      await addNewAccount();
    } catch {
      // User cancelled or error
    } finally {
      setSwitchingUid(null);
      setLinkedAccounts(getLinkedAccounts());
    }
  }, [linkedAccounts.length]);

  const removeAccount = useCallback((uid: string) => {
    const updated = removeLinkedAccount(uid);
    setLinkedAccounts(updated);
  }, []);

  const refreshLinkedAccounts = useCallback(() => {
    setLinkedAccounts(getLinkedAccounts());
  }, []);

  // Dismiss the account picker — user chose to enter the site
  const dismissAccountPicker = useCallback(() => {
    pickerDismissedRef.current = true;
    setShowPicker(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading,
      linkedAccounts, switchingUid,
      signIn, logout,
      switchAccount, addAccount, removeAccount, refreshLinkedAccounts,
    }}>
      {showPicker && user
        ? <Suspense fallback={<div className="fixed inset-0 z-[100]" style={{backgroundColor:"#08080a"}} />}><AccountPicker onDismiss={dismissAccountPicker} /></Suspense>
        : children}
    </AuthContext.Provider>
  );
}
