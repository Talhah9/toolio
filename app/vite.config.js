import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['framer-motion'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-framer':   ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-markdown': ['react-markdown'],
          'vendor-pdf':      ['jspdf'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
