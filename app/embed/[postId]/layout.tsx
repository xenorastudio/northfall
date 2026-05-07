import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'منشور — NorthFall',
  description: 'منشور على منصة NorthFall - منصة المجتمعات العربية للألعاب والتقنية',
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#181818', fontFamily: 'Cairo, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
