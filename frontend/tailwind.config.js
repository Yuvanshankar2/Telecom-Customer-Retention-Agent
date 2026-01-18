/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#007ab8",
        "background-light": "#f9fafb",
        "background-dark": "#0f172a",
        "risk-low": "#38A169",
        "risk-medium": "#F59E0B",
        "risk-high": "#EF4444",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px",
      },
    },
  },
  plugins: [],
};
