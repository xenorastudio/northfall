import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المنتدى',
  description: 'منتدى NorthFall للنقاشات والمحادثات حول الألعاب والتقنية - شارك رأيك وتفاعل مع المجتمع',
  alternates: { canonical: 'https://northfall.blog/NewPage' },
};

export default function ForumsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
