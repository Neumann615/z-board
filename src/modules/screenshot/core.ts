import message from "msg-alert"
import type {
    DrawOptions,
    ScreenShotInstance,
    ScreenShotOptions,
    TextOptions,
    WriteOptions
} from '../../types'

import {
    changeIsSelected,
    domAppendChild,
    getRectAreaData,
    screenShotDataSet,
    updateScreenShotVar
} from "/src/utils/index"
import iIco from "/src/assets/image/I.ico"
import pencilIco from "/src/assets/image/pencil.ico"
import plusIco from "/src/assets/image/plus.ico"
import {
    renderCanvas,
    renderContainer,
    renderDraw,
    renderExitScreenShot,
    renderMoveToolbar,
    renderOverlay,
    renderSave,
    renderScreenShotBackground,
    renderScreenShotCut,
    renderScreenShotSelectRange,
    renderSelectRange,
    renderSuccessScreenShot,
    renderTemporaryCanvas,
    renderText,
    renderUndo,
    renderWrite
} from "./render"
import {
    addCanvasData,
    clearTemporaryCanvas,
    draw,
    getCanvasObject,
    redrawByResolution,
    resetToolbarData,
    save,
    text,
    success,
    undo,
    updateImageCacheSet,
    write
} from "./toolbar"
import {
    getScreenShotCanvasObject,
    resetScreenShotData,
    resetScreenShotSelection,
    screenShotPosition,
    selectDrawRect,
    resetSelect
} from "./screenshot"
import {
    bindDrawEvents,
    bindTextEvents,
    bindWriteEvents,
    resetEventBindings
} from "/src/modules/common/eventBinding"

type ScreenshotStage = "select" | "edit"

let canvasDom: HTMLCanvasElement | null = null
let temporaryCanvasDom: HTMLCanvasElement | null = null
let writeDom: HTMLDivElement | null = null
let drawDom: HTMLDivElement | null = null
let textDom: HTMLDivElement | null = null
let undoDom: HTMLDivElement | null = null
let saveDom: HTMLDivElement | null = null
let exitDom: HTMLDivElement | null = null
let successDom: HTMLDivElement | null = null
let mountDom: HTMLElement | null = null

export let screenShotToolbarDom: HTMLDivElement | null = null
export let screenShotBackgroundDom: HTMLImageElement | null = null
export let screenShotCutDom: HTMLImageElement | null = null
export let selectRangeDom: HTMLDivElement | null = null
export let screenShotSelectRangeDom: HTMLDivElement | null = null
export let containerDom: HTMLElement | null = null
export let overlayDom: HTMLDivElement | null = null
export let screenShotOverlayDom: HTMLDivElement | null = null
export let moveToolbarDom: HTMLDivElement | null = null
export let canvasResolution: { w: number; h: number } = { w: 0, h: 0 }

let writeOptions: WriteOptions
let drawOptions: DrawOptions
let textOptions: TextOptions
let stage: ScreenshotStage = "select"
let currentImageUrl = ""
let eventController: AbortController | null = null
let resizeController: AbortController | null = null
let resolutionResizeController: AbortController | null = null
let originalContainerW = 0
let originalContainerH = 0

function initDomData(): void {
    canvasDom = renderCanvas()
    temporaryCanvasDom = renderTemporaryCanvas()
    writeDom = renderWrite()
    drawDom = renderDraw()
    textDom = renderText()
    undoDom = renderUndo()
    saveDom = renderSave()
    exitDom = renderExitScreenShot()
    successDom = renderSuccessScreenShot()

    screenShotToolbarDom = null
    screenShotBackgroundDom = null
    screenShotCutDom = null
    selectRangeDom = null
    screenShotSelectRangeDom = null
    containerDom = renderContainer()
    overlayDom = renderOverlay()
    screenShotOverlayDom = renderOverlay()
    moveToolbarDom = renderMoveToolbar()
    canvasResolution = { w: 0, h: 0 }

    writeOptions = {
        lineType: 0,
        lineWidth: 3,
        color: screenShotDataSet.colorList[0]
    }
    drawOptions = {
        shapeType: 0,
        lineWidth: 3,
        color: screenShotDataSet.colorList[0]
    }
    textOptions = {
        fontSize: 15,
        font: "15px Arial",
        color: screenShotDataSet.colorList[0]
    }
}

