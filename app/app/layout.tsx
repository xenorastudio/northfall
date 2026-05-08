import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الرئيسية — استكشف المنشورات والمجتمعات',
  description: 'شوف شنو ينناقش الناس في مجتمعات Unity و Unreal و Godot و Blender. شارك برأيك، انشر مشروعك، أو تعلم شي جديد.',
  keywords: ['NorthFall', 'منشورات', 'مجتمعات', 'ألعاب', 'Unity', 'Unreal', 'Godot', 'Blender', 'نقاشات', 'تطوير ألعاب', 'مطورين عرب', 'GameDev', 'استكشف', 'منصة مجتمعات', 'أخبار الألعاب', 'مشاريع'],
  alternates: { canonical: 'https://www.northfall.blog/app' },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
