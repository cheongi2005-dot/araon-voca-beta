/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fraunces', 'Wanted Sans', 'sans-serif'],
      },
      colors: {
        primary: "#2A61FF"
      }
    },
  },
  plugins: [],
}

