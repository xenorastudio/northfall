import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'الرئيسية — استكشف المنشورات والمجتمعات',
  description: 'اكتشف المجتمعات والمنشورات الأكثر تفاعلًا على NorthFall. شوف شو الناس تناقش كل يوم، شارك رأيك، انشر محتوى جديد، وتفاعل مع مجتمع عربي مفتوح للنقاشات والمنشورات في مختلف المجالات. من الأسئلة السريعة إلى النقاشات الطويلة والمحتوى اللي يصنعه المستخدمون، دائمًا فيه شيء جديد تكتشفه.',
  keywords: ['NorthFall', 'نورث فول', 'منشورات', 'مجتمعات', 'ألعاب', 'نقاشات', 'تطوير ألعاب', 'مطورين عرب', 'GameDev', 'استكشف', 'منصة مجتمعات', 'أخبار الألعاب', 'مشاريع', 'مجتمع عربي', 'منتدى عربي', 'منصة عربية', 'رياضة', 'فن', 'تصميم', 'برمجة', 'تعليم'],
  alternates: { canonical: `${SITE_URL}/app` },
  openGraph: {
    title: 'NorthFall — مجتمعك العربي',
    description: 'اكتشف المجتمعات والمنشورات الأكثر تفاعلًا على NorthFall. شوف شو الناس تناقش كل يوم، شارك رأيك، انشر محتوى جديد، وتفاعل مع مجتمع عربي مفتوح للنقاشات والمنشورات.',
    url: `${SITE_URL}/app`,
    type: 'website',
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/app/#webpage`,
        name: 'الرئيسية — NorthFall',
        description: 'استكشف المنشورات والمجتمعات على NorthFall',
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
      {/* SSR content for SEO — hidden visually but visible to crawlers */}
      <div className="sr-only">
        <h1>NorthFall — مجتمع عربي للمنشورات والنقاشات والمجتمعات</h1>
        <p>مكان يشارك فيه الناس أفكارهم واهتماماتهم من خلال منشورات وتعليقات ونقاشات يومية في مختلف المجالات. الألعاب والبرمجة هم الأكثر نشاطًا، ومعهم مجتمعات كثيرة ومحتوى جديد ينزل باستمرار من المستخدمين.</p>
        <h2>المجتمعات</h2>
        <nav aria-label="روابط سريعة">
          <Link href="/forum">المنتدى</Link>
        </nav>
      </div>
      {children}
    </>
  );
}
