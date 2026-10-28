import message from "msg-alert"
import html2canvas from "../../html2canvas.esm"
import type {
    CanvasHistoryItem,
    CanvasOperationOptions as CanvasOptions,
    CanvasPage,
    DrawOptions,
    RectAreaData,
    TextOptions,
    WhiteBoardOptions,
    WriteOptions
} from '../../types'
import {
    canvasResolution,
    containerDom,
    moveToolbarDom,
    overlayDom,
    selectRangeDom
} from "./core"
import {
    updatePaginationText
} from "./render"
import {
    fileToUrl,
    getPos,
    getRectAreaData,
    isInRectArea,
    whiteBoardDataSet
} from "/src/utils/index"
import {
    createDrawTool,
    createTextTool,
    createWriteTool,
    type CanvasToolContext
} from "/src/modules/common/canvasTools"
import { HistoryAction } from "/src/modules/common/history"
import { renderHistoryOperation } from "/src/modules/common/renderOperation"
import {
    clearEditableText,
    clearSelectionFrame,
    updateSelectionFrame
} from "/src/modules/common/selection"
import { activatePointerTool, resetPointerTool } from "./pointerTool"
import { WhiteboardHistoryStore } from "./whiteboardHistoryStore"

const historyStore = new WhiteboardHistoryStore()
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let temporaryCanvas: HTMLCanvasElement | null = null
let temporaryCtx: CanvasRenderingContext2D | null = null
let nowSelectIndex = -1

export function resetToolbarData(): void {
    resetPointerTool()
    unbindKeyboardEvents()
    historyStore.reset()
    nowSelectIndex = -1
}

//图片缓存集合
let imageCacheSet = new Map<string, HTMLImageElement>()

//全局键盘事件只随白板实例挂载/卸载
let keyboardEventController: AbortController | null = null

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

function handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return

    //清除选中框的元素
    if (nowSelectIndex != -1 && event.key == "Backspace") {
        event.preventDefault()
        addCanvasData(-1, {} as RectAreaData, {
            deleteIndex: nowSelectIndex
        })
        restoreArtBoardState(historyStore.activeContent(canvasResolution))
        clearSelect()
        return
    }
    //撤销
    if (event.key == "ArrowLeft") {
        event.preventDefault()
        undo()
    }
    //翻到上一页
    else if (event.key == "ArrowUp") {
        event.preventDefault()
        changeNowPageIndex(-1)
    }
    //反撤销
    else if (event.key == "ArrowRight") {
        event.preventDefault()
        redo()
    }
    //翻到下一页
    else if (event.key == "ArrowDown") {
        event.preventDefault()
        changeNowPageIndex(1)
    }
}

function bindKeyboardEvents(): void {
    if (keyboardEventController) keyboardEventController.abort()
    keyboardEventController = new AbortController()
    window.addEventListener("keydown", handleKeyboardEvent, {
        signal: keyboardEventController.signal
    })
}

function unbindKeyboardEvents(): void {
    keyboardEventController?.abort()
    keyboardEventController = null
}

//更新图片缓存集合
export function updateImageCacheSet(imageUrl: string, imageElement: HTMLImageElement): void {
    if (imageCacheSet.has(imageUrl)) return
    imageCacheSet.set(imageUrl, imageElement)
}

//添加canvas操作历史
//actionType
//1添加 0移动 -1删除 2置顶 -2置底 3拉伸
export function addCanvasData(actionType: number, position: RectAreaData, options: CanvasOptions, pageIndex?: number): void {
    if (!position) return
    historyStore.append(actionType, position, options, canvasResolution, pageIndex)
    notifyCanvasHistory()
}

//绘制选中框
function drawSelect(x1: number, y1: number, x2: number, y2: number, selectIndex?: number): void {
    if (selectIndex !== undefined) {
        nowSelectIndex = selectIndex
    }
    updateSelectionFrame({
        moveToolbar: moveToolbarDom!,
        selectRange: selectRangeDom!
    }, x1, y1, x2, y2)
}

function clearSelect(): void {
    nowSelectIndex = -1
    clearSelectionFrame({
        moveToolbar: moveToolbarDom!,
        selectRange: selectRangeDom!
    })
}

function clearTextDom(): void {
    clearEditableText()
}

//清除主画板
export function clearCanvas(): void {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
}

//清除临时画板
export function clearTemporaryCanvas(): void {
    if (temporaryCtx && temporaryCanvas) {
        temporaryCtx.clearRect(0, 0, temporaryCanvas.width, temporaryCanvas.height)
    }
}

//获取画板对象的数据
export function getCanvasObject(canvas1: HTMLCanvasElement, temporaryCanvas1: HTMLCanvasElement): void {
    canvas = canvas1
    temporaryCanvas = temporaryCanvas1
    ctx = canvas1.getContext("2d")
    temporaryCtx = temporaryCanvas1.getContext("2d")
    bindKeyboardEvents()
    //初始化默认分页
    updatePaginationText(`${historyStore.activePageIndex + 1}/${historyStore.pageCount}`)
}

