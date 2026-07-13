# 类型定义

Z-Board 提供完整的 TypeScript 类型定义，所有类型都可以从包中直接导入。

## 配置类型

### WhiteBoardOptions

```typescript
interface WhiteBoardOptions {
  addCanvasHistoryHandler?: (data: {
    canvasHistory: CanvasPage[]
    nowPageIndex: number
    allPageNumber: number
  }) => void
  uploadFileHandler?: (file: File) => Promise<string[]>
  uploadImageHandler?: (file: File) => Promise<string>
}
```

### ScreenShotOptions

```typescript
interface ScreenShotOptions {
  imageUrl: string
  successHandler?: (base64: string) => void
  exitHandler?: () => void
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right'
}
```

## 画布数据类型

### CanvasHistoryItem

```typescript
interface CanvasHistoryItem {
  /** 操作步骤编号 */
  step: number
  /** 画布数据列表 */
  canvasData: CanvasDataItem[]
}
```

### CanvasDataItem

```typescript
interface CanvasDataItem {
  /** 绘制类型: 0-曲线 1-箭头 2-矩形 3-三角形 4-圆形 5-菱形 6-文字 7-图片 */
  drawType: number
  /** 文字内容（drawType=6 时有效） */
  text?: string
  /** 是否选中 */
  isSelected: number
  /** 样式信息 */
  style: {
    fontSize?: number
    left: number
    top: number
    color?: string
    lineWidth?: number
    lineType?: number
    shapeType?: number
    url?: string
    width?: number
    height?: number
  }
}
```

### CanvasPage

```typescript
interface CanvasPage {
  /** 当前页的操作历史列表 */
  canvasData: CanvasHistoryItem[]
  /** 当前操作步骤索引 */
  step: number
}
```

## 几何类型

### Point

```typescript
interface Point {
  x: number
  y: number
}
```

### RectArea

```typescript
interface RectArea {
  x: number
  y: number
  width: number
  height: number
}
```

## 工具配置类型

### WriteOptions

画笔工具配置：

```typescript
interface WriteOptions {
  /** 线条类型: 0-曲线 1-箭头 */
  lineType: number
  /** 线条粗细 */
  lineWidth: number
  /** 线条颜色 */
  color: string
}
```

### DrawOptions

图形绘制配置：

```typescript
interface DrawOptions {
  /** 图形类型: 0-矩形 1-三角形 2-圆形 3-菱形 */
  shapeType: number
  /** 线条粗细 */
  lineWidth: number
  /** 线条颜色 */
  color: string
}
```

### TextOptions

文本工具配置：

```typescript
interface TextOptions {
  /** 字体大小（px） */
  fontSize: number
  /** 完整字体样式字符串 */
  font: string
  /** 文字颜色 */
  color: string
}
```

## 数据集类型

### WhiteBoardDataSet

```typescript
interface WhiteBoardDataSet {
  /** 调色板颜色列表 */
  colorList: string[]
  addCanvasHistoryHandler: ((data: unknown) => void) | null
  uploadFileHandler: ((file: File) => void) | null
  uploadImageHandler: ((file: File) => void) | null
}
```

### ScreenShotDataSet

```typescript
interface ScreenShotDataSet {
  /** 调色板颜色列表 */
  colorList: string[]
  /** 目标图片 URL */
  imageUrl: string
  successHandler: ((data: unknown) => void) | null
  exitHandler: (() => void) | null
  /** 工具栏位置 */
  toolbarPosition: 'top' | 'bottom' | 'left' | 'right'
}
```

## drawType 枚举值

| 值 | 类型 | 说明 |
|----|------|------|
| `0` | 曲线 | 自由画笔绘制（贝塞尔曲线平滑） |
| `1` | 箭头 | 带箭头指示的直线 |
| `2` | 矩形 | 矩形框 |
| `3` | 三角形 | 三角形 |
| `4` | 圆形 | 圆形/椭圆 |
| `5` | 菱形 | 菱形 |
| `6` | 文字 | 可编辑文本框 |
| `7` | 图片 | 插入的图片 |
