import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0) for local network access
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/proxy-media': {
        target: 'https://aurumfx-images.sgp1.digitaloceanspaces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-media/, ''),
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
})
