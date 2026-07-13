# API 总览

Z-Board 导出以下核心函数，覆盖白板和截图两大模块。

## 白板模块

| 函数 | 说明 |
|------|------|
| `initWhiteBoard(container, options?)` | 初始化白板 |
| `unmountWhiteBoard()` | 卸载白板 |
| `updateCanvasHistory(data)` | 更新画布历史（外部同步） |

## 截图模块

| 函数 | 说明 |
|------|------|
| `initScreenShot(container, options)` | 初始化截图 |
| `unmountScreenShot()` | 卸载截图 |

## 导入示例

```typescript
import {
  initWhiteBoard,
  unmountWhiteBoard,
  initScreenShot,
  unmountScreenShot,
  updateCanvasHistory,
} from 'z-board'
```

## 生命周期

```typescript
// 创建实例
const instance = initWhiteBoard(container, options)

// 方式一：通过实例卸载
instance.unmount()

// 方式二：通过函数卸载
unmountWhiteBoard()
```

两种卸载方式是等价的，建议使用实例方法进行卸载以保证作用域清晰。

## 详细参考

- [initWhiteBoard](/api/whiteboard) — 白板 API 完整文档
- [initScreenShot](/api/screenshot) — 截图 API 完整文档
- [类型定义](/api/types) — TypeScript 类型参考
