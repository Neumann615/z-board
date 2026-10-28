import { describe, expect, it } from 'vitest'
import {
    MAX_WHITEBOARD_PAGES,
    MIN_WHITEBOARD_PAGES,
    WhiteboardHistoryStore
} from '/src/modules/whiteboard/whiteboardHistoryStore'
import { HistoryAction } from '/src/modules/common/history'
import type { CanvasPage, RectAreaData } from '/src/types'

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

function drawOperation(index: number): {
    actionType: number
    position: RectAreaData
    options: { drawType: number; isSelected: number; drawData: unknown }
    index: number
    canvasResolution: { w: number; h: number }
} {
    return {
        actionType: HistoryAction.add,
        position: rectangle(index * 10, index * 20, index * 10 + 100, index * 20 + 80),
        options: {
            drawType: 2,
            isSelected: 1,
            drawData: { x: index * 10, y: index * 20, w: 100, h: 80 }
        },
        index,
        canvasResolution: { ...resolution }
    }
}

describe('WhiteboardHistoryStore', () => {
    it('initializes with three pages and the first page active', () => {
        const store = new WhiteboardHistoryStore()

        expect(store.pageCount).toBe(MIN_WHITEBOARD_PAGES)
        expect(store.activePageIndex).toBe(0)
        expect(store.snapshot).toEqual({
            canvasHistory: expect.any(Array),
            nowPageIndex: 0,
            allPageNumber: 3
        })
    })

    it('appends operations to the active page and preserves redo truncation', () => {
        const store = new WhiteboardHistoryStore()
        store.append(HistoryAction.add, rectangle(0, 0, 100, 100), { drawType: 2, drawData: {} }, resolution)
        store.append(HistoryAction.add, rectangle(10, 10, 200, 200), { drawType: 2, drawData: {} }, resolution)
        store.undo()

        store.append(HistoryAction.add, rectangle(20, 20, 300, 300), { drawType: 2, drawData: {} }, resolution)

        expect(store.activePage.step).toBe(1)
        expect(store.activePage.canvasData).toHaveLength(2)
        expect(store.canRedo).toBe(false)
    })

    it('undoes and redoes the active page', () => {
        const store = new WhiteboardHistoryStore()
        store.append(HistoryAction.add, rectangle(0, 0, 100, 100), { drawType: 2, drawData: {} }, resolution)
        store.append(HistoryAction.add, rectangle(10, 10, 200, 200), { drawType: 2, drawData: {} }, resolution)

        expect(store.undo()).toBe(true)
        expect(store.activePage.step).toBe(0)
        expect(store.contentThroughStep()).toHaveLength(1)

        expect(store.redo()).toBe(true)
        expect(store.activePage.step).toBe(1)
        expect(store.contentThroughStep()).toHaveLength(2)

        expect(store.redo()).toBe(false)
    })

    it('adds pages at the end and activates the new page', () => {
        const store = new WhiteboardHistoryStore()

        expect(store.addPage()).toBe(true)
        expect(store.pageCount).toBe(4)
        expect(store.activePageIndex).toBe(3)

        store.activePage.canvasData.push(drawOperation(0))
        expect(store.snapshot.canvasHistory[store.snapshot.canvasHistory.length - 1].canvasData).toHaveLength(1)
    })

    it('limits page creation to 99 pages', () => {
        const store = new WhiteboardHistoryStore()
        while (store.pageCount < MAX_WHITEBOARD_PAGES) store.addPage()

        expect(store.addPage()).toBe(false)
        expect(store.pageCount).toBe(MAX_WHITEBOARD_PAGES)
        expect(store.activePageIndex).toBe(98)
    })

    it('deletes the active page and keeps at least three pages', () => {
        const store = new WhiteboardHistoryStore()
        store.addPage()
        store.changePage(-1)

        expect(store.deletePage()).toBe(true)
        expect(store.pageCount).toBe(3)
        expect(store.activePageIndex).toBe(2)

        expect(store.deletePage()).toBe(false)
        expect(store.pageCount).toBe(MIN_WHITEBOARD_PAGES)
    })

    it('resets only the active page', () => {
        const store = new WhiteboardHistoryStore()
        store.append(HistoryAction.add, rectangle(0, 0, 100, 100), { drawType: 2, drawData: {} }, resolution)
        store.changePage(1)
        store.append(HistoryAction.add, rectangle(10, 10, 200, 200), { drawType: 2, drawData: {} }, resolution)
        store.goToPage(2)
        store.append(HistoryAction.add, rectangle(20, 20, 300, 300), { drawType: 2, drawData: {} }, resolution)

                store.changePage(-1)
                store.resetActivePage()

        const snapshot = store.snapshot
        expect(snapshot.canvasHistory[0].canvasData).toHaveLength(1)
        expect(snapshot.canvasHistory[1].canvasData).toHaveLength(0)
        expect(snapshot.canvasHistory[1].step).toBe(-1)
        expect(snapshot.canvasHistory[2].canvasData).toHaveLength(1)
    })

    it('changes pages and resolves content through the active step', () => {
        const store = new WhiteboardHistoryStore()
        store.append(HistoryAction.add, rectangle(0, 0, 100, 100), { drawType: 2, drawData: {} }, resolution)
        store.changePage(1)
        store.append(HistoryAction.add, rectangle(10, 10, 200, 200), { drawType: 2, drawData: {} }, resolution)
        store.append(HistoryAction.add, rectangle(20, 20, 300, 300), { drawType: 2, drawData: {} }, resolution)
        store.undo()

        expect(store.changePage(-1)).toBe(true)
        expect(store.activeContent(resolution)).toHaveLength(1)
        expect(store.changePage(1)).toBe(true)
        expect(store.activeContent(resolution)).toHaveLength(1)
        expect(store.changePage(99)).toBe(false)
        expect(store.goToPage(99)).toBe(false)
        expect(store.activePageIndex).toBe(1)
    })

    it('appends image pages and activates the last one', () => {
        const store = new WhiteboardHistoryStore()
        const pages: CanvasPage[] = [
            { canvasData: [drawOperation(0)], step: 0 },
            { canvasData: [drawOperation(1)], step: 0 }
        ]

        store.appendPages(pages)

        expect(store.pageCount).toBe(5)
        expect(store.activePageIndex).toBe(4)
        expect(store.activePage.step).toBe(0)
    })

    it('replaces external history and clamps a malformed active index', () => {
        const store = new WhiteboardHistoryStore()
        const pages = [
            { canvasData: [drawOperation(0)], step: 0 },
            { canvasData: [], step: -1 }
        ]

        store.replace({ canvasHistory: pages, nowPageIndex: 99, allPageNumber: 2 })

        expect(store.pageCount).toBe(2)
        expect(store.activePageIndex).toBe(1)
        expect(store.snapshot.canvasHistory).toBe(pages)
    })
})
