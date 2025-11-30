import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#ffffff',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      brand: {
        50: '#fef6f0',
        100: '#fde8dc',
        200: '#fbd1b8',
        300: '#f8b395',
        400: '#f59671',
        500: '#F07E1A',
        600: '#d96a0f',
        700: '#b8540c',
        800: '#8c4009',
        900: '#602d06',
      },
      orange: {
        50: '#fef6f0',
        100: '#fde8dc',
        200: '#fbd1b8',
        300: '#f8b395',
        400: '#f59671',
        500: '#F07E1A',
        600: '#d96a0f',
        700: '#b8540c',
        800: '#8c4009',
        900: '#602d06',
      },
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
      },
      red: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
      },
      blue: {
        100: '#dbeafe',
        800: '#1e40af',
      },
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
      },
    },
  },
  plugins: [],
};

export default config;
