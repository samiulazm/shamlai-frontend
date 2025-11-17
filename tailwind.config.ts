import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: 'var(--theme-primary)',
          emerald: '#10B981',
          coral: '#F87171',
          gray: '#F3F4F6',
        },
      },
    },
  },
  plugins: [],
};
export default config;
