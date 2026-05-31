import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    extend: {
      colors: {
        nf: {
          body: 'var(--bg-body)',
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          nav: 'var(--bg-nav)',
          card: 'var(--bg-card)',
          hover: 'var(--bg-hover)',
          input: 'var(--bg-input)',
          border: 'var(--border-primary)',
          'border-2': 'var(--border-secondary)',
          'border-subtle': 'var(--border-subtle)',
          text: 'var(--text-primary)',
          'text-2': 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          dim: 'var(--text-dim)',
          accent: 'var(--accent)',
        },
      },
      fontFamily: {
        'noto-kufi': ['var(--font-noto-kufi)', 'system-ui', 'sans-serif'],
        cairo: ['var(--font-noto-kufi)', 'system-ui', 'sans-serif'],
        roboto: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
        en: ['var(--font-en)', 'var(--font-roboto)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-roboto)', 'system-ui', 'sans-serif'], // alias for backward compat
        sans: ['var(--font-noto-kufi)', 'var(--font-en)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
