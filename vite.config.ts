import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'socket': ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true
  },
  server: {
    headers: {
      'Content-Type': 'application/javascript'
    }
  }
})
