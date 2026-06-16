import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { mapAssetsPlugin } from './vite.mapAssets'

export default defineConfig({
  publicDir: '../spines',
  plugins: [
    react(),
    mapAssetsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg'],
      manifest: {
        name: '开箱修仙',
        short_name: '开箱修仙',
        description: '2D 放置类仙侠 RPG',
        theme_color: '#1a2f3a',
        background_color: '#0d1b22',
        icons: [
          {
            src: '/logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
