"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, limit, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

interface CachedCommunity {
  name: string;
  label: string;
  img: string;
  members: number;
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

const COMMUNITY_IMAGES: Record<string, string> = {
  Unity: "/assets/images/unitylogo.png",
  Unreal: "/assets/images/unreallogo.svg",
  Godot: "/assets/images/godotlogo.png",
  Blender: "/assets/images/logoblender.png",
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CachedCommunity[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  // Fetch all communities (cached, rarely changes)
  const refreshCommunities = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "communities"));
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          name: data.name || d.id,
          label: `n/${data.name || d.id}`,
          img: COMMUNITY_IMAGES[data.name || d.id] || data.img || "",
          members: data.memberCount || 0,
        };
      });
      setCommunities(items.length > 0 ? items : Object.keys(COMMUNITY_IMAGES).map((name) => ({
        name, label: `n/${name}`, img: COMMUNITY_IMAGES[name], members: 0,
      })));
    } catch {
      // Fallback to static list
      setCommunities(Object.keys(COMMUNITY_IMAGES).map((name) => ({
        name, label: `n/${name}`, img: COMMUNITY_IMAGES[name], members: 0,
      })));
    }
  }, []);

  // Fetch joined communities for current user
  const refreshJoined = useCallback(async () => {
    if (!user) { setJoinedCommunities([]); return; }
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "communities"));
      setJoinedCommunities(snap.docs.map((d) => d.data().name || d.id));
    } catch {
      setJoinedCommunities([]);
    }
  }, [user]);

  // Real-time unread count (replaces polling in SidebarLeft + Navbar)
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const q2 = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false), limit(99));
      const unsub = onSnapshot(q2, (snap) => {
        setUnreadCount(snap.size);
      }, () => {});
      unsubRef.current = unsub;
      return () => { unsub(); unsubRef.current = null; };
    } catch {}
  }, [user]);

  // Initial load
  useEffect(() => {
    Promise.all([refreshCommunities(), refreshJoined()]).finally(() => setLoading(false));
  }, [refreshCommunities, refreshJoined]);

  // Refresh joined when user changes
  useEffect(() => { refreshJoined(); }, [user, refreshJoined]);

  const refreshUnread = useCallback(() => {
    // onSnapshot handles this automatically
  }, []);

  return (
    <DataContext.Provider value={{
      communities,
      joinedCommunities,
      unreadCount,
      loading,
      refreshCommunities,
      refreshUnread,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
