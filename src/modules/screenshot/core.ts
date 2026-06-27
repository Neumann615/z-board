import type { WriteOptions, DrawOptions, TextOptions, ScreenShotOptions } from '../../types'

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
let imageResizeHandler: (() => void) | null = null
let originalContainerW = 0
let originalContainerH = 0

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

function eventBinding(): void {
    const toolbarEventDom: (HTMLDivElement | null)[] = [ writeDom, drawDom, textDom]
    screenShotToolbarDom?.addEventListener("click", (e: MouseEvent) => {
        initScreenShotBackground().then(() => {
            e.stopPropagation()
            e.preventDefault()
            clearTemporaryCanvas()
            switch (e.target?.id) {
                case "toolbar-write":
                    temporaryCanvasDom!.style.cursor = `url(${pencilIco}),default`
                    canvasDom!.style.cursor = `url(${pencilIco}),default`
                    changeIsSelected(toolbarEventDom.filter(Boolean) as HTMLCollectionOf<Element>, writeDom!)
                    write(writeOptions)
                    writeEventBinding()
                    break
                case "toolbar-draw":
                    temporaryCanvasDom!.style.cursor = `url(${plusIco}),default`
                    changeIsSelected(toolbarEventDom.filter(Boolean) as HTMLCollectionOf<Element>, drawDom!)
                    draw(drawOptions)
                    drawEventBinding()
                    break
                case "toolbar-text":
                    temporaryCanvasDom!.style.cursor = `url(${iIco}),default`
                    changeIsSelected(toolbarEventDom.filter(Boolean) as HTMLCollectionOf<Element>, textDom!)
                    text(textOptions)
                    textEventBinding()
                    break
                case "toolbar-save":
                    save()
                    break
                case "toolbar-undo":
                    undo(1)
                    break
                case "toolbar-exit":
                    if (screenShotDataSet.exitHandler) {
                        screenShotDataSet.exitHandler()
                    }
                    break
                case "toolbar-success":
                    success()
                    break
            }
        })
    })
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

function observerCanvasResolution(dom: HTMLElement): void {
    updateCanvasResolution(dom.clientWidth, dom.clientHeight)
    window.addEventListener("resize", () => {
        updateCanvasResolution(dom.clientWidth, dom.clientHeight)
    })
}

function updateCanvasResolution(w: number, h: number): void {
    if (w != canvasResolution.w || h != canvasResolution.h) {
        canvasDom!.width = w
        temporaryCanvasDom!.width = w
        canvasDom!.height = h
        temporaryCanvasDom!.height = h
        canvasResolution.w = w
        canvasResolution.h = h
        redrawByResolution()
    }
}

let initScreenShotBackground = function(): Promise<boolean> {
    return new Promise((resolve) => {
        let { x1, y1, w, h } = screenShotPosition!
        let editBox = document.createElement("div")
        editBox.className = "bupu-screen-edit"
        editBox.style.width = w + "px"
        editBox.style.height = h + "px"
        editBox.style.left = x1 + "px"
        editBox.style.top = y1 + "px"
        let ctx = canvasDom!.getContext("2d")!
        let image = new Image()
        image.crossOrigin = "*"
        let cacheImage = new Image()
        cacheImage.crossOrigin = "*"
        image.src = screenShotCutDom!.src
        image.onload = () => {
            let scaleX = originalContainerW > 0 ? image.naturalWidth / originalContainerW : 1
            let scaleY = originalContainerH > 0 ? image.naturalHeight / originalContainerH : 1
            let sx = x1 * scaleX, sy = y1 * scaleY
            let sw = w * scaleX, sh = h * scaleY
            ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h)
            let imageUrl = canvasDom!.toDataURL("image/png", 1)
            let drawData = { x: 0, y: 0, w, h, imageUrl }
            addCanvasData(1, getRectAreaData(0, 0, w, h), {
                drawType: 7,
                isSelected: 0,
                drawData
            })
            cacheImage.src = imageUrl
            cacheImage.onload = () => {
                updateImageCacheSet(imageUrl, cacheImage)
                resolve(true)
            }
        }
        domAppendChild(overlayDom!, [selectRangeDom!])
        domAppendChild(editBox, [canvasDom!, temporaryCanvasDom!, overlayDom!])
        containerDom!.replaceChild(editBox, screenShotOverlayDom!)
        containerDom = editBox
        observerCanvasResolution(editBox)
        initScreenShotBackground = () => Promise.resolve(true)
    })
}

