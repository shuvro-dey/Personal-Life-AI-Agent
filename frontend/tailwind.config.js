/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f3fa",
          100: "#e0e7f5",
          700: "#22386e",
          800: "#18274e",
          900: "#111c3a", // Primary Deep Navy
          950: "#0a0f1d",
        },
        indigo: {
          50: "#eef0fd",
          100: "#e0e4fb",
          500: "#635bee", // Accent Electric Indigo
          600: "#5249e0",
          700: "#4338ca",
        },
        cyan: {
          50: "#e9f9ff", // Secondary Soft Cyan
          100: "#d5f3ff",
          500: "#00a3c4",
          600: "#0891b2",
        },
        brand: {
          50: "#eef0fd",
          100: "#e0e4fb",
          500: "#635bee", // Electric Indigo primary brand
          600: "#5249e0",
          700: "#111c3a", // Deep Navy
        },
        surface: {
          light: "#ffffff",
          dark: "#111827",
        },
        page: {
          light: "#f5f7fb", // Soft neutral white
          dark: "#0b0f19",
        },
        edge: {
          light: "#e5e9f2",
          dark: "#1f293d",
        },
        status: {
          success: "#059669",
          warning: "#d97706",
          danger: "#dc2626",
          info: "#0284c7",
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "-apple-system", "sans-serif"],
        bangla: ["'Hind Siliguri'", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        "card-sm": "12px",
        "card-lg": "22px",
        element: "8px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(17, 28, 58, 0.04), 0 1px 2px 0 rgba(17, 28, 58, 0.02)",
        card: "0 4px 20px -2px rgba(17, 28, 58, 0.05), 0 2px 6px -1px rgba(17, 28, 58, 0.03)",
        "card-hover": "0 12px 28px -4px rgba(17, 28, 58, 0.08), 0 4px 12px -2px rgba(17, 28, 58, 0.04)",
        indigo: "0 8px 24px -4px rgba(99, 91, 238, 0.25)",
      }
    },
  },
  plugins: [],
};
