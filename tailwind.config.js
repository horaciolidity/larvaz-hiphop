/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: {
          DEFAULT: "#151515",
          elevated: "#202020",
          border: "#2A2A2A",
          hover: "#252525",
        },
        acid: {
          DEFAULT: "#C6FF00",
          hover: "#B2E600",
          dark: "#84A800",
          glow: "rgba(198, 255, 0, 0.2)",
        },
        magenta: {
          DEFAULT: "#FF2D95",
          hover: "#E02080",
          glow: "rgba(255, 45, 149, 0.2)",
        },
        orange: {
          DEFAULT: "#FF5A1F",
          hover: "#E64912",
        },
        cyan: {
          DEFAULT: "#00D9FF",
          hover: "#00BCE0",
        },
        content: {
          primary: "#F5F5F5",
          secondary: "#A3A3A3",
          muted: "#666666",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "Impact", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      boxShadow: {
        'acid-sm': '0 0 10px rgba(198, 255, 0, 0.15)',
        'acid-glow': '0 0 20px rgba(198, 255, 0, 0.35)',
        'magenta-glow': '0 0 20px rgba(255, 45, 149, 0.35)',
      },
    },
  },
  plugins: [],
};
