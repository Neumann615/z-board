import type { RectAreaData } from '../../types'
import { getRectAreaData } from '/src/utils/index'

export function getEventClassName(event: MouseEvent | TouchEvent): string {
    const target = event.target as HTMLElement | null
    return target?.className ?? ""
}

export interface SelectionFrameElements {
    moveToolbar: HTMLElement
    selectRange: HTMLElement
}

export function updateSelectionFrame(
    elements: SelectionFrameElements,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): RectAreaData {
    const rect = getRectAreaData(x1, y1, x2, y2)
    elements.moveToolbar.style.left = rect.x2 + 20 + "px"
    elements.moveToolbar.style.top = rect.y2 - 10 + "px"
    elements.selectRange.style.left = rect.x1 + "px"
    elements.selectRange.style.top = rect.y1 + "px"
    elements.selectRange.style.width = Math.abs(rect.x1 - rect.x2) + "px"
    elements.selectRange.style.height = Math.abs(rect.y1 - rect.y3) + "px"
    return rect
}

export function clearSelectionFrame(elements: SelectionFrameElements): void {
    elements.moveToolbar.style.left = "-1000px"
    elements.moveToolbar.style.top = "-1000px"
    elements.selectRange.style.left = "-1000px"
    elements.selectRange.style.top = "-1000px"
}

export function clearEditableText(): void {
    const editableTextList = document.getElementsByClassName("bupu-edit-box")
    for (let index = editableTextList.length - 1; index >= 0; index--) {
        editableTextList[index].parentNode?.removeChild(editableTextList[index])
    }
}
