# initWhiteBoard

初始化白板功能，在指定容器内挂载完整的白板编辑器。

## 函数签名

```typescript
function initWhiteBoard(
  container: HTMLElement,
  options?: WhiteBoardOptions
): void
```

## 参数

### container

- **类型**: `HTMLElement`
- **必需**: 是

白板挂载的目标 DOM 元素。容器的宽高决定了画布的分辨率，窗口 resize 时画布会自动适配。

### options

- **类型**: `WhiteBoardOptions`
- **必需**: 否

白板配置项，所有属性均为可选。

```typescript
interface WhiteBoardOptions {
  /** 画布历史变化回调 */
  addCanvasHistoryHandler?: (data: {
    canvasHistory: CanvasPage[]
    nowPageIndex: number
    allPageNumber: number
  }) => void

  /** 自定义文件上传处理（打开文件功能） */
  uploadFileHandler?: (file: File) => Promise<string[]>

  /** 自定义图片上传处理（插入图片功能） */
  uploadImageHandler?: (file: File) => Promise<string>
}
```

## 白板工具

挂载后白板顶部工具栏提供以下工具：

| 工具 | 功能 | 快捷键 |
|------|------|--------|
| 👆 指针 | 选择/移动/拉伸画布元素 | - |
| ✏️ 画笔 | 自由曲线或箭头绘制 | - |
| ⬜ 图形 | 矩形/三角形/圆形/菱形 | - |
| 🔤 文本 | 添加可编辑文本框 | - |
| ⏪ 撤销 | 回退到上一步 | `←` 方向键 |
| ⏩ 重做 | 前进到下一步 | `→` 方向键 |
| 🧹 橡皮擦 | 擦除画布元素 | - |
| 📄 添页 | 添加新画板页面 | - |
| 🗑️ 删页 | 删除当前页面 | - |
| 🔄 重置 | 清空当前页面 | - |
| 💾 导出 | 导出画板为 PNG 图片 | - |
| 📂 打开 | 打开文件填充画板 | - |
| ◀ ▶ | 翻页 | `↑` / `↓` 方向键 |

选中元素后，会出现浮动工具栏支持**置顶**和**置底**操作。选中元素后按 `Backspace` 键可删除。

## 使用示例

```typescript
import { initWhiteBoard } from 'z-board'
import 'z-board/style.css'

const container = document.getElementById('app')

initWhiteBoard(container, {
  addCanvasHistoryHandler: (data) => {
    console.log('画板数据变化:', data)
  },
  uploadImageHandler: async (file) => {
    // 自定义图片上传逻辑
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const { url } = await res.json()
    return url
  }
})
```

## 卸载

```typescript
import { unmountWhiteBoard } from 'z-board'

// 卸载白板，清理 DOM 和事件绑定
unmountWhiteBoard()
```

调用 `unmountWhiteBoard()` 会：
- 清空容器内的所有 DOM
- 重置画布历史数据
- 清除事件绑定
- 移除残留的 tooltip 和 popover 元素
