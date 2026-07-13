import { defineConfig } from 'vitepress'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcPath = path.resolve(__dirname, '../../src')

export default defineConfig({
  title: 'Z-Board',
  description: '轻量级网页画板与截图工具库',
  lang: 'zh-CN',

  vite: {
    resolve: {
      alias: [
        { find: '/src/', replacement: srcPath + '/' },
      ],
    },
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
            { text: '白板演示', link: '/demo/whiteboard' },
            { text: '截图演示', link: '/demo/screenshot' },
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
})
