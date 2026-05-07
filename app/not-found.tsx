import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة',
  description: 'عذراً، الصفحة التي تبحث عنها غير موجودة على NorthFall',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1e1e20] text-[#e0e0e0] flex flex-col items-center justify-center gap-6 p-8" style={{ direction: 'rtl' }}>
      <h1 className="text-6xl font-bold text-white/20">404</h1>
      <p className="text-lg text-white/60">الصفحة غير موجودة</p>
      <Link href="/" className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors">
        العودة للرئيسية
      </Link>
    </div>
  );
}
