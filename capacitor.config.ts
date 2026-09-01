import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the same Vite/React web app in a native shell. The web build
 * still deploys to GitHub Pages unchanged (base `/IronRock/`); the native app
 * loads a root-based build of `dist` (see the `build:app` script), served from
 * the app's own origin, so absolute `/assets/…` paths resolve.
 */
const config: CapacitorConfig = {
  appId: 'com.rockyr0ads.ironrock',
  appName: 'IronRock',
  webDir: 'dist',
  android: {
    // keep the WebView background matching the app so there's no white flash
    backgroundColor: '#0E0F12',
  },
};

export default config;
