import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الرئيسية',
  description: 'استكشف المنشورات والمجتمعات والألعاب على NorthFall - منصة المجتمعات العربية',
  alternates: { canonical: 'https://www.northfall.blog/app' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
