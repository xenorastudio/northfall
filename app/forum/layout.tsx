import type { Metadata } from 'next';

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'المنتدى — نقاشات الألعاب والتقنية',
  description: 'تبغى تسأل عن شي يخص الألعاب أو البرمجة أو التصميم؟ هذا مكانك. نتناقش عن Unity و Unreal و Godot و Blender وكل شي يخص مطورين الألعاب العرب.',
  keywords: ['منتدى', 'منتدى ألعاب', 'نقاشات ألعاب', 'نقاشات تقنية', 'منتدى مطورين', 'منتدى GameDev', 'سؤال وجواب', 'Q&A', 'forum', 'game forum', 'gaming forum arabic', 'منتدى Unity', 'منتدى Unreal', 'منتدى Godot', 'منتدى Blender', 'منتدى عربي', 'مجتمع مطورين عرب', 'تطوير ألعاب', 'برمجة', 'تصميم ألعاب', 'ألعاب فيديو', 'GameDev عربي'],
  alternates: { canonical: `${SITE_URL}/forum` },
  openGraph: {
    title: 'المنتدى — نقاشات الألعاب والتقنية — NorthFall',
    description: 'منتدى NorthFall للنقاشات حول الألعاب والتقنية — اسأل أي سؤال عن تطوير الألعاب والبرمجة والتصميم',
    url: `${SITE_URL}/forum`,
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
          { '@type': 'ListItem', position: 2, name: 'المنتدى', item: `${SITE_URL}/forum` },
        ],
      },
      {
        '@type': 'QAPage',
        name: 'منتدى NorthFall',
        description: 'منتدى للنقاشات حول الألعاب والتقنية وتطوير الألعاب',
        url: `${SITE_URL}/forum`,
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