/** 将图片缩放至填满容器，保证自然尺寸与容器一致 → 坐标 1:1 对应 */
function scaleImageToFit(imageUrl: string, containerW: number, containerH: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const c = document.createElement('canvas')
            c.width = containerW; c.height = containerH
            const ctx = c.getContext('2d')!
            const scale = Math.max(containerW / img.naturalWidth, containerH / img.naturalHeight)
            const dw = img.naturalWidth * scale
            const dh = img.naturalHeight * scale
            ctx.drawImage(img, (containerW - dw) / 2, (containerH - dh) / 2, dw, dh)
            resolve(c.toDataURL('image/jpeg', 0.92))
        }
        img.onerror = reject
        img.src = imageUrl
    })
}

export function initScreenShot(dom: HTMLElement, options: ScreenShotOptions): void {
    mountDom = dom
    initDomData()
    unmountScreenShot()

    if (options) {
        updateScreenShotVar(options)
    }

    let toolbarContainer = document.createElement("div")
    toolbarContainer.className = "bupu-screen-toolbar bupu-toolbar-vertical"
    if (options.toolbarPosition === "top" || options.toolbarPosition === "bottom") {
        toolbarContainer.className = "bupu-screen-toolbar bupu-toolbar-horizontal"
    }

    let toolbarContainerChild1 = document.createElement("div")
    toolbarContainerChild1.className = "bupu-toolbar-content"
    let toolbarContainerChild2 = document.createElement("div")
    toolbarContainerChild2.className = "bupu-toolbar-content"

    domAppendChild(toolbarContainerChild1, [writeDom!, drawDom!, textDom!])
    domAppendChild(toolbarContainerChild2, [undoDom!, exitDom!, successDom!])
    domAppendChild(toolbarContainer, [toolbarContainerChild1, toolbarContainerChild2])

    screenShotToolbarDom = toolbarContainer
    screenShotBackgroundDom = renderScreenShotBackground()
    screenShotCutDom = renderScreenShotCut()
    selectRangeDom = renderSelectRange()
    screenShotSelectRangeDom = renderScreenShotSelectRange([screenShotCutDom!, canvasDom!, temporaryCanvasDom!])

    domAppendChild(screenShotOverlayDom!, [screenShotSelectRangeDom!])
    domAppendChild(containerDom!, [screenShotBackgroundDom!, screenShotOverlayDom!, screenShotToolbarDom!])

    containerDom!.style.background = "#000"
    dom.appendChild(containerDom!)

    // 图片缩放至容器尺寸，保证坐标一一对应
    originalContainerW = containerDom!.clientWidth
    originalContainerH = containerDom!.clientHeight
    imageResizeHandler = () => {
        const w = containerDom!.clientWidth
        const h = containerDom!.clientHeight
        if (w > 0 && h > 0) {
            screenShotBackgroundDom!.style.width = w + "px"
            screenShotBackgroundDom!.style.height = h + "px"
            screenShotCutDom!.style.width = w + "px"
            screenShotCutDom!.style.height = h + "px"
            originalContainerW = w
            originalContainerH = h
        }
    }
    imageResizeHandler()
    window.addEventListener("resize", imageResizeHandler)
    scaleImageToFit(options.imageUrl, originalContainerW, originalContainerH).then((scaledUrl) => {
        screenShotBackgroundDom!.src = scaledUrl
        screenShotCutDom!.src = scaledUrl
        screenShotDataSet.imageUrl = scaledUrl
    })

    getScreenShotCanvasObject(canvasDom!, temporaryCanvasDom!)
    getCanvasObject(canvasDom!, temporaryCanvasDom!)

    eventBinding()

    screenShotBackgroundDom!.addEventListener("mousedown", (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
    })

    containerDom!.addEventListener("dblclick", (e: MouseEvent) => {
        if ((e.target as HTMLElement).className.indexOf("bupu-toolbar") !== -1) return
        if (screenShotDataSet.successHandler) {
            if (screenShotPosition) {
                initScreenShotBackground().then(() => {
                    success()
                })
            } else {
                screenShotDataSet.successHandler && screenShotDataSet.successHandler(options.imageUrl)
            }
        }
        e.stopPropagation()
        e.preventDefault()
    })

    containerDom!.addEventListener("contextmenu", (e: MouseEvent) => {
        if ((e.target as HTMLElement).className === "bupu-overlay") {
            if (screenShotPosition) {
                resetSelect()
            }
        } else if ((e.target as HTMLElement).id === "bupu-select-range") {
        }
        e.stopPropagation()
        e.preventDefault()
    })

    selectDrawRect()
}

