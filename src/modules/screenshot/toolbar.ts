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
    drawCircle,
    drawCurveLine,
    drawCurveLineByPoints,
    drawDiamond,
    drawLineArrow,
    drawRect,
    drawTriangle,
    getPointsAreaData,
    getPos,
    getRectAreaData,
    isInRectArea,
    screenShotDataSet
} from "/src/utils/index"
import {
    appendHistoryOperation,
    createHistoryPages,
    resolveHistoryContent
} from "/src/modules/common/history"
import { renderHistoryOperation } from "/src/modules/common/renderOperation"
import { downloadDataUrl, exportHTMLElementAsPng } from "/src/modules/common/exportCanvas"

import {
    createDrawTool,
    createTextTool,
    createWriteTool,
    type CanvasToolContext
} from "/src/modules/common/canvasTools"
import { HistoryAction } from "/src/modules/common/history"
import {
    clearEditableText,
    clearSelectionFrame,
    getEventClassName,
    updateSelectionFrame
} from "/src/modules/common/selection"

import html2canvas from "../../html2canvas.esm"
import type {
    CanvasOperationItem as CanvasDataItem,
    CanvasOperationOptions as CanvasOptions,
    CanvasPage as CanvasHistoryItem,
    Point,
    RectAreaData
} from "../../types"

export let canvasHistory: CanvasHistoryItem[] = createHistoryPages(3)
let nowPageIndex = 0
let allPageNumber = 3
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let temporaryCanvas: HTMLCanvasElement | null = null
let temporaryCtx: CanvasRenderingContext2D | null = null
let nowSelectIndex = -1

//图片缓存集合
let imageCacheSet = new Map<string, HTMLImageElement>()

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
    //初始化默认分页
    updatePaginationText(nowPageIndex + 1 + "/" + allPageNumber)
}

//历史记录的canvas纪录列表需要同步处理  结合当前canvas屏幕分辨率进行同步
export function getCanvasDataContent(canvasData: CanvasDataItem[], step?: number): CanvasDataItem[] {
    return resolveHistoryContent(canvasData, canvasResolution, step)
}

//恢复画板状态
export async function restoreArtBoardState(canvasDataContent: CanvasDataItem[]): Promise<void> {
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

//线段绘制
export function write(options: { lineWidth: number; color: string; lineType: number }): void {
    createWriteTool(createToolContext(), options)
}

//绘制图形
export function draw(options: { color: string; lineWidth: number; shapeType: number }): void {
    createDrawTool(createToolContext(), options)
}

//绘制文本框
export function text(options: { font: string; color: string; fontSize: number }): void {
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
    let flag = setStep ? setStep : 0
    if (canvasHistory[nowPageIndex].step >= flag) {
        clearSelect()
        clearCanvas()
        clearTextDom()
        canvasHistory[nowPageIndex].step -= 1
        setTimeout(() => {
            restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData.slice(0, canvasHistory[nowPageIndex].step + 1)))
        }, 0)
    } else {
        // message({
        //     type: "warn",
        //     text: "无法撤销",
        //     zIndex: 999
        // })
    }
}

//画板分辨率变化时重新绘制
export function redrawByResolution(): void {
    if (canvasHistory.length && ctx) {
        clearSelect()
        clearCanvas()
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData))
    }
}

//导出画板内容
export function save(): void {
    const target = document.getElementsByClassName("bupu-screen-edit")[0]
    if (!(target instanceof HTMLElement)) return
    exportHTMLElementAsPng(target, html2canvas).then(dataUrl => {
        if (dataUrl) downloadDataUrl(dataUrl, `z-board-${Date.now()}.png`)
    })
}

//成功的回调
export function success(): void {
    const successHandler = screenShotDataSet.successHandler
    if (successHandler) {
        const target = document.getElementsByClassName("bupu-screen-edit")[0]
        if (!(target instanceof HTMLElement)) return
        exportHTMLElementAsPng(target, html2canvas).then(dataUrl => {
            if (dataUrl) successHandler(dataUrl)
        })
    }
}

//重置
export function resetToolbarData(): void {
    canvasHistory = createHistoryPages(3)
}
