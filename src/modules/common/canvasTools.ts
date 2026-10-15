import type {
    CanvasOperationOptions,
    DrawOptions,
    Point,
    RectAreaData,
    TextOptions,
    WriteOptions
} from '../../types'
import {
    drawCircle,
    drawCurveLine,
    drawCurveLineByPoints,
    drawDiamond,
    drawLineArrow,
    drawRect,
    drawTriangle,
    getPointsAreaData,
    getPos,
    getRectAreaData
} from '/src/utils/index'

export interface CanvasToolContext {
    ctx: CanvasRenderingContext2D
    temporaryCtx: CanvasRenderingContext2D
    overlay: HTMLElement
    temporaryCanvas: HTMLCanvasElement
    container: HTMLElement
    addOperation: (position: RectAreaData, options: CanvasOperationOptions) => void
    clearTemporaryCanvas: () => void
    clearSelection: () => void
}

type PointerEvent = MouseEvent | TouchEvent

function activateTool(context: CanvasToolContext, options: { lineWidth?: number; color?: string }): void {
    context.overlay.style.zIndex = "-1"
    context.temporaryCanvas.style.zIndex = "50"
    context.clearSelection()

    if (options.lineWidth !== undefined) context.ctx.lineWidth = options.lineWidth
    if (options.color !== undefined) {
        context.ctx.strokeStyle = options.color
        context.temporaryCtx.strokeStyle = options.color
    }
    if (options.lineWidth !== undefined) context.temporaryCtx.lineWidth = options.lineWidth
}

function distance(first: Point, second: Point): number {
    return Math.sqrt((first.x - second.x) ** 2 + (first.y - second.y) ** 2)
}

export function createWriteTool(context: CanvasToolContext, options: WriteOptions): void {
    activateTool(context, options)

    let pressed = false
    let first: Point | null = null
    let last: Point | null = null
    let points: Point[] = []
    let controlPoint: Point | null = null

    const begin = (event: PointerEvent): void => {
        pressed = true
        first = getPos(event)
        points.push(first)
    }

    const move = (event: PointerEvent): void => {
        if (!pressed || !points.length) return
        const position = getPos(event)
        if (distance(points[points.length - 1], position) < 5) return

        points.push(position)
        if (points.length < 3) return

        const [previous, current] = points.slice(-2)
        const nextControlPoint = {
            x: (previous.x + current.x) / 2,
            y: (previous.y + current.y) / 2
        }

        const curve = controlPoint
            ? { x1: controlPoint.x, y1: controlPoint.y, x2: previous.x, y2: previous.y, x3: nextControlPoint.x, y3: nextControlPoint.y }
            : { x1: points[0].x, y1: points[0].y, x2: points[1].x, y2: points[1].y, x3: nextControlPoint.x, y3: nextControlPoint.y }
        drawCurveLine(context.temporaryCtx, curve)
        controlPoint = nextControlPoint
    }

    const end = (): void => {
        context.clearTemporaryCanvas()
        if (points.length >= 2) {
            drawCurveLineByPoints(context.ctx, points)
            const position = getPointsAreaData(points)
            if (position) {
                context.addOperation(position, {
                    drawType: 0,
                    isSelected: 1,
                    drawData: points,
                    ctxAttributes: {
                        lineWidth: options.lineWidth,
                        strokeStyle: options.color
                    }
                })
            }
        }

        pressed = false
        controlPoint = null
        last = null
        first = null
        points = []
    }

    context.temporaryCanvas.onmousedown = begin
    context.temporaryCanvas.onmousemove = move
    context.temporaryCanvas.onmouseup = end
    context.temporaryCanvas.ontouchstart = begin
    context.temporaryCanvas.ontouchmove = move
    context.temporaryCanvas.ontouchend = end
    void last
}

