import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      colors: {
        cream: {
          50:  '#FDFCFB',
          100: '#F8F5F2',
          200: '#EDE8E3',
          300: '#DDD5CC',
        },
        sage: {
          50:  '#EEF3EF',
          100: '#D4E3D6',
          200: '#B3CEB6',
          300: '#8FAF8C',
          400: '#6A9370',
          500: '#3F5E4A',
          600: '#334D3D',
          700: '#273C30',
        },
        warm: {
          50:  '#FAF4EF',
          100: '#F0DDD0',
          200: '#DEB99A',
          300: '#C9956E',
          400: '#B38B6D',
          500: '#9A6F53',
          600: '#7D5A42',
        },
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
