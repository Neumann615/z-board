import { tooltip } from "/src/components/tooltip"
import { popover } from "/src/components/popover"
// @ts-ignore
import borderGif from "/src/assets/image/border.gif"
import { domAppendChild } from "/src/utils/index"

interface DrawOptions {
  lineWidth?: number
}

interface WriteOptions {
  lineWidth?: number
}

export function renderCanvas(): HTMLCanvasElement {
    let canvas = document.createElement("canvas")
    canvas.className = "bupu-canvas"
    return canvas
}

export function renderTemporaryCanvas(): HTMLCanvasElement {
    let canvas = document.createElement("canvas")
    canvas.className = "bupu-temporary-canvas"
    return canvas
}

export function renderContainer(): HTMLDivElement {
    let container = document.createElement("div")
    container.className = "bupu-container"
    return container
}

export function renderOverlay(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.className = "bupu-overlay"
    return dom
}

export function renderDraw(colorTypeList: string[], options: DrawOptions = {}): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-draw"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-duobianxing"></span>`

    tooltip(dom, {
        content: "画图",
        placement: "right"
    })

    popover(dom, {
        content: getPopoverDom()
    })

    function getPopoverDom(): DocumentFragment {
        let drawTypeList = [
            `<span class="iconfont icon-juxing"></span>`,
            `<span class="iconfont icon-xingzhuang-sanjiaoxing"></span>`,
            `<span class="iconfont icon-radio-on"></span>`,
            `<span class="iconfont icon-tubiao"></span>`
        ]
        let popoverDom = document.createDocumentFragment()

        let shapeTypeDom = document.createElement("div")
        shapeTypeDom.className = "bupu-module"
        shapeTypeDom.id = "bupu-draw-shapetype"
        drawTypeList.forEach((item, index) => {
            let shapeItem = document.createElement("div")
            shapeItem.className = index === 0 ? "bupu-module-item is-selected" : "bupu-module-item"
            shapeItem.setAttribute("shapeType", index.toString())
            shapeItem.innerHTML = item
            shapeTypeDom.appendChild(shapeItem)
        })

        let lineWidthDom = createLineWidthRange("bupu-draw", options.lineWidth || 20)
        let colorDom = createColorModule(colorTypeList, "bupu-draw")

        domAppendChild(popoverDom, [shapeTypeDom, lineWidthDom, colorDom])
        return popoverDom
    }

    return dom
}

export function renderWrite(colorTypeList: string[], options: WriteOptions = {}): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-write"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-qianbipencil84"></span>`

    tooltip(dom, {
        content: "书写",
        placement: "right"
    })

    popover(dom, {
        content: getPopoverDom()
    })

    function getPopoverDom(): DocumentFragment {
        let lineTypeList = [
            `<span class="iconfont icon-ziyouquxian"></span>`,
            `<span class="iconfont icon-straight"></span>`
        ]
        let popoverDom = document.createDocumentFragment()

        let lineTypeDom = document.createElement("div")
        lineTypeDom.className = "bupu-module"
        lineTypeDom.id = "bupu-write-linetype"
        lineTypeList.forEach((item, index) => {
            let lineTypeItem = document.createElement("div")
            lineTypeItem.className = index === 0 ? "bupu-module-item is-selected" : "bupu-module-item"
            lineTypeItem.setAttribute("lineType", index.toString())
            lineTypeItem.innerHTML = item
            lineTypeDom.appendChild(lineTypeItem)
        })

        let lineWidthDom = createLineWidthRange("bupu-write", options.lineWidth || 20)
        let colorDom = createColorModule(colorTypeList, "bupu-write")

        domAppendChild(popoverDom, [lineTypeDom, lineWidthDom, colorDom])
        return popoverDom
    }

    return dom
}

export function renderText(colorTypeList: string[]): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-text"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-text"></span>`

    tooltip(dom, {
        content: "文本",
        placement: "right"
    })

    popover(dom, {
        content: getPopoverDom()
    })

    function getPopoverDom(): DocumentFragment {
        let popoverDom = document.createDocumentFragment()
        let fontSizeDom = createLineWidthRange("bupu-text", 30)
        let colorDom = createColorModule(colorTypeList, "bupu-text")
        domAppendChild(popoverDom, [fontSizeDom, colorDom])
        return popoverDom
    }

    return dom
}

export function renderPointer(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-pointer"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-pointer2"></span>`
    tooltip(dom, {
        content: "指针",
        placement: "right"
    })
    return dom
}

export function renderUndo(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-undo"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-chexiao"></span>`
    tooltip(dom, {
        content: "撤销",
        placement: "right"
    })
    return dom
}

export function renderRedo(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-redo"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-fanchexiao"></span>`
    tooltip(dom, {
        content: "反撤销",
        placement: "right"
    })
    return dom
}

