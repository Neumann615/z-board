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

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let temporaryCanvas: HTMLCanvasElement | null = null
let temporaryCtx: CanvasRenderingContext2D | null = null
export let screenShotPosition: { x1: number; y1: number; x3: number; y3: number; w: number; h: number; x2: number; y2: number } | null = null

export function resetScreenShotData(): void {
    canvas = null
    ctx = null
    temporaryCanvas = null
    temporaryCtx = null
    screenShotPosition = null
}

function drawSelect(x1: number, y1: number, x2: number, y2: number): void {
    let rect = getRectAreaData(x1, y1, x2, y2)
    screenShotSelectRangeDom!.style.left = rect.x1 + "px"
    screenShotSelectRangeDom!.style.top = rect.y1 + "px"
    screenShotSelectRangeDom!.style.width = Math.abs(rect.x1 - rect.x2) + "px"
    screenShotSelectRangeDom!.style.height = Math.abs(rect.y1 - (rect as unknown as { y3: number }).y3) + "px"
    screenShotCutDom!.style.left = -rect.x1 + "px"
    screenShotCutDom!.style.top = -rect.y1 + "px"
}

export function clearSelect(): void {
    screenShotSelectRangeDom!.style.left = -1000 + "px"
    screenShotSelectRangeDom!.style.top = -1000 + "px"
}

export function showBackground(): void {
    screenShotBackgroundDom!.style.opacity = "0.6"
}

function hideBackground(): void {
    screenShotBackgroundDom!.style.opacity = "1"
}

function positionScreenShotToolbar(flag: boolean): void {
    if (flag) {
        screenShotToolbarDom!.style.visibility = "visible"
        let { toolbarPosition } = screenShotDataSet
        let { x1, y1, x3, y3 } = screenShotPosition!
        let toolbarWidth = screenShotToolbarDom!.clientWidth
        let toolbarHeight = screenShotToolbarDom!.clientHeight
        let containerWidth = containerDom!.clientWidth
        let containerHeight = containerDom!.clientHeight

        if (toolbarPosition === "left") {
            if (x1 - toolbarWidth >= 0) {
                screenShotToolbarDom!.style.left = x1 - toolbarWidth - 5 + "px"
            } else if (x3 + toolbarWidth <= containerWidth) {
                screenShotToolbarDom!.style.left = x3 + 5 + "px"
            } else {
                screenShotToolbarDom!.style.left = x1 + 5 + "px"
            }
            if (y1 + toolbarHeight > containerHeight) {
                screenShotToolbarDom!.style.top = containerHeight - toolbarHeight + "px"
            } else {
                screenShotToolbarDom!.style.top = y1 + "px"
            }
        } else if (toolbarPosition === "right") {
            if (x3 + toolbarWidth <= containerWidth) {
                screenShotToolbarDom!.style.left = x3 + 5 + "px"
            } else if (x1 - toolbarWidth >= 0) {
                screenShotToolbarDom!.style.left = x1 - toolbarWidth - 5 + "px"
            } else {
                screenShotToolbarDom!.style.left = x3 - toolbarWidth - 5 + "px"
            }
            if (y1 + toolbarHeight > containerHeight) {
                screenShotToolbarDom!.style.top = containerHeight - toolbarHeight + "px"
            } else {
                screenShotToolbarDom!.style.top = y1 + "px"
            }
        } else if (toolbarPosition === "top") {
            if (y1 >= toolbarHeight) {
                screenShotToolbarDom!.style.top = y1 - toolbarHeight - 5 + "px"
            } else if (y3 + toolbarHeight <= containerHeight) {
                screenShotToolbarDom!.style.top = y3 + 5 + "px"
            } else {
                screenShotToolbarDom!.style.top = y1 + 5 + "px"
            }
            if (x3 - toolbarWidth < 0) {
                screenShotToolbarDom!.style.left = 0 + "px"
            } else {
                screenShotToolbarDom!.style.left = x3 - toolbarWidth + "px"
            }
        } else if (toolbarPosition === "bottom") {
            if (y3 + toolbarHeight <= containerHeight) {
                screenShotToolbarDom!.style.top = y3 + 5 + "px"
            } else if (y1 >= toolbarHeight) {
                screenShotToolbarDom!.style.top = y1 - toolbarHeight - 5 + "px"
            } else {
                screenShotToolbarDom!.style.top = y3 - toolbarHeight - 5 + "px"
            }
            if (x3 - toolbarWidth < 0) {
                screenShotToolbarDom!.style.left = 0 + "px"
            } else {
                screenShotToolbarDom!.style.left = x3 - toolbarWidth + "px"
            }
        }
    } else {
        screenShotToolbarDom!.style.visibility = "hidden"
    }
}

export function getScreenShotCanvasObject(canvas1: HTMLCanvasElement, temporaryCanvas1: HTMLCanvasElement): void {
    canvas = canvas1
    temporaryCanvas = temporaryCanvas1
    ctx = canvas1.getContext("2d")
    temporaryCtx = temporaryCanvas1.getContext("2d")
}

export function resetSelect(): void {
    screenShotPosition = null
    temporaryCanvas!.style.zIndex = "-1"
    screenShotOverlayDom!.style.zIndex = "50"
    screenShotOverlayDom!.style.cursor = "crosshair"
    positionScreenShotToolbar(false)
    clearSelect()
    hideBackground()
}

