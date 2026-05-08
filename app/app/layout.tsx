import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'الرئيسية — استكشف المنشورات والمجتمعات',
  description: 'شوف شنو ينناقش الناس في مجتمعات Unity و Unreal و Godot و Blender. شارك برأيك، انشر مشروعك، أو تعلم شي جديد.',
  keywords: ['NorthFall', 'منشورات', 'مجتمعات', 'ألعاب', 'Unity', 'Unreal', 'Godot', 'Blender', 'نقاشات', 'تطوير ألعاب', 'مطورين عرب', 'GameDev', 'استكشف', 'منصة مجتمعات', 'أخبار الألعاب', 'مشاريع'],
  alternates: { canonical: `${SITE_URL}/app` },
  openGraph: {
    title: 'NorthFall — استكشف المنشورات والمجتمعات',
    description: 'شوف شنو ينناقش الناس في مجتمعات Unity و Unreal و Godot و Blender.',
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
        <h1>NorthFall — مجتمعات تطوير الألعاب بالعربي</h1>
        <p>استكشف المنشورات والمجتمعات على NorthFall. مجتمعات متخصصة لـ Unity و Unreal Engine و Godot و Blender.</p>
        <h2>المجتمعات</h2>
        <nav aria-label="روابط سريعة">
          <Link href="/guides">أدلة مجانية</Link>
          <Link href="/community/Unity">مجتمع Unity</Link>
          <Link href="/community/Unreal">مجتمع Unreal</Link>
          <Link href="/community/Godot">مجتمع Godot</Link>
          <Link href="/community/Blender">مجتمع Blender</Link>
          <Link href="/NewPage">المنتدى</Link>
        </nav>
      </div>
      {children}
    </>
  );
}
