import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SITE_URL = 'https://www.northfall.blog';

interface PostData {
  title: string;
  body?: string;
  authorName?: string;
  authorPhoto?: string;
  community?: string;
  votes?: number;
  commentCount?: number;
  imageUrl?: string;
  createdAt?: string;
  flair?: string;
}

async function getPost(postId: string): Promise<PostData | null> {
  try {
    const snap = await getDoc(doc(db, 'threads', postId));
    if (!snap.exists()) return null;
    return snap.data() as PostData;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: 'منشور غير موجود', description: 'هذا المنشور غير موجود أو تم حذفه' };
  }

  const desc = post.body ? post.body.slice(0, 160) : post.title;
  const postUrl = `${SITE_URL}/post/${id}`;

  return {
    title: post.title,
    description: desc,
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: desc,
      url: postUrl,
      type: 'article',
      publishedTime: post.createdAt,
      authors: [post.authorName || 'مستخدم NorthFall'],
      images: post.imageUrl ? [{ url: post.imageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: post.imageUrl ? 'summary_large_image' : 'summary',
      title: post.title,
      description: desc,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  const postUrl = `${SITE_URL}/post/${id}`;

  const jsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.body?.slice(0, 200) || post.title,
    url: postUrl,
    datePublished: post.createdAt,
    author: {
      '@type': 'Person',
      name: post.authorName || 'مستخدم NorthFall',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NorthFall',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/images/logo.png` },
    },
    ...(post.imageUrl ? { image: post.imageUrl } : {}),
    ...(post.community ? {
      about: {
        '@type': 'Thing',
        name: post.community,
      },
    } : {}),
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: post.votes || 0 },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: post.commentCount || 0 },
    ],
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  } : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
      ...(post?.community ? [{ '@type': 'ListItem', position: 2, name: `n/${post.community}`, item: `${SITE_URL}/app?community=${post.community}` }] : []),
      { '@type': 'ListItem', position: post?.community ? 3 : 2, name: post?.title || 'منشور', item: postUrl },
    ],
  };

  return (
    <article className="min-h-screen bg-[#1e1e20] text-[#e0e0e0]" style={{ direction: 'rtl' }}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Redirect to app */}
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        {post ? (
          <div className="w-full max-w-2xl">
            <div className="bg-[#242426] border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 text-sm text-white/40">
                  {post.community && <span className="font-bold text-white/60">n/{post.community}</span>}
                  {post.community && <span>·</span>}
                  <span>{post.authorName || 'مستخدم'}</span>
                  <span>·</span>
                  <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('ar-SA') : ''}</span>
                </div>
                <h1 className="text-xl font-bold text-white mt-2 leading-relaxed">{post.title}</h1>
              </div>

              {/* Body */}
              {post.body && (
                <div className="px-5 py-4 text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                  {post.body}
                </div>
              )}

              {/* Image */}
              {post.imageUrl && (
                <div className="border-t border-white/[0.04]">
                  <img src={post.imageUrl} alt={post.title} className="w-full max-h-[500px] object-cover" />
                </div>
              )}

              {/* Stats */}
              <div className="px-5 py-3 flex items-center gap-4 text-sm text-white/40 border-t border-white/[0.04]">
                <span>👍 {post.votes || 0}</span>
                <span>💬 {post.commentCount || 0} تعليق</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 text-center">
              <a
                href={`/app?view=post&postId=${id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
              >
                افتح في NorthFall ←
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-bold text-white/60">المنشور غير موجود</p>
            <a href="/app" className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors">
              العودة للرئيسية ←
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
