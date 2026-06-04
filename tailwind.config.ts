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
      },
      fontFamily: {
        geist: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 191, 255, 0.15)",
        "glow-cyan-strong": "0 0 20px rgba(0, 191, 255, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
