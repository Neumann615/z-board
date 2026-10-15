import type { Point, RectAreaData } from '../types'

export * from "./canvas"
export * from "./var"

export function fileToUrl(file: File): string {
    return window.URL.createObjectURL(file)
}

export function fileToBase64(file: File): Promise<string> {
    let reader = new FileReader()
    reader.readAsDataURL(file)
    return new Promise((resolve, reject) => {
        reader.onload = function (e) {
            if (this.result) {
                resolve(this.result as string)
            } else {
                reject("读取失败")
            }
        }
    })
}

export function domAppendChild(dom: Node, domList: Node[]): Node {
    domList.forEach(childDom => {
        dom.appendChild(childDom)
    })
    return dom
}

export function getPos(event: MouseEvent | TouchEvent): Point {
    const isTouch = event.type.startsWith("touch")
    let x = 0
    let y = 0

    if (isTouch) {
        const touchEvent = event as TouchEvent
        const touch = (touchEvent.type.endsWith("end") || touchEvent.type.endsWith("cancel")
            ? touchEvent.changedTouches[0]
            : touchEvent.touches[0])
        if (touch) {
            x = touch.pageX
            y = touch.pageY
        }
    } else {
        const mouseEvent = event as MouseEvent
        x = mouseEvent.offsetX
        y = mouseEvent.offsetY
    }

    return { x, y }
}

export function getRectAreaData(x1: number, y1: number, x2: number, y2: number): RectAreaData {
    if (x1 === x2) {
        x1 += 5
        x2 -= 5
    }
    if (y1 === y2) {
        y1 += 5
        y2 -= 5
    }

    const result: RectAreaData = {
        x1: 0, y1: 0, x2: 0, y2: 0,
        x3: 0, y3: 0, x4: 0, y4: 0,
        w: 0, h: 0, area: 0
    }

    if (x1 > x2 && y1 > y2) {
        Object.assign(result, { x1: x2, y1: y2, x2: x1, y2: y2, x3: x1, y3: y1, x4: x2, y4: y1 })
    } else if (x1 > x2 && y1 < y2) {
        Object.assign(result, { x1: x2, y1: y1, x2: x1, y2: y1, x3: x1, y3: y2, x4: x2, y4: y2 })
    } else if (x1 < x2 && y1 > y2) {
        Object.assign(result, { x1: x1, y1: y2, x2: x2, y2: y2, x3: x2, y3: y1, x4: x1, y4: y1 })
    } else {
        Object.assign(result, { x1: x1, y1: y1, x2: x2, y2: y1, x3: x2, y3: y2, x4: x1, y4: y2 })
    }

    result.w = Math.floor(Math.abs(x1 - x2))
    result.h = Math.floor(Math.abs(y1 - y2))
    result.area = result.w * result.h

    for (const key of ["x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4"] as const) {
        result[key] = Math.floor(result[key])
    }

    return result
}

export function getPointsAreaData(pointsList: Point[]): RectAreaData | undefined {
    if (!pointsList.length) return undefined

    const sortedByX = [...pointsList].sort((a, b) => a.x - b.x)
    const sortedByY = [...pointsList].sort((a, b) => a.y - b.y)
    const x1 = sortedByX[0].x
    const x3 = sortedByX[sortedByX.length - 1].x
    const y1 = sortedByY[0].y
    const y3 = sortedByY[sortedByY.length - 1].y

    return {
        x1,
        y1,
        x2: x3,
        y2: y1,
        x3,
        y3,
        x4: x1,
        y4: y3,
        w: Math.floor(Math.abs(x1 - x3)),
        h: Math.floor(Math.abs(y1 - y3)),
        area: Math.floor(Math.abs((x1 - x3) * (y1 - y3)))
    }
}

export function changeIsSelected(domList: Element[] | HTMLCollectionOf<Element>, selectDom: Element): void {
    for (let i = 0; i < domList.length; i++) {
        domList[i].classList.remove("is-selected")
    }
    selectDom.classList.add("is-selected")
}

export function isInRectArea(x1: number, y1: number, x2: number, y2: number, x: number, y: number): boolean {
    return ((x >= x1 && x <= x2) && (y >= y1 && y <= y2)) || 
           ((x >= x2 && x <= x1) && (y >= y1 && y <= y2)) || 
           ((x >= x2 && x <= x1) && (y >= y2 && y <= y1)) || 
           ((x >= x1 && x <= x2) && (y >= y2 && y <= y1))
}

export function setObjAttributes<T extends object>(obj: T, options: Partial<T>): void {
    if (!obj || !options) return
    for (const [key, value] of Object.entries(options)) {
        (obj as Record<string, unknown>)[key] = value
    }
}

export function initPosition(dom: HTMLElement): void {
    dom.style.left = "0px"
    dom.style.right = "0px"
    dom.style.top = "0px"
    dom.style.bottom = "0px"
}

export function isMobile(): boolean {
    return /(iPhone|iPad|iPod|iOS|Android|Linux armv8l|Linux armv7l|Linux aarch64)/i.test(navigator.platform)
}

export function preventDefaultEvents(e: Event): boolean {
    e.stopPropagation?.()
    e.preventDefault?.()
    return false
}