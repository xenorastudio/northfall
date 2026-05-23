"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SITE_URL = 'https://www.northfall.blog';

export default function CommunityPage({ params }: { params: Promise<{ name: string }> }) {
  const [name, setName] = useState<string>("");
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ name: n }) => {
      setName(n);
      async function load() {
        try {
          const snap = await getDoc(doc(db, "communities", n));
          if (snap.exists()) {
            const data = snap.data();
            setMeta({
              title: `مجتمع ${n}`,
              description: data.shortDesc || `مجتمع n/${n}`,
              img: data.img || "",
              h1: `n/${n}`,
              body: data.desc || "",
            });
          } else {
            setMeta(null);
          }
        } catch {
          setMeta(null);
        }
        setLoading(false);
      }
      load();
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-nf-body flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-nf-accent/30 border-t-nf-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nf-body text-nf-text-2" style={{ direction: 'rtl' }}>
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <div className="w-full max-w-2xl text-center">
          {meta ? (
            <div className="mb-6">
              {meta.img && (
                <img src={meta.img} alt={`${name} logo`} className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover" width={80} height={80} />
              )}
              <h1 className="text-3xl font-bold text-nf-text mb-2">{meta.h1 || name}</h1>
              <p className="text-sm text-nf-muted mt-2 leading-relaxed">{meta.description}</p>
            </div>
          ) : (
            <div className="mb-6">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 bg-nf-secondary flex items-center justify-center text-nf-accent font-bold text-xl">n/</div>
              <h1 className="text-3xl font-bold text-nf-text mb-2">n/{name}</h1>
            </div>
          )}

          <a
            href={`/app?community=${name}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-nf-text text-nf-body rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            افتح المجتمع في NorthFall ←
          </a>

          {meta?.body && (
            <section className="mt-10 text-right text-nf-dim text-xs leading-relaxed space-y-3" aria-label="عن المجتمع">
              <p>{meta.body}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