export function selectDrawRect(): void {
    temporaryCanvas!.style.zIndex = "-1"
    screenShotOverlayDom!.style.zIndex = "50"
    screenShotOverlayDom!.style.cursor = "crosshair"
    positionScreenShotToolbar(false)

    let mousePress = false
    let first: { x: number; y: number } | null = null
    let last: { x: number; y: number } | null = null
    let spaceX: number | null = null
    let spaceY: number | null = null
    let isStretch: string | boolean = false
    let nowType: "draw" | "move" | "stretch" | null = null

    function begin(event: MouseEvent | TouchEvent): void {
        if (event) {
            positionScreenShotToolbar(false)
            let xy = getPos(event)

            if (screenShotPosition) {
                if (isInRectArea(screenShotPosition.x1, screenShotPosition.y1, screenShotPosition.x3, screenShotPosition.y3, xy.x, xy.y) &&
                    !((event.srcElement as HTMLElement).className.indexOf("select-range-block") !== -1 ||
                      (event.srcElement as HTMLElement).className.indexOf("select-range-border") !== -1)) {
                    nowType = "move"
                    isStretch = false
                } else if ((event.srcElement as HTMLElement).className.indexOf("select-range-block") !== -1 ||
                           (event.srcElement as HTMLElement).className.indexOf("select-range-border") !== -1) {
                    nowType = "stretch"
                    isStretch = (event.srcElement as HTMLElement).className.split("__")[1]
                } else {
                    nowType = "draw"
                    screenShotPosition = null
                    clearSelect()
                    showBackground()
                }
            } else {
                nowType = "draw"
                screenShotPosition = null
                clearSelect()
                showBackground()
            }

            mousePress = true
            first = xy

            setTimeout(() => {
                screenShotOverlayDom!.onmousemove = move
            }, 0)
        }
        preventDefaultEvents(event)
    }

    function move(event: MouseEvent | TouchEvent): void {
        if (mousePress && first) {
            positionScreenShotToolbar(false)

            if (nowType === "draw") {
                if ((event.srcElement as HTMLElement).className === "bupu-overlay") {
                    last = getPos(event)
                    if (Math.abs((first.x - last.x) * (first.y - last.y)) > 600) {
                        drawSelect(first.x, first.y, last.x, last.y)
                    }
                }
            } else if (nowType === "move") {
                let { x1, y1, x3, y3 } = screenShotPosition!
                last = getPos(event)
                spaceX = last.x - first.x
                spaceY = last.y - first.y

                if (x1 + spaceX - 5 <= 0) {
                    spaceX = 5 - x1
                }
                if (y1 + spaceY - 5 <= 0) {
                    spaceY = 5 - y1
                }
                if (x3 + spaceX + 5 >= containerDom!.clientWidth) {
                    spaceX = containerDom!.clientWidth - x3 - 5
                }
                if (y3 + spaceY + 5 >= containerDom!.clientHeight) {
                    spaceY = containerDom!.clientHeight - y3 - 5
                }

                drawSelect(x1 + spaceX, y1 + spaceY, x3 + spaceX, y3 + spaceY)
            } else if (nowType === "stretch") {
                if ((event.srcElement as HTMLElement).className.indexOf("select-range-block") === -1 &&
                    (event.srcElement as HTMLElement).className.indexOf("select-range-border") === -1) {
                    let { x1, y1, x3, y3 } = screenShotPosition!
                    last = getPos(event)

                    switch (isStretch) {
                        case "left":
                            drawSelect(last.x, y1, x3, y3)
                            screenShotPosition.x1 = last.x
                            break
                        case "right":
                            drawSelect(x1, y1, last.x, y3)
                            screenShotPosition.x3 = last.x
                            break
                        case "top":
                            drawSelect(x1, last.y, x3, y3)
                            screenShotPosition.y1 = last.y
                            break
                        case "bottom":
                            drawSelect(x1, y1, x3, last.y)
                            screenShotPosition.y3 = last.y
                            break
                        case "leftTop":
                            drawSelect(last.x, last.y, x3, y3)
                            screenShotPosition.x1 = last.x
                            screenShotPosition.y1 = last.y
                            break
                        case "leftBottom":
                            drawSelect(last.x, y1, x3, last.y)
                            screenShotPosition.x1 = last.x
                            screenShotPosition.y3 = last.y
                            break
                        case "rightTop":
                            drawSelect(x1, last.y, last.x, y3)
                            screenShotPosition.y1 = last.y
                            screenShotPosition.x3 = last.x
                            break
                        case "rightBottom":
                            drawSelect(x1, y1, last.x, last.y)
                            screenShotPosition.x3 = last.x
                            screenShotPosition.y3 = last.y
                            break
                    }
                }
            }
        }
    }

    function end(): void {
        mousePress = false

        if (!last || Math.abs((first!.x - last.x) * (first!.y - last.y)) < 600) {
            if (first && !screenShotPosition) {
                hideBackground()
                positionScreenShotToolbar(false)
            }
            return
        }

        if (nowType == "draw") {
            screenShotPosition = getRectAreaData(first!.x, first!.y, last.x, last.y)
        } else if (nowType == "move") {
            let { x1, y1, x3, y3 } = screenShotPosition!
            screenShotPosition = getRectAreaData(x1 + (spaceX || 0), y1 + (spaceY || 0), x3 + (spaceX || 0), y3 + (spaceY || 0))
        } else if (nowType == "stretch") {
            let { x1, y1, x3, y3 } = screenShotPosition!
            screenShotPosition = getRectAreaData(x1, y1, x3, y3)
        }

        positionScreenShotToolbar(true)
        screenShotOverlayDom!.onmousemove = null
        last = null
        first = null
        spaceX = null
        spaceY = null
        nowType = null
        isStretch = false
    }

    screenShotOverlayDom!.onmousedown = begin
    screenShotOverlayDom!.onmouseup = end
    window.onmouseup = end
}