import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cyan-primary": "#00BFFF",
        "blue-secondary": "#3B82F6",
        bg: '#0a0b0f',
        surface: '#111318',
        'surface-2': '#161920',
        border: '#1e2130',
      },
      fontFamily: {
        geist: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"SF Mono"', '"Fira Code"', '"Fira Mono"', '"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 191, 255, 0.15)",
        "glow-cyan-strong": "0 0 20px rgba(0, 191, 255, 0.4)",
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 8px rgba(0,191,255,0.3)' },
          '50%': { opacity: '1', boxShadow: '0 0 20px rgba(0,191,255,0.6)' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