function activateTool(target: HTMLDivElement | null, cursor: string, activate: () => void): void {
    if (!target) return
    temporaryCanvasDom!.style.cursor = `url(${cursor}),default`
    canvasDom!.style.cursor = `url(${cursor}),default`
    changeIsSelected([writeDom!, drawDom!, textDom!], target)
    activate()
}

function bindToolEvents(): void {
    writeEventBinding()
    drawEventBinding()
    textEventBinding()
}

function handleToolbarClick(event: MouseEvent): void {
    event.stopPropagation()
    event.preventDefault()

    const action = (event.target as HTMLElement | null)?.id
    if (!action) return

    const drawingTools: Record<string, () => void> = {
        "toolbar-write": () => {
            activateTool(writeDom!, pencilIco, () => write(writeOptions))
            writeEventBinding()
        },
        "toolbar-draw": () => {
            activateTool(drawDom!, plusIco, () => draw(drawOptions))
            drawEventBinding()
        },
        "toolbar-text": () => {
            activateTool(textDom!, iIco, () => text(textOptions))
            textEventBinding()
        }
    }

    if (drawingTools[action]) {
        clearTemporaryCanvas()
        enterEditStage()
            .then(successful => {
                if (successful) drawingTools[action]()
            })
            .catch(error => {
                console.error("z-board screenshot edit stage failed:", error)
            })
        return
    }

    if (stage != "edit") return
    clearTemporaryCanvas()

    switch (action) {
        case "toolbar-save":
            save()
            break
        case "toolbar-undo":
            undo(1)
            break
        case "toolbar-exit":
            screenShotDataSet.exitHandler?.()
            break
        case "toolbar-success":
            success()
            break
    }
}

function eventBinding(): void {
    eventController?.abort()
    eventController = new AbortController()
    const signal = eventController.signal
    screenShotToolbarDom?.addEventListener("click", handleToolbarClick, { signal })

    const background = screenShotBackgroundDom!
    background.addEventListener("mousedown", event => {
        event.stopPropagation()
        event.preventDefault()
    }, { signal })

    const container = containerDom!
    container.addEventListener("dblclick", event => {
        const target = event.target
        if (target instanceof Element && target.closest(".bupu-toolbar")) return
        if (screenShotPosition && screenShotDataSet.successHandler) {
            enterEditStage()
                .then(successful => {
                    if (successful) success()
                })
                .catch(error => {
                    console.error("z-board screenshot confirm failed:", error)
                })
        }
        event.stopPropagation()
        event.preventDefault()
    }, { signal })

    container.addEventListener("contextmenu", event => {
        const target = event.target
        if (target instanceof Element && target.classList.contains("bupu-overlay") && screenShotPosition) {
            resetSelect()
        }
        event.stopPropagation()
        event.preventDefault()
    }, { signal })
}

function writeEventBinding(): void {
    bindWriteEvents(writeOptions, write)
}

function drawEventBinding(): void {
    bindDrawEvents(drawOptions, draw)
}

function textEventBinding(): void {
    bindTextEvents(textOptions, text)
}

function syncBackgroundImageSize(): void {
    const container = containerDom
    const background = screenShotBackgroundDom
    const cut = screenShotCutDom
    if (!container || !background || !cut) return

    const width = container.clientWidth
    const height = container.clientHeight
    if (width <= 0 || height <= 0) return

    background.style.width = `${width}px`
    background.style.height = `${height}px`
    cut.style.width = `${width}px`
    cut.style.height = `${height}px`
    originalContainerW = width
    originalContainerH = height
}

function updateCanvasResolution(w: number, h: number, forceRedraw = false): void {
    if (!forceRedraw && w == canvasResolution.w && h == canvasResolution.h) return

    const dpr = window.devicePixelRatio || 1
    const physicalWidth = Math.max(1, Math.round(w * dpr))
    const physicalHeight = Math.max(1, Math.round(h * dpr))
    const canvases = [canvasDom!, temporaryCanvasDom!]

    for (const canvas of canvases) {
        canvas.width = physicalWidth
        canvas.height = physicalHeight
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
    }
    canvasResolution.w = w
    canvasResolution.h = h

    for (const canvas of canvases) {
        const context = canvas.getContext("2d")
        context?.setTransform(1, 0, 0, 1, 0, 0)
        context?.scale(dpr, dpr)
    }

    redrawByResolution()
}

