import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.RESUMEFIT_API_TARGET || 'http://127.0.0.1:8000'
const unavailableMessage = 'ResumeFit API is unavailable. In backend/, run .\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000.'

const backendProxy = () => ({
  target: apiTarget,
  changeOrigin: true,
  configure(proxy) {
    proxy.on('error', (error, _request, response) => {
      console.error(`Backend proxy error (${apiTarget}): ${error.message}`)
      if (!response || response.headersSent) return
      response.writeHead(503, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({
        error: { code: 'BACKEND_UNAVAILABLE', message: unavailableMessage },
      }))
    })
  },
})

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backendProxy(),
      '/health': backendProxy(),
    },
  },
})
