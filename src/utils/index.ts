import type { Point, RectArea } from '../types'

export * from "./canvas"
export * from "./var"

export function fileToUrl(file: File): string | null {
    let url: string | null = null
    if (window.createObjectURL) {
        url = window.createObjectURL(file)
    } else if (window.URL) {
        url = window.URL.createObjectURL(file)
    } else if (window.webkitURL) {
        url = window.webkitURL.createObjectURL(file)
    }
    return url
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
    let isTouch = event.type.indexOf("touch") >= 0
    let x: number
    let y: number
    
    if (isTouch && 'touches' in event) {
        x = event.touches[0].pageX
        y = event.touches[0].pageY
    } else if ('offsetX' in event && 'target' in event && event.target instanceof Element) {
        x = event.offsetX + event.target.offsetLeft
        y = event.offsetY + event.target.offsetTop
    } else {
        x = 0
        y = 0
    }
    
    return { x, y }
}

export function getRectAreaData(x1: number, y1: number, x2: number, y2: number): RectArea & { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; x4: number; y4: number; area: number } {
    if (x1 == x2) {
        x1 = x1 + 5
        x2 = x2 - 5
    }
    if (y1 == y2) {
        y1 = y1 + 5
        y2 = y2 - 5
    }
    
    const result: Record<string, number> = {
        w: Math.abs(x1 - x2),
        h: Math.abs(y1 - y2),
        area: Math.abs((x1 - x2) * (y1 - y2))
    }

    if (x1 > x2 && y1 > y2) {
        Object.assign(result, { x1: x2, y1: y2, x2: x1, y2: y2, x3: x1, y3: y1, x4: x2, y4: y1 })
    } else if (x1 > x2 && y1 < y2) {
        Object.assign(result, { x1: x2, y1: y1, x2: x1, y2: y1, x3: x1, y3: y2, x4: x2, y4: y2 })
    } else if (x1 < x2 && y1 > y2) {
        Object.assign(result, { x1: x1, y1: y2, x2: x2, y2: y2, x3: x2, y3: y1, x4: x1, y4: y1 })
    } else if (x1 < x2 && y1 < y2) {
        Object.assign(result, { x1: x1, y1: y1, x2: x2, y2: y1, x3: x2, y3: y2, x4: x1, y4: y2 })
    }

    for (let key in result) {
        result[key] = Math.floor(result[key])
    }

    return result as RectArea & { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; x4: number; y4: number; area: number }
}

export function getPointsAreaData(pointsList: Point[]): (RectArea & { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; x4: number; y4: number; area: number }) | undefined {
    if (!pointsList.length) return undefined
    
    let _pointsList = JSON.parse(JSON.stringify(pointsList))
    _pointsList.sort((a: Point, b: Point) => a.x - b.x)
    
    let xPoint1 = _pointsList[0]
    let xPoint2 = _pointsList[_pointsList.length - 1]
    
    _pointsList.sort((a: Point, b: Point) => a.y - b.y)
    
    let yPoint1 = _pointsList[0]
    let yPoint2 = _pointsList[_pointsList.length - 1]
    
    const result = {
        x1: xPoint1.x,
        x2: xPoint2.x,
        x3: xPoint2.x,
        x4: xPoint1.x,
        y1: yPoint1.y,
        y2: yPoint1.y,
        y3: yPoint2.y,
        y4: yPoint1.y,
        w: Math.abs(xPoint1.x - xPoint2.x),
        h: Math.abs(yPoint1.y - yPoint2.y),
        area: Math.abs((xPoint1.x - xPoint2.x) * (yPoint1.y - yPoint2.y))
    }
    
    for (let key in result) {
        result[key] = Math.floor(result[key])
    }
    
    return result
}

export function changeIsSelected(domList: HTMLCollectionOf<Element>, selectDom: Element): void {
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

export function setObjAttributes<T extends object, K extends keyof T>(obj: T, options: Partial<T>): void {
    if (!obj || !options) return
    for (let key in options) {
        obj[key] = options[key] as T[K]
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