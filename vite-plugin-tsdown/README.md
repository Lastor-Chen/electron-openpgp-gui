# vite-plugin-tsdown

## Quick Setup

1. 在 `vite.config.ts` 設定 plugins

```ts
// vite.config.ts
import type { InlineConfig } from 'tsdown'
import { defineConfig } from 'vite'
import { tsdownPlugin, spawnElectron } from './vite-plugin-tsdown/src/index.ts'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [
      tsdownPlugin({
        // dev 監聽要由 tsdown 打包的 files
        viteWatch: ['src/electron/**', 'src/shared/**'],
        // 使用內部包好的 spawnElectron 在 tsdown build 後啟動 electron
        onAllSuccess: isDev ? () => spawnElectron() : undefined,
        builds: [
          {
            // same with tsdown config
          },
        ],
      }),
    ],
  }
})
```

2. 在 `electron/main` 設定 BrowserWindow 連線到 vite dev server

```ts
// electron
import { app, BrowserWindow } from 'electron'

app.whenReady().then(() => {
  const win = new BrowserWindow()

  // vite-plugin-tsdown 內部會繼承並處理 vite 環境變數
  if (import.meta.env.DEV) {
    // dev 時, 指向 vite dev server url
    win.loadURL('http://localhost:5173/')
  } else {
    // prod 時, 指向 dist/index.html
    win.loadFile('path/to/dist/index.html')
  }
})
```

## Options

```ts
type TsdownPluginOptions = {
  /** 搭配 onAllSuccess 使用, 改用 vite watch 替代 tsdown watch */
  viteWatch?: string[]
  /** tsdown builds 全部完成後的 callback, 可在此啟動 electron 或其他 node.js app */
  onAllSuccess?: (signal: AbortSignal) => void
  /** 同 tsdown.build 的 InlineConfig, 接受 array 做 multiple build task */
  builds: InlineConfig[]
}
```

雖然 tsdown 自己有 `watch` 與 `onSuccess`，但當 config 是 array 時，每個 item 都是獨立的 build task，沒有整體的 afterBuilds hook 可用，所以另外做了 `viteWatch` 與 `onAllSuccess` 來補強。
