# utility-bridger

## Child Process

擴充 `@utility-bridger` 內部 interface 來定義 child name，提供 type 智能提示。

```ts
// src/config-env.d.ts
declare module '@utility-bridger/types.ts' {
  interface ChildNames {
    myChild: unknown // add custom child process name
  }
}
```

於 `src/shared/types/<child_name>.ts` 定義 child 要提供的 API types。

```ts
// src/shared/types/myChild.ts
export type MyChildApis = {
  echo(txt: string): void
  // ...
}

export type MyChildEvents = {
  stateUpdated(state: number): void
  // ...
}
```

於 `src/electron/child/<name>/index.ts` 建立子程序 entry file。

```ts
// src/electron/child/myChild/index.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'
import {
  handleUncaught,
  bridgeRpcHandler,
  addConsoleLogPrefix,
  createTrigger,
  createRpcChild,
} from '@utility-bridger/electron/child'

// 將 uncaught error 傳給 renderer
handleUncaught()

// 設定 node.js console.log 前綴, 方便 debug 辨識
addConsoleLogPrefix('[MyChild]')

// 用於傳遞事件的封裝
const trigger = createTrigger<MyChildEvents>()

// 實作子程序要提供的 API functions
bridgeRpcHandler({
  echo(txt) {
    // 發送事件給 main 與 renderer
    trigger('stateUpdated', 1)

    return `echo ${txt}`
  },
  // ...
} satisfies MyChildApis)

// 若有多個 child 也能互相溝通
const someChild = createRpcChild<SomeChildApis, SomeChildEvents>('someChild')
someChild.invoke('foo')
someChild.on('someEvent', () => {})
```

## Main Process

於 `src/electron/main/index.ts` fork 出子程序，可呼叫 child API 或監聽 events。

```ts
// src/electron/main/index.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'
import { app } from 'electron'
import { forkChild } from '@utility-bridger/electron/main'

app.whenReady().then(async () => {
  const myChild = forkChild<MyChildApis, MyChildEvents>('childName', 'path/to/dist/child/entry.js')

  // invoke child's function
  const { result, error } = await myChild.invoke('echo', 'Hello Child')
  console.log(result) // "Hello Child"

  // listen events from child
  const listener = (state: number) => console.log(state)
  myChild.on('stateUpdated', listener)
  myChild.removeListener('stateUpdated', listener)
  myChild.removeAllListeners('stateUpdated')
})
```

## Renderer Process

在前端 `src/renderer/rpcChild.ts` 建立 child 的 API caller。

```ts
// src/renderer/rpcChild.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'
import { wrapRpcChild } from '@utility-bridger/vue'

export const myChild = wrapRpcChild<MyChildApis, MyChildEvents>('myChild')
```

監聽 child 發送的 event，將接收到的值包裝成 Vue composables 做成響應式 ref。

```ts
// src/renderer/composables/useChildRef.ts
import type { MyChildApis, MyChildEvents } from '@shared/types/myChild'

export const myChildRef = createChildRef<MyChildApis, MyChildEvents>('myChild')
```

在 Vue 中呼叫 child API 以及使用 child event ref。

```vue
<!-- src/renderer/App.vue -->
<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue'

import { myChildRef } from '@/composables/useChildRef'
import { myChild } from '@/rpcChild'

// child 事件值的 vue ref 包裝, 當 child trigger 時自動響應
const state = myChildRef('stateUpdated', { initValue: 0 })

// 從 renderer 呼叫 child API
const onClick = async () => {
  const result = await myChild.echo('Hello Child')
}

// 監聽 child onCrash 事件, 讓 renderer 可以反應出來
onMounted(() => {
  const clearChildListener = myChild.onCrash((err) => window.alert(`MyChild crashed: ${err}`))
  onScopeDispose(() => clearChildListener())
})
</script>

<template>
  <button @click="onClick">Click {{ state }}</button>
</template>
```

`@/rpcChild` 內的 `wrapRpcChild` 包裝內含 debug logger，會在 devtools 顯示 I/O 資訊，可用 `window.allowDevLog` boolean 值手動開關，production 時為 `false`

```
[myChild] Call echo: ['Hello Child']
[myChild] Response echo: echo Hello Child
```
