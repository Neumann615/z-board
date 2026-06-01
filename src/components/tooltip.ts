import { domAppendChild, initPosition, nowModule, screenShotDataSet } from "../utils/index"

interface TooltipParams {
  placement: string
  content: string
}

let isTooltip = true

export function tooltip(dom: HTMLElement, params: TooltipParams): void {
    let { placement, content } = params
    let tooltipDom = document.createElement("div")
    tooltipDom.className = "bupu-tooltip"
    let arrowDom = document.createElement("span")
    arrowDom.className = "bupu-tooltip-arrow"
    let contentDom = document.createElement("div")
    contentDom.className = "bupu-tooltip-content"
    contentDom.innerText = content
    domAppendChild(tooltipDom, [arrowDom, contentDom])

    dom.addEventListener("mouseover", () => {
        let rect = dom.getBoundingClientRect()
        let flag = true
        dom.classList.forEach(item => {
            if (item == "is-selected") {
                flag = false
            }
        })
        if (!flag) return
        isTooltip = flag
        document.body.appendChild(tooltipDom)
        arrowDom.style = null

        if (nowModule === "whiteboard") {
            tooltipDom.style.left = rect.x + rect.width + 20 + "px"
            tooltipDom.style.top = rect.y + (rect.height - tooltipDom.clientHeight) / 2 + "px"
            arrowDom.style.left = "-5px"
        } else if (nowModule === "screenshot") {
            if (screenShotDataSet.toolbarPosition === "left" || screenShotDataSet.toolbarPosition === "right") {
                tooltipDom.style.top = rect.y + (rect.height - tooltipDom.clientHeight) / 2 + "px"
                arrowDom.style.top = tooltipDom.clientHeight / 2 - 5 + "px"
                if (rect.x + rect.width + 20 + tooltipDom.clientWidth > document.body.clientWidth) {
                    tooltipDom.style.left = rect.x - 20 - tooltipDom.clientWidth + "px"
                    arrowDom.style.right = "-5px"
                } else {
                    tooltipDom.style.left = rect.x + rect.width + 20 + "px"
                    arrowDom.style.left = "-5px"
                }
            } else if (screenShotDataSet.toolbarPosition === "top" || screenShotDataSet.toolbarPosition === "bottom") {
                tooltipDom.style.left = rect.x + (rect.width - tooltipDom.clientWidth) / 2 + "px"
                arrowDom.style.left = tooltipDom.clientWidth / 2 - 5 + "px"
                if (rect.y + rect.height + 20 + tooltipDom.clientHeight > document.body.clientHeight) {
                    tooltipDom.style.top = rect.y - 20 - tooltipDom.clientHeight + "px"
                    arrowDom.style.bottom = "-5px"
                } else {
                    tooltipDom.style.top = rect.y + rect.height + 20 + "px"
                    arrowDom.style.top = "-5px"
                }
            }
        }
    })

    dom.addEventListener("mouseleave", () => {
        if (isTooltip && tooltipDom && tooltipDom.parentElement === document.body) {
            document.body.removeChild(tooltipDom)
            isTooltip = false
        }
    })
}