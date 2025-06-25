import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [
    electron([
      {
        // Main process entry file
        entry: 'src/main/index.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron', 'net']
            }
          }
        }
      },
      {
        // Preload file
        entry: 'src/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html')
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ''
      }
    }
  }
})
