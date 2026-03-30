/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1DB954',
          dark: '#1aa34a',
          light: '#1ed760',
        },
        accent: {
          DEFAULT: '#a855f7',
          dark: '#9333ea',
          light: '#c084fc',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        pop: ['Bangers', 'cursive'],
      },
    },
  },
  plugins: [],
}
