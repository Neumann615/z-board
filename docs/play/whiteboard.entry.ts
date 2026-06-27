import { initWhiteBoard } from '../../src/index.ts'

// ====== 返回按钮 ======
document.getElementById('play-back-btn')?.addEventListener('click', () => {
  window.location.href = '/demo/'
})

// ====== 初始化白板 ======
const container = document.getElementById('wb-demo-container')
if (container) {
  initWhiteBoard(container, {
    addCanvasHistoryHandler: (data: any) => {
      console.log('📋 画板数据变化:', data)
    }
  })
  console.log('✅ 白板演示已就绪')
}
