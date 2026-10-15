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

import html2canvas from "../../html2canvas.esm"
import type {
    CanvasOperationItem as CanvasDataItem,
    CanvasOperationOptions as CanvasOptions,
    CanvasPage as CanvasHistoryItem,
    Point,
    RectAreaData
} from "../../types"

function getTargetClassName(event: MouseEvent | TouchEvent): string {
    const target = event.target as HTMLElement | null
    return target?.className ?? ""
}

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
    if (selectIndex) {
        nowSelectIndex = selectIndex
    }
    let rect = getRectAreaData(x1, y1, x2, y2)
    moveToolbarDom!.style.left = rect.x2 + 20 + "px"
    moveToolbarDom!.style.top = rect.y2 - 10 + "px"
    selectRangeDom!.style.left = rect.x1 + "px"
    selectRangeDom!.style.top = rect.y1 + "px"
    selectRangeDom!.style.width = Math.abs(rect.x1 - rect.x2) + "px"
    selectRangeDom!.style.height = Math.abs(rect.y1 - rect.y3) + "px"
}

//清除选中状态
function clearSelect(): void {
    nowSelectIndex = -1
    moveToolbarDom!.style.left = -1000 + "px"
    moveToolbarDom!.style.top = -1000 + "px"
    selectRangeDom!.style.left = -1000 + "px"
    selectRangeDom!.style.top = -1000 + "px"
}

//清除主画板
export function clearCanvas(): void {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
}

