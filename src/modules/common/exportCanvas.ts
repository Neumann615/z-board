export async function exportHTMLElementAsPng(
    element: Element,
    html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>
): Promise<string | null> {
    if (!(element instanceof HTMLElement)) return null
    const canvas = await html2canvas(element)
    return canvas.toDataURL("image/png", 1)
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = filename
    link.click()
}
