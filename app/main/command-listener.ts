import { BrowserWindow, globalShortcut } from 'electron';
import { startServer } from './ipc/server.js';

const LONG_PRESS_THRESHOLD_MS = 400;
let commandPressedAt: number | null = null;

export function registerCommandListeners(mainWindow: BrowserWindow): void {
  startServer();

  globalShortcut.register('Command', () => {
    commandPressedAt = Date.now();
  });

  globalShortcut.register('CommandUp', () => {
    if (!commandPressedAt) {
      return;
    }
    const elapsed = Date.now() - commandPressedAt;
    commandPressedAt = null;
    if (elapsed >= LONG_PRESS_THRESHOLD_MS) {
      mainWindow.webContents.send('overlay:toggle');
    }
  });
}
