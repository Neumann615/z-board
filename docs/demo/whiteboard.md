---
layout: false
---

<script setup lang="ts">
import { onMounted } from 'vue'

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

  const { initWhiteBoard } = await import('../../src/index.ts')
  const container = document.getElementById('wb-demo-container')
  if (container) {
    initWhiteBoard(container, {
      addCanvasHistoryHandler: (data: any) => {
        console.log('📋 画板数据变化:', data)
      }
    })
    console.log('✅ 白板演示已就绪')
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

.demo-stage {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
  color-scheme: light;
}
</style>

<span class="demo-back-btn" @click="goBack">返回文档</span>
<div class="demo-stage" id="wb-demo-container"></div>
