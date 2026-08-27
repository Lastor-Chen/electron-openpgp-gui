import path from 'node:path'

import type { IpcMainApis } from '@shared/types/global'
import { ipcMain, dialog } from 'electron'

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
  ipcMainHandle('openFileBrowser', async (_, opts) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(opts)
    if (canceled) return

    return filePaths.map((filePath) => ({
      path: filePath,
      basename: path.basename(filePath),
      dirname: path.dirname(filePath),
    }))
  })
}
