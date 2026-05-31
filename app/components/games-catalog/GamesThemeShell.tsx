/** يتبع ثيم الموقع عبر html.light / html.dark ومتغيرات CSS */
export default function GamesThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="games-catalog-theme min-h-screen bg-nf-body text-nf-text isolate">
      {children}
    </div>
  );
}
