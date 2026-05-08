import type { Metadata } from 'next';

const SITE_URL = 'https://northfall.blog';

export const metadata: Metadata = {
  title: 'المنتدى',
  description: 'منتدى NorthFall للنقاشات والمحادثات حول الألعاب والتقنية - شارك رأيك وتفاعل مع المجتمع العربي في تطوير الألعاب والتصميم',
  alternates: { canonical: `${SITE_URL}/NewPage` },
  openGraph: {
    title: 'المنتدى — NorthFall',
    description: 'منتدى NorthFall للنقاشات والمحادثات حول الألعاب والتقنية',
    url: `${SITE_URL}/NewPage`,
    type: 'website',
  },
};

export default function ForumsLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'المنتدى', item: `${SITE_URL}/NewPage` },
        ],
      },
      {
        '@type': 'QAPage',
        name: 'منتدى NorthFall',
        description: 'منتدى للنقاشات حول الألعاب والتقنية وتطوير الألعاب',
        url: `${SITE_URL}/NewPage`,
        mainEntity: {
          '@type': 'Question',
          name: 'نقاشات الألعاب والتقنية على NorthFall',
          text: 'اسأل أي سؤال عن تطوير الألعاب والتقنية في مجتمعات NorthFall العربية',
          answerCount: 1000,
          isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
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
