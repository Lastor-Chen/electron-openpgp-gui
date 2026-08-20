import type { Event, Input, BrowserWindow } from 'electron'

export function addDevToolsShortcut(event: Event, input: Input, browser: BrowserWindow) {
  let hotkey = false
  if (process.platform === 'win32') {
    // ctrl shift i
    hotkey = input.control && input.shift && input.code === 'KeyI'
  } else if (process.platform === 'darwin') {
    // cmd alt i
    hotkey = input.meta && input.alt && input.code === 'KeyI'
  }

  const isDevToolsShortcut = input.type === 'keyDown' && hotkey
  if (isDevToolsShortcut) {
    event.preventDefault()
    browser.webContents.toggleDevTools()
  }
}