//清除文本dom元素
export function clearTextDom(): void {
    const arr = document.getElementsByClassName('bupu-edit-box');
    const l = arr.length;
    for (let i = l - 1; i >= 0; i--) {
        if (arr[i] != null) {
            arr[i].parentNode?.removeChild(arr[i]);
        }
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
    overlayDom!.style.zIndex = "-1"
    temporaryCanvas!.style.zIndex = "50"
    clearSelect()
    ctx!.lineWidth = options.lineWidth
    ctx!.strokeStyle = options.color
    temporaryCtx!.lineWidth = options.lineWidth
    temporaryCtx!.strokeStyle = options.color
    let begin: ((event: MouseEvent) => void) | null = null
    let move: ((event: MouseEvent) => void) | null = null
    let end: (() => void) | null = null
    let mousePress = false
    let last: Point | null = null
    let first: Point | null = null
    let drawData: Point[] = []

    if (options.lineType == 0) {
        let nowControlPoint: Point | null = null
        begin = (event: MouseEvent) => {
            mousePress = true
            first = getPos(event)
            drawData.push(first)
        }

        move = (event: MouseEvent) => {
            if (!mousePress) return
            let xy = getPos(event)
            //添加前过滤掉距离很近的点坐标
            if (Math.sqrt(Math.pow(drawData[drawData.length - 1].x - xy.x, 2) + Math.pow(drawData[drawData.length - 1].y - xy.y, 2)) >= 5) {
                drawData.push(xy)
                if (drawData.length >= 3) {
                    let controlList = drawData.slice(-2)
                    let newControlPoint = {
                        x: (controlList[0].x + controlList[1].x) / 2,
                        y: (controlList[0].y + controlList[1].y) / 2
                    }
                    if (nowControlPoint) {
                        drawCurveLine(temporaryCtx!, {
                            x1: nowControlPoint.x,
                            y1: nowControlPoint.y,
                            x2: controlList[0].x,
                            y2: controlList[0].y,
                            x3: newControlPoint.x,
                            y3: newControlPoint.y
                        })
                    } else {
                        drawCurveLine(temporaryCtx!, {
                            x1: drawData[0].x,
                            y1: drawData[0].y,
                            x2: drawData[1].x,
                            y2: drawData[1].y,
                            x3: newControlPoint.x,
                            y3: newControlPoint.y
                        })
                    }
                    nowControlPoint = newControlPoint
                }
            }
        }

        end = () => {
            clearTemporaryCanvas()
            drawCurveLineByPoints(ctx!, drawData)
            //查找drawData最大区域的四个点坐标
            const rectAreaData = getPointsAreaData(drawData)
            if (!rectAreaData) return
            addCanvasData(1, rectAreaData, {
                drawType: 0,
                isSelected: 1,
                drawData,
                ctxAttributes: {
                    lineWidth: options.lineWidth,
                    strokeStyle: options.color,
                }
            })
            mousePress = false
            nowControlPoint = null
            last = null
            first = null
            drawData = []
        }
    } else if (options.lineType == 1) {

        begin = (event: MouseEvent) => {
            first = getPos(event)
            mousePress = true
        }

        move = (event: MouseEvent) => {
            if (!mousePress) return
            let xy = getPos(event)
            if (first) {
                clearTemporaryCanvas()
                drawLineArrow(temporaryCtx!, [first, xy])
                last = xy
            }
        }
        end = () => {
            if (last && first) {
                const startPoint: Point = first
                clearTemporaryCanvas()
                drawData = [startPoint, last]
                drawLineArrow(ctx!, drawData)
                const rectAreaData = getRectAreaData(startPoint.x, startPoint.y, last.x, last.y)
                addCanvasData(1, rectAreaData, {
                    drawType: 1,
                    drawData,
                    isSelected: 1,
                    ctxAttributes: {
                        lineWidth: options.lineWidth,
                        strokeStyle: options.color
                    }
                })
            }
            mousePress = false
            first = null
            last = null
            drawData = []
        }
    }

    temporaryCanvas!.onmousedown = begin
    temporaryCanvas!.onmousemove = move
    temporaryCanvas!.onmouseup = end
}

//绘制图形
export function draw(options: { color: string; lineWidth: number; shapeType: number }): void {
    overlayDom!.style.zIndex = "-1"
    temporaryCanvas!.style.zIndex = "50"
    clearSelect()
    let shapeType = options.shapeType
    ctx!.strokeStyle = options.color
    ctx!.lineWidth = options.lineWidth
    temporaryCtx!.strokeStyle = options.color
    temporaryCtx!.lineWidth = options.lineWidth
    let drawData: any = null
    let mousePress = false
    let last: Point | null = null
    let first: Point | null = null

    function begin(event: MouseEvent): void {
        mousePress = true
        first = getPos(event)
    }

    function move(event: MouseEvent): void {
        if (!mousePress || !first) return
        last = getPos(event)
        clearTemporaryCanvas()
        temporaryCtx!.beginPath()
        if (shapeType == 0) {
            drawData = {
                x: first.x,
                y: first.y,
                w: last.x - first.x,
                h: last.y - first.y
            }
            drawRect(temporaryCtx!, drawData)
        } else if (shapeType == 1) {
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: first.x,
                y2: last.y,
                x3: last.x,
                y3: last.y
            }
            drawTriangle(temporaryCtx!, drawData)
        } else if (shapeType == 2) {
            drawData = {
                x: (first.x + last.x) / 2,
                y: (first.y + last.y) / 2,
                r: Math.abs(last.x - first.x) / 2
            }
            drawCircle(temporaryCtx!, drawData)
        } else if (shapeType == 3) {
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: last.x,
                y2: (first.y + last.y) / 2,
                x3: (first.x + last.x) / 2,
                y3: last.y,
                x4: first.x,
                y4: (first.y + last.y) / 2
            }
            drawDiamond(temporaryCtx!, drawData)
        }
        temporaryCtx!.closePath()
    }

    function end(event: MouseEvent): void {
        mousePress = false
        clearTemporaryCanvas()
        //修正最小值
        if (!first) return
        if (!last) last = getPos(event)
        if (Math.abs(last.x - first.x) <= 30 && Math.abs(last.y - first.y) <= 30) {
            let nowPos = getPos(event)
            first = {
                x: nowPos.x - 15,
                y: nowPos.y - 15
            }
            last = {
                x: nowPos.x + 15,
                y: nowPos.y + 15
            }
        }
        if (shapeType == 0) {
            let rectAreaData = getRectAreaData(first.x, first.y, last.x, last.y)
            drawData = {
                x: first.x,
                y: first.y,
                w: last.x - first.x,
                h: last.y - first.y
            }
            drawRect(ctx!, drawData)
            addCanvasData(1, rectAreaData, {
                drawType: 2,
                drawData,
                isSelected: 1,
                ctxAttributes: {
                    lineWidth: options.lineWidth,
                    strokeStyle: options.color,
                }
            })
        } else if (shapeType == 1) {
            let rectAreaData = getRectAreaData(first.x, first.y, last.x, last.y)
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: first.x,
                y2: last.y,
                x3: last.x,
                y3: last.y
            }
            drawTriangle(ctx!, drawData)
            addCanvasData(1, rectAreaData, {
                drawType: 3,
                isSelected: 1,
                drawData,
                ctxAttributes: {
                    lineWidth: options.lineWidth,
                    strokeStyle: options.color,
                }
            })
        } else if (shapeType == 2) {
            drawData = {
                x: (first.x + last.x) / 2,
                y: (first.y + last.y) / 2,
                r: Math.abs(last.x - first.x) / 2
            }
            let rectAreaData = getRectAreaData(first.x, (first.y + last.y) / 2 - drawData.r, last.x, (first.y + last.y) / 2 + drawData.r)
            drawCircle(ctx!, drawData)
            addCanvasData(1, rectAreaData, {
                drawType: 4,
                drawData,
                isSelected: 1,
                ctxAttributes: {
                    lineWidth: options.lineWidth,
                    strokeStyle: options.color,
                }
            })
        } else if (shapeType == 3) {
            let rectAreaData = getRectAreaData(first.x, first.y, last.x, last.y)
            drawData = {
                x1: (first.x + last.x) / 2,
                y1: first.y,
                x2: last.x,
                y2: (first.y + last.y) / 2,
                x3: (first.x + last.x) / 2,
                y3: last.y,
                x4: first.x,
                y4: (first.y + last.y) / 2
            }
            drawDiamond(ctx!, drawData)
            addCanvasData(1, rectAreaData, {
                drawType: 5,
                drawData,
                isSelected: 1,
                ctxAttributes: {
                    lineWidth: options.lineWidth,
                    strokeStyle: options.color,
                }
            })
        }
        last = null
        first = null
        drawData = null
    }

    temporaryCanvas!.onmousedown = begin
    temporaryCanvas!.onmousemove = move
    temporaryCanvas!.onmouseup = end
}

