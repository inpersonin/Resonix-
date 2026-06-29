import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Resonix-/',
  server: {
    port: 5173,
    proxy: {
      '/recommend': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