export function unmountScreenShot(): void {
    if (mountDom) {
        mountDom.innerHTML = ""
        if (imageResizeHandler) {
            window.removeEventListener("resize", imageResizeHandler)
            imageResizeHandler = null
        }
        resetEventBindings()
        let tooltipList = document.getElementsByClassName("bupu-tooltip")
        let popoverList = document.getElementsByClassName("bupu-popover")
        for (let i = tooltipList.length - 1; i >= 0; i--) {
            tooltipList[i].parentElement?.removeChild(tooltipList[i])
        }
        for (let i = popoverList.length - 1; i >= 0; i--) {
            popoverList[i].parentElement?.removeChild(popoverList[i])
        }
        resetToolbarData()
        resetScreenShotData()

        initScreenShotBackground = function (): Promise<boolean> {
            return new Promise((resolve) => {
                let { x1, y1, w, h } = screenShotPosition!
                let editBox = document.createElement("div")
                editBox.className = "bupu-screen-edit"
                editBox.style.width = w + "px"
                editBox.style.height = h + "px"
                editBox.style.left = x1 + "px"
                editBox.style.top = y1 + "px"
                let ctx = canvasDom!.getContext("2d")!
                let image = new Image()
                image.crossOrigin = "*"
                let cacheImage = new Image()
                cacheImage.crossOrigin = "*"
                image.src = screenShotCutDom!.src
                image.onload = () => {
                    let scaleX = originalContainerW > 0 ? image.naturalWidth / originalContainerW : 1
                    let scaleY = originalContainerH > 0 ? image.naturalHeight / originalContainerH : 1
                    let sx = x1 * scaleX, sy = y1 * scaleY
                    let sw = w * scaleX, sh = h * scaleY
                    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h)
                    let imageUrl = canvasDom!.toDataURL("image/png", 1)
                    let drawData = { x: 0, y: 0, w, h, imageUrl }
                    addCanvasData(1, getRectAreaData(0, 0, w, h), {
                        drawType: 7,
                        isSelected: 0,
                        drawData
                    })
                    cacheImage.src = imageUrl
                    cacheImage.onload = () => {
                        updateImageCacheSet(imageUrl, cacheImage)
                        resolve(true)
                    }
                }
                domAppendChild(overlayDom!, [selectRangeDom!])
                domAppendChild(editBox, [canvasDom!, temporaryCanvasDom!, overlayDom!])
                containerDom!.replaceChild(editBox, screenShotOverlayDom!)
                containerDom = editBox
                observerCanvasResolution(editBox)
                initScreenShotBackground = () => Promise.resolve(true)
            })
        }
    }
}