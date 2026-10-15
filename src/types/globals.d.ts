declare module 'msg-alert' {
  interface MsgAlertOptions {
    type?: 'info' | 'success' | 'warn' | 'error'
    text?: string
    zIndex?: number
    duration?: number
  }
  interface MsgAlert {
    (options?: MsgAlertOptions): unknown
    destroyAll: () => void
  }
  const message: MsgAlert
  export default message
}

declare module '*.ico' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}
