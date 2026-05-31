"use client";

import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

// ─── Types ────────────────────────────────────────────────────────────

export interface LinkedAccount {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  refreshToken: string;
  linkedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const STORAGE_KEY = "nf-accounts";
const SWITCH_FLAG_KEY = "nf-switching-to";
const MAX_ACCOUNTS = 4;
const FIREBASE_API_KEY = "AIzaSyD2rbBw37_HLLEDWW8Ym5Cmwz3HOaD6KOk";
const AUTH_PERSISTENCE_KEY = `firebase:authUser:${FIREBASE_API_KEY}:[DEFAULT]`;
const DB_NAME = "firebaseLocalStorageDb";
const STORE_NAME = "firebaseLocalStorage";

// ─── Obfuscated Storage ───────────────────────────────────────────────

function obfuscate(data: string): string {
  const encoded = btoa(data);
  const reversed = encoded.split("").reverse().join("");
  return btoa(reversed);
}

function deobfuscate(data: string): string {
  try {
    const reversed = atob(data);
    const normal = reversed.split("").reverse().join("");
    return atob(normal);
  } catch {
    return "";
  }
}

// ─── Linked Account Storage ──────────────────────────────────────────

export function getLinkedAccounts(): LinkedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(deobfuscate(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a: any) =>
        a && typeof a.uid === "string" && typeof a.refreshToken === "string"
    );
  } catch {
    return [];
  }
}

function saveLinkedAccounts(accounts: LinkedAccount[]): void {
  if (typeof window === "undefined") return;
  const cleaned = accounts.slice(0, MAX_ACCOUNTS);
  localStorage.setItem(STORAGE_KEY, obfuscate(JSON.stringify(cleaned)));
}

// ─── Snapshot current Firebase user into linked accounts ────────────

function captureCurrentUser(): LinkedAccount | null {
  const u = auth.currentUser;
  if (!u) return null;
  const refreshToken =
    (u as any)?.stsTokenManager?.refreshToken ||
    (u as any)?.refreshToken ||
    "";
  if (!refreshToken) return null;
  return {
    uid: u.uid,
    displayName: u.displayName || "",
    photoURL: u.photoURL || "",
    email: u.email || "",
    refreshToken,
    linkedAt: new Date().toISOString(),
  };
}

export function syncCurrentUserToLinkedAccounts(): void {
  const entry = captureCurrentUser();
  if (!entry) return;
  const accounts = getLinkedAccounts();
  const idx = accounts.findIndex((a) => a.uid === entry.uid);
  if (idx >= 0) {
    accounts[idx] = { ...accounts[idx], ...entry };
  } else {
    accounts.push(entry);
  }
  saveLinkedAccounts(accounts.slice(0, MAX_ACCOUNTS));
  setLastActiveUid(entry.uid);
}

// ─── Firebase Auth Persistence Helpers ──────────────────────────────
// These directly manage the IndexedDB data that Firebase Auth uses via
// browserLocalPersistence, allowing us to restore a session from stored
// refresh tokens without any popup or redirect.

function openFirebaseDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getFromFirebaseDb(db: IDBDatabase): Promise<Record<string, unknown> | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(AUTH_PERSISTENCE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function putToFirebaseDb(db: IDBDatabase, value: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, AUTH_PERSISTENCE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function removeFromFirebaseDb(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(AUTH_PERSISTENCE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Token Exchange via Firebase REST API ──────────────────────────

export async function exchangeRefreshToken(
  refreshToken: string
): Promise<{
  idToken: string;
  refreshToken: string;
  uid: string;
} | null> {
  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      idToken: data.id_token || "",
      refreshToken: data.refresh_token || "",
      uid: data.user_id || "",
    };
  } catch {
    return null;
  }
}

// ─── Restore a Firebase Auth session from a stored refresh token ───
// This is the core of the token-based switching approach:
//
//   1. Exchange stored refresh token for fresh Firebase tokens (REST API)
//   2. Read the EXACT persistence format Firebase currently uses
//      (to guarantee compatibility with the SDK version)
//   3. Sign out — this clears Firebase's IndexedDB persistence
//   4. Write the new user's data to persistence in the exact same format
//   5. Return success → caller does window.location.reload()
//
//    When the page reloads, Firebase Auth reads from IndexedDB,
//    finds the new user's valid session, and initializes with it.
//    This passes all Firestore Security Rules because the tokens
//    are genuine Firebase Auth tokens.

export async function restoreSession(
  refreshToken: string
): Promise<{ success: boolean; error?: string; uid?: string }> {
  try {
    // Step 1: Exchange the stored refresh token for fresh tokens
    const tokens = await exchangeRefreshToken(refreshToken);
    if (!tokens || !tokens.idToken || !tokens.uid) {
      return { success: false, error: "Token expired or invalid" };
    }

    // Step 2: Get the current persistence data to clone its exact format
    let existingFormat: Record<string, unknown> | null = null;
    let db: IDBDatabase | null = null;
    try {
      db = await openFirebaseDb();
      existingFormat = await getFromFirebaseDb(db);
    } catch {
      // IndexedDB might not be available — fallback to localStorage format
    }

    // Step 3: Sign out current user — this clears Firebase persistence
    await signOut(auth);

    // Small delay to ensure IndexedDB write-ahead log flushes
    await new Promise((r) => setTimeout(r, 150));

    // Step 4: Write new session data to persistence
    if (existingFormat && db) {
      // Clone the existing persisted format and swap uid + tokens.
      // This guarantees the data structure matches what this Firebase
      // SDK version expects.
      const cloned = JSON.parse(JSON.stringify(existingFormat));
      cloned.uid = tokens.uid;
      if (cloned.stsTokenManager) {
        cloned.stsTokenManager.refreshToken = tokens.refreshToken;
        cloned.stsTokenManager.accessToken = tokens.idToken;
        cloned.stsTokenManager.expirationTime = Date.now() + 3600000;
      }
      if (cloned.lastLoginAt) cloned.lastLoginAt = String(Date.now());
      try {
        await putToFirebaseDb(db, cloned);
      } catch (e) {
        // If write fails, try clearing and re-writing
        await removeFromFirebaseDb(db);
        await putToFirebaseDb(db, cloned);
      }
      db.close();
    } else {
      // No existing data — construct our own in the expected format
      // Read the linked account for display info
      const accounts = getLinkedAccounts();
      const acc = accounts.find((a) => a.refreshToken === refreshToken);
      const sessionData: Record<string, unknown> = {
        uid: tokens.uid,
        displayName: acc?.displayName || "",
        photoURL: acc?.photoURL || "",
        email: acc?.email || "",
        emailVerified: true,
        isAnonymous: false,
        providerData: [
          {
            uid: acc?.email || tokens.uid,
            displayName: acc?.displayName || "",
            photoURL: acc?.photoURL || "",
            email: acc?.email || "",
            providerId: "google.com",
          },
        ],
        stsTokenManager: {
          refreshToken: tokens.refreshToken,
          accessToken: tokens.idToken,
          expirationTime: Date.now() + 3600000,
        },
        createdAt: new Date().toISOString(),
        lastLoginAt: String(Date.now()),
      };
      try {
        if (!db) db = await openFirebaseDb();
        await putToFirebaseDb(db, sessionData);
        db.close();
      } catch {
        // Final fallback: write to localStorage
        try {
          localStorage.setItem(
            AUTH_PERSISTENCE_KEY,
            JSON.stringify(sessionData)
          );
        } catch {}
      }
    }

    // Step 5: Update the stored refresh token (in case REST API issued new one)
    const updatedAccounts = getLinkedAccounts();
    const updated = updatedAccounts.map((a) =>
      a.refreshToken === refreshToken
        ? { ...a, refreshToken: tokens.refreshToken }
        : a
    );
    saveLinkedAccounts(updated);

    return { success: true, uid: tokens.uid };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

// ─── Add a new account via Google popup ────────────────────────────
// Popup only shows when user clicks "Add new account".

export async function addNewAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  const accounts = getLinkedAccounts();
  if (accounts.length >= MAX_ACCOUNTS) {
    return { success: false, error: "Max accounts reached" };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
    return { success: true };
  } catch (e: any) {
    if (
      e?.code !== "auth/popup-closed-by-user" &&
      e?.code !== "auth/cancelled-popup-request"
    ) {
      return { success: false, error: e?.message || "Popup failed" };
    }
    return { success: false, error: "User cancelled" };
  }
}

// ─── Remove a linked account ───────────────────────────────────────

export function removeLinkedAccount(uid: string): LinkedAccount[] {
  const accounts = getLinkedAccounts();
  const updated = accounts.filter((a) => a.uid !== uid);
  saveLinkedAccounts(updated);
  return updated;
}

// ─── Switch flag (for post-reload detection) ──────────────────────

export function getPendingSwitchUid(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SWITCH_FLAG_KEY);
}

export function clearPendingSwitch(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SWITCH_FLAG_KEY);
}

// ─── Account Picker Settings ─────────────────────────────────────
const PICKER_KEY = "nf-show-account-picker";
const PICKER_SKIP_KEY = "nf-picker-skipped";

export function getShowAccountPickerSetting(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PICKER_KEY) === "true";
}

export function setShowAccountPickerSetting(val: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PICKER_KEY, String(val));
}

// ─── Picker Session Skip ─────────────────────────────────────────
// sessionStorage flag prevents showing picker after account switch
// reload within the same tab session.

export function isPickerSkipped(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PICKER_SKIP_KEY) === "true";
}

export function setPickerSkipped(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PICKER_SKIP_KEY, "true");
}

// ─── Account Data Cache (instant load for picker) ────────────────
const CACHE_KEY = "nf-accounts-cache";

interface CacheEntry {
  xp: number;
  karma: number;
  updatedAt: number;
}

export interface AccountCacheData {
  [uid: string]: CacheEntry;
}

export function getAccountCache(): AccountCacheData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function updateAccountCache(uid: string, data: { xp?: number; karma?: number }): void {
  if (typeof window === "undefined") return;
  const cache = getAccountCache();
  const prev = cache[uid];
  cache[uid] = {
    xp: data.xp ?? prev?.xp ?? 0,
    karma: data.karma ?? prev?.karma ?? 0,
    updatedAt: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// ─── Last Active Account ─────────────────────────────────────────
const LAST_ACTIVE_KEY = "nf-last-active";

export function getLastActiveUid(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_ACTIVE_KEY);
}

export function setLastActiveUid(uid: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACTIVE_KEY, uid);
}