//绘制文本框
export function text(options: { font: string; color: string; fontSize: number }): void {
    temporaryCtx!.restore()
    overlayDom!.style.zIndex = "-1"
    temporaryCanvas!.style.zIndex = "50"
    clearSelect()
    clearTemporaryCanvas()
    ctx!.font = options.font
    ctx!.strokeStyle = options.color
    ctx!.fillStyle = options.color
    let mousePress = false
    let last: Point | null = null
    let first: Point | null = null
    let rectAreaData: RectAreaData | null = null

    function begin(event: MouseEvent | TouchEvent): void {
        mousePress = true
        first = getPos(event)
    }

    function end(): void {
        //修正最小值
        if (!first) return
        let editBox = document.createElement("div")
        editBox.contentEditable = "true"
        editBox.className = "bupu-edit-box"
        editBox.style.fontSize = options.fontSize + "px"
        editBox.style.color = options.color
        editBox.style.left = first.x + "px"
        editBox.style.top = first.y + "px"
        editBox.style.maxWidth = `calc(100% - ${first.x}px)`
        editBox.style.maxHeight = `calc(100% - ${first.y}px)`
        containerDom!.appendChild(editBox)
        editBox.focus()
        const textPoint: Point = first
        editBox.onblur = () => {
            clearTemporaryCanvas()
            rectAreaData = getRectAreaData(textPoint.x, textPoint.y, textPoint.x + editBox.clientWidth, textPoint.y + editBox.clientHeight)
            let text = editBox.innerText
            if (text && text.length) {
                addCanvasData(1, rectAreaData, {
                    drawType: 6,
                    text: editBox.innerText,
                    isSelected: 1,
                    style: {
                        fontSize: options.fontSize,
                        left: textPoint.x,
                        top: textPoint.y,
                        color: options.color
                    }
                })
            }
            editBox.style.border = "none"
            editBox.style.padding = "4px"
            editBox.contentEditable = "false"
        }
    }

    function move(event: MouseEvent): void {
        if (!mousePress || !first) return
        last = getPos(event)
    }

    temporaryCanvas!.onmousedown = begin
    temporaryCanvas!.onmousemove = move
    temporaryCanvas!.onmouseup = end
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
