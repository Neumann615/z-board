import {
    changeIsSelected
} from "/src/utils/index"

// ============================================
// 书写工具事件绑定
// ============================================

/**
 * 绑定书写工具的事件监听
 * @param {Object} options - 书写工具配置
 * @param {Function} writeCallback - 书写状态变更回调
 */
export function bindWriteEvents(options, writeCallback) {
    let writeLineTypeDom = document.getElementById("bupu-write-linetype")
    let writeColorDom = document.getElementById("bupu-write-color")
    let writeLineWidthDom = document.getElementById("bupu-write-linewidth")

    if (!writeLineTypeDom || !writeColorDom || !writeLineWidthDom) return

    /**
     * 设置线条类型（自由曲线/直线）
     */
    function setLineType(e) {
        if (e.srcElement.className.includes("bupu-module-item")) {
            changeIsSelected(writeLineTypeDom.children, e.srcElement)
            options.lineType = Number(e.srcElement.getAttribute("lineType"))
            writeCallback(options)
        }
    }

    /**
     * 设置线条粗细
     */
    function setLineWidth(e) {
        let value = Number(e.srcElement.value) * 0.1
        if (value === 0) {
            value = 1
        }
        options.lineWidth = Number(value.toFixed(0))
        writeCallback(options)
    }

    /**
     * 设置颜色
     */
    function setColor(e) {
        if (e.srcElement.className.includes("bupu-module-item")) {
            changeIsSelected(writeColorDom.children, e.srcElement)
            options.color = e.srcElement.getAttribute("color")
            writeCallback(options)
        }
    }

    writeLineWidthDom.removeEventListener("change", setLineWidth)
    writeLineTypeDom.removeEventListener("click", setLineType)
    writeColorDom.removeEventListener("click", setColor)
    writeLineWidthDom.addEventListener("change", setLineWidth)
    writeLineTypeDom.addEventListener("click", setLineType)
    writeColorDom.addEventListener("click", setColor)
}

// ============================================
// 绘图工具事件绑定
// ============================================

/**
 * 绑定绘图工具的事件监听
 * @param {Object} options - 绘图工具配置
 * @param {Function} drawCallback - 绘图状态变更回调
 */
export function bindDrawEvents(options, drawCallback) {
    let drawShapeTypeDom = document.getElementById("bupu-draw-shapetype")
    let drawColorDom = document.getElementById("bupu-draw-color")
    let drawLineWidthDom = document.getElementById("bupu-draw-linewidth")

    if (!drawShapeTypeDom || !drawColorDom || !drawLineWidthDom) return

    /**
     * 设置图形类型（矩形/三角形/圆形/菱形）
     */
    function setShapeType(e) {
        if (e.srcElement.className.includes("bupu-module-item")) {
            changeIsSelected(drawShapeTypeDom.children, e.srcElement)
            options.shapeType = Number(e.srcElement.getAttribute("shapeType"))
            drawCallback(options)
        }
    }

    /**
     * 设置线条粗细
     */
    function setLineWidth(e) {
        let value = Number(e.srcElement.value) * 0.1
        if (value === 0) {
            value = 1
        }
        options.lineWidth = Number(value.toFixed(0))
        drawCallback(options)
    }

    /**
     * 设置颜色
     */
    function setColor(e) {
        if (e.srcElement.className.includes("bupu-module-item")) {
            changeIsSelected(drawColorDom.children, e.srcElement)
            options.color = e.srcElement.getAttribute("color")
            drawCallback(options)
        }
    }

    drawLineWidthDom.removeEventListener("change", setLineWidth)
    drawShapeTypeDom.removeEventListener("click", setShapeType)
    drawColorDom.removeEventListener("click", setColor)
    drawLineWidthDom.addEventListener("change", setLineWidth)
    drawShapeTypeDom.addEventListener("click", setShapeType)
    drawColorDom.addEventListener("click", setColor)
}

// ============================================
// 文本工具事件绑定
// ============================================

/**
 * 绑定文本工具的事件监听
 * @param {Object} options - 文本工具配置
 * @param {Function} textCallback - 文本状态变更回调
 */
export function bindTextEvents(options, textCallback) {
    let textFontDom = document.getElementById("bupu-text-linewidth")
    let textColorDom = document.getElementById("bupu-text-color")

    if (!textFontDom || !textColorDom) return

    /**
     * 设置字体大小
     */
    function setFont(e) {
        let value = Number(e.srcElement.value) * 0.5
        if (value === 0) {
            value = 1
        }
        options.fontSize = Number(value.toFixed(0))
        options.font = options.fontSize + "px Arial"
        textCallback(options)
    }

    /**
     * 设置颜色
     */
    function setColor(e) {
        if (e.srcElement.className.includes("bupu-module-item")) {
            changeIsSelected(textColorDom.children, e.srcElement)
            options.color = e.srcElement.getAttribute("color")
            textCallback(options)
        }
    }

    textFontDom.removeEventListener("change", setFont)
    textColorDom.removeEventListener("click", setColor)
    textFontDom.addEventListener("change", setFont)
    textColorDom.addEventListener("click", setColor)
}