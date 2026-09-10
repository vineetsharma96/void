import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./worlds/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#020304",
          900: "#050608",
          850: "#0a0c10",
          800: "#12151c",
          700: "#1e222a",
          600: "#2d333f",
          500: "#485264",
          400: "#7c8ba1",
          300: "#b0bdd0",
          200: "#e2e8f0",
          100: "#f8fafc",
        },
        amber: {
          glow: "#e5a93c",
          dim: "#875f1a",
        },
        ion: {
          cyan: "#c8f0ee",
          white: "#f0fdf4",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "Syne", "sans-serif"],
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.03)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
      animation: {
        "pulse-slow": "pulseSlow 4s ease-in-out infinite",
        "scanline": "scanline 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
