"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Star, Gamepad2, Heart, X, Search, ChevronLeft, Users, Calendar, Tag } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Game {
  id: string;
  name: string;
  cover: string;
  publisher: string;
  developer: string;
  genre: string[];
  rating: number;
  releaseYear: number;
  description: string;
  platforms: string[];
  players: string;
}

const GAMES: Game[] = [
  { id: "among-us", name: "Among Us", cover: "/assets/GameCovor/Among Us.png", publisher: "InnerSloth", developer: "InnerSloth", genre: ["اجتماعي", "بقاء"], rating: 4.2, releaseYear: 2018, description: "لعبة اجتماعية حيث يحاول أفراد الطاقم إكمال المهام بينما يتسلل المنتحلون للقضاء عليهم. العب مع أصدقائك واكشف المنتحل!", platforms: ["PC", "Mobile", "Switch"], players: "4-15" },
  { id: "apex-legends", name: "Apex Legends", cover: "/assets/GameCovor/Apex Legends .png", publisher: "EA", developer: "Respawn Entertainment", genre: ["Battle Royale", "شوتر"], rating: 4.5, releaseYear: 2019, description: "لعبة Battle Royale مجانية مع شخصيات فريدة لكل واحدة قدرات خاصة. قاتل في فرق من 3 وكن آخر من يبقى!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "60" },
  { id: "ac-mirage", name: "Assassin's Creed Mirage", cover: "/assets/GameCovor/Assassin's Creed Mirage.png", publisher: "Ubisoft", developer: "Ubisoft Bordeaux", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.0, releaseYear: 2023, description: "عودة لأصول السلسلة مع بصرام في بغداد القديمة. تسلل، اغتال، واستكشف المدينة الأسطورية.", platforms: ["PC", "PS5", "Xbox Series"], players: "1" },
  { id: "ac-valhalla", name: "Assassin's Creed Valhalla", cover: "/assets/GameCovor/Assassin's Creed Valhalla.png", publisher: "Ubisoft", developer: "Ubisoft Montreal", genre: ["أكشن-مغامرة", "RPG"], rating: 4.3, releaseYear: 2020, description: "عش قصة إيفور الفايكنغ واكتشف إنجلترا في عصر الفايكنغ. ابنِ مستوطنتك وقاتل من أجل مجدك.", platforms: ["PC", "PS", "Xbox"], players: "1" },
  { id: "civilization-vi", name: "Civilization VI", cover: "/assets/GameCovor/Civilization VI.png", publisher: "2K Games", developer: "Firaxis Games", genre: ["استراتيجية", "4X"], rating: 4.6, releaseYear: 2016, description: "ابنِ إمبراطورية تدوم عبر العصور. قُد حضارتك من العصر الحجري حتى عصر المعلومات وكن أعظم قائد في التاريخ.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1-12" },
  { id: "cs2", name: "Counter-Strike 2", cover: "/assets/GameCovor/Counter-Strike 2.png", publisher: "Valve", developer: "Valve", genre: ["شوتر", "تنافسي"], rating: 4.7, releaseYear: 2023, description: "الإصدار الجديد من أشهر لعبة شوتر تكتيكية. رسومات جديدة، سموك جديد، ونظام تصنيف محدّث.", platforms: ["PC"], players: "5v5" },
  { id: "cyberpunk-2077", name: "Cyberpunk 2077", cover: "/assets/GameCovor/Cyberpunk 2077.png", publisher: "CD Projekt", developer: "CD Projekt Red", genre: ["RPG", "أكشن"], rating: 4.4, releaseYear: 2020, description: "مغامرة RPG في مدينة نايت سيتي المستقبلية. خصّص شخصيتك، اكتشف العالم المفتوح، واتبع قصة V.", platforms: ["PC", "PS5", "Xbox Series"], players: "1" },
  { id: "dead-by-daylight", name: "Dead by Daylight", cover: "/assets/GameCovor/Dead by Daylight.png", publisher: "Behaviour Interactive", developer: "Behaviour Interactive", genre: ["رعب", "بقاء"], rating: 4.1, releaseYear: 2016, description: "لعبة رعب غير متماثلة. العب كقاتل أو كناجٍ وحاول الهروب. شخصيات من أشهر أفلام الرعب!", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "5" },
  { id: "ea-fc-24", name: "EA Sports FC 24", cover: "/assets/GameCovor/EA Sports FC 24.png", publisher: "EA", developer: "EA Canada", genre: ["رياضة", "محاكاة"], rating: 3.8, releaseYear: 2023, description: "لعبة كرة القدم الجيل الجديد مع HyperMotion V وتقنيات PlayStyles. العب مع أفضل اللاعبين والفرق في العالم.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-22" },
  { id: "elden-ring", name: "Elden Ring", cover: "/assets/GameCovor/Elden Ring.png", publisher: "Bandai Namco", developer: "FromSoftware", genre: ["RPG", "أكشن", "عالم مفتوح"], rating: 4.9, releaseYear: 2022, description: "تحفة FromSoftware مع عالم مفتوح ضخم صمّمه ميازاكي وجورج آر آر مارتن. استكشف الأراضي البينية وقاتل الرؤساء الأسطوريين.", platforms: ["PC", "PS", "Xbox"], players: "1-4" },
  { id: "f1-23", name: "F1 23", cover: "/assets/GameCovor/F1 23.png", publisher: "EA", developer: "Codemasters", genre: ["سباق", "رياضة"], rating: 4.0, releaseYear: 2023, description: "عش تجربة الفورمولا 1 الرسمية مع سيارات و حلقات موسم 2023. سباقات واقعية وأوضاع لعب متعددة.", platforms: ["PC", "PS", "Xbox"], players: "1-20" },
  { id: "forza-horizon-5", name: "Forza Horizon 5", cover: "/assets/GameCovor/Forza Horizon 5.png", publisher: "Xbox Game Studios", developer: "Playground Games", genre: ["سباق", "عالم مفتوح"], rating: 4.7, releaseYear: 2021, description: "سباقات في المكسيك! عالم مفتوح مع مناظر خلابة، أكثر من 500 سيارة، وأوضاع لعب متنوعة.", platforms: ["PC", "Xbox"], players: "1-72" },
  { id: "garrys-mod", name: "Garry's Mod", cover: "/assets/GameCovor/Garry's Mod.png", publisher: "Valve", developer: "Facepunch Studios", genre: ["صندوق رمل", "إبداعي"], rating: 4.3, releaseYear: 2006, description: "صندوق رمل بلا حدود! ابنِ أي شي تريده، العب مودات المجتمع، أو اصنع لعبتك الخاصة.", platforms: ["PC"], players: "1-64" },
  { id: "god-of-war", name: "God of War", cover: "/assets/GameCovor/God of War.png", publisher: "PlayStation Studios", developer: "Santa Monica Studio", genre: ["أكشن-مغامرة", "RPG"], rating: 4.8, releaseYear: 2022, description: "رحلة كريتوس وابنه أتريوس في أساطير الشمال. قتال عنيف، قصة مؤثرة، وعالم مبهر.", platforms: ["PC", "PS"], players: "1" },
  { id: "hades", name: "Hades", cover: "/assets/GameCovor/Hades.png", publisher: "Supergiant Games", developer: "Supergiant Games", genre: ["Roguelike", "أكشن"], rating: 4.8, releaseYear: 2020, description: "حاول الهروب من العالم السفلي اليوناني! قتال سريع، قصة رائعة، وكل محاولة تكتشف المزيد.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1" },
  { id: "hogwarts-legacy", name: "Hogwarts Legacy", cover: "/assets/GameCovor/Hogwarts Legacy.png", publisher: "Warner Bros.", developer: "Avalanche Software", genre: ["RPG", "عالم مفتوح"], rating: 4.5, releaseYear: 2023, description: "عش عالم هاري بوتر! التحق بهوغوورتس، تعلم السحر، واكتشف أسرار العالم السحري في القرن التاسع عشر.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1" },
  { id: "minecraft", name: "Minecraft", cover: "/assets/GameCovor/Minecraft.png", publisher: "Mojang", developer: "Mojang Studios", genre: ["صندوق رمل", "بقاء"], rating: 4.7, releaseYear: 2011, description: "اللعبة الأكثر مبيعاً في التاريخ! ابنِ، استكشف، وابقَ على قيد الحياة في عالم من المكعبات.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1-∞" },
  { id: "nfs-heat", name: "Need for Speed Heat", cover: "/assets/GameCovor/Need for Speed Heat.png", publisher: "EA", developer: "Ghost Games", genre: ["سباق", "أكشن"], rating: 3.9, releaseYear: 2019, description: "سباقات نهارية قانونية وسباقات ليلية غير قانونية. خصّص سيارتك واهرب من الشرطة!", platforms: ["PC", "PS", "Xbox"], players: "1-16" },
  { id: "outlast", name: "Outlast", cover: "/assets/GameCovor/Outlast.png", publisher: "Red Barrels", developer: "Red Barrels", genre: ["رعب", "بقاء"], rating: 4.2, releaseYear: 2013, description: "صحفي يتسلل لمستشفى نفسية مهجور... لكنه ليس وحيداً. لا سلاح، فقط كاميرا وقلبك يخفق!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1" },
  { id: "overwatch-2", name: "Overwatch 2", cover: "/assets/GameCovor/Overwatch 2.png", publisher: "Blizzard", developer: "Blizzard Entertainment", genre: ["شوتر", "تنافسي"], rating: 4.0, releaseYear: 2022, description: "شوتر أبطال 5v5 مع شخصيات فريدة. العب Push الجديد والخرائط الجديدة مع أصدقائك!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "5v5" },
  { id: "phasmophobia", name: "Phasmophobia", cover: "/assets/GameCovor/Phasmophobia.png", publisher: "Kinetic Games", developer: "Kinetic Games", genre: ["رعب", "تعاوني"], rating: 4.3, releaseYear: 2020, description: "لعبة رعب تعاونية! أنت وفريقكم صيادو أشباح. استخدموا المعدات لتحديد نوع الشبح ونجوا!", platforms: ["PC"], players: "1-4" },
  { id: "r6-siege", name: "Rainbow Six Siege", cover: "/assets/GameCovor/Rainbow Six Siege.png", publisher: "Ubisoft", developer: "Ubisoft Montreal", genre: ["شوتر", "تكتيكي"], rating: 4.4, releaseYear: 2015, description: "شوتر تكتيكي 5v5 مع تدمير بيئي. كل عامل قدرات فريدة. خطط، نفّذ، وانتصر!", platforms: ["PC", "PS", "Xbox"], players: "5v5" },
  { id: "rdr2", name: "Red Dead Redemption 2", cover: "/assets/GameCovor/Red Dead Redemption 2.png", publisher: "Rockstar Games", developer: "Rockstar Games", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.9, releaseYear: 2018, description: "تحفة روكستار. عش قصة آرثر مورغان والعصابة في الغرب الأمريكي المتلاشي. عالم حي وقصة لا تُنسى.", platforms: ["PC", "PS", "Xbox"], players: "1-32" },
  { id: "re4-remake", name: "Resident Evil 4 Remake", cover: "/assets/GameCovor/Resident Evil 4 Remake.png", publisher: "Capcom", developer: "Capcom", genre: ["رعب", "أكشن"], rating: 4.7, releaseYear: 2023, description: "إعادة صنع تحفة الرعب! ليون كينيدي في مهمة إنقاذ في قرية مرعبة. رسومات مذهلة وقتال محسّن.", platforms: ["PC", "PS", "Xbox"], players: "1" },
  { id: "re-village", name: "Resident Evil Village", cover: "/assets/GameCovor/Resident Evil Village.png", publisher: "Capcom", developer: "Capcom", genre: ["رعب", "أكشن"], rating: 4.3, releaseYear: 2021, description: "إيثان وينترز يبحث عن ابنته المخطوفة في قرية مرعبة. مصاصي دماء، مستذئبين، وأكثر!", platforms: ["PC", "PS", "Xbox"], players: "1" },
  { id: "roblox", name: "Roblox", cover: "/assets/GameCovor/Roblox.png", publisher: "Roblox Corporation", developer: "Roblox Corporation", genre: ["صندوق رمل", "اجتماعي"], rating: 3.7, releaseYear: 2006, description: "منصة ألعاب حيث يمكنك اللعب وإنشاء ألعابك الخاصة! ملايين التجارب من المجتمع.", platforms: ["PC", "Mobile", "Xbox"], players: "1-∞" },
  { id: "sekiro", name: "Sekiro: Shadows Die Twice", cover: "/assets/GameCovor/Sekiro Shadows Die Twice.png", publisher: "Activision", developer: "FromSoftware", genre: ["أكشن", "مغامرة"], rating: 4.7, releaseYear: 2019, description: "نينجا بيد واحدة ينتقم في اليابان الإقطاعية. قتال بالسيوف سريع ومتطلب — لعبة FromSoftware الأصعب!", platforms: ["PC", "PS", "Xbox"], players: "1" },
  { id: "shadow-tomb-raider", name: "Shadow of the Tomb Raider", cover: "/assets/GameCovor/Shadow of the Tomb Raider.png", publisher: "Square Enix", developer: "Eidos Montreal", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.1, releaseYear: 2018, description: "لارا كروفت في أمريكا الجنوبية تكشف نبوءة نهاية العالم. تسلل، استكشف، وقاتل في أجمل أجزاء الثلاثية.", platforms: ["PC", "PS", "Xbox"], players: "1" },
  { id: "stardew-valley", name: "Stardew Valley", cover: "/assets/GameCovor/Stardew Valley.png", publisher: "ConcernedApe", developer: "ConcernedApe", genre: ["محاكاة", "RPG"], rating: 4.8, releaseYear: 2016, description: "اترك المدينة وابدأ مزرعتك! زرع، صيد، تعدين، وبناء علاقات في قرية بيلكينب الخلابة.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1-8" },
  { id: "terraria", name: "Terraria", cover: "/assets/GameCovor/Terraria.png", publisher: "Re-Logic", developer: "Re-Logic", genre: ["بقاء", "استكشاف", "صندوق رمل"], rating: 4.6, releaseYear: 2011, description: "2D بقاء واستكشاف! احفر، ابنِ، قاتل رؤساء، واكتشف عوالم مليئة بالمفاجآت.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1-14" },
  { id: "witcher-3", name: "The Witcher 3: Wild Hunt", cover: "/assets/GameCovor/The Witcher 3 Wild Hunt.png", publisher: "CD Projekt", developer: "CD Projekt Red", genre: ["RPG", "عالم مفتوح"], rating: 4.9, releaseYear: 2015, description: "واحدة من أفضل ألعاب RPG في التاريخ. غيرالت يبحث عن ابنته بالتبني في عالم مفتوح مذهل وقصة لا تُنسى.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1" },
  { id: "warzone", name: "Call of Duty: Warzone", cover: "/assets/GameCovor/Warzone.png", publisher: "Activision", developer: "Raven Software", genre: ["Battle Royale", "شوتر"], rating: 4.1, releaseYear: 2020, description: "Battle Royale من Call of Duty مع 150 لاعب! أسلحة حقيقية، خرائط ضخمة، وأوضاع لعب متعددة.", platforms: ["PC", "PS", "Xbox"], players: "150" },
];

export default function GamesPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavModal, setShowFavModal] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);

  // Load favorites from Firestore
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "games", "favorites")).then(s => {
      if (s.exists()) setFavoriteIds(s.data().ids || []);
    }).catch(() => {});
  }, [user]);

  // Save favorites to Firestore
  const saveFavorites = async (ids: string[]) => {
    if (!user) return;
    setFavoriteIds(ids);
    try {
      await setDoc(doc(db, "users", user.uid, "games", "favorites"), { ids });
    } catch (e) {
      console.error("[GamesPage] Save favorites error:", e);
    }
  };

  const toggleFavorite = (gameId: string) => {
    if (!user) return;
    if (favoriteIds.includes(gameId)) {
      saveFavorites(favoriteIds.filter(id => id !== gameId));
    } else {
      if (favoriteIds.length >= 7) {
        setShowFavModal(true);
        return;
      }
      saveFavorites([...favoriteIds, gameId]);
    }
  };

  // All unique genres
  const allGenres = [...new Set(GAMES.flatMap(g => g.genre))].sort();

  // Filtered games
  const filtered = GAMES.filter(g => {
    const matchSearch = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.publisher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = !genreFilter || g.genre.includes(genreFilter);
    return matchSearch && matchGenre;
  });

  const favoriteGames = GAMES.filter(g => favoriteIds.includes(g.id));

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg text-nf-dim hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            <Gamepad2 size={18} className="text-nf-accent" />
            مكتبة الألعاب
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {favoriteIds.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent font-bold">
              {favoriteIds.length}/7 مفضلة
            </span>
          )}
        </div>
      </div>

      {/* My Favorites */}
      {favoriteGames.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-bold text-nf-dim mb-2 flex items-center gap-1.5">
            <Heart size={11} className="text-red-400" /> ألعابي المفضلة
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {favoriteGames.map(g => (
              <button key={g.id} onClick={() => setSelectedGame(g)} className="shrink-0 group relative">
                <img src={g.cover} alt={g.name} className="w-16 h-20 rounded-lg object-cover ring-1 ring-nf-border group-hover:ring-nf-accent transition-all" />
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(g.id); }} className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={8} />
                </button>
                <p className="text-[9px] text-nf-muted mt-0.5 w-16 truncate text-center">{g.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Genre Filter */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nf-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث عن لعبة..."
            className="w-full bg-nf-secondary/60 rounded-lg pr-8 pl-3 py-1.5 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-1 focus:ring-nf-accent/50 transition-all"
          />
        </div>
      </div>
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        <button onClick={() => setGenreFilter(null)} className={cn("shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors", !genreFilter ? "bg-nf-accent text-white" : "bg-nf-secondary/50 text-nf-dim hover:text-nf-muted")}>الكل</button>
        {allGenres.map(g => (
          <button key={g} onClick={() => setGenreFilter(genreFilter === g ? null : g)} className={cn("shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors", genreFilter === g ? "bg-nf-accent text-white" : "bg-nf-secondary/50 text-nf-dim hover:text-nf-muted")}>{g}</button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {filtered.map(g => (
          <motion.button
            key={g.id}
            layout
            onClick={() => setSelectedGame(g)}
            className="group relative text-right"
          >
            <div className="relative overflow-hidden rounded-lg ring-1 ring-nf-border group-hover:ring-nf-accent/50 transition-all">
              <img src={g.cover} alt={g.name} className="w-full aspect-[3/4] object-cover" />
              {/* Favorite indicator */}
              {favoriteIds.includes(g.id) && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500/90 flex items-center justify-center">
                  <Heart size={8} className="text-white" fill="white" />
                </div>
              )}
              {/* Rating overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
                <div className="flex items-center gap-0.5">
                  <Star size={8} className="text-amber-400" fill="currentColor" />
                  <span className="text-[9px] text-white font-bold">{g.rating}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-nf-muted mt-0.5 truncate">{g.name}</p>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-nf-dim text-xs">لا توجد نتائج</div>
      )}

      {/* Game Detail Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedGame(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-nf-primary border border-nf-border rounded-xl max-w-lg w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Cover */}
              <div className="relative h-48 overflow-hidden">
                <img src={selectedGame.cover} alt={selectedGame.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-nf-primary via-transparent to-transparent" />
                <button onClick={() => setSelectedGame(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                  <X size={14} />
                </button>
                {/* Rating badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
                  <Star size={11} className="text-amber-400" fill="currentColor" />
                  <span className="text-[11px] text-white font-bold">{selectedGame.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 -mt-8 relative">
                <h2 className="text-lg font-bold text-white mb-1">{selectedGame.name}</h2>
                <p className="text-[11px] text-nf-dim mb-3">{selectedGame.publisher} · {selectedGame.developer}</p>

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-nf-secondary/50 rounded-lg p-2 text-center">
                    <Calendar size={12} className="text-nf-accent mx-auto mb-0.5" />
                    <p className="text-[10px] text-nf-dim">الإصدار</p>
                    <p className="text-[11px] text-white font-bold">{selectedGame.releaseYear}</p>
                  </div>
                  <div className="bg-nf-secondary/50 rounded-lg p-2 text-center">
                    <Users size={12} className="text-nf-accent mx-auto mb-0.5" />
                    <p className="text-[10px] text-nf-dim">اللاعبين</p>
                    <p className="text-[11px] text-white font-bold">{selectedGame.players}</p>
                  </div>
                  <div className="bg-nf-secondary/50 rounded-lg p-2 text-center">
                    <Tag size={12} className="text-nf-accent mx-auto mb-0.5" />
                    <p className="text-[10px] text-nf-dim">النوع</p>
                    <p className="text-[11px] text-white font-bold">{selectedGame.genre[0]}</p>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedGame.genre.map(g => (
                    <span key={g} className="px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent text-[10px] font-semibold">{g}</span>
                  ))}
                </div>

                {/* Platforms */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedGame.platforms.map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-nf-secondary/60 text-nf-muted text-[9px] font-semibold">{p}</span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-[12px] text-nf-muted leading-relaxed mb-4">{selectedGame.description}</p>

                {/* Favorite button */}
                <button
                  onClick={() => toggleFavorite(selectedGame.id)}
                  className={cn(
                    "w-full py-2 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5",
                    favoriteIds.includes(selectedGame.id)
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-nf-accent/10 text-nf-accent hover:bg-nf-accent/20"
                  )}
                >
                  <Heart size={14} fill={favoriteIds.includes(selectedGame.id) ? "currentColor" : "none"} />
                  {favoriteIds.includes(selectedGame.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max favorites modal */}
      <AnimatePresence>
        {showFavModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFavModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-nf-primary border border-nf-border rounded-xl p-5 max-w-xs w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <Heart size={28} className="text-red-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">وصلت للحد الأقصى</h3>
              <p className="text-[11px] text-nf-muted mb-3">يمكنك اختيار 7 ألعاب فقط. أزل واحدة أولاً ثم أضف الجديدة.</p>
              <button onClick={() => setShowFavModal(false)} className="px-4 py-1.5 rounded-lg bg-nf-accent text-white text-[11px] font-bold hover:bg-nf-accent/80 transition-colors">فهمت</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
