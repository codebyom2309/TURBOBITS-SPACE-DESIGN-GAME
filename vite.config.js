import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'web',
  publicDir: false,
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});

