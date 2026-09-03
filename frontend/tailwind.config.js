/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tn: {
          blue: "#1e3a8a",
          gold: "#b45309",
          slate: "#0f172a",
          green: "#065f46",
        }
      }
    },
  },
  plugins: [],
}
