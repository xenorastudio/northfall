import type { Metadata } from "next";
import GamesProviders from "../components/games-catalog/GamesProviders";
import GamesThemeShell from "../components/games-catalog/GamesThemeShell";

export const metadata: Metadata = {
  title: "NorthFall Games",
  description: "اكتشف الألعاب — كتالوج NorthFall.",
};

export default function GamesCatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <GamesProviders>
      <GamesThemeShell>{children}</GamesThemeShell>
    </GamesProviders>
  );
}
