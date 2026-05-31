import { CATEGORY_SLUG } from "@/lib/user-interests";

export const ONBOARDING_GENDER_OPTIONS = [
  { id: "man", labelAr: "رجل", labelEn: "Man" },
  { id: "woman", labelAr: "امرأة", labelEn: "Woman" },
  { id: "non-binary", labelAr: "غير ثنائي", labelEn: "Non-binary" },
] as const;

/** وسوم الخطوة 3 لكل تصنيف (slug من CATEGORY_SLUG) */
export const ONBOARDING_TAGS_BY_SLUG: Record<string, string[]> = {
  gamedev: ["Unity", "Unreal Engine", "Godot", "Game Design", "Indie Games", "Blender", "C#", "Pixel Art"],
  gaming: ["PC Gaming", "Elden Ring", "RPG", "Steam", "Minecraft", "PlayStation", "Xbox", "Esports"],
  programming: ["JavaScript", "TypeScript", "Python", "Next.js", "React", "Node.js", "Rust", "Open Source"],
  ai: ["ChatGPT", "Machine Learning", "LLM", "Stable Diffusion", "Prompt Engineering", "Automation"],
  security: ["Cybersecurity", "CTF", "Penetration Testing", "Privacy", "Linux Security", "OSINT"],
  hardware: ["PC Build", "GPUs", "CPUs", "Overclocking", "Peripherals", "Raspberry Pi"],
  mobile: ["Android", "iOS", "Flutter", "React Native", "Swift", "Kotlin"],
  creators: ["Twitch", "YouTube", "Kick", "Streaming Setup", "OBS", "Content Strategy"],
  crypto: ["Bitcoin", "Ethereum", "DeFi", "NFT", "Trading", "Web3"],
  art: ["Digital Art", "Illustration", "UI Design", "Figma", "Concept Art", "3D Modeling"],
  showcase: ["Side Projects", "Portfolio", "Startup MVP", "Open Beta", "Devlog"],
  anime: ["One Piece", "Attack on Titan", "Manga", "Cosplay", "Studio Ghibli", "Manhwa"],
  video: ["Premiere Pro", "After Effects", "DaVinci Resolve", "CapCut", "Motion Graphics"],
  photography: ["Portrait", "Landscape", "Lightroom", "Street Photo", "Camera Gear"],
  memes: ["Arabic Memes", "Gaming Memes", "Reaction Images", "Shitpost"],
  trends: ["Twitter/X", "TikTok", "Viral", "Internet Culture", "Reddit"],
  discussion: ["Ask Me Anything", "Hot Take", "Debate", "Advice", "Polls"],
  stories: ["Vent", "Life Update", "Relationship", "Personal Growth"],
  horror: ["Horror Games", "Creepypasta", "True Crime", "Paranormal"],
  movies: ["Netflix", "Marvel", "K-Drama", "Anime Films", "Series Reviews"],
  hobbies: ["Collectibles", "Board Games", "LEGO", "Model Kits", "Crafts"],
  education: ["University", "Online Courses", "Exams", "Study Tips", "Scholarships"],
  work: ["Freelance", "Remote Work", "CV", "Interview", "Entrepreneurship"],
  science: ["Physics", "Biology", "Space News", "Research Papers"],
  psychology: ["Mental Health", "Therapy", "Productivity", "Habits"],
  space: ["NASA", "Astronomy", "SpaceX", "Telescopes"],
  languages: ["English Learning", "Translation", "Arabic Grammar", "Duolingo"],
  business: ["Marketing", "Sales", "Startups", "Investing", "Side Hustle"],
  ecommerce: ["Shopify", "Dropshipping", "Amazon", "Etsy"],
  sports: ["Football", "FIFA", "NBA", "Fitness", "Gym"],
  health: ["Nutrition", "Workout", "Wellness", "Sleep"],
  travel: ["Backpacking", "Hotels", "Visa Tips", "Tourism"],
  food: ["Cooking", "Recipes", "Restaurants", "Coffee"],
  cars: ["Supercars", "Drift", "Forza", "Car Mods", "Electric Vehicles"],
};

export function getCategorySlug(label: string): string {
  return CATEGORY_SLUG[label] || "";
}

export function tagsForCategoryLabels(labels: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const label of labels) {
    const slug = getCategorySlug(label);
    const tags = ONBOARDING_TAGS_BY_SLUG[slug] || [];
    for (const t of tags) {
      if (seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}
