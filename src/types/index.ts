// 工具类型
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

// 画布数据类型
export interface CanvasDataItem {
  drawType: number
  text?: string
  isSelected: number
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

export interface CanvasHistoryItem {
  step: number
  canvasData: CanvasDataItem[]
}

// 配置类型
export interface WhiteBoardOptions {
  addCanvasHistoryHandler?: (data: unknown) => void
  uploadFileHandler?: (file: File) => void
  uploadImageHandler?: (file: File) => void
}

export interface ScreenShotOptions {
  imageUrl: string
  successHandler?: (data: unknown) => void
  exitHandler?: () => void
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right'
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
  addCanvasHistoryHandler: ((data: unknown) => void) | null
  uploadFileHandler: ((file: File) => void) | null
  uploadImageHandler: ((file: File) => void) | null
}

export interface ScreenShotDataSet {
  colorList: string[]
  imageUrl: string
  successHandler: ((data: unknown) => void) | null
  exitHandler: (() => void) | null
  toolbarPosition: 'top' | 'bottom' | 'left' | 'right'
}