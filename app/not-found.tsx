import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة',
  description: 'عذراً، الصفحة التي تبحث عنها غير موجودة على NorthFall',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-nf-body text-nf-text-2 flex flex-col items-center justify-center gap-6 p-8" style={{ direction: 'rtl' }}>
      <h1 className="text-6xl font-bold text-nf-dim/20">404</h1>
      <p className="text-lg text-nf-muted">الصفحة غير موجودة</p>
      <Link href="/" className="px-6 py-3 bg-nf-text text-nf-body rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
        العودة للرئيسية
      </Link>
    </div>
  );
}
