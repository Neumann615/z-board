# 安装

## 包管理器安装

```bash
npm install z-board
```

```bash
yarn add z-board
```

```bash
pnpm add z-board
```

## 引入方式

### 方式一：ES Module（推荐）

TypeScript / ES Module 项目中使用：

```typescript
import { initWhiteBoard, initScreenShot } from 'z-board'
import 'z-board/style.css'

// 使用白板
const whiteBoard = initWhiteBoard(container, { /* options */ })

// 使用截图
const screenShot = initScreenShot(container, { /* options */ })
```

### 方式二：CommonJS

Node.js 或传统 CommonJS 项目：

```javascript
const { initWhiteBoard, initScreenShot } = require('z-board')
require('z-board/style.css')
```

### 方式三：浏览器直接引入

通过 CDN 直接引入 UMD 格式和样式：

```html
<script src="https://unpkg.com/z-board/lib/z-board.umd.cjs"></script>
<link rel="stylesheet" href="https://unpkg.com/z-board/lib/style.css">

<script>
  ZBoard.initWhiteBoard(document.getElementById('app'), {})
</script>
```

## 打包产物说明

安装后，`node_modules/z-board/lib/` 目录包含以下文件：

| 文件 | 说明 |
|------|------|
| `z-board.es.js` | ES Module 格式 |
| `z-board.cjs.js` | CommonJS 格式 |
| `z-board.umd.cjs` | UMD 格式（浏览器直接引入） |
| `index.d.ts` | TypeScript 类型声明 |
| `style.css` | 样式文件（必须导入） |

## 构建工具配置

### Vite

无需额外配置，Vite 原生支持 ES Module 和 CSS 导入。

### Webpack

确保添加 CSS loader 支持：

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
}
```

## 注意事项

- **必须导入 CSS**：无论使用哪种引入方式，必须导入 `z-board/style.css`，否则界面将无法正常显示
- **容器元素必须有尺寸**：传入的容器元素需要有明确的宽高，组件会自动适配容器大小
- **同一容器不要重复挂载**：在同一个容器上重复调用 `init` 会自动卸载之前的实例，但仍建议显式调用 `unmount()`
