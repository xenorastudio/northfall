"use client";

import { motion } from "framer-motion";
import { Users, Star, MessageSquare, LogIn, Flame, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, deleteDoc, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PostCard from "./PostCard";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { cn } from "@/lib/utils";

interface CommunityPageProps {
  name: string;
  onBack: () => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  onPostClick?: (id: string) => void;
  onJoinToggle?: (name: string, joined: boolean) => void;
}

const communityMeta: Record<string, { img: string; banner: string; desc: string; rules: string[]; tags: string[]; bookmarks: { label: string; url: string; icon?: string }[] }> = {
  Unity: {
    img: "/assets/images/unitylogo.png",
    banner: "/assets/images/bannerunity.png",
    desc: "مكانك لو حابب تتعلم Unity وتشارك مشاريعك مع مطورين عرب. تواصل، اسأل، واطلع شغلك للعالم.",
    rules: ["احترام الجميع", "المحتوى متعلق بـ Unity", "لا سبام"],
    tags: ["Unity", "GameDev", "C#"],
    bookmarks: [
      { label: "Unity Documentation", url: "https://docs.unity3d.com/" },
      { label: "Unity Learn", url: "https://learn.unity.com/" },
      { label: "Unity Asset Store", url: "https://assetstore.unity.com/" },
      { label: "Unity Forum", url: "https://forum.unity.com/" },
      { label: "Unity Discord", url: "https://discord.gg/unity" },
    ],
  },
  Godot: {
    img: "/assets/images/godotlogo.png",
    banner: "/assets/images/godotbanner.png",
    desc: "المحرك المفتوح اللي بيسمح لك تعمل لعبتك بلا قيود. من 2D لـ 3D — تعال شارك تجربتك وساعد غيرك يبدأ.",
    rules: ["احترام الجميع", "المحتوى متعلق بـ Godot", "لا سبام"],
    tags: ["Godot", "OpenSource", "GDScript"],
    bookmarks: [
      { label: "Godot Documentation", url: "https://docs.godotengine.org/" },
      { label: "Godot Q&A", url: "https://godotengine.org/qa/" },
      { label: "Godot Assets", url: "https://godotengine.org/asset-library/" },
      { label: "Godot Discord", url: "https://discord.gg/godot" },
    ],
  },
  Blender: {
    img: "/assets/images/logoblender.png",
    banner: "/assets/images/bannerblender.png",
    desc: "من النمذجة للأنيميشن للرندر — كل شي بيتعمل بـ Blender. اعرض أعمالك وتعلم تقنيات جديدة مع مجتمع يفهمك.",
    rules: ["احترام الجميع", "المحتوى متعلق بـ Blender", "لا سبام"],
    tags: ["Blender", "3D", "Modeling"],
    bookmarks: [
      { label: "Blender Documentation", url: "https://docs.blender.org/" },
      { label: "Blender Artists", url: "https://blenderartists.org/" },
      { label: "Blender Market", url: "https://blendermarket.com/" },
      { label: "Blender Discord", url: "https://discord.gg/blender" },
    ],
  },
};

export default function CommunityPage({ name, onBack, onEditClick, onDeleteClick, onPostClick, onJoinToggle }: CommunityPageProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"posts" | "forums">("posts");
  const [sortMode, setSortMode] = useState<"new" | "top" | "comments">("new");
  const meta = communityMeta[name] || { img: "", banner: "", desc: `مجتمع n/${name}`, rules: [], tags: [], bookmarks: [] };

  // Check if user is a member
  useEffect(() => {
    if (!user) { setJoined(false); return; }
    getDoc(doc(db, "communities", name, "members", user.uid)).then(s => setJoined(s.exists())).catch(() => {});
  }, [user, name]);

  // Fetch member count (one-time)
  useEffect(() => {
    getCountFromServer(collection(db, "communities", name, "members")).then(s => setMemberCount(s.data().count)).catch(() => {});
  }, [name]);

  const toggleJoin = async () => {
    if (!user) return;
    const prevJoined = joined;
    setJoined(!prevJoined); // Optimistic UI
    try {
      const memberRef = doc(db, "communities", name, "members", user.uid);
      const userCommRef = doc(db, "users", user.uid, "communities", name);
      if (prevJoined) {
        await deleteDoc(memberRef).catch(() => {});
        await deleteDoc(userCommRef);
      } else {
        await setDoc(memberRef, { uid: user.uid, joinedAt: new Date().toISOString() }).catch(() => {});
        await setDoc(userCommRef, { name, joinedAt: new Date().toISOString() });
      }
      onJoinToggle?.(name, !prevJoined);
    } catch (e) {
      setJoined(prevJoined); // Revert on error
    }
  };

  useEffect(() => {
    async function fetch() {
      try {
        const q = query(collection(db, "posts"), where("community", "==", name), limit(10));
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setPosts(docs);
      } catch (e) {
        console.error(e);
        try {
          const q2 = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10));
          const snap2 = await getDocs(q2);
          setPosts(snap2.docs.filter((d) => d.data().community === name).map((d) => ({ id: d.id, ...d.data() })));
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [name]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Banner */}
      <div className="relative h-[180px] rounded-xl overflow-hidden mb-3">
        {meta.banner ? (
          <img src={meta.banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-l from-nf-secondary to-nf-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-nf-primary via-nf-primary/40 to-transparent" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 px-1 -mt-10 relative z-10 mb-4">
        {meta.img ? (
          <img src={meta.img} alt="" className="w-16 h-16 rounded-full border-4 border-nf-primary bg-nf-primary shadow-lg" />
        ) : (
          <div className="w-16 h-16 rounded-full border-4 border-nf-primary bg-nf-secondary shadow-lg flex items-center justify-center text-nf-accent font-bold text-lg">n/</div>
        )}
        <div className="flex-1 pt-3">
          <h1 className="text-xl font-bold text-white">n/{name}</h1>
          <p className="text-xs text-nf-muted mt-1 leading-relaxed line-clamp-2">{meta.desc}</p>
        </div>
        <button
          onClick={() => user ? toggleJoin() : undefined}
          className={`mt-3 px-5 py-1.5 rounded-full text-sm font-bold border transition-colors ${
            joined ? "bg-nf-secondary text-nf-muted border-nf-border" : "bg-white text-black border-white hover:bg-gray-200"
          }`}
        >
          {!user ? <span className="flex items-center gap-1.5"><LogIn size={14} /> {t("gen.loginToJoin")}</span> : joined ? t("cp.member") : t("cp.join")}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-5 px-1 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-nf-muted">
          <Users size={14} />
          <span className="font-bold text-white">{memberCount > 0 ? memberCount.toLocaleString() : "—"}</span> {t("cp.members")}
        </div>
        <div className="flex items-center gap-1.5 text-nf-muted">
          <Star size={14} />
          <span className="font-bold text-white">{posts.length}</span> {t("cp.posts")}
        </div>
      </div>

      {/* About Community card */}
      <div className="bg-nf-primary border border-nf-border-2 rounded-lg p-4 mb-4">
        <h3 className="font-bold text-white text-sm mb-2">{t("cp.aboutCommunity")}</h3>
        <p className="text-xs text-nf-muted leading-relaxed mb-3">{meta.desc}</p>
        {meta.rules && meta.rules.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-nf-dim uppercase tracking-wider mb-1.5">{t("cp.communityRules")}</p>
            <div className="space-y-1">
              {meta.rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-nf-muted">
                  <span className="w-4 h-4 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] font-bold text-nf-dim shrink-0">{i + 1}</span>
                  {rule}
                </div>
              ))}
            </div>
          </div>
        )}
        {meta.tags && meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meta.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-nf-accent/10 text-[10px] font-medium text-nf-accent">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Switcher: Posts / Forums */}
      <div className="flex items-center gap-1 mb-3 bg-nf-secondary/30 border border-nf-border-2/50 rounded-xl px-2 py-1">
        <button onClick={() => setActiveTab("posts")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
          activeTab === "posts" ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted")}>
          <MessageSquare size={12} /> المنشورات
        </button>
        <button onClick={() => setActiveTab("forums")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
          activeTab === "forums" ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted")}>
          <MessageSquare size={12} /> المنتدى
        </button>
      </div>

      {activeTab === "forums" ? (
        <div className="text-center py-12">
          <MessageSquare size={28} className="mx-auto text-nf-dim/15 mb-3" />
          <p className="text-[14px] font-bold text-nf-muted mb-2">المنتدى في صفحة مستقلة</p>
          <button onClick={() => window.open("/NewPage", "_blank")} className="bg-nf-accent/12 text-nf-accent px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-nf-accent/20 transition-colors">فتح المنتدى</button>
        </div>
      ) : (
      <>
      <div className="flex items-center gap-2 mb-3 bg-nf-secondary/30 border border-nf-border-2/50 rounded-xl px-2 py-1.5">
        {[
          { id: "new" as const, icon: Clock, label: "جديد" },
          { id: "top" as const, icon: TrendingUp, label: "الأعلى" },
          { id: "comments" as const, icon: MessageSquare, label: "تعليقات" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSortMode(s.id)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200",
              sortMode === s.id ? "bg-nf-accent/15 text-nf-accent shadow-sm shadow-nf-accent/10" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted")}>
              <Icon size={12} /> {s.label}
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-8 text-nf-muted text-sm">{t("gen.loading")}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-nf-muted">
            <p className="font-bold">{t("cp.noPosts")}</p>
          </div>
        ) : (
          [...posts].sort((a, b) => {
            if (sortMode === "top") return (b.votes || 0) - (a.votes || 0);
            if (sortMode === "comments") return (b.commentCount || 0) - (a.commentCount || 0);
            return 0;
          }).map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              community={`n/${post.community || name}`}
              author={post.authorName || t("gen.user")}
              authorUid={post.authorUid}
              authorPhoto={post.authorPhoto}
              time={post.createdAt || t("gen.now")}
              title={post.title}
              body={post.body}
              image={post.imageUrl}
              imageUrls={post.imageUrls}
              flair={post.flair}
              isNsfw={post.isNsfw}
              isSpoiler={post.isSpoiler}
              votes={post.votes || 0}
              comments={post.commentCount || 0}
              awards={post.awards}
              poll={post.poll}
              onPostClick={onPostClick}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
            />
          ))
        )}
      </div>
      </>
      )}
    </motion.div>
  );
}
