import {
    initScreenShot,
    initWhiteBoard,
    unmountWhiteBoard,
    unmountScreenShot
} from "./index"
import "./styles/style.css"
import "./styles/popover.css"
import "./styles/tooltip.css"
import "./styles/common.css"
import "./assets/iconfont/iconfont.css"

/* import { initScreenShot, initWhiteBoard } from "z-board"
import "z-board/style.css" */

let dom = document.getElementById("app")

function getUrlParams(): Record<string, string> {
    const paramString = window.location.search.substr(1)
    const paramArray = paramString.split('&')
    const params: Record<string, string> = {}
    for (let i = 0; i < paramArray.length; i++) {
        const pair = paramArray[i].split('=')
        if (pair.length === 2) {
            const key = decodeURIComponent(pair[0])
            const value = decodeURIComponent(pair[1])
            params[key] = value
        }
    }
    return params
}

let mode = getUrlParams()["mode"] || "screenshot"

if (mode === "screenshot") {
    initScreenShot(dom!, {
        imageUrl: "test.png",
        toolbarPosition: "bottom",
        successHandler: (v) => {
            console.log("截图成功的回调", v)
        },
        exitHandler: () => {
            console.log("截图失败的回调")
        }
    })
} else if (mode === "whiteboard") {
    initWhiteBoard(dom!, {
        addCanvasHistoryHandler: (v) => {
            console.log('白板数据变化',v)
        }
    })
}

/* 定时销毁 */
/* setTimeout(() => {
    unmountWhiteBoard()
    unmountScreenShot()
}, 60000) */