import type { ScreenShotDataSet, ScreenShotOptions, WhiteBoardDataSet, WhiteBoardOptions } from '../types'

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

export function updateWhiteBoardVar(object: Partial<WhiteBoardOptions>): void {
    if (object.addCanvasHistoryHandler !== undefined) {
        whiteBoardDataSet.addCanvasHistoryHandler = object.addCanvasHistoryHandler
    }
    if (object.uploadFileHandler !== undefined) {
        whiteBoardDataSet.uploadFileHandler = object.uploadFileHandler
    }
    if (object.uploadImageHandler !== undefined) {
        whiteBoardDataSet.uploadImageHandler = object.uploadImageHandler
    }
    nowModule = "whiteboard"
}

export function updateScreenShotVar(object: Partial<ScreenShotOptions>): void {
    if (object.imageUrl !== undefined) {
        screenShotDataSet.imageUrl = object.imageUrl
    }
    if (object.successHandler !== undefined) {
        screenShotDataSet.successHandler = object.successHandler
    }
    if (object.exitHandler !== undefined) {
        screenShotDataSet.exitHandler = object.exitHandler
    }
    if (object.toolbarPosition !== undefined) {
        screenShotDataSet.toolbarPosition = object.toolbarPosition
    }
    nowModule = "screenshot"
}

export {
    whiteBoardDataSet,
    screenShotDataSet,
    nowModule
}
