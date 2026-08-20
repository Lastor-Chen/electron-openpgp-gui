import path from 'node:path'

import { BrowserWindow } from 'electron'

import { addDevToolsShortcut } from '@/main/utils'

type WindowName = 'main'
export const winMap = new Map<WindowName, BrowserWindow>()

export function openMainWindow() {
  const existed = winMap.get('main')
  if (existed && !existed.isDestroyed()) return existed.focus()

  const win = new BrowserWindow({
    useContentSize: true,
    resizable: false,
    webPreferences: {
      preload: path.join(process.env.APP_ROOT, 'dist-electron/electron/preload/index.cjs'),
    },
  })

  winMap.set('main', win)

  // remove default menu on windows
  win.removeMenu()

  if (import.meta.env.DEV) {
    win.loadURL('http://localhost:5173/')
  } else {
    win.loadFile(path.join(process.env.APP_ROOT, 'dist/index.html'))
  }

  // 阻擋 renderer 用 _blank 等方式開啟新視窗
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  win.webContents.on('before-input-event', (event, input) => {
    addDevToolsShortcut(event, input, win)
  })

  win.on('close', () => winMap.delete('main'))
}
