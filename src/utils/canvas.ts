import type { Point } from '../types'

interface StraightLineData {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface CurveLineData {
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
}

interface ImageDrawData {
  x: number
  y: number
  w: number
  h: number
  imageUrl: string
}

interface DiamondData {
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
  x4: number
  y4: number
}

interface RectData {
  x: number
  y: number
  w: number
  h: number
}

interface CircleData {
  x: number
  y: number
  r: number
}

interface TriangleData {
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
}

export function drawStraightLine(ctx: CanvasRenderingContext2D, drawData: Point[]): void {
    ctx.beginPath()
    ctx.moveTo(drawData[0].x, drawData[0].y)
    ctx.lineTo(drawData[1].x, drawData[1].y)
    ctx.stroke()
    ctx.closePath()
}

export function drawCurveLine(ctx: CanvasRenderingContext2D, drawData: CurveLineData): void {
    ctx.beginPath()
    ctx.moveTo(drawData.x1, drawData.y1)
    ctx.quadraticCurveTo(drawData.x2, drawData.y2, drawData.x3, drawData.y3)
    ctx.stroke()
    ctx.closePath()
}

export function drawCurveLineByPoints(ctx: CanvasRenderingContext2D, drawData: Point[]): void {
    let nowPoint: Point | null = null
    let newPoint: Point | null = null
    
    if (drawData.length >= 3) {
        ctx.beginPath()
        for (let i = 0; i < drawData.length - 2; i++) {
            newPoint = {
                x: (drawData[i + 1].x + drawData[i + 2].x) / 2,
                y: (drawData[i + 1].y + drawData[i + 2].y) / 2
            }
            
            if (nowPoint) {
                drawCurveLine(ctx, {
                    x1: nowPoint.x,
                    y1: nowPoint.y,
                    x2: drawData[i + 1].x,
                    y2: drawData[i + 1].y,
                    x3: newPoint.x,
                    y3: newPoint.y
                })
            } else {
                drawCurveLine(ctx, {
                    x1: drawData[i].x,
                    y1: drawData[i].y,
                    x2: drawData[i + 1].x,
                    y2: drawData[i + 1].y,
                    x3: newPoint.x,
                    y3: newPoint.y
                })
            }
            nowPoint = newPoint
        }
        ctx.closePath()
    }
}

export async function asyncDrawImage(ctx: CanvasRenderingContext2D, drawData: ImageDrawData): Promise<HTMLImageElement> {
    return new Promise(resolve => {
        let { x, y, w, h, imageUrl } = drawData
        let image = new Image()
        image.crossOrigin = "*"
        image.src = imageUrl
        image.onload = () => {
            ctx.drawImage(image, x, y, w, h)
            resolve(image)
        }
    })
}

export function drawDiamond(ctx: CanvasRenderingContext2D, drawData: DiamondData, isFill: boolean): void {
    ctx.beginPath()
    let { x1, y1, x2, y2, x3, y3, x4, y4 } = drawData
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x3, y3)
    ctx.lineTo(x4, y4)
    ctx.lineTo(x1, y1)
    isFill ? ctx.fill() : ctx.stroke()
}

export function drawRect(ctx: CanvasRenderingContext2D, drawData: RectData, isFill: boolean): void {
    ctx.beginPath()
    isFill ? ctx.fillRect(drawData.x, drawData.y, drawData.w, drawData.h) : ctx.strokeRect(drawData.x, drawData.y, drawData.w, drawData.h)
    ctx.closePath()
}

export function drawCircle(ctx: CanvasRenderingContext2D, drawData: CircleData, isFill: boolean): void {
    ctx.beginPath()
    ctx.arc(drawData.x, drawData.y, drawData.r, 0, Math.PI * 2, true)
    isFill ? ctx.fill() : ctx.stroke()
    ctx.closePath()
}

export function drawTriangle(ctx: CanvasRenderingContext2D, drawData: TriangleData, isFill: boolean): void {
    ctx.beginPath()
    let { x1, y1, x2, y2, x3, y3 } = drawData
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x3, y3)
    ctx.lineTo(x1, y1)
    isFill ? ctx.fill() : ctx.stroke()
    ctx.closePath()
}

export function drawLineArrow(ctx: CanvasRenderingContext2D, drawData: Point[]): void {
    let fromX = drawData[0].x
    let fromY = drawData[0].y
    let toX = drawData[1].x
    let toY = drawData[1].y
    let headlen = 20
    let theta = 40
    let arrowX: number, arrowY: number
    
    let angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI
    let angle1 = (angle + theta) * Math.PI / 180
    let angle2 = (angle - theta) * Math.PI / 180
    let topX = headlen * Math.cos(angle1)
    let topY = headlen * Math.sin(angle1)
    let botX = headlen * Math.cos(angle2)
    let botY = headlen * Math.sin(angle2)
    
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)

    arrowX = toX + topX
    arrowY = toY + topY
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(toX, toY)

    arrowX = toX + botX
    arrowY = toY + botY
    ctx.lineTo(arrowX, arrowY)
    ctx.stroke()
}