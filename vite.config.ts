/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { profilesMiddleware } from './scripts/profilesApi';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

const THEME = '#1f3a5f';

/** Dev-only file API for local profiles. `vite build` and `vite preview` do not include it. */
const profilesApi: Plugin = {
  name: 'tmts-profiles-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(profilesMiddleware());
  },
};

export default defineConfig(({ isPreview }) => ({
  base: './',
  plugins: [
    react(),
    profilesApi,
    // Preview runs plain http on localhost (a secure context): a self-signed cert blocks service worker registration.
    ...(isPreview ? [] : [basicSsl()]),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered by src/app/registerServiceWorker.ts so we can show a banner
      includeAssets: ['icons/apple-touch-icon.png', 'icons/icon.svg'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] },
      manifest: {
        name: 'Train Me To Sing',
        short_name: 'Sing',
        description: 'Learn to sing on pitch with short, guided lessons.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: THEME,
        background_color: THEME,
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['./src/test-setup.ts'],
  },
}));