export function renderEraser(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-eraser"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-xiangpi1"></span>`
    tooltip(dom, {
        content: "橡皮",
        placement: "right"
    })
    return dom
}

export function renderSave(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-save"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-baocun"></span>`
    tooltip(dom, {
        content: "保存",
        placement: "right"
    })
    return dom
}

export function renderOpenFile(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-open-file"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-wenjianjia"></span>`
    tooltip(dom, {
        content: "打开文件",
        placement: "right"
    })
    return dom
}

export function renderAddPage(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-add-page"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-jiahao"></span>`
    tooltip(dom, {
        content: "添加页面",
        placement: "right"
    })
    return dom
}

export function renderDeletePage(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-delete-page"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-shanchu"></span>`
    tooltip(dom, {
        content: "删除页面",
        placement: "right"
    })
    return dom
}

export function renderReset(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-reset"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-zhongzhi"></span>`
    tooltip(dom, {
        content: "重置",
        placement: "right"
    })
    return dom
}

export function renderPagination(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.className = "bupu-toolbar-child bupu-toolbar-vertical"

    let prevDom = document.createElement("div")
    prevDom.id = "toolbar-pagination-prev"
    prevDom.className = "bupu-toolbar-content__item"
    prevDom.innerHTML = `<span class="iconfont  icon-shouqijiantouxiao"></span>`

    let nowPageDom = document.createElement("div")
    nowPageDom.id = "toolbar-pagination-page"
    nowPageDom.className = "bupu-pagination-page"

    let nextDom = document.createElement("div")
    nextDom.id = "toolbar-pagination-next"
    nextDom.className = "bupu-toolbar-content__item"
    nextDom.innerHTML = `<span class="iconfont icon-xialajiantouxiao"></span>`

    domAppendChild(dom, [prevDom, nowPageDom, nextDom])
    return dom
}

export function renderMoveToolbar(): HTMLDivElement {
    let selectToolbar = document.createElement("div")
    selectToolbar.id = "bupu-move-toolbar"

    let topDom = document.createElement("div")
    topDom.id = "move-toolbar-top"
    topDom.className = "bupu-move-toolbar__item"
    topDom.innerHTML = `<span class="iconfont  icon-set-top"></span>`
    tooltip(topDom, {
        content: "置顶",
        placement: "right"
    })

    let bottomDom = document.createElement("div")
    bottomDom.id = "move-toolbar-bottom"
    bottomDom.className = "bupu-move-toolbar__item"
    bottomDom.innerHTML = `<span class="iconfont  icon-set-bottom"></span>`
    tooltip(bottomDom, {
        content: "置底",
        placement: "right"
    })

    domAppendChild(selectToolbar, [topDom, bottomDom])
    return selectToolbar
}

export function renderSelectRange(): HTMLDivElement {
    let selectBox = document.createElement("div")
    selectBox.id = "bupu-select-range"

    let borderList = ["left", "right", "top", "bottom"]
    borderList.forEach(item => {
        let borderDom = document.createElement("div")
        borderDom.className = "select-range-border__" + item
        borderDom.style.background = `url(${borderGif})`
        selectBox.appendChild(borderDom)
    })

    let blockList = ["left", "right", "top", "bottom", "leftTop", "leftBottom", "rightTop", "rightBottom"]
    blockList.forEach(item => {
        let blockDom = document.createElement("div")
        blockDom.className = "select-range-block__" + item
        selectBox.appendChild(blockDom)
    })

    return selectBox
}

export function updatePaginationText(v: string): void {
    let paginationTextDom = document.getElementById("toolbar-pagination-page")
    if (paginationTextDom) {
        paginationTextDom.innerHTML = v
    }
}

function createColorModule(colorTypeList: string[], prefix: string, defaultIndex: number = 0): HTMLDivElement {
    let colorDom = document.createElement("div")
    colorDom.className = "bupu-module"
    colorDom.id = `${prefix}-color`

    colorTypeList.forEach((item, index) => {
        let colorItem = document.createElement("div")
        colorItem.setAttribute("color", item)

        let colorContent = document.createElement("div")
        colorItem.className = index === defaultIndex ? "bupu-module-item is-selected" : "bupu-module-item"
        colorContent.className = "bupu-module-color"
        colorContent.style.backgroundColor = item

        colorItem.appendChild(colorContent)
        colorDom.appendChild(colorItem)
    })

    return colorDom
}

function createLineWidthRange(prefix: string, defaultValue: number = 20): HTMLDivElement {
    let rangeDom = document.createElement("div")
    rangeDom.className = "bupu-range"

    let rangeInput = document.createElement("input")
    rangeInput.type = "range"
    rangeInput.value = defaultValue.toString()
    rangeInput.id = `${prefix}-linewidth`

    rangeDom.appendChild(rangeInput)
    return rangeDom
}