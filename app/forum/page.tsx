import type { Metadata } from 'next';
import ForumsPage from "../components/ForumsPage";
import AuthProvider from "../components/AuthProvider";

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'المنتدى — نقاشات ومنشورات ومجتمعات',
  description: 'منتدى NorthFall — مكان للنقاشات والمنشورات والمجتمعات. افتح موضوع، شارك فكرة، اسأل المجتمع، أو تفاعل مع منشورات الناس. الألعاب والبرمجة هم الأكثر نشاطًا، لكن المنتدى مليان مجتمعات ومواضيع متنوعة يشارك فيها الناس يوميًا بالمحتوى والنقاشات والأسئلة. تابع اهتماماتك، اكتشف مجتمعات جديدة، وكن جزءًا من مجتمع عربي نشط ومتفاعل.',
  keywords: ['منتدى عربي', 'نقاشات عربية', 'منتدى ألعاب عربي', 'منتدى تقني عربي', 'منتدى مطورين', 'NorthFall منتدى', 'نورث فول منتدى', 'مجتمع عربي', 'نقاش عربي', 'سؤال وجواب عربي', 'مشاركة محتوى عربي'],
  alternates: { canonical: `${SITE_URL}/forum` },
  openGraph: {
    title: 'المنتدى — NorthFall',
    description: 'مكان للنقاشات والمنشورات والمجتمعات — افتح موضوع، شارك فكرة، أو تفاعل مع الناس',
    url: `${SITE_URL}/forum`,
    type: 'website',
  },
};

export default function ForumsRoute() {
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
        '@type': 'CollectionPage',
        name: 'منتدى NorthFall — مكان للنقاشات والمنشورات والمجتمعات',
        description: 'مكان للنقاشات والمنشورات والمجتمعات — افتح موضوع، شارك فكرة، أو تفاعل مع الناس',
        url: `${SITE_URL}/forum`,
        isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* SSR content for SEO */}
      <div className="sr-only">
        <h1>منتدى NorthFall — منشورات ونقاشات ومجتمعات عربية في مختلف المجالات</h1>
        <p>شارك المحتوى، افتح نقاشات جديدة، تفاعل مع المجتمع، واكتشف مواضيع ومجتمعات ينشر فيها المستخدمون محتوى جديد كل يوم حول اهتمامات مختلفة ومتنوعة.</p>
        <nav aria-label="روابط المجتمعات">
          <a href="/community/Unity">مجتمع Unity</a>
          <a href="/community/Unreal">مجتمع Unreal</a>
          <a href="/community/Godot">مجتمع Godot</a>
          <a href="/community/Blender">مجتمع Blender</a>
        </nav>
      </div>
      <AuthProvider>
        <ForumsPage />
      </AuthProvider>
    </>
  );
}
