/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        // 24 column grid
        '13': 'repeat(13, minmax(0, 1fr))',
        '24': 'repeat(24, minmax(0, 1fr))'
      },
       gridColumn: {
         'span-13': 'span 13 / span 13',
         'span-14': 'span 14 / span 14',
         'span-15': 'span 15 / span 15',
         'span-16': 'span 16 / span 16',
         'span-17': 'span 17 / span 17',
         'span-18': 'span 18 / span 18',
         'span-19': 'span 19 / span 19',
         'span-20': 'span 20 / span 20',
         'span-21': 'span 21 / span 21',
         'span-22': 'span 22 / span 22',
         'span-23': 'span 23 / span 23',
         'span-24': 'span 24 / span 24'
      }
    },
  },
  plugins: [],
}