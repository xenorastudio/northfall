"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { collection, query, where, limit, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { mergeInterestsOrdered, normalizeInterestTags } from "@/lib/user-interests";

interface CachedCommunity {
  name: string;
  label: string;
  img: string;
  members: number;
  creatorUid?: string;
  category?: string;
  shortDesc?: string;
  showInForum?: boolean;
  isMature?: boolean;
  communityType?: string;
}

interface CachedData {
  communities: CachedCommunity[];
  joinedCommunities: string[];
  favoriteCommunities: string[];
  userInterests: string[];
  interestTagWeights: Record<string, number>;
  pushUserInterests: (tags: string[]) => void;
  unreadCount: number;
  loading: boolean;
  refreshCommunities: () => void;
  refreshUnread: () => void;
}

const DataContext = createContext<CachedData>({
  communities: [],
  joinedCommunities: [],
  favoriteCommunities: [],
  userInterests: [],
  interestTagWeights: {},
  pushUserInterests: () => {},
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
  const [favoriteCommunities, setFavoriteCommunities] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [interestTagWeights, setInterestTagWeights] = useState<Record<string, number>>({});
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
          const communityType =
            data.communityType ||
            (data.modLevel === "restrict" ? "private" : data.modLevel === "moderate" ? "restricted" : "public");
          return {
            name, label: `n/${name}`, img: data.img || "", members: data.memberCount || 0,
            creatorUid: data.creatorUid || undefined, showInForum: data.showInForum !== false,
            category: data.category || "", shortDesc: data.shortDesc || "",
            isMature: !!data.isMature,
            communityType,
          };
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
    if (!user) {
      setUserInterests([]);
      setInterestTagWeights({});
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const raw = snap.exists() ? snap.data().userInterests : [];
      setUserInterests(
        Array.isArray(raw) ? normalizeInterestTags(raw.map(String)) : []
      );
      const w = snap.exists() ? snap.data().interestTagWeights : null;
      if (w && typeof w === "object" && !Array.isArray(w)) {
        const parsed: Record<string, number> = {};
        for (const [k, v] of Object.entries(w)) {
          if (typeof v === "number" && Number.isFinite(v)) parsed[k] = v;
        }
        setInterestTagWeights(parsed);
      } else {
        setInterestTagWeights({});
      }
    }, () => {
      setUserInterests([]);
      setInterestTagWeights({});
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) { setJoinedCommunities([]); setFavoriteCommunities([]); return; }
    const unsub = onSnapshot(collection(db, "users", user.uid, "communities"), (snap) => {
      const joined: string[] = [];
      const favs: string[] = [];
      snap.docs.forEach((d) => {
        const n = d.data().name || d.id;
        joined.push(n);
        if (d.data().isFavorite) favs.push(n);
      });
      setJoinedCommunities(joined);
      setFavoriteCommunities(favs);
    }, () => { setJoinedCommunities([]); setFavoriteCommunities([]); });
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
          const communityType =
            data.communityType ||
            (data.modLevel === "restrict" ? "private" : data.modLevel === "moderate" ? "restricted" : "public");
          return {
            name, label: `n/${name}`, img: data.img || "", members: data.memberCount || 0,
            creatorUid: data.creatorUid || undefined, showInForum: data.showInForum !== false,
            category: data.category || "", shortDesc: data.shortDesc || "",
            isMature: !!data.isMature,
            communityType,
          };
        })
        .filter((c) => !isExcluded(c.name) && c.showInForum)
      );
      setLoading(false);
    } catch (error) {
      console.error("Error refreshing communities:", error);
    }
  }, []);

  const refreshUnread = useCallback(() => {}, []);

  const pushUserInterests = useCallback((tags: string[]) => {
    setUserInterests((prev) => mergeInterestsOrdered(prev, tags));
  }, []);

  useEffect(() => {
    const onPush = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail;
      if (!Array.isArray(detail) || !detail.length) return;
      setUserInterests((prev) => mergeInterestsOrdered(prev, detail));
    };
    window.addEventListener("nf-push-interests", onPush);
    return () => window.removeEventListener("nf-push-interests", onPush);
  }, []);

  return (
    <DataContext.Provider value={{ communities, joinedCommunities, favoriteCommunities, userInterests, interestTagWeights, pushUserInterests, unreadCount, loading, refreshCommunities, refreshUnread }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
