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
      '@': path.resolve(__dirname, './src'),
      'vue': path.resolve(__dirname, 'node_modules/vue/dist/vue.esm-bundler.js')
    },
    dedupe: ['vue']
  },
  build: {
    rollupOptions: {
      output: {
        // Single chunk strategy
        manualChunks: undefined,
        // Vercel-specific asset handling
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name;
          if (info && info.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (info && /\.(png|jpe?g|gif|svg|webp|avif)$/.test(info)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (info && /\.(woff2?|eot|ttf|otf)$/.test(info)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Vercel-specific build settings
    chunkSizeWarningLimit: 1000,
    sourcemap: mode !== 'production', // Disable sourcemaps in production for Vercel
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console in production
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        passes: 1,
        keep_fnames: true,
        keep_classnames: true,
        unsafe: false
      },
      mangle: {
        keep_fnames: true,
        keep_classnames: true,
        reserved: [
          '__proto__', 
          'constructor', 
          'prototype', 
          'Ie', 
          'Vue', 
          'vue',
          'Yl',
          'initialize',
          'createApp',
          'defineComponent',
          'ref',
          'computed',
          'watch',
          'onMounted',
          'onUnmounted'
        ]
      },
      format: {
        comments: false // Remove comments in production
      }
    },
    reportCompressedSize: true,
    cssCodeSplit: true, // Enable CSS code splitting for Vercel
    cssMinify: mode === 'production',
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'lodash',
      '@vue/runtime-core',
      '@vue/runtime-dom',
      '@vue/shared'
    ],
    exclude: ['@vueuse/core']
  },
  esbuild: {
    target: 'es2015',
    treeShaking: true,
    legalComments: 'none'
  },
  // Vercel-specific server settings
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    strictPort: true,
    host: true
  }
}))
