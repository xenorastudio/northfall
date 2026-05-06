"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Star, Gamepad2, Heart, X, Search, Users, Calendar, Tag, Trophy, Clock, Grid3X3, LayoutList, ExternalLink, Filter, Monitor, ChevronDown, TrendingUp, Flame, Crown, Zap } from "lucide-react";
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
  { id: "baldurs-gate-3", name: "Baldur's Gate 3", cover: "/assets/GameCovor/Baldur's Gate 3.png", publisher: "Larian Studios", developer: "Larian Studios", genre: ["RPG", "استراتيجية دورية"], rating: 4.9, releaseYear: 2023, description: "تحفة RPG من Larian! قصة عميقة، خيارات لا نهائية، وقتال دوري مبدع.", platforms: ["PC", "PS5", "Xbox Series"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/" },
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
  { id: "mafia-3", name: "Mafia III: Definitive Edition", cover: "/assets/GameCovor/Mafia III Definitive Edition.png", publisher: "2K Games", developer: "Hangar 13", genre: ["أكشن-مغامرة", "عالم مفتوح"], rating: 3.8, releaseYear: 2020, description: "انتقام في نيو بوردو! لينكون كلاي يهدم المافيا من الداخل.", platforms: ["PC", "PS", "Xbox"], players: "1", steamUrl: "https://store.steampowered.com/app/1290860/Mafia_III_Definitive_Edition/" },
  { id: "me-andromeda", name: "Mass Effect: Andromeda", cover: "/assets/GameCovor/Mass Effect Andromeda.png", publisher: "EA", developer: "BioWare Montreal", genre: ["RPG", "أكشن"], rating: 3.9, releaseYear: 2017, description: "استكشاف مجرة أندروميدا! ابحث عن بيت جديد للبشرية في الفضاء.", platforms: ["PC", "PS", "Xbox"], players: "1-4", steamUrl: "https://store.steampowered.com/app/1232550/Mass_Effect_Andromeda/" },
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
  { id: "wolfenstein-youngblood", name: "Wolfenstein: Youngblood", cover: "/assets/GameCovor/Wolfenstein Youngblood.png", publisher: "Bethesda", developer: "MachineGames", genre: ["شوتر", "أكشن"], rating: 3.5, releaseYear: 2019, description: "بنات بي.جيه في باريس النازية! تعاوني وقتال بأخوات بلازكوفيتش.", platforms: ["PC", "PS", "Xbox", "Switch"], players: "1-2", steamUrl: "https://store.steampowered.com/app/560830/Wolfenstein_Youngblood/" },
  { id: "xcom-2", name: "XCOM 2", cover: "/assets/GameCovor/XCOM 2.png", publisher: "2K Games", developer: "Firaxis Games", genre: ["استراتيجية", "تكتيكي"], rating: 4.5, releaseYear: 2016, description: "قُد المقاومة ضد الغزاة الفضائيين! استراتيجية تكتيكية دورية عميقة.", platforms: ["PC", "PS", "Xbox"], players: "1-2", steamUrl: "https://store.steampowered.com/app/268500/XCOM_2/" },
  { id: "hoi4", name: "Hearts of Iron IV", cover: "/assets/GameCovor/Hearts of Iron IV.png", publisher: "Paradox", developer: "Paradox Dev Studio", genre: ["استراتيجية", "محاكاة"], rating: 4.4, releaseYear: 2016, description: "قُد أي دولة في الحرب العالمية الثانية! استراتيجية حرب ضخمة ومعقدة.", platforms: ["PC"], players: "1-32", steamUrl: "https://store.steampowered.com/app/394360/Hearts_of_Iron_IV/" },
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
      // Darken for use as background tint
      r = Math.round(r * 0.35); g = Math.round(g * 0.35); b = Math.round(b * 0.35);
      const color = `rgb(${r},${g},${b})`;
      colorCache[src] = color;
      resolve(color);
    };
    img.onerror = () => resolve("rgb(30,30,40)");
    img.src = src;
  });
}

const imgProtect = { draggable: false, onContextMenu: (e: React.MouseEvent) => e.preventDefault() } as const;

