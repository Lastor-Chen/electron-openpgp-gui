import type { IpcMainApis, IpcMainEvents } from '@shared/types/global'
import { ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'

import { winMap } from '@/main/browsers'

export function setupIpcMain() {
  ipcMainHandle('ping', (_, msg) => {
    const mainWin = winMap.get('main')
    if (mainWin) sendToWeb(mainWin, 'someEvent', '111', 222)

    return `pong: ${msg}`
  })
}

// helper functions
// =====================
function ipcMainHandle<K extends keyof IpcMainApis>(
  channel: K,
  cb: (
    event: Electron.IpcMainInvokeEvent,
    ...args: Parameters<IpcMainApis[K]>
  ) => ReturnType<IpcMainApis[K]> | Promise<ReturnType<IpcMainApis[K]>>,
) {
  ipcMain.handle(channel, cb)
}

function sendToWeb<K extends keyof IpcMainEvents>(
  win: BrowserWindow,
  channel: K,
  ...args: Parameters<IpcMainEvents[K]>
) {
  win.webContents.send(channel, ...args)
}
