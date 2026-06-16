import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // surfaces — deep, near-black base with gently lifted cards
        bg: '#0E0F12',
        surface: '#16181C',
        'surface-2': '#1E2127',
        'surface-3': '#262A31',
        line: '#2A2E35',
        'line-2': '#363B43',
        // text
        ink: '#F2F1EC',
        muted: '#9AA0A8',
        'muted-2': '#646A73',
        // brand accent — energetic "iron" red, used for primary actions
        accent: '#FF5247',
        'accent-deep': '#CA463B',
        // intensity / plate accents
        red: '#FF5247', // heavy compound
        blue: '#4C8DF0', // volume lead
        yellow: '#F0BE4B', // isolation
        green: '#41C277', // light
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.35), 0 4px 16px -8px rgba(0,0,0,0.5)',
        pop: '0 -8px 40px -12px rgba(0,0,0,0.7)',
        glow: '0 6px 24px -10px rgba(255,82,71,0.55)',
      },
    },
  },
  plugins: [],
} satisfies Config;