function observeCanvasResolution(dom: HTMLElement): void {
    resolutionResizeController?.abort()
    resolutionResizeController = new AbortController()
    updateCanvasResolution(dom.clientWidth, dom.clientHeight, true)
    window.addEventListener("resize", () => {
        updateCanvasResolution(dom.clientWidth, dom.clientHeight)
    }, { signal: resolutionResizeController.signal })
}

/** 框选完成后，把截图区域切换为可编辑画布。 */
function enterEditStage(): Promise<boolean> {
    if (stage == "edit") return Promise.resolve(true)

    const position = screenShotPosition
    const source = screenShotCutDom?.src
    const targetCanvas = canvasDom
    if (!position || !source || !targetCanvas) {
        return Promise.reject(new Error("Screenshot area has not been selected"))
    }

    const { x1, y1, w, h } = position
    return new Promise<boolean>((resolve, reject) => {
        const context = targetCanvas.getContext("2d")!
        const image = new Image()
        image.crossOrigin = "anonymous"

        image.onload = () => {
            try {
                const dpr = window.devicePixelRatio || 1
                targetCanvas.width = Math.max(1, Math.round(w * dpr))
                targetCanvas.height = Math.max(1, Math.round(h * dpr))
                targetCanvas.style.width = `${w}px`
                targetCanvas.style.height = `${h}px`
                context.setTransform(1, 0, 0, 1, 0, 0)
                context.scale(dpr, dpr)

                const scaleX = originalContainerW > 0 ? image.naturalWidth / originalContainerW : 1
                const scaleY = originalContainerH > 0 ? image.naturalHeight / originalContainerH : 1
                context.drawImage(
                    image,
                    x1 * scaleX,
                    y1 * scaleY,
                    w * scaleX,
                    h * scaleY,
                    0,
                    0,
                    w,
                    h
                )

                const imageUrl = targetCanvas.toDataURL("image/png", 1)
                const cacheImage = new Image()
                cacheImage.crossOrigin = "anonymous"
                cacheImage.onload = () => {
                    addCanvasData(1, getRectAreaData(0, 0, w, h), {
                        drawType: 7,
                        isSelected: 0,
                        drawData: { x: 0, y: 0, w, h, imageUrl }
                    })
                    updateImageCacheSet(imageUrl, cacheImage)

                    const editBox = document.createElement("div")
                    editBox.className = "bupu-screen-edit"
                    editBox.style.width = `${w}px`
                    editBox.style.height = `${h}px`
                    editBox.style.left = `${x1}px`
                    editBox.style.top = `${y1}px`

                    domAppendChild(overlayDom!, [selectRangeDom!])
                    domAppendChild(editBox, [canvasDom!, temporaryCanvasDom!, overlayDom!])
                    containerDom!.replaceChild(editBox, screenShotOverlayDom!)
                    containerDom = editBox
                    stage = "edit"
                    observeCanvasResolution(editBox)
                    resolve(true)
                }
                cacheImage.onerror = () => reject(new Error("Screenshot result image load failed"))
                cacheImage.src = imageUrl
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)))
            }
        }
        image.onerror = () => reject(new Error("Screenshot source image load failed"))
        image.src = source
    })
}

/** 将图片缩放至填满容器，保证自然尺寸与容器一致 → 坐标 1:1 对应 */
function scaleImageToFit(imageUrl: string, containerWidth: number, containerHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = "anonymous"

        image.onload = () => {
            try {
                const dpr = window.devicePixelRatio || 1
                const canvas = document.createElement("canvas")
                canvas.width = Math.max(1, Math.round(containerWidth * dpr))
                canvas.height = Math.max(1, Math.round(containerHeight * dpr))
                const context = canvas.getContext("2d")!
                context.scale(dpr, dpr)

                const scale = Math.max(containerWidth / image.naturalWidth, containerHeight / image.naturalHeight)
                const width = image.naturalWidth * scale
                const height = image.naturalHeight * scale
                context.drawImage(
                    image,
                    (containerWidth - width) / 2,
                    (containerHeight - height) / 2,
                    width,
                    height
                )
                resolve(canvas.toDataURL("image/jpeg", 0.92))
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)))
            }
        }
        image.onerror = () => reject(new Error(`Image load failed: ${imageUrl}`))
        image.src = imageUrl
    })
}

