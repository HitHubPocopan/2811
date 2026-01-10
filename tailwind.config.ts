import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'media',
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
        500: '#ef7d1a',
        600: '#d46c14',
        700: '#b3590e',
        800: '#8f4608',
        900: '#6b3304',
      },
      orange: {
        50: '#fef6f0',
        100: '#fde8dc',
        200: '#fbd1b8',
        300: '#f8b395',
        400: '#f59671',
        500: '#ef7d1a',
        600: '#d46c14',
        700: '#b3590e',
        800: '#8f4608',
        900: '#6b3304',
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
        900: '#0f172a',
        950: '#020617',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};

export default config;
