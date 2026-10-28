import { describe, expect, it } from 'vitest'
import { CanvasHistoryStore } from '/src/modules/common/canvasHistoryStore'
import { HistoryAction } from '/src/modules/common/history'
import type { RectAreaData } from '/src/types'

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

describe('CanvasHistoryStore', () => {
    it('starts with an empty undo-safe page', () => {
        const store = new CanvasHistoryStore()

        expect(store.step).toBe(-1)
        expect(store.operationCount).toBe(0)
        expect(store.canUndo()).toBe(false)
        expect(store.canRedo).toBe(false)
    })

    it('appends cloned operations and assigns the next index', () => {
        const store = new CanvasHistoryStore()
        const position = rectangle(10, 20, 110, 120)
        const options = { drawType: 2, isSelected: 1, drawData: { x: 10, y: 20, w: 100, h: 100 } }

        store.append(HistoryAction.add, position, options, resolution)
        position.x1 = 999
        options.drawData.x = 999

        expect(store.step).toBe(0)
        expect(store.operationCount).toBe(1)
        expect(store.resolveActive(resolution)[0].position.x1).toBe(10)
        expect(store.resolveActive(resolution)[0].options.drawData).toEqual({ x: 10, y: 20, w: 100, h: 100 })
    })

    it('truncates redo entries when drawing after an undo', () => {
        const store = new CanvasHistoryStore()
        store.append(HistoryAction.add, rectangle(0, 0, 10, 10), { drawType: 2, drawData: {} }, resolution)
        store.append(HistoryAction.add, rectangle(10, 10, 20, 20), { drawType: 2, drawData: {} }, resolution)
        store.append(HistoryAction.add, rectangle(20, 20, 30, 30), { drawType: 2, drawData: {} }, resolution)
        store.undo()

        expect(store.canRedo).toBe(true)
        store.append(HistoryAction.add, rectangle(40, 40, 50, 50), { drawType: 2, drawData: {} }, resolution)

        expect(store.step).toBe(2)
        expect(store.operationCount).toBe(3)
        expect(store.canRedo).toBe(false)
    })

    it('performs one-step undo without crossing the screenshot base image', () => {
        const store = new CanvasHistoryStore()
        const base = store.append(HistoryAction.add, rectangle(0, 0, 100, 100), { drawType: 7, drawData: {} }, resolution)
        store.append(HistoryAction.add, rectangle(10, 10, 50, 50), { drawType: 2, drawData: {} }, resolution)

        expect(store.undo(1)).toBe(true)
        expect(store.step).toBe(0)
        const content = store.resolveActive(resolution)
        expect(content).toHaveLength(1)
        expect(content[0].options.drawData).toEqual({ x: 0, y: 0, w: 100, h: 100 })

        expect(store.undo(1)).toBe(false)
        expect(store.step).toBe(0)
    })

    it('applies move operations to their target and omits move markers from render output', () => {
        const store = new CanvasHistoryStore()
        store.append(
            HistoryAction.add,
            rectangle(100, 100, 300, 300),
            { drawType: 2, isSelected: 1, drawData: { x: 100, y: 100, w: 200, h: 200 } },
            resolution
        )
        store.append(
            HistoryAction.move,
            rectangle(250, 180, 450, 380),
            {
                moveIndex: 0,
                isSelected: 1,
                drawData: { x: 250, y: 180, w: 200, h: 200 }
            },
            resolution
        )

        const content = store.resolveActive(resolution)

        expect(content).toHaveLength(1)
        expect(content[0].index).toBe(0)
        expect(content[0].position).toEqual(rectangle(250, 180, 450, 380))
        expect(content[0].options.drawData).toEqual({ x: 250, y: 180, w: 200, h: 200 })
    })

    it('keeps authoritative rectangle dimensions after stretching', () => {
        const store = new CanvasHistoryStore()
        store.append(
            HistoryAction.add,
            rectangle(100, 100, 300, 300),
            { drawType: 2, isSelected: 1, drawData: { x: 100, y: 100, w: 200, h: 200 } },
            resolution
        )
        store.append(
            HistoryAction.stretch,
            rectangle(100, 100, 500, 300),
            {
                stretchIndex: 0,
                isSelected: 1,
                drawData: { x: 100, y: 100, w: 400, h: 200 }
            },
            resolution
        )

        const content = store.resolveActive(resolution)

        expect(content[0].position).toEqual(rectangle(100, 100, 500, 300))
        expect(content[0].options.drawData).toEqual({ x: 100, y: 100, w: 400, h: 200 })
    })

    it('resolves history at an arbitrary step and resets state', () => {
        const store = new CanvasHistoryStore()
        store.append(HistoryAction.add, rectangle(0, 0, 100, 100), { drawType: 2, drawData: {} }, resolution)
        store.append(HistoryAction.add, rectangle(10, 10, 200, 200), { drawType: 2, drawData: {} }, resolution)

        expect(store.resolveAt(0, resolution)).toHaveLength(1)

        store.reset()
        expect(store.step).toBe(-1)
        expect(store.operationCount).toBe(0)
    })
})
