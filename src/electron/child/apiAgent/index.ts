import {
  handleUncaught,
  bridgeRpcHandler,
  addConsoleLogPrefix,
} from '@utility-bridger/electron/child'

import { pgpHandlers } from '@/child/apiAgent/pgp'

handleUncaught()

addConsoleLogPrefix('[ApiAgent]')

bridgeRpcHandler({
  ...pgpHandlers,
})
