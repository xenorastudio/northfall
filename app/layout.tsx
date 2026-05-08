import type { Metadata } from 'next';
import './globals.css';
import { Cairo, Inter } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700', '800', '900'] });

const SITE_URL = 'https://www.northfall.blog';
const SITE_NAME = 'NorthFall';
const SITE_DESCRIPTION = 'NorthFall — أكبر مجتمع عربي لتطوير الألعاب. تعلم Unity و Unreal Engine و Godot و Blender بالعربي. شارك مشروعك، تواصل مع مطورين عرب، شروحات مجانية، دورات برمجة ألعاب، ونقاشات تقنية. انضم لمجتمع GameDev العربي الأول.';

const KEYWORDS = [
  // Brand — NorthFall alone + every variation
  'NorthFall', 'نورث فول', 'نورثفول', 'North Fall', 'Northfall', 'نورثفال', 'NorthFall مجتمع', 'NorthFall منتدى', 'NorthFall blog', 'NorthFall موقع', 'موقع NorthFall', 'NorthFall عربي', 'NorthFall Arabic', 'NorthFall gaming', 'NorthFall game dev', 'NorthFall تطوير ألعاب', 'NorthFall Unity', 'NorthFall Unreal', 'NorthFall Godot', 'NorthFall Blender', 'northfall.blog', 'www.northfall.blog',
  // Brand intent — people searching for the platform itself
  'مجتمع الألعاب العرب', 'منتدى الألعاب العرب', 'منصة مطورين عرب', 'شبكة مطورين عربية', 'ريدت الألعاب العرب', 'reddit الألعاب عربي',
  // Gaming AR — every variation
  'ألعاب', 'العاب', 'ألعاب فيديو', 'العاب فيديو', 'جيمر عرب', 'جيمرز عرب', 'جيمر عربي', 'مجتمع ألعاب عربي', 'منتدى ألعاب عربي', 'منتدى العاب عرب', 'نقاشات ألعاب عربية', 'أخبار الألعاب العربية', 'مراجعات ألعاب عربي', 'تحميل ألعاب مجانية', 'ألعاب عربية مجانية', 'ألعاب عرب', 'قيمز عرب', 'عالم الألعاب عربي', 'عالم الالعاب', 'مجتمع جيمرز عربي', 'منتدى جيمرز عربي', 'ألعاب اونلاين عربية', 'ألعاب مجانية عربية', 'ألعاب جديدة عربية', 'تحميل العاب عربي', 'توبيكات ألعاب عربية', 'ستريم ألعاب عربي', 'بث ألعاب عربي', 'قنوات ألعاب عربية', 'يوتيوب ألعاب عربي',
  // Gaming EN
  'games', 'gaming', 'gaming community arabic', 'gaming forum arab', 'game forum arabic', 'game discussion arabic', 'game reviews arabic', 'free games arabic', 'game news arabic', 'gamer arab', 'gamers arab', 'video games arabic', 'pc gaming arabic', 'mobile games arabic', 'indie games arabic', 'game development arabic', 'game dev arabic', 'arabic gaming community', 'arabic game forum', 'arab gamers', 'middle east gaming', 'mena gaming community',
  // Unity — comprehensive
  'Unity', 'يونيتي', 'تعلم Unity بالعربي', 'دورة Unity مجانية', 'Unity بالعربي', 'Unity عربي', 'Unity tutorials arabic', 'Unity tutorial بالعربي', 'Unity 3D عربي', 'Unity 2D عربي', 'Unity game engine عربي', 'محرك Unity بالعربي', 'Unity C# عربي', 'Unity مشاريع عربية', 'Unity تطوير ألعاب عربي', 'Unity learn عربي', 'Unity course عربي', 'Unity developer عربي', 'مطور Unity عربي', 'Unity scripting عربي', 'Unity assets عربية', 'Unity UI عربي', 'Unity VR عربي', 'Unity AR عربي', 'Unity mobile عربي', 'Unity shader عربي', 'Unity animation عربي', 'Unity 6 عربي', 'Unity 2024 عربي', 'Unity 2025 عربي', 'Unity DOTS عربي', 'Unity ECS عربي', 'Unity Netcode عربي', 'Unity multiplayer عربي', 'Unity لعب أونلاين عربي', 'Unity NavMesh عربي', 'Unity AI عربي', 'Unity فيزياء عربي', 'Unity physics عربي', 'Unity تاثيرات عربي', 'Unity VFX عربي', 'Unity Particle System عربي', 'Unity Terrain عربي', 'Unity Pro عربي', 'Unity Personal عربي', 'Unity Asset Store عربي', 'مشروع Unity كامل عربي', 'Unity مشاكل وحلول عربي', 'Unity bugs عربي', 'Unity أداء عربي', 'Unity optimization عربي',
  // Unreal — comprehensive
  'Unreal', 'أنريل', 'Unreal Engine عربي', 'UE5 عربي', 'UE4 عربي', 'تعلم Unreal بالعربي', 'دورة Unreal Engine مجانية', 'Unreal بالعربي', 'Unreal عربي', 'Unreal tutorials arabic', 'Unreal Blueprint عربي', 'Unreal C++ عربي', 'Unreal Nanite عربي', 'Unreal Lumen عربي', 'Unreal MetaHuman عربي', 'محرك Unreal بالعربي', 'Unreal مشاريع عربية', 'Unreal تطوير ألعاب عربي', 'Unreal developer عربي', 'مطور Unreal عربي', 'Unreal 3D عربي', 'Unreal VR عربي', 'Unreal shader عربي', 'Unreal visual scripting عربي', 'Unreal Engine 5 عربي', 'UE5.4 عربي', 'UE5.3 عربي', 'Unreal Niagara عربي', 'Unreal Chaos عربي', 'Unreal World Partition عربي', 'Unreal Blueprints عربي', 'Unreal Material عربي', 'Unreal Texture عربي', 'Unreal Lighting عربي', 'Unreal إضاءة عربي', 'Unreal Landscape عربي', 'Unreal Foliage عربي', 'Unreal Animation عربي', 'Unreal حركة عربي', 'Unreal Sequencer عربي', 'Unreal سينمائي عربي', 'Unreal Cinematic عربي', 'Unreal Multiplayer عربي', 'Unreal أونلاين عربي', 'مشروع Unreal كامل عربي', 'Unreal مشاكل وحلول عربي', 'Unreal أداء عربي', 'Unreal optimization عربي',
  // Godot — comprehensive
  'Godot', 'جودوت', 'تعلم Godot بالعربي', 'دورة Godot مجانية', 'Godot بالعربي', 'Godot عربي', 'Godot tutorials arabic', 'Godot 4 عربي', 'Godot 3D عربي', 'Godot 2D عربي', 'محرك Godot بالعربي', 'Godot GDScript عربي', 'Godot open source عربي', 'Godot مفتوح المصدر عربي', 'Godot مشاريع عربية', 'Godot تطوير ألعاب عربي', 'Godot developer عربي', 'مطور Godot عربي', 'Godot indie عربي', 'Godot shader عربي', 'Godot mobile عربي', 'Godot engine عربي', 'Godot 4.3 عربي', 'Godot 4.2 عربي', 'Godot C# عربي', 'Godot GDExtension عربي', 'Godot TileMap عربي', 'Godot Tileset عربي', 'Godot Physics عربي', 'Godot فيزياء عربي', 'Godot Multiplayer عربي', 'Godot أونلاين عربي', 'Godot Animation عربي', 'Godot حركة عربي', 'Godot UI عربي', 'Godot واجهة عربي', 'Godot Shader عربي', 'Godot تاثيرات عربي', 'مشروع Godot كامل عربي', 'Godot مشاكل وحلول عربي', 'Godot أداء عربي',
  // Blender — comprehensive
  'Blender', 'بلندر', 'تعلم Blender بالعربي', 'دورة Blender مجانية', 'Blender بالعربي', 'Blender عربي', 'Blender tutorials arabic', 'Blender 3D عربي', 'Blender modeling عربي', 'Blender نمذجة عربية', 'Blender animation عربي', 'Blender أنيميشن عربي', 'Blender rendering عربي', 'Blender render عربي', 'Blender sculpting عربي', 'Blender نحت عربي', 'Blender shader عربي', 'Blender EEVEE عربي', 'Blender Cycles عربي', 'Blender Geometry Nodes عربي', 'Blender مجاني عربي', 'Blender free عربي', 'Blender artist عربي', 'فنان Blender عربي', 'Blender game assets عربية', 'Blender 4 عربي', 'Blender 4.2 عربي', 'Blender UV عربي', 'Blender Texture عربي', 'Blender Materials عربي', 'Blender Rigging عربي', 'Blender هيكلة عربي', 'Blender Weight Paint عربي', 'Blender UV Mapping عربي', 'Blender Retopology عربي', 'Blender Baking عربي', 'Blender Compositing عربي', 'Blender Simulation عربي', 'Blender Cloth عربي', 'Blender Fluid عربي', 'Blender Smoke عربي', 'Blender Hair عربي', 'Blender Grease Pencil عربي', 'Blender 2D Animation عربي', 'Blender Addons عربي', 'Blender إضافات عربي',
  // GameDev — comprehensive
  'تطوير ألعاب بالعربي', 'تطوير العاب عربي', 'صناعة ألعاب عربية', 'صناعة العاب عربي', 'برمجة ألعاب بالعربي', 'برمجة العاب عربي', 'تصميم ألعاب عربي', 'تصميم العاب عربي', 'مطور ألعاب عربي', 'مطور العاب عربي', 'game development arabic', 'game developer arabic', 'game design arabic', 'game programming arabic', 'indie game dev arabic', 'indie developer عربي', 'indie game عربي', 'لعبة مستقلة عربية', 'مطور مستقل عربي', 'game jam عربي', 'هاكاثون ألعاب عربي', 'محرك ألعاب عربي', 'أفضل محرك ألعاب عربي', 'مقارنة محركات الألعاب عربي', 'Unity vs Unreal عربي', 'Unity vs Godot عربي', 'ألعاب 2D عربي', 'ألعاب 3D عربي', 'ألعاب RPG عربي', 'ألعاب FPS عربي', 'ألعاب منصات عربي', 'ألعاب بلاتفورمر عربي', 'ألعاب استراتيجية عربي', 'ألعاب مغامرات عربي', 'ألعاب رعب عربي', 'ألعاب سباق عربي', 'ألعاب قتال عربي', 'ألعاب MMORPG عربي', 'ألعاب أونلاين عربي', 'نشر لعبة عربي', 'تسويق لعبة عربي', 'Steam عربي', 'نشر Steam عربي', 'App Store عربي', 'Google Play عربي',
  // Programming — comprehensive
  'برمجة بالعربي', 'تعلم برمجة عربي', 'دورة برمجة مجانية', 'برمجة عربي', 'C# عربي', 'C++ عربي', 'Python عربي', 'JavaScript عربي', 'GDScript عربي', 'برمجة C# بالعربي', 'programming arabic', 'coding عربي', 'learn programming arabic', 'programming tutorial arabic', 'learn coding عربي', 'تعلم البرمجة عربي', 'برمجة ألعاب C# عربي', 'برمجة ألعاب C++ عربي', 'برمجة ألعاب Python عربي', 'تعلم C# من الصفر عربي', 'تعلم C++ من الصفر عربي', 'أفضل لغة برمجة للألعاب عربي', 'خوارزميات ألعاب عربي', 'هياكل بيانات ألعاب عربي', 'AI برمجة ألعاب عربي', 'ذكاء اصطناعي ألعاب برمجة عربي',
  // 3D/Art — comprehensive
  'نمذجة ثلاثية الأبعاد عربي', '3D modeling عربي', '3D design عربي', 'تصميم ثلاثي الأبعاد عربي', '3D artist عربي', 'فنان رقمي عربي', 'digital art عربي', 'فن رقمي عربي', 'game art عربي', 'game assets عربية', 'pixel art عربي', 'game resources عربية', 'مصادر ألعاب عربية', 'تصميم شخصيات ألعاب عربي', 'Character Design عربي', 'Environment Design عربي', 'Level Design عربي', 'تصميم مراحل عربي', 'Texture عربي', 'Material عربي', 'PBR عربي', 'Normal Map عربي', 'UV Mapping عربي', 'Rigging عربي', 'Animation عربي', 'حركة شخصيات عربي', 'Motion Capture عربي', 'Sound Design عربي', 'تصميم صوت ألعاب عربي', 'Music عربي', 'موسيقى ألعاب عربي', 'UI Design عربي', 'UX Design عربي', 'واجهة مستخدم ألعاب عربي',
  // Community — comprehensive
  'مجتمع مطورين عرب', 'مجتمعات مطورين عربية', 'منتدى مطورين عربي', 'منتديات مطورين عربية', 'نقاش تقني عربي', 'نقاشات تقنية عربية', 'مشاركة مطورين عرب', 'تواصل مطورين عرب', 'شبكة مطورين عربية', 'social network مطورين عرب', 'community platform عربي', 'forum عربي مطورين', 'discussion عربي تقني', 'منصة مطورين عرب', 'مجتمع جيمرز عرب', 'مجتمع تقني عربي', 'تعاون مطورين عرب', 'فريق تطوير ألعاب عربي', 'توظيف مطورين عرب', 'وظائف مطور ألعاب عربي', 'freelance مطور ألعاب عربي', 'مشاريع جماعية ألعاب عربية',
  // Tech — comprehensive
  'تقنية ألعاب عربية', 'تكنولوجيا ألعاب عربي', 'tech عربي', 'أخبار تقنية عربية', 'tech news عربي', 'gaming tech عربي', 'VR عربي', 'AR عربي', 'الواقع الافتراضي عربي', 'الواقع المعزز عربي', 'virtual reality عربي', 'augmented reality عربي', 'AI ألعاب عربي', 'ذكاء اصطناعي ألعاب عربي', 'Procedural Generation عربي', 'توليد إجرائي عربي', 'Ray Tracing عربي', 'DLSS عربي', 'FSR عربي', 'أداء ألعاب عربي', 'Game Optimization عربي', 'تحسين أداء ألعاب عربي',
  // Learning — comprehensive
  'تعلم تطوير ألعاب عربي', 'دورة تطوير ألعاب مجانية', 'دروس تطوير ألعاب عربية', 'شروحات تطوير ألعاب عربية', 'تعليم تطوير ألعاب عربي', 'tutorial تطوير ألعاب عربي', 'course تطوير ألعاب عربي', 'learn game dev arabic', 'تعلم بالعربي مطورين', 'دورة مجانية مطورين عرب', 'free course game dev arabic', 'تعلم مجاني تطوير ألعاب', 'أكاديمية تطوير ألعاب عربية', 'كتاب تطوير ألعاب عربي', 'PDF تطوير ألعاب عربي', 'فيديو تعليمي تطوير ألعاب عربي', 'يوتيوب تطوير ألعاب عربي', 'مشروع عملي تطوير ألعاب عربي', 'بناء لعبة كاملة عربي', 'صنع لعبة من الصفر عربي', 'تعلم محرك ألعاب عربي', 'أفضل دورات تطوير ألعاب عربي',
  // Countries — local SEO
  'ألعاب السعودية', 'ألعاب مصر', 'ألعاب العراق', 'ألعاب الإمارات', 'ألعاب الكويت', 'ألعاب الأردن', 'ألعاب المغرب', 'ألعاب تونس', 'ألعاب الجزائر', 'ألعاب لبنان', 'ألعاب فلسطين', 'ألعاب سوريا', 'ألعاب اليمن', 'ألعاب عمان', 'ألعاب البحرين', 'ألعاب قطر', 'ألعاب السودان', 'ألعاب ليبيا', 'ألعاب عربية', 'تطوير ألعاب السعودية', 'تطوير ألعاب مصر', 'تطوير ألعاب الإمارات', 'تطوير ألعاب العراق', 'مطور ألعاب سعودي', 'مطور ألعاب مصري', 'مطور ألعاب إماراتي', 'مطور ألعاب عراقي', 'مطور ألعاب أردني', 'مطور ألعاب مغربي',
  // Popular games — traffic drivers
  'فالورانت', 'Valorant عربي', 'ماينكرافت', 'Minecraft عربي', 'فورتنایت', 'Fortnite عربي', 'PUBG عربي', 'ببجي', 'GTA عربي', 'Roblox عربي', 'روبلوكس', 'League of Legends عربي', 'FIFA عربي', 'فيفا', 'Call of Duty عربي', 'Apex Legends عربي', 'Genshin Impact عربي', 'جينشين إمباكت', 'Elden Ring عربي', 'Zelda عربي', 'Spider-Man عربي', 'God of War عربي', 'Horizon عربي', 'The Last of Us عربي', 'Cyberpunk عربي', 'Diablo عربي', 'ديابلو', 'Overwatch عربي', 'أوفروتش', 'Riot Games عربي', 'Epic Games عربي', 'Steam عربي',
  // Problem-solving — high intent
  'مشكلة Unity عربي', 'حل مشكلة Unreal عربي', 'خطأ Godot عربي', 'مشكلة Blender عربي', 'Unity لا يعمل عربي', 'Unreal crash عربي', 'Godot bug عربي', 'Blender مشكلة عربي', 'كيف أصنع لعبة عربي', 'كيف أتعلم تطوير ألعاب عربي', 'من أين أبدأ تطوير ألعاب عربي', 'أفضل محرك ألعاب للمبتدئين عربي', 'كيف أنشر لعبة على Steam عربي', 'كيف أربح من الألعاب عربي',
  // Long-tail — very specific searches
  'كيفية صنع لعبة بالعربي خطوة بخطوة', 'تعلم برمجة الألعاب من الصفر بالعربي', 'أفضل محرك ألعاب للمبتدئين عربي 2024', 'أفضل محرك ألعاب للمبتدئين عربي 2025', 'صنع لعبة 2D بالعربي', 'صنع لعبة 3D بالعربي', 'صنع لعبة موبايل بالعربي', 'صنع لعبة أونلاين بالعربي', 'تعلم Unity من الصفر بالعربي', 'تعلم Unreal Engine من الصفر بالعربي', 'تعلم Godot من الصفر بالعربي', 'تعلم Blender من الصفر بالعربي', 'دورة Unity مجانية بالعربي 2025', 'دورة Unreal مجانية بالعربي 2025', 'دورة Godot مجانية بالعربي 2025',
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — مجتمع مطوري الألعاب العرب`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — مجتمع مطوري الألعاب العرب`,
    description: SITE_DESCRIPTION,
    images: [{ url: `${SITE_URL}/assets/images/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — مجتمع مطوري الألعاب العرب`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/assets/images/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': SITE_NAME,
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#1e1e20',
    'theme-color': '#1e1e20',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: ['نورث فول', 'نورثفول', 'NorthFall', 'Northfall', 'مجتمع مطورين عرب', 'ريدت الألعاب العرب', 'منتدى GameDev عربي', 'أكبر مجتمع عربي لتطوير الألعاب', 'NorthFall blog', 'northfall.blog'],
        description: SITE_DESCRIPTION,
        inLanguage: ['ar', 'en'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/app?view=feed&q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: 'نورث فول',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/assets/images/logo.png`,
          width: 512,
          height: 512,
        },
        description: SITE_DESCRIPTION,
        foundingDate: '2025',
        sameAs: [
          'https://twitter.com/NorthFall_',
          'https://github.com/xenorastudio/northfall',
          'https://discord.gg/northfall',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          url: `${SITE_URL}/app?view=help`,
          availableLanguage: ['Arabic', 'English'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: 'SocialNetworkingApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description: SITE_DESCRIPTION,
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/#navigation`,
        itemListElement: [
          { '@type': 'SiteNavigationElement', name: 'الرئيسية', url: `${SITE_URL}/app` },
          { '@type': 'SiteNavigationElement', name: 'المنتدى', url: `${SITE_URL}/forum` },
          { '@type': 'SiteNavigationElement', name: 'مجتمع Unity', url: `${SITE_URL}/community/Unity` },
          { '@type': 'SiteNavigationElement', name: 'مجتمع Unreal', url: `${SITE_URL}/community/Unreal` },
          { '@type': 'SiteNavigationElement', name: 'مجتمع Godot', url: `${SITE_URL}/community/Godot` },
          { '@type': 'SiteNavigationElement', name: 'مجتمع Blender', url: `${SITE_URL}/community/Blender` },
        ],
      },
    ],
  };

  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${cairo.variable} ${inter.variable} font-cairo min-h-screen w-full bg-[#1e1e20] text-[#e0e0e0] antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
