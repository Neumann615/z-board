// core.js 负责协调调度的事件相关
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
    bindWriteEvents
} from "/src/modules/common/eventBinding"
import eraserIco from "/src/assets/image/eraser.ico"
import iIco from "/src/assets/image/I.ico"
import pencilIco from "/src/assets/image/pencil.ico"
import plusIco from "/src/assets/image/plus.ico"

let canvasDom
let temporaryCanvasDom
let imageDom
let pointerDom
let writeDom
let drawDom
let textDom
let undoDom
let redoDom
let eraserDom
let addPageDom
let deletePageDom
let resetDom
let saveDom
let openFileDom
let paginationDom
//挂载点
let mountDom
// 白板工具栏
let toolbarDom
export let containerDom
export let overlayDom
export let selectRangeDom
export let moveToolbarDom
export let canvasResolution
//书写时的相关参数
let writeOptions
//画图时的相关参数
let drawOptions
//插入文本时的相关参数
let textOptions

//初始化dom数据
function initDomData() {
    //清空画板数据
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
    // 白板工具栏
    toolbarDom = null
    containerDom = renderContainer()
    overlayDom = renderOverlay()
    selectRangeDom = null
    moveToolbarDom = renderMoveToolbar()
    canvasResolution = {
        w: 0,
        h: 0
    }

    //书写时的相关参数
    writeOptions = {
        lineType: 0,
        lineWidth: 2,
        color: whiteBoardDataSet.colorList[0]
    }
    //画图时的相关参数
    drawOptions = {
        shapeType: 0,
        lineWidth: 2,
        color: whiteBoardDataSet.colorList[0]
    }
    //插入文本时的相关参数
    textOptions = {
        fontSize: 15,
        font: "15px Arial",
        color: whiteBoardDataSet.colorList[0]
    }
}

