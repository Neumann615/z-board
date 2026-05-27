// core.js 负责协调调度的事件相关
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
    renderPointer,
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
    pointer,
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
    clearSelect,
    showBackground,
    resetSelect
} from "./screenshot"
import {
    bindDrawEvents,
    bindTextEvents,
    bindWriteEvents
} from "/src/modules/common/eventBinding"


let canvasDom
let temporaryCanvasDom
let pointerDom
let writeDom
let drawDom
let textDom
let undoDom
let saveDom
let exitDom
let successDom
let mountDom
//截图工具栏
export let screenShotToolbarDom
export let screenShotBackgroundDom
export let screenShotCutDom
export let selectRangeDom
export let screenShotSelectRangeDom
export let containerDom
export let overlayDom
export let screenShotOverlayDom
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
    canvasDom = renderCanvas()
    temporaryCanvasDom = renderTemporaryCanvas()
    pointerDom = renderPointer()
    writeDom = renderWrite()
    drawDom = renderDraw()
    textDom = renderText()
    undoDom = renderUndo()
    saveDom = renderSave()
    exitDom = renderExitScreenShot()
    successDom = renderSuccessScreenShot()
    //截图工具栏
    screenShotToolbarDom = null
    screenShotBackgroundDom = null
    screenShotCutDom = null
    selectRangeDom = null
    screenShotSelectRangeDom = null
    containerDom = renderContainer()
    overlayDom = renderOverlay()
    screenShotOverlayDom = renderOverlay()
    moveToolbarDom = renderMoveToolbar()
    canvasResolution = {
        w: 0,
        h: 0
    }
    //书写时的相关参数
    writeOptions = {
        lineType: 0,
        lineWidth: 3,
        color: screenShotDataSet.colorList[0]
    }
    //画图时的相关参数
    drawOptions = {
        shapeType: 0,
        lineWidth: 3,
        color: screenShotDataSet.colorList[0]
    }
    //插入文本时的相关参数
    textOptions = {
        fontSize: 15,
        font: "15px Arial",
        color: screenShotDataSet.colorList[0]
    }
}

