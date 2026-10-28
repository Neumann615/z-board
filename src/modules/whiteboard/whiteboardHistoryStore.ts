import type { CanvasOperationItem, CanvasOperationOptions, CanvasPage, RectAreaData } from '../../types'
import {
    appendHistoryOperation,
    createHistoryPages,
    getHistoryPageData,
    HistoryAction,
    resolveHistoryContent
} from '../common/history'
import type { CanvasResolution } from '../common/canvasHistoryStore'

export const MIN_WHITEBOARD_PAGES = 3
export const MAX_WHITEBOARD_PAGES = 99

export interface WhiteboardHistorySnapshot {
    canvasHistory: CanvasPage[]
    nowPageIndex: number
    allPageNumber: number
}

/**
 * Owns all whiteboard pages, the active page index, and undo positioning.
 * Toolbar remains responsible for DOM rendering and user notifications.
 */
export class WhiteboardHistoryStore {
    private pages: CanvasPage[]
    private activeIndex = 0

    constructor(pageCount = MIN_WHITEBOARD_PAGES) {
        this.pages = createHistoryPages(Math.max(1, pageCount))
        this.activeIndex = 0
    }

    get pageCount(): number {
        return this.pages.length
    }

    get activePageIndex(): number {
        return this.activeIndex
    }

    get activePage(): CanvasPage {
        return this.pages[this.activeIndex]
    }

    get operationCount(): number {
        return this.activePage.canvasData.length
    }

    get canRedo(): boolean {
        return this.activePage.step < this.activePage.canvasData.length - 1
    }

    get snapshot(): WhiteboardHistorySnapshot {
        return {
            canvasHistory: this.pages,
            nowPageIndex: this.activeIndex,
            allPageNumber: this.pageCount
        }
    }

    reset(pageCount = MIN_WHITEBOARD_PAGES): void {
        this.pages = createHistoryPages(pageCount)
        this.activeIndex = 0
    }

    append(
        actionType: number,
        position: RectAreaData,
        options: CanvasOperationOptions,
        resolution: CanvasResolution,
        pageIndex = this.activeIndex
    ): CanvasOperationItem {
        const page = this.pages[pageIndex]
        if (!page) {
            throw new Error("Whiteboard history page not found")
        }

        const operation: CanvasOperationItem = {
            actionType,
            position: structuredClone(position),
            options: structuredClone(options),
            index: page.canvasData.length,
            canvasResolution: { ...resolution }
        }
        appendHistoryOperation(page, operation)
        return operation
    }

    activeContent(resolution: CanvasResolution): CanvasOperationItem[] {
        return this.pageContent(this.activeIndex, resolution)
    }

    pageContent(pageIndex: number, resolution: CanvasResolution): CanvasOperationItem[] {
        const page = this.pages[pageIndex]
        if (!page) return []
        return resolveHistoryContent(page.canvasData, resolution, page.step)
    }

    contentThroughStep(pageIndex = this.activeIndex): CanvasOperationItem[] {
        const page = this.pages[pageIndex]
        if (!page) return []
        return getHistoryPageData(page)
    }

    undo(rollbackStep = 0): boolean {
        const page = this.activePage
        if (page.step < rollbackStep) return false

        page.step -= 1
        return true
    }

    redo(): boolean {
        const page = this.activePage
        if (page.step >= page.canvasData.length - 1) return false

        page.step += 1
        return true
    }

    canAddPage(maxPageCount = MAX_WHITEBOARD_PAGES): boolean {
        return this.pageCount < maxPageCount
    }

    addPage(maxPageCount = MAX_WHITEBOARD_PAGES): boolean {
        if (!this.canAddPage(maxPageCount)) return false

        this.pages.push(createHistoryPages(1)[0])
        this.activeIndex = this.pages.length - 1
        return true
    }

    canDeletePage(minPageCount = MIN_WHITEBOARD_PAGES): boolean {
        return this.pageCount > minPageCount
    }

    deletePage(minPageCount = MIN_WHITEBOARD_PAGES): boolean {
        if (!this.canDeletePage(minPageCount)) return false

        this.pages.splice(this.activeIndex, 1)
        this.activeIndex = Math.min(this.activeIndex, this.pages.length - 1)
        return true
    }

    resetActivePage(): void {
        this.activePage.canvasData = []
        this.activePage.step = -1
    }

    canChangePage(delta: number): boolean {
        const nextIndex = this.activeIndex + delta
        return nextIndex >= 0 && nextIndex < this.pages.length
    }

    changePage(delta: number): boolean {
        if (!this.canChangePage(delta)) return false
        this.activeIndex += delta
        return true
    }

    goToPage(pageIndex: number): boolean {
        if (pageIndex < 0 || pageIndex >= this.pages.length) return false
        this.activeIndex = pageIndex
        return true
    }

    createImagePage(
        imageUrl: string,
        resolution: CanvasResolution,
        width: number,
        height: number
    ): CanvasPage {
        const page = createHistoryPages(1)[0]
        appendHistoryOperation(page, {
            actionType: HistoryAction.add,
            position: {
                x1: 0,
                y1: 0,
                x2: width,
                y2: 0,
                x3: width,
                y3: height,
                x4: 0,
                y4: height,
                w: width,
                h: height,
                area: width * height
            },
            options: {
                drawType: 7,
                isSelected: 0,
                drawData: { x: 0, y: 0, w: width, h: height, imageUrl }
            },
            index: 0,
            canvasResolution: { ...resolution }
        })
        return page
    }

    appendPages(pages: CanvasPage[]): void {
        this.pages.push(...pages)
        this.activeIndex = this.pages.length - 1
    }

    createPage(): CanvasPage {
        const page = createHistoryPages(1)[0]
        this.pages.push(page)
        this.activeIndex = this.pages.length - 1
        return page
    }

    findOperation(operationIndex: number): CanvasOperationItem | null {
        for (let index = this.pages.length - 1; index >= 0; index--) {
            const operation = this.pages[index].canvasData.find(item => item.index === operationIndex)
            if (operation) return operation
        }
        return null
    }

    updateText(
        operationIndex: number,
        text: string,
        position: RectAreaData
    ): boolean {
        const operation = this.findOperation(operationIndex)
        if (!operation || operation.actionType != HistoryAction.add || operation.options.drawType != 6) return false

        operation.options.text = text
        operation.position = structuredClone(position)
        if (operation.options.style) {
            operation.options.style.left = position.x1
            operation.options.style.top = position.y1
        }
        return true
    }

    replace(snapshot: WhiteboardHistorySnapshot): void {
        this.pages = snapshot.canvasHistory
        this.activeIndex = Math.min(
            Math.max(snapshot.nowPageIndex, 0),
            Math.max(snapshot.allPageNumber - 1, 0)
        )
    }
}