function GameCard({ game, isFav, onFav, layout }: { game: Game; isFav: boolean; onFav: () => void; layout: "grid" | "list" }) {
  const [hovered, setHovered] = useState(false);
  const [dominantColor, setDominantColor] = useState("rgb(30,30,40)");
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

  const dropInfo = (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute top-full right-0 left-0 z-40 mt-1.5"
    >
      <div
        className="rounded-2xl p-4 shadow-2xl shadow-black/80 border border-white/[0.06] bg-black/80 backdrop-blur-2xl"
      >
        <p className="text-[11px] text-white/60 leading-relaxed mb-3">{game.description}</p>
        <div className="flex items-center gap-3 mb-3 text-[9px]">
          <span className={cn("flex items-center gap-1 font-bold", game.rating >= 4.5 ? "text-emerald-400" : game.rating >= 4.0 ? "text-amber-400" : "text-white/40")}>
            <Star size={9} fill="currentColor" /> {game.rating}
            <span className="font-normal text-white/25">
              {game.rating >= 4.7 ? "ممتاز" : game.rating >= 4.3 ? "ممتاز جدا" : game.rating >= 4.0 ? "جيد جدا" : game.rating >= 3.5 ? "جيد" : "مقبول"}
            </span>
          </span>
          <span className="flex items-center gap-1 text-white/40"><Calendar size={9} /> {game.releaseYear}</span>
          <span className="flex items-center gap-1 text-white/40"><Users size={9} /> {game.players} لاعب</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {game.genre.map(g => (
            <span key={g} className="text-[8px] px-2 py-0.5 rounded-lg bg-white/[0.06] text-white/70 font-semibold">{g}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {game.platforms.map(p => (
            <span key={p} className="text-[8px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-white/40 font-semibold border border-white/[0.04]">{p}</span>
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
      <div onMouseEnter={onEnter} onMouseLeave={onLeave} className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-nf-secondary/5 hover:bg-nf-secondary/20 transition-colors cursor-pointer border border-transparent hover:border-white/5">
        <div className="relative overflow-hidden rounded-lg shrink-0">
          <img src={game.cover} alt={game.name} {...imgProtect} className="w-11 h-14 object-cover select-none" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white truncate">{game.name}</p>
          <p className="text-[9px] text-nf-dim/60 mt-0.5">{game.publisher} · {game.developer}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5"><Star size={8} className="text-amber-400" fill="currentColor" /><span className="text-[8px] text-amber-400 font-bold">{game.rating}</span></span>
            <span className="text-[8px] text-nf-dim/40">{game.releaseYear}</span>
            <span className="text-[8px] text-nf-dim/30">·</span>
            <span className="text-[8px] text-nf-dim/40">{game.players} لاعب</span>
          </div>
          <div className="flex flex-wrap gap-0.5 mt-1">
            {game.genre.slice(0, 2).map(g => (<span key={g} className="text-[7px] px-1.5 py-0.5 rounded-md bg-nf-accent/8 text-nf-accent/70 font-semibold">{g}</span>))}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onFav(); }} className={cn("shrink-0 p-1.5 rounded-lg transition-all", isFav ? "text-red-400 bg-red-400/10 hover:bg-red-400/15" : "text-nf-dim/40 hover:text-red-400 hover:bg-red-400/5")}>
          <Heart size={14} fill={isFav ? "currentColor" : "none"} />
        </button>
        <AnimatePresence>{hovered && dropInfo}</AnimatePresence>
      </div>
    );
  }

  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} className="group relative text-right">
      {/* Glow behind card */}
      <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-lg pointer-events-none" style={{ background: dominantColor }} />
      <div className="relative overflow-hidden rounded-xl bg-black ring-1 ring-white/[0.04] group-hover:ring-white/[0.1] transition-all duration-300">
        <img src={game.cover} alt={game.name} {...imgProtect} className="w-full aspect-[3/4] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] select-none pointer-events-none" />
        {/* Bottom gradient with name + rating */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/50 to-transparent p-2.5 pt-10">
          <p className="text-[11px] text-white font-bold truncate drop-shadow-lg">{game.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Star size={8} className="text-amber-400" fill="currentColor" />
            <span className="text-[8px] text-amber-400 font-bold">{game.rating}</span>
            <span className="text-[7px] text-white/20">|</span>
            <span className="text-[7px] text-white/30">{game.releaseYear}</span>
          </div>
        </div>
        {/* Genre badge */}
        <div className="absolute top-1.5 right-1.5">
          <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-white/60 font-bold border border-white/[0.06]">{game.genre[0]}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className={cn(
            "absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
            isFav
              ? "bg-red-500 text-white shadow-red-500/40"
              : "bg-black/40 backdrop-blur-sm text-white/60 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 hover:shadow-red-500/40"
          )}
        >
          <Heart size={11} fill={isFav ? "white" : "none"} />
        </button>
      </div>
      <AnimatePresence>{hovered && dropInfo}</AnimatePresence>
    </div>
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
  // Dropdown states
  const [showGenreDrop, setShowGenreDrop] = useState(false);
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [showSortDrop, setShowSortDrop] = useState(false);
  const genreDropRef = useRef<HTMLDivElement>(null);
  const platformDropRef = useRef<HTMLDivElement>(null);
  const sortDropRef = useRef<HTMLDivElement>(null);


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
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (featured.length === 0) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);
  const heroGame = featured[heroIdx];

  const sortOptions = [
    { id: "name" as const, label: "الاسم", icon: <Tag size={10} /> },
    { id: "rating" as const, label: "التقييم", icon: <Trophy size={10} /> },
    { id: "year" as const, label: "الأحدث", icon: <Clock size={10} /> },
    { id: "oldest" as const, label: "الأقدم", icon: <Clock size={10} className="rotate-180" /> },
  ];

  return (
    <div className="w-full" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="p-2 rounded-xl text-nf-dim hover:text-white hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2"><Gamepad2 size={18} className="text-nf-accent/60" />مكتبة الألعاب</h1>
            <p className="text-[9px] text-nf-dim/50">اكتشف ألعابك المفضلة وتابعها</p>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-nf-accent/10 text-nf-accent font-bold border border-nf-accent/20">{GAMES.length} لعبة</span>
        </div>
        <div className="flex items-center gap-2">
          {favoriteIds.length > 0 && (
            <button onClick={() => setShowFavOnly(!showFavOnly)} className={cn("flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold transition-all border", showFavOnly ? "bg-red-500/15 text-red-400 border-red-500/25" : "bg-red-500/5 text-red-400/70 hover:bg-red-500/10 border-red-500/10 hover:border-red-500/20")}>
              <Heart size={9} fill={showFavOnly ? "currentColor" : "none"} /> {favoriteIds.length}/20
            </button>
          )}
          <button onClick={() => setLayout(layout === "grid" ? "list" : "grid")} className={cn("p-1.5 rounded-lg text-nf-dim hover:text-white transition-colors border", layout === "grid" ? "bg-nf-secondary/20 border-white/5" : "bg-nf-accent/10 border-nf-accent/20 text-nf-accent")}>
            {layout === "grid" ? <LayoutList size={14} /> : <Grid3X3 size={14} />}
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      {heroGame && !searchQuery && !genreFilter && !platformFilter && activeTab === "all" && (
        <motion.div key={heroGame.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative h-[150px] sm:h-[220px] rounded-2xl overflow-hidden mb-4 group cursor-pointer border border-white/5 hover:border-white/10 transition-colors" onClick={() => { const g = heroGame; if (g.steamUrl) window.open(g.steamUrl, "_blank"); }}>
          <img src={heroGame.cover} alt={heroGame.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] select-none pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
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
            </div>
          </div>
          {/* Hero dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {featured.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setHeroIdx(i); }} className={cn("h-1 rounded-full transition-all", i === heroIdx ? "bg-white w-5" : "bg-white/30 w-1.5 hover:bg-white/50")} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Tabs */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all" as const, label: "الكل", icon: <Gamepad2 size={10} /> },
          { id: "followed" as const, label: "المتابَعين", icon: <Heart size={10} /> },
          { id: "trending" as const, label: "رائج", icon: <TrendingUp size={10} /> },
          { id: "new" as const, label: "جديد", icon: <Zap size={10} /> },
          { id: "best" as const, label: "الأفضل", icon: <Crown size={10} /> },
          { id: "hot" as const, label: "شو رائج؟", icon: <Flame size={10} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border", activeTab === tab.id ? "bg-nf-accent/15 text-nf-accent border-nf-accent/25" : "bg-nf-secondary/10 text-nf-dim hover:text-white border-white/5 hover:border-white/10")}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-nf-dim/50" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث عن لعبة، ناشر، مطور، أو نوع..." className="w-full bg-nf-secondary/15 rounded-xl pr-9 pl-4 py-2 text-[11px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:ring-1 focus:ring-nf-accent/20 transition-all border border-white/5 focus:border-nf-accent/25" />
      </div>

      {/* Filter Row: Dropdowns */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Genre Dropdown */}
        <div ref={genreDropRef} className="relative">
          <button onClick={() => { setShowGenreDrop(!showGenreDrop); setShowPlatformDrop(false); setShowSortDrop(false); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border", genreFilter ? "bg-nf-accent/15 text-nf-accent border-nf-accent/30" : "bg-nf-secondary/20 text-nf-dim hover:text-white border-white/5")}>
            <Filter size={10} /> {genreFilter || "النوع"} <ChevronDown size={10} className={cn("transition-transform", showGenreDrop && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showGenreDrop && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-xl p-1.5 shadow-xl z-50 max-h-[240px] overflow-y-auto min-w-[140px]">
                <button onClick={() => { setGenreFilter(null); setShowGenreDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", !genreFilter ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-white")}>الكل</button>
                {allGenres.map(g => (
                  <button key={g} onClick={() => { setGenreFilter(genreFilter === g ? null : g); setShowGenreDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", genreFilter === g ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-white")}>{g}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Platform Dropdown */}
        <div ref={platformDropRef} className="relative">
          <button onClick={() => { setShowPlatformDrop(!showPlatformDrop); setShowGenreDrop(false); setShowSortDrop(false); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border", platformFilter ? "bg-nf-accent/15 text-nf-accent border-nf-accent/30" : "bg-nf-secondary/20 text-nf-dim hover:text-white border-white/5")}>
            <Monitor size={10} /> {platformFilter || "المنصة"} <ChevronDown size={10} className={cn("transition-transform", showPlatformDrop && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showPlatformDrop && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-xl p-1.5 shadow-xl z-50 min-w-[120px]">
                <button onClick={() => { setPlatformFilter(null); setShowPlatformDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", !platformFilter ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-white")}>الكل</button>
                {allPlatforms.map(p => (
                  <button key={p} onClick={() => { setPlatformFilter(platformFilter === p ? null : p); setShowPlatformDrop(false); }} className={cn("w-full text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", platformFilter === p ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-white")}>{p}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Dropdown */}
        <div ref={sortDropRef} className="relative">
          <button onClick={() => { setShowSortDrop(!showSortDrop); setShowGenreDrop(false); setShowPlatformDrop(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border bg-nf-secondary/20 text-nf-dim hover:text-white border-white/5">
            {sortOptions.find(s => s.id === sortBy)?.icon} {sortOptions.find(s => s.id === sortBy)?.label} <ChevronDown size={10} className={cn("transition-transform", showSortDrop && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showSortDrop && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="absolute top-full mt-1 right-0 bg-nf-primary border border-nf-border-2 rounded-xl p-1.5 shadow-xl z-50 min-w-[120px]">
                {sortOptions.map(s => (
                  <button key={s.id} onClick={() => { setSortBy(s.id); setShowSortDrop(false); }} className={cn("w-full flex items-center gap-2 text-right px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", sortBy === s.id ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-white")}>{s.icon} {s.label}</button>
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
      {layout === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filtered.map(g => (<GameCard key={g.id} game={g} isFav={favoriteIds.includes(g.id)} onFav={() => toggleFavorite(g.id)} layout="grid" />))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map(g => (<GameCard key={g.id} game={g} isFav={favoriteIds.includes(g.id)} onFav={() => toggleFavorite(g.id)} layout="list" />))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-nf-secondary/20 flex items-center justify-center mx-auto mb-3 border border-white/5"><Gamepad2 size={24} className="text-nf-dim/30" /></div>
          <p className="text-[12px] text-nf-dim font-semibold">لا توجد نتائج</p>
          <p className="text-[10px] text-nf-dim/40 mt-1">جرّب تغيير الفلاتر أو البحث بكلمات أخرى</p>
        </div>
      )}

      <AnimatePresence>
        {showFavModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFavModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }} className="bg-nf-primary border border-white/10 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Heart size={24} className="text-red-400" /></div>
              <h3 className="text-sm font-bold text-white mb-1.5">وصلت للحد الأقصى</h3>
              <p className="text-[11px] text-nf-muted mb-4">يمكنك اختيار 20 لعبة فقط. أزل واحدة أولاً ثم أضف الجديدة.</p>
              <button onClick={() => setShowFavModal(false)} className="px-5 py-2 rounded-xl bg-nf-accent text-white text-[12px] font-bold hover:bg-nf-accent/80 transition-colors">فهمت</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
