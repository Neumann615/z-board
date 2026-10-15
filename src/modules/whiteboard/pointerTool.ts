import type { CanvasHistoryItem, CanvasOperationOptions, RectAreaData } from '../../types'
import { getPointsAreaData, getPos, getRectAreaData, isInRectArea, isMobile } from '/src/utils/index'
import { getEventClassName } from '/src/modules/common/selection'
import { HistoryAction } from '/src/modules/common/history'

export interface PointerToolDependencies {
    overlay: HTMLElement
    temporaryCanvas: HTMLElement
    resolution: () => { w: number; h: number }
    historyContent: () => CanvasHistoryItem[]
    setSelectedIndex: (index: number) => void
    updateSelection: (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        selectIndex?: number
    ) => void
    clearSelection: () => void
    addOperation: (
        actionType: number,
        position: RectAreaData,
        options: CanvasOperationOptions
    ) => void
    refresh: () => Promise<void> | void
}

type PointerEvent = MouseEvent | TouchEvent
type StretchDirection =
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "leftTop"
    | "leftBottom"
    | "rightTop"
    | "rightBottom"

let eventController: AbortController | null = null

export function resetPointerTool(): void {
    eventController?.abort()
    eventController = null
}

export function activatePointerTool(dependencies: PointerToolDependencies): void {
    resetPointerTool()
    dependencies.clearSelection()
    dependencies.temporaryCanvas.style.zIndex = "-1"
    dependencies.overlay.style.zIndex = "50"

    let pressed = false
    let first: { x: number; y: number } | null = null
    let last: { x: number; y: number } | null = null
    let selectedArea: CanvasHistoryItem | null = null
    let selectedIndex = -1
    let offset: { x: number; y: number } | null = null
    let stretch: StretchDirection | false | null = null
    let changedDrawData: any = null

    function findSelectedItems(point: { x: number; y: number }): CanvasHistoryItem[] {
        return dependencies.historyContent().filter(item => {
            const position = item.position
            return item.actionType != -1 &&
                item.options.isSelected == 1 &&
                isInRectArea(position.x1, position.y1, position.x3, position.y3, point.x, point.y)
        })
    }

    function updateSelectedArea(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        index?: number
    ): void {
        if (index !== undefined) selectedIndex = index
        dependencies.updateSelection(x1, y1, x2, y2, selectedIndex)
    }

    function clampStretchPoint(point: { x: number; y: number }): void {
        const resolution = dependencies.resolution()
        point.x = Math.min(Math.max(point.x, 15), resolution.w - 15)
        point.y = Math.min(Math.max(point.y, 15), resolution.h - 15)
    }

    function applyStretchMove(
        area: CanvasHistoryItem,
        direction: StretchDirection,
        point: { x: number; y: number }
    ): void {
        const { x1, y1, x3, y3 } = area.position
        switch (direction) {
            case "left":
                dependencies.updateSelection(point.x, y1, x3, y3)
                area.position.x1 = point.x
                area.position.x4 = point.x
                break
            case "right":
                dependencies.updateSelection(x1, y1, point.x, y3)
                area.position.x2 = point.x
                area.position.x3 = point.x
                break
            case "top":
                dependencies.updateSelection(x1, point.y, x3, y3)
                area.position.y1 = point.y
                area.position.y2 = point.y
                break
            case "bottom":
                dependencies.updateSelection(x1, y1, x3, point.y)
                area.position.y3 = point.y
                area.position.y4 = point.y
                break
            case "leftTop":
                dependencies.updateSelection(point.x, point.y, x3, y3)
                area.position.x1 = point.x
                area.position.y1 = point.y
                area.position.y2 = point.y
                area.position.x4 = point.x
                break
            case "leftBottom":
                dependencies.updateSelection(point.x, y1, x3, point.y)
                area.position.x1 = point.x
                area.position.y3 = point.y
                area.position.x4 = point.x
                area.position.y4 = point.y
                break
            case "rightTop":
                dependencies.updateSelection(x1, point.y, point.x, y3)
                area.position.y1 = point.y
                area.position.x2 = point.x
                area.position.y2 = point.y
                area.position.x3 = point.x
                break
            case "rightBottom":
                dependencies.updateSelection(x1, y1, point.x, point.y)
                area.position.x2 = point.x
                area.position.y3 = point.y
                area.position.y4 = point.y
                break
        }
    }

    function begin(event: PointerEvent): void {
        pressed = true
        const point = getPos(event)
        const className = getEventClassName(event)
        const isSelectionHandle = className.includes("select-range-block") ||
            className.includes("select-range-border")

        if (isSelectionHandle) {
            first = point
            stretch = className.split("__")[1] as StretchDirection
            return
        }

        const selectedItems = findSelectedItems(point)
        const selectedItem = selectedItems[selectedItems.length - 1]
        if (!selectedItem) {
            dependencies.clearSelection()
            selectedIndex = -1
            first = null
            selectedArea = null
            stretch = false
            return
        }

        // 文本节点当前仍不支持二次选中编辑。
        if (selectedItem.options.drawType == 6) return

        selectedArea = JSON.parse(JSON.stringify(selectedItem)) as CanvasHistoryItem
        selectedIndex = selectedArea.index
        dependencies.setSelectedIndex(selectedIndex)
        first = point
        stretch = false
        const { x1, y1, x3, y3 } = selectedArea.position
        updateSelectedArea(x1, y1, x3, y3, selectedIndex)
    }

    function move(event: PointerEvent): void {
        if (!pressed || !first || selectedIndex == -1 || !selectedArea) {
            pressed = false
            return
        }

        const area = selectedArea
        const { x1, y1, x2, y2, x3, y3 } = area.position
        last = getPos(event)
        const className = getEventClassName(event)
        const isSelectionHandle = className.includes("select-range-block") ||
            className.includes("select-range-border")

        if (stretch) {
            const canStretch = isMobile() || !isSelectionHandle
            if (!canStretch) return

            const point = last
            clampStretchPoint(point)
            applyStretchMove(area, stretch, point)
            return
        }

        offset = {
            x: last.x - first.x,
            y: last.y - first.y
        }
        const resolution = dependencies.resolution()
        if (x1 + offset.x - 5 <= 0) offset.x = 5 - x1
        if (y1 + offset.y - 5 <= 0) offset.y = 5 - y1
        if (x3 + offset.x + 5 >= resolution.w) offset.x = resolution.w - x3 - 5
        if (y3 + offset.y + 5 >= resolution.h) offset.y = resolution.h - y3 - 5

        updateSelectedArea(
            x1 + offset.x,
            y1 + offset.y,
            x3 + offset.x,
            y3 + offset.y,
            selectedIndex
        )
        void x2
        void y2
    }

    function end(): void {
        pressed = false
        if (!last || selectedIndex == -1 || !selectedArea) return

        const area = selectedArea
        let position: RectAreaData
        if (stretch) {
            position = getRectAreaData(area.position.x1, area.position.y1, area.position.x3, area.position.y3)
        } else {
            if (!offset) return
            position = getRectAreaData(
                area.position.x1 + offset.x,
                area.position.y1 + offset.y,
                area.position.x3 + offset.x,
                area.position.y3 + offset.y
            )
            area.position = position
        }

        const { drawData, drawType } = area.options
        let changedData: any
        if (drawType == 0 || drawType == 1) {
            changedData = []
            const widthScale = position.w / area.position.w
            const heightScale = position.h / area.position.h
            drawData.forEach((point: { x: number; y: number }) => {
                changedData.push({
                    x: Math.floor(point.x * widthScale),
                    y: Math.floor(point.y * heightScale)
                })
            })

            if (stretch) {
                const pointsArea = getPointsAreaData(changedData)
                if (!pointsArea) return
                changedData.forEach((point: { x: number; y: number }) => {
                    point.x -= pointsArea.x1 - position.x1
                    point.y -= pointsArea.y1 - position.y1
                })
            } else {
                changedData.forEach((point: { x: number; y: number }) => {
                    point.x += offset!.x
                    point.y += offset!.y
                })
            }
        } else if (drawType == 2) {
            changedData = {
                x: stretch ? position.x1 : drawData.x + offset!.x,
                y: stretch ? position.y1 : drawData.y + offset!.y,
                w: stretch ? position.w : drawData.w,
                h: stretch ? position.h : drawData.h
            }
        } else if (drawType == 3) {
            changedData = {
                x1: stretch ? (position.x1 + position.x3) / 2 : drawData.x1 + offset!.x,
                y1: stretch ? position.y1 : drawData.y1 + offset!.y,
                x2: stretch ? position.x1 : drawData.x2 + offset!.x,
                y2: stretch ? position.y3 : drawData.y2 + offset!.y,
                x3: stretch ? position.x3 : drawData.x3 + offset!.x,
                y3: stretch ? position.y3 : drawData.y3 + offset!.y
            }
        } else if (drawType == 4) {
            changedData = {
                x: stretch ? (position.x1 + position.x3) / 2 : drawData.x + offset!.x,
                y: stretch ? (position.y1 + position.y3) / 2 : drawData.y + offset!.y,
                r: stretch ? Math.abs(position.x1 - position.x3) / 2 : drawData.r
            }
            if (stretch) {
                position = getRectAreaData(
                    position.x1,
                    (position.y1 + position.y3) / 2 - changedData.r,
                    position.x3,
                    (position.y1 + position.y3) / 2 + changedData.r
                )
                dependencies.updateSelection(position.x1, position.y1, position.x3, position.y3)
            }
        } else if (drawType == 5) {
            changedData = {
                x1: stretch ? (position.x1 + position.x3) / 2 : drawData.x1 + offset!.x,
                y1: stretch ? position.y1 : drawData.y1 + offset!.y,
                x2: stretch ? position.x3 : drawData.x2 + offset!.x,
                y2: stretch ? (position.y1 + position.y3) / 2 : drawData.y2 + offset!.y,
                x3: stretch ? (position.x1 + position.x3) / 2 : drawData.x3 + offset!.x,
                y3: stretch ? position.y3 : drawData.y3 + offset!.y,
                x4: stretch ? position.x1 : drawData.x4 + offset!.x,
                y4: stretch ? (position.y1 + position.y3) / 2 : drawData.y4 + offset!.y
            }
        } else if (drawType == 6) {
            return
        } else if (drawType == 7) {
            changedData = {
                x: stretch ? position.x1 : drawData.x + offset!.x,
                y: stretch ? position.y1 : drawData.y + offset!.y,
                w: stretch ? position.w : drawData.w,
                h: stretch ? position.h : drawData.h,
                imageUrl: drawData.imageUrl
            }
        }

        dependencies.addOperation(
            stretch ? HistoryAction.stretch : HistoryAction.move,
            position,
            stretch
                ? { stretchIndex: selectedIndex, drawData: changedData, isSelected: 1 }
                : { moveIndex: selectedIndex, drawData: changedData, isSelected: 1 }
        )
        Promise.resolve(dependencies.refresh()).catch(error => {
            console.error("z-board pointer refresh failed:", error)
        })

        last = null
        first = null
        changedDrawData = null
        offset = null
    }

    eventController = new AbortController()
    const signal = eventController.signal
    const options: AddEventListenerOptions = { signal }
    dependencies.overlay.addEventListener("mousedown", begin, options)
    dependencies.overlay.addEventListener("mousemove", move, options)
    dependencies.overlay.addEventListener("mouseup", end, options)
    dependencies.overlay.addEventListener("touchstart", begin, options)
    dependencies.overlay.addEventListener("touchmove", move, options)
    dependencies.overlay.addEventListener("touchend", end, options)
    window.addEventListener("mouseup", end, options)
    window.addEventListener("touchend", end, options)

    void changedDrawData
}
