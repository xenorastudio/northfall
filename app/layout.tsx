import type { Metadata } from 'next';
import './globals.css';
import { Cairo, Inter } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700', '800', '900'] });

const SITE_URL = 'https://www.northfall.blog';
const SITE_NAME = 'NorthFall';
const SITE_DESCRIPTION = 'مكان واحد لكل مطور ألعاب عرب — نتناقش عن Unity و Unreal و Godot و Blender، نشارك مشاريعنا، ونساعد بعض نتعلم. زي ريدت بس للعرب.';

const KEYWORDS = [
  // Brand
  'NorthFall', 'نورث فول', 'NorthFall منصة', 'NorthFall مجتمعات', 'منصة الألعاب العربية', 'NorthFall blog',
  // Gaming AR
  'ألعاب', 'العاب', 'ألعاب فيديو', 'العاب فيديو', 'جيمر عرب', 'جيمرز عرب', 'مجتمع ألعاب', 'منتدى ألعاب', 'منتدى العاب', 'نقاشات ألعاب', 'أخبار الألعاب', 'مراجعات ألعاب', 'تحميل ألعاب', 'ألعاب مجانية', 'ألعاب عربية', 'ألعاب عرب', 'قيمز عرب', 'جيمر عربي',
  // Gaming EN
  'games', 'gaming', 'gaming community', 'gaming forum', 'game forum', 'game discussion', 'game reviews', 'free games', 'game news', 'gamer', 'gamers', 'video games', 'pc gaming', 'mobile games', 'indie games', 'game development', 'game dev',
  // Unity AR/EN
  'Unity', 'يونيتي', 'تعلم Unity', 'دورة Unity', 'Unity بالعربي', 'Unity عربي', 'Unity tutorials', 'Unity tutorial arabic', 'Unity 3D', 'Unity 2D', 'Unity game engine', 'محرك Unity', 'Unity C#', 'Unity مشاريع', 'Unity تطوير ألعاب', 'Unity learn', 'Unity course', 'Unity developer', 'مطور Unity', 'Unity scripting', 'Unity assets', 'Unity UI', 'Unity VR', 'Unity AR', 'Unity mobile', 'Unity shader', 'Unity animation',
  // Unreal AR/EN
  'Unreal', 'أنريل', 'Unreal Engine', 'UE5', 'UE4', 'تعلم Unreal', 'دورة Unreal Engine', 'Unreal بالعربي', 'Unreal عربي', 'Unreal tutorials arabic', 'Unreal Blueprint', 'Unreal C++', 'محرك Unreal', 'Unreal مشاريع', 'Unreal تطوير ألعاب', 'Unreal developer', 'مطور Unreal', 'Unreal 3D', 'Unreal Nanite', 'Unreal Lumen', 'Unreal MetaHuman', 'Unreal animation', 'Unreal VR', 'Unreal shader', 'Unreal visual scripting',
  // Godot AR/EN
  'Godot', 'جودوت', 'تعلم Godot', 'دورة Godot', 'Godot بالعربي', 'Godot عربي', 'Godot tutorials', 'Godot tutorial arabic', 'Godot 4', 'Godot 3D', 'Godot 2D', 'محرك Godot', 'Godot GDScript', 'Godot open source', 'Godot مفتوح المصدر', 'Godot مشاريع', 'Godot تطوير ألعاب', 'Godot developer', 'مطور Godot', 'Godot indie', 'Godot shader', 'Godot mobile', 'Godot engine',
  // Blender AR/EN
  'Blender', 'بلندر', 'تعلم Blender', 'دورة Blender', 'Blender بالعربي', 'Blender عربي', 'Blender tutorials', 'Blender tutorial arabic', 'Blender 3D', 'Blender modeling', 'Blender نمذجة', 'Blender animation', 'Blender أنيميشن', 'Blender rendering', 'Blender render', 'Blender sculpting', 'Blender نحت', 'Blender UV', 'Blender texture', 'Blender shader', 'Blender EEVEE', 'Blender Cycles', 'Blender Geometry Nodes', 'Blender مجاني', 'Blender free', 'Blender artist', 'فنان Blender', 'Blender game assets',
  // GameDev AR/EN
  'تطوير ألعاب', 'تطوير العاب', 'صناعة ألعاب', 'صناعة العاب', 'برمجة ألعاب', 'برمجة العاب', 'تصميم ألعاب', 'تصميم العاب', 'مطور ألعاب', 'مطور العاب', 'مطور ألعاب عربي', 'game development', 'game developer', 'game design', 'game programming', 'indie game dev', 'indie developer', 'indie game', 'لعبة مستقلة', 'مطور مستقل', 'game jam', 'هاكاثون ألعاب',
  // Programming AR/EN
  'برمجة', 'تعلم برمجة', 'دورة برمجة', 'برمجة بالعربي', 'C#', 'C++', 'Python', 'JavaScript', 'GDScript', 'برمجة C#', 'برمجة سي شارب', 'programming', 'coding', 'learn programming', 'programming tutorial', 'learn coding', 'كود', 'coding عربي',
  // 3D/Art AR/EN
  'نمذجة ثلاثية الأبعاد', '3D modeling', '3D design', 'تصميم ثلاثي الأبعاد', '3D artist', 'فنان رقمي', 'digital art', 'فن رقمي', 'game art', 'game assets', 'أصول ألعاب', 'pixel art', 'ريسورس ألعاب', 'game resources', 'مصادر ألعاب',
  // Community AR/EN
  'مجتمع', 'مجتمعات', 'منتدى', 'منتديات', 'نقاش', 'نقاشات', 'مشاركة', 'تواصل', 'شبكة اجتماعية', 'social network', 'community platform', 'forum', 'discussion', 'منصة مجتمع', 'منصة مجتمعات', 'مجتمع مطورين', 'مجتمع جيمرز', 'مجتمع عربي', 'مجتمع تقني',
  // Tech AR/EN
  'تقنية', 'تكنولوجيا', 'tech', 'technology', 'أخبار تقنية', 'tech news', 'تقنية ألعاب', 'gaming tech', 'VR', 'AR', 'الواقع الافتراضي', 'الواقع المعزز', 'virtual reality', 'augmented reality', 'AI', 'ذكاء اصطناعي', 'artificial intelligence',
  // Learning AR/EN
  'تعلم', 'دورة', 'دروس', 'شروحات', 'تعليم', 'tutorial', 'course', 'learn', 'learning', 'شرح', 'شروحات عربية', 'تعلم بالعربي', 'دورة مجانية', 'free course', 'تعلم مجاني', 'أكاديمية', 'academy',
  // Countries/Regions (Arabic gaming audience)
  'ألعاب السعودية', 'ألعاب مصر', 'ألعاب العراق', 'ألعاب الإمارات', 'ألعاب الكويت', 'ألعاب الأردن', 'ألعاب المغرب', 'ألعاب تونس', 'ألعاب الجزائر', 'ألعاب لبنان', 'ألعاب فلسطين', 'ألعاب سوريا', 'ألعاب اليمن', 'ألعاب عمان', 'ألعاب البحرين', 'ألعاب قطر', 'ألعاب السودان', 'ألعاب ليبيا', 'ألعاب عربية',
  // Specific popular terms
  'فالورانت', 'Valorant', 'ماينكرافت', 'Minecraft', 'فورتنایت', 'Fortnite', 'PUBG', 'ببجي', 'GTA', 'جي تي أي', 'Roblox', 'روبلوكس', 'League of Legends', 'ليق أوف ليجندز', 'FIFA', 'فيفا', 'Call of Duty', 'كول أوف ديوتي', 'Apex Legends', 'أبيكس ليجندز', 'Genshin Impact', 'جينشين إمباكت',
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
          { '@type': 'SiteNavigationElement', name: 'المنتدى', url: `${SITE_URL}/NewPage` },
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
