import { BrowserWindow } from 'electron';

let stableWindow: BrowserWindow | null = null;

export function ensureStableWindow(): BrowserWindow {
  if (stableWindow && !stableWindow.isDestroyed()) {
    return stableWindow;
  }

  stableWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: new URL('./preload/index.js', import.meta.url).pathname
    }
  });

  stableWindow.on('close', (event) => {
    event.preventDefault();
    stableWindow?.hide();
  });

  return stableWindow;
}

export function showStableWindow(): void {
  const window = ensureStableWindow();
  window.show();
  window.focus();
}

export function hideStableWindow(): void {
  if (stableWindow && !stableWindow.isDestroyed()) {
    stableWindow.hide();
  }
}
