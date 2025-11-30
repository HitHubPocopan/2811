import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF6F0',
          100: '#FDE8DC',
          200: '#FBD1B8',
          300: '#F8B395',
          400: '#F59671',
          500: '#F07E1A',
          600: '#D96A0F',
          700: '#B8540C',
          800: '#8C4009',
          900: '#602D06',
        },
      },
    },
  },
  plugins: [],
};

export default config;
