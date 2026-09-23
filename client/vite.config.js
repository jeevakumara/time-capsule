import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Unit 4: Explicit bundler config — entry point, chunk strategy, source maps
  build: {
    sourcemap: true,
    rollupOptions: {
      input: { main: './index.html' },
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
