import type { Metadata } from 'next';
import AuthProvider from "../components/AuthProvider";

const SITE_URL = 'https://www.northfall.blog';

export const metadata: Metadata = {
  title: 'NorthFall',
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
      <div className="sr-only">
        <h1>منتدى NorthFall — منشورات ونقاشات ومجتمعات عربية في مختلف المجالات</h1>
        <p>شارك المحتوى، افتح نقاشات جديدة، تفاعل مع المجتمع، واكتشف مواضيع ومجتمعات ينشر فيها المستخدمون محتوى جديد كل يوم حول اهتمامات مختلفة ومتنوعة.</p>
      </div>
      <AuthProvider>
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--bg-body)", direction: "rtl" }}>
          <div className="text-center px-6 max-w-md">
            <div className="text-[13px] font-bold text-nf-accent tracking-widest uppercase mb-4 opacity-70">
              قريباً
            </div>
            <h1 className="text-[32px] font-black text-nf-text mb-3 leading-tight">
              المنتدى
            </h1>
            <p className="text-[14px] text-nf-muted leading-relaxed mb-8">
              بنبني منتدى جديد للنقاش والمواضيع والمجتمعات. ترقبنا قريبا على NorthFall.
            </p>
            <a
              href="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors"
              style={{ background: "var(--accent)", color: "var(--bg-body)" }}
            >
              ← العودة للرئيسية
            </a>
          </div>
        </div>
      </AuthProvider>
    </>
  );
}
