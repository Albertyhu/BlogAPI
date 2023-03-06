/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
      extend: {
          screens: {
              'xm': { 'min': '360px' },
              'sm': { 'min': '640px' },
              'md': { 'min': '768px' },
              'lg': { 'min': '1024px' },
              'xl': { 'min': '1280px' },
              '2xl': { 'min': '1536px' }
          }
      },
  },
  plugins: [],
}
