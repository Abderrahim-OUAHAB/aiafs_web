/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "aiafs-bg": "#050816",
        "aiafs-panel": "#0f172a",
        "aiafs-accent": "#38bdf8",
        "aiafs-danger": "#ef4444",
        "aiafs-warning": "#f97316",
        "aiafs-safe": "#22c55e",
      },
    },
  },
  plugins: [],
};

