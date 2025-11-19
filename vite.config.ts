import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for ComfyUI web directory compatibility
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});