/**
 * 独立 demo 页面的 Vite 构建配置。
 * vitepress build 之后运行，合并到同一 dist 目录。
 */
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcPath = path.resolve(__dirname, '../../src')
const playDir = path.resolve(__dirname, '../play')

export default defineConfig({
  root: path.resolve(__dirname, '..'),
  resolve: {
    alias: [
      { find: '/src/', replacement: srcPath + '/' },
    ],
  },
  build: {
    outDir: '.vitepress/dist',
    emptyOutDir: false,
    assetsDir: 'play-assets',
    rollupOptions: {
      input: {
        'play/whiteboard': path.resolve(playDir, 'whiteboard.html'),
        'play/screenshot': path.resolve(playDir, 'screenshot.html'),
      },
    },
  },
})
