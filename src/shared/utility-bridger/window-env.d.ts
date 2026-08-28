import type { WindowRpcChild } from '@utility-bridger/types'

declare global {
  interface Window {
    rpcChild: WindowRpcChild
    allowDevLog: boolean
  }
}
