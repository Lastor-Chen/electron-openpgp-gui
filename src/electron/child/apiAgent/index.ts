import {
  handleUncaught,
  bridgeRpcHandler,
  addConsoleLogPrefix,
} from '@utility-bridger/electron/child'

handleUncaught()

addConsoleLogPrefix('[ApiAgent]')

bridgeRpcHandler({
  ping() {
    return 'pong'
  },
})
