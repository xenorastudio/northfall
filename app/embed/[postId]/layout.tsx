export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#181818', fontFamily: 'Cairo, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
