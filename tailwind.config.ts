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
          body: '#1e1e20',
          primary: '#222224',
          secondary: '#2a2a2c',
          nav: '#222224',
          card: '#262628',
          hover: 'rgba(255,255,255,0.06)',
          input: '#2a2a2c',
          border: '#3a3a3c',
          'border-2': '#333335',
          'border-subtle': 'rgba(255,255,255,0.08)',
          text: '#fff',
          'text-2': '#d4d4d4',
          muted: '#878a8c',
          dim: '#6a6d6f',
          accent: '#a0a0a0',
        },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
