import type { ApiAgentApis, ApiAgentEvents } from '@shared/types/apiAgent'
import { wrapRpcChild } from '@utility-bridger/vue'

export const apiAgent = wrapRpcChild<ApiAgentApis, ApiAgentEvents>('apiAgent')
