import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Base path for GitHub Pages deployment
  base: '/Spotify-Webapp-Visualizer/',
  
  // Development server config
  server: {
    port: 3000,
    host: '127.0.0.1',
    open: true
  },
  
  // Build output to 'dist' folder (gh-pages will deploy this)
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  // Environment variable prefix (VITE_ instead of REACT_APP_)
  envPrefix: 'VITE_'
});
