import { defineConfig } from 'vitepress'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import type { Plugin } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcPath = path.resolve(__dirname, '../../src')
const playDir = path.resolve(__dirname, '../play')

/** Vite 插件：dev 模式下拦截 /play/ 请求，绕过 VitePress 直接返回独立 HTML */
function playPagesPlugin(): Plugin {
  return {
    name: 'z-board-play-pages',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/play/') || !url.endsWith('.html')) return next()
        const filePath = path.resolve(playDir, path.basename(url))
        if (!fs.existsSync(filePath)) return next()
        try {
          const raw = fs.readFileSync(filePath, 'utf-8')
          const html = await server.transformIndexHtml(url, raw)
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  title: 'Z-Board',
  description: '轻量级网页画板与截图工具库',
  lang: 'zh-CN',

  srcExclude: ['**/play/**'],

  vite: {
    resolve: {
      alias: [
        { find: '/src/', replacement: srcPath + '/' },
      ],
    },
    plugins: [playPagesPlugin()],
  },

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '演示', link: '/demo/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '总览', link: '/api/' },
            { text: 'initWhiteBoard', link: '/api/whiteboard' },
            { text: 'initScreenShot', link: '/api/screenshot' },
            { text: '类型定义', link: '/api/types' },
          ],
        },
      ],
      '/demo/': [
        {
          text: '交互演示',
          items: [
            { text: '总览', link: '/demo/' },
            { text: '白板演示', link: '/play/whiteboard.html' },
            { text: '截图演示', link: '/play/screenshot.html' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2023-2026 Z-Board',
    },

    search: { provider: 'local' },
  },

  ignoreDeadLinks: [/\/play\//],
})
