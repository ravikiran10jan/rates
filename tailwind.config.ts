import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        desk: {
          bg: '#0b1020',
          panel: '#111833',
          border: '#1f2a52',
          text: '#d8e0ff',
          mute: '#8ea0d8',
          accent: '#5eead4',
          warn: '#f59e0b',
          danger: '#ef4444',
          buy: '#10b981',
          sell: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