//工具栏事件绑定
function eventBinding() {
    let toolbarEventDom = [pointerDom, writeDom, drawDom, textDom, eraserDom]
    toolbarDom && toolbarDom.addEventListener("click", (e) => {
        e.stopPropagation()
        e.preventDefault()
        clearTemporaryCanvas()
        switch (e.target.id) {
            case 'toolbar-image':
                let fileInput1 = document.createElement("input")
                fileInput1.type = "file"
                fileInput1.accept = "image/*"
                fileInput1.click()
                fileInput1.onchange = (e) => {
                    //获取的文件信息
                    image(e.target.files[0], () => {
                        pointerDom.click()
                        setTimeout(() => {
                            let evt = document.createEvent("MouseEvents")
                            evt.initMouseEvent("mousedown", true, true, window, 0, 0, 0, canvasResolution.w / 2, canvasResolution.h / 2, false, false, false, false, 0, null)
                            overlayDom.dispatchEvent(evt)
                            evt.initMouseEvent("mouseup", true, true, window, 0, 0, 0, canvasResolution.w / 2, canvasResolution.h / 2, false, false, false, false, 0, null)
                            overlayDom.dispatchEvent(evt)
                        }, 200)
                    })
                }
                break
            case "toolbar-pointer":
                canvasDom.style.cursor = "initial"
                temporaryCanvasDom.style.cursor = "initial"
                changeIsSelected(toolbarEventDom, pointerDom)
                pointer()
                break
            case "toolbar-write":
                temporaryCanvasDom.style.cursor = `url(${pencilIco}),default`
                canvasDom.style.cursor = `url(${pencilIco}),default`
                changeIsSelected(toolbarEventDom, writeDom)
                write(writeOptions)
                writeEventBinding()
                break
            case "toolbar-draw":
                temporaryCanvasDom.style.cursor = `url(${plusIco}),default`
                changeIsSelected(toolbarEventDom, drawDom)
                draw(drawOptions)
                drawEventBinding()
                break
            case "toolbar-text":
                temporaryCanvasDom.style.cursor = `url(${iIco}),default`
                changeIsSelected(toolbarEventDom, textDom)
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
                canvasDom.style.cursor = `url(${eraserIco}),default`
                changeIsSelected(toolbarEventDom, eraserDom)
                eraser()
                break
            case "toolbar-open-file":
                let fileInput2 = document.createElement("input")
                fileInput2.type = "file"
                fileInput2.accept = "*"
                fileInput2.click()
                fileInput2.onchange = (e) => {
                    //获取的文件信息
                    openFile(e.target.files[0])
                }
                break
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
    moveToolbarDom && moveToolbarDom.addEventListener("click", (e) => {
        e.stopPropagation()
        e.preventDefault()
        switch (e.target.id) {
            case "move-toolbar-top":
                setTop()
                break
            case "move-toolbar-bottom":
                setBottom()
                break
        }
    })
}

//画笔部分事件绑定
function writeEventBinding() {
    bindWriteEvents(writeOptions, write)
}

//绘图部分事件绑定
function drawEventBinding() {
    bindDrawEvents(drawOptions, draw)
}

//文字部分事件绑定
function textEventBinding() {
    bindTextEvents(textOptions, text)
}

//监控分辨率变化
function observerCanvasResolution(dom) {
    updateCanvasResolution(dom.clientWidth, dom.clientHeight)
    window.addEventListener("resize", () => {
        pointerDom.click()
        updateCanvasResolution(dom.clientWidth, dom.clientHeight)
    })
    //存在兼容问题
    // if (ResizeObserver) {
    //     let resizeObserver = new ResizeObserver(entries => {
    //         for (let key of entries) {
    //             let {inlineSize, blockSize} = key.contentBoxSize[0]
    //             alert("尺寸" + inlineSize + "/" + blockSize)
    //             updateCanvasResolution(inlineSize, blockSize)
    //         }
    //     })
    //     resizeObserver.observe(dom)
    // }
}

//更新分辨率
function updateCanvasResolution(w, h) {
    if (w != canvasResolution.w || h != canvasResolution.h) {
        canvasDom.width = w
        temporaryCanvasDom.width = w
        canvasDom.height = h
        temporaryCanvasDom.height = h
        canvasResolution.w = w
        canvasResolution.h = h
        //分辨率变化后重新绘制当前画板
        redrawByResolution()
    }
}

//初始化白板
export function initWhiteBoard(dom, options) {
    mountDom = dom
    unmountWhiteBoard()
    initDomData()
    //初始化传递进来的参数
    options && updateWhiteBoardVar(options)
    selectRangeDom = renderSelectRange()
    //工具栏模块
    let toolbarContainer = document.createElement("div")
    toolbarContainer.className = "bupu-toolbar"
    let toolbarContainerChild1 = document.createElement("div")
    toolbarContainerChild1.className = "bupu-toolbar-child bupu-toolbar-vertical"
    //功能模块1
    let toolbarContent1 = document.createElement("div")
    toolbarContent1.className = "bupu-toolbar-content"
    domAppendChild(toolbarContent1, [imageDom, pointerDom, writeDom, drawDom, textDom])
    //功能模块2
    let toolbarContent2 = document.createElement("div")
    toolbarContent2.className = "bupu-toolbar-content"
    domAppendChild(toolbarContent2, [undoDom, redoDom, eraserDom])
    //功能模块3
    let toolbarContent3 = document.createElement("div")
    toolbarContent3.className = "bupu-toolbar-content"
    domAppendChild(toolbarContent3, [addPageDom, deletePageDom, resetDom, saveDom])
    domAppendChild(toolbarContainerChild1, [toolbarContent1, toolbarContent2, toolbarContent3])
    domAppendChild(toolbarContainer, [toolbarContainerChild1, paginationDom])
    toolbarDom = toolbarContainer
    //遮罩层
    domAppendChild(overlayDom, [selectRangeDom])
    domAppendChild(containerDom, [canvasDom, temporaryCanvasDom, overlayDom, moveToolbarDom])
    //添加到页面
    dom.appendChild(toolbarDom)
    dom.appendChild(containerDom)
    eventBinding()
    //赋值操作 初始化画板相关变量f
    getCanvasObject(canvasDom, temporaryCanvasDom)
    //分辨率监控
    observerCanvasResolution(containerDom)
    //初始化选中画笔
    setTimeout(() => {
        temporaryCanvasDom.style.cursor = `url(${pencilIco}),default`
        canvasDom.style.cursor = `url(${pencilIco}),default`
        changeIsSelected([pointerDom, writeDom, drawDom, textDom, eraserDom], writeDom)
        write(writeOptions)
    }, 500)
}

//卸载白板
export function unmountWhiteBoard() {
    if (mountDom) {
        mountDom.innerHTML = ""
        resetToolbarData()
        let tooltipList = document.getElementsByClassName("bupu-tooltip")
        let popoverList = document.getElementsByClassName("bupu-popover")
        for (let i = 0; i < tooltipList.length; i++) {
            tooltipList[i].parentElement.removeChild(tooltipList[i])
        }
        for (let i = 0; i < popoverList.length; i++) {
            popoverList[i].parentElement.removeChild(popoverList[i])
        }
    }
}