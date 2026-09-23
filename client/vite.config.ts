import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  },
});
