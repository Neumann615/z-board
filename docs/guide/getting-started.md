# 快速开始

Z-Board 是一个轻量级的网页画板与截图工具库，提供**白板绘制**和**屏幕截图**两大核心功能。

## 是什么？

Z-Board 让你可以在网页中快速集成：

- **白板**：支持画笔、图形、文字、图片、橡皮擦等工具的画板组件，带完整的撤销/重做和图层管理
- **截图**：对指定图片进行区域截取，并支持在截图上添加标注（画笔、图形、文字）

## 30 秒体验

```typescript
import { initWhiteBoard, initScreenShot } from 'z-board'
import 'z-board/style.css'

// 初始化白板
const whiteBoard = initWhiteBoard(document.getElementById('app'), {
  addCanvasHistoryHandler: (data) => {
    console.log('画板数据:', data)
  }
})

// 或者初始化截图
const screenShot = initScreenShot(document.getElementById('app'), {
  imageUrl: 'your-image.png',
  successHandler: (base64) => {
    console.log('截图成功:', base64)
  }
})
```

就是这么简单！一行代码即可挂载，一个 `unmount()` 即可卸载。

## 功能一览

### 🎨 白板工具

| 工具 | 说明 |
|------|------|
| ✏️ 画笔 | 自由绘制曲线/箭头 |
| 🔤 文本 | 添加可编辑文本框 |
| 🧹 橡皮擦 | 擦除画布内容 |
| 👆 指针 | 选择、移动、拉伸元素 |
| ⬆️ 置顶 / ⬇️ 置底 | 调整元素层级 |
| 💾 导出 | 将画板保存为图片 |
| ⏪ 撤销 / ⏩ 重做 | 操作历史回溯 |
| 📄 翻页 | 多画板页面管理 |

### 📸 截图工具

| 工具 | 说明 |
|------|------|
| ✏️ 画笔 | 在截图上自由绘制 |
| 🔤 文本 | 在截图上添加文字 |
| ⬜ 图形 | 在截图上绘制矩形等图形 |
| ✅ 确认 | 完成截图并导出 |
| ❌ 退出 | 取消截图操作 |

## 下一步

- 查看 [安装指南](/guide/installation) 了解不同引入方式
- 浏览 [API 参考](/api/) 获取完整接口文档
- 体验 [交互演示](/demo/) 了解实际效果
