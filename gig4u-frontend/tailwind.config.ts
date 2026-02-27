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
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#e8edf3",
          100: "#c5d0e0",
          200: "#9fb2cc",
          300: "#7893b7",
          400: "#5b7ca7",
          500: "#3e6597",
          600: "#365b8a",
          700: "#2c4e78",
          800: "#234167",
          900: "#1E3A5F",
          950: "#0f1f33",
        },
        accent: {
          50: "#e8f1fa",
          100: "#c7dcf2",
          200: "#a2c5e9",
          300: "#7cade0",
          400: "#5f9bda",
          500: "#2E75B6",
          600: "#2969a5",
          700: "#225a90",
          800: "#1c4c7c",
          900: "#12345a",
        },
        success: {
          50: "#e6f5ec",
          500: "#1A6B3A",
          700: "#145530",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
