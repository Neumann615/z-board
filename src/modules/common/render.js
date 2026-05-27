import {
    tooltip
} from "/src/components/tooltip"
import {
    popover
} from "/src/components/popover"
import borderGif from "/src/assets/image/border.gif"
import {
    domAppendChild
} from "/src/utils/index"

// ============================================
// 基础 DOM 元素渲染
// ============================================

/**
 * 创建主画布元素
 * @returns {HTMLCanvasElement}
 */
export function renderCanvas() {
    let canvas = document.createElement("canvas")
    canvas.className = "bupu-canvas"
    return canvas
}

/**
 * 创建临时画布元素（用于绘制过程中的预览）
 * @returns {HTMLCanvasElement}
 */
export function renderTemporaryCanvas() {
    let canvas = document.createElement("canvas")
    canvas.className = "bupu-temporary-canvas"
    return canvas
}

/**
 * 创建画板容器元素
 * @returns {HTMLDivElement}
 */
export function renderContainer() {
    let container = document.createElement("div")
    container.className = "bupu-container"
    return container
}

/**
 * 创建遮罩层元素
 * @returns {HTMLDivElement}
 */
export function renderOverlay() {
    let dom = document.createElement("div")
    dom.className = "bupu-overlay"
    return dom
}

// ============================================
// 工具栏工具渲染
// ============================================

/**
 * 创建绘图工具按钮（矩形、三角形、圆形、菱形）
 * @param {string[]} colorTypeList - 可选颜色列表
 * @param {Object} options - 配置选项
 * @param {number} options.lineWidth - 默认线条粗细
 * @returns {HTMLDivElement}
 */
export function renderDraw(colorTypeList, options = {}) {
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

    /**
     * 获取绘图工具的弹窗内容
     * 包含：图形类型选择、线条粗细、颜色选择
     */
    function getPopoverDom() {
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
            shapeItem.setAttribute("shapeType", index)
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

/**
 * 创建书写工具按钮（自由曲线、直线）
 * @param {string[]} colorTypeList - 可选颜色列表
 * @param {Object} options - 配置选项
 * @param {number} options.lineWidth - 默认线条粗细
 * @returns {HTMLDivElement}
 */
export function renderWrite(colorTypeList, options = {}) {
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

    /**
     * 获取书写工具的弹窗内容
     * 包含：线条类型选择、线条粗细、颜色选择
     */
    function getPopoverDom() {
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
            lineTypeItem.setAttribute("lineType", index)
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

/**
 * 创建文本工具按钮
 * @param {string[]} colorTypeList - 可选颜色列表
 * @returns {HTMLDivElement}
 */
export function renderText(colorTypeList) {
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

    /**
     * 获取文本工具的弹窗内容
     * 包含：字体大小、颜色选择
     */
    function getPopoverDom() {
        let popoverDom = document.createDocumentFragment()
        let fontSizeDom = createLineWidthRange("bupu-text", 30)
        let colorDom = createColorModule(colorTypeList, "bupu-text")
        domAppendChild(popoverDom, [fontSizeDom, colorDom])
        return popoverDom
    }

    return dom
}

/**
 * 创建指针工具按钮
 * @returns {HTMLDivElement}
 */
export function renderPointer() {
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

/**
 * 创建撤销工具按钮
 * @returns {HTMLDivElement}
 */
export function renderUndo() {
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

/**
 * 创建反撤销工具按钮
 * @returns {HTMLDivElement}
 */
export function renderRedo() {
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

/**
 * 创建橡皮擦工具按钮
 * @returns {HTMLDivElement}
 */
export function renderEraser() {
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

/**
 * 创建保存工具按钮
 * @returns {HTMLDivElement}
 */
export function renderSave() {
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

/**
 * 创建打开文件工具按钮
 * @returns {HTMLDivElement}
 */
export function renderOpenFile() {
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

/**
 * 创建添加页面工具按钮
 * @returns {HTMLDivElement}
 */
export function renderAddPage() {
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

/**
 * 创建删除页面工具按钮
 * @returns {HTMLDivElement}
 */
export function renderDeletePage() {
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

/**
 * 创建重置工具按钮
 * @returns {HTMLDivElement}
 */
export function renderReset() {
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

// ============================================
// 分页器与工具栏布局
// ============================================

/**
 * 创建分页器组件（上一页、当前页、下一页）
 * @returns {HTMLDivElement}
 */
export function renderPagination() {
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

/**
 * 创建选中元素的移动工具栏（置顶、置底）
 * @returns {HTMLDivElement}
 */
export function renderMoveToolbar() {
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

// ============================================
// 选中范围与边界渲染
// ============================================

/**
 * 创建选中范围框（带8个控制点和4条边线）
 * @returns {HTMLDivElement}
 */
export function renderSelectRange() {
    let selectBox = document.createElement("div")
    selectBox.id = "bupu-select-range"

    // 4条边线
    let borderList = ["left", "right", "top", "bottom"]
    borderList.forEach(item => {
        let borderDom = document.createElement("div")
        borderDom.className = "select-range-border__" + item
        borderDom.style.background = `url(${borderGif})`
        selectBox.appendChild(borderDom)
    })

    // 8个控制点（用于缩放）
    let blockList = ["left", "right", "top", "bottom", "leftTop", "leftBottom", "rightTop", "rightBottom"]
    blockList.forEach(item => {
        let blockDom = document.createElement("div")
        blockDom.className = "select-range-block__" + item
        selectBox.appendChild(blockDom)
    })

    return selectBox
}

/**
 * 更新分页器显示的页码文本
 * @param {string} v - 页码文本，格式如 "1/3"
 */
export function updatePaginationText(v) {
    let paginationTextDom = document.getElementById("toolbar-pagination-page")
    if (paginationTextDom) {
        paginationTextDom.innerHTML = v
    }
}

// ============================================
// 公共辅助函数
// ============================================

/**
 * 创建颜色选择模块
 * @param {string[]} colorTypeList - 颜色列表
 * @param {string} prefix - DOM 元素 ID 前缀
 * @param {number} defaultIndex - 默认选中的索引
 * @returns {HTMLDivElement}
 */
function createColorModule(colorTypeList, prefix, defaultIndex = 0) {
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

/**
 * 创建线条粗细滑动条
 * @param {string} prefix - DOM 元素 ID 前缀
 * @param {number} defaultValue - 默认值
 * @returns {HTMLDivElement}
 */
function createLineWidthRange(prefix, defaultValue = 20) {
    let rangeDom = document.createElement("div")
    rangeDom.className = "bupu-range"

    let rangeInput = document.createElement("input")
    rangeInput.type = "range"
    rangeInput.value = defaultValue
    rangeInput.id = `${prefix}-linewidth`

    rangeDom.appendChild(rangeInput)
    return rangeDom
}