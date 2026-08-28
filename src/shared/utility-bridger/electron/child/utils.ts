import { extendMessageEvents } from '@utility-bridger/electron/sharedUtils'

export const parentPort = extendMessageEvents(process.parentPort)

export function handleUncaught() {
  process.on('unhandledRejection', (reason) => {
    let error: Error = new Error(`UnhandledRejection reason ${JSON.stringify(reason)}`)
    if (reason instanceof Error) {
      error = reason
    }

    parentPort.postMsg('system:childCrash', error)
    process.exit(1)
  })

  process.on('uncaughtException', (err) => {
    parentPort.postMsg('system:childCrash', err)
    process.exit(1)
  })
}

export function addConsoleLogPrefix(prefix: string) {
  const log = console.log
  console.log = (...args) => {
    log(prefix, ...args)
  }
}
