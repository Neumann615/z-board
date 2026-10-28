# 📝 Z-Board

一个基于原生 Canvas 的网页画板与图片截图标注工具库，支持画笔、图形、文本、橡皮擦、撤销/重做、翻页、图层调整和图片导出。

## 特性

- 🎨 白板绘制：自由曲线、箭头、矩形、三角形、圆形、菱形、文本和图片
- 📸 截图标注：框选区域、画笔/图形/文字标注、导出 Base64 PNG
- 🧩 可集成：提供挂载、卸载和历史数据同步 API
- 🖱️ 鼠标与触摸事件支持
- 🧵 ES Module / CommonJS 引入

> 截图模块当前指“图片区域截图与标注”，不是操作系统屏幕捕获。

## 安装

```bash
npm install z-board
```

## 快速开始

```typescript
import { initWhiteBoard } from 'z-board'
import 'z-board/style.css'

const whiteBoard = initWhiteBoard(document.getElementById('app')!, {
  addCanvasHistoryHandler: (data) => {
    console.log('canvas history:', data)
  }
})

// 卸载当前实例
// whiteBoard.unmount()
```

截图标注：

```typescript
import { initScreenShot } from 'z-board'
import 'z-board/style.css'

const screenshot = initScreenShot(document.getElementById('app')!, {
  imageUrl: '/demo-image.jpg',
  toolbarPosition: 'bottom',
  successHandler: (base64) => {
    const a = document.createElement('a')
    a.href = base64
    a.download = 'z-board-screenshot.png'
    a.click()
  }
})

// screenshot.unmount()
```

跨域图片必须允许 CORS，否则 Canvas 会被污染，无法导出图片数据。

## API

### `initWhiteBoard(container, options?)`

返回：

```typescript
interface WhiteBoardInstance {
  unmount(): void
}
```

`WhiteBoardOptions`：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `addCanvasHistoryHandler?` | `(data: CanvasHistorySnapshot) => void` | 白板操作历史变化回调 |
| `uploadFileHandler?` | `(file: File) => Promise<string[]>` | 打开文件时返回一组图片 URL |
| `uploadImageHandler?` | `(file: File) => Promise<string>` | 插入图片时返回图片 URL |

### `initScreenShot(container, options)`

返回：

```typescript
interface ScreenShotInstance {
  unmount(): void
}
```

`ScreenShotOptions`：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `imageUrl` | `string` | 必填，目标图片地址 |
| `successHandler?` | `(base64: string) => void` | 确认截图后回调 |
| `exitHandler?` | `() => void` | 退出截图回调 |
| `toolbarPosition?` | `'top' \| 'right' \| 'bottom' \| 'left'` | 工具栏优先方向，默认 `left` |

### 外部同步历史

```typescript
import { updateCanvasHistory } from 'z-board'

updateCanvasHistory({
  canvasHistory,
  nowPageIndex: 0,
  allPageNumber: 3
})
```

注意：不要在 `addCanvasHistoryHandler` 回调里同步调用 `updateCanvasHistory`，否则可能造成循环更新。

## 本地开发

```bash
npm run dev          # 根级白板/截图 Demo
npm run docs:dev     # VitePress 文档站点
npm run typecheck    # TypeScript strict 检查
npm test             # 运行 Vitest 单元测试
npm run test:watch   # watch 模式运行测试
npm run test:coverage # 运行测试并生成覆盖率报告
npm run build        # 构建库产物
npm run build:demo   # 构建文档站点
```

根级 Demo 默认展示白板，顶部可切换到截图 Demo。

正式单元测试位于 `tests/*.test.ts`，覆盖 Canvas 历史解析和平滑曲线路径。CI 会在 Node.js 22 下执行类型检查、单元测试、构建和生产依赖审计。

## 协议

MIT
