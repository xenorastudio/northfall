import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NorthFall",
  description: "اكتشف ألعاب ومشاريع المطورين العرب على NorthFall — قسم الإطلاقات.",
};

export default function LaunchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
