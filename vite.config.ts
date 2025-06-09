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
    vue(),
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
              },
              backgroundSync: {
                name: 'api-queue',
                options: {
                  maxRetentionTime: 24 * 60 * 60
                }
              },
              matchOptions: {
                ignoreSearch: true
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        sourcemap: false
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
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only split out very large dependencies
          if (id.includes('node_modules/lodash')) {
            return 'lodash';
          }
          // Bundle everything else together
          return 'app';
        },
        // CSS code splitting
        assetFileNames: (assetInfo: PreRenderedAsset) => {
          const info = assetInfo.name
          if (info && info.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          if (info && /\.(png|jpe?g|gif|svg|webp|avif)$/.test(info)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (info && /\.(woff2?|eot|ttf|otf)$/.test(info)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production for security
    sourcemap: mode !== 'production',
    // Modern browser target
    target: 'es2015',
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        passes: 3,
        dead_code: true,
        unsafe: false,
        unsafe_math: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
        unused: true,
        toplevel: true,
        keep_fnames: true,
        keep_classnames: true
      },
      mangle: {
        toplevel: true,
        safari10: true,
        properties: {
          regex: /^_/,
          reserved: ['__proto__', 'constructor', 'prototype']
        }
      },
      format: {
        comments: false
      }
    },
    // Performance hints
    reportCompressedSize: true,
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: mode === 'production',
    // Build optimization
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps) => {
        // Preload all dependencies
        return deps;
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    },
    // Faster HMR
    hmr: {
      overlay: false
    },
    // Watch options for better performance
    watch: {
      usePolling: false,
      interval: 100,
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash']
  },
  esbuild: {
    target: 'esnext',
    // Tree shaking
    treeShaking: true,
    // Legal comments
    legalComments: 'none'
  },
  experimental: {
    renderBuiltUrl(filename, { hostType, hostId }) {
      return filename
    }
  }
}))
