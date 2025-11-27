import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // We intentionally do NOT inject server API keys into the client bundle.
    // Use server-side env (GEMINI_API_KEY) for backend functions.
    const env = loadEnv(mode, '.', '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Build settings cho production
      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor': ['react', 'react-dom'],
              'pdf': ['pdfjs-dist'],
            }
          }
        }
      }
    };
});