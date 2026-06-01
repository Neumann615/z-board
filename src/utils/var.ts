import type { WhiteBoardDataSet, ScreenShotDataSet, WhiteBoardOptions, ScreenShotOptions } from '../types'

let whiteBoardDataSet: WhiteBoardDataSet = {
    colorList: ["#007FFF", "#00B042", "#FF5219", "#FF9200", "#999"],
    addCanvasHistoryHandler: null,
    uploadFileHandler: null,
    uploadImageHandler: null,
}

let screenShotDataSet: ScreenShotDataSet = {
    colorList: ["#007FFF", "#00B042", "#FF5219", "#FF9200", "#999"],
    imageUrl: "",
    successHandler: null,
    exitHandler: null,
    toolbarPosition: "left"
}

let nowModule: 'whiteboard' | 'screenshot' = "whiteboard"

export function updateWhiteBoardVar(object: Partial<WhiteBoardOptions>) {
    for (let key in object) {
        const k = key as keyof WhiteBoardDataSet
        if (Object.prototype.hasOwnProperty.call(whiteBoardDataSet, k)) {
            whiteBoardDataSet[k] = object[key] as WhiteBoardDataSet[typeof k]
        }
    }
    nowModule = "whiteboard"
}

export function updateScreenShotVar(object: Partial<ScreenShotOptions>) {
    for (let key in object) {
        const k = key as keyof ScreenShotDataSet
        if (Object.prototype.hasOwnProperty.call(screenShotDataSet, k)) {
            screenShotDataSet[k] = object[key] as ScreenShotDataSet[typeof k]
        }
    }
    nowModule = "screenshot"
}

export {
    whiteBoardDataSet,
    screenShotDataSet,
    nowModule
}