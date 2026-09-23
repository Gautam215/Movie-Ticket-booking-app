import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const previewApiTarget = process.env.VITE_API_PROXY ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['eventraclient-production.up.railway.app'],
    proxy: {
      '/api': { target: previewApiTarget, changeOrigin: true },
    },
  },
});
