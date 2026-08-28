import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Cesium static assets (Workers, Assets, Widgets, ThirdParty) are copied into
// public/cesium/ and served at /cesium. CESIUM_BASE_URL points there.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium'),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
