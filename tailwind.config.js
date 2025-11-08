/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['dark', 'dracula', 'night', 'coffee', 'business', 'synthwave', 'halloween', 'forest'],
    darkTheme: 'dark',
  },
}
