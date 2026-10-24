import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api and /health calls are forwarded to the FastAPI server (no CORS problems).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8000', '/health': 'http://localhost:8000' } },
})