//更新绘画历史并重新绘制
export function updateCanvasHistory(v: {
    canvasHistory: CanvasPage[]
    nowPageIndex: number
    allPageNumber: number
}): void {
    historyStore.replace(v)
    updatePaginationText(`${historyStore.activePageIndex + 1}/${historyStore.pageCount}`)
    restoreArtBoardState(historyStore.activeContent(canvasResolution))
}

//画板分辨率变化时重新绘制
export function redrawByResolution(): void {
    if (ctx) {
        restoreArtBoardState(historyStore.activeContent(canvasResolution))
    }
}

//恢复画板状态
export async function restoreArtBoardState(canvasDataContent: CanvasHistoryItem[]): Promise<void> {
    if (!ctx) return
    clearCanvas()
    clearTextDom()
    ctx.save()
    for (const canvasData of canvasDataContent) {
        await renderHistoryOperation(ctx, canvasData, {
            container: containerDom!,
            imageCache: imageCacheSet,
            saveImage: updateImageCacheSet
        })
    }
    ctx.restore()
}

//插入图片
export async function image(file: File, handler?: () => void): Promise<void> {
    let image = new Image()
    image.crossOrigin = "*"
    let imageUrl = ""
    //自定义上传
    if (whiteBoardDataSet.uploadImageHandler) {
        imageUrl = await whiteBoardDataSet.uploadImageHandler(file)
    } else {
        imageUrl = await fileToUrl(file)
    }
    image.src = imageUrl
    image.onload = () => {
        let x = (canvas!.width - image.width / 2) / 2
        let y = (canvas!.height - image.height / 2) / 2
        ctx!.drawImage(image, x, y, image.width / 2, image.height / 2)
        updateImageCacheSet(imageUrl, image)
        addCanvasData(1, getRectAreaData(x, y, x + image.width / 2, y + image.height / 2), {
            drawType: 7,
            isSelected: 1,
            drawData: {
                x,
                y,
                w: image.width / 2,
                h: image.height / 2,
                imageUrl
            }
        })
        handler && handler()
    }
}

//指针
export function pointer(): void {
    activatePointerTool({
        overlay: overlayDom!,
        temporaryCanvas: temporaryCanvas!,
        resolution: () => canvasResolution,
        historyContent: () => historyStore.activeContent(canvasResolution),
        setSelectedIndex: index => {
            nowSelectIndex = index
        },
        updateSelection: (x1, y1, x2, y2, selectIndex) => {
            drawSelect(x1, y1, x2, y2, selectIndex)
        },
        clearSelection: clearSelect,
        addOperation: (actionType, position, options) => {
            addCanvasData(actionType, position, options)
        },
        refresh: () => restoreArtBoardState(historyStore.activeContent(canvasResolution))
    })
}

//线段绘制
export function write(options: WriteOptions): void {
    resetPointerTool()
    createWriteTool(createToolContext(), options)
}

//绘制图形
export function draw(options: DrawOptions): void {
    resetPointerTool()
    createDrawTool(createToolContext(), options)
}

//绘制文本框
export function text(options: TextOptions): void {
    resetPointerTool()
    createTextTool(createToolContext(), options)
}

function createToolContext(): CanvasToolContext {
    return {
        ctx: ctx!,
        temporaryCtx: temporaryCtx!,
        overlay: overlayDom!,
        temporaryCanvas: temporaryCanvas!,
        container: containerDom!,
        addOperation: (position, options) => addCanvasData(HistoryAction.add, position, options),
        clearTemporaryCanvas,
        clearSelection: clearSelect
    }
}

//撤销
export function undo(setStep?: number): void {
    const rollbackStep = setStep ?? 0
    if (!historyStore.undo(rollbackStep)) {
        message({
            type: "warn",
            text: "无法撤销",
            zIndex: 999
        })
        return
    }

    clearSelect()
    clearCanvas()
    clearTextDom()
    restoreArtBoardState(historyStore.contentThroughStep())
    notifyCanvasHistory()
}

//反撤销
export function redo(): void {
    if (!historyStore.redo()) {
        message({
            type: "warn",
            text: "已经是最新记录了",
            zIndex: 999
        })
        return
    }

    clearSelect()
    clearCanvas()
    clearTextDom()
    restoreArtBoardState(historyStore.contentThroughStep())
    notifyCanvasHistory()
}

function notifyCanvasHistory(): void {
    whiteBoardDataSet.addCanvasHistoryHandler?.(historyStore.snapshot)
}

