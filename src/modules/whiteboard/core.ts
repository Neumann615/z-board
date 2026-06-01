import type { WriteOptions, DrawOptions, TextOptions, WhiteBoardOptions } from '../../types'

import {
    renderAddPage,
    renderCanvas,
    renderContainer,
    renderDeletePage,
    renderDraw,
    renderEraser,
    renderImage,
    renderMoveToolbar,
    renderOpenFile,
    renderOverlay,
    renderPagination,
    renderPointer,
    renderRedo,
    renderReset,
    renderSave,
    renderSelectRange,
    renderTemporaryCanvas,
    renderText,
    renderUndo,
    renderWrite
} from "./render"
import {
    changeIsSelected,
    domAppendChild
} from "../../utils/index"
import {
    updateWhiteBoardVar,
    whiteBoardDataSet
} from "../../utils/var"
import {
    addPage,
    changeNowPageIndex,
    clearTemporaryCanvas,
    deletePage,
    draw,
    eraser,
    getCanvasObject,
    image,
    openFile,
    pointer,
    redo,
    redrawByResolution,
    reset,
    save,
    setBottom,
    setTop,
    text,
    undo,
    write,
    resetToolbarData
} from "./toolbar"
import {
    bindDrawEvents,
    bindTextEvents,
    bindWriteEvents,
    resetEventBindings
} from "/src/modules/common/eventBinding"
import eraserIco from "/src/assets/image/eraser.ico"
import iIco from "/src/assets/image/I.ico"
import pencilIco from "/src/assets/image/pencil.ico"
import plusIco from "/src/assets/image/plus.ico"

let canvasDom: HTMLCanvasElement | null = null
let temporaryCanvasDom: HTMLCanvasElement | null = null
let imageDom: HTMLDivElement | null = null
let pointerDom: HTMLDivElement | null = null
let writeDom: HTMLDivElement | null = null
let drawDom: HTMLDivElement | null = null
let textDom: HTMLDivElement | null = null
let undoDom: HTMLDivElement | null = null
let redoDom: HTMLDivElement | null = null
let eraserDom: HTMLDivElement | null = null
let addPageDom: HTMLDivElement | null = null
let deletePageDom: HTMLDivElement | null = null
let resetDom: HTMLDivElement | null = null
let saveDom: HTMLDivElement | null = null
let openFileDom: HTMLDivElement | null = null
let paginationDom: HTMLDivElement | null = null
let mountDom: HTMLElement | null = null
let toolbarDom: HTMLDivElement | null = null
export let containerDom: HTMLDivElement | null = null
export let overlayDom: HTMLDivElement | null = null
export let selectRangeDom: HTMLDivElement | null = null
export let moveToolbarDom: HTMLDivElement | null = null
export let canvasResolution: { w: number; h: number } = { w: 0, h: 0 }

let writeOptions: WriteOptions
let drawOptions: DrawOptions
let textOptions: TextOptions

function initDomData(): void {
    canvasDom = renderCanvas()
    temporaryCanvasDom = renderTemporaryCanvas()
    imageDom = renderImage()
    pointerDom = renderPointer()
    writeDom = renderWrite()
    drawDom = renderDraw()
    textDom = renderText()
    undoDom = renderUndo()
    redoDom = renderRedo()
    eraserDom = renderEraser()
    addPageDom = renderAddPage()
    deletePageDom = renderDeletePage()
    resetDom = renderReset()
    saveDom = renderSave()
    openFileDom = renderOpenFile()
    paginationDom = renderPagination()
    toolbarDom = null
    containerDom = renderContainer()
    overlayDom = renderOverlay()
    selectRangeDom = null
    moveToolbarDom = renderMoveToolbar()
    canvasResolution = { w: 0, h: 0 }

    writeOptions = {
        lineType: 0,
        lineWidth: 2,
        color: whiteBoardDataSet.colorList[0]
    }

    drawOptions = {
        shapeType: 0,
        lineWidth: 2,
        color: whiteBoardDataSet.colorList[0]
    }

    textOptions = {
        fontSize: 15,
        font: "15px Arial",
        color: whiteBoardDataSet.colorList[0]
    }
}

