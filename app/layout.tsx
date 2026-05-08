import type { Metadata } from 'next';
import './globals.css';
import { Cairo, Inter } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700', '800', '900'] });

const SITE_URL = 'https://www.northfall.blog';
const SITE_NAME = 'NorthFall';
const SITE_DESCRIPTION = 'مجتمعات متخصصة لتطوير الألعاب بالعربي — Unity و Unreal Engine و Godot و Blender. شارك مشروعك، تعلم من خبراء عرب، وكن جزء من أكبر مجتمع لتطوير الألعاب في العالم العربي.';

const KEYWORDS = [
  // Brand (similar to competitors but NOT exact same)
  'NorthFall', 'نورث فول', 'NorthFall مجتمع', 'NorthFall منتدى', 'مجتمع الألعاب العرب', 'NorthFall blog',
  // Gaming AR — variations competitors don't use
  'ألعاب', 'العاب', 'ألعاب فيديو', 'العاب فيديو', 'جيمر عرب', 'جيمرز عرب', 'مجتمع ألعاب عربي', 'منتدى ألعاب عربي', 'منتدى العاب عرب', 'نقاشات ألعاب عربية', 'أخبار الألعاب العربية', 'مراجعات ألعاب عربي', 'تحميل ألعاب مجانية', 'ألعاب عربية مجانية', 'ألعاب عرب', 'قيمز عرب', 'جيمر عربي',
  // Gaming EN — similar but different phrasing
  'games', 'gaming', 'gaming community arabic', 'gaming forum arab', 'game forum arabic', 'game discussion arabic', 'game reviews arabic', 'free games arabic', 'game news arabic', 'gamer arab', 'gamers arab', 'video games arabic', 'pc gaming arabic', 'mobile games arabic', 'indie games arabic', 'game development arabic', 'game dev arabic',
  // Unity — similar keywords not exact match
  'Unity', 'يونيتي', 'تعلم Unity بالعربي', 'دورة Unity مجانية', 'Unity بالعربي', 'Unity عربي', 'Unity tutorials arabic', 'Unity tutorial بالعربي', 'Unity 3D عربي', 'Unity 2D عربي', 'Unity game engine عربي', 'محرك Unity بالعربي', 'Unity C# عربي', 'Unity مشاريع عربية', 'Unity تطوير ألعاب عربي', 'Unity learn عربي', 'Unity course عربي', 'Unity developer عربي', 'مطور Unity عربي', 'Unity scripting عربي', 'Unity assets عربية', 'Unity UI عربي', 'Unity VR عربي', 'Unity AR عربي', 'Unity mobile عربي', 'Unity shader عربي', 'Unity animation عربي',
  // Unreal — variations
  'Unreal', 'أنريل', 'Unreal Engine عربي', 'UE5 عربي', 'UE4 عربي', 'تعلم Unreal بالعربي', 'دورة Unreal Engine مجانية', 'Unreal بالعربي', 'Unreal عربي', 'Unreal tutorials arabic', 'Unreal Blueprint عربي', 'Unreal C++ عربي', 'Unreal Nanite عربي', 'Unreal Lumen عربي', 'Unreal MetaHuman عربي', 'محرك Unreal بالعربي', 'Unreal مشاريع عربية', 'Unreal تطوير ألعاب عربي', 'Unreal developer عربي', 'مطور Unreal عربي', 'Unreal 3D عربي', 'Unreal VR عربي', 'Unreal shader عربي', 'Unreal visual scripting عربي',
  // Godot — variations
  'Godot', 'جودوت', 'تعلم Godot بالعربي', 'دورة Godot مجانية', 'Godot بالعربي', 'Godot عربي', 'Godot tutorials arabic', 'Godot 4 عربي', 'Godot 3D عربي', 'Godot 2D عربي', 'محرك Godot بالعربي', 'Godot GDScript عربي', 'Godot open source عربي', 'Godot مفتوح المصدر عربي', 'Godot مشاريع عربية', 'Godot تطوير ألعاب عربي', 'Godot developer عربي', 'مطور Godot عربي', 'Godot indie عربي', 'Godot shader عربي', 'Godot mobile عربي', 'Godot engine عربي',
  // Blender — variations
  'Blender', 'بلندر', 'تعلم Blender بالعربي', 'دورة Blender مجانية', 'Blender بالعربي', 'Blender عربي', 'Blender tutorials arabic', 'Blender 3D عربي', 'Blender modeling عربي', 'Blender نمذجة عربية', 'Blender animation عربي', 'Blender أنيميشن عربي', 'Blender rendering عربي', 'Blender render عربي', 'Blender sculpting عربي', 'Blender نحت عربي', 'Blender shader عربي', 'Blender EEVEE عربي', 'Blender Cycles عربي', 'Blender Geometry Nodes عربي', 'Blender مجاني عربي', 'Blender free عربي', 'Blender artist عربي', 'فنان Blender عربي', 'Blender game assets عربية',
  // GameDev — similar not exact
  'تطوير ألعاب بالعربي', 'تطوير العاب عربي', 'صناعة ألعاب عربية', 'صناعة العاب عربي', 'برمجة ألعاب بالعربي', 'برمجة العاب عربي', 'تصميم ألعاب عربي', 'تصميم العاب عربي', 'مطور ألعاب عربي', 'مطور العاب عربي', 'game development arabic', 'game developer arabic', 'game design arabic', 'game programming arabic', 'indie game dev arabic', 'indie developer عربي', 'indie game عربي', 'لعبة مستقلة عربية', 'مطور مستقل عربي', 'game jam عربي', 'هاكاثون ألعاب عربي',
  // Programming
  'برمجة بالعربي', 'تعلم برمجة عربي', 'دورة برمجة مجانية', 'برمجة عربي', 'C# عربي', 'C++ عربي', 'Python عربي', 'JavaScript عربي', 'GDScript عربي', 'برمجة C# بالعربي', 'programming arabic', 'coding عربي', 'learn programming arabic', 'programming tutorial arabic', 'learn coding عربي',
  // 3D/Art
  'نمذجة ثلاثية الأبعاد عربي', '3D modeling عربي', '3D design عربي', 'تصميم ثلاثي الأبعاد عربي', '3D artist عربي', 'فنان رقمي عربي', 'digital art عربي', 'فن رقمي عربي', 'game art عربي', 'game assets عربية', 'pixel art عربي', 'game resources عربية', 'مصادر ألعاب عربية',
  // Community — different phrasing
  'مجتمع مطورين عرب', 'مجتمعات مطورين عربية', 'منتدى مطورين عربي', 'منتديات مطورين عربية', 'نقاش تقني عربي', 'نقاشات تقنية عربية', 'مشاركة مطورين عرب', 'تواصل مطورين عرب', 'شبكة مطورين عربية', 'social network مطورين عرب', 'community platform عربي', 'forum عربي مطورين', 'discussion عربي تقني', 'منصة مطورين عرب', 'مجتمع جيمرز عرب', 'مجتمع تقني عربي',
  // Tech
  'تقنية ألعاب عربية', 'تكنولوجيا ألعاب عربي', 'tech عربي', 'أخبار تقنية عربية', 'tech news عربي', 'gaming tech عربي', 'VR عربي', 'AR عربي', 'الواقع الافتراضي عربي', 'الواقع المعزز عربي', 'virtual reality عربي', 'augmented reality عربي', 'AI ألعاب عربي', 'ذكاء اصطناعي ألعاب عربي',
  // Learning — similar not exact
  'تعلم تطوير ألعاب عربي', 'دورة تطوير ألعاب مجانية', 'دروس تطوير ألعاب عربية', 'شروحات تطوير ألعاب عربية', 'تعليم تطوير ألعاب عربي', 'tutorial تطوير ألعاب عربي', 'course تطوير ألعاب عربي', 'learn game dev arabic', 'تعلم بالعربي مطورين', 'دورة مجانية مطورين عرب', 'free course game dev arabic', 'تعلم مجاني تطوير ألعاب', 'أكاديمية تطوير ألعاب عربية',
  // Countries — local SEO
  'ألعاب السعودية', 'ألعاب مصر', 'ألعاب العراق', 'ألعاب الإمارات', 'ألعاب الكويت', 'ألعاب الأردن', 'ألعاب المغرب', 'ألعاب تونس', 'ألعاب الجزائر', 'ألعاب لبنان', 'ألعاب فلسطين', 'ألعاب سوريا', 'ألعاب اليمن', 'ألعاب عمان', 'ألعاب البحرين', 'ألعاب قطر', 'ألعاب السودان', 'ألعاب ليبيا', 'ألعاب عربية',
  // Popular games — traffic drivers
  'فالورانت', 'Valorant عربي', 'ماينكرافت', 'Minecraft عربي', 'فورتنایت', 'Fortnite عربي', 'PUBG عربي', 'ببجي', 'GTA عربي', 'Roblox عربي', 'روبلوكس', 'League of Legends عربي', 'FIFA عربي', 'فيفا', 'Call of Duty عربي', 'Apex Legends عربي', 'Genshin Impact عربي', 'جينشين إمباكت',
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
        alternateName: ['نورث فول', 'NorthFall', 'مجتمع مطورين عرب', 'ريدت الألعاب العرب', 'منتدى GameDev عربي'],
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
