'use client';

import { useEffect } from 'react';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-nf-body text-nf-text-2 flex flex-col items-center justify-center gap-6 p-8" style={{ direction: 'rtl' }}>
      <h1 className="text-4xl font-bold text-nf-dim/20">خطأ</h1>
      <p className="text-lg text-nf-muted">حدث خطأ غير متوقع</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-nf-text text-nf-body rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
        إعادة المحاولة
      </button>
    </div>
  );
}
