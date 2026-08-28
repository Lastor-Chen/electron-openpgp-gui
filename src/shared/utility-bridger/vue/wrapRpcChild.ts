import type { ApiCalls, ApiEvents, ChildName, WrappedCalls } from '@utility-bridger/types'

// setup dev logger
window.allowDevLog = import.meta.env.DEV

function devLog(type: 'log' | 'warn' | 'error', ...msgs: unknown[]) {
  if (!window.allowDevLog) return

  console[type](...msgs)
}

/**
 * @example
 * const myChild = wrapRpcChild<ChildCalls, ChildEvents>('myChild')
 *
 * // invoke child API
 * try {
 *   const resultData = await myChild.foo('arg1', 'arg2')
 * } catch (err) {
 *   console.log(err)
 * }
 *
 * // listen child trigger event
 * const state = ref()
 * const removeListener = myChild.on('myEvent', (val) => { state.value = val })
 * removeListener()
 *
 * // listen child crash
 * myChild.onCrash(() => { window.alert('myChild process is crashed!!') })
 */
export function wrapRpcChild<C extends ApiCalls, E extends ApiEvents>(childName: ChildName) {
  const methods = {
    /**
     * Return a remove listener function.
     * @example
     * const myChild = wrapRpcChild<ChildCalls, ChildEvents>('myChild')
     * const removerListener = myChild.on('myEvent', () => {})
     * removerListener()
     */
    on<K extends keyof E>(
      event: Extract<K, string>,
      listener: (...args: Parameters<E[K]>) => void,
    ) {
      return window.rpcChild.on(childName, event, listener)
    },
    onCrash(listener: (error: Error) => void) {
      return window.rpcChild.onCrash(childName, (errorLike) => {
        const error = new Error(errorLike.message)
        error.stack = errorLike.stack
        listener(error)
      })
    },
  }

  // 包成 proxy.keyName(...args) 的呼叫格式
  return new Proxy(methods as WrappedCalls<C> & typeof methods, {
    get(target, key: string, receiver) {
      if (Reflect.has(target, key)) {
        return Reflect.get(target, key, receiver)
      }

      return function (...args: any[]): Promise<any> {
        devLog('log', `[${childName}] Call ${String(key)}:`, args)

        return window.rpcChild
          .invoke(childName, key, ...args)
          .then(({ error: errorLike, result }) => {
            // IPC 傳 Error 會遺失原始 stack, 主程序先轉成 error-like 最後再轉回 Error
            if (errorLike) {
              devLog('error', `[${childName}] Response ${String(key)}`, errorLike.stack)

              const transError = new Error(errorLike.message)
              transError.stack = errorLike.stack
              throw transError
            }
            devLog('log', `[${childName}] Response ${String(key)}:`, result)

            return result
          })
      }
    },
  })
}
