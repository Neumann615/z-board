import type {
    CanvasOperationItem,
    CanvasOperationOptions,
    CanvasPage,
    RectAreaData
} from '../../types'
import {
    appendHistoryOperation,
    createHistoryPages,
    resolveHistoryContent
} from './history'

export interface CanvasResolution {
    w: number
    h: number
}

/**
 * Owns one canvas page and its active step. UI layers should mutate history
 * through these methods instead of assigning to exported arrays directly.
 */
export class CanvasHistoryStore {
    private page: CanvasPage

    constructor(pageCount = 1) {
        this.page = createHistoryPages(Math.max(1, pageCount))[0]
    }

    get step(): number {
        return this.page.step
    }

    get operationCount(): number {
        return this.page.canvasData.length
    }

    get canRedo(): boolean {
        return this.page.step < this.page.canvasData.length - 1
    }

    append(
        actionType: number,
        position: RectAreaData,
        options: CanvasOperationOptions,
        resolution: CanvasResolution
    ): CanvasOperationItem {
        const operation: CanvasOperationItem = {
            actionType,
            position: structuredClone(position),
            options: structuredClone(options),
            index: this.page.canvasData.length,
            canvasResolution: { ...resolution }
        }

        appendHistoryOperation(this.page, operation)
        return operation
    }

    canUndo(minimumStep = 0): boolean {
        return this.page.step >= Math.max(0, minimumStep)
    }

    /** Performs one undo step, but never crosses the supplied floor. */
    undo(minimumStep = 0): boolean {
        if (!this.canUndo(minimumStep)) return false
        this.page.step -= 1
        return true
    }

    reset(pageCount = 1): void {
        this.page = createHistoryPages(Math.max(1, pageCount))[0]
    }

    /** Resolves operations up to the active step for the supplied canvas size. */
    resolveActive(currentResolution: CanvasResolution): CanvasOperationItem[] {
        return this.resolveAt(this.page.step, currentResolution)
    }

    resolveAt(step: number, currentResolution: CanvasResolution): CanvasOperationItem[] {
        return resolveHistoryContent(this.page.canvasData, currentResolution, step)
    }
}
