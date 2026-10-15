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
    drawCurveLine,
    drawCurveLineByPoints,
    drawCircle,
    drawDiamond,
    drawLineArrow,
    drawRect,
    drawTriangle,
    fileToUrl,
    getPointsAreaData,
    getPos,
    getRectAreaData,
    isInRectArea,
    isMobile,
    whiteBoardDataSet
} from "/src/utils/index"
import {
    appendHistoryOperation,
    createHistoryPages,
    getHistoryPageData,
    HistoryAction,
    resolveHistoryContent
} from "/src/modules/common/history"
import { renderHistoryOperation } from "/src/modules/common/renderOperation"

function getTargetClassName(event: MouseEvent | TouchEvent): string {
    const target = event.target as HTMLElement | null
    return target?.className ?? ""
}

export let canvasHistory: CanvasPage[] = createHistoryPages(3)
let nowPageIndex = 0
let allPageNumber = 3
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let temporaryCanvas: HTMLCanvasElement | null = null
let temporaryCtx: CanvasRenderingContext2D | null = null
let nowSelectIndex = -1

export function resetToolbarData(): void {
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
    if (keyboardEventController) return
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

//清除文本dom元素
function clearTextDom(): void {
    const arr = document.getElementsByClassName('bupu-edit-box')
    const l = arr.length
    for (let i = l - 1; i >= 0; i--) {
        if (arr[i] != null) {
            arr[i].parentNode!.removeChild(arr[i])
        }
    }
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
    clearSelect()
    temporaryCanvas!.style.zIndex = "-1"
    overlayDom!.style.zIndex = "50"
    let mousePress = false
    let last: { x: number; y: number } | null = null
    let first: { x: number; y: number } | null = null
    let selectAreaData: CanvasHistoryItem | null = null
    let changeIndex = -1
    let newDrawData: any = null
    let spaceX: number | null = null
    let spaceY: number | null = null
    let isStretch: string | boolean | null = null

    function begin(event: MouseEvent | TouchEvent): void {
        mousePress = true
        let xy = getPos(event)
        if (canvasHistory.length && canvasHistory[nowPageIndex].canvasData.length) {
            let list: CanvasHistoryItem[] = []
            let canvasHistoryContent = getCanvasDataContent(canvasHistory[nowPageIndex].canvasData, canvasHistory[nowPageIndex].step)
            canvasHistoryContent.forEach((item, index) => {
                if (item.actionType != -1) {
                    let position = item.position
                    if (item.options.isSelected == 1 && isInRectArea(position.x1, position.y1, position.x3, position.y3, xy.x, xy.y)) {
                        list.push(item)
                    }
                }
            })
            //由于是堆叠在上面 因此取最后一个即可
            if (getTargetClassName(event).indexOf("select-range-block") !== -1 ||
                getTargetClassName(event).indexOf("select-range-border") !== -1) {
                first = xy
                isStretch = getTargetClassName(event).split("__")[1]
            } else {
                if (list.length) {
                    /* 特殊处理文字内容，暂时不支持选中 */
                    if (list[list.length - 1].options.drawType == 6) {
                        return;
                    }
                    const nextSelectArea = JSON.parse(JSON.stringify(list[list.length - 1])) as CanvasHistoryItem
                    selectAreaData = nextSelectArea
                    changeIndex = nextSelectArea.index
                    nowSelectIndex = nextSelectArea.index
                    first = xy
                    isStretch = false
                    const { x1, y1, x3, y3 } = nextSelectArea.position
                    drawSelect(x1, y1, x3, y3, changeIndex)
                } else {
                    clearSelect()
                    isStretch = false
                    first = null
                    selectAreaData = null
                    changeIndex = -1
                }
            }
        }
    }

    function move(event: MouseEvent | TouchEvent): void {
        if (!mousePress || !first || changeIndex == -1 || !selectAreaData) {
            mousePress = false
            return
        }
        let {
            x1,
            y1,
            x2,
            y2,
            x3,
            y3,
            x4,
            y4
        } = selectAreaData!.position
        last = getPos(event)
        if (isStretch) {
            if (isMobile() ||
                (getTargetClassName(event).indexOf("select-range-block") == -1 &&
                 getTargetClassName(event).indexOf("select-range-border") == -1)) {
                if (last.x <= 15) {
                    last.x = 15
                }
                if (last.y <= 15) {
                    last.y = 15
                }
                if (last.x >= canvasResolution.w - 15) {
                    last.x = canvasResolution.w - 15
                }
                if (last.y >= canvasResolution.h - 15) {
                    last.y = canvasResolution.h - 15
                }
                switch (isStretch) {
                    case "left":
                        drawSelect(last.x, y1, x3, y3)
                        selectAreaData!.position.x1 = last.x
                        selectAreaData!.position.x4 = last.x
                        break
                    case "right":
                        drawSelect(x1, y1, last.x, y3)
                        selectAreaData!.position.x2 = last.x
                        selectAreaData!.position.x3 = last.x
                        break
                    case "top":
                        drawSelect(x1, last.y, x3, y3)
                        selectAreaData!.position.y1 = last.y
                        selectAreaData!.position.y2 = last.y
                        break
                    case "bottom":
                        drawSelect(x1, y1, x3, last.y)
                        selectAreaData!.position.y3 = last.y
                        selectAreaData!.position.y4 = last.y
                        break
                    case "leftTop":
                        drawSelect(last.x, last.y, x3, y3)
                        selectAreaData!.position.x1 = last.x
                        selectAreaData!.position.y1 = last.y
                        selectAreaData!.position.y2 = last.y
                        selectAreaData!.position.x4 = last.x
                        break
                    case "leftBottom":
                        drawSelect(last.x, y1, x3, last.y)
                        selectAreaData!.position.x1 = last.x
                        selectAreaData!.position.y3 = last.y
                        selectAreaData!.position.x4 = last.x
                        selectAreaData!.position.y4 = last.y
                        break
                    case "rightTop":
                        drawSelect(x1, last.y, last.x, y3)
                        selectAreaData!.position.y1 = last.y
                        selectAreaData!.position.x2 = last.x
                        selectAreaData!.position.y2 = last.y
                        selectAreaData!.position.x3 = last.x
                        break
                    case "rightBottom":
                        drawSelect(x1, y1, last.x, last.y)
                        selectAreaData!.position.x2 = last.x
                        selectAreaData!.position.x3 = last.x
                        selectAreaData!.position.y3 = last.y
                        selectAreaData!.position.y4 = last.y
                        break
                }
            }
        } else {
            spaceX = last.x - first.x
            spaceY = last.y - first.y
            //修正坐标  防止移出去
            if (x1 + spaceX - 5 <= 0) {
                spaceX = 5 - x1
            }
            if (y1 + spaceY - 5 <= 0) {
                spaceY = 5 - y1
            }
            if (x3 + spaceX + 5 >= canvasResolution.w) {
                spaceX = canvasResolution.w - x3 - 5
            }
            if (y3 + spaceY + 5 >= canvasResolution.h) {
                spaceY = canvasResolution.h - y3 - 5
            }
            drawSelect(x1 + spaceX, y1 + spaceY, x3 + spaceX, y3 + spaceY, changeIndex)
        }
    }

    function end(): void {
        mousePress = false
        if (!last || changeIndex == -1 || !selectAreaData) return
        let rectAreaData: RectAreaData | null = null
        let {
            drawData,
            drawType
        } = selectAreaData!.options
        //获取移动或拉伸后的新坐标
        if (isStretch) {
            rectAreaData = getRectAreaData(selectAreaData!.position.x1, selectAreaData!.position.y1, selectAreaData!.position.x3, selectAreaData!.position.y3)
        } else {
            rectAreaData = getRectAreaData(selectAreaData!.position.x1 + spaceX!, selectAreaData!.position.y1 + spaceY!, selectAreaData!.position.x3 + spaceX!, selectAreaData!.position.y3 + spaceY!)
            selectAreaData!.position = rectAreaData
        }
        let {
            x1,
            y1,
            x3,
            y3,
            w,
            h
        } = rectAreaData!

        if (drawType == 0 || drawType == 1) {
            newDrawData = []
            if (isStretch) {
                let wPercent = rectAreaData!.w / selectAreaData!.position.w
                let hPercent = rectAreaData!.h / selectAreaData!.position.h
                drawData.forEach((item: { x: number; y: number }) => {
                    newDrawData.push({
                        x: Math.floor(item.x * wPercent),
                        y: Math.floor(item.y * hPercent)
                    })
                })
                //重新同步点坐标
                const a = getPointsAreaData(newDrawData)
                if (!a) return
                newDrawData.forEach((item: { x: number; y: number }) => {
                    item.x = item.x - (a.x1 - rectAreaData!.x1)
                    item.y = item.y - (a.y1 - rectAreaData!.y1)
                })
            } else {
                drawData.forEach((item: { x: number; y: number }) => {
                    newDrawData.push({
                        x: item.x + spaceX!,
                        y: item.y + spaceY!
                    })
                })
            }
        }
        //矩形
        else if (drawType == 2) {
            newDrawData = {
                x: isStretch ? x1 : drawData.x + spaceX!,
                y: isStretch ? y1 : drawData.y + spaceY!,
                w: isStretch ? w : drawData.w,
                h: isStretch ? h : drawData.h
            }
        }
        //三角形
        else if (drawType == 3) {
            newDrawData = {
                x1: isStretch ? (x1 + x3) / 2 : drawData.x1 + spaceX!,
                y1: isStretch ? y1 : drawData.y1 + spaceY!,
                x2: isStretch ? x1 : drawData.x2 + spaceX!,
                y2: isStretch ? y3 : drawData.y2 + spaceY!,
                x3: isStretch ? x3 : drawData.x3 + spaceX!,
                y3: isStretch ? y3 : drawData.y3 + spaceY!
            }
        }
        //圆形
        else if (drawType == 4) {
            //更新点的坐标后重新计算
            newDrawData = {
                x: isStretch ? (x1 + x3) / 2 : drawData.x + spaceX!,
                y: isStretch ? (y1 + y3) / 2 : drawData.y + spaceY!,
                r: isStretch ? Math.abs(x1 - x3) / 2 : drawData.r
            }
            if (isStretch) {
                rectAreaData = getRectAreaData(x1, (y1 + y3) / 2 - newDrawData.r, x3, (y1 + y3) / 2 + newDrawData.r)
                drawSelect(rectAreaData.x1, rectAreaData.y1, rectAreaData.x3, rectAreaData.y3)
            }
        }
        //菱形
        else if (drawType == 5) {
            newDrawData = {
                x1: isStretch ? (x1 + x3) / 2 : drawData.x1 + spaceX!,
                y1: isStretch ? y1 : drawData.y1 + spaceY!,
                x2: isStretch ? x3 : drawData.x2 + spaceX!,
                y2: isStretch ? (y1 + y3) / 2 : drawData.y2 + spaceY!,
                x3: isStretch ? (x1 + x3) / 2 : drawData.x3 + spaceX!,
                y3: isStretch ? y3 : drawData.y3 + spaceY!,
                x4: isStretch ? x1 : drawData.x4 + spaceX!,
                y4: isStretch ? (y1 + y3) / 2 : drawData.y4 + spaceY!
            }
        }
        //文字
        else if (drawType == 6) {
            return;
        }
        //图片
        else if (drawType == 7) {
            newDrawData = {
                x: isStretch ? x1 : drawData.x + spaceX!,
                y: isStretch ? y1 : drawData.y + spaceY!,
                w: isStretch ? w : drawData.w,
                h: isStretch ? h : drawData.h,
                imageUrl: drawData.imageUrl
            }
        }
        addCanvasData(isStretch ? 3 : 0, rectAreaData!, isStretch ? {
            stretchIndex: changeIndex,
            drawData: newDrawData,
            isSelected: 1,
        } : {
            moveIndex: changeIndex,
            drawData: newDrawData,
            isSelected: 1,
        })
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData))
        last = null
        first = null
        newDrawData = null
        spaceX = null
        spaceY = null
    }

    overlayDom!.onmousedown = begin
    overlayDom!.onmousemove = move
    overlayDom!.onmouseup = end
    window.onmouseup = end
    overlayDom!.ontouchstart = begin
    overlayDom!.ontouchmove = move
    overlayDom!.ontouchend = end
    window.ontouchend = end
}

