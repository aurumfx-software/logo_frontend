import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0) for local network access
    port: 5173,
    allowedHosts: ['logo-frontend.onrender.com', '.onrender.com'],
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ['logo-frontend.onrender.com', '.onrender.com'],
  },
})