//橡皮擦
export function eraser(): void {
    resetPointerTool()
    overlayDom!.style.zIndex = "-1"
    temporaryCanvas!.style.zIndex = "-1"
    clearSelect()
    clearTemporaryCanvas()
    let mousePress = false
    let last: { x: number; y: number } | null = null
    let changeIndex = -1
    let selectAreaData: CanvasHistoryItem | null = null

    function begin(): void {
        mousePress = true
    }

    function move(event: MouseEvent | TouchEvent): void {
        if (!mousePress) return
        let xy = getPos(event)
        if (last != null) {
            if (historyStore.operationCount) {
                let list: CanvasHistoryItem[] = []
                let canvasData = historyStore.activeContent(canvasResolution)
                canvasData.forEach((item) => {
                    let {
                        position
                    } = item
                    if (isInRectArea(position.x1, position.y1, position.x3, position.y3, xy.x, xy.y)) {
                        list.push(item)
                        changeIndex = item.index
                    }
                })
                //由于是堆叠在上面 因此取最后一个即可
                if (list.length) {
                    selectAreaData = list[list.length - 1]
                    addCanvasData(-1, {} as RectAreaData, {
                        deleteIndex: changeIndex
                    })
                    restoreArtBoardState(historyStore.activeContent(canvasResolution))
                }
                selectAreaData = null
                changeIndex = -1
            }
        }
        last = xy
    }

    function end(): void {
        mousePress = false
        last = null
    }

    canvas!.onmousedown = begin
    canvas!.onmousemove = move
    canvas!.onmouseup = end
    canvas!.ontouchstart = begin
    canvas!.ontouchmove = move
    canvas!.ontouchend = end
}

//打开页面
export async function openFile(file: File): Promise<void> {
    if (!whiteBoardDataSet.uploadFileHandler) {
        message({
            type: "warn",
            text: "请先配置 uploadFileHandler",
            zIndex: 999
        })
        return
    }
    message({
        type: "info",
        text: "文件打开中...",
        zIndex: 999,
        duration: 0
    })
    let imageList: string[]
    try {
        imageList = await whiteBoardDataSet.uploadFileHandler(file)
    } catch (error) {
        console.error("z-board openFile failed:", error)
        message.destroyAll()
        message({
            type: "error",
            text: "文件打开失败",
            zIndex: 999
        })
        return
    }
    message.destroyAll()
    if (!Array.isArray(imageList) || !imageList.length) {
        message({
            type: "warn",
            text: "没有可打开的页面",
            zIndex: 999
        })
        return
    }
    const pages = imageList.map(imageUrl => historyStore.createImagePage(
        imageUrl,
        canvasResolution,
        canvas!.width,
        canvas!.height
    ))
    historyStore.appendPages(pages)
    notifyCanvasHistory()
}

//新加页面
export function addPage(): void {
    if (historyStore.addPage()) {
        updatePaginationText(`${historyStore.activePageIndex + 1}/${historyStore.pageCount}`)
        clearTemporaryCanvas()
        clearCanvas()
        clearSelect()
        notifyCanvasHistory()
    } else {
        message({
            type: "warn",
            text: "最多打开99页",
            zIndex: 999
        })
    }
}

//删除页面
export function deletePage(): void {
    if (historyStore.deletePage()) {
        clearTemporaryCanvas()
        clearCanvas()
        clearSelect()
        clearTextDom()
        updatePaginationText(`${historyStore.activePageIndex + 1}/${historyStore.pageCount}`)
        restoreArtBoardState(historyStore.activeContent(canvasResolution))
        notifyCanvasHistory()
    } else {
        message({
            type: "warn",
            text: "最少保留3页",
            zIndex: 999
        })
    }
}

//重置
export function reset(): void {
    historyStore.resetActivePage()
    clearSelect()
    clearTemporaryCanvas()
    clearCanvas()
    clearTextDom()
    notifyCanvasHistory()
}

//导出画板内容
export function save(): void {
    html2canvas(document.getElementsByClassName("bupu-container")[0] as any).then((canvas: HTMLCanvasElement) => {
        let a = document.createElement("a")
        a.href = canvas.toDataURL("image/png", 1)
        a.download = `z-board-${Date.now()}.png`
        a.click()
    })
}

//切换页面
export function changeNowPageIndex(changeNum: number): void {
    if (historyStore.changePage(changeNum)) {
        clearSelect()
        clearTextDom()
        updatePaginationText(`${historyStore.activePageIndex + 1}/${historyStore.pageCount}`)
        restoreArtBoardState(historyStore.activeContent(canvasResolution))
        notifyCanvasHistory()
    }
}

//置顶
export function setTop(): void {
    if (nowSelectIndex != -1) {
        addCanvasData(HistoryAction.toTop, {} as RectAreaData, {
            topIndex: nowSelectIndex
        })
        clearTemporaryCanvas()
        restoreArtBoardState(historyStore.activeContent(canvasResolution))
    }
}

//置底
export function setBottom(): void {
    if (nowSelectIndex != -1) {
        addCanvasData(HistoryAction.toBottom, {} as RectAreaData, {
            bottomIndex: nowSelectIndex
        })
        clearTemporaryCanvas()
        restoreArtBoardState(historyStore.activeContent(canvasResolution))
    }
}