"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

interface CachedCommunity {
  name: string;
  label: string;
  img: string;
  members: number;
  creatorUid?: string;
}

interface CachedData {
  communities: CachedCommunity[];
  joinedCommunities: string[];
  unreadCount: number;
  loading: boolean;
  refreshCommunities: () => void;
  refreshUnread: () => void;
}

const DataContext = createContext<CachedData>({
  communities: [],
  joinedCommunities: [],
  unreadCount: 0,
  loading: true,
  refreshCommunities: () => {},
  refreshUnread: () => {},
});

const EXCLUDED_NAMES_LOWER = new Set(["unity", "unreal", "godot", "blender"]);
function isExcluded(name: string) { return EXCLUDED_NAMES_LOWER.has(name.toLowerCase()); }

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CachedCommunity[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsub = onSnapshot(collection(db, "communities"), (snap) => {
      if (!active) return;
      setCommunities(snap.docs
        .map((d) => {
          const data = d.data();
          const name = data.name || d.id;
          return { name, label: `n/${name}`, img: data.img || "", members: data.memberCount || 0, creatorUid: data.creatorUid || undefined, showInForum: data.showInForum !== false };
        })
        .filter((c) => !isExcluded(c.name) && c.showInForum)
      );
      setLoading(false);
    }, () => {
      if (active) { setCommunities([]); setLoading(false); }
    });
    return () => { active = false; unsub(); };
  }, []);

  useEffect(() => {
    if (!user) { setJoinedCommunities([]); return; }
    const unsub = onSnapshot(collection(db, "users", user.uid, "communities"), (snap) => {
      setJoinedCommunities(snap.docs.map((d) => d.data().name || d.id));
    }, () => setJoinedCommunities([]));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const q2 = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false), limit(99));
      const unsub = onSnapshot(q2, (snap) => { setUnreadCount(snap.size); }, () => {});
      return () => unsub();
    } catch {}
  }, [user]);

  const refreshCommunities = useCallback(async () => {
    try {
      const { getDocs } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "communities"));
      setCommunities(snap.docs
        .map((d) => {
          const data = d.data();
          const name = data.name || d.id;
          return { name, label: `n/${name}`, img: data.img || "", members: data.memberCount || 0, creatorUid: data.creatorUid || undefined, showInForum: data.showInForum !== false };
        })
        .filter((c) => !isExcluded(c.name) && c.showInForum)
      );
      setLoading(false);
    } catch (error) {
      console.error("Error refreshing communities:", error);
    }
  }, []);

  const refreshUnread = useCallback(() => {}, []);

  return (
    <DataContext.Provider value={{ communities, joinedCommunities, unreadCount, loading, refreshCommunities, refreshUnread }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