export function createDrawTool(context: CanvasToolContext, options: DrawOptions): void {
    activateTool(context, options)
    const shapeType = options.shapeType

    let drawData: any = null
    let pressed = false
    let first: Point | null = null
    let last: Point | null = null

    const begin = (event: PointerEvent): void => {
        pressed = true
        first = getPos(event)
    }

    const move = (event: PointerEvent): void => {
        if (!pressed || !first) return
        last = getPos(event)
        context.clearTemporaryCanvas()
        context.temporaryCtx.beginPath()

        if (shapeType == 0) {
            drawData = { x: first.x, y: first.y, w: last.x - first.x, h: last.y - first.y }
            drawRect(context.temporaryCtx, drawData)
        } else if (shapeType == 1) {
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: first.x,
                y2: last.y,
                x3: last.x,
                y3: last.y
            }
            drawTriangle(context.temporaryCtx, drawData)
        } else if (shapeType == 2) {
            drawData = {
                x: (first.x + last.x) / 2,
                y: (first.y + last.y) / 2,
                r: Math.abs(last.x - first.x) / 2
            }
            drawCircle(context.temporaryCtx, drawData)
        } else if (shapeType == 3) {
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: last.x,
                y2: (first.y + last.y) / 2,
                x3: (first.x + last.x) / 2,
                y3: last.y,
                x4: first.x,
                y4: (first.y + last.y) / 2
            }
            drawDiamond(context.temporaryCtx, drawData)
        }

        context.temporaryCtx.closePath()
    }

    const addShape = (position: RectAreaData, data: unknown, drawType: number): void => {
        context.addOperation(position, {
            drawType,
            drawData: data,
            isSelected: 1,
            ctxAttributes: {
                lineWidth: options.lineWidth,
                strokeStyle: options.color
            }
        })
    }

    const end = (event: PointerEvent): void => {
        pressed = false
        context.clearTemporaryCanvas()
        if (!first) return
        if (!last) last = getPos(event)

        if (Math.abs(last.x - first.x) <= 30 && Math.abs(last.y - first.y) <= 30) {
            const position = getPos(event)
            first = { x: position.x - 15, y: position.y - 15 }
            last = { x: position.x + 15, y: position.y + 15 }
        }

        if (shapeType == 0) {
            const position = getRectAreaData(first.x, first.y, last.x, last.y)
            drawData = { x: first.x, y: first.y, w: last.x - first.x, h: last.y - first.y }
            drawRect(context.ctx, drawData)
            addShape(position, drawData, 2)
        } else if (shapeType == 1) {
            const position = getRectAreaData(first.x, first.y, last.x, last.y)
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: first.x,
                y2: last.y,
                x3: last.x,
                y3: last.y
            }
            drawTriangle(context.ctx, drawData)
            addShape(position, drawData, 3)
        } else if (shapeType == 2) {
            drawData = {
                x: (first.x + last.x) / 2,
                y: (first.y + last.y) / 2,
                r: Math.abs(last.x - first.x) / 2
            }
            const position = getRectAreaData(
                first.x,
                (first.y + last.y) / 2 - drawData.r,
                last.x,
                (first.y + last.y) / 2 + drawData.r
            )
            drawCircle(context.ctx, drawData)
            addShape(position, drawData, 4)
        } else if (shapeType == 3) {
            const position = getRectAreaData(first.x, first.y, last.x, last.y)
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: last.x,
                y2: (first.y + last.y) / 2,
                x3: (first.x + last.x) / 2,
                y3: last.y,
                x4: first.x,
                y4: (first.y + last.y) / 2
            }
            drawDiamond(context.ctx, drawData)
            addShape(position, drawData, 5)
        }

        last = null
        first = null
        drawData = null
    }

    context.temporaryCanvas.onmousedown = begin
    context.temporaryCanvas.onmousemove = move
    context.temporaryCanvas.onmouseup = end
    context.temporaryCanvas.ontouchstart = begin
    context.temporaryCanvas.ontouchmove = move
    context.temporaryCanvas.ontouchend = end
}

export function createTextTool(context: CanvasToolContext, options: TextOptions): void {
    context.temporaryCtx.restore()
    activateTool(context, options)
    context.clearTemporaryCanvas()
    context.ctx.font = options.font
    context.ctx.fillStyle = options.color

    let pressed = false
    let first: Point | null = null
    let last: Point | null = null

    const begin = (event: PointerEvent): void => {
        pressed = true
        first = getPos(event)
    }

    const move = (event: PointerEvent): void => {
        if (!pressed || !first) return
        last = getPos(event)
    }

    const end = (): void => {
        if (!first) return
        const editBox = document.createElement("div")
        editBox.contentEditable = "true"
        editBox.className = "bupu-edit-box"
        editBox.style.fontSize = options.fontSize + "px"
        editBox.style.color = options.color
        editBox.style.left = first.x + "px"
        editBox.style.top = first.y + "px"
        editBox.style.maxWidth = `calc(100% - ${first.x}px)`
        editBox.style.maxHeight = `calc(100% - ${first.y}px)`
        context.container.appendChild(editBox)
        editBox.focus()

        const textPoint: Point = first
        editBox.onblur = () => {
            context.clearTemporaryCanvas()
            const position = getRectAreaData(
                textPoint.x,
                textPoint.y,
                textPoint.x + editBox.clientWidth,
                textPoint.y + editBox.clientHeight
            )
            if (editBox.innerText.length) {
                context.addOperation(position, {
                    drawType: 6,
                    text: editBox.innerText,
                    isSelected: 1,
                    style: {
                        fontSize: options.fontSize,
                        left: textPoint.x,
                        top: textPoint.y,
                        color: options.color
                    }
                })
            }
            editBox.style.border = "none"
            editBox.style.padding = "4px"
            editBox.contentEditable = "false"
        }
    }

    context.temporaryCanvas.onmousedown = begin
    context.temporaryCanvas.onmousemove = move
    context.temporaryCanvas.onmouseup = end
    context.temporaryCanvas.ontouchstart = begin
    context.temporaryCanvas.ontouchmove = move
    context.temporaryCanvas.ontouchend = end
    void last
}
