import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' + HashRouter: works on GitHub Pages under any repo name without hardcoding it
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // public/sw.js reads this list to precache every chunk for offline use
  build: { manifest: 'asset-manifest.json' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
