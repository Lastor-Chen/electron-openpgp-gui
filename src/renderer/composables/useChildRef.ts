import type { ApiAgentApis, ApiAgentEvents } from '@shared/types/apiAgent'
import { createChildRef } from '@utility-bridger/vue'

export const apiAgentRef = createChildRef<ApiAgentApis, ApiAgentEvents>('apiAgent')
