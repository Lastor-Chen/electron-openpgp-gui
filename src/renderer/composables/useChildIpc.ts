import type { ApiAgentApis, ApiAgentEvents } from '@shared/types/apiAgent'
import { wrapIpcChild } from '@utility-bridger/vue'

const [apiAgent, onApiAgent, onApiAgentCrash] = wrapIpcChild<ApiAgentApis, ApiAgentEvents>(
  'apiAgent',
)

export function useApiAgent() {
  return { apiAgent, onApiAgent, onApiAgentCrash }
}
