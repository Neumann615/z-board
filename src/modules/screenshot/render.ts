import { screenShotDataSet, domAppendChild } from "/src/utils/index"
import { tooltip } from "/src/components/tooltip"
import { popover } from "/src/components/popover"
import borderGif from "/src/assets/image/border.gif"
import {
    renderCanvas,
    renderTemporaryCanvas,
    renderContainer,
    renderOverlay,
    renderPointer,
    renderUndo,
    renderSave,
    renderMoveToolbar,
    renderSelectRange
} from "/src/modules/common/render"

let colorTypeList: string[] = screenShotDataSet.colorList

export {
    renderCanvas,
    renderTemporaryCanvas,
    renderContainer,
    renderOverlay,
    renderPointer,
    renderUndo,
    renderSave,
    renderMoveToolbar,
    renderSelectRange
}

export function renderDraw(): HTMLDivElement {
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
        let lineWidthDom = createLineWidthRange("bupu-draw", 30)
        let colorDom = createColorModule(colorTypeList, "bupu-draw")
        domAppendChild(popoverDom, [shapeTypeDom, lineWidthDom, colorDom])
        return popoverDom
    }

    return dom
}

export function renderWrite(): HTMLDivElement {
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
        let lineWidthDom = createLineWidthRange("bupu-write", 30)
        let colorDom = createColorModule(colorTypeList, "bupu-write")
        domAppendChild(popoverDom, [lineTypeDom, lineWidthDom, colorDom])
        return popoverDom
    }

    return dom
}

export function renderText(): HTMLDivElement {
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

export function renderScreenShotSelectRange(domList?: HTMLElement[]): HTMLDivElement {
    let selectBox = document.createElement("div")
    selectBox.id = "bupu-select-range"
    let borderList = ["left", "right", "top", "bottom"]
    let blockList = ["left", "right", "top", "bottom", "leftTop", "leftBottom", "rightTop", "rightBottom"]
    borderList.forEach(item => {
        let borderDom = document.createElement("div")
        borderDom.className = "select-range-border__" + item
        borderDom.style.background = `url(${borderGif})`
        selectBox.appendChild(borderDom)
    })
    blockList.forEach(item => {
        let blockDom = document.createElement("div")
        blockDom.className = "select-range-block__" + item
        selectBox.appendChild(blockDom)
    })
    let selectContentBox = document.createElement("div")
    selectContentBox.className = "bupu-select-content"
    if (domList && domList.length) {
        domAppendChild(selectContentBox, domList)
    }
    let childList = [selectContentBox]
    domAppendChild(selectBox, childList)
    return selectBox
}

export function updatePaginationText(v: string): void {
    let paginationTextDom = document.getElementById("toolbar-pagination-page")
    if (paginationTextDom) {
        paginationTextDom.innerHTML = v
    }
}

export function renderScreenShotBackground(): HTMLImageElement {
    let bgDom = document.createElement("img")
    bgDom.className = "bupu-screen-shot__background"
    bgDom.src = `${screenShotDataSet.imageUrl}`
    return bgDom
}

export function renderScreenShotCut(): HTMLImageElement {
    let bgDom = document.createElement("img")
    bgDom.className = "bupu-screen-shot__cut"
    bgDom.src = `${screenShotDataSet.imageUrl}`
    return bgDom
}

export function renderExitScreenShot(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-exit"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-chacha"></span>`
    tooltip(dom, {
        content: "退出",
        placement: "right"
    })
    return dom
}

export function renderSuccessScreenShot(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-success"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-duigou"></span>`
    tooltip(dom, {
        content: "完成",
        placement: "right"
    })
    return dom
}