export function initScreenShot(dom: HTMLElement, options: ScreenShotOptions): ScreenShotInstance {
    unmountScreenShot()
    mountDom = dom
    initDomData()
    updateScreenShotVar(options)
    stage = "select"
    currentImageUrl = options.imageUrl

    const toolbarContainer = document.createElement("div")
    toolbarContainer.className = options.toolbarPosition === "top" || options.toolbarPosition === "bottom"
        ? "bupu-screen-toolbar bupu-toolbar-horizontal"
        : "bupu-screen-toolbar bupu-toolbar-vertical"

    const toolbarActions = document.createElement("div")
    toolbarActions.className = "bupu-toolbar-content"
    const toolbarStatus = document.createElement("div")
    toolbarStatus.className = "bupu-toolbar-content"
    domAppendChild(toolbarActions, [writeDom!, drawDom!, textDom!])
    domAppendChild(toolbarStatus, [undoDom!, exitDom!, successDom!])
    domAppendChild(toolbarContainer, [toolbarActions, toolbarStatus])

    screenShotToolbarDom = toolbarContainer
    screenShotBackgroundDom = renderScreenShotBackground()
    screenShotCutDom = renderScreenShotCut()
    selectRangeDom = renderSelectRange()
    screenShotSelectRangeDom = renderScreenShotSelectRange([screenShotCutDom!, canvasDom!, temporaryCanvasDom!])

    domAppendChild(screenShotOverlayDom!, [screenShotSelectRangeDom!])
    domAppendChild(containerDom!, [screenShotBackgroundDom!, screenShotOverlayDom!, screenShotToolbarDom!])
    containerDom!.style.background = "#000"
    dom.appendChild(containerDom!)

    originalContainerW = containerDom!.clientWidth
    originalContainerH = containerDom!.clientHeight
    syncBackgroundImageSize()

    resizeController?.abort()
    resizeController = new AbortController()
    window.addEventListener("resize", () => {
        syncBackgroundImageSize()
    }, { signal: resizeController.signal })

    scaleImageToFit(currentImageUrl, originalContainerW, originalContainerH)
        .then(scaledUrl => {
            if (stage != "select" || !screenShotBackgroundDom || !screenShotCutDom) return
            screenShotBackgroundDom.src = scaledUrl
            screenShotCutDom.src = scaledUrl
            screenShotDataSet.imageUrl = scaledUrl
        })
        .catch(error => {
            console.error("z-board screenshot image failed:", error)
            message({
                type: "error",
                text: "截图图片加载失败，请检查地址或跨域配置",
                zIndex: 999
            })
            screenShotDataSet.exitHandler?.()
        })

    getScreenShotCanvasObject(canvasDom!, temporaryCanvasDom!)
    getCanvasObject(canvasDom!, temporaryCanvasDom!)
    updateCanvasResolution(originalContainerW, originalContainerH, true)
    eventBinding()
    bindToolEvents()
    selectDrawRect()

    return {
        unmount: unmountScreenShot
    }
}

export function unmountScreenShot(): void {
    eventController?.abort()
    eventController = null
    resizeController?.abort()
    resizeController = null
    resolutionResizeController?.abort()
    resolutionResizeController = null
    resetScreenShotSelection()

    if (mountDom) {
        mountDom.innerHTML = ""
    }

    resetEventBindings()
    const tooltipList = document.getElementsByClassName("bupu-tooltip")
    const popoverList = document.getElementsByClassName("bupu-popover")
    for (let index = tooltipList.length - 1; index >= 0; index--) {
        tooltipList[index].parentElement?.removeChild(tooltipList[index])
    }
    for (let index = popoverList.length - 1; index >= 0; index--) {
        popoverList[index].parentElement?.removeChild(popoverList[index])
    }

    resetToolbarData()
    resetScreenShotData()
    stage = "select"
    currentImageUrl = ""
}
