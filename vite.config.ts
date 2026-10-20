import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the client calls /api/... on its own address and Vite forwards it to the
// local API, so no CORS setup is needed. On Render, VITE_API_URL points at the API instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.API_PROXY ?? 'http://localhost:5178',
    },
  },
})
