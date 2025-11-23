/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        muted: {
          DEFAULT: "#3f3f46",
          foreground: "#a1a1aa",
        },
        border: "#27272a",
      },
    },
  },
  plugins: [],
};

