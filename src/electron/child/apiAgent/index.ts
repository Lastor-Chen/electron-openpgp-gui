// import { pgpHandlers } from '@/child/apiAgent/pgp'
import type { ApiAgentEvents } from '@shared/types/apiAgent'
import { createTrigger } from '@shared/utility-bridger/electron/child'
import {
  handleUncaught,
  bridgeRpcHandler,
  addConsoleLogPrefix,
} from '@utility-bridger/electron/child'

handleUncaught()

addConsoleLogPrefix('[ApiAgent]')

// bridgeRpcHandler({
//   ...pgpHandlers,
// })

const trigger = createTrigger<ApiAgentEvents>()

bridgeRpcHandler({
  foo() {
    trigger('aaa', 'bbb')

    return 'bar'
  },
})
