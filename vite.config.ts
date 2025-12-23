import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose the API_KEY from the server environment to the client code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  server: {
    host: '0.0.0.0', // Essential for Cloud Run container networking
    port: 8080,      // Default fallback, overridden by CLI --port $PORT
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true
  }
});