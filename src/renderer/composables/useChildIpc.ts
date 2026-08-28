import type { ApiAgentApis, ApiAgentEvents } from '@shared/types/apiAgent'
import { wrapRpcChild } from '@utility-bridger/vue'

const [apiAgent, onApiAgent, onApiAgentCrash] = wrapRpcChild<ApiAgentApis, ApiAgentEvents>(
  'apiAgent',
)

export function useApiAgent() {
  return { apiAgent, onApiAgent, onApiAgentCrash }
}
