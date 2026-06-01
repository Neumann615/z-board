import { changeIsSelected } from "/src/utils/index"
import type { TextOptions, WriteOptions, DrawOptions } from '/src/types'

interface EventHandlers {
    write?: {
        setLineType: (e: Event) => void
        setLineWidth: (e: Event) => void
        setColor: (e: Event) => void
    }
    draw?: {
        setShapeType: (e: Event) => void
        setLineWidth: (e: Event) => void
        setColor: (e: Event) => void
    }
    text?: {
        setFont: (e: Event) => void
        setColor: (e: Event) => void
    }
}

const eventHandlers: EventHandlers = {}

export function bindWriteEvents(options: WriteOptions, writeCallback: (options: WriteOptions) => void): void {
    let writeLineTypeDom = document.getElementById("bupu-write-linetype")
    let writeColorDom = document.getElementById("bupu-write-color")
    let writeLineWidthDom = document.getElementById("bupu-write-linewidth")

    if (!writeLineTypeDom || !writeColorDom || !writeLineWidthDom) return

    if (eventHandlers.write) {
        writeLineWidthDom.removeEventListener("change", eventHandlers.write.setLineWidth)
        writeLineTypeDom.removeEventListener("click", eventHandlers.write.setLineType)
        writeColorDom.removeEventListener("click", eventHandlers.write.setColor)
    }

    eventHandlers.write = {
        setLineType(e: Event): void {
            const target = e.srcElement as HTMLElement
            if (target.className.includes("bupu-module-item")) {
                const dom = document.getElementById("bupu-write-linetype")
                if (dom) {
                    changeIsSelected(dom.children as HTMLCollectionOf<Element>, target)
                    options.lineType = Number(target.getAttribute("lineType"))
                    writeCallback(options)
                }
            }
        },
        setLineWidth(e: Event): void {
            const target = e.srcElement as HTMLInputElement
            let value = Number(target.value) * 0.1
            if (value === 0) {
                value = 1
            }
            options.lineWidth = Number(value.toFixed(0))
            writeCallback(options)
        },
        setColor(e: Event): void {
            const target = e.srcElement as HTMLElement
            if (target.className.includes("bupu-module-item")) {
                const dom = document.getElementById("bupu-write-color")
                if (dom) {
                    changeIsSelected(dom.children as HTMLCollectionOf<Element>, target)
                    options.color = target.getAttribute("color") || ""
                    writeCallback(options)
                }
            }
        }
    }

    writeLineWidthDom.addEventListener("change", eventHandlers.write.setLineWidth)
    writeLineTypeDom.addEventListener("click", eventHandlers.write.setLineType)
    writeColorDom.addEventListener("click", eventHandlers.write.setColor)
}

export function bindDrawEvents(options: DrawOptions, drawCallback: (options: DrawOptions) => void): void {
    let drawShapeTypeDom = document.getElementById("bupu-draw-shapetype")
    let drawColorDom = document.getElementById("bupu-draw-color")
    let drawLineWidthDom = document.getElementById("bupu-draw-linewidth")

    if (!drawShapeTypeDom || !drawColorDom || !drawLineWidthDom) return

    if (eventHandlers.draw) {
        drawLineWidthDom.removeEventListener("change", eventHandlers.draw.setLineWidth)
        drawShapeTypeDom.removeEventListener("click", eventHandlers.draw.setShapeType)
        drawColorDom.removeEventListener("click", eventHandlers.draw.setColor)
    }

    eventHandlers.draw = {
        setShapeType(e: Event): void {
            const target = e.srcElement as HTMLElement
            if (target.className.includes("bupu-module-item")) {
                const dom = document.getElementById("bupu-draw-shapetype")
                if (dom) {
                    changeIsSelected(dom.children as HTMLCollectionOf<Element>, target)
                    options.shapeType = Number(target.getAttribute("shapeType"))
                    drawCallback(options)
                }
            }
        },
        setLineWidth(e: Event): void {
            const target = e.srcElement as HTMLInputElement
            let value = Number(target.value) * 0.1
            if (value === 0) {
                value = 1
            }
            options.lineWidth = Number(value.toFixed(0))
            drawCallback(options)
        },
        setColor(e: Event): void {
            const target = e.srcElement as HTMLElement
            if (target.className.includes("bupu-module-item")) {
                const dom = document.getElementById("bupu-draw-color")
                if (dom) {
                    changeIsSelected(dom.children as HTMLCollectionOf<Element>, target)
                    options.color = target.getAttribute("color") || ""
                    drawCallback(options)
                }
            }
        }
    }

    drawLineWidthDom.addEventListener("change", eventHandlers.draw.setLineWidth)
    drawShapeTypeDom.addEventListener("click", eventHandlers.draw.setShapeType)
    drawColorDom.addEventListener("click", eventHandlers.draw.setColor)
}

export function bindTextEvents(options: TextOptions, textCallback: (options: TextOptions) => void): void {
    let textFontDom = document.getElementById("bupu-text-linewidth")
    let textColorDom = document.getElementById("bupu-text-color")

    if (!textColorDom) return

    if (eventHandlers.text) {
        if (textFontDom) {
            textFontDom.removeEventListener("change", eventHandlers.text.setFont)
        }
        textColorDom.removeEventListener("click", eventHandlers.text.setColor)
    }

    eventHandlers.text = {
        setFont(e: Event): void {
            const target = e.srcElement as HTMLInputElement
            let value = Number(target.value) * 0.5
            if (value === 0) {
                value = 1
            }
            options.fontSize = Number(value.toFixed(0))
            options.font = options.fontSize + "px Arial"
            textCallback(options)
        },
        setColor(e: Event): void {
            const target = e.srcElement as HTMLElement
            if (target.className.includes("bupu-module-item")) {
                const dom = document.getElementById("bupu-text-color")
                if (dom) {
                    changeIsSelected(dom.children as HTMLCollectionOf<Element>, target)
                    options.color = target.getAttribute("color") || ""
                    textCallback(options)
                }
            }
        }
    }

    if (textFontDom) {
        textFontDom.addEventListener("change", eventHandlers.text.setFont)
    }
    textColorDom.addEventListener("click", eventHandlers.text.setColor)
}

export function resetEventBindings(): void {
    eventHandlers.write = undefined
    eventHandlers.draw = undefined
    eventHandlers.text = undefined
}
