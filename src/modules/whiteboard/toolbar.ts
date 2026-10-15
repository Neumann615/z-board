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
import {
    appendHistoryOperation,
    createHistoryPages,
    getHistoryPageData,
    HistoryAction,
    resolveHistoryContent
} from "/src/modules/common/history"
import { renderHistoryOperation } from "/src/modules/common/renderOperation"
import {
    clearEditableText,
    clearSelectionFrame,
    updateSelectionFrame
} from "/src/modules/common/selection"
import { activatePointerTool, resetPointerTool } from "./pointerTool"

export let canvasHistory: CanvasPage[] = createHistoryPages(3)
let nowPageIndex = 0
let allPageNumber = 3
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let temporaryCanvas: HTMLCanvasElement | null = null
let temporaryCtx: CanvasRenderingContext2D | null = null
let nowSelectIndex = -1

export function resetToolbarData(): void {
    resetPointerTool()
    unbindKeyboardEvents()
    canvasHistory = createHistoryPages(3)
    nowPageIndex = 0
    allPageNumber = 3
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
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData))
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
    appendHistoryOperation(canvasHistory[pageIndex ? pageIndex : nowPageIndex], {
        actionType,
        position,
        options,
        index: canvasHistory[pageIndex ? pageIndex : nowPageIndex].canvasData.length,
        canvasResolution: JSON.parse(JSON.stringify(canvasResolution))
    })
    whiteBoardDataSet.addCanvasHistoryHandler && whiteBoardDataSet.addCanvasHistoryHandler({
        canvasHistory,
        nowPageIndex,
        allPageNumber
    })
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
    updatePaginationText(nowPageIndex + 1 + "/" + allPageNumber)
}

//更新绘画历史并重新绘制
export function updateCanvasHistory(v: { canvasHistory: CanvasPage[], nowPageIndex: number, allPageNumber: number }): void {
    canvasHistory = v.canvasHistory
    nowPageIndex = v.nowPageIndex
    allPageNumber = v.allPageNumber
    let _canvasData = canvasHistory[nowPageIndex].canvasData
    if (canvasHistory[nowPageIndex].canvasData.length - 1 != canvasHistory[nowPageIndex].step) {
        _canvasData = _canvasData.slice(0, canvasHistory[nowPageIndex].step + 1)
    }
    updatePaginationText(nowPageIndex + 1 + "/" + allPageNumber)
    restoreArtBoardState(getCanvasDataContent(_canvasData))
}

//画板分辨率变化时重新绘制
export function redrawByResolution(): void {
    if (canvasHistory.length && ctx) {
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData))
    }
}

//历史记录的canvas纪录列表需要同步处理  结合当前canvas屏幕分辨率进行同步
export function getCanvasDataContent(canvasData: CanvasHistoryItem[], step?: number): CanvasHistoryItem[] {
    return resolveHistoryContent(canvasData, canvasResolution, step)
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
        historyContent: () => getCanvasDataContent(
            canvasHistory[nowPageIndex].canvasData,
            canvasHistory[nowPageIndex].step
        ),
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
        refresh: () => restoreArtBoardState(
            getCanvasDataContent(canvasHistory[nowPageIndex].canvasData)
        )
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
    if (canvasHistory[nowPageIndex].step < rollbackStep) {
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
    canvasHistory[nowPageIndex].step -= 1
    restoreArtBoardState(getHistoryPageData(canvasHistory[nowPageIndex]))
    notifyCanvasHistory()
}

//反撤销
export function redo(): void {
    const page = canvasHistory[nowPageIndex]
    if (page.step >= page.canvasData.length - 1) {
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
    page.step += 1
    restoreArtBoardState(getHistoryPageData(page))
    notifyCanvasHistory()
}

function notifyCanvasHistory(): void {
    whiteBoardDataSet.addCanvasHistoryHandler?.({
        canvasHistory,
        nowPageIndex,
        allPageNumber
    })
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
            if (canvasHistory.length && canvasHistory[nowPageIndex].canvasData.length) {
                let list: CanvasHistoryItem[] = []
                let canvasData = getCanvasDataContent(canvasHistory[nowPageIndex].canvasData, canvasHistory[nowPageIndex].step)
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
                    restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData))
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
    let changePageNum = allPageNumber - nowPageIndex
    let _canvasResolution = JSON.parse(JSON.stringify(canvasResolution))
    imageList.forEach((imageUrl: string) => {
        const page = createHistoryPages(1)[0]
        appendHistoryOperation(page, {
            actionType: HistoryAction.add,
            canvasResolution: _canvasResolution,
            position: getRectAreaData(0, 0, canvas!.width, canvas!.height),
            index: 0,
            options: {
                drawType: 7,
                drawData: {
                    x: 0,
                    y: 0,
                    w: canvas!.width,
                    h: canvas!.height,
                    imageUrl
                }
            }
        })
        canvasHistory.push(page)
        allPageNumber += 1
    })
    changeNowPageIndex(changePageNum)
}

//新加页面
export function addPage(): void {
    if (allPageNumber < 99) {
        allPageNumber++
        nowPageIndex = allPageNumber - 1
        canvasHistory.push(createHistoryPages(1)[0])
        updatePaginationText(nowPageIndex + 1 + "/" + allPageNumber)
        clearTemporaryCanvas()
        clearCanvas()
        clearSelect()
        whiteBoardDataSet.addCanvasHistoryHandler && whiteBoardDataSet.addCanvasHistoryHandler({
            canvasHistory,
            nowPageIndex,
            allPageNumber
        })
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
    if (allPageNumber > 3) {
        canvasHistory.splice(nowPageIndex, 1)
        allPageNumber--
        if (nowPageIndex != 0) {
            nowPageIndex--
        }
        clearTemporaryCanvas()
        clearCanvas()
        clearSelect()
        updatePaginationText(nowPageIndex + 1 + "/" + allPageNumber)
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData, canvasHistory[nowPageIndex].step))
        whiteBoardDataSet.addCanvasHistoryHandler && whiteBoardDataSet.addCanvasHistoryHandler({
            canvasHistory,
            nowPageIndex,
            allPageNumber
        })
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
    canvasHistory[nowPageIndex].canvasData = []
    canvasHistory[nowPageIndex].step = -1
    clearSelect()
    clearCanvas()
    whiteBoardDataSet.addCanvasHistoryHandler && whiteBoardDataSet.addCanvasHistoryHandler({
        canvasHistory,
        nowPageIndex,
        allPageNumber
    })
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
    let flag = nowPageIndex + changeNum
    if (flag >= 0 && flag < allPageNumber) {
        clearSelect()
        clearTextDom()
        nowPageIndex = flag
        updatePaginationText(nowPageIndex + 1 + "/" + allPageNumber)
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData, canvasHistory[nowPageIndex].step))
        whiteBoardDataSet.addCanvasHistoryHandler && whiteBoardDataSet.addCanvasHistoryHandler({
            canvasHistory,
            nowPageIndex,
            allPageNumber
        })
    }
}

//置顶
export function setTop(): void {
    if (nowSelectIndex != -1) {
        addCanvasData(HistoryAction.toTop, {} as RectAreaData, {
            topIndex: nowSelectIndex
        })
        clearTemporaryCanvas()
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData))
    }
}

//置底
export function setBottom(): void {
    if (nowSelectIndex != -1) {
        addCanvasData(HistoryAction.toBottom, {} as RectAreaData, {
            bottomIndex: nowSelectIndex
        })
        clearTemporaryCanvas()
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData))
    }
}