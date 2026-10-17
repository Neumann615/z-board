// 基础几何类型
export interface Point {
  x: number
  y: number
}

export interface RectArea {
  x: number
  y: number
  width: number
  height: number
}

export interface RectAreaData {
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
  x4: number
  y4: number
  area: number
  w: number
  h: number
}

// 画布操作数据。canvasData 中的每一项表示一次用户操作。
export interface CanvasContextAttributes {
  lineWidth: number
  strokeStyle: string
  fillStyle?: string
  lineCap?: CanvasLineCap
  lineJoin?: CanvasLineJoin
}

export interface CanvasOperationOptions {
  drawType?: number
  isSelected?: number
  drawData?: any
  ctxAttributes?: CanvasContextAttributes
  text?: string
  style?: {
    fontSize: number
    left: number
    top: number
    color: string
  }
  deleteIndex?: number
  moveIndex?: number
  stretchIndex?: number
  topIndex?: number
  bottomIndex?: number
}

export interface CanvasOperationItem {
  actionType: number
  position: RectAreaData
  options: CanvasOperationOptions
  index: number
  canvasResolution: { w: number; h: number }
}

/** 兼容旧导入名；新代码请使用 CanvasOperationItem。 */
export type CanvasHistoryItem = CanvasOperationItem

export interface CanvasPage {
  canvasData: CanvasOperationItem[]
  step: number
}

export interface CanvasHistorySnapshot {
  canvasHistory: CanvasPage[]
  nowPageIndex: number
  allPageNumber: number
}

// 配置类型
export interface WhiteBoardOptions {
  addCanvasHistoryHandler?: (data: CanvasHistorySnapshot) => void
  uploadFileHandler?: (file: File) => Promise<string[]>
  uploadImageHandler?: (file: File) => Promise<string>
}

export interface WhiteBoardInstance {
  unmount: () => void
}

export interface ScreenShotOptions {
  imageUrl: string
  successHandler?: (data: string) => void
  exitHandler?: () => void
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right'
}

export interface ScreenShotInstance {
  unmount: () => void
}

export interface TextOptions {
  fontSize: number
  font: string
  color: string
}

export interface WriteOptions {
  lineType: number
  lineWidth: number
  color: string
}

export interface DrawOptions {
  shapeType: number
  lineWidth: number
  color: string
}

// 数据集类型
export interface WhiteBoardDataSet {
  colorList: string[]
  addCanvasHistoryHandler: ((data: CanvasHistorySnapshot) => void) | null
  uploadFileHandler: ((file: File) => Promise<string[]>) | null
  uploadImageHandler: ((file: File) => Promise<string>) | null
}

export interface ScreenShotDataSet {
  colorList: string[]
  imageUrl: string
  successHandler: ((data: string) => void) | null
  exitHandler: (() => void) | null
  toolbarPosition: 'top' | 'bottom' | 'left' | 'right'
}
