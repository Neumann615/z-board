import { describe, expect, it } from 'vitest'
import {
    appendHistoryOperation,
    createHistoryPages,
    getHistoryPageData,
    HistoryAction,
    resolveHistoryContent
} from '/src/modules/common/history'
import type { CanvasOperationItem, CanvasPage, RectAreaData } from '/src/types'

const resolution = { w: 800, h: 400 }

function rectangle(x1: number, y1: number, x2: number, y2: number): RectAreaData {
    return {
        x1,
        y1,
        x2,
        y2: y1,
        x3: x2,
        y3: y2,
        x4: x1,
        y4: y2,
        w: Math.abs(x2 - x1),
        h: Math.abs(y2 - y1),
        area: Math.abs((x2 - x1) * (y2 - y1))
    }
}

function addOperation(
    index: number,
    drawData: Record<string, unknown>,
    pageResolution: { w: number; h: number } = resolution
): CanvasOperationItem {
    return {
        actionType: HistoryAction.add,
        position: rectangle(100, 100, 500, 300),
        options: {
            drawType: 2,
            isSelected: 1,
            drawData
        },
        index,
        canvasResolution: { ...pageResolution }
    }
}

describe('canvas history pages', () => {
    it('creates empty pages with an undo-safe step', () => {
        const pages = createHistoryPages(3)

        expect(pages).toHaveLength(3)
        expect(pages[0].canvasData).toEqual([])
        expect(pages[0].step).toBe(-1)
    })

    it('appends operations, assigns indices, and truncates redo entries', () => {
        const page: CanvasPage = createHistoryPages(1)[0]
        appendHistoryOperation(page, addOperation(0, { x: 10 }))

        page.canvasData.push(addOperation(1, { x: 20 }))
        page.step = 0

        appendHistoryOperation(page, addOperation(2, { x: 30 }))

        expect(page.step).toBe(1)
        expect(page.canvasData.map(item => item.options.drawData)).toEqual([{ x: 10 }, { x: 30 }])
    })

    it('returns history through the active step', () => {
        const page: CanvasPage = createHistoryPages(1)[0]
        page.canvasData = [
            addOperation(0, { name: 'kept' }),
            addOperation(1, { name: 'redo' })
        ]
        page.step = 0

        expect(getHistoryPageData(page)).toHaveLength(1)
        expect(getHistoryPageData(page)[0].options.drawData).toEqual({ name: 'kept' })
    })
})

describe('canvas history resolution', () => {
    it('scales additions when canvas resolution changes', () => {
        const history = [addOperation(0, { x: 100, y: 80, w: 200, h: 120 })]

        const content = resolveHistoryContent(history, { w: 400, h: 200 })

        expect(content[0].position).toMatchObject({ x1: 50, y1: 50, x3: 250, y3: 150 })
        expect(content[0].options.drawData).toEqual({ x: 50, y: 40, w: 100, h: 60 })
    })

    it('scales text position and font size with the canvas', () => {
        const history = [{
            actionType: HistoryAction.add,
            position: rectangle(100, 100, 400, 300),
            options: {
                drawType: 6,
                text: 'hello',
                isSelected: 1,
                style: { fontSize: 20, left: 100, top: 100, color: '#000000' }
            },
            index: 0,
            canvasResolution: resolution
        }]

        const content = resolveHistoryContent(history, { w: 400, h: 200 })

        expect(content[0].options.style).toEqual({
            fontSize: 10,
            left: 50,
            top: 50,
            color: '#000000'
        })
        expect(content[0].position).toMatchObject({ x1: 50, y1: 50, x3: 200, y3: 150 })
    })

    it('applies a text move through operation style', () => {
        const history = [
            {
                actionType: HistoryAction.add,
                position: rectangle(100, 100, 300, 200),
                options: {
                    drawType: 6,
                    text: 'hello',
                    isSelected: 1,
                    style: { fontSize: 16, left: 100, top: 100, color: '#000000' }
                },
                index: 0,
                canvasResolution: resolution
            },
            {
                actionType: HistoryAction.move,
                position: rectangle(250, 180, 450, 280),
                options: {
                    moveIndex: 0,
                    isSelected: 1,
                    style: { fontSize: 16, left: 250, top: 180, color: '#000000' }
                },
                index: 1,
                canvasResolution: resolution
            }
        ]

        const content = resolveHistoryContent(history, resolution)

        expect(content).toHaveLength(1)
        expect(content[0].options.text).toBe('hello')
        expect(content[0].options.style).toEqual({ fontSize: 16, left: 250, top: 180, color: '#000000' })
        expect(content[0].position).toEqual(rectangle(250, 180, 450, 280))
    })

    it('applies a move operation to its target and removes the move marker', () => {
        const movedPosition = rectangle(250, 180, 550, 320)
        const history = [
            addOperation(0, { points: [{ x: 100, y: 100 }] }),
            {
                actionType: HistoryAction.move,
                position: movedPosition,
                options: {
                    moveIndex: 0,
                    drawData: { x: 250, y: 180, w: 300, h: 140 },
                    isSelected: 1
                },
                index: 1,
                canvasResolution: { ...resolution }
            }
        ]

        const content = resolveHistoryContent(history, resolution)

        expect(content).toHaveLength(1)
        expect(content[0].index).toBe(0)
        expect(content[0].position).toEqual(movedPosition)
        expect(content[0].options.drawData).toEqual({ x: 250, y: 180, w: 300, h: 140 })
    })

    it('keeps explicit stretched rectangle dimensions instead of scaling them twice', () => {
        const history = [
            addOperation(0, { x: 100, y: 100, w: 200, h: 100 }),
            {
                actionType: HistoryAction.stretch,
                position: rectangle(100, 100, 500, 300),
                options: {
                    stretchIndex: 0,
                    drawData: { x: 100, y: 100, w: 400, h: 200 },
                    isSelected: 1
                },
                index: 1,
                canvasResolution: { ...resolution }
            }
        ]

        const content = resolveHistoryContent(history, resolution)

        expect(content[0].position).toEqual(rectangle(100, 100, 500, 300))
        expect(content[0].options.drawData).toEqual({ x: 100, y: 100, w: 400, h: 200 })
    })

    it('applies delete operations without emitting the delete marker', () => {
        const history = [
            addOperation(0, { name: 'target' }),
            {
                actionType: HistoryAction.remove,
                position: rectangle(0, 0, 1, 1),
                options: { deleteIndex: 0 },
                index: 1,
                canvasResolution: { ...resolution }
            }
        ]

        expect(resolveHistoryContent(history, resolution)).toEqual([])
    })

    it('respects an explicit undo step while resolving content', () => {
        const history = [
            addOperation(0, { x: 100, y: 100, w: 200, h: 120 }),
            addOperation(1, { x: 150, y: 120, w: 200, h: 120 })
        ]

        const content = resolveHistoryContent(history, resolution, 0)

        expect(content).toHaveLength(1)
        expect(content[0].index).toBe(0)
        expect(content[0].position).toEqual(rectangle(100, 100, 500, 300))
        expect(content[0].options.drawData).toEqual({ x: 100, y: 100, w: 200, h: 120 })
    })
})
