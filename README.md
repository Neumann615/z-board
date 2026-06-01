# 📋 Z-Board

一个轻量级、零依赖的网页画板与截图工具库，支持白板绘制和屏幕截图两大核心功能。

---

## ✨ 特性

- 🎨 **白板功能** - 支持画笔、文本框、橡皮擦、指针等多种绘图工具
- 📸 **截图功能** - 灵活的屏幕截图能力
- 📦 **零依赖** - 仅依赖原生 JavaScript，无额外捆绑
- 🔰 **易于使用** - 简洁的 API 设计，快速集成
- 🛡️ **类型安全** - 完整的 TypeScript 类型定义
- 🌳 **轻量紧凑** - 打包体积小，性能优异

---

## 📦 安装

```bash
npm install z-board
```

---

## 🚀 快速开始

### 方式一：ES Module（推荐）

```typescript
import { initWhiteBoard, initScreenShot } from 'z-board'
import 'z-board/style.css'

// 初始化白板
const whiteBoard = initWhiteBoard(document.getElementById('app'), {
  addCanvasHistoryHandler: (data) => {
    console.log('画板数据:', data)
  }
})

// 或初始化截图
const screenShot = initScreenShot(document.getElementById('app'), {
  successHandler: (base64) => {
    console.log('截图成功:', base64)
  }
})
```

### 方式二：CommonJS

```javascript
const { initWhiteBoard, initScreenShot } = require('z-board')
require('z-board/style.css')
```

### 方式三：浏览器直接引入

```html
<script src="https://unpkg.com/z-board/lib/z-board.umd.cjs"></script>
<link rel="stylesheet" href="https://unpkg.com/z-board/lib/style.css">

<script>
  ZBoard.initWhiteBoard(document.getElementById('app'), {})
</script>
```

---

## 📖 API 文档

### initWhiteBoard

初始化白板功能。

```typescript
initWhiteBoard(container: HTMLElement, options?: WhiteBoardOptions): WhiteBoardInstance
```

#### WhiteBoardOptions

| 属性 | 类型 | 说明 |
|------|------|------|
| `addCanvasHistoryHandler` | `(data: CanvasHistoryItem) => void` | 画布历史变化回调 |

#### 返回值

返回白板实例，包含 `unmount()` 方法用于卸载。

---

### initScreenShot

初始化截图功能。

```typescript
initScreenShot(container: HTMLElement, options?: ScreenShotOptions): ScreenShotInstance
```

#### ScreenShotOptions

| 属性 | 类型 | 说明 |
|------|------|------|
| `successHandler` | `(base64: string) => void` | 截图成功回调 |
| `exitHandler` | `() => void` | 退出截图回调 |

#### 返回值

返回截图实例，包含 `unmount()` 方法用于卸载。

---

## 🛠️ 白板工具

白板提供以下绘图工具：

| 工具 | 说明 |
|------|------|
| ✏️ **画笔** | 自由绘制线条 |
| 🔤 **文本** | 添加文本框 |
| 🧹 **橡皮擦** | 擦除内容 |
| 👆 **指针** | 选择和移动元素 |
| ⬆️ **置顶** | 将选中元素移到最上层 |
| ⬇️ **置底** | 将选中元素移到最后层 |
| 💾 **导出** | 保存画板为图片 |

---

## 🔧 卸载

```typescript
import { initWhiteBoard, initScreenShot, unmountWhiteBoard, unmountScreenShot } from 'z-board'

// 方式一：通过实例卸载
const instance = initWhiteBoard(container, {})
instance.unmount()

// 方式二：通过函数卸载
unmountWhiteBoard()
unmountScreenShot()
```

---

## 📂 目录结构

```
z-board/
├── lib/                    # 打包产物
│   ├── z-board.es.js      # ES Module 格式
│   ├── z-board.cjs.js     # CommonJS 格式
│   ├── z-board.umd.cjs    # UMD 格式
│   ├── index.d.ts         # 类型声明
│   └── style.css          # 样式文件
├── src/
│   ├── modules/
│   │   ├── common/        # 公共模块
│   │   ├── screenshot/    # 截图功能
│   │   └── whiteboard/     # 白板功能
│   └── index.ts           # 入口文件
└── CHANGELOG.md           # 更新日志
```

---

## 📄 许可证

[MIT License](LICENSE)
