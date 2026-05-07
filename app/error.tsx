'use client';

import { useEffect } from 'react';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#1e1e20] text-[#e0e0e0] flex flex-col items-center justify-center gap-6 p-8" style={{ direction: 'rtl' }}>
      <h1 className="text-4xl font-bold text-white/20">خطأ</h1>
      <p className="text-lg text-white/60">حدث خطأ غير متوقع</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors">
        إعادة المحاولة
      </button>
    </div>
  );
}
