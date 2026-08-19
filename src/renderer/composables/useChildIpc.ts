import type { ApiAgentCalls, ApiAgentEvents } from '@shared/types/apiAgent'
import { wrapIpcChild } from '@utility-bridger/vue'

const [apiAgent, onApiAgent, onApiAgentCrash] = wrapIpcChild<ApiAgentCalls, ApiAgentEvents>(
  'apiAgent',
)

export function useApiAgent() {
  return { apiAgent, onApiAgent, onApiAgentCrash }
}
