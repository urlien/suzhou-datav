import { defineConfig } from 'vite'
import { amapPlugin } from './server/amap'

export default defineConfig({
  plugins: [amapPlugin()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          echarts: ['echarts'],
          'pdf-vendor': ['jspdf', 'html2canvas']
        }
      }
    }
  }
})
