import {
    containerDom,
    screenShotBackgroundDom,
    screenShotCutDom,
    screenShotOverlayDom,
    screenShotSelectRangeDom,
    screenShotToolbarDom
} from "./core"
import {
    getPos,
    getRectAreaData,
    isInRectArea,
    preventDefaultEvents,
    screenShotDataSet
} from "/src/utils/index"
import { getEventClassName } from "/src/modules/common/selection"

export interface ScreenShotArea {
    x1: number
    y1: number
    x2: number
    y2: number
    x3: number
    y3: number
    x4: number
    y4: number
    w: number
    h: number
}

export let screenShotPosition: ScreenShotArea | null = null

let canvas: HTMLCanvasElement | null = null
let temporaryCanvas: HTMLCanvasElement | null = null
let eventController: AbortController | null = null

type SelectionMode = "draw" | "move" | "stretch"
type StretchDirection =
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "leftTop"
    | "leftBottom"
    | "rightTop"
    | "rightBottom"

export function resetScreenShotData(): void {
    canvas = null
    temporaryCanvas = null
    screenShotPosition = null
    resetScreenShotSelection()
}

export function getScreenShotCanvasObject(
    canvasElement: HTMLCanvasElement,
    temporaryCanvasElement: HTMLCanvasElement
): void {
    canvas = canvasElement
    temporaryCanvas = temporaryCanvasElement
}

export function resetScreenShotSelection(): void {
    eventController?.abort()
    eventController = null
}

function drawSelection(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): void {
    const area = getRectAreaData(x1, y1, x2, y2)
    const selection = screenShotSelectRangeDom!
    const cut = screenShotCutDom!

    selection.style.left = `${area.x1}px`
    selection.style.top = `${area.y1}px`
    selection.style.width = `${Math.abs(area.x1 - area.x2)}px`
    selection.style.height = `${Math.abs(area.y1 - area.y3)}px`
    cut.style.left = `${-area.x1}px`
    cut.style.top = `${-area.y1}px`
}

function clearSelection(): void {
    screenShotSelectRangeDom!.style.left = "-1000px"
    screenShotSelectRangeDom!.style.top = "-1000px"
}

function showBackground(): void {
    screenShotBackgroundDom!.style.opacity = "0.6"
}

function hideBackground(): void {
    screenShotBackgroundDom!.style.opacity = "1"
}

function positionToolbar(visible: boolean): void {
    const toolbar = screenShotToolbarDom!
    if (!visible) {
        toolbar.style.visibility = "hidden"
        return
    }

    toolbar.style.visibility = "visible"
    const area = screenShotPosition!
    const { toolbarPosition } = screenShotDataSet
    const toolbarWidth = toolbar.clientWidth
    const toolbarHeight = toolbar.clientHeight
    const container = containerDom!
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    if (toolbarPosition === "left" || toolbarPosition === "right") {
        const preferredLeft = toolbarPosition === "left" ? area.x1 - toolbarWidth - 5 : area.x3 + 5
        const fallbackLeft = toolbarPosition === "left" ? area.x3 + 5 : area.x1 - toolbarWidth - 5
        const insideFallbackLeft = toolbarPosition === "left" ? area.x1 + 5 : area.x3 - toolbarWidth - 5

        toolbar.style.left = `${preferredLeft >= 0 && preferredLeft + toolbarWidth <= containerWidth
            ? preferredLeft
            : fallbackLeft >= 0 && fallbackLeft + toolbarWidth <= containerWidth
                ? fallbackLeft
                : insideFallbackLeft
        }px`

        toolbar.style.top = `${area.y1 + toolbarHeight > containerHeight
            ? containerHeight - toolbarHeight
            : area.y1
        }px`
        return
    }

    const preferredTop = toolbarPosition === "top" ? area.y1 - toolbarHeight - 5 : area.y3 + 5
    const fallbackTop = toolbarPosition === "top" ? area.y3 + 5 : area.y1 - toolbarHeight - 5
    const insideFallbackTop = toolbarPosition === "top" ? area.y1 + 5 : area.y3 - toolbarHeight - 5
    toolbar.style.top = `${preferredTop >= 0 && preferredTop + toolbarHeight <= containerHeight
        ? preferredTop
        : fallbackTop >= 0 && fallbackTop + toolbarHeight <= containerHeight
            ? fallbackTop
            : insideFallbackTop
    }px`

    toolbar.style.left = `${area.x3 - toolbarWidth < 0 ? 0 : area.x3 - toolbarWidth}px`
}

export function resetSelect(): void {
    screenShotPosition = null
    temporaryCanvas!.style.zIndex = "-1"
    screenShotOverlayDom!.style.zIndex = "50"
    screenShotOverlayDom!.style.cursor = "crosshair"
    positionToolbar(false)
    clearSelection()
    hideBackground()
}

