import type {
    CanvasOperationItem,
    CanvasOperationOptions,
    DrawOptions,
    Point,
    RectAreaData,
    TextOptions,
    WriteOptions
} from '../../types'
import {
    buildSmoothedCurvePath,
    drawCircle,
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
    addOperation: (position: RectAreaData, options: CanvasOperationOptions) => CanvasOperationItem
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
    let lastPointer: Point | null = null
    let lastAccepted: Point | null = null
    let smoothedEnd: Point | null = null
    let points: Point[] = []
    let curvePath = new Path2D()

    const midpoint = (first: Point, second: Point): Point => ({
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2
    })

    const strokePreview = (): void => {
        const tail = new Path2D()
        if (smoothedEnd && lastPointer && smoothedEnd !== lastPointer) {
            tail.moveTo(smoothedEnd.x, smoothedEnd.y)
            tail.lineTo(lastPointer.x, lastPointer.y)
        }

        context.clearTemporaryCanvas()
        context.temporaryCtx.save()
        context.temporaryCtx.lineCap = "round"
        context.temporaryCtx.lineJoin = "round"
        context.temporaryCtx.stroke(curvePath)
        context.temporaryCtx.stroke(tail)
        context.temporaryCtx.restore()
    }

    const begin = (event: PointerEvent): void => {
        pressed = true
        first = getPos(event)
        lastPointer = first
        lastAccepted = first
        smoothedEnd = first
        points = [first]
        curvePath = new Path2D()
        curvePath.moveTo(first.x, first.y)
    }

    const move = (event: PointerEvent): void => {
        if (!pressed || !lastPointer) return

        const position = getPos(event)
        if (distance(lastPointer, position) >= 5) {
            const previous = lastPointer
            const middle = midpoint(previous, position)
            curvePath.quadraticCurveTo(previous.x, previous.y, middle.x, middle.y)
            smoothedEnd = middle
            lastAccepted = position
            lastPointer = position
            points.push(position)
        } else {
            lastPointer = position
        }

        strokePreview()
    }

    const end = (): void => {
        if (!pressed || !first || !lastPointer) {
            pressed = false
            return
        }

        // 补齐最后一次不足采样距离的尾巴，避免松手时线段突然变短。
        if (lastPointer !== lastAccepted) {
            points.push(lastPointer)
            curvePath.lineTo(lastPointer.x, lastPointer.y)
        }

        context.clearTemporaryCanvas()
        context.ctx.save()
        context.ctx.lineCap = "round"
        context.ctx.lineJoin = "round"
        context.ctx.stroke(curvePath)
        context.ctx.restore()

        if (points.length >= 2) {
            const position = getPointsAreaData(points)
            if (position) {
                context.addOperation(position, {
                    drawType: 0,
                    isSelected: 1,
                    drawData: points,
                    ctxAttributes: {
                        lineWidth: options.lineWidth,
                        strokeStyle: options.color,
                        lineCap: "round",
                        lineJoin: "round"
                    }
                })
            }
        }

        pressed = false
        first = null
        lastPointer = null
        lastAccepted = null
        smoothedEnd = null
        points = []
        curvePath = new Path2D()
    }

    context.temporaryCanvas.onmousedown = begin
    context.temporaryCanvas.onmousemove = move
    context.temporaryCanvas.onmouseup = end
    context.temporaryCanvas.ontouchstart = begin
    context.temporaryCanvas.ontouchmove = move
    context.temporaryCanvas.ontouchend = end
}

export function createDrawTool(context: CanvasToolContext, options: DrawOptions): void {
    activateTool(context, options)
    context.clearTemporaryCanvas()
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
        if (!pressed) return
        pressed = false
        context.clearTemporaryCanvas()
        if (!first) return
        if (!last) last = getPos(event as MouseEvent)

        if (Math.abs(last.x - first.x) <= 30 && Math.abs(last.y - first.y) <= 30) {
            const position = getPos(event as MouseEvent)
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
                const operation = context.addOperation(position, {
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
                editBox.dataset.operationIndex = String(operation.index)
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
