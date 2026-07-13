import { whiteBoardDataSet } from "../../utils"
import { domAppendChild } from "/src/utils/index"
import { tooltip } from "/src/components/tooltip"
import { popover } from "/src/components/popover"
import {
    renderCanvas,
    renderTemporaryCanvas,
    renderContainer,
    renderOverlay,
    renderPointer,
    renderUndo,
    renderRedo,
    renderEraser,
    renderSave,
    renderOpenFile,
    renderAddPage,
    renderDeletePage,
    renderReset,
    renderPagination,
    renderMoveToolbar,
    renderSelectRange,
    updatePaginationText
} from "/src/modules/common/render"

let colorTypeList: string[] = whiteBoardDataSet.colorList

export {
    renderCanvas,
    renderTemporaryCanvas,
    renderContainer,
    renderOverlay,
    renderPointer,
    renderUndo,
    renderRedo,
    renderEraser,
    renderSave,
    renderOpenFile,
    renderAddPage,
    renderDeletePage,
    renderReset,
    renderPagination,
    renderMoveToolbar,
    renderSelectRange,
    updatePaginationText
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
        let lineWidthDom = createLineWidthRange("bupu-draw", 20)
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
        let lineWidthDom = createLineWidthRange("bupu-write", 20)
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

export function renderImage(): HTMLDivElement {
    let dom = document.createElement("div")
    dom.id = "toolbar-image"
    dom.className = "bupu-toolbar-content__item"
    dom.innerHTML = `<span class="iconfont icon-tupian"></span>`
    tooltip(dom, {
        content: "图片",
        placement: "right"
    })
    return dom
}