//工具栏事件绑定
function eventBinding() {
    let toolbarEventDom = [pointerDom, writeDom, drawDom, textDom]
    screenShotToolbarDom && screenShotToolbarDom.addEventListener("click", (e) => {
        initScreenShotBackground().then(() => {
            e.stopPropagation()
            e.preventDefault()
            clearTemporaryCanvas()
            switch (e.target.id) {
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

function writeEventBinding() {
    bindWriteEvents(writeOptions, write)
}

function drawEventBinding() {
    bindDrawEvents(drawOptions, draw)
}

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

//初始化截图背景
function initScreenShotBackground() {
    return new Promise((resolve) => {
        let {
            x1,
            y1,
            w,
            h
        } = screenShotPosition
        let editBox = document.createElement("div")
        editBox.className = "bupu-screen-edit"
        editBox.style.width = w + "px"
        editBox.style.height = h + "px"
        editBox.style.left = x1 + "px"
        editBox.style.top = y1 + "px"
        let ctx = canvasDom.getContext("2d")
        let image = new Image()
        image.crossOrigin = "*"
        let cacheImage = new Image()
        cacheImage.crossOrigin = "*"
        image.src = screenShotCutDom.src
        image.onload = () => {
            ctx.drawImage(image, x1, y1, w, h, 0, 0, w, h)
            let imageUrl = canvasDom.toDataURL("image/png", 1)
            let drawData = {
                x: 0,
                y: 0,
                w,
                h,
                imageUrl
            }
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
        domAppendChild(overlayDom, [selectRangeDom])
        domAppendChild(editBox, [canvasDom, temporaryCanvasDom, overlayDom])
        containerDom.replaceChild(editBox, screenShotOverlayDom)
        //更换容器节点
        containerDom = editBox
        observerCanvasResolution(editBox)
        initScreenShotBackground = () => {
            return new Promise((resolve) => {
                resolve(true)
            })
        }
    })
}

//初始化截图
export function initScreenShot(dom, options) {
    mountDom = dom
    initDomData()
    unmountScreenShot()
    //初始化传递进来的参数
    options && updateScreenShotVar(options)
    let toolbarContainer = document.createElement("div")
    toolbarContainer.className = "bupu-screen-toolbar bupu-toolbar-vertical"
    if (options.toolbarPosition === "top" || options.toolbarPosition === "bottom") {
        toolbarContainer.className = "bupu-screen-toolbar bupu-toolbar-horizontal"
    }
    let toolbarContainerChild1 = document.createElement("div")
    toolbarContainerChild1.className = "bupu-toolbar-content"
    let toolbarContainerChild2 = document.createElement("div")
    toolbarContainerChild2.className = "bupu-toolbar-content"
    domAppendChild(toolbarContainerChild1, [writeDom, drawDom, textDom])
    domAppendChild(toolbarContainerChild2, [undoDom, exitDom, successDom])
    domAppendChild(toolbarContainer, [toolbarContainerChild1, toolbarContainerChild2])
    screenShotToolbarDom = toolbarContainer
    screenShotBackgroundDom = renderScreenShotBackground()
    screenShotCutDom = renderScreenShotCut()
    selectRangeDom = renderSelectRange()
    screenShotSelectRangeDom = renderScreenShotSelectRange([screenShotCutDom, canvasDom, temporaryCanvasDom])
    domAppendChild(screenShotOverlayDom, [screenShotSelectRangeDom])
    domAppendChild(containerDom, [screenShotBackgroundDom, screenShotOverlayDom, screenShotToolbarDom])
    containerDom.style.background = "#000"
    dom.appendChild(containerDom)
    //赋值操作 初始化画板相关变量
    getScreenShotCanvasObject(canvasDom, temporaryCanvasDom)
    getCanvasObject(canvasDom, temporaryCanvasDom)
    //初始化进入选中状态
    eventBinding()
    screenShotBackgroundDom.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        e.preventDefault()
        return false
    })
    //绑定双击事件
    containerDom.addEventListener("dblclick", (e) => {
        if (e.target.className.indexOf("bupu-toolbar") !== -1) return
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
        return false
    })
    //右键绑定
    containerDom.addEventListener("contextmenu", (e) => {
        if (e.target.className === "bupu-overlay") {
            //清空当前选中
            if (screenShotPosition) {
                // console.log("点在外面", screenShotPosition)
                resetSelect()
            }
        } else if (e.target.id === "bupu-select-range") {
            // console.log("点在里面")
        }
        e.stopPropagation()
        e.preventDefault()
        return false
    })
    selectDrawRect()
}

//卸载截屏
export function unmountScreenShot() {
    if (mountDom) {
        mountDom.innerHTML = ""
        let tooltipList = document.getElementsByClassName("bupu-tooltip")
        let popoverList = document.getElementsByClassName("bupu-popover")
        for (let i = 0; i < tooltipList.length; i++) {
            tooltipList[i].parentElement.removeChild(tooltipList[i])
        }
        for (let i = 0; i < popoverList.length; i++) {
            popoverList[i].parentElement.removeChild(popoverList[i])
        }
        resetToolbarData()
        resetScreenShotData()
        initScreenShotBackground = () => {
            return new Promise((resolve) => {
                let {
                    x1,
                    y1,
                    w,
                    h
                } = screenShotPosition
                let editBox = document.createElement("div")
                editBox.className = "bupu-screen-edit"
                editBox.style.width = w + "px"
                editBox.style.height = h + "px"
                editBox.style.left = x1 + "px"
                editBox.style.top = y1 + "px"
                let ctx = canvasDom.getContext("2d")
                let image = new Image()
                image.crossOrigin = "*"
                let cacheImage = new Image()
                cacheImage.crossOrigin = "*"
                image.src = screenShotCutDom.src
                image.onload = () => {
                    ctx.drawImage(image, x1, y1, w, h, 0, 0, w, h)
                    let imageUrl = canvasDom.toDataURL("image/png", 1)
                    let drawData = {
                        x: 0,
                        y: 0,
                        w,
                        h,
                        imageUrl
                    }
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
                domAppendChild(overlayDom, [selectRangeDom])
                domAppendChild(editBox, [canvasDom, temporaryCanvasDom, overlayDom])
                containerDom.replaceChild(editBox, screenShotOverlayDom)
                //更换容器节点
                containerDom = editBox
                observerCanvasResolution(editBox)
                initScreenShotBackground = () => {
                    return new Promise((resolve) => {
                        resolve(true)
                    })
                }
            })
        }
    }
}