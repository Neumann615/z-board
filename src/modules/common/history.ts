import type {
    CanvasOperationItem,
    CanvasPage,
    RectAreaData
} from '../../types'
import { getRectAreaData } from '/src/utils/index'

export type CanvasHistoryEntry = CanvasOperationItem | -1

export const HistoryAction = {
    add: 1,
    move: 0,
    remove: -1,
    stretch: 3,
    toTop: -2,
    toBottom: -3
} as const

export function cloneHistoryData<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export function createHistoryPages(pageCount: number = 3): CanvasPage[] {
    return Array.from({ length: pageCount }, () => ({
        canvasData: [],
        step: -1
    }))
}

export function getHistoryPageData(page: CanvasPage, step = page.step): CanvasOperationItem[] {
    return page.canvasData.slice(0, step + 1)
}

export function appendHistoryOperation(page: CanvasPage, operation: CanvasOperationItem): void {
    page.step += 1
    if (page.step < page.canvasData.length) {
        page.canvasData.length = page.step
    }

    operation.index = page.canvasData.length
    page.canvasData.push(operation)
}

function findEntryIndex(entries: CanvasHistoryEntry[], operationIndex: number | undefined): number {
    if (typeof operationIndex != "number") return -1
    return entries.findIndex(entry => entry != -1 && entry.index === operationIndex)
}

function scaleHistoryDrawData(
    item: CanvasOperationItem,
    widthScale: number,
    heightScale: number,
    currentResolution: { w: number; h: number }
): void {
    const { drawData, drawType } = item.options
    if (!drawData) return

    if (drawType == 0 || drawType == 1) {
        drawData.forEach((point: { x: number; y: number }) => {
            point.x = Math.floor(point.x * widthScale)
            point.y = Math.floor(point.y * heightScale)
        })
        return
    }

    if (drawType == 2) {
        drawData.x = Math.floor(drawData.x * widthScale)
        drawData.y = Math.floor(drawData.y * heightScale)
        drawData.w = Math.floor(drawData.w * widthScale)
        drawData.h = Math.floor(drawData.h * heightScale)
        return
    }

    if (drawType == 3) {
        for (const key of ["x1", "x2", "x3"] as const) {
            drawData[key] = Math.floor(drawData[key] * widthScale)
        }
        for (const key of ["y1", "y2", "y3"] as const) {
            drawData[key] = Math.floor(drawData[key] * heightScale)
        }
        return
    }

    if (drawType == 4) {
        const x1 = Math.floor(item.position.x1 * widthScale)
        const y1 = Math.floor(item.position.y1 * heightScale)
        const x3 = Math.floor(item.position.x3 * widthScale)
        const y3 = Math.floor(item.position.y3 * heightScale)
        drawData.x = (x1 + x3) / 2
        drawData.y = (y1 + y3) / 2
        drawData.r = Math.abs(x3 - x1) / 2
        item.position = getRectAreaData(
            x1,
            (y1 + y3) / 2 - drawData.r,
            x3,
            (y1 + y3) / 2 + drawData.r
        )
        return
    }

    if (drawType == 5) {
        for (const key of ["x1", "x2", "x3", "x4"] as const) {
            drawData[key] = Math.floor(drawData[key] * widthScale)
        }
        for (const key of ["y1", "y2", "y3", "y4"] as const) {
            drawData[key] = Math.floor(drawData[key] * heightScale)
        }
        return
    }

    if (drawType == 7) {
        drawData.x = item.position.x1
        drawData.y = item.position.y1
        drawData.w = item.position.w
        drawData.h = item.position.h
    }

    // drawType 6（文本）由 options.style 保存绝对位置，无需缩放 drawData。
    void currentResolution
}

/** 将历史操作流解析成当前画布应渲染的操作列表。 */
export function resolveHistoryContent(
    canvasData: CanvasOperationItem[],
    currentResolution: { w: number; h: number },
    step?: number
): CanvasOperationItem[] {
    if (!canvasData.length) return []

    let source = canvasData
    if (step !== undefined && canvasData.length - 1 != step) {
        source = canvasData.slice(0, step + 1)
    }

    const entries = cloneHistoryData(source) as CanvasHistoryEntry[]
    const list: CanvasOperationItem[] = []

    entries.forEach((entry, index) => {
        if (entry == -1) return
        const { actionType, options, position, canvasResolution } = entry

        if (actionType == HistoryAction.remove) {
            const removeIndex = findEntryIndex(entries, options.deleteIndex)
            if (removeIndex != -1) entries[removeIndex] = -1
            entries[index] = -1
            return
        }

        if (actionType == HistoryAction.move || actionType == HistoryAction.stretch) {
            const targetIndex = findEntryIndex(
                entries,
                actionType == HistoryAction.move ? options.moveIndex : options.stretchIndex
            )
            if (targetIndex != -1) {
                const target = entries[targetIndex]
                if (target != -1) {
                    target.position = cloneHistoryData(position)
                    target.canvasResolution = cloneHistoryData(canvasResolution)
                    if (options.drawData) {
                        target.options.drawData = cloneHistoryData(options.drawData)
                    }
                }
            }
            entries[index] = -1
        }
    })

    entries.forEach((entry) => {
        if (entry == -1) return

        if (entry.actionType == HistoryAction.toTop) {
            const sourceIndex = findEntryIndex(entries, entry.options.topIndex)
            if (sourceIndex == -1) return
            const [moved] = entries.splice(sourceIndex, 1)
            entries.push(moved)
        } else if (entry.actionType == HistoryAction.toBottom) {
            const sourceIndex = findEntryIndex(entries, entry.options.bottomIndex)
            if (sourceIndex == -1) return
            const [moved] = entries.splice(sourceIndex, 1)
            entries.unshift(moved)
        }
    })

    entries.forEach((entry) => {
        if (entry == -1 || entry.actionType != HistoryAction.add) return
        const widthScale = currentResolution.w / entry.canvasResolution.w
        const heightScale = currentResolution.h / entry.canvasResolution.h
        entry.position = getRectAreaData(
            entry.position.x1 * widthScale,
            entry.position.y1 * heightScale,
            entry.position.x3 * widthScale,
            entry.position.y3 * heightScale
        )
        scaleHistoryDrawData(entry, widthScale, heightScale, currentResolution)
        list.push(entry)
    })

    return list
}
