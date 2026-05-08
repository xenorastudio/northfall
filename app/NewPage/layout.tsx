import type { Metadata } from 'next';

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'المنتدى — نقاشات الألعاب والتقنية بالعربي',
  description: 'منتدى NorthFall للنقاشات والمحادثات حول الألعاب والتقنية — اسأل أي سؤال عن Unity و Unreal Engine و Godot و Blender وتطوير الألعاب والبرمجة والتصميم. شارك رأيك، تعلم من الخبراء العرب، وتفاعل مع مجتمع المطورين العربي الأكبر.',
  keywords: ['منتدى', 'منتدى ألعاب', 'نقاشات ألعاب', 'نقاشات تقنية', 'منتدى مطورين', 'منتدى GameDev', 'سؤال وجواب', 'Q&A', 'forum', 'game forum', 'gaming forum arabic', 'منتدى Unity', 'منتدى Unreal', 'منتدى Godot', 'منتدى Blender', 'منتدى عربي', 'مجتمع مطورين عرب', 'تطوير ألعاب', 'برمجة', 'تصميم ألعاب', 'ألعاب فيديو', 'GameDev عربي'],
  alternates: { canonical: `${SITE_URL}/NewPage` },
  openGraph: {
    title: 'المنتدى — نقاشات الألعاب والتقنية — NorthFall',
    description: 'منتدى NorthFall للنقاشات حول الألعاب والتقنية — اسأل أي سؤال عن تطوير الألعاب والبرمجة والتصميم',
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
