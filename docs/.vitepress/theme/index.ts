import DefaultTheme from 'vitepress/theme'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof document === 'undefined') return

    // 拦截到 /play/ 的链接点击，强制整页导航（绕过 SPA router）
    document.addEventListener('click', (e) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor?.href) return
      const url = new URL(anchor.href, location.origin)
      if (url.origin !== location.origin) return
      if (!url.pathname.startsWith('/play/')) return

      e.preventDefault()
      e.stopPropagation()
      window.location.href = anchor.href
    }, { capture: true })
  },
}
