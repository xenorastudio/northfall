"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Star, Gamepad2, Heart, X, Search, Users, Calendar, Tag, Trophy, Clock, Grid3X3, LayoutList } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface Game {
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

export const GAMES: Game[] = [
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

function GameCard({ game, isFav, onFav, layout }: { game: Game; isFav: boolean; onFav: () => void; layout: "grid" | "list" }) {
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setHovered(true), 180);
  };
  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(false);
  };

  if (layout === "list") {
    return (
      <motion.div layout onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-nf-secondary/20 hover:bg-nf-secondary/50 transition-all cursor-pointer border border-transparent hover:border-nf-border/40">
        <img src={game.cover} alt={game.name} className="w-12 h-16 rounded-lg object-cover shrink-0 shadow-md" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white truncate">{game.name}</p>
          <p className="text-[10px] text-nf-dim mt-0.5">{game.publisher} · {game.developer}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5"><Star size={9} className="text-amber-400" fill="currentColor" /><span className="text-[9px] text-amber-400 font-bold">{game.rating}</span></span>
            <span className="text-[9px] text-nf-dim">{game.releaseYear}</span>
            <span className="text-[9px] text-nf-dim">·</span>
            <span className="text-[9px] text-nf-dim">{game.players} لاعب</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {game.genre.map(g => (
              <span key={g} className="text-[8px] px-1.5 py-0.5 rounded-md bg-nf-accent/10 text-nf-accent font-semibold">{g}</span>
            ))}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onFav(); }} className={cn("shrink-0 p-2 rounded-xl transition-all", isFav ? "text-red-400 bg-red-400/10 hover:bg-red-400/20" : "text-nf-dim hover:text-red-400 hover:bg-red-400/5")}>
          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
        </button>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -10, scaleY: 0.85 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -10, scaleY: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-full right-0 left-0 z-40 mt-1.5 origin-top"
            >
              <div className="bg-nf-primary/95 backdrop-blur-md border border-nf-border/60 rounded-xl p-4 shadow-2xl shadow-black/50">
                <p className="text-[11px] text-nf-muted leading-relaxed mb-2.5">{game.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {game.platforms.map(p => (
                    <span key={p} className="text-[9px] px-2 py-0.5 rounded-md bg-nf-secondary/60 text-nf-muted font-semibold border border-nf-border/30">{p}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[9px] text-nf-dim">
                  <span className="flex items-center gap-1"><Users size={9} className="text-nf-accent" /> {game.players}</span>
                  <span className="flex items-center gap-1"><Calendar size={9} className="text-nf-accent" /> {game.releaseYear}</span>
                  <span className="flex items-center gap-1"><Tag size={9} className="text-nf-accent" /> {game.developer}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div layout onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="group relative text-right">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-nf-border/60 group-hover:ring-nf-accent/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-nf-accent/10 group-hover:scale-[1.02]">
        <img src={game.cover} alt={game.name} className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-110" />
        {/* Always-visible bottom gradient with name + rating */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8">
          <p className="text-[11px] text-white font-bold truncate">{game.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Star size={9} className="text-amber-400" fill="currentColor" />
            <span className="text-[9px] text-amber-400 font-bold">{game.rating}</span>
            <span className="text-[8px] text-white/50">·</span>
            <span className="text-[8px] text-white/50">{game.releaseYear}</span>
          </div>
        </div>
        {/* Favorite badge */}
        {isFav && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Heart size={12} className="text-white" fill="white" />
          </motion.div>
        )}
        {/* Fav button on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className={cn(
            "absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
            isFav ? "bg-red-500 text-white shadow-red-500/30" : "bg-black/50 backdrop-blur-sm text-white/70 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 hover:shadow-red-500/30"
          )}
        >
          <Heart size={13} fill={isFav ? "white" : "none"} />
        </button>
      </div>

      {/* Hover dropdown - big info panel */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -12, scaleY: 0.85 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -12, scaleY: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-full right-0 left-0 z-40 mt-2 origin-top"
          >
            <div className="bg-nf-primary/95 backdrop-blur-md border border-nf-border/60 rounded-xl p-3.5 shadow-2xl shadow-black/60">
              <p className="text-[11px] text-nf-muted leading-relaxed mb-2.5">{game.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {game.genre.map(g => (
                  <span key={g} className="text-[8px] px-1.5 py-0.5 rounded-md bg-nf-accent/15 text-nf-accent font-semibold">{g}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {game.platforms.map(p => (
                  <span key={p} className="text-[8px] px-2 py-0.5 rounded-md bg-nf-secondary/60 text-nf-dim font-semibold border border-nf-border/30">{p}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[9px] text-nf-dim">
                <span className="flex items-center gap-1"><Users size={9} className="text-nf-accent" /> {game.players}</span>
                <span className="flex items-center gap-1"><Calendar size={9} className="text-nf-accent" /> {game.releaseYear}</span>
                <span className="flex items-center gap-1"><Tag size={9} className="text-nf-accent" /> {game.developer}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GamesPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavModal, setShowFavModal] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "rating" | "year">("name");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "games", "favorites")).then(s => {
      if (s.exists()) setFavoriteIds(s.data().ids || []);
    }).catch(() => {});
  }, [user]);

  const saveFavorites = async (ids: string[]) => {
    if (!user) return;
    setFavoriteIds(ids);
    try { await setDoc(doc(db, "users", user.uid, "games", "favorites"), { ids }); } catch (e) { console.error("[GamesPage] Save error:", e); }
  };

  const toggleFavorite = (gameId: string) => {
    if (!user) return;
    if (favoriteIds.includes(gameId)) {
      saveFavorites(favoriteIds.filter(id => id !== gameId));
    } else {
      if (favoriteIds.length >= 7) { setShowFavModal(true); return; }
      saveFavorites([...favoriteIds, gameId]);
    }
  };

  const allGenres = [...new Set(GAMES.flatMap(g => g.genre))].sort();
  const filtered = GAMES.filter(g => {
    const matchSearch = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.publisher.toLowerCase().includes(searchQuery.toLowerCase()) || g.genre.some(gen => gen.includes(searchQuery));
    const matchGenre = !genreFilter || g.genre.includes(genreFilter);
    return matchSearch && matchGenre;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "year") return b.releaseYear - a.releaseYear;
    return a.name.localeCompare(b.name);
  });

  const favCount = favoriteIds.length;

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="p-2 rounded-xl text-nf-dim hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Gamepad2 size={20} className="text-nf-accent" />
            مكتبة الألعاب
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-nf-secondary/50 text-nf-dim font-semibold">{GAMES.length} لعبة</span>
        </div>
        <div className="flex items-center gap-2">
          {favCount > 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-bold">{favCount}/7 ❤️</span>
          )}
          <button onClick={() => setLayout(layout === "grid" ? "list" : "grid")} className="p-2 rounded-xl text-nf-dim hover:text-white hover:bg-white/5 transition-colors">
            {layout === "grid" ? <LayoutList size={15} /> : <Grid3X3 size={15} />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ابحث عن لعبة، ناشر، أو نوع..."
          className="w-full bg-nf-secondary/30 rounded-xl pr-9 pl-4 py-2 text-[12px] text-nf-text placeholder:text-nf-dim outline-none focus:ring-2 focus:ring-nf-accent/30 transition-all border border-nf-border/30 focus:border-nf-accent/40"
        />
      </div>

      {/* Genre filters */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
        <button onClick={() => setGenreFilter(null)} className={cn("shrink-0 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all", !genreFilter ? "bg-nf-accent text-white shadow-sm shadow-nf-accent/20" : "bg-nf-secondary/30 text-nf-dim hover:text-nf-muted border border-nf-border/30")}>الكل</button>
        {allGenres.map(g => (
          <button key={g} onClick={() => setGenreFilter(genreFilter === g ? null : g)} className={cn("shrink-0 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all", genreFilter === g ? "bg-nf-accent text-white shadow-sm shadow-nf-accent/20" : "bg-nf-secondary/30 text-nf-dim hover:text-nf-muted border border-nf-border/30")}>{g}</button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center gap-1.5 mb-4">
        {[
          { id: "name" as const, label: "الاسم" },
          { id: "rating" as const, label: "⭐ التقييم" },
          { id: "year" as const, label: "🆕 الأحدث" },
        ].map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all", sortBy === s.id ? "bg-nf-accent/15 text-nf-accent border border-nf-accent/30" : "text-nf-dim hover:text-nf-muted border border-transparent")}>
            {s.label}
          </button>
        ))}
        <span className="text-[10px] text-nf-dim mr-auto">{filtered.length} نتيجة</span>
      </div>

      {/* Games Grid/List */}
      {layout === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(g => (
            <GameCard key={g.id} game={g} isFav={favoriteIds.includes(g.id)} onFav={() => toggleFavorite(g.id)} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(g => (
            <GameCard key={g.id} game={g} isFav={favoriteIds.includes(g.id)} onFav={() => toggleFavorite(g.id)} layout="list" />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Gamepad2 size={32} className="text-nf-dim/20 mx-auto mb-3" />
          <p className="text-sm text-nf-dim">لا توجد نتائج</p>
          <p className="text-[11px] text-nf-dim/50 mt-1">جرّب كلمة بحث أخرى</p>
        </div>
      )}

      {/* Max favorites modal */}
      <AnimatePresence>
        {showFavModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFavModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 10 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="bg-nf-primary border border-nf-border rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <Heart size={24} className="text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">وصلت للحد الأقصى</h3>
              <p className="text-[11px] text-nf-muted mb-4">يمكنك اختيار 7 ألعاب فقط. أزل واحدة أولاً ثم أضف الجديدة.</p>
              <button onClick={() => setShowFavModal(false)} className="px-5 py-2 rounded-xl bg-nf-accent text-white text-[12px] font-bold hover:bg-nf-accent/80 transition-colors shadow-lg shadow-nf-accent/20">فهمت</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
