import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الرئيسية — استكشف المنشورات والمجتمعات',
  description: 'استكشف المنشورات والمجتمعات والألعاب على NorthFall — منصة المجتمعات العربية الأولى للألعاب والتقنية. انضم لمجتمعات Unity و Unreal Engine و Godot و Blender. شارك في النقاشات، اكتشف الألعاب، انشر مشاريعك، وتابع أحدث أخبار تطوير الألعاب بالعربي.',
  keywords: ['NorthFall', 'منشورات', 'مجتمعات', 'ألعاب', 'Unity', 'Unreal', 'Godot', 'Blender', 'نقاشات', 'تطوير ألعاب', 'مطورين عرب', 'GameDev', 'استكشف', 'منصة مجتمعات', 'أخبار الألعاب', 'مشاريع'],
  alternates: { canonical: 'https://www.northfall.blog/app' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
