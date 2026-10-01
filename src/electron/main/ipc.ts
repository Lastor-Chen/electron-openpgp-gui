import path from 'node:path'

import type { IpcMainApis } from '@shared/types/global'
import { ipcMain, dialog, shell, BrowserWindow } from 'electron'

function ipcMainHandle<K extends keyof IpcMainApis>(
  channel: K,
  cb: (
    event: Electron.IpcMainInvokeEvent,
    ...args: Parameters<IpcMainApis[K]>
  ) => ReturnType<IpcMainApis[K]> | Promise<ReturnType<IpcMainApis[K]>>,
) {
  ipcMain.handle(channel, cb)
}

export function setupIpcMain() {
  ipcMainHandle('openFileBrowser', async (event, opts) => {
    const browser = BrowserWindow.fromWebContents(event.sender)
    if (!browser) throw new Error('Cannot find target browser.')

    const { canceled, filePaths } = await dialog.showOpenDialog(browser, opts)
    if (canceled) return

    return filePaths.map((filePath) => ({
      path: filePath,
      basename: path.basename(filePath),
      dirname: path.dirname(filePath),
    }))
  })

  ipcMainHandle('saveFileBrowser', async (event, opts) => {
    const browser = BrowserWindow.fromWebContents(event.sender)
    if (!browser) throw new Error('Cannot find target browser.')

    const { canceled, filePath } = await dialog.showSaveDialog(browser, opts)
    if (canceled) return

    return {
      path: filePath,
      basename: path.basename(filePath),
      dirname: path.dirname(filePath),
    }
  })

  ipcMainHandle('openFileManager', (_, filePath) => {
    shell.showItemInFolder(filePath)
  })
}
