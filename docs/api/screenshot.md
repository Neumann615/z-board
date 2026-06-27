# initScreenShot

初始化截图功能，对指定图片进行区域截取和标注。

## 函数签名

```typescript
function initScreenShot(
  container: HTMLElement,
  options: ScreenShotOptions
): void
```

## 参数

### container

- **类型**: `HTMLElement`
- **必需**: 是

截图挂载的目标 DOM 元素。容器的宽高决定了截图操作区域的大小。

### options

- **类型**: `ScreenShotOptions`
- **必需**: 是

截图配置项。

```typescript
interface ScreenShotOptions {
  /** 要截图的图片地址（必需） */
  imageUrl: string

  /** 截图成功回调，返回 base64 格式的截图结果 */
  successHandler?: (base64: string) => void

  /** 退出截图回调 */
  exitHandler?: () => void

  /** 工具栏位置，默认为 'left' */
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right'
}
```

| 属性 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `imageUrl` | `string` | 是 | - | 要截图的图片地址 |
| `successHandler` | `(base64: string) => void` | 否 | - | 截图完成回调，参数为 base64 编码的图片 |
| `exitHandler` | `() => void` | 否 | - | 点击退出按钮时的回调 |
| `toolbarPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | 否 | `'left'` | 工具栏相对于截图选区的位置 |

### toolbarPosition 说明

工具栏会根据选区位置和容器边界智能调整：

- `left` — 优先显示在选区左侧，空间不足时移到右侧
- `right` — 优先显示在选区右侧，空间不足时移到左侧
- `top` — 优先显示在选区上方，空间不足时移到下方
- `bottom` — 优先显示在选区下方，空间不足时移到上方

## 截图工具

框选区域后出现工具栏，提供以下标注工具：

| 工具 | 说明 |
|------|------|
| ✏️ 画笔 | 在截图上自由绘制 |
| ⬜ 图形 | 在截图上绘制矩形等图形 |
| 🔤 文本 | 在截图上添加文字标注 |
| ⏪ 撤销 | 撤销上一步标注 |
| ✅ 确认 | 完成截图，触发 `successHandler` |
| ❌ 退出 | 取消截图，触发 `exitHandler` |

## 交互流程

1. 页面显示目标图片
2. 鼠标拖拽框选截图区域（支持移动和拉伸选区）
3. 工具栏自动出现在选区附近
4. 可选：在选区内进行标注（画笔/图形/文字）
5. 点击 ✅ 确认完成截图，或双击选区快速确认
6. 点击 ❌ 退出，或右键选区取消选择

## 使用示例

```typescript
import { initScreenShot } from 'z-board'
import 'z-board/style.css'

const container = document.getElementById('app')

initScreenShot(container, {
  imageUrl: 'your-image.png',
  toolbarPosition: 'bottom',
  successHandler: (base64) => {
    console.log('截图成功，base64 长度:', base64.length)
    // 可以将 base64 上传到服务器
    // 或者显示在页面中
    const img = document.createElement('img')
    img.src = base64
    document.body.appendChild(img)
  },
  exitHandler: () => {
    console.log('用户取消了截图')
  }
})
```

## 卸载

```typescript
import { unmountScreenShot } from 'z-board'

unmountScreenShot()
```

调用 `unmountScreenShot()` 会：
- 清空容器内的所有 DOM
- 重置截图数据和画布历史
- 清除事件绑定
- 移除残留的 tooltip 和 popover 元素