//线段绘制
export function write(options: WriteOptions): void {
    overlayDom!.style.zIndex = "-1"
    temporaryCanvas!.style.zIndex = "50"
    clearSelect()
    ctx!.lineWidth = options.lineWidth
    ctx!.strokeStyle = options.color
    temporaryCtx!.lineWidth = options.lineWidth
    temporaryCtx!.strokeStyle = options.color
    let begin: (event: MouseEvent | TouchEvent) => void = () => {}
    let move: (event: MouseEvent | TouchEvent) => void = () => {}
    let end: () => void = () => {}
    let mousePress = false
    let last: { x: number; y: number } | null = null
    let first: { x: number; y: number } | null = null
    let drawData: { x: number; y: number }[] = []

    if (options.lineType == 0) {
        let nowControlPoint: { x: number; y: number } | null = null
        begin = (event: MouseEvent | TouchEvent) => {
            mousePress = true
            first = getPos(event)
            drawData.push(first)
        }

        move = (event: MouseEvent | TouchEvent) => {
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

        begin = (event: MouseEvent | TouchEvent) => {
            first = getPos(event)
            mousePress = true
        }

        move = (event: MouseEvent | TouchEvent) => {
            if (!mousePress) return
            let xy = getPos(event)
            if (first) {
                clearTemporaryCanvas()
                drawLineArrow(temporaryCtx!, [first, xy])
                last = xy
            }
        }

        end = () => {
            if (last) {
                clearTemporaryCanvas()
                drawData = [first!, last]
                drawLineArrow(ctx!, drawData)
                let rectAreaData = getRectAreaData(first!.x, first!.y, last.x, last.y)
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
    temporaryCanvas!.ontouchstart = begin
    temporaryCanvas!.ontouchmove = move
    temporaryCanvas!.ontouchend = end
}

//绘制图形
export function draw(options: DrawOptions): void {
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
    let last: { x: number; y: number } | null = null
    let first: { x: number; y: number } | null = null

    function begin(event: MouseEvent | TouchEvent): void {
        mousePress = true
        first = getPos(event)
    }

    function move(event: MouseEvent | TouchEvent): void {
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

    function end(event: MouseEvent | TouchEvent): void {
        mousePress = false
        clearTemporaryCanvas()
        //修正最小值
        if (!last) last = getPos(event)
        if (Math.abs(last.x - first!.x) <= 30 && Math.abs(last.y - first!.y) <= 30) {
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
            let rectAreaData = getRectAreaData(first!.x, first!.y, last.x, last.y)
            drawData = {
                x: first!.x,
                y: first!.y,
                w: last.x - first!.x,
                h: last.y - first!.y
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
            let rectAreaData = getRectAreaData(first!.x, first!.y, last.x, last.y)
            drawData = {
                x1: (first!.x + last.x) / 2,
                y1: first!.y,
                x2: first!.x,
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
                x: (first!.x + last.x) / 2,
                y: (first!.y + last.y) / 2,
                r: Math.abs(last.x - first!.x) / 2
            }
            let rectAreaData = getRectAreaData(first!.x, (first!.y + last.y) / 2 - drawData.r, last.x, (first!.y + last.y) / 2 + drawData.r)
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
            let rectAreaData = getRectAreaData(first!.x, first!.y, last.x, last.y)
            drawData = {
                x1: (first!.x + last.x) / 2,
                y1: first!.y,
                x2: last.x,
                y2: (first!.y + last.y) / 2,
                x3: (first!.x + last.x) / 2,
                y3: last.y,
                x4: first!.x,
                y4: (first!.y + last.y) / 2
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
    temporaryCanvas!.ontouchstart = begin
    temporaryCanvas!.ontouchmove = move
    temporaryCanvas!.ontouchend = end
}

//绘制文本框
export function text(options: TextOptions): void {
    temporaryCtx!.restore()
    overlayDom!.style.zIndex = "-1"
    temporaryCanvas!.style.zIndex = "50"
    clearSelect()
    clearTemporaryCanvas()
    ctx!.font = options.font
    ctx!.strokeStyle = options.color
    ctx!.fillStyle = options.color
    let mousePress = false
    let last: { x: number; y: number } | null = null
    let first: { x: number; y: number } | null = null
    let rectAreaData: RectAreaData | null = null

    function begin(): void {
        mousePress = true
        first = getPos(event as MouseEvent | TouchEvent)
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
        editBox.onblur = () => {
            clearTemporaryCanvas()
            rectAreaData = getRectAreaData(first!.x, first!.y, first!.x + editBox.clientWidth, first!.y + editBox.clientHeight)
            let text = editBox.innerText
            if (text && text.length) {
                addCanvasData(1, rectAreaData!, {
                    drawType: 6,
                    text: editBox.innerText,
                    isSelected: 1,
                    style: {
                        fontSize: options.fontSize,
                        left: first!.x,
                        top: first!.y,
                        color: options.color
                    }
                })
            }
            editBox.style.border = "none"
            editBox.style.padding = "4px"
            editBox.contentEditable = "false"
        }
    }

    function move(event: MouseEvent | TouchEvent): void {
        if (!mousePress || !first) return
        last = getPos(event)
    }

    temporaryCanvas!.onmousedown = begin
    temporaryCanvas!.onmousemove = move
    temporaryCanvas!.onmouseup = end
    temporaryCanvas!.ontouchstart = begin
    temporaryCanvas!.ontouchmove = move
    temporaryCanvas!.ontouchend = end
}

//撤销
export function undo(setStep?: number): void {
    let flag = setStep ? setStep : 0
    if (canvasHistory[nowPageIndex].step >= flag) {
        clearSelect()
        clearCanvas()
        clearTextDom()
        canvasHistory[nowPageIndex].step -= 1
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData.slice(0, canvasHistory[nowPageIndex].step + 1)))
        whiteBoardDataSet.addCanvasHistoryHandler && whiteBoardDataSet.addCanvasHistoryHandler({
            canvasHistory,
            nowPageIndex,
            allPageNumber
        })
    } else {
        message({
            type: "warn",
            text: "无法撤销",
            zIndex: 999
        })
    }
}

//反撤销
export function redo(): void {
    if (canvasHistory[nowPageIndex].step < canvasHistory[nowPageIndex].canvasData.length - 1) {
        clearSelect()
        clearCanvas()
        clearTextDom()
        canvasHistory[nowPageIndex].step += 1
        restoreArtBoardState(getCanvasDataContent(canvasHistory[nowPageIndex].canvasData.slice(0, canvasHistory[nowPageIndex].step + 1)))
        whiteBoardDataSet.addCanvasHistoryHandler && whiteBoardDataSet.addCanvasHistoryHandler({
            canvasHistory,
            nowPageIndex,
            allPageNumber
        })
    } else {
        message({
            type: "warn",
            text: "已经是最新记录了",
            zIndex: 999
        })
    }
}

//橡皮擦
export function eraser(): void {
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