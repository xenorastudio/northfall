import type { Metadata } from 'next';
import './globals.css';
import { Cairo, Inter } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700', '800', '900'] });

const SITE_URL = 'https://northfall.blog';
const SITE_NAME = 'NorthFall';
const SITE_DESCRIPTION = 'منصة المجتمعات العربية الأولى للألعاب والتقنية - انضم لمجتمعات Unity و Unreal و Godot و Blender، شارك في النقاشات، اكتشف الألعاب، وتابع أحدث الأخبار';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — منصة المجتمعات العربية`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['NorthFall', 'مجتمعات عربية', 'ألعاب', 'Unity', 'Unreal', 'Godot', 'Blender', 'GameDev', 'تقنية', 'مجتمع', 'منشورات', 'نقاشات'],
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
    title: `${SITE_NAME} — منصة المجتمعات العربية`,
    description: SITE_DESCRIPTION,
    images: [{ url: `${SITE_URL}/assets/images/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — منصة المجتمعات العربية`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/assets/images/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
        description: SITE_DESCRIPTION,
        inLanguage: 'ar',
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
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'المجتمع', item: `${SITE_URL}/app` },
          { '@type': 'ListItem', position: 3, name: 'الألعاب', item: `${SITE_URL}/app?view=games` },
          { '@type': 'ListItem', position: 4, name: 'المنتدى', item: `${SITE_URL}/NewPage` },
        ],
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/assets/images/logo.png`,
        },
        sameAs: [],
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: 'NorthFall — منصة المجتمعات العربية',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'ar',
        potentialAction: {
          '@type': 'ReadAction',
          target: SITE_URL,
        },
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e1e20" />
      </head>
      <body className={`${cairo.variable} ${inter.variable} font-cairo min-h-screen w-full bg-[#1e1e20] text-[#e0e0e0] antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
