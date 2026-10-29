import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts:["techaraujo.onrender.com"],
    host: '0.0.0.0',
    port: 10000,
    proxy: {
      '/techaraujo/backend': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
