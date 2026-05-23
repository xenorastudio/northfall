"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Star, Gamepad2, Heart, X, Search, Users, Calendar, Tag, Trophy, Clock, Grid3X3, LayoutList, ExternalLink, Filter, Monitor, ChevronDown, TrendingUp, Flame, Crown, Zap, ChevronLeft, ChevronRight, Dice5, ArrowUp, Hash } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface Game {
  id: string; name: string; cover: string; publisher: string; developer: string;
  genre: string[]; rating: number; releaseYear: number; description: string;
  platforms: string[]; players: string; steamUrl: string;
}

export const GAMES: Game[] = [
  { id: "among-us", name: "Among Us", cover: "/assets/GameCovor/Among Us.png", publisher: "InnerSloth", developer: "InnerSloth", genre: ["اجتماعي", "بقاء"], rating: 4.2, releaseYear: 2018, description: "لعبة اجتماعية حيث يحاول أفراد الطاقم إكمال المهام بينما يتسلل المنتحلون للقضاء عليهم. العب مع أصدقائك واكشف المنتحل!", platforms: ["PC", "Mobile", "Switch"], players: "4-15", steamUrl: "https://store.steampowered.com/app/945360/Among_Us/" },
  { id: "apex-legends", name: "Apex Legends", cover: "/assets/GameCovor/Apex Legends .png", publisher: "EA", developer: "Respawn Entertainment", genre: ["Battle Royale", "شوتر"], rating: 4.5, releaseYear: 2019, description: "لعبة Battle Royale مجانية مع شخصيات فريدة لكل واحدة قدرات خاصة. قاتل في فرق من 3 وكن آخر من يبقى!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "60", steamUrl: "https://store.steampowered.com/app/1172470/Apex_Legends/" },
  { id: "ac-mirage", name: "Assassin's Creed Mirage", cover: "/assets/GameCovor/Assassin's Creed Mirage.png", publisher: "Ubisoft", developer: "Ubisoft Bordeaux", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.0, releaseYear: 2023, description: "عودة لأصول السلسلة مع بصرام في بغداد القديمة. تسلل، اغتال، واستكشف المدينة الأسطورية.", platforms: ["PC", "PS5", "Xbox Series"], players: "1", steamUrl: "https://store.steampowered.com/app/2013130/Assassins_Creed_Mirage/" },
  { id: "ac-valhalla", name: "Assassin's Creed Valhalla", cover: "/assets/GameCovor/Assassin's Creed Valhalla.png", publisher: "Ubisoft", developer: "Ubisoft Montreal", genre: ["أكشن-مغامرة", "RPG"], rating: 4.3, releaseYear: 2020, description: "عش قصة إيفور الفايكنغ واكتشف إنجلترا في عصر الفايكنغ. ابنِ مستوطنتك وقاتل من أجل مجدك.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2208920/Assassins_Creed_Valhalla/" },
  { id: "civilization-vi", name: "Civilization VI", cover: "/assets/GameCovor/Civilization VI.png", publisher: "2K Games", developer: "Firaxis Games", genre: ["استراتيجية", "4X"], rating: 4.6, releaseYear: 2016, description: "ابنِ إمبراطورية تدوم عبر العصور. قُد حضارتك من العصر الحجري حتى عصر المعلومات وكن أعظم قائد في التاريخ.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-12", steamUrl: "https://store.steampowered.com/app/289070/Sid_Meiers_Civilization_VI/" },
  { id: "cs2", name: "Counter-Strike 2", cover: "/assets/GameCovor/Counter-Strike 2.png", publisher: "Valve", developer: "Valve", genre: ["شوتر", "تنافسي"], rating: 4.7, releaseYear: 2023, description: "الإصدار الجديد من أشهر لعبة شوتر تكتيكية. رسومات جديدة، سموك جديد، ونظام تصنيف محدّث.", platforms: ["PC"], players: "5v5", steamUrl: "https://store.steampowered.com/app/730/CounterStrike_2/" },
  { id: "cyberpunk-2077", name: "Cyberpunk 2077", cover: "/assets/GameCovor/Cyberpunk 2077.png", publisher: "CD Projekt", developer: "CD Projekt Red", genre: ["RPG", "أكشن"], rating: 4.4, releaseYear: 2020, description: "مغامرة RPG في مدينة نايت سيتي المستقبلية. خصّص شخصيتك، اكتشف العالم المفتوح، واتبع قصة V.", platforms: ["PC", "PS5", "Xbox Series"], players: "1", steamUrl: "https://store.steampowered.com/app/1091500/Cyberpunk_2077/" },
  { id: "dead-by-daylight", name: "Dead by Daylight", cover: "/assets/GameCovor/Dead by Daylight.png", publisher: "Behaviour Interactive", developer: "Behaviour Interactive", genre: ["رعب", "بقاء"], rating: 4.1, releaseYear: 2016, description: "لعبة رعب غير متماثلة. العب كقاتل أو كناجٍ وحاول الهروب. شخصيات من أشهر أفلام الرعب!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "5", steamUrl: "https://store.steampowered.com/app/381210/Dead_by_Daylight/" },
  { id: "ea-fc-24", name: "EA Sports FC 24", cover: "/assets/GameCovor/EA Sports FC 24.png", publisher: "EA", developer: "EA Canada", genre: ["رياضة", "محاكاة"], rating: 3.8, releaseYear: 2023, description: "لعبة كرة القدم الجيل الجديد مع HyperMotion V وتقنيات PlayStyles. العب مع أفضل اللاعبين والفرق في العالم.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-22", steamUrl: "https://store.steampowered.com/app/2195250/EA_SPORTS_FC_24/" },
  { id: "elden-ring", name: "Elden Ring", cover: "/assets/GameCovor/Elden Ring.png", publisher: "Bandai Namco", developer: "FromSoftware", genre: ["RPG", "أكشن", "عالم مفتوح"], rating: 4.9, releaseYear: 2022, description: "تحفة FromSoftware مع عالم مفتوح ضخم صمّمه ميازاكي وجورج آر آر مارتن. استكشف الأراضي البينية وقاتل الرؤساء الأسطوريين.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1245620/ELDEN_RING/" },
  { id: "f1-23", name: "F1 23", cover: "/assets/GameCovor/F1 23.png", publisher: "EA", developer: "Codemasters", genre: ["سباق", "رياضة"], rating: 4.0, releaseYear: 2023, description: "عش تجربة الفورمولا 1 الرسمية مع سيارات و حلقات موسم 2023. سباقات واقعية وأوضاع لعب متعددة.", platforms: ["PC", "PS", "Xbox"], players: "1-20", steamUrl: "https://store.steampowered.com/app/2108330/F1_23/" },
  { id: "forza-horizon-5", name: "Forza Horizon 5", cover: "/assets/GameCovor/Forza Horizon 5.png", publisher: "Xbox Game Studios", developer: "Playground Games", genre: ["سباق", "عالم مفتوح"], rating: 4.7, releaseYear: 2021, description: "سباقات في المكسيك! عالم مفتوح مع مناظر خلابة، أكثر من 500 سيارة، وأوضاع لعب متنوعة.", platforms: ["PC", "Xbox"], players: "1-72", steamUrl: "https://store.steampowered.com/app/1551360/Forza_Horizon_5/" },
  { id: "garrys-mod", name: "Garry's Mod", cover: "/assets/GameCovor/Garry's Mod.png", publisher: "Valve", developer: "Facepunch Studios", genre: ["صندوق رمل", "إبداعي"], rating: 4.3, releaseYear: 2006, description: "صندوق رمل بلا حدود! ابنِ أي شي تريده، العب مودات المجتمع، أو اصنع لعبتك الخاصة.", platforms: ["PC"], players: "1-64", steamUrl: "https://store.steampowered.com/app/4000/Garrys_Mod/" },
  { id: "god-of-war", name: "God of War", cover: "/assets/GameCovor/God of War.png", publisher: "PlayStation Studios", developer: "Santa Monica Studio", genre: ["أكشن-مغامرة", "RPG"], rating: 4.8, releaseYear: 2022, description: "رحلة كريتوس وابنه أتريوس في أساطير الشمال. قتال عنيف، قصة مؤثرة، وعالم مبهر.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1593500/God_of_War/" },
  { id: "hades", name: "Hades", cover: "/assets/GameCovor/Hades.png", publisher: "Supergiant Games", developer: "Supergiant Games", genre: ["Roguelike", "أكشن"], rating: 4.8, releaseYear: 2020, description: "حاول الهروب من العالم السفلي اليوناني! قتال سريع، قصة رائعة، وكل محاولة تكتشف المزيد.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/1145360/Hades/" },
  { id: "hogwarts-legacy", name: "Hogwarts Legacy", cover: "/assets/GameCovor/Hogwarts Legacy.png", publisher: "Warner Bros.", developer: "Avalanche Software", genre: ["RPG", "عالم مفتوح"], rating: 4.5, releaseYear: 2023, description: "عش عالم هاري بوتر! التحق بهوغوورتس، تعلم السحر، واكتشف أسرار العالم السحري في القرن التاسع عشر.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/990080/Hogwarts_Legacy/" },
  { id: "minecraft", name: "Minecraft", cover: "/assets/GameCovor/Minecraft.png", publisher: "Mojang", developer: "Mojang Studios", genre: ["صندوق رمل", "بقاء"], rating: 4.7, releaseYear: 2011, description: "اللعبة الأكثر مبيعاً في التاريخ! ابنِ، استكشف، وابقَ على قيد الحياة في عالم من المكعبات.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1-∞", steamUrl: "" },
  { id: "nfs-heat", name: "Need for Speed Heat", cover: "/assets/GameCovor/Need for Speed Heat.png", publisher: "EA", developer: "Ghost Games", genre: ["سباق", "أكشن"], rating: 3.9, releaseYear: 2019, description: "سباقات نهارية قانونية وسباقات ليلية غير قانونية. خصّص سيارتك واهرب من الشرطة!", platforms: ["PC", "PS", "Xbox"], players: "1-16", steamUrl: "https://store.steampowered.com/app/1222680/Need_for_Speed_Heat/" },
  { id: "outlast", name: "Outlast", cover: "/assets/GameCovor/Outlast.png", publisher: "Red Barrels", developer: "Red Barrels", genre: ["رعب", "بقاء"], rating: 4.2, releaseYear: 2013, description: "صحفي يتسلل لمستشفى نفسية مهجور... لكنه ليس وحيداً. لا سلاح، فقط كاميرا وقلبك يخفق!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/238320/Outlast/" },
  { id: "overwatch-2", name: "Overwatch 2", cover: "/assets/GameCovor/Overwatch 2.png", publisher: "Blizzard", developer: "Blizzard Entertainment", genre: ["شوتر", "تنافسي"], rating: 4.0, releaseYear: 2022, description: "شوتر أبطال 5v5 مع شخصيات فريدة. العب Push الجديد والخرائط الجديدة مع أصدقائك!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "5v5", steamUrl: "https://store.steampowered.com/app/2357570/Overwatch_2/" },
  { id: "phasmophobia", name: "Phasmophobia", cover: "/assets/GameCovor/Phasmophobia.png", publisher: "Kinetic Games", developer: "Kinetic Games", genre: ["رعب", "تعاوني"], rating: 4.3, releaseYear: 2020, description: "لعبة رعب تعاونية! أنت وفريقكم صيادو أشباح. استخدموا المعدات لتحديد نوع الشبح ونجوا!", platforms: ["PC"], players: "1-4", steamUrl: "https://store.steampowered.com/app/739630/Phasmophobia/" },
  { id: "r6-siege", name: "Rainbow Six Siege", cover: "/assets/GameCovor/Rainbow Six Siege.png", publisher: "Ubisoft", developer: "Ubisoft Montreal", genre: ["شوتر", "تكتيكي"], rating: 4.4, releaseYear: 2015, description: "شوتر تكتيكي 5v5 مع تدمير بيئي. كل عامل قدرات فريدة. خطط، نفّذ، وانتصر!", platforms: ["PC", "PS", "Xbox"], players: "5v5", steamUrl: "https://store.steampowered.com/app/359550/Tom_Clancys_Rainbow_Six_Siege/" },
  { id: "rdr2", name: "Red Dead Redemption 2", cover: "/assets/GameCovor/Red Dead Redemption 2.png", publisher: "Rockstar Games", developer: "Rockstar Games", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.9, releaseYear: 2018, description: "تحفة روكستار. عش قصة آرثر مورغان والعصابة في الغرب الأمريكي المتلاشي. عالم حي وقصة لا تُنسى.", platforms: ["PC", "PS", "Xbox"], players: "1-32", steamUrl: "https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/" },
  { id: "re4-remake", name: "Resident Evil 4 Remake", cover: "/assets/GameCovor/Resident Evil 4 Remake.png", publisher: "Capcom", developer: "Capcom", genre: ["رعب", "أكشن"], rating: 4.7, releaseYear: 2023, description: "إعادة صنع تحفة الرعب! ليون كينيدي في مهمة إنقاذ في قرية مرعبة. رسومات مذهلة وقتال محسّن.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2050650/Resident_Evil_4/" },
  { id: "re-village", name: "Resident Evil Village", cover: "/assets/GameCovor/Resident Evil Village.png", publisher: "Capcom", developer: "Capcom", genre: ["رعب", "أكشن"], rating: 4.3, releaseYear: 2021, description: "إيثان وينترز يبحث عن ابنته المخطوفة في قرية مرعبة. مصاصي دماء، مستذئبين، وأكثر!", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1196590/Resident_Evil_Village/" },
  { id: "roblox", name: "Roblox", cover: "/assets/GameCovor/Roblox.png", publisher: "Roblox Corporation", developer: "Roblox Corporation", genre: ["صندوق رمل", "اجتماعي"], rating: 3.7, releaseYear: 2006, description: "منصة ألعاب حيث يمكنك اللعب وإنشاء ألعابك الخاصة! ملايين التجارب من المجتمع.", platforms: ["PC", "Mobile", "Xbox"], players: "1-∞", steamUrl: "" },
  { id: "sekiro", name: "Sekiro: Shadows Die Twice", cover: "/assets/GameCovor/Sekiro Shadows Die Twice.png", publisher: "Activision", developer: "FromSoftware", genre: ["أكشن", "مغامرة"], rating: 4.7, releaseYear: 2019, description: "نينجا بيد واحدة ينتقم في اليابان الإقطاعية. قتال بالسيوف سريع ومتطلب — لعبة FromSoftware الأصعب!", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/814380/Sekiro_Shadows_Die_Twice/" },
  { id: "shadow-tomb-raider", name: "Shadow of the Tomb Raider", cover: "/assets/GameCovor/Shadow of the Tomb Raider.png", publisher: "Square Enix", developer: "Eidos Montreal", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.1, releaseYear: 2018, description: "لارا كروفت في أمريكا الجنوبية تكشف نبوءة نهاية العالم. تسلل، استكشف، وقاتل في أجمل أجزاء الثلاثية.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/709540/Shadow_of_the_Tomb_Raider/" },
  { id: "stardew-valley", name: "Stardew Valley", cover: "/assets/GameCovor/Stardew Valley.png", publisher: "ConcernedApe", developer: "ConcernedApe", genre: ["محاكاة", "RPG"], rating: 4.8, releaseYear: 2016, description: "اترك المدينة وابدأ مزرعتك! زرع، صيد، تعدين، وبناء علاقات في قرية بيلكينب الخلابة.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1-8", steamUrl: "https://store.steampowered.com/app/413150/Stardew_Valley/" },
  { id: "terraria", name: "Terraria", cover: "/assets/GameCovor/Terraria.png", publisher: "Re-Logic", developer: "Re-Logic", genre: ["بقاء", "استكشاف", "صندوق رمل"], rating: 4.6, releaseYear: 2011, description: "2D بقاء واستكشاف! احفر، ابنِ، قاتل رؤساء، واكتشف عوالم مليئة بالمفاجآت.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1-14", steamUrl: "https://store.steampowered.com/app/105600/Terraria/" },
  { id: "witcher-3", name: "The Witcher 3: Wild Hunt", cover: "/assets/GameCovor/The Witcher 3 Wild Hunt.png", publisher: "CD Projekt", developer: "CD Projekt Red", genre: ["RPG", "عالم مفتوح"], rating: 4.9, releaseYear: 2015, description: "واحدة من أفضل ألعاب RPG في التاريخ. غيرالت يبحث عن ابنته بالتبني في عالم مفتوح مذهل وقصة لا تُنسى.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/" },
  { id: "warzone", name: "Call of Duty: Warzone", cover: "/assets/GameCovor/Warzone.png", publisher: "Activision", developer: "Raven Software", genre: ["Battle Royale", "شوتر"], rating: 4.1, releaseYear: 2020, description: "Battle Royale من Call of Duty مع 150 لاعب! أسلحة حقيقية، خرائط ضخمة، وأوضاع لعب متعددة.", platforms: ["PC", "PS", "Xbox"], players: "150", steamUrl: "https://store.steampowered.com/app/1962663/Call_of_Duty_Warzone/" },

  // === FPS / Shooter ===
  { id: "escape-from-tarkov", name: "Escape from Tarkov", cover: "/assets/GameCovor/Escape from Tarkov.png", publisher: "Battlestate Games", developer: "Battlestate Games", genre: ["شوتر", "بقاء"], rating: 4.3, releaseYear: 2017, description: "شوتر تكتيكي واقعي مع خسارة المعدات عند الموت. اهرب من المدينة المحاصرة مع غنائمك!", platforms: ["PC"], players: "1-12", steamUrl: "" },
  { id: "insurgency-sandstorm", name: "Insurgency: Sandstorm", cover: "/assets/GameCovor/Insurgency Sandstorm.png", publisher: "Focus Entertainment", developer: "New World Interactive", genre: ["شوتر", "تكتيكي"], rating: 4.2, releaseYear: 2018, description: "شوتر تكتيكي واقعي بدون تصليب أو كيل كام. قتال عنيف ومتطلب بأسلحة حقيقية.", platforms: ["PC", "PS", "Xbox"], players: "8v8", steamUrl: "https://store.steampowered.com/app/581320/Insurgency_Sandstorm/" },
  { id: "ready-or-not", name: "Ready or Not", cover: "/assets/GameCovor/Ready or Not.png", publisher: "VOID Interactive", developer: "VOID Interactive", genre: ["شوتر", "تكتيكي"], rating: 4.5, releaseYear: 2023, description: "محاكاة فرق SWAT! خطط، اقتحم، ونفّذ العمليات بأسلوب تكتيكي واقعي ومتقن.", platforms: ["PC"], players: "1-5", steamUrl: "https://store.steampowered.com/app/1144200/Ready_or_Not/" },
  { id: "squad", name: "Squad", cover: "/assets/GameCovor/Squad.png", publisher: "Offworld Industries", developer: "Offworld Industries", genre: ["شوتر", "تكتيكي"], rating: 4.4, releaseYear: 2020, description: "شوتر تكتيكي بـ 50vs50! تواصل مع فريقك، خطط الهجمات، وسيطر على الميدان بتنظيم عسكري.", platforms: ["PC"], players: "50v50", steamUrl: "https://store.steampowered.com/app/393380/Squad/" },
  { id: "hell-let-loose", name: "Hell Let Loose", cover: "/assets/GameCovor/Hell Let Loose.png", publisher: "Team17", developer: "Black Matter", genre: ["شوتر", "تكتيكي"], rating: 4.1, releaseYear: 2021, description: "شوتر الحرب العالمية الثانية بـ 50vs50! معارك ضخمة، دبابات، وخطوط أمامية حقيقية.", platforms: ["PC", "PS", "Xbox"], players: "50v50", steamUrl: "https://store.steampowered.com/app/686810/Hell_Let_Loose/" },

  // === RPG / Open World ===
  { id: "starfield", name: "Starfield", cover: "/assets/GameCovor/Starfield (2023).png", publisher: "Bethesda", developer: "Bethesda Game Studios", genre: ["RPG", "عالم مفتوح"], rating: 4.0, releaseYear: 2023, description: "من Bethesda، أول لعبة RPG عالم مفتوح في الفضاء! استكشف أكثر من 1000 كوكب وابنِ قصتك.", platforms: ["PC", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1716740/Starfield/" },
  { id: "fallout-4", name: "Fallout 4", cover: "/assets/GameCovor/Fallout 4.png", publisher: "Bethesda", developer: "Bethesda Game Studios", genre: ["RPG", "عالم مفتوح"], rating: 4.4, releaseYear: 2015, description: "عالم ما بعد核 الحرب! ابحث عن ابنك في بوسطن المدمرة. ابنِ مستوطناتك واتخذ قرارات مصيرية.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/377160/Fallout_4/" },
  { id: "fallout-new-vegas", name: "Fallout: New Vegas", cover: "/assets/GameCovor/Fallout New Vegas.png", publisher: "Bethesda", developer: "Obsidian Entertainment", genre: ["RPG", "عالم مفتوح"], rating: 4.6, releaseYear: 2010, description: "أفضل قصة Fallout! صراع فصائل في لاس فيغاس ما بعد الحرب. اختياراتك تغير كل شي.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/22380/Fallout_New_Vegas/" },
  { id: "the-outer-worlds", name: "The Outer Worlds", cover: "/assets/GameCovor/The Outer Worlds.png", publisher: "Private Division", developer: "Obsidian Entertainment", genre: ["RPG", "عالم مفتوح"], rating: 4.2, releaseYear: 2019, description: "من مطورين Fallout! RPG في مستعمرة فضائية يتحكم فيها الشركات. اختياراتك تحدد مصير المستعمرة.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/812770/The_Outer_Worlds/" },
  { id: "mount-and-blade-2", name: "Mount & Blade II: Bannerlord", cover: "/assets/GameCovor/Mount & Blade II Bannerlord.png", publisher: "TaleWorlds", developer: "TaleWorlds Entertainment", genre: ["RPG", "استراتيجية"], rating: 4.1, releaseYear: 2022, description: "استراتيجية و RPG بلا حدود! قُد جيشك، ابنِ مملكتك، وقاتل بمعارك ضخمة بـ 1000 محارب.", platforms: ["PC", "PS", "Xbox"], players: "1-64", steamUrl: "https://store.steampowered.com/app/261550/Mount_Blade_II_Bannerlord/" },

  // === Action / Adventure ===
  { id: "spider-man-remastered", name: "Marvel's Spider-Man Remastered", cover: "/assets/GameCovor/Marvel’s Spider-Man Remastered.png", publisher: "PlayStation Studios", developer: "Insomniac Games", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.8, releaseYear: 2022, description: "تسلق مباني مانهاتن بيتر باركر! قتال سينمائي، قصة مؤثرة، وعالم مفتوح مبهر.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1817070/Marvels_SpiderMan_Remastered/" },
  { id: "spider-man-miles", name: "Marvel's Spider-Man: Miles Morales", cover: "/assets/GameCovor/Marvel’s Spider-Man Miles Morales.png", publisher: "PlayStation Studios", developer: "Insomniac Games", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.6, releaseYear: 2022, description: "مايلز مورالز ياخذ عباءة العنكبوت! قدرات جديدة، قصة قوية، ونيويورك بالثلج.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1817190/Marvels_SpiderMan_Miles_Morales/" },
  { id: "days-gone", name: "Days Gone", cover: "/assets/GameCovor/Days Gone.png", publisher: "PlayStation Studios", developer: "Bend Studio", genre: ["أكشن-مغامرة", "بقاء"], rating: 4.1, releaseYear: 2021, description: "بقاء في عالم ما بعد الكارثة مع دراجتك! واجه حشود الزومبي واكتشف سر الكارثة.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1119410/Days_Gone/" },
  { id: "unchartaed", name: "Uncharted: Legacy of Thieves Collection", cover: "/assets/GameCovor/Uncharted Legacy of Thieves Collection.png", publisher: "PlayStation Studios", developer: "Naughty Dog", genre: ["أكشن-مغامرة"], rating: 4.5, releaseYear: 2022, description: "مغامرات ناثان دريك وكلوي فرايزر! كنوز، معابد، وأكشن سينمائي من أفضل ما صنع Naughty Dog.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1659420/UNCHARTED_Legacy_of_Thieves_Collection/" },
  { id: "death-stranding", name: "Death Stranding", cover: "/assets/GameCovor/Death Stranding.png", publisher: "Kojima Productions", developer: "Kojima Productions", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.2, releaseYear: 2019, description: "من كوجيما! أوصل البضائع في عالم مكسور، ابنِ جسور، واكتشف سر الـ BTs. لعبة فريدة من نوعها.", platforms: ["PC", "PS"], players: "1-16", steamUrl: "https://store.steampowered.com/app/1190460/Death_Stranding/" },

  // === Horror / Survival ===
  { id: "sons-of-the-forest", name: "Sons of the Forest", cover: "/assets/GameCovor/Sons of the Forest.png", publisher: "Newnight", developer: "Endnight Games", genre: ["رعب", "بقاء"], rating: 4.2, releaseYear: 2023, description: "تكملة The Forest! نجا على جزيرة مليئة بالوحوش والكهوف. ابنِ، تعاون، واكتشف الأسرار.", platforms: ["PC"], players: "1-8", steamUrl: "https://store.steampowered.com/app/1326470/Sons_Of_The_Forest/" },
  { id: "the-forest", name: "The Forest", cover: "/assets/GameCovor/The Forest.png", publisher: "Endnight Games", developer: "Endnight Games", genre: ["رعب", "بقاء"], rating: 4.3, releaseYear: 2018, description: "ناجي من حادث طائرة على جزيرة آكلة لحوم البشر! ابنِ ملاجئك، قاتل الوحوش، وابحث عن ابنك.", platforms: ["PC", "PS"], players: "1-8", steamUrl: "https://store.steampowered.com/app/242760/The_Forest/" },
  { id: "scorn", name: "Scorn", cover: "/assets/GameCovor/Scorn.png", publisher: "Kepler Interactive", developer: "Ebb Software", genre: ["رعب", "ألغاز"], rating: 3.8, releaseYear: 2022, description: "عالم حيوي مرعب مستوحى من أعمال غيغر! ألغاز بيئية وأجواء غريبة بلا كلام أو توجيه.", platforms: ["PC", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1037080/Scorn/" },
  { id: "little-nightmares-2", name: "Little Nightmares II", cover: "/assets/GameCovor/Little Nightmares II.png", publisher: "Bandai Namco", developer: "Tarsier Studios", genre: ["رعب", "مغامرة"], rating: 4.3, releaseYear: 2021, description: "مونو وسكس في عالم مرعب! ألغاز منصات وأجواء مخيفة بأسلوب بصري فريد.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/1136070/Little_Nightmares_II/" },
  { id: "alien-isolation", name: "Alien: Isolation", cover: "/assets/GameCovor/Alien Isolation.png", publisher: "SEGA", developer: "Creative Assembly", genre: ["رعب", "بقاء"], rating: 4.5, releaseYear: 2014, description: "واجه الأليين الأصلي! ذكاء اصطناعي يتكيف مع حركاتك. اختبئ، نجو، ولا تحاول تقاتله.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/214490/Alien_Isolation/" },

  // === Racing / Driving ===
  { id: "beamng-drive", name: "BeamNG.drive", cover: "/assets/GameCovor/BeamNG.drive.png", publisher: "BeamNG", developer: "BeamNG GmbH", genre: ["سباق", "محاكاة"], rating: 4.5, releaseYear: 2015, description: "محاكاة فيزياء السيارات الأكثر واقعية! تحطم مذهل، أوضاع لعب متنوعة، ومجتمع مودات ضخم.", platforms: ["PC"], players: "1-8", steamUrl: "https://store.steampowered.com/app/284160/BeamNGdrive/" },
  { id: "carx-drift", name: "CarX Drift Racing Online", cover: "/assets/GameCovor/CarX Drift Racing OnlineCarX Drift Racing Online.png", publisher: "CarX Technologies", developer: "CarX Technologies", genre: ["سباق", "محاكاة"], rating: 3.9, releaseYear: 2017, description: "سباقات دريفت أونلاين! فيزياء انزلاق واقعية، تخصيص سيارات، ومنافسات عالمية.", platforms: ["PC", "PS", "Xbox"], players: "1-16", steamUrl: "https://store.steampowered.com/app/641990/CarX_Drift_Racing_Online/" },
  { id: "assetto-corsa", name: "Assetto Corsa", cover: "/assets/GameCovor/Assetto Corsa.png", publisher: "Kunos Simulazioni", developer: "Kunos Simulazioni", genre: ["سباق", "محاكاة"], rating: 4.4, releaseYear: 2014, description: "محاكاة سباقات واقعية مع فيزياء دقيقة! مودات ضخمة، سيارات كثيرة، وحلقات حقيقية.", platforms: ["PC", "PS", "Xbox"], players: "1-16", steamUrl: "https://store.steampowered.com/app/244210/Assetto_Corsa/" },
  { id: "assetto-corsa-comp", name: "Assetto Corsa Competizione", cover: "/assets/GameCovor/Assetto Corsa Competizione.png", publisher: "505 Games", developer: "Kunos Simulazioni", genre: ["سباق", "محاكاة"], rating: 4.2, releaseYear: 2019, description: "محاكاة GT الرسمية! رسومات مذهلة، فيزياء إطارات واقعية، وبطولات BLANCPAIN الحقيقية.", platforms: ["PC", "PS", "Xbox"], players: "1-16", steamUrl: "https://store.steampowered.com/app/805550/Assetto_Corsa_Competizione/" },

  // === Simulation / Building ===
  { id: "house-flipper", name: "House Flipper", cover: "/assets/GameCovor/House Flipper.png", publisher: "PlayWay", developer: "Empyrean", genre: ["محاكاة", "إبداعي"], rating: 4.1, releaseYear: 2018, description: "اشتري بيوت خربانة وجددها! طلّع، دهن، رتّب، وبعها بربح. محاكاة ممتعة ومرضية.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/613100/House_Flipper/" },
  { id: "powerwash-simulator", name: "PowerWash Simulator", cover: "/assets/GameCovor/PowerWash Simulator.png", publisher: "Square Enix", developer: "FuturLab", genre: ["محاكاة", "استرخاء"], rating: 4.4, releaseYear: 2022, description: "اغسل الأوساخ بماء الضغط العالي! لعبة استرخاء بامتياز — مرضية ومدمنة.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-6", steamUrl: "https://store.steampowered.com/app/1290000/PowerWash_Simulator/" },
  { id: "euro-truck-sim-2", name: "Euro Truck Simulator 2", cover: "/assets/GameCovor/Euro Truck Simulator 2.png", publisher: "SCS Software", developer: "SCS Software", genre: ["محاكاة", "قيادة"], rating: 4.6, releaseYear: 2013, description: "سوّق شاحنات عبر أوروبا! ابنِ شركة نقلك، اشتغل، واستمتع بالمناظر الخلابة على الطريق.", platforms: ["PC"], players: "1-8", steamUrl: "https://store.steampowered.com/app/227300/Euro_Truck_Simulator_2/" },
  { id: "american-truck-sim", name: "American Truck Simulator", cover: "/assets/GameCovor/American Truck Simulator.png", publisher: "SCS Software", developer: "SCS Software", genre: ["محاكاة", "قيادة"], rating: 4.4, releaseYear: 2016, description: "سوّق شاحنات أمريكية ضخمة! اعبر الولايات، ابنِ شركتك، واستمتع بالطرق الأمريكية.", platforms: ["PC"], players: "1-8", steamUrl: "https://store.steampowered.com/app/270880/American_Truck_Simulator/" },

  // === Fun / Party / Co-op ===
  { id: "gang-beasts", name: "Gang Beasts", cover: "/assets/GameCovor/Gang Beasts.png", publisher: "Double Fine", developer: "Boneloaf", genre: ["قتال", "اجتماعي"], rating: 3.8, releaseYear: 2017, description: "قتال شخصيات رغوية مضحكة! اضرب، رمّ، واطرد أصدقائك من الحلبة. فوضى وضحك!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-4", steamUrl: "https://store.steampowered.com/app/285900/Gang_Beasts/" },
  { id: "pummel-party", name: "Pummel Party", cover: "/assets/GameCovor/Pummel Party.png", publisher: "Reverb Games", developer: "Reverb Games", genre: ["ألواح", "اجتماعي"], rating: 4.0, releaseYear: 2018, description: "لعبة ألواح مثل Mario Party! نرد، ميني جيمز، وأدوات تدمير. العب مع أصدقائك!", platforms: ["PC"], players: "1-8", steamUrl: "https://store.steampowered.com/app/844910/Pummel_Party/" },
  { id: "fall-guys", name: "Fall Guys", cover: "/assets/GameCovor/Fall Guys.png", publisher: "Epic Games", developer: "Mediatonic", genre: ["Battle Royale", "اجتماعي"], rating: 4.0, releaseYear: 2020, description: "Battle Royale بلا عنف! 60 لاعب يتنافسون بميني جيمز مضحكة. اركض، اقفز، ولا تطيح!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "60", steamUrl: "" },

  // === Indie / Unique ===
  { id: "hollow-knight", name: "Hollow Knight", cover: "/assets/GameCovor/Hollow Knight.png", publisher: "Team Cherry", developer: "Team Cherry", genre: ["Metroidvania", "أكشن"], rating: 4.9, releaseYear: 2017, description: "من أفضل ألعاب Indie! استكشف مدينة الهالونيد المليئة بالأسرار، قاتل رؤساء أسطورين، واكتشف عالم ضخم.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/367520/Hollow_Knight/" },
  { id: "cuphead", name: "Cuphead", cover: "/assets/GameCovor/Cuphead.png", publisher: "StudioMDHR", developer: "StudioMDHR", genre: ["أكشن", "أركيد"], rating: 4.6, releaseYear: 2017, description: "أركيد بأسلوب رسومات الثلاثينيات! رؤساء صعبين، رسومات يدوية، وموسيقى جاز رائعة.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-2", steamUrl: "https://store.steampowered.com/app/268910/Cuphead/" },
  { id: "dead-cells", name: "Dead Cells", cover: "/assets/GameCovor/Dead Cells.png", publisher: "Motion Twin", developer: "Motion Twin", genre: ["Roguelike", "أكشن"], rating: 4.7, releaseYear: 2018, description: "Roguelike مع قتال سريع! كل موت بداية جديدة مع أسلحة وقدرات مختلفة. سير مترويدفانيا ممتاز.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1", steamUrl: "https://store.steampowered.com/app/588650/Dead_Cells/" },
  { id: "slay-the-spire", name: "Slay the Spire", cover: "/assets/GameCovor/Slay the Spire.png", publisher: "Mega Crit Games", developer: "Mega Crit Games", genre: ["بطاقات", "Roguelike"], rating: 4.7, releaseYear: 2019, description: "Roguelike بطاقات! ابنِ مجموعتك، قاتل الوحوش، واصعد البرج. استراتيجية عميقة وإعادة لعب لا نهائية.", platforms: ["PC", "PS", "Xbox", "Switch", "Mobile"], players: "1", steamUrl: "https://store.steampowered.com/app/646570/Slay_the_Spire/" },

  // === RPG / Strategy ===
  { id: "baldurs-gate-3", name: "Baldur's Gate 3", cover: "/assets/GameCovor/Baldur’s Gate 3.png", publisher: "Larian Studios", developer: "Larian Studios", genre: ["RPG", "استراتيجية دورية"], rating: 4.9, releaseYear: 2023, description: "تحفة RPG من Larian! قصة عميقة، خيارات لا نهائية، وقتال دوري مبدع.", platforms: ["PC", "PS5", "Xbox Series"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/" },
  { id: "diablo-iv", name: "Diablo IV", cover: "/assets/GameCovor/Diablo IV.png", publisher: "Blizzard", developer: "Blizzard Entertainment", genre: ["RPG", "أكشن"], rating: 4.0, releaseYear: 2023, description: "عودة Diablo! عالم مفتوح مظلم، نظام بناء عميق، وأحداث عالمية.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/2344520/Diablo_IV/" },
  { id: "dragon-age-inq", name: "Dragon Age: Inquisition", cover: "/assets/GameCovor/Dragon Age Inquisition.png", publisher: "EA", developer: "BioWare", genre: ["RPG", "عالم مفتوح"], rating: 4.2, releaseYear: 2014, description: "من BioWare! RPG مع قصة عميقة ورفاق لا تُنسى. قُد الإنكويزشن وأوقف الحرب.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1222690/Dragon_Age_Inquisition/" },
  { id: "age-of-empires-4", name: "Age of Empires IV", cover: "/assets/GameCovor/Age of Empires IV.png", publisher: "Xbox Game Studios", developer: "Relic Entertainment", genre: ["استراتيجية", "RTS"], rating: 4.3, releaseYear: 2021, description: "عودة أسطورة RTS! ابنِ حضارتك، قاتل عبر العصور، وحملات تاريخية.", platforms: ["PC"], players: "1-8", steamUrl: "https://store.steampowered.com/app/1466860/Age_of_Empires_IV/" },
  { id: "anno-1800", name: "Anno 1800", cover: "/assets/GameCovor/Anno 1800.png", publisher: "Ubisoft", developer: "Blue Byte", genre: ["استراتيجية", "محاكاة"], rating: 4.2, releaseYear: 2019, description: "ابنِ إمبراطوريتك بعصر الثورة الصناعية! إدارة مدن وتجارة واستكشاف.", platforms: ["PC"], players: "1-16", steamUrl: "https://store.steampowered.com/app/816020/Anno_1800/" },
  { id: "total-war-wh3", name: "Total War: WARHAMMER III", cover: "/assets/GameCovor/Total War WARHAMMER III.png", publisher: "SEGA", developer: "Creative Assembly", genre: ["استراتيجية", "أكشن"], rating: 4.3, releaseYear: 2022, description: "استراتيجية ضخمة بأساطير WARHAMMER! معارك بآلاف المحاربين وشياطين.", platforms: ["PC"], players: "1-8", steamUrl: "https://store.steampowered.com/app/1142710/Total_War_WARHAMMER_III/" },

  // === Action / Adventure ===
  { id: "ghost-of-tsushima", name: "Ghost of Tsushima", cover: "/assets/GameCovor/Ghost of Tsushima.png", publisher: "PlayStation Studios", developer: "Sucker Punch", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.7, releaseYear: 2024, description: "ساموراي يقاتل الغزو المغولي! قتال سيوف سينمائي وتسلل وجزيرة تسوشيما الخلابة.", platforms: ["PC", "PS"], players: "1-8", steamUrl: "https://store.steampowered.com/app/2215430/Ghost_of_Tsushima_DIRECTORS_CUT/" },
  { id: "horizon-zero-dawn", name: "Horizon Zero Dawn", cover: "/assets/GameCovor/Horizon Zero Dawn.png", publisher: "PlayStation Studios", developer: "Guerrilla Games", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.5, releaseYear: 2020, description: "ألوي تصطاد آليات ديناصورية بعالم ما بعد الكارثة! قتال بالقوس واستكشاف.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1151640/Horizon_Zero_Dawn_Complete_Edition/" },
  { id: "horizon-forbidden-west", name: "Horizon Forbidden West", cover: "/assets/GameCovor/Horizon Forbidden West (PC).png", publisher: "PlayStation Studios", developer: "Guerrilla Games", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.4, releaseYear: 2024, description: "تكملة Horizon! ألوي تواجه تهديد جديد بالغرب المحظور. عالم أوسع وآليات أضخم.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/2420110/Horizon_Forbidden_West_Complete_Edition/" },
  { id: "tlou-part1", name: "The Last of Us Part I", cover: "/assets/GameCovor/The Last of Us Part I.png", publisher: "PlayStation Studios", developer: "Naughty Dog", genre: ["أكشن-مغامرة", "بقاء"], rating: 4.6, releaseYear: 2023, description: "تحفة Naughty Dog! جويل وإيلي برحلة عبر أمريكا المدمرة. قصة لا تُنسى.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1888930/The_Last_of_Us_Part_I/" },
  { id: "alan-wake", name: "Alan Wake Remastered", cover: "/assets/GameCovor/Alan Wake Remastered.png", publisher: "Epic Games", developer: "Remedy Entertainment", genre: ["أكشن-مغامرة", "رعب"], rating: 4.1, releaseYear: 2021, description: "كاتب يبحث عن زوجته ببلدة غامضة. ضوء ضد ظلام ورعب نفسي.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1265920/Alan_Wake_Remastered/" },
  { id: "control", name: "Control", cover: "/assets/GameCovor/Control.png", publisher: "505 Games", developer: "Remedy Entertainment", genre: ["أكشن-مغامرة", "خارق"], rating: 4.3, releaseYear: 2019, description: "جيسي فادن بمبنى حكومي غريب. قدرات خارقة وأجواء سريالية وقتال مبدع.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/870780/Control/" },
  { id: "sw-jfo", name: "Star Wars Jedi: Fallen Order", cover: "/assets/GameCovor/Star Wars Jedi Fallen Order.png", publisher: "EA", developer: "Respawn Entertainment", genre: ["أكشن-مغامرة", "Metroidvania"], rating: 4.4, releaseYear: 2019, description: "جيداي ناجي بعد الأمر 66! قتال بالسيوف الضوئية واستكشاف كواكب.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1172380/STAR_WARS_Jedi_Fallen_Order/" },
  { id: "sw-js", name: "Star Wars Jedi: Survivor", cover: "/assets/GameCovor/Star Wars Jedi Survivor.png", publisher: "EA", developer: "Respawn Entertainment", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.5, releaseYear: 2023, description: "تكملة Fallen Order! كال كيستس يكمل رحلته بعوالم مفتوحة وقتال محسّن.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1774580/STAR_WARS_Jedi_Survivor/" },
  { id: "watch-dogs-legion", name: "Watch Dogs: Legion", cover: "/assets/GameCovor/Watch Dogs Legion.png", publisher: "Ubisoft", developer: "Ubisoft Toronto", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 3.8, releaseYear: 2020, description: "كل شخص بلندن يقدر تلعبه! هاك المدينة وحارب الاستبداد.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/2239550/Watch_Dogs_Legion/" },
  { id: "far-cry-6", name: "Far Cry 6", cover: "/assets/GameCovor/Far Cry 6.png", publisher: "Ubisoft", developer: "Ubisoft Toronto", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 3.9, releaseYear: 2021, description: "ثورة بيارا! حارب الدكتاتور بأسلحة مرخصة وحليف حيواني فريد.", platforms: ["PC", "PS", "Xbox"], players: "1-2", steamUrl: "https://store.steampowered.com/app/2369390/Far_Cry_6/" },
  { id: "ff7-remake", name: "Final Fantasy VII Remake", cover: "/assets/GameCovor/Final Fantasy VII Remake.png", publisher: "Square Enix", developer: "Square Enix", genre: ["RPG", "أكشن"], rating: 4.6, releaseYear: 2022, description: "إعادة صنع تحفة Final Fantasy! كلاود ومجموعته بميدغار. قتال هجين وقصة ممتازة.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1462040/FINAL_FANTASY_VII_REMAKE_INTERGRADE/" },
  { id: "ff15", name: "Final Fantasy XV", cover: "/assets/GameCovor/Final Fantasy XV.png", publisher: "Square Enix", developer: "Square Enix", genre: ["RPG", "عالم مفتوح"], rating: 4.1, releaseYear: 2018, description: "نوكتيز وأصدقاؤه برحلة ملحمية! عالم مفتوح، قتال ديناميكي، وقصة صداقة.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/637650/FINAL_FANTASY_XV_WINDOWS_EDITION/" },

  // === FPS / Shooter ===
  { id: "battlefield-2042", name: "Battlefield 2042", cover: "/assets/GameCovor/Battlefield 2042.png", publisher: "EA", developer: "DICE", genre: ["شوتر", "عالم مفتوح"], rating: 3.6, releaseYear: 2021, description: "معارك 128 لاعب! دبابات وطيارات وأحداث جوية. Battlefield بأكبر حجمها.", platforms: ["PC", "PS", "Xbox"], players: "128", steamUrl: "https://store.steampowered.com/app/1517290/Battlefield_2042/" },
  { id: "battlefield-v", name: "Battlefield V", cover: "/assets/GameCovor/Battlefield V.png", publisher: "EA", developer: "DICE", genre: ["شوتر", "تكتيكي"], rating: 4.0, releaseYear: 2018, description: "الحرب العالمية الثانية بأسلوب Battlefield! معارك ضخمة وتحصينات وأوضاع كلاسيكية.", platforms: ["PC", "PS", "Xbox"], players: "64", steamUrl: "https://store.steampowered.com/app/1238810/Battlefield_V/" },
  { id: "doom-eternal", name: "DOOM Eternal", cover: "/assets/GameCovor/DOOM Eternal.png", publisher: "Bethesda", developer: "id Software", genre: ["شوتر", "أكشن"], rating: 4.7, releaseYear: 2020, description: "سلاير يرجع! أسرع وأعنف شوتر FPS. ذبح شياطين بأسلحة مجنونة وأكروبات.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-2", steamUrl: "https://store.steampowered.com/app/782330/DOOM_Eternal/" },
  { id: "titanfall-2", name: "Titanfall 2", cover: "/assets/GameCovor/Titanfall 2.png", publisher: "EA", developer: "Respawn Entertainment", genre: ["شوتر", "أكشن"], rating: 4.8, releaseYear: 2016, description: "أفضل حملة FPS! قناص مع روبوت ضخم. قتال سريع وحركة سلسة وقصة مؤثرة.", platforms: ["PC", "PS", "Xbox"], players: "1-16", steamUrl: "https://store.steampowered.com/app/1237970/Titanfall_2/" },
  { id: "hitman-3", name: "Hitman 3", cover: "/assets/GameCovor/Hitman 3.png", publisher: "IO Interactive", developer: "IO Interactive", genre: ["تسلل", "أكشن"], rating: 4.4, releaseYear: 2021, description: "العميل 47 بأفضل أجزاء السلسلة! اغتال أهدافك بطرق إبداعية بمواقع عالمية.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1659040/HITMAN_3/" },
  { id: "metro-exodus", name: "Metro Exodus", cover: "/assets/GameCovor/Metro Exodus.png", publisher: "Deep Silver", developer: "4A Games", genre: ["شوتر", "بقاء"], rating: 4.2, releaseYear: 2019, description: "أرتيوم يغادر أنفاق موسكو! رحلة عبر روسيا ما بعد الحرب النووية. أجواء مرعبة.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/412020/Metro_Exodus/" },

  // === Survival / Open World ===
  { id: "ark-survival", name: "ARK: Survival Evolved", cover: "/assets/GameCovor/ARK Survival Evolved.png", publisher: "Studio Wildcard", developer: "Studio Wildcard", genre: ["بقاء", "عالم مفتوح"], rating: 4.0, releaseYear: 2017, description: "ناجي على جزيرة ديناصورات! ركّب وابنِ وروّض الديناصورات. أكثر من 100 مخلوق.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-70", steamUrl: "https://store.steampowered.com/app/346110/ARK_Survival_Evolved/" },
  { id: "rust", name: "Rust", cover: "/assets/GameCovor/Rust.png", publisher: "Facepunch Studios", developer: "Facepunch Studios", genre: ["بقاء", "عالم مفتوح"], rating: 4.1, releaseYear: 2018, description: "بقاء قاسي! ابدأ عريان وابنِ قاعدتك وقاتل لاعبين آخرين. لا أصدقاء، فقط بقاء.", platforms: ["PC"], players: "1-100", steamUrl: "https://store.steampowered.com/app/252490/Rust/" },
  { id: "dying-light", name: "Dying Light", cover: "/assets/GameCovor/Dying Light.png", publisher: "Techland", developer: "Techland", genre: ["بقاء", "أكشن"], rating: 4.3, releaseYear: 2015, description: "باركور وزومبي! اركض فوق الأسطح بالنهار واختبئ بالليل لما يطلع الوحوش.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/239140/Dying_Light/" },
  { id: "dying-light-2", name: "Dying Light 2", cover: "/assets/GameCovor/Dying Light 2.png", publisher: "Techland", developer: "Techland", genre: ["بقاء", "أكشن", "عالم مفتوح"], rating: 4.0, releaseYear: 2022, description: "تكملة Dying Light! مدينة مفتوحة، باركور محسّن، وقراراتك تغير المدينة.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/534380/Dying_Light_2_Stay_Human/" },
  { id: "monster-hunter-world", name: "Monster Hunter: World", cover: "/assets/GameCovor/Monster Hunter World.png", publisher: "Capcom", developer: "Capcom", genre: ["أكشن", "تعاوني"], rating: 4.5, releaseYear: 2018, description: "صيد وحوش ضخمة! اصنع أسلحةك من الوحوش، العب مع أصدقائك، واكتشف عالم حي.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/582010/Monster_Hunter_World/" },

  // === Racing / Sports ===
  { id: "gran-turismo-7", name: "Gran Turismo 7", cover: "/assets/GameCovor/Gran Turismo 7.png", publisher: "PlayStation Studios", developer: "Polyphony Digital", genre: ["سباق", "محاكاة"], rating: 4.3, releaseYear: 2022, description: "محاكاة السباقات الواقعية! أكثر من 400 سيارة و90 حلقة. رسومات مذهلة وفيزياء دقيقة.", platforms: ["PS"], players: "1-20", steamUrl: "" },
  { id: "msfs-2020", name: "Microsoft Flight Simulator", cover: "/assets/GameCovor/Microsoft Flight Simulator 2020.png", publisher: "Xbox Game Studios", developer: "Asobo Studio", genre: ["محاكاة", "قيادة"], rating: 4.4, releaseYear: 2020, description: "طيّر فوق العالم كله! بيانات الأقمار الصناعية الحقيقية. أشهر محاكاة طيران بالتاريخ.", platforms: ["PC", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1250410/Microsoft_Flight_Simulator/" },
  { id: "madden-24", name: "Madden NFL 24", cover: "/assets/GameCovor/Madden NFL 24.png", publisher: "EA", developer: "EA Tiburon", genre: ["رياضة", "محاكاة"], rating: 3.5, releaseYear: 2023, description: "كرة القدم الأمريكية الرسمية! فرق NFL حقيقية وأوضاع لعب متنوعة.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/2140330/Madden_NFL_24/" },
  { id: "nba-2k24", name: "NBA 2K24", cover: "/assets/GameCovor/NBA 2K24.png", publisher: "2K Games", developer: "Visual Concepts", genre: ["رياضة", "محاكاة"], rating: 3.7, releaseYear: 2023, description: "كرة السلة الرسمية! لاعبين NBA حقيقيين، رسومات واقعية، وأوضاع MyCareer وMyTeam.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-6", steamUrl: "https://store.steampowered.com/app/2338770/NBA_2K24/" },
  { id: "batman-aa", name: "Batman: Arkham Asylum", cover: "/assets/GameCovor/Batman Arkham Asylum.png", publisher: "Warner Bros.", developer: "Rocksteady Studios", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.5, releaseYear: 2009, description: "باتمان في مصحة أركام! الجوكر سيطر على المصحة وقاتل أشرار باتمان واحد تلو الآخر.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/35140/Batman_Arkham_Asylum/" },
  { id: "batman-ac", name: "Batman: Arkham City", cover: "/assets/GameCovor/Batman Arkham City.png", publisher: "Warner Bros.", developer: "Rocksteady Studios", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.7, releaseYear: 2011, description: "باتمان في مدينة أركام المفتوحة! قتال سلس، تسلل، وأشرار أسطوريين.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/200260/Batman_Arkham_City/" },
  { id: "batman-ak", name: "Batman: Arkham Knight", cover: "/assets/GameCovor/Batman Arkham Knight.png", publisher: "Warner Bros.", developer: "Rocksteady Studios", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.3, releaseYear: 2015, description: "خاتمة أركام! باتمان يواجه سكيركرو. باتموبايل وعالم غوثام المفتوح.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/208650/Batman_Arkham_Knight/" },
  { id: "bf1", name: "Battlefield 1", cover: "/assets/GameCovor/Battlefield 1.png", publisher: "EA", developer: "DICE", genre: ["شوتر", "تكتيكي"], rating: 4.4, releaseYear: 2016, description: "الحرب العالمية الأولى! معارك ضخمة بخيول ودبابات. أجواء حرب واقعية.", platforms: ["PC", "PS", "Xbox"], players: "64", steamUrl: "https://store.steampowered.com/app/1238840/Battlefield_1/" },
  { id: "bf-hardline", name: "Battlefield Hardline", cover: "/assets/GameCovor/Battlefield™ Hardline.png", publisher: "EA", developer: "Visceral Games", genre: ["شوتر", "أكشن"], rating: 3.7, releaseYear: 2015, description: "شرطة ضد لصوص! سرقات ومطاردات بأسلوب Battlefield مختلف.", platforms: ["PC", "PS", "Xbox"], players: "32", steamUrl: "https://store.steampowered.com/app/1238880/Battlefield_Hardline/" },
  { id: "cod-bo-cw", name: "CoD: Black Ops Cold War", cover: "/assets/GameCovor/Call of Duty Black Ops Cold War.png", publisher: "Activision", developer: "Treyarch", genre: ["شوتر", "أكشن"], rating: 4.0, releaseYear: 2020, description: "حرب باردة في الثمانينات! حملة مشوقة وزومبي وأوضاع متعددة.", platforms: ["PC", "PS", "Xbox"], players: "6v6", steamUrl: "https://store.steampowered.com/app/1983290/Call_of_Duty_Black_Ops_Cold_War/" },
  { id: "cod-mw2", name: "CoD: Modern Warfare II", cover: "/assets/GameCovor/Call of Duty Modern Warfare II.png", publisher: "Activision", developer: "Infinity Ward", genre: ["شوتر", "أكشن"], rating: 4.2, releaseYear: 2022, description: "تكملة Modern Warfare! حملة مشوقة وأوضاع متعددة محسّنة.", platforms: ["PC", "PS", "Xbox"], players: "6v6", steamUrl: "https://store.steampowered.com/app/1938090/Call_of_Duty_Modern_Warfare_II/" },
  { id: "ck3", name: "Crusader Kings III", cover: "/assets/GameCovor/Crusader Kings III.png", publisher: "Paradox", developer: "Paradox Dev Studio", genre: ["استراتيجية", "RPG"], rating: 4.6, releaseYear: 2020, description: "استراتيجية سلالات! مؤامرات، زواج، وصراعات عرش عبر الأجيال.", platforms: ["PC", "PS", "Xbox"], players: "1-32", steamUrl: "https://store.steampowered.com/app/1158310/Crusader_Kings_III/" },
  { id: "ds2", name: "Dark Souls II", cover: "/assets/GameCovor/Dark Souls II.png", publisher: "Bandai Namco", developer: "FromSoftware", genre: ["RPG", "أكشن"], rating: 4.1, releaseYear: 2014, description: "عالم مظلم وقاسٍ! قتال متطلب واستكشاف خطير. كل موت درس جديد.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/335300/DARK_SOULS_II/" },
  { id: "ds3", name: "Dark Souls III", cover: "/assets/GameCovor/Dark Souls III.png", publisher: "Bandai Namco", developer: "FromSoftware", genre: ["RPG", "أكشن"], rating: 4.5, releaseYear: 2016, description: "خاتمة Dark Souls! رؤساء أسطورين وقتال سريع وعالم مبهر.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/374320/DARK_SOULS_III/" },
  { id: "ds-remastered", name: "Dark Souls Remastered", cover: "/assets/GameCovor/Dark Souls Remastered.png", publisher: "Bandai Namco", developer: "FromSoftware", genre: ["RPG", "أكشن"], rating: 4.4, releaseYear: 2018, description: "الأصل الأسطوري بتحسين! اللعبة التي عرّفت Souls-like.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-6", steamUrl: "https://store.steampowered.com/app/570940/DARK_SOULS_REMASTERED/" },
  { id: "dayz", name: "DayZ", cover: "/assets/GameCovor/DayZ.png", publisher: "Bohemia Interactive", developer: "Bohemia Interactive", genre: ["بقاء", "عالم مفتوح"], rating: 3.9, releaseYear: 2018, description: "بقاء زومبي! جوع، عطش، ولاعبين خطيرين. كل قرار مميت.", platforms: ["PC", "PS", "Xbox"], players: "1-60", steamUrl: "https://store.steampowered.com/app/221100/DayZ/" },
  { id: "deathloop", name: "Deathloop", cover: "/assets/GameCovor/Deathloop.png", publisher: "Bethesda", developer: "Arkane Studios", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.3, releaseYear: 2021, description: "حلقة زمنية! اقتل 8 أهداف في يوم واحد أو كرر. من مطورين Dishonored.", platforms: ["PC", "PS"], players: "1-2", steamUrl: "https://store.steampowered.com/app/1252330/DEATHLOOP/" },
  { id: "dishonored-2", name: "Dishonored 2", cover: "/assets/GameCovor/Dishonored 2.png", publisher: "Bethesda", developer: "Arkane Studios", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.5, releaseYear: 2016, description: "كورفو أو إيميلي! قدرات خارقة وتسلل إبداعي بعالم ستيامبانك.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/403640/Dishonored_2/" },
  { id: "dishonored-doto", name: "Dishonored: Death of the Outsider", cover: "/assets/GameCovor/Dishonored Death of the Outsider.png", publisher: "Bethesda", developer: "Arkane Studios", genre: ["أكشن-مغامرة", "تسلل"], rating: 4.1, releaseYear: 2017, description: "بيلي تلاحق الغريب! قدرات جديدة وخططات إبداعية.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/614570/Dishonored_Death_of_the_Outsider/" },
  { id: "fallout-76", name: "Fallout 76", cover: "/assets/GameCovor/Fallout 76.png", publisher: "Bethesda", developer: "Bethesda Game Studios", genre: ["RPG", "بقاء"], rating: 3.8, releaseYear: 2018, description: "فالوت أونلاين! استكشف فرجينيا الغربية بعد الحرب النووية مع لاعبين آخرين.", platforms: ["PC", "PS", "Xbox"], players: "1-24", steamUrl: "https://store.steampowered.com/app/1151340/Fallout_76/" },
  { id: "la-noire", name: "L.A. Noire", cover: "/assets/GameCovor/L.A. Noire.png", publisher: "Rockstar Games", developer: "Team Bondi", genre: ["أكشن-مغامرة", "تحقيق"], rating: 4.2, releaseYear: 2011, description: "محقق في لوس أنجلوس الأربعينات! حل الجرائم وكشف الأكاذيب.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/1028550/LA_Noire/" },
  { id: "mafia-2", name: "Mafia II: Definitive Edition", cover: "/assets/GameCovor/Mafia II Definitive Edition.png", publisher: "2K Games", developer: "Hangar 13", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.0, releaseYear: 2020, description: "قصة مافيا في الخمسينات! فيتو يصعد في عالم الجريمة بإمباير باي.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1030830/Mafia_Definitive_Edition/" },
  { id: "mafia-3", name: "Mafia III: Definitive Edition", cover: "/assets/GameCovor/Mafia III Definitive Edition.png", publisher: "2K Games", developer: "Hangar 13", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 3.8, releaseYear: 2020, description: "انتقام في نيو بوردو! لينكون كلاي يهدم المافيا من الداخل.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/360430/Mafia_III_Definitive_Edition/" },
  { id: "me-andromeda", name: "Mass Effect: Andromeda", cover: "/assets/GameCovor/Mass Effect Andromeda.png", publisher: "EA", developer: "BioWare Montreal", genre: ["RPG", "أكشن"], rating: 3.9, releaseYear: 2017, description: "استكشاف مجرة أندروميدا! ابحث عن بيت جديد للبشرية في الفضاء.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1238000/Mass_Effect_Andromeda_Deluxe_Edition/" },
  { id: "me-legendary", name: "Mass Effect Legendary Edition", cover: "/assets/GameCovor/Mass Effect Legendary Edition.png", publisher: "EA", developer: "BioWare", genre: ["RPG", "أكشن"], rating: 4.7, releaseYear: 2021, description: "الثلاثية الأسطورية محسّنة! شيبرد يحارب لإنقاذ المجرة. خيارات مصيرية.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1328670/Mass_Effect_Legendary_Edition/" },
  { id: "shadow-mordor", name: "Middle-earth: Shadow of Mordor", cover: "/assets/GameCovor/Middle-earth Shadow of Mordor.png", publisher: "Warner Bros.", developer: "Monolith Productions", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.3, releaseYear: 2014, description: "انتقام في موردر! نظام Nemesis فريد يخلق أعداء يتذكرونك.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/241930/Middleearth_Shadow_of_Mordor/" },
  { id: "shadow-war", name: "Middle-earth: Shadow of War", cover: "/assets/GameCovor/Middle-earth Shadow of War.png", publisher: "Warner Bros.", developer: "Monolith Productions", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.1, releaseYear: 2017, description: "تكملة Shadow of Mordor! ابنِ جيشك من الأوركس وواجه سورون.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/356190/Middleearth_Shadow_of_War/" },
  { id: "nfs-payback", name: "Need for Speed Payback", cover: "/assets/GameCovor/Need for Speed Payback.png", publisher: "EA", developer: "Ghost Games", genre: ["سباق", "أكشن"], rating: 3.6, releaseYear: 2017, description: "انتقام في عالم السباقات! فريق من ثلاثة يهزمون عصابة المراهنات.", platforms: ["PC", "PS", "Xbox"], players: "1-8", steamUrl: "https://store.steampowered.com/app/1262540/Need_for_Speed_Payback/" },
  { id: "nfs-unbound", name: "Need for Speed Unbound", cover: "/assets/GameCovor/Need for Speed Unbound.png", publisher: "EA", developer: "Criterion Games", genre: ["سباق", "عالم مفتوح"], rating: 3.8, releaseYear: 2022, description: "سباقات بأسلوب أنمي! شارع ليكشور، تخصيص سيارات، وأجواء هيب هوب.", platforms: ["PC", "PS", "Xbox"], players: "1-16", steamUrl: "https://store.steampowered.com/app/1846380/Need_for_Speed_Unbound/" },
  { id: "planet-coaster", name: "Planet Coaster", cover: "/assets/GameCovor/Planet Coaster.png", publisher: "Frontier", developer: "Frontier Developments", genre: ["محاكاة", "إبداعي"], rating: 4.4, releaseYear: 2016, description: "ابنِ مدينة ملاهي أحلامك! ألعاب مائية، أفعوانيات، وحدائق مذهلة.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/493340/Planet_Coaster/" },
  { id: "planet-zoo", name: "Planet Zoo", cover: "/assets/GameCovor/Planet Zoo'.png", publisher: "Frontier", developer: "Frontier Developments", genre: ["محاكاة", "إبداعي"], rating: 4.5, releaseYear: 2019, description: "ابنِ حديقة حيوانات! حيوانات واقعية، بيئات طبيعية، وإدارة الحديقة.", platforms: ["PC"], players: "1", steamUrl: "https://store.steampowered.com/app/703080/Planet_Zoo/" },
  { id: "prey-2017", name: "Prey", cover: "/assets/GameCovor/Prey (2017).png", publisher: "Bethesda", developer: "Arkane Studios", genre: ["أكشن-مغامرة", "RPG"], rating: 4.3, releaseYear: 2017, description: "محطة فضائية غامضة! مورغان يواجه كائنات شيبوث وقتال بقدرات غريبة.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/480490/Prey/" },
  { id: "prince-persia", name: "Prince of Persia: The Forgotten Sands", cover: "/assets/GameCovor/Prince of Persia The Forgotten Sands.png", publisher: "Ubisoft", developer: "Ubisoft Montreal", genre: ["أكشن-مغامرة", "منصات"], rating: 3.9, releaseYear: 2010, description: "أمير فارس يعود! منصات وقفز وقتال بعالم ألف ليلة وليلة.", platforms: ["PC", "PS", "Xbox", "Wii"], players: "1", steamUrl: "https://store.steampowered.com/app/33320/Prince_of_Persia_The_Forgotten_Sands/" },
  { id: "project-cars-2", name: "Project CARS 2", cover: "/assets/GameCovor/Project CARS 2.png", publisher: "Bandai Namco", developer: "Slightly Mad Studios", genre: ["سباق", "محاكاة"], rating: 4.2, releaseYear: 2017, description: "محاكاة سباقات واقعية! طقس ديناميكي و180 سيارة و140 حلقة.", platforms: ["PC", "PS", "Xbox"], players: "1-16", steamUrl: "https://store.steampowered.com/app/378860/Project_CARS_2/" },
  { id: "re2-2019", name: "Resident Evil 2 Remake", cover: "/assets/GameCovor/Resident Evil 2 2019.png", publisher: "Capcom", developer: "Capcom", genre: ["رعب", "أكشن"], rating: 4.6, releaseYear: 2019, description: "إعادة صنع تحفة الرعب! ليون وكلير في مبنى الراكون سيتي المرعب.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/883710/Resident_Evil_2/" },
  { id: "re3-2020", name: "Resident Evil 3 Remake", cover: "/assets/GameCovor/Resident Evil 3 2020.png", publisher: "Capcom", developer: "Capcom", genre: ["رعب", "أكشن"], rating: 4.1, releaseYear: 2020, description: "جيل فالنتاين تهرب من النيميسس! رعب وأكشن سريع في راكون سيتي.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/952060/Resident_Evil_3/" },
  { id: "snowrunner", name: "SnowRunner", cover: "/assets/GameCovor/SnowRunner.png", publisher: "Focus Entertainment", developer: "Saber Interactive", genre: ["محاكاة", "قيادة"], rating: 4.3, releaseYear: 2020, description: "شاحنات في الثلج والوحل! أوصل البضائع عبر تضاريس مستحيلة.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1222670/SnowRunner/" },
  { id: "state-of-decay-2", name: "State of Decay 2", cover: "/assets/GameCovor/State of Decay 2.png", publisher: "Xbox Game Studios", developer: "Undead Labs", genre: ["بقاء", "زومبي"], rating: 3.9, releaseYear: 2018, description: "بقاء زومبي مع إدارة مجتمع! ابنِ قريتك ونجُ من الحشود.", platforms: ["PC", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1355160/State_of_Decay_2_Juggernaut_Edition/" },
  { id: "tes-oblivion", name: "The Elder Scrolls IV: Oblivion", cover: "/assets/GameCovor/The Elder Scrolls IV Oblivion.png", publisher: "Bethesda", developer: "Bethesda Game Studios", genre: ["RPG", "عالم مفتوح"], rating: 4.5, releaseYear: 2006, description: "تحفة RPG كلاسيكية! سايروديل بعالم مفتوح ضخم وغيلاس مفتوح.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/22330/The_Elder_Scrolls_IV_Oblivion/" },
  { id: "tes-online", name: "The Elder Scrolls Online", cover: "/assets/GameCovor/The Elder Scrolls Online.png", publisher: "Bethesda", developer: "Zenimax Online", genre: ["RPG", "MMO"], rating: 4.2, releaseYear: 2014, description: "عالم Elder Scrolls أونلاين! استكشف تامريال مع آلاف اللاعبين.", platforms: ["PC", "PS", "Xbox"], players: "1-∞", steamUrl: "https://store.steampowered.com/app/306130/The_Elder_Scrolls_Online/" },
  { id: "evil-within-2", name: "The Evil Within 2", cover: "/assets/GameCovor/The Evil Within 2.png", publisher: "Bethesda", developer: "Tango Gameworks", genre: ["رعب", "أكشن"], rating: 4.1, releaseYear: 2017, description: "سيباستيان يعود لعالم STEM! أنقذ ابنتك من عالم مرعب ومشوّه.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/447440/The_Evil_Within_2/" },
  { id: "wolfenstein-2", name: "Wolfenstein II: The New Colossus", cover: "/assets/GameCovor/Wolfenstein II The New Colossus.png", publisher: "Bethesda", developer: "MachineGames", genre: ["شوتر", "أكشن"], rating: 4.4, releaseYear: 2017, description: "بي.جيه يقاتل النازيين بأمريكا المحتلة! قصة قوية وقتال عنيف.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/612830/Wolfenstein_II_The_New_Colossus/" },
  { id: "wolfenstein-youngblood", name: "Wolfenstein: Youngblood", cover: "/assets/GameCovor/Wolfenstein Youngblood.png", publisher: "Bethesda", developer: "MachineGames", genre: ["شوتر", "أكشن"], rating: 3.5, releaseYear: 2019, description: "بنات بي.جيه في باريس النازية! تعاوني وقتال بأخوات بلازكوفيتش.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-2", steamUrl: "https://store.steampowered.com/app/1056960/Wolfenstein_Youngblood/" },
  { id: "xcom-2", name: "XCOM 2", cover: "/assets/GameCovor/XCOM 2.png", publisher: "2K Games", developer: "Firaxis Games", genre: ["استراتيجية", "تكتيكي"], rating: 4.5, releaseYear: 2016, description: "قُد المقاومة ضد الغزاة الفضائيين! استراتيجية تكتيكية دورية عميقة.", platforms: ["PC", "PS", "Xbox"], players: "1-2", steamUrl: "https://store.steampowered.com/app/268500/XCOM_2/" },
  { id: "hoi4", name: "Hearts of Iron IV", cover: "/assets/GameCovor/Hearts of Iron IV.png", publisher: "Paradox", developer: "Paradox Dev Studio", genre: ["استراتيجية", "محاكاة"], rating: 4.4, releaseYear: 2016, description: "قُد أي دولة في الحرب العالمية الثانية! استراتيجية حرب ضخمة ومعقدة.", platforms: ["PC"], players: "1-32", steamUrl: "https://store.steampowered.com/app/394360/Hearts_of_Iron_IV/" },

  // === New Additions ===
  { id: "armored-core-6", name: "Armored Core VI: Fires of Rubicon", cover: "/assets/GameCovor/Armored Core VI Fires of Rubicon.png", publisher: "Bandai Namco", developer: "FromSoftware", genre: ["أكشن", "شوتر"], rating: 4.5, releaseYear: 2023, description: "من FromSoftware! ميكا قتال سريع وتخصيص روبوتات. معارك مكثفة وقصة غامضة.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/616720/ARMORED_CORE_VI_FIRES_OF_RUBICON/" },
  { id: "bioshock-infinite", name: "BioShock Infinite", cover: "/assets/GameCovor/BioShock Infinite.png", publisher: "2K Games", developer: "Irrational Games", genre: ["شوتر", "أكشن-مغامرة"], rating: 4.6, releaseYear: 2013, description: "مدينة في السماء! بوكر ديويت في كولومبيا. قصة مبهرة ونهاية لا تُنسى.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/8870/BioShock_Infinite/" },
  { id: "bioshock-remastered", name: "BioShock Remastered", cover: "/assets/GameCovor/BioShock Remastered.png", publisher: "2K Games", developer: "Irrational Games", genre: ["شوتر", "رعب"], rating: 4.5, releaseYear: 2016, description: "تحفة راشر! مدينة رابتشر تحت الماء. أجواء مرعبة وقصة ممتازة.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/409710/BioShock_Remastered/" },
  { id: "black-myth-wukong", name: "Black Myth: Wukong", cover: "/assets/GameCovor/Black Myth Wukong.png", publisher: "Game Science", developer: "Game Science", genre: ["أكشن", "RPG"], rating: 4.7, releaseYear: 2024, description: "ملحمة صينية! ملك القردة ووكونغ في رحلة أسطورية. قتال مذهل وعالم مبهر.", platforms: ["PC", "PS5"], players: "1", steamUrl: "https://store.steampowered.com/app/2358720/Black_Myth_Wukong/" },
  { id: "blasphemous-2", name: "Blasphemous 2", cover: "/assets/GameCovor/Blasphemous 2.png", publisher: "Team17", developer: "The Game Kitchen", genre: ["Metroidvania", "أكشن"], rating: 4.3, releaseYear: 2023, description: "عالم مظلم ديني! قتال صعب وفن بكسل مذهل. تكملة أفضل من الأصل.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/1222080/Blasphemous_2/" },
  { id: "borderlands-2", name: "Borderlands 2", cover: "/assets/GameCovor/Borderlands 2.png", publisher: "2K Games", developer: "Gearbox Software", genre: ["شوتر", "RPG"], rating: 4.5, releaseYear: 2012, description: "شوتر RPG بأسلوب كوميدي! هاندسوم جاك شرير رائع وغنائم لا نهائية.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/49520/Borderlands_2/" },
  { id: "borderlands-3", name: "Borderlands 3", cover: "/assets/GameCovor/Borderlands 3.png", publisher: "2K Games", developer: "Gearbox Software", genre: ["شوتر", "RPG"], rating: 4.1, releaseYear: 2019, description: "تكملة Borderlands! أسلحة أكثر وعوالم متعددة وكوميديا مجنونة.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/397540/Borderlands_3/" },
  { id: "cod-mw", name: "CoD: Modern Warfare", cover: "/assets/GameCovor/Call of Duty Modern Warfare.png", publisher: "Activision", developer: "Infinity Ward", genre: ["شوتر", "أكشن"], rating: 4.3, releaseYear: 2019, description: "إعادة صنع Modern Warfare! حملة واقعية وأوضاع متعددة محسّنة.", platforms: ["PC", "PS", "Xbox"], players: "6v6", steamUrl: "https://store.steampowered.com/app/2000950/Call_of_Duty_Modern_Warfare/" },
  { id: "atomic-heart", name: "Atomic Heart", cover: "/assets/GameCovor/Atomic Heart.png", publisher: "Focus Entertainment", developer: "Mundfish", genre: ["أكشن-مغامرة", "شوتر"], rating: 4.0, releaseYear: 2023, description: "اتحاد سوفيتي بديل! روبوتات تتمرد ومغامرة في منشأة غامضة. Bioshock سوفيتي!", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/666610/Atomic_Heart/" },
  { id: "mortal-kombat-1", name: "Mortal Kombat 1", cover: "/assets/GameCovor/Mortal Kombat 1.png", publisher: "Warner Bros.", developer: "NetherRealm Studios", genre: ["قتال", "تنافسي"], rating: 4.2, releaseYear: 2023, description: "إعادة بعالم جديد! فتاليتيز دموية وشخصيات كلاسيكية. أفضل MK!", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-2", steamUrl: "https://store.steampowered.com/app/1970920/Mortal_Kombat_1/" },
  { id: "conan-exiles", name: "Conan Exiles", cover: "/assets/GameCovor/Conan Exiles.png", publisher: "Funcom", developer: "Funcom", genre: ["بقاء", "عالم مفتوح"], rating: 3.9, releaseYear: 2018, description: "بقاء في عالم كونان البربري! ابنِ قلعتك، اعبد آلهة، وقاتل الوحوش.", platforms: ["PC", "PS", "Xbox"], players: "1-70", steamUrl: "https://store.steampowered.com/app/440900/Conan_Exiles/" },
  { id: "destiny-2", name: "Destiny 2", cover: "/assets/GameCovor/Destiny 2.png", publisher: "Bungie", developer: "Bungie", genre: ["شوتر", "RPG"], rating: 4.3, releaseYear: 2017, description: "شوتر RPG فضائي! غنائم وراء غنائم، raids تعاونية، وعالم ضخم.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/1085660/Destiny_2/" },
  { id: "dragon-ball-fighterz", name: "Dragon Ball FighterZ", cover: "/assets/GameCovor/Dragon Ball FighterZ.png", publisher: "Bandai Namco", developer: "Arc System Works", genre: ["قتال", "أنمي"], rating: 4.5, releaseYear: 2018, description: "قتال أنمي بأسلوب دراغون بول! رسومات مذهلة وقتال سريع 3v3.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-2", steamUrl: "https://store.steampowered.com/app/678950/DRAGON_BALL_FighterZ/" },
  { id: "enshrouded", name: "Enshrouded", cover: "/assets/GameCovor/Enshrouded.png", publisher: "Keen Games", developer: "Keen Games", genre: ["بقاء", "RPG"], rating: 4.2, releaseYear: 2024, description: "بقاء RPG! ابنِ، قاتل، واستكشف عالم إنفيل. تعاوني مع بناء حر.", platforms: ["PC"], players: "1-16", steamUrl: "https://store.steampowered.com/app/1203220/Enshrouded/" },
  { id: "grounded", name: "Grounded", cover: "/assets/GameCovor/Grounded.png", publisher: "Xbox Game Studios", developer: "Obsidian Entertainment", genre: ["بقاء", "تعاوني"], rating: 4.1, releaseYear: 2022, description: "أنت بحجم نملة! نجا في الفناء الخلفي. عناكب ضخمة وبناء قواعد.", platforms: ["PC", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/962130/Grounded/" },
  { id: "guilty-gear-strive", name: "Guilty Gear Strive", cover: "/assets/GameCovor/Guilty Gear Strive (2021) .png", publisher: "Arc System Works", developer: "Arc System Works", genre: ["قتال", "تنافسي"], rating: 4.4, releaseYear: 2021, description: "قتال أنمي فائق الجودة! رسومات مذهلة وقتال عميق وشخصيات فريدة.", platforms: ["PC", "PS"], players: "1-2", steamUrl: "https://store.steampowered.com/app/1384160/GUILTY_GEAR_STRIVE/" },
  { id: "helldivers-2", name: "Helldivers 2", cover: "/assets/GameCovor/Helldivers 2.png", publisher: "PlayStation Studios", developer: "Arrowhead Game Studios", genre: ["شوتر", "تعاوني"], rating: 4.6, releaseYear: 2024, description: "نشر الديمقراطية! شوتر تعاوني فوق كواكب. صديقك يقتلك بالخطأ دائماً!", platforms: ["PC", "PS"], players: "1-4", steamUrl: "https://store.steampowered.com/app/553850/Helldivers_2/" },
  { id: "helldivers-1", name: "Helldivers", cover: "/assets/GameCovor/Helldivers.png", publisher: "PlayStation Studios", developer: "Arrowhead Game Studios", genre: ["شوتر", "تعاوني"], rating: 4.0, releaseYear: 2015, description: "الأصل! شوتر تعاوني من فوق. نشر الديمقراطية بأسلوب كلاسيكي.", platforms: ["PC", "PS"], players: "1-4", steamUrl: "https://store.steampowered.com/app/394510/Helldivers_Dive_Harder_Edition/" },
  { id: "lies-of-p", name: "Lies of P", cover: "/assets/GameCovor/Lies of P.png", publisher: "NEOWIZ", developer: "NEOWIZ", genre: ["RPG", "أكشن"], rating: 4.3, releaseYear: 2023, description: "بينوتشيو المظلم! Souls-like في مدينة ستيامبانك مرعبة. قتال بالسيوف وكذب.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/819380/Lies_of_P/" },
  { id: "no-mans-sky", name: "No Man's Sky", cover: "/assets/GameCovor/No Man’s Sky.png", publisher: "Hello Games", developer: "Hello Games", genre: ["بقاء", "عالم مفتوح"], rating: 4.2, releaseYear: 2016, description: "كونج بلا حدود! استكشف كواكب لا نهائية. التحديثات جعلتها لعبة مختلفة.", platforms: ["PC", "PS", "Xbox"], players: "1-32", steamUrl: "https://store.steampowered.com/app/275850/No_Mans_Sky/" },
  { id: "once-human", name: "Once Human", cover: "/assets/GameCovor/Once Human.png", publisher: "NetEase", developer: "Starry Studio", genre: ["بقاء", "عالم مفتوح"], rating: 3.8, releaseYear: 2024, description: "بقاء بعد كارثة! وحوش مشوهة وبناء قواعد. مجاني وأونلاين.", platforms: ["PC"], players: "1-∞", steamUrl: "https://store.steampowered.com/app/2139460/Once_Human/" },
  { id: "ori-blind", name: "Ori and the Blind Forest", cover: "/assets/GameCovor/Ori and the Blind Forest.png", publisher: "Xbox Game Studios", developer: "Moon Studios", genre: ["Metroidvania", "منصات"], rating: 4.8, releaseYear: 2015, description: "منصات مذهلة! أوري ينقذ الغابة. رسومات ساحرة وموسيقى تبكي.", platforms: ["PC", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/261570/Ori_and_the_Blind_Forest/" },
  { id: "ori-wisps", name: "Ori and the Will of the Wisps", cover: "/assets/GameCovor/Ori and the Will of the Wisps.png", publisher: "Xbox Game Studios", developer: "Moon Studios", genre: ["Metroidvania", "منصات"], rating: 4.9, releaseYear: 2020, description: "تكملة أفضل! أوري في مغامرة جديدة. قتال محسّن ورسومات أبكية.", platforms: ["PC", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/1057090/Ori_and_the_Will_of_the_Wisps/" },
  { id: "palworld", name: "Palworld", cover: "/assets/GameCovor/Palworld.png", publisher: "Pocketpair", developer: "Pocketpair", genre: ["بقاء", "صندوق رمل"], rating: 4.1, releaseYear: 2024, description: "بوكيمون مع بنادق! اصطد رفاقك، ابنِ قاعدتك، واجمع موارد. جنون!", platforms: ["PC", "Xbox"], players: "1-32", steamUrl: "https://store.steampowered.com/app/1623730/Palworld/" },
  { id: "path-of-exile", name: "Path of Exile", cover: "/assets/GameCovor/Path of Exile.png", publisher: "Grinding Gear Games", developer: "Grinding Gear Games", genre: ["RPG", "أكشن"], rating: 4.4, releaseYear: 2013, description: "مجاني Diablo بعمق أكبر! شجرة مهارات ضخمة ومواسم جديدة دائماً.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/238960/Path_of_Exile/" },
  { id: "payday-2", name: "PAYDAY 2", cover: "/assets/GameCovor/PAYDAY 2.png", publisher: "505 Games", developer: "Overkill Software", genre: ["شوتر", "تعاوني"], rating: 4.3, releaseYear: 2013, description: "سرقات بنوك تعاونية! خطط ونفّذ واهرب. أكثر من 100 سرقة.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-4", steamUrl: "https://store.steampowered.com/app/218620/PAYDAY_2/" },
  { id: "payday-3", name: "PAYDAY 3", cover: "/assets/GameCovor/PAYDAY 3.png", publisher: "Deep Silver", developer: "Starbreeze Studios", genre: ["شوتر", "تعاوني"], rating: 3.5, releaseYear: 2023, description: "تكملة PAYDAY! سرقات في نيويورك. أجواء حديثة وتعاوني.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/2218160/PAYDAY_3/" },
  { id: "remnant-fa", name: "Remnant: From the Ashes", cover: "/assets/GameCovor/Remnant From the Ashes.png", publisher: "Perfect World", developer: "Gunfire Games", genre: ["شوتر", "RPG"], rating: 4.1, releaseYear: 2019, description: "شوتر RPG بعالم مظلم! رؤساء صعبين وعوالم متنوعة وتعاوني.", platforms: ["PC", "PS", "Xbox"], players: "1-3", steamUrl: "https://store.steampowered.com/app/617320/Remnant_From_the_Ashes/" },
  { id: "remnant-2", name: "Remnant II", cover: "/assets/GameCovor/Remnant II.png", publisher: "Gearbox Publishing", developer: "Gunfire Games", genre: ["شوتر", "RPG"], rating: 4.3, releaseYear: 2023, description: "تكملة أفضل! عوالم أكثر ورؤساء أصعب وبناء شخصيات أعمق.", platforms: ["PC", "PS", "Xbox"], players: "1-3", steamUrl: "https://store.steampowered.com/app/1282100/Remnant_2/" },
  { id: "returnal", name: "Returnal", cover: "/assets/GameCovor/Returnal.png", publisher: "PlayStation Studios", developer: "Housemarque", genre: ["Roguelike", "شوتر"], rating: 4.3, releaseYear: 2023, description: "حلقة زمنية على كوكب غريب! سيلين تموت وتعود. رعب وأكشن سريع.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1649240/Returnal/" },
  { id: "robocop-rc", name: "RoboCop: Rogue City", cover: "/assets/GameCovor/RoboCop Rogue City.png", publisher: "Nacon", developer: "Teyon", genre: ["شوتر", "أكشن"], rating: 3.8, releaseYear: 2023, description: "روبوكوب في ديترويت! بطيء وقوي. أنت القانون.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1681430/RoboCop_Rogue_City/" },
  { id: "street-fighter-6", name: "Street Fighter 6", cover: "/assets/GameCovor/Street Fighter 6.png", publisher: "Capcom", developer: "Capcom", genre: ["قتال", "تنافسي"], rating: 4.5, releaseYear: 2023, description: "أفضل Street Fighter! نظام تحكم سهل وعميق. عالم تجول جديد.", platforms: ["PC", "PS", "Xbox"], players: "1-2", steamUrl: "https://store.steampowered.com/app/1364210/Street_Fighter_6/" },
  { id: "subnautica", name: "Subnautica", cover: "/assets/GameCovor/Subnautica.png", publisher: "Unknown Worlds", developer: "Unknown Worlds", genre: ["بقاء", "استكشاف"], rating: 4.7, releaseYear: 2018, description: "بقاء تحت الماء! استكشف محيط كوكب غريب. رعب واكتشاف وجمال.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/264710/Subnautica/" },
  { id: "subnautica-bz", name: "Subnautica: Below Zero", cover: "/assets/GameCovor/Subnautica Below Zero.png", publisher: "Unknown Worlds", developer: "Unknown Worlds", genre: ["بقاء", "استكشاف"], rating: 4.2, releaseYear: 2021, description: "تكملة تحت الجليد! محيط متجمد وأسرار جديدة وقصة أعمق.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1", steamUrl: "https://store.steampowered.com/app/848450/Subnautica_Below_Zero/" },
  { id: "tekken-8", name: "Tekken 8", cover: "/assets/GameCovor/Tekken 8.png", publisher: "Bandai Namco", developer: "Bandai Namco", genre: ["قتال", "تنافسي"], rating: 4.4, releaseYear: 2024, description: "قتال 3D بأفضل رسومات! شخصيات ميشيما وقصتهم الملحمية.", platforms: ["PC", "PS", "Xbox"], players: "1-2", steamUrl: "https://store.steampowered.com/app/1778820/TEKKEN_8/" },
  { id: "tiny-tina", name: "Tiny Tina's Wonderlands", cover: "/assets/GameCovor/Tiny Tina’s Wonderlands.png", publisher: "2K Games", developer: "Gearbox Software", genre: ["شوتر", "RPG"], rating: 4.0, releaseYear: 2022, description: "Borderlands بأسلوب D&D! تاينا تيني تحكي قصة فانتازيا مجنونة.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1460580/Tiny_Tinas_Wonderlands/" },
  { id: "trepang2", name: "Trepang2", cover: "/assets/GameCovor/Trepang2.png", publisher: "Focus Entertainment", developer: "Trepang Studios", genre: ["شوتر", "أكشن"], rating: 4.0, releaseYear: 2023, description: "شوتر سريع مثل FEAR! حركة بطيئة وقتال عنيف وأجواء مرعبة.", platforms: ["PC"], players: "1", steamUrl: "https://store.steampowered.com/app/1164640/Trepang2/" },
  { id: "ultrakill", name: "Ultrakill", cover: "/assets/GameCovor/Ultrakill.png", publisher: "New Blood", developer: "Hakita", genre: ["شوتر", "أكشن"], rating: 4.7, releaseYear: 2020, description: "شوتر سريع بأسلوب ريترو! حركة جنونية ونظام أسلوب مثل DMC.", platforms: ["PC"], players: "1", steamUrl: "https://store.steampowered.com/app/1229490/ULTRAKILL/" },
  { id: "v-rising", name: "V Rising", cover: "/assets/GameCovor/V Rising.png", publisher: "Stunlock Studios", developer: "Stunlock Studios", genre: ["بقاء", "أكشن"], rating: 4.1, releaseYear: 2022, description: "أنت مصاص دماء! ابنِ قلعتك، اصطد البشر، وحكم الليل.", platforms: ["PC"], players: "1-50", steamUrl: "https://store.steampowered.com/app/1604030/V_Rising/" },
  { id: "valheim", name: "Valheim", cover: "/assets/GameCovor/Valheim.png", publisher: "Coffee Stain", developer: "Iron Gate", genre: ["بقاء", "عالم مفتوح"], rating: 4.4, releaseYear: 2021, description: "بقاء فايكنغ! ابنِ، قاتل رؤساء، واستكشف عالم الأساطير النوردية.", platforms: ["PC"], players: "1-10", steamUrl: "https://store.steampowered.com/app/892970/Valheim/" },
  { id: "warframe", name: "Warframe", cover: "/assets/GameCovor/Warframe.png", publisher: "Digital Extremes", developer: "Digital Extremes", genre: ["شوتر", "أكشن"], rating: 4.3, releaseYear: 2013, description: "مجاني! نينجا فضائي بأسلحة غريبة. محتوى ضخم وتحديثات مستمرة.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-4", steamUrl: "https://store.steampowered.com/app/230410/Warframe/" },
  { id: "wh40k-sm2", name: "Warhammer 40K: Space Marine 2", cover: "/assets/GameCovor/Warhammer 40,000 Space Marine 2.png", publisher: "Focus Entertainment", developer: "Saber Interactive", genre: ["شوتر", "أكشن"], rating: 4.4, releaseYear: 2024, description: "سبيس مارين يذبح تايرنيدس! أكشن عنيف وتعاوني مع فرقة.", platforms: ["PC", "PS", "Xbox"], players: "1-3", steamUrl: "https://store.steampowered.com/app/2186880/Warhammer_40000_Space_Marine_2/" },
  { id: "wo-long", name: "Wo Long: Fallen Dynasty", cover: "/assets/GameCovor/Wo Long Fallen Dynasty.png", publisher: "Koei Tecmo", developer: "Team Ninja", genre: ["RPG", "أكشن"], rating: 4.0, releaseYear: 2023, description: "Souls-like صيني! قتال بالسيوف وسحر في عصر سقوط هان.", platforms: ["PC", "PS", "Xbox"], players: "1-3", steamUrl: "https://store.steampowered.com/app/2285240/Wo_Long_Fallen_Dynasty/" },

  // === 2024-2025 New Releases ===
  { id: "arc-raiders", name: "ARC Raiders", cover: "/assets/GameCovor/ARC Raiders.png", publisher: "Embark Studios", developer: "Embark Studios", genre: ["شوتر", "تعاوني"], rating: 4.2, releaseYear: 2025, description: "شوتر تعاوني ضد غزاة فضائيين! من مطورين Battlefield. أكشن سريع وأسلحة غريبة.", platforms: ["PC", "PS", "Xbox"], players: "1-3", steamUrl: "https://store.steampowered.com/app/1817190/ARC_Raiders/" },
  { id: "atomfall", name: "Atomfall", cover: "/assets/GameCovor/Atomfall.png", publisher: "SEGA", developer: "Rebellion", genre: ["بقاء", "أكشن-مغامرة"], rating: 4.1, releaseYear: 2025, description: "بقاء بعد كارثة نووية في بريطانيا! استكشف، قاتل، واكتشف أسرار المنطقة المحظورة.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2035440/Atomfall/" },
  { id: "avowed", name: "Avowed", cover: "/assets/GameCovor/Avowed.png", publisher: "Xbox Game Studios", developer: "Obsidian Entertainment", genre: ["RPG", "أكشن"], rating: 4.2, releaseYear: 2025, description: "من Obsidian! RPG بعالم Pillars of Eternity. سحر وأسلحة في عالم جزر حي.", platforms: ["PC", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2050160/Avowed/" },
  { id: "clair-obscur", name: "Clair Obscur: Expedition 33", cover: "/assets/GameCovor/Clair Obscur Expedition 33.png", publisher: "Kepler Interactive", developer: "Sandfall Interactive", genre: ["RPG", "أكشن"], rating: 4.5, releaseYear: 2025, description: "RPG فرنسي بأسلوب بيل إيبوك! قتال دوري مبدع وعالم مبهر مستوحى من باريس.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1888190/Clair_Obscur_Expedition_33/" },
  { id: "crimson-desert", name: "Crimson Desert", cover: "/assets/GameCovor/Crimson Desert.png", publisher: "Pearl Abyss", developer: "Pearl Abyss", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.3, releaseYear: 2025, description: "عالم مفتوح ملحمي! قتال سينمائي واستكشاف من مطوري Black Desert.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1754210/Crimson_Desert/" },
  { id: "cronos", name: "Cronos: The New Dawn", cover: "/assets/GameCovor/Cronos The New Dawn.png", publisher: "CI Games", developer: "Hex Works", genre: ["RPG", "أكشن"], rating: 4.0, releaseYear: 2025, description: "Souls-like بعالم سريالي! قتال صعب وأجواء غريبة بين الماضي والمستقبل.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2384680/Cronos_The_New_Dawn/" },
  { id: "ds2-beach", name: "Death Stranding 2: On the Beach", cover: "/assets/GameCovor/Death Stranding 2 On the Beach.png", publisher: "Kojima Productions", developer: "Kojima Productions", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.4, releaseYear: 2025, description: "تكملة كوجيما! سام يواصل رحلته بعالم جديد. أجواء فريدة وقصة مجنونة.", platforms: ["PS"], players: "1-16", steamUrl: "" },
  { id: "delta-force", name: "Delta Force", cover: "/assets/GameCovor/Delta Force.png", publisher: "TiMi Studio", developer: "Team Jade", genre: ["شوتر", "تكتيكي"], rating: 4.1, releaseYear: 2025, description: "شوتر تكتيكي مجاني! معارك كبيرة وأوضاع متعددة. من سلسلة Delta Force الكلاسيكية.", platforms: ["PC", "PS", "Xbox"], players: "32v32", steamUrl: "https://store.steampowered.com/app/2358770/Delta_Force/" },
  { id: "doom-dark-ages", name: "DOOM: The Dark Ages", cover: "/assets/GameCovor/DOOM The Dark Ages.png", publisher: "Bethesda", developer: "id Software", genre: ["شوتر", "أكشن"], rating: 4.8, releaseYear: 2025, description: "سلاير في العصور الوسطى! درع منشار وأسلحة مذهلة. أسرع وأعنف DOOM.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2340520/DOOM_The_Dark_Ages/" },
  { id: "dragons-dogma-2", name: "Dragon's Dogma 2", cover: "/assets/GameCovor/Dragon's Dogma 2.png", publisher: "Capcom", developer: "Capcom", genre: ["RPG", "عالم مفتوح"], rating: 4.2, releaseYear: 2024, description: "تكملة RPG كابكوم! عالم مفتوح وقتال بالسيوف وسحر مع رفاق الباون.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1744920/Dragons_Dogma_2/" },
  { id: "dune-awakening", name: "Dune: Awakening", cover: "/assets/GameCovor/Dune Awakening.png", publisher: "Funcom", developer: "Funcom", genre: ["بقاء", "عالم مفتوح"], rating: 4.3, releaseYear: 2025, description: "بقاء في عالم ديون! ابنِ قاعدتك في الصحراء، اجمع التوابل، وواجه دود الرمال.", platforms: ["PC", "PS", "Xbox"], players: "1-∞", steamUrl: "https://store.steampowered.com/app/1279870/Dune_Awakening/" },
  { id: "ea-fc-26", name: "EA Sports FC 26", cover: "/assets/GameCovor/EA Sports FC 26.png", publisher: "EA", developer: "EA Canada", genre: ["رياضة", "محاكاة"], rating: 3.9, releaseYear: 2025, description: "كرة القدم الجيل الجديد! تقنيات محسّنة وأوضاع لعب جديدة مع أفضل اللاعبين.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-22", steamUrl: "https://store.steampowered.com/app/3413860/EA_SPORTS_FC_26/" },
  { id: "fragpunk", name: "FragPunk", cover: "/assets/GameCovor/FragPunk.png", publisher: "NetEase", developer: "Bad Guitar Studio", genre: ["شوتر", "تنافسي"], rating: 4.0, releaseYear: 2025, description: "شوتر 5v5 مع بطاقات Shard! كل جولة تغير القوانين. استراتيجية وأكشن سريع.", platforms: ["PC"], players: "5v5", steamUrl: "https://store.steampowered.com/app/3158370/FragPunk/" },
  { id: "killing-floor-3", name: "Killing Floor 3", cover: "/assets/GameCovor/Killing Floor 3.png", publisher: "Tripwire Interactive", developer: "Tripwire Interactive", genre: ["شوتر", "تعاوني"], rating: 4.1, releaseYear: 2025, description: "شوتر تعاوني ضد زيد! رؤساء ضخمة وأسلحة مرعبة. تكملة Killing Floor.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/2280280/Killing_Floor_3/" },
  { id: "kingdom-come-2", name: "Kingdom Come: Deliverance II", cover: "/assets/GameCovor/Kingdom Come Deliverance II.png", publisher: "Deep Silver", developer: "Warhorse Studios", genre: ["RPG", "عالم مفتوح"], rating: 4.7, releaseYear: 2025, description: "تكملة محاكاة العصور الوسطى! هنري يعود بمغامرة أوسع وقصة أعمق.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1774480/Kingdom_Come_Deliverance_II/" },
  { id: "mafia-old-country", name: "Mafia: The Old Country", cover: "/assets/GameCovor/Mafia The Old Country.png", publisher: "2K Games", developer: "Hangar 13", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 4.2, releaseYear: 2025, description: "أصول المافيا في صقلية! قصة هجرة وعالم الجريمة في بدايات القرن العشرين.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2317920/Mafia_The_Old_Country/" },
  { id: "mgs-delta", name: "Metal Gear Solid Delta: Snake Eater", cover: "/assets/GameCovor/Metal Gear Solid Delta Snake Eater.png", publisher: "Konami", developer: "Konami", genre: ["تسلل", "أكشن-مغامرة"], rating: 4.6, releaseYear: 2025, description: "إعادة صنع MGS3! سنيك إيتر برسومات حديثة. تسلل وبقاء في الغابة.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1690890/Metal_Gear_Solid_Delta_Snake_Eater/" },
  { id: "mh-wilds", name: "Monster Hunter Wilds", cover: "/assets/GameCovor/Monster Hunter Wilds.png", publisher: "Capcom", developer: "Capcom", genre: ["أكشن", "تعاوني"], rating: 4.5, releaseYear: 2025, description: "صيد وحوش بعالم مفتوح! طقس ديناميكي ووحوش ضخمة. أفضل Monster Hunter.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/2246340/Monster_Hunter_Wilds/" },
  { id: "nba-2k26", name: "NBA 2K26", cover: "/assets/GameCovor/NBA 2K26.png", publisher: "2K Games", developer: "Visual Concepts", genre: ["رياضة", "محاكاة"], rating: 3.8, releaseYear: 2025, description: "كرة السلة الجيل الجديد! لاعبين حقيقيين ورسومات واقعية وأوضاع MyCareer.", platforms: ["PC", "PS", "Xbox"], players: "1-6", steamUrl: "https://store.steampowered.com/app/3328490/NBA_2K26/" },
  { id: "phantom-blade", name: "Phantom Blade Zero", cover: "/assets/GameCovor/Phantom Blade Zero.png", publisher: "S-GAME", developer: "S-GAME", genre: ["أكشن", "RPG"], rating: 4.3, releaseYear: 2025, description: "أكشن صيني سريع! نينجا بقدرات خارقة وقتال بالسيوف مذهل.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/2030480/Phantom_Blade_Zero/" },
  { id: "replaced", name: "Replaced", cover: "/assets/GameCovor/Replaced.png", publisher: "Coatsink", developer: "Sad Cat Studios", genre: ["منصات", "أكشن"], rating: 4.2, releaseYear: 2025, description: "منصات بأسلوب ريترو سايبربانك! رسومات بكسل مذهلة وعالم مستقبلي.", platforms: ["PC", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1262670/REPLACED/" },
  { id: "rise-ronin", name: "Rise of the Ronin", cover: "/assets/GameCovor/Rise of the Ronin.png", publisher: "PlayStation Studios", developer: "Team Ninja", genre: ["RPG", "عالم مفتوح"], rating: 4.3, releaseYear: 2024, description: "رنين في اليابان الإقطاعية! قتال بالسيوف وعالم مفتوح من Team Ninja.", platforms: ["PC", "PS"], players: "1-4", steamUrl: "https://store.steampowered.com/app/2349520/Rise_of_the_Ronin/" },
  { id: "routine", name: "Routine", cover: "/assets/GameCovor/Routine.png", publisher: "Lunar Software", developer: "Lunar Software", genre: ["رعب", "أكشن-مغامرة"], rating: 3.9, releaseYear: 2025, description: "رعب على محطة فضائية قمرية! أجواء مرعبة وذكاء اصطناعي يطاردك.", platforms: ["PC"], players: "1", steamUrl: "https://store.steampowered.com/app/231350/Routine/" },
  { id: "stalker-2", name: "S.T.A.L.K.E.R. 2", cover: "/assets/GameCovor/S.T.A.L.K.E.R. 2 Heart of Chornobyl.png", publisher: "GSC Game World", developer: "GSC Game World", genre: ["شوتر", "بقاء"], rating: 4.2, releaseYear: 2024, description: "عودة لمنطقة تشرنوبيل! شوتر بقاء بعالم مفتوح مرعب وأجواء مشعة.", platforms: ["PC", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1643320/S_T_A_L_K_E_R_2_Heart_of_Chornobyl/" },
  { id: "silent-hill-2", name: "Silent Hill 2 Remake", cover: "/assets/GameCovor/Silent Hill 2.png", publisher: "Konami", developer: "Bloober Team", genre: ["رعب", "أكشن-مغامرة"], rating: 4.5, releaseYear: 2024, description: "إعادة صنع تحفة الرعب النفسي! جيمس يبحث عن زوجته في سايلنت هيل.", platforms: ["PC", "PS"], players: "1", steamUrl: "https://store.steampowered.com/app/1960490/Silent_Hill_2/" },
  { id: "smite-2", name: "Smite 2", cover: "/assets/GameCovor/Smite 2.png", publisher: "Hi-Rez Studios", developer: "Hi-Rez Studios", genre: ["MOBA", "أكشن"], rating: 4.0, releaseYear: 2025, description: "MOBA بالآلهة! آلهة الأساطير يتقاتلون. تكملة برسومات ومحرك جديد.", platforms: ["PC", "PS", "Xbox"], players: "5v5", steamUrl: "https://store.steampowered.com/app/2688900/SMITE_2/" },
  { id: "south-of-midnight", name: "South of Midnight", cover: "/assets/GameCovor/South of Midnight.png", publisher: "Xbox Game Studios", developer: "Compulsion Games", genre: ["أكشن-مغامرة", "منصات"], rating: 4.1, releaseYear: 2025, description: "مغامرة في جنوب أمريكا! أساطير محلية وأجواء سحرية ورسومات فريدة.", platforms: ["PC", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2019180/South_of_Midnight/" },
  { id: "splitgate-2", name: "Splitgate 2", cover: "/assets/GameCovor/Splitgate 2.png", publisher: "1047 Games", developer: "1047 Games", genre: ["شوتر", "تنافسي"], rating: 4.1, releaseYear: 2025, description: "بورتالز مع شوتر! افتح بوابات للتنقل وقتال. تكملة أسرع وأكبر.", platforms: ["PC", "PS", "Xbox"], players: "8v8", steamUrl: "https://store.steampowered.com/app/2369390/Splitgate_2/" },
  { id: "the-finals", name: "The Finals", cover: "/assets/GameCovor/The Finals.png", publisher: "Embark Studios", developer: "Embark Studios", genre: ["شوتر", "تنافسي"], rating: 4.2, releaseYear: 2023, description: "شوتر بتدمير كامل! كل جدار ينهد. فريق يسرق ويهرب بأجواء تلفزيونية.", platforms: ["PC", "PS", "Xbox"], players: "3v3v3", steamUrl: "https://store.steampowered.com/app/2077430/The_Finals/" },
  { id: "berserker-khazan", name: "The First Berserker: Khazan", cover: "/assets/GameCovor/The First Berserker Khazan.png", publisher: "Nexon", developer: "Neople", genre: ["RPG", "أكشن"], rating: 4.1, releaseYear: 2025, description: "Souls-like من DNF! خازان يقاتل بعالم مظلم وقتال عنيف بالفأس.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/2447420/The_First_Berserker_Khazan/" },
];

// Color cache to avoid re-extracting
const colorCache: Record<string, string> = {};

function extractDominantColor(src: string): Promise<string> {
  if (colorCache[src]) return Promise.resolve(colorCache[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 8; c.height = 8;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 8, 8);
      const d = ctx.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        r += d[i]; g += d[i + 1]; b += d[i + 2]; count++;
      }
      if (count === 0) { resolve("rgb(30,30,40)"); return; }
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
      // Keep color vibrant for glow
      r = Math.round(r * 0.85); g = Math.round(g * 0.85); b = Math.round(b * 0.85);
      const color = `rgb(${r},${g},${b})`;
      colorCache[src] = color;
      resolve(color);
    };
    img.onerror = () => resolve("rgb(30,30,40)");
    img.src = src;
  });
}

const imgProtect = { draggable: false, onContextMenu: (e: React.MouseEvent) => e.preventDefault() } as const;

const platformShort: Record<string, string> = { PC: "PC", PS: "PS", PS5: "PS5", Xbox: "XB", Switch: "SW", Mobile: "Mob", Wii: "Wii" };

const genreColor: Record<string, string> = {
  "أكشن": "bg-red-500/20 text-red-400 border-red-500/25",
  "مغامرة": "bg-emerald-500/20 text-emerald-400 border-emerald-500/25",
  "رعب": "bg-purple-500/20 text-purple-400 border-purple-500/25",
  "رياضة": "bg-green-500/20 text-green-400 border-green-500/25",
  "سباق": "bg-cyan-500/20 text-cyan-400 border-cyan-500/25",
  "قتال": "bg-orange-500/20 text-orange-400 border-orange-500/25",
  "استراتيجية": "bg-blue-500/20 text-blue-400 border-blue-500/25",
  "أدوار": "bg-indigo-500/20 text-indigo-400 border-indigo-500/25",
  "شوتر": "bg-amber-500/20 text-amber-400 border-amber-500/25",
  "بقاء": "bg-rose-500/20 text-rose-400 border-rose-500/25",
  "عالم مفتوح": "bg-teal-500/20 text-teal-400 border-teal-500/25",
  "محاكاة": "bg-sky-500/20 text-sky-400 border-sky-500/25",
};
const getGenreClass = (g: string) => genreColor[g] || "bg-white/[0.08] text-white/60 border-white/[0.08]";

function TopPickCard({ game }: { game: Game }) {
  return (
    <div onClick={() => { if (game.steamUrl) window.open(game.steamUrl, "_blank"); }} className="shrink-0 w-[120px] group cursor-pointer">
      <div className="relative overflow-hidden rounded-lg ring-1 ring-white/[0.04] group-hover:ring-white/[0.1] transition-all">
        <img src={game.cover} alt={game.name} className="w-full aspect-[3/4] object-cover transition-transform duration-300 group-hover:scale-[1.05] select-none pointer-events-none" draggable={false} onContextMenu={e => e.preventDefault()} />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 pt-6">
          <p className="text-[8px] text-white font-bold truncate">{game.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={6} className="text-amber-400" fill="currentColor" />
            <span className="text-[7px] text-amber-400 font-bold">{game.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game, isFav, onFav, layout, index }: { game: Game; isFav: boolean; onFav: () => void; layout: "grid" | "list"; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [dominantColor, setDominantColor] = useState("rgb(30,30,40)");
  const [imgLoaded, setImgLoaded] = useState(false);
  const tRef = useRef<NodeJS.Timeout | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      extractDominantColor(game.cover).then(c => setDominantColor(c));
    }
  }, [game.cover]);

  const onEnter = () => { tRef.current = setTimeout(() => setHovered(true), 120); };
  const onLeave = () => { if (tRef.current) clearTimeout(tRef.current); setHovered(false); };

  const ratingColor = game.rating >= 4.5 ? "text-emerald-400" : game.rating >= 4.0 ? "text-amber-400" : "text-white/40";
  const ratingLabel = game.rating >= 4.7 ? "ممتاز" : game.rating >= 4.3 ? "ممتاز جدا" : game.rating >= 4.0 ? "جيد جدا" : game.rating >= 3.5 ? "جيد" : "مقبول";

  const dropInfo = (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute top-full right-0 left-0 z-40 mt-1.5"
    >
      <div className="rounded-2xl p-4 shadow-2xl shadow-black/80 border border-white/[0.08] bg-black/85 backdrop-blur-2xl">
        <p className="text-[11px] text-white/60 leading-relaxed mb-3">{game.description}</p>
        <div className="flex items-center gap-3 mb-3 text-[9px]">
          <span className={cn("flex items-center gap-1 font-bold", ratingColor)}>
            <Star size={9} fill="currentColor" /> {game.rating}
            <span className="font-normal text-white/25">{ratingLabel}</span>
          </span>
          <span className="flex items-center gap-1 text-white/40"><Calendar size={9} /> {game.releaseYear}</span>
          <span className="flex items-center gap-1 text-white/40"><Users size={9} /> {game.players}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {game.genre.map(g => (
            <span key={g} className={`text-[8px] px-2 py-0.5 rounded-lg font-semibold border ${getGenreClass(g)}`}>{g}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {game.platforms.map(p => (
            <span key={p} className="text-[8px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-white/40 font-semibold border border-white/[0.04]">{platformShort[p] || p}</span>
          ))}
        </div>
        <div className="h-px bg-white/[0.06] my-2.5" />
        <div className="flex items-center justify-between text-[9px] text-white/30">
          <span className="flex items-center gap-1"><Tag size={9} /> {game.developer}</span>
          <span>{game.publisher}</span>
        </div>
        {game.steamUrl && (
          <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2.5 text-[9px] text-white/50 hover:text-white/80 transition-colors bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
            <ExternalLink size={8} /> صفحة Steam
          </a>
        )}
      </div>
    </motion.div>
  );

  if (layout === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.4) }}
        onMouseEnter={onEnter} onMouseLeave={onLeave}
        className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-nf-secondary/5 hover:bg-nf-secondary/20 transition-all cursor-pointer border border-transparent hover:border-nf-border hover:shadow-lg hover:shadow-black/20"
      >
        <div className="relative overflow-hidden rounded-lg shrink-0">
          <img src={game.cover} alt={game.name} {...imgProtect} className={cn("w-12 h-16 object-cover select-none transition-all duration-300", !imgLoaded && "bg-nf-secondary/20 animate-pulse")} onLoad={() => setImgLoaded(true)} />
          <div className="absolute top-0.5 right-0.5">
            <span className="text-[6px] px-1 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white/50 font-bold">{game.genre[0]}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-nf-text truncate">{game.name}</p>
          <p className="text-[9px] text-nf-dim/60 mt-0.5">{game.publisher} · {game.developer}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("flex items-center gap-0.5", ratingColor)}>
              <Star size={8} fill="currentColor" /><span className="text-[8px] font-bold">{game.rating}</span>
              <span className="text-[7px] text-white/25">{ratingLabel}</span>
            </span>
            <span className="text-[8px] text-nf-dim/40">{game.releaseYear}</span>
            <span className="text-[8px] text-nf-dim/30">·</span>
            <span className="text-[8px] text-nf-dim/40">{game.players}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {game.genre.slice(0, 3).map(g => (<span key={g} className={`text-[7px] px-1.5 py-0.5 rounded-md font-semibold border ${getGenreClass(g)}`}>{g}</span>))}
            <span className="text-[7px] text-nf-dim/20 mx-0.5">|</span>
            {game.platforms.slice(0, 3).map(p => (<span key={p} className="text-[7px] px-1 py-0.5 rounded bg-nf-secondary border border-nf-border-2 text-nf-dim font-semibold">{platformShort[p] || p}</span>))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onFav(); }} className={cn("p-1 rounded-md transition-all", isFav ? "text-red-400" : "text-nf-dim/30 hover:text-red-400")}>
            <Heart size={13} fill={isFav ? "currentColor" : "none"} />
          </button>
          {game.steamUrl && (
            <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1 rounded-md text-nf-dim/30 hover:text-nf-accent transition-colors">
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <AnimatePresence>{hovered && dropInfo}</AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.6) }}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      className="group relative text-right"
    >
      <div 
        className="game-card-glow"
        style={{ 
          boxShadow: `0 0 45px 12px ${dominantColor}75`,
          background: dominantColor 
        }}
      >
        <img src={game.cover} alt="" className="w-full h-full object-cover opacity-60" />
      </div>
      <div className="relative z-10 overflow-hidden rounded-xl bg-black ring-1 ring-white/[0.04] group-hover:ring-white/[0.2] transition-all duration-500"
        style={{ boxShadow: hovered ? `0 12px 50px -8px ${dominantColor}90, 0 0 0 1px ${dominantColor}30` : "none" }}
      >
        <img src={game.cover} alt={game.name} {...imgProtect} className={cn("w-full aspect-[3/4] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] select-none pointer-events-none", !imgLoaded && "bg-nf-secondary/20 animate-pulse")} onLoad={() => setImgLoaded(true)} />
        {/* Bottom gradient with name + rating */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 pt-12">
          <p className="text-[11px] text-white font-bold truncate drop-shadow-lg">{game.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Star size={8} className="text-amber-400" fill="currentColor" />
            <span className="text-[8px] text-amber-400 font-bold">{game.rating}</span>
            <span className="text-[7px] text-white/20">|</span>
            <span className="text-[7px] text-white/30">{game.releaseYear}</span>
            <span className="text-[7px] text-white/15">|</span>
            <span className="text-[7px] text-white/30">{game.players}</span>
          </div>
          {/* Platform badges row */}
          <div className="flex items-center gap-0.5 mt-1">
            {game.platforms.slice(0, 4).map(p => (<span key={p} className="text-[6px] px-1 py-0.5 rounded bg-white/[0.06] text-white/40 font-semibold">{platformShort[p] || p}</span>))}
          </div>
        </div>
        {/* Genre badge */}
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
          <span className={`text-[7px] px-1.5 py-0.5 rounded-md backdrop-blur-md font-bold border ${getGenreClass(game.genre[0])}`}>{game.genre[0]}</span>
          {game.releaseYear >= 2023 && (
            <span className="text-[6px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-md text-emerald-400 font-bold border border-emerald-500/20">جديد</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className={cn(
            "absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
            isFav
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "bg-black/40 backdrop-blur-sm text-white/50 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100"
          )}
        >
          <Heart size={11} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
      <AnimatePresence>{hovered && dropInfo}</AnimatePresence>
    </motion.div>
  );
}

export default function GamesPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavModal, setShowFavModal] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "rating" | "year" | "oldest">("name");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "followed" | "trending" | "new" | "best" | "hot">("all");
  const [randomGame, setRandomGame] = useState<Game | null>(null);
  const [showFavList, setShowFavList] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  // Dropdown states
  const [showGenreDrop, setShowGenreDrop] = useState(false);
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [showSortDrop, setShowSortDrop] = useState(false);
  const genreDropRef = useRef<HTMLDivElement>(null);
  const platformDropRef = useRef<HTMLDivElement>(null);
  const sortDropRef = useRef<HTMLDivElement>(null);
  const topPicksRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "games", "favorites")).then(s => {
      if (s.exists()) setFavoriteIds(s.data().ids || []);
    }).catch(() => {});
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (genreDropRef.current && !genreDropRef.current.contains(e.target as Node)) setShowGenreDrop(false);
      if (platformDropRef.current && !platformDropRef.current.contains(e.target as Node)) setShowPlatformDrop(false);
      if (sortDropRef.current && !sortDropRef.current.contains(e.target as Node)) setShowSortDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Scroll to top detection
  useEffect(() => {
    const el = pageRef.current?.parentElement;
    if (!el) return;
    const handler = () => setShowScrollTop(el.scrollTop > 400);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const saveFavorites = async (ids: string[]) => {
    if (!user) return;
    setFavoriteIds(ids);
    try { await setDoc(doc(db, "users", user.uid, "games", "favorites"), { ids }); } catch (e) { console.error("[GamesPage] Save error:", e); }
  };

  const toggleFavorite = (gameId: string) => {
    if (!user) return;
    if (favoriteIds.includes(gameId)) { saveFavorites(favoriteIds.filter(id => id !== gameId)); }
    else { if (favoriteIds.length >= 20) { setShowFavModal(true); return; } saveFavorites([...favoriteIds, gameId]); }
  };

  const allGenres = [...new Set(GAMES.flatMap(g => g.genre))].sort((a, b) => a.localeCompare(b, "ar"));
  const allPlatforms = [...new Set(GAMES.flatMap(g => g.platforms))].sort();


  const filtered = GAMES.filter(g => {
    const ms = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.publisher.toLowerCase().includes(searchQuery.toLowerCase()) || g.developer.toLowerCase().includes(searchQuery.toLowerCase()) || g.genre.some(gen => gen.includes(searchQuery));
    const mg = !genreFilter || g.genre.includes(genreFilter);
    const mp = !platformFilter || g.platforms.includes(platformFilter);
    const mf = !showFavOnly || favoriteIds.includes(g.id);
    // Tab filters
    const mt = activeTab === "all" ? true
      : activeTab === "followed" ? favoriteIds.includes(g.id)
      : activeTab === "trending" ? g.rating >= 4.5
      : activeTab === "new" ? g.releaseYear >= 2022
      : activeTab === "best" ? g.rating >= 4.7
      : activeTab === "hot" ? g.rating >= 4.3 && g.releaseYear >= 2020
      : true;
    return ms && mg && mp && mf && mt;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "year") return b.releaseYear - a.releaseYear;
    if (sortBy === "oldest") return a.releaseYear - b.releaseYear;
    return a.name.localeCompare(b.name, "ar");
  });

  // Featured games for hero
  const featured = GAMES.filter(g => g.rating >= 4.7).slice(0, 5);
  const topPicks = GAMES.filter(g => g.rating >= 4.5 && g.releaseYear >= 2020).sort((a, b) => b.rating - a.rating).slice(0, 12);
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (featured.length === 0) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);
  const heroGame = featured[heroIdx];

  const pickRandomGame = () => {
    const pool = filtered.length > 0 ? filtered : GAMES;
    const g = pool[Math.floor(Math.random() * pool.length)];
    setRandomGame(g);
  };

  const sortOptions = [
    { id: "name" as const, label: "الاسم", icon: <Tag size={10} /> },
    { id: "rating" as const, label: "التقييم", icon: <Trophy size={10} /> },
    { id: "year" as const, label: "الأحدث", icon: <Clock size={10} /> },
    { id: "oldest" as const, label: "الأقدم", icon: <Clock size={10} className="rotate-180" /> },
  ];


  return (
    <div ref={pageRef} className="w-full" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="p-2 rounded-xl text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors border border-nf-border-2"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-nf-text tracking-tight">مكتبة الألعاب</h1>
            <p className="text-[9px] text-nf-dim/50">اكتشف ألعابك المفضلة وتابعها</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLayout(layout === "grid" ? "list" : "grid")} className={cn("p-1.5 rounded-lg text-nf-dim hover:text-nf-text transition-colors border", layout === "grid" ? "bg-nf-secondary/20 border-nf-border-2" : "bg-nf-accent/10 border-nf-accent/20 text-nf-accent")}>
            {layout === "grid" ? <LayoutList size={14} /> : <Grid3X3 size={14} />}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-3 mb-4 p-2.5 rounded-xl bg-nf-secondary/5 border border-nf-border-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent font-bold border border-nf-accent/20">{GAMES.length} لعبة</span>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] text-nf-dim/40">
          <span>{allGenres.length} نوع</span>
          <span>·</span>
          <span>{allPlatforms.length} منصة</span>
          <span>·</span>
          <span>{GAMES.filter(g => g.releaseYear >= 2023).length} لعبة جديدة 2023+</span>
        </div>
        <div className="mr-auto flex items-center gap-1 text-[8px] text-nf-dim/30">
          <Trophy size={8} className="text-amber-400/60" />
          <span>{GAMES.filter(g => g.rating >= 4.5).length} لعبة ممتازة</span>
        </div>
      </div>

      {/* Hero Banner */}
      {heroGame && !genreFilter && !platformFilter && activeTab === "all" && (
        <motion.div key={heroGame.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative h-[160px] sm:h-[240px] rounded-2xl overflow-hidden mb-4 group cursor-pointer border border-nf-border-2 hover:border-nf-border transition-colors" onClick={() => { const g = heroGame; if (g.steamUrl) window.open(g.steamUrl, "_blank"); }}>
          <img src={heroGame.cover} alt={heroGame.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05] select-none pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 right-0 p-4 sm:p-6">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame size={11} className="text-orange-400" />
              <span className="text-[8px] text-orange-400 font-bold uppercase tracking-wider">مميز اليوم</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white mb-1.5 drop-shadow-lg">{heroGame.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-white/60">
              <span className="flex items-center gap-0.5"><Star size={9} className="text-amber-400" fill="currentColor" /> <span className="text-amber-400 font-bold">{heroGame.rating}</span></span>
              <span className="text-white/30">|</span>
              <span>{heroGame.releaseYear}</span>
              <span className="text-white/30">|</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/70 font-semibold">{heroGame.genre[0]}</span>
              <span className="text-white/30">|</span>
              <span className="flex items-center gap-1">{heroGame.platforms.slice(0, 3).map(p => (<span key={p} className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-semibold">{platformShort[p] || p}</span>))}</span>
            </div>
            {heroGame.steamUrl && (
              <a href={heroGame.steamUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 mt-2.5 text-[9px] text-white/60 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                <ExternalLink size={9} /> صفحة Steam
              </a>
            )}
          </div>
          {/* Hero dots + progress */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {featured.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setHeroIdx(i); }} className={cn("h-1 rounded-full transition-all overflow-hidden", i === heroIdx ? "bg-white/30 w-5" : "bg-white/30 w-1.5 hover:bg-white/50")}>
                {i === heroIdx && <div className="h-full bg-white rounded-full animate-[heroProgress_5s_linear]" style={{ animation: "heroProgress 5s linear forwards" }} />}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Picks Row */}
      {!genreFilter && !platformFilter && activeTab === "all" && topPicks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white font-bold">أفضل الاختيارات</span>
              <span className="text-[8px] text-nf-dim/40">الأعلى تقييماً</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => topPicksRef.current?.scrollBy({ left: -200, behavior: "smooth" })} className="p-1 rounded-md bg-nf-secondary/20 text-nf-dim hover:text-nf-text transition-colors border border-nf-border-2"><ChevronRight size={12} /></button>
              <button onClick={() => topPicksRef.current?.scrollBy({ left: 200, behavior: "smooth" })} className="p-1 rounded-md bg-nf-secondary/20 text-nf-dim hover:text-nf-text transition-colors border border-nf-border-2"><ChevronLeft size={12} /></button>
            </div>
          </div>
          <div ref={topPicksRef} className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {topPicks.map(g => (
              <TopPickCard key={g.id} game={g} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Tabs + Actions */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all" as const, label: "الكل", icon: <Gamepad2 size={10} /> },
          { id: "followed" as const, label: "المتابَعين", icon: <Heart size={10} /> },
          { id: "trending" as const, label: "رائج", icon: <TrendingUp size={10} /> },
          { id: "new" as const, label: "جديد", icon: <Zap size={10} /> },
          { id: "best" as const, label: "الأفضل", icon: <Crown size={10} /> },
          { id: "hot" as const, label: "شو رائج؟", icon: <Flame size={10} /> },
        ].map(tab => {
          const count = tab.id === "all" ? GAMES.length : tab.id === "followed" ? favoriteIds.length : tab.id === "trending" ? GAMES.filter(g => g.rating >= 4.5).length : tab.id === "new" ? GAMES.filter(g => g.releaseYear >= 2022).length : tab.id === "best" ? GAMES.filter(g => g.rating >= 4.7).length : GAMES.filter(g => g.rating >= 4.3 && g.releaseYear >= 2020).length;
          return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border", activeTab === tab.id ? "bg-nf-accent/15 text-nf-accent border-nf-accent/25" : "bg-nf-secondary/10 text-nf-dim hover:text-nf-text border-nf-border-2 hover:border-nf-border")}>
            {tab.icon} {tab.label} <span className={cn("text-[8px]", activeTab === tab.id ? "text-nf-accent/50" : "text-nf-dim/30")}>{count}</span>
          </button>
        );})}
        {/* عشوائي + المفضلة جنب التابات */}
        <div className="h-4 w-px bg-nf-border-2 mx-1 shrink-0" />
        <button onClick={pickRandomGame} className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border bg-nf-secondary/10 text-nf-dim hover:text-nf-text border-nf-border-2 hover:border-nf-border")} title="لعبة عشوائية">
          <Dice5 size={10} /> عشوائي
        </button>
        {favoriteIds.length > 0 && (
          <button onClick={() => setShowFavOnly(!showFavOnly)} onContextMenu={e => { e.preventDefault(); setShowFavList(true); }} className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border", showFavOnly ? "bg-nf-accent/15 text-nf-accent border-nf-accent/25" : "bg-nf-secondary/10 text-nf-dim hover:text-nf-text border-nf-border-2 hover:border-nf-border")} title="انقر بزر يمين لعرض المفضلة">
            <Heart size={10} fill={showFavOnly ? "currentColor" : "none"} /> {favoriteIds.length}/20
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim/50" />
        <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث عن لعبة، ناشر، مطور، أو نوع..." className="w-full bg-nf-secondary/15 rounded-xl pr-9 pl-16 py-2 text-[11px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:ring-1 focus:ring-nf-accent/20 transition-all border border-nf-border-2 focus:border-nf-accent/25" />
        {searchQuery && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-[9px] text-nf-accent/60 font-bold">{filtered.length}</span>
            <button onClick={() => setSearchQuery("")} className="p-0.5 rounded-md text-nf-dim/50 hover:text-nf-text transition-colors bg-nf-secondary border border-nf-border-2">
              <X size={10} />
            </button>
          </div>
        )}
        {!searchQuery && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] text-nf-dim/25 font-semibold select-none">Ctrl+K</span>
        )}
      </div>

      {/* Filter Row: Dropdowns */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Genre Dropdown */}
        <div ref={genreDropRef} className="relative">
          <button onClick={() => { setShowGenreDrop(!showGenreDrop); setShowPlatformDrop(false); setShowSortDrop(false); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border", genreFilter ? "bg-nf-accent/15 text-nf-accent border-nf-accent/30" : "bg-nf-secondary/20 text-nf-dim hover:text-nf-text border-nf-border-2")}>
            <Filter size={10} /> {genreFilter || "النوع"} <ChevronDown size={10} className={cn("transition-transform", showGenreDrop && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showGenreDrop && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-xl p-1.5 shadow-xl z-50 max-h-[240px] overflow-y-auto min-w-[140px]">
                <button onClick={() => { setGenreFilter(null); setShowGenreDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", !genreFilter ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-text")}>الكل</button>
                {allGenres.map(g => (
                  <button key={g} onClick={() => { setGenreFilter(genreFilter === g ? null : g); setShowGenreDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", genreFilter === g ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-text")}>{g}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Platform Dropdown */}
        <div ref={platformDropRef} className="relative">
          <button onClick={() => { setShowPlatformDrop(!showPlatformDrop); setShowGenreDrop(false); setShowSortDrop(false); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border", platformFilter ? "bg-nf-accent/15 text-nf-accent border-nf-accent/30" : "bg-nf-secondary/20 text-nf-dim hover:text-nf-text border-nf-border-2")}>
            <Monitor size={10} /> {platformFilter || "المنصة"} <ChevronDown size={10} className={cn("transition-transform", showPlatformDrop && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showPlatformDrop && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-xl p-1.5 shadow-xl z-50 min-w-[120px]">
                <button onClick={() => { setPlatformFilter(null); setShowPlatformDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", !platformFilter ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-text")}>الكل</button>
                {allPlatforms.map(p => (
                  <button key={p} onClick={() => { setPlatformFilter(platformFilter === p ? null : p); setShowPlatformDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", platformFilter === p ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-text")}>{p}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Dropdown */}
        <div ref={sortDropRef} className="relative">
          <button onClick={() => { setShowSortDrop(!showSortDrop); setShowGenreDrop(false); setShowPlatformDrop(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border bg-nf-secondary/20 text-nf-dim hover:text-nf-text border-nf-border-2">
            {sortOptions.find(s => s.id === sortBy)?.icon} {sortOptions.find(s => s.id === sortBy)?.label} <ChevronDown size={10} className={cn("transition-transform", showSortDrop && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showSortDrop && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-xl p-1.5 shadow-xl z-50 min-w-[120px]">
                {sortOptions.map(s => (
                  <button key={s.id} onClick={() => { setSortBy(s.id); setShowSortDrop(false); }} className={cn("w-full flex items-center gap-2 text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", sortBy === s.id ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-text")}>{s.icon} {s.label}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active filters chips */}
        {(genreFilter || platformFilter) && (
          <div className="flex items-center gap-1.5">
            {genreFilter && (
              <button onClick={() => setGenreFilter(null)} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-nf-accent/15 text-nf-accent border border-nf-accent/30 hover:bg-nf-accent/25 transition-colors">
                {genreFilter} <X size={8} />
              </button>
            )}
            {platformFilter && (
              <button onClick={() => setPlatformFilter(null)} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-nf-accent/15 text-nf-accent border border-nf-accent/30 hover:bg-nf-accent/25 transition-colors">
                {platformFilter} <X size={8} />
              </button>
            )}
            <button onClick={() => { setGenreFilter(null); setPlatformFilter(null); }} className="text-[9px] text-nf-dim hover:text-red-400 transition-colors">مسح الكل</button>
          </div>
        )}

        <span className="text-[10px] text-nf-dim mr-auto">{filtered.length} نتيجة</span>
      </div>

      {/* Grid / List */}
      <AnimatePresence mode="wait">
        {layout === "grid" ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {filtered.map((g, i) => (<GameCard key={g.id} game={g} isFav={favoriteIds.includes(g.id)} onFav={() => toggleFavorite(g.id)} layout="grid" index={i} />))}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-1.5">
            {filtered.map((g, i) => (<GameCard key={g.id} game={g} isFav={favoriteIds.includes(g.id)} onFav={() => toggleFavorite(g.id)} layout="list" index={i} />))}
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-nf-secondary/20 flex items-center justify-center mx-auto mb-3 border border-nf-border-2"><Gamepad2 size={28} className="text-nf-dim/30" /></div>
          <p className="text-[13px] text-nf-dim font-bold">لا توجد نتائج</p>
          <p className="text-[10px] text-nf-dim/40 mt-1 mb-4">جرّب تغيير الفلاتر أو البحث بكلمات أخرى</p>
          <button onClick={() => { setSearchQuery(""); setGenreFilter(null); setPlatformFilter(null); setActiveTab("all"); }} className="px-4 py-2 rounded-xl bg-nf-accent/10 text-nf-accent text-[11px] font-bold hover:bg-nf-accent/20 transition-colors border border-nf-accent/20">مسح الفلاتر</button>
        </motion.div>
      )}

      <AnimatePresence>
        {randomGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRandomGame(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }} className="bg-nf-primary border border-white/10 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="relative h-40">
                <img src={randomGame.cover} alt={randomGame.name} className="w-full h-full object-cover select-none" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-nf-primary to-transparent" />
                <button onClick={() => setRandomGame(null)} className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white transition-colors"><X size={14} /></button>
                <div className="absolute top-2 right-2">
                  <span className="text-[8px] px-2 py-0.5 rounded-md bg-nf-accent/20 backdrop-blur-sm text-nf-accent font-bold border border-nf-accent/20">عشوائي</span>
                </div>
              </div>
              <div className="p-4 -mt-4 relative">
                <h3 className="text-sm font-bold text-nf-text mb-1">{randomGame.name}</h3>
                <p className="text-[10px] text-nf-dim/60 leading-relaxed mb-3">{randomGame.description}</p>
                <div className="flex items-center gap-3 mb-3 text-[9px]">
                  <span className={cn("flex items-center gap-1 font-bold", randomGame.rating >= 4.5 ? "text-emerald-400" : randomGame.rating >= 4.0 ? "text-amber-400" : "text-nf-dim")}>
                    <Star size={9} fill="currentColor" /> {randomGame.rating}
                  </span>
                  <span className="flex items-center gap-1 text-nf-dim"><Calendar size={9} /> {randomGame.releaseYear}</span>
                  <span className="flex items-center gap-1 text-nf-dim"><Users size={9} /> {randomGame.players}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {randomGame.genre.map(g => (<span key={g} className="text-[8px] px-2 py-0.5 rounded-lg bg-nf-secondary border border-nf-border-2 text-nf-text font-semibold">{g}</span>))}
                </div>
                <div className="flex items-center gap-2">
                  {randomGame.steamUrl && (
                    <a href={randomGame.steamUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-nf-accent text-white text-[11px] font-bold hover:bg-nf-accent/80 transition-colors">
                      <ExternalLink size={10} /> صفحة Steam
                    </a>
                  )}
                  <button onClick={pickRandomGame} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-nf-accent/10 text-nf-accent text-[11px] font-bold hover:bg-nf-accent/20 transition-colors border border-nf-accent/20">
                    <Dice5 size={10} /> لعبة ثانية
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFavModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFavModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }} className="bg-nf-primary border border-white/10 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Heart size={24} className="text-red-400" /></div>
              <h3 className="text-sm font-bold text-nf-text mb-1.5">وصلت للحد الأقصى</h3>
              <p className="text-[11px] text-nf-muted mb-4">يمكنك اختيار 20 لعبة فقط. أزل واحدة أولاً ثم أضف الجديدة.</p>
              <button onClick={() => setShowFavModal(false)} className="px-5 py-2 rounded-xl bg-nf-accent text-white text-[12px] font-bold hover:bg-nf-accent/80 transition-colors">فهمت</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites List Modal */}
      <AnimatePresence>
        {showFavList && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFavList(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }} className="bg-nf-primary border border-white/10 rounded-2xl p-4 max-w-sm w-full shadow-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-nf-text flex items-center gap-2"><Heart size={14} className="text-red-400" fill="currentColor" /> المفضلة ({favoriteIds.length}/20)</h3>
                <button onClick={() => setShowFavList(false)} className="p-1 rounded-lg text-nf-dim hover:text-white transition-colors"><X size={14} /></button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-none space-y-1.5">
                {favoriteIds.map(id => {
                  const g = GAMES.find(g => g.id === id);
                  if (!g) return null;
                  return (
                    <div key={id} className="flex items-center gap-2.5 p-2 rounded-xl bg-nf-secondary/10 hover:bg-nf-hover transition-colors border border-nf-border-2">
                      <img src={g.cover} alt={g.name} className="w-8 h-10 rounded-md object-cover select-none" draggable={false} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-nf-text font-bold truncate">{g.name}</p>
                        <p className="text-[8px] text-nf-dim/50">{g.genre[0]} · {g.releaseYear}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={7} className="text-amber-400" fill="currentColor" />
                        <span className="text-[9px] text-amber-400 font-bold">{g.rating}</span>
                      </div>
                      <button onClick={() => { toggleFavorite(id); if (favoriteIds.length <= 1) setShowFavList(false); }} className="p-1 rounded-md text-red-400/50 hover:text-red-400 transition-colors"><X size={12} /></button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => pageRef.current?.parentElement?.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 left-6 z-40 w-9 h-9 rounded-full bg-nf-accent/80 text-white flex items-center justify-center shadow-lg shadow-nf-accent/20 hover:bg-nf-accent transition-colors">
            <ArrowUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      <style>{`@keyframes heroProgress { from { width: 0%; } to { width: 100%; } }`}</style>
    </div>
  );
}
