import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: 'techaraujo.onrender.com',
    port: 5173,
    proxy: {
      '/techaraujo/backend': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
