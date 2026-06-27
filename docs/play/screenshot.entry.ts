import { initScreenShot, unmountScreenShot } from '../../src/index.ts'

// ====== 返回按钮 ======
document.getElementById('play-back-btn')?.addEventListener('click', () => {
  window.location.href = '/demo/'
})

// ====== DOM 引用 ======
const statusEl = document.getElementById('play-status')
function updateStatus(msg: string) {
  if (msg) {
    if (statusEl) { statusEl.textContent = msg; statusEl.style.display = '' }
  } else {
    if (statusEl) statusEl.style.display = 'none'
  }
}

// ====== 初始化 ======
function init() {
  const container = document.getElementById('ss-demo-container')
  if (!container) {
    updateStatus('容器未找到')
    return
  }

  unmountScreenShot()

  updateStatus('✅ 就绪 — 在图片上拖拽框选区域')

  initScreenShot(container, {
    // 直接传原始图片，内部自动缩放至容器尺寸
    imageUrl: '/demo-image.jpg',
    toolbarPosition: 'bottom',
    successHandler: (base64: string) => {
      console.log('📸 截图成功')
      updateStatus('截图成功！正在下载...')
      const a = document.createElement('a')
      a.href = base64
      a.download = 'screenshot-' + Date.now() + '.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => updateStatus('截图完成，可重新框选区域'), 3000)
    },
    exitHandler: () => {
      console.log('❌ 用户取消了截图')
      updateStatus('已取消截图，可重新框选区域')
    }
  })

  console.log('✅ 截图演示已就绪')
  setTimeout(() => updateStatus(''), 5000)
}

init()
