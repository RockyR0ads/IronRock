/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Served from a project page (https://<user>.github.io/IronRock/) when built,
  // but from the root during local dev/preview-tool runs.
  base: command === 'build' ? '/IronRock/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'IronRock',
        short_name: 'IronRock',
        description: 'RPE Load Sheet — a Push/Pull/Legs training-load calculator.',
        theme_color: '#0E0F12',
        background_color: '#0E0F12',
        display: 'standalone',
        orientation: 'portrait',
        // scope / start_url are derived from `base` by vite-plugin-pwa
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
}));
