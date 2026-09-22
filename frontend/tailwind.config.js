/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Cinzel', '"Plus Jakarta Sans"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        tn: {
          cream: "#FAF9F5",
          surface: "#F5F2EA",
          "surface-subtle": "#EFECE6",
          terracotta: "#9E3A26",
          "terracotta-dark": "#7F2A19",
          "terracotta-light": "#FBF2EF",
          "earth-green": "#2D5A3D",
          "earth-green-dark": "#1F432B",
          "earth-green-light": "#F0F6F2",
          gold: "#B58D3D",
          "gold-dark": "#996B1E",
          "gold-light": "#FDF8EE",
          charcoal: "#1F2421",
          "text-muted": "#5E6460",
          "text-subtle": "#858B87",
          border: "#E2DDD5",
          "border-subtle": "#ECE7DF",
          blue: "#1e3a8a",
          slate: "#0f172a",
          green: "#065f46",
        }
      }
    },
  },
  plugins: [],
}

