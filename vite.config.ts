import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // Copy 404.html to dist after build
        try {
          copyFileSync(
            join(__dirname, 'public', '404.html'),
            join(__dirname, 'dist', '404.html')
          );
        } catch (error) {
          console.warn('Could not copy 404.html:', error);
        }
      },
    },
  ],
  base: '/capsula/',
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  publicDir: 'public',
})



