import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import type { UserConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === 'development'
  
  return {
    plugins: [
      vue(),
      // Only enable PWA in production
      !isDev && VitePWA({
        manifest: {
          name: 'Flashcard Academy',
          short_name: 'Flashcards',
          description: 'Learn with flashcards',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.flashcardacademy\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'flashcard.svg'],
        devOptions: {
          enabled: false,
          type: 'classic'
        }
      }),
      // Only enable compression in production
      !isDev && viteCompression({ 
        algorithm: 'gzip', 
        ext: '.gz', 
        deleteOriginFile: false, 
        threshold: 10240,
        compressionOptions: { level: 9 }
      }),
      !isDev && viteCompression({ 
        algorithm: 'brotliCompress', 
        ext: '.br', 
        deleteOriginFile: false, 
        threshold: 10240,
        compressionOptions: { level: 11 }
      }),
      // Only enable visualizer in development
      isDev && visualizer({ 
        open: false, 
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'utils-vendor': ['axios', 'lodash']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: isDev,
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: !isDev,
          pure_funcs: !isDev ? ['console.log', 'console.info'] : []
        },
        mangle: {
          keep_fnames: false,
          keep_classnames: false
        },
        format: {
          comments: false
        }
      },
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      reportCompressedSize: false,
      assetsDir: 'assets',
      outDir: 'dist',
      manifest: true
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        'lodash'
      ]
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      },
      hmr: {
        overlay: false
      }
    }
  }
})
