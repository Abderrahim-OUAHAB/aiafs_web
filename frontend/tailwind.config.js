/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "aiafs-bg": "#f8fafc",
        "aiafs-panel": "#ffffff",
        "aiafs-accent": "#2563eb",
        "aiafs-danger": "#dc2626",
        "aiafs-warning": "#f59e0b",
        "aiafs-safe": "#16a34a",
        "aiafs-sidebar": "#1e293b",
        "aiafs-hero": "#0f172a",
      },
    },
  },
  plugins: [],
};

