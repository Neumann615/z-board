import { canvasResolution, containerDom, overlayDom } from "./core"
import { screenShotDataSet } from "/src/utils/index"
import { HistoryAction } from "/src/modules/common/history"
import { CanvasHistoryStore } from "/src/modules/common/canvasHistoryStore"
import { renderHistoryOperation } from "/src/modules/common/renderOperation"
import { downloadDataUrl, exportHTMLElementAsPng } from "/src/modules/common/exportCanvas"

import {
    createDrawTool,
    createTextTool,
    createWriteTool,
    type CanvasToolContext
} from "/src/modules/common/canvasTools"
import { clearEditableText, clearSelectionFrame } from "/src/modules/common/selection"

import html2canvas from "../../html2canvas.esm"
import type {
    CanvasOperationItem as CanvasDataItem,
    CanvasOperationOptions as CanvasOptions,
    RectAreaData
} from "../../types"

const historyStore = new CanvasHistoryStore(1)
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let temporaryCanvas: HTMLCanvasElement | null = null
let temporaryCtx: CanvasRenderingContext2D | null = null
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
export function addCanvasData(actionType: number, position: RectAreaData, options: CanvasOptions): CanvasDataItem {
    if (!position) {
        throw new Error("Canvas operation position is required")
    }

    return historyStore.append(actionType, position, options, canvasResolution)
}


function clearTextDom(): void {
    clearEditableText()
}

function clearAnnotationSelection(): void {
    clearSelectionFrame({
        moveToolbar: document.createElement("div"),
        selectRange: document.createElement("div")
    })
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
        clearSelection: clearAnnotationSelection
    }
}

//撤销。截图历史中的第 0 步是底图，不允许撤掉。
export async function undo(minimumStep = 1): Promise<void> {
    const minimum = Math.max(0, minimumStep)
    if (!historyStore.undo(minimum)) return

    clearCanvas()
    clearTextDom()
    await restoreArtBoardState(historyStore.resolveActive(canvasResolution))
}

//画板分辨率变化时重新绘制
export function redrawByResolution(): void {
    if (ctx) {
        void restoreArtBoardState(historyStore.resolveActive(canvasResolution))
    }
}

async function exportScreenEdit(): Promise<string | null> {
    const target = document.getElementsByClassName("bupu-screen-edit")[0]
    if (!(target instanceof HTMLElement)) return null
    try {
        return await exportHTMLElementAsPng(target, html2canvas)
    } catch (error) {
        console.error("z-board screenshot export failed:", error)
        return null
    }
}

//导出画板内容
export async function save(): Promise<void> {
    const dataUrl = await exportScreenEdit()
    if (dataUrl) downloadDataUrl(dataUrl, `z-board-${Date.now()}.png`)
}

//成功的回调
export async function success(): Promise<void> {
    const successHandler = screenShotDataSet.successHandler
    if (!successHandler) return
    const dataUrl = await exportScreenEdit()
    if (dataUrl) successHandler(dataUrl)
}

//重置
export function resetToolbarData(): void {
    historyStore.reset()
}
