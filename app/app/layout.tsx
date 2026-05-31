import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME, APP_DESCRIPTION } from '@/lib/site-seo';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: APP_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['NorthFall', 'Arabic community', 'Arabic social network', 'Arabic forum', 'largest Arabic platform', 'Arabic posts', 'Arabic discussions', 'gaming community Arabic'],
  alternates: { canonical: `${SITE_URL}/app` },
  openGraph: {
    title: SITE_NAME,
    description: APP_DESCRIPTION,
    url: `${SITE_URL}/app`,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/app/#webpage`,
        name: SITE_NAME,
        description: APP_DESCRIPTION,
        url: `${SITE_URL}/app`,
        isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'المنشورات', item: `${SITE_URL}/app` },
          ],
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
