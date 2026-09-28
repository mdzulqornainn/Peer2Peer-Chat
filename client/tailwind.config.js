/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Nilai warna ada di app/globals.css (:root)
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        primary: {
          DEFAULT: token('primary'),
          dark: token('primary-dark'),
        },
        accent: token('accent'),
        soft: token('soft'),
        ink: token('ink'),
        'on-primary': token('on-primary'),
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
