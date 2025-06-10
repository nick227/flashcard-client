import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import type { PreRenderedAsset } from 'rollup'
import { VitePWA } from 'vite-plugin-pwa'
import type { UserConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => ({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-')
        }
      }
    }),
    // Gzip and Brotli compression for production builds
    viteCompression({ 
      algorithm: 'gzip', 
      ext: '.gz', 
      deleteOriginFile: false, 
      threshold: 10240,
      compressionOptions: { level: 9 }
    }),
    viteCompression({ 
      algorithm: 'brotliCompress', 
      ext: '.br', 
      deleteOriginFile: false, 
      threshold: 10240,
      compressionOptions: { level: 11 }
    }),
    // PWA support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'flashcard.svg'],
      manifest: {
        name: 'Flashcard Academy',
        short_name: 'Flashcards',
        description: 'Learn with flashcards',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,eot,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.flashcardacademy\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    // Bundle visualizer (only in development)
    mode === 'development' && visualizer({ 
      open: false, 
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    dedupe: ['vue']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Bundle all Vue-related code together
          if (id.includes('node_modules/vue') || 
              id.includes('node_modules/vue-router') || 
              id.includes('node_modules/pinia') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/@headlessui/vue') || 
              id.includes('node_modules/@heroicons/vue')) {
            return 'vendor';
          }
          // Bundle all other dependencies
          if (id.includes('node_modules')) {
            return 'deps';
          }
          // Bundle all app code together
          return 'app';
        },
        // Add source map comment
        sourcemapExcludeSources: false
      }
    },
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: false, // Keep debugger statements
        pure_funcs: [], // Don't remove any functions
        passes: 2,
        keep_fnames: true,
        keep_classnames: true
      },
      mangle: {
        keep_fnames: true,
        keep_classnames: true
      },
      format: {
        comments: true // Keep comments for debugging
      }
    },
    reportCompressedSize: true,
    cssCodeSplit: true,
    cssMinify: mode === 'production',
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash'],
    exclude: ['@vueuse/core']
  },
  esbuild: {
    target: 'esnext',
    treeShaking: true,
    legalComments: 'none'
  }
}))
