import { spawn } from 'node:child_process'
import type { SpawnOptions } from 'node:child_process'

import electronPath from 'electron'

import { cyan } from './simpleColor.ts'

interface CustomSpawnOptions extends SpawnOptions {
  /** @deprecated Use `onAbort: () => killElectron()` instead. */
  signal?: SpawnOptions['signal']
  onAbort(this: AbortSignal, ev: Event): any
}

/**
 * electron argv path 給 `.` 會以 packageJson.main 作為進入點
 * @param argv default is `['.', '--no-sandbox']`
 */
export function spawnElectron(argv = ['.', '--no-sandbox'], options?: CustomSpawnOptions) {
  // 存到 global process 上, 避免 vite config 熱更新時丟失
  process._vpt.electronProc = spawn(electronPath as unknown as string, argv, {
    stdio: 'inherit',
    ...options,
  })

  // 手控 abort 來自定義 kill 行為較好處理, 讓 spawn 處理會拋 AbortError 觸發 onError 與 onClose
  if (process._vpt.ab && !process._vpt.ab.signal.aborted) {
    const onAbort = options?.onAbort || (() => killElectron('electron restart.'))
    process._vpt.ab.signal.addEventListener('abort', onAbort)
  }

  process._vpt.electronProc.once('close', () => {
    console.log(cyan('[tsdown]'), 'electron process closed.')
    process.exit()
  })

  // 確保只掛一次 onExit, 只有用 q key 關閉 vite 才會觸發
  if (!process._vpt.hasHandleExit) {
    process._vpt.hasHandleExit = true
    process.once('exit', () => process._vpt.electronProc?.kill())
  }

  return process._vpt.electronProc
}

/** 遇到子程序砍不掉的情況, 可改用 npm `tree-kill`. */
export function killElectron(exitMsg?: string) {
  if (!process._vpt.electronProc) return
  // 使其不觸發 onClose 等監聽
  process._vpt.electronProc.removeAllListeners()
  if (exitMsg) {
    process._vpt.electronProc.once('exit', () => console.log(cyan('[tsdown]'), exitMsg))
  }
  process._vpt.electronProc.kill()
}

// 備存, 本來是用來防多個 tsdown.onSuccess 連續觸發 spawn electron
export function createDebounced<T extends (...args: any[]) => any>(fn: T, delay = 100) {
  let timer: NodeJS.Timeout | undefined
  let resolves: ((value: Awaited<ReturnType<T>> | null) => void)[] = []

  return function (...args: any[]) {
    clearTimeout(timer)
    resolves.forEach((r) => r(null))
    resolves = []

    const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<T>> | null>()
    resolves.push(resolve)

    timer = setTimeout(async () => {
      timer = undefined
      const res = await fn(...args)
      resolve(res)
    }, delay)

    return promise
  }
}
