import type { CanvasOperationItem } from '../../types'
import {
    asyncDrawImage,
    drawCircle,
    drawCurveLineByPoints,
    drawDiamond,
    drawLineArrow,
    drawRect,
    drawTriangle,
    setObjAttributes
} from '/src/utils/index'

export interface RenderHistoryOperationOptions {
    container: HTMLElement
    imageCache: Map<string, HTMLImageElement>
    loadImage?: (drawData: {
        x: number
        y: number
        w: number
        h: number
        imageUrl: string
    }) => Promise<HTMLImageElement>
    saveImage?: (imageUrl: string, image: HTMLImageElement) => void
}

export async function renderHistoryOperation(
    ctx: CanvasRenderingContext2D,
    item: CanvasOperationItem,
    options: RenderHistoryOperationOptions
): Promise<void> {
    const { options: operation } = item
    if (operation.ctxAttributes) {
        setObjAttributes(ctx, operation.ctxAttributes)
    }

    if (operation.drawType == 0) {
        drawCurveLineByPoints(ctx, operation.drawData)
    } else if (operation.drawType == 1) {
        drawLineArrow(ctx, operation.drawData)
    } else if (operation.drawType == 2) {
        drawRect(ctx, operation.drawData)
    } else if (operation.drawType == 3) {
        drawTriangle(ctx, operation.drawData)
    } else if (operation.drawType == 4) {
        drawCircle(ctx, operation.drawData)
    } else if (operation.drawType == 5) {
        drawDiamond(ctx, operation.drawData)
    } else if (operation.drawType == 6) {
        if (!operation.style || !operation.text) return
        const editBox = document.createElement("div")
        editBox.className = "bupu-edit-box"
        editBox.dataset.operationIndex = String(item.index)
        editBox.contentEditable = "false"
        editBox.style.padding = "4px"
        editBox.style.border = "none"
        editBox.style.left = operation.style.left + "px"
        editBox.style.top = operation.style.top + "px"
        editBox.style.maxWidth = `calc(100% - ${operation.style.left}px)`
        editBox.style.maxHeight = `calc(100% - ${operation.style.top}px)`
        editBox.style.fontSize = operation.style.fontSize + "px"
        editBox.style.color = operation.style.color
        editBox.innerText = operation.text
        options.container.appendChild(editBox)
    } else if (operation.drawType == 7) {
        const drawData = operation.drawData
        const cached = options.imageCache.get(drawData.imageUrl)
        if (cached) {
            ctx.drawImage(cached, drawData.x, drawData.y, drawData.w, drawData.h)
            return
        }

        const image = options.loadImage
            ? await options.loadImage(drawData)
            : await asyncDrawImage(ctx, drawData)
        options.saveImage?.(drawData.imageUrl, image)
    }
}
