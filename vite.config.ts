import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        // 'autoUpdate' reloads the page by itself the moment a new build is detected. That is
        // acceptable on the marketing site and actively harmful in the CRM: a counsellor
        // halfway through typing a call note would lose it without warning, and during a run of
        // redeploys the page reloads over and over.
        registerType: 'prompt',
        includeAssets: ['robots.txt'],
        workbox: {
          // The admin app and everything the server owns must never be served from the cache.
          // A cached index.html points at asset filenames that a later build has removed, which
          // is a blank screen with no obvious cause.
          navigateFallbackDenylist: [
            /^\/admin/, /^\/api/, /^\/auth/, /^\/oauth2/, /^\/login/,
            // The masterclass landing pages are plain files in public/, not React routes.
            // Without these, a returning visitor with the service worker already installed
            // gets the cached SPA shell instead of the landing page - and the ad links point
            // at the extensionless path, which the precache does not match.
            /^\/dien/, /^\/dima/, /^\/englishlandingpage/, /^\/marathilandingpage/, /^\/masterclass-assets/,
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
        manifest: {
          name: 'Devansh Edutech Platform',
          short_name: 'Devansh Edutech',
          description: 'Educational platform online',
          theme_color: '#ffffff',
          icons: []
        }
      }),
      viteCompression({ 
        algorithm: 'gzip',
        ext: '.gz',
      }),
      viteCompression({ 
        algorithm: 'brotliCompress',
        ext: '.br',
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'framer-motion'],
            charts: ['recharts']
          }
        }
      }
    },
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true
        },
        '/auth': {
          target: 'http://localhost:8080',
          changeOrigin: true
        }
      }
    },
  };
});
