---
layout: false
---

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const status = ref('正在加载...')

function goBack() {
  const exit = () => { window.location.href = '/demo/' }
  if (document.fullscreenElement) {
    document.exitFullscreen().then(exit, exit)
  } else {
    exit()
  }
}

onMounted(async () => {
  if (import.meta.env.SSR) return

  // 进入全屏 — SPA 导航保留用户手势，requestFullscreen 可靠生效
  try {
    await document.documentElement.requestFullscreen()
  } catch {}

  const { initScreenShot, unmountScreenShot } = await import('../../src/index.ts')

  const container = document.getElementById('ss-demo-container')
  if (!container) {
    status.value = '容器未找到'
    return
  }

  unmountScreenShot()

  try {
    // 直接传原始图片 URL，库内部自动缩放至容器尺寸
    status.value = '✅ 就绪 — 在图片上拖拽框选区域'

    initScreenShot(container, {
      imageUrl: '/demo-image.jpg',
      toolbarPosition: 'bottom',
      successHandler: (base64: string) => {
        console.log('📸 截图成功，base64 长度:', base64.length)
        status.value = '截图成功！正在下载...'

        const a = document.createElement('a')
        a.href = base64
        a.download = 'screenshot-' + Date.now() + '.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        setTimeout(() => { status.value = '截图完成，可重新框选区域' }, 3000)
      },
      exitHandler: () => {
        console.log('❌ 用户取消了截图')
        status.value = '已取消截图，可重新框选区域'
      }
    })

    console.log('✅ 截图演示已就绪')

    setTimeout(() => { status.value = '' }, 5000)
  } catch {
    status.value = '图片加载失败'
  }
})
</script>

<style>
.demo-back-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 10000;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #3451b2;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: opacity 0.2s;
}
.demo-back-btn:hover { opacity: 0.9; }

.demo-status {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  pointer-events: none;
}

.demo-stage {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
  color-scheme: light;
}

img {
  max-width: auto;
}
</style>

<span class="demo-back-btn" @click="goBack">返回文档</span>
<div v-if="status" class="demo-status">{{ status }}</div>
<div class="demo-stage" id="ss-demo-container"></div>
