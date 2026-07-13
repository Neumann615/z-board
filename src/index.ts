import "./styles/style.css"
import "./styles/popover.css"
import "./styles/tooltip.css"
import "./assets/iconfont/iconfont.css"

export {
    initWhiteBoard,
    unmountWhiteBoard
} from "./modules/whiteboard/core"

export {
    initScreenShot,
    unmountScreenShot
} from "./modules/screenshot/core"

export {
    updateCanvasHistory
} from "./modules/whiteboard/toolbar"