function eventBinding(): void {
    const toolbarEventDom: (HTMLDivElement | null)[] = [pointerDom, writeDom, drawDom, textDom, eraserDom]
    toolbarDom?.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        clearTemporaryCanvas()
        switch (e.target?.id) {
            case 'toolbar-image': {
                const fileInput1 = document.createElement("input")
                fileInput1.type = "file"
                fileInput1.accept = "image/*"
                fileInput1.click()
                fileInput1.onchange = (event: Event) => {
                    const target = event.target as HTMLInputElement
                    if (target.files && target.files[0]) {
                        image(target.files[0], () => {
                            pointerDom?.click()
                            setTimeout(() => {
                                const evt = document.createEvent("MouseEvents")
                                evt.initMouseEvent("mousedown", true, true, window, 0, 0, 0, canvasResolution.w / 2, canvasResolution.h / 2, false, false, false, false, 0, null)
                                overlayDom?.dispatchEvent(evt)
                                evt.initMouseEvent("mouseup", true, true, window, 0, 0, 0, canvasResolution.w / 2, canvasResolution.h / 2, false, false, false, false, 0, null)
                                overlayDom?.dispatchEvent(evt)
                            }, 200)
                        })
                    }
                }
                break
            }
            case "toolbar-pointer":
                canvasDom!.style.cursor = "initial"
                temporaryCanvasDom!.style.cursor = "initial"
                changeIsSelected(toolbarEventDom.filter(Boolean) as HTMLCollectionOf<Element>, pointerDom!)
                pointer()
                break
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
            case "toolbar-undo":
                undo()
                break
            case "toolbar-redo":
                redo()
                break
            case "toolbar-eraser":
                canvasDom!.style.cursor = `url(${eraserIco}),default`
                changeIsSelected(toolbarEventDom.filter(Boolean) as HTMLCollectionOf<Element>, eraserDom!)
                eraser()
                break
            case "toolbar-open-file": {
                const fileInput2 = document.createElement("input")
                fileInput2.type = "file"
                fileInput2.accept = "*"
                fileInput2.click()
                fileInput2.onchange = (event: Event) => {
                    const target = event.target as HTMLInputElement
                    if (target.files && target.files[0]) {
                        openFile(target.files[0])
                    }
                }
                break
            }
            case "toolbar-add-page":
                addPage()
                break
            case "toolbar-delete-page":
                deletePage()
                break
            case "toolbar-reset":
                reset()
                break
            case "toolbar-save":
                save()
                break
            case "toolbar-pagination-prev":
                changeNowPageIndex(-1)
                break
            case "toolbar-pagination-next":
                changeNowPageIndex(1)
                break
        }
    })

    moveToolbarDom?.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        switch (e.target?.id) {
            case "move-toolbar-top":
                setTop()
                break
            case "move-toolbar-bottom":
                setBottom()
                break
        }
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
        pointerDom?.click()
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

export function initWhiteBoard(dom: HTMLElement, options?: WhiteBoardOptions): void {
    mountDom = dom
    unmountWhiteBoard()
    initDomData()

    if (options) {
        updateWhiteBoardVar(options)
    }

    selectRangeDom = renderSelectRange()

    const toolbarContainer = document.createElement("div")
    toolbarContainer.className = "bupu-toolbar"
    const toolbarContainerChild1 = document.createElement("div")
    toolbarContainerChild1.className = "bupu-toolbar-child bupu-toolbar-vertical"

    const toolbarContent1 = document.createElement("div")
    toolbarContent1.className = "bupu-toolbar-content"
    domAppendChild(toolbarContent1, [imageDom!, pointerDom!, writeDom!, drawDom!, textDom!])

    const toolbarContent2 = document.createElement("div")
    toolbarContent2.className = "bupu-toolbar-content"
    domAppendChild(toolbarContent2, [undoDom!, redoDom!, eraserDom!])

    const toolbarContent3 = document.createElement("div")
    toolbarContent3.className = "bupu-toolbar-content"
    domAppendChild(toolbarContent3, [addPageDom!, deletePageDom!, resetDom!, saveDom!])

    domAppendChild(toolbarContainerChild1, [toolbarContent1, toolbarContent2, toolbarContent3])
    domAppendChild(toolbarContainer, [toolbarContainerChild1, paginationDom!])
    toolbarDom = toolbarContainer

    domAppendChild(overlayDom!, [selectRangeDom!])
    domAppendChild(containerDom!, [canvasDom!, temporaryCanvasDom!, overlayDom!, moveToolbarDom!])

    dom.appendChild(toolbarDom)
    dom.appendChild(containerDom!)

    eventBinding()
    getCanvasObject(canvasDom!, temporaryCanvasDom!)
    observerCanvasResolution(containerDom!)

    setTimeout(() => {
        temporaryCanvasDom!.style.cursor = `url(${pencilIco}),default`
        canvasDom!.style.cursor = `url(${pencilIco}),default`
        changeIsSelected([pointerDom!, writeDom!, drawDom!, textDom!, eraserDom!], writeDom!)
        write(writeOptions)
    }, 500)
}

export function unmountWhiteBoard(): void {
    if (mountDom) {
        mountDom.innerHTML = ""
        resetToolbarData()
        resetEventBindings()
        const tooltipList = document.getElementsByClassName("bupu-tooltip")
        const popoverList = document.getElementsByClassName("bupu-popover")
        for (let i = tooltipList.length - 1; i >= 0; i--) {
            tooltipList[i].parentElement?.removeChild(tooltipList[i])
        }
        for (let i = popoverList.length - 1; i >= 0; i--) {
            popoverList[i].parentElement?.removeChild(popoverList[i])
        }
    }
}