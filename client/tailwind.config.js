/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#FBF6F8',
        surface: '#FFFFFF',
        ink: '#241A20',
        accent: {
          DEFAULT: '#E91E8C',
          hover: '#F5399B',
          dim: '#F9C7E0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      transitionDuration: {
        DEFAULT: '175ms',
      },
    },
  },
  plugins: [],
};
