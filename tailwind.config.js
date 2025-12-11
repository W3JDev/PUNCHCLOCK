/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neo-black': '#000000',
        'neo-white': '#FFFFFF',
        'neo-gray': '#808080',
        'neo-red': '#FF0000',
        'neo-blue': '#0000FF',
        'neo-green': '#00FF00',
        'neo-yellow': '#FFFF00',
        'neo-purple': '#800080',
        'neo-pink': '#FFC0CB',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'neo-hover': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        'neo-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
