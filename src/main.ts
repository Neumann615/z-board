import { initScreenShot, initWhiteBoard, type ScreenShotInstance, type WhiteBoardInstance } from "./index"

const app = document.getElementById("app") as HTMLElement
const whiteboardButton = document.getElementById("show-whiteboard") as HTMLButtonElement
const screenshotButton = document.getElementById("show-screenshot") as HTMLButtonElement

let instance: WhiteBoardInstance | ScreenShotInstance | null = null

function setActive(activeButton: HTMLButtonElement): void {
  whiteboardButton.classList.toggle("active", activeButton === whiteboardButton)
  screenshotButton.classList.toggle("active", activeButton === screenshotButton)
}

function createDemoImage(): string {
  const canvas = document.createElement("canvas")
  canvas.width = 1440
  canvas.height = 860
  const ctx = canvas.getContext("2d")!

  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  background.addColorStop(0, "#e0f2fe")
  background.addColorStop(.5, "#f8fafc")
  background.addColorStop(1, "#ede9fe")
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "#0f172a"
  ctx.font = "bold 56px Arial, sans-serif"
  ctx.fillText("Z-Board Screenshot Demo", 86, 158)

  ctx.fillStyle = "#475569"
  ctx.font = "26px Arial, sans-serif"
  ctx.fillText("拖拽框选一片区域，然后使用画笔、图形或文字进行标注。", 88, 220)

  ctx.strokeStyle = "#2563eb"
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(130, 650)
  ctx.bezierCurveTo(330, 430, 590, 760, 810, 480)
  ctx.stroke()

  ctx.fillStyle = "#f97316"
  ctx.beginPath()
  ctx.arc(1080, 590, 90, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toDataURL("image/png")
}

function showWhiteBoard(): void {
  instance?.unmount()
  app.innerHTML = ""
  instance = initWhiteBoard(app, {
    addCanvasHistoryHandler: (data) => {
      console.log("z-board canvas history:", data)
    }
  })
  setActive(whiteboardButton)
}

function showScreenShot(): void {
  instance?.unmount()
  app.innerHTML = ""
  instance = initScreenShot(app, {
    imageUrl: createDemoImage(),
    toolbarPosition: "bottom",
    successHandler: (base64) => {
      console.log("z-board screenshot result length:", base64.length)
      const link = document.createElement("a")
      link.href = base64
      link.download = `z-board-${Date.now()}.png`
      link.click()
    },
    exitHandler: () => {
      console.log("z-board screenshot cancelled")
    }
  })
  setActive(screenshotButton)
}

whiteboardButton.addEventListener("click", showWhiteBoard)
screenshotButton.addEventListener("click", showScreenShot)
showWhiteBoard()

export {}