function applyStretch(
    direction: StretchDirection,
    point: { x: number; y: number }
): void {
    const area = screenShotPosition!
    const { x1, y1, x3, y3 } = area

    switch (direction) {
        case "left":
            drawSelection(point.x, y1, x3, y3)
            area.x1 = point.x
            area.x4 = point.x
            break
        case "right":
            drawSelection(x1, y1, point.x, y3)
            area.x2 = point.x
            area.x3 = point.x
            break
        case "top":
            drawSelection(x1, point.y, x3, y3)
            area.y1 = point.y
            area.y2 = point.y
            break
        case "bottom":
            drawSelection(x1, y1, x3, point.y)
            area.y3 = point.y
            area.y4 = point.y
            break
        case "leftTop":
            drawSelection(point.x, point.y, x3, y3)
            area.x1 = point.x
            area.y1 = point.y
            area.y2 = point.y
            area.x4 = point.x
            break
        case "leftBottom":
            drawSelection(point.x, y1, x3, point.y)
            area.x1 = point.x
            area.y3 = point.y
            area.x4 = point.x
            area.y4 = point.y
            break
        case "rightTop":
            drawSelection(x1, point.y, point.x, y3)
            area.y1 = point.y
            area.x2 = point.x
            area.y2 = point.y
            area.x3 = point.x
            break
        case "rightBottom":
            drawSelection(x1, y1, point.x, point.y)
            area.x2 = point.x
            area.y3 = point.y
            area.x3 = point.x
            area.y4 = point.y
            break
    }
}

export function selectDrawRect(): void {
    resetScreenShotSelection()
    temporaryCanvas!.style.zIndex = "-1"
    screenShotOverlayDom!.style.zIndex = "50"
    screenShotOverlayDom!.style.cursor = "crosshair"
    positionToolbar(false)

    let pressed = false
    let first: { x: number; y: number } | null = null
    let last: { x: number; y: number } | null = null
    let offsetX: number | null = null
    let offsetY: number | null = null
    let stretch: StretchDirection | false = false
    let mode: SelectionMode | null = null

    const begin = (event: MouseEvent | TouchEvent): void => {
            positionToolbar(false)
        const point = getPos(event)
        const className = getEventClassName(event)
        const isSelectionHandle = className.includes("select-range-block") ||
            className.includes("select-range-border")

        if (screenShotPosition) {
            const area = screenShotPosition
            const insideArea = isInRectArea(
                area.x1,
                area.y1,
                area.x3,
                area.y3,
                point.x,
                point.y
            )

            if (isSelectionHandle) {
                mode = "stretch"
                stretch = className.split("__")[1] as StretchDirection
            } else if (insideArea) {
                mode = "move"
                stretch = false
            } else {
                mode = "draw"
                screenShotPosition = null
                clearSelection()
                showBackground()
            }
        } else {
            mode = "draw"
            screenShotPosition = null
            clearSelection()
            showBackground()
        }

        pressed = true
        first = point
        preventDefaultEvents(event)
    }

    const move = (event: MouseEvent | TouchEvent): void => {
            if (!pressed || !first) return
        positionToolbar(false)
        const point = getPos(event)

        if (mode == "draw") {
            const className = getEventClassName(event)
            if (className != "bupu-overlay") return
            last = point
            if (Math.abs((first.x - point.x) * (first.y - point.y)) > 600) {
                drawSelection(first.x, first.y, point.x, point.y)
            }
            return
        }

        if (!screenShotPosition) return
        last = point

        if (mode == "move") {
            const area = screenShotPosition
            offsetX = point.x - first.x
            offsetY = point.y - first.y
            const container = containerDom!

            if (area.x1 + offsetX - 5 <= 0) offsetX = 5 - area.x1
            if (area.y1 + offsetY - 5 <= 0) offsetY = 5 - area.y1
            if (area.x3 + offsetX + 5 >= container.clientWidth) {
                offsetX = container.clientWidth - area.x3 - 5
            }
            if (area.y3 + offsetY + 5 >= container.clientHeight) {
                offsetY = container.clientHeight - area.y3 - 5
            }

            drawSelection(
                area.x1 + offsetX,
                area.y1 + offsetY,
                area.x3 + offsetX,
                area.y3 + offsetY
            )
            return
        }

        if (mode == "stretch" && stretch) applyStretch(stretch, point)
    }

    const end = (): void => {
            pressed = false
        if (!last || !first || !mode) {
            first = null
            last = null
            mode = null
            return
        }

        if (mode == "draw") {
            const area = Math.abs((first.x - last.x) * (first.y - last.y))
            if (area < 600) {
                screenShotPosition = null
                hideBackground()
                positionToolbar(false)
            } else {
                screenShotPosition = getRectAreaData(first.x, first.y, last.x, last.y)
                positionToolbar(true)
            }
        } else if (mode == "move") {
            const area = screenShotPosition!
            screenShotPosition = getRectAreaData(
                area.x1 + (offsetX || 0),
                area.y1 + (offsetY || 0),
                area.x3 + (offsetX || 0),
                area.y3 + (offsetY || 0)
            )
            positionToolbar(true)
        } else if (mode == "stretch") {
            const area = screenShotPosition!
            screenShotPosition = getRectAreaData(area.x1, area.y1, area.x3, area.y3)
            positionToolbar(true)
        }

        last = null
        first = null
        offsetX = null
        offsetY = null
        mode = null
        stretch = false
    }

    eventController = new AbortController()
    const signal = eventController.signal
    const overlay = screenShotOverlayDom!
    overlay.addEventListener("mousedown", begin, { signal })
    overlay.addEventListener("mousemove", move, { signal })
    overlay.addEventListener("mouseup", end, { signal })
    overlay.addEventListener("touchstart", begin, { signal })
    overlay.addEventListener("touchmove", move, { signal })
    overlay.addEventListener("touchend", end, { signal })
    window.addEventListener("mouseup", end, { signal })
    window.addEventListener("touchend", end, { signal })
}
