import { app, BrowserWindow, Menu, nativeTheme, globalShortcut, screen } from 'electron';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let overlayWindow = null;
let stableWindow = null;
const DEV_SERVER_PORT = 4173;
const isDev = process.env.NODE_ENV !== 'production';

const fallbackContext = {
  appName: 'DemoApp',
  bundleId: 'com.example.demoapp',
  windowTitle: '演示窗口',
  focusedElementType: 'editor',
  timestamp: new Date().toISOString()
};

const fallbackPayload = {
  latencyBudgetMs: 1000,
  shortcuts: [
    {
      id: 'demo-1',
      scope: 'app',
      bundleId: 'com.example.demoapp',
      appName: 'DemoApp',
      rawCombo: '⌘⇧P',
      normalizedCombo: 'Command + Shift + P',
      humanLabel: '打开命令面板',
      target: '菜单 > 文件 > 命令面板…',
      editable: true,
      metadata: { conflictLevel: 'inter-app' }
    },
    {
      id: 'demo-spotlight',
      scope: 'system',
      rawCombo: '⌘Space',
      normalizedCombo: 'Command + Space',
      humanLabel: '系统 Spotlight 搜索',
      target: '系统 > Spotlight',
      editable: false
    },
    {
      id: 'demo-3',
      scope: 'app',
      bundleId: 'com.example.demoapp',
      appName: 'DemoApp',
      rawCombo: '⌘⌥K',
      normalizedCombo: 'Command + Option + K',
      humanLabel: '切换探针模式',
      target: '菜单 > 视图 > 探针模式',
      editable: false
    }
  ],
  conflicts: [
    {
      id: 'conflict-demo-1',
      normalizedCombo: 'Command + Shift + P',
      level: 'inter-app',
      entryIds: ['demo-1', 'demo-spotlight']
    }
  ],
  recommendations: ['建议调整 DemoApp 快捷键，避免与 Spotlight 冲突']
};

const IPC_PORT = 65321;
const LONG_PRESS_THRESHOLD_MS = 450;
let ipcServer = null;
let devServer = null;
let devServerFailed = false;

const demoShortcuts = [...fallbackPayload.shortcuts];
const demoConflicts = [...fallbackPayload.conflicts];

function logBoot(message, extra = {}) {
  console.log(`[boot] ${message}`, Object.keys(extra).length ? extra : '');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function applyShortcutFilters(url) {
  return demoShortcuts.filter((shortcut) => {
    const bundleId = url.searchParams.get('bundleId');
    if (bundleId && shortcut.bundleId !== bundleId) {
      return false;
    }
    const scope = url.searchParams.get('scope');
    if (scope && shortcut.scope !== scope) {
      return false;
    }
    const normalizedCombo = url.searchParams.get('normalizedCombo');
    if (normalizedCombo && shortcut.normalizedCombo !== normalizedCombo) {
      return false;
    }
    const conflict = url.searchParams.get('conflict');
    if (conflict) {
      const level = shortcut.metadata?.conflictLevel ?? 'none';
      if (level !== conflict) {
        return false;
      }
    }
    return true;
  });
}

function startIpcServer() {
  if (ipcServer) {
    return;
  }

  ipcServer = http.createServer((req, res) => {
    const startTime = Date.now();
    (async () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (!req.url) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'Bad Request' }));
        return;
      }

      const url = new URL(req.url, 'http://127.0.0.1');
      const routeTag = `${req.method ?? 'UNKNOWN'} ${url.pathname}`;
      console.info(`[ipc] ${routeTag} hit`);

      if (url.pathname === '/overlay/context' && req.method === 'POST') {
        try {
          await parseJsonBody(req);
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: 'Invalid JSON payload' }));
          return;
        }
        res.end(JSON.stringify(fallbackPayload));
        return;
      }

      if (url.pathname === '/overlay/hide' && req.method === 'POST') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (url.pathname === '/shortcuts' && req.method === 'GET') {
        const items = applyShortcutFilters(url);
        res.end(JSON.stringify({ items, total: items.length }));
        return;
      }

      if (url.pathname === '/conflicts' && req.method === 'GET') {
        const level = url.searchParams.get('level');
        const items = level ? demoConflicts.filter((conflict) => conflict.level === level) : demoConflicts;
        res.end(JSON.stringify({ items, total: items.length }));
        return;
      }

      if (url.pathname === '/permissions/status' && req.method === 'GET') {
        res.end(
          JSON.stringify({
            accessibility: { granted: true, reason: '模拟环境默认授权' },
            automation: { granted: true, reason: '模拟环境默认授权' },
            inputMonitoring: { granted: true, reason: '模拟环境默认授权' }
          })
        );
        return;
      }

      if (url.pathname === '/export' && req.method === 'POST') {
        res.end(
          JSON.stringify({
            filePath: '/tmp/wainao-hotkey-demo-export.json',
            generatedAt: new Date().toISOString()
          })
        );
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Not Found' }));
    })().catch((error) => {
      console.error('[ipc] request handling failed', error);
      if (!res.headersSent) {
        res.statusCode = 500;
      }
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    }).finally(() => {
      const duration = Date.now() - startTime;
      console.info(`[ipc] request completed in ${duration}ms`);
    });
  });

  ipcServer.listen(IPC_PORT, '127.0.0.1', () => {
    console.log(`[ipc] mock server listening on http://127.0.0.1:${IPC_PORT}`);
  });
  ipcServer.on('error', (error) => {
    console.error('[ipc] server error', error);
  });
}

async function startDevServer() {
  if (!isDev || devServer) {
    return devServer;
  }
  logBoot('starting Vite dev server', { port: DEV_SERVER_PORT });

  try {
    const { createServer } = await import('vite');
    const configModule = await import('../vite.config.js');
    const config = configModule.default;
    devServer = await createServer({
      ...config,
      configFile: false,
      server: {
        ...config.server,
        host: '127.0.0.1',
        port: DEV_SERVER_PORT,
        strictPort: true,
        open: false
      }
    });
    await devServer.listen();
    const actualPort = devServer.config.server.port;
    logBoot('Vite dev server ready', { port: actualPort, url: `http://127.0.0.1:${actualPort}/` });
    return devServer;
  } catch (error) {
    devServer = null;
    devServerFailed = true;
    logBoot('failed to start Vite dev server', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

function loadWindow(window, hash = '', options = {}) {
  const shouldUseBundle = options.forceFile ?? false;
  if (isDev && !shouldUseBundle) {
    void window.loadURL(`http://127.0.0.1:${DEV_SERVER_PORT}/${hash}`);
  } else {
    const htmlPath = path.join(__dirname, '../../dist/renderer/index.html');
    void window.loadFile(htmlPath, { hash });
  }
}

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow;
  }

  overlayWindow = new BrowserWindow({
    width: 520,
    height: 420,
    frame: false,
    resizable: false,
    transparent: true,
    show: false,
    focusable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  ensureWindowLoaded(overlayWindow, '#/overlay', { forceFileInitial: devServerFailed });
  return overlayWindow;
}

function createStableWindow() {
  if (stableWindow && !stableWindow.isDestroyed()) {
    return stableWindow;
  }

  stableWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    show: false,
    title: 'Wainao HotKey',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  stableWindow.on('close', (event) => {
    event.preventDefault();
    stableWindow?.hide();
  });

  ensureWindowLoaded(stableWindow, '#/', { forceFileInitial: devServerFailed });
  return stableWindow;
}

function positionOverlay(window) {
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { width, height } = window.getBounds();
  const x = Math.round(display.workArea.x + (display.workArea.width - width) / 2);
  const y = Math.round(display.workArea.y + display.workArea.height * 0.18);
  window.setPosition(x, y, false);
}

function toggleOverlay(show) {
  const window = createOverlayWindow();
  if (show) {
    positionOverlay(window);
    window.showInactive();
    const context = { ...fallbackContext, timestamp: new Date().toISOString() };
    const payload = { context, data: fallbackPayload };
    const sendPayload = () => {
      window.webContents.send('overlay:show', payload);
    };
    if (window.webContents.isLoading()) {
      window.webContents.once('did-finish-load', sendPayload);
    } else {
      sendPayload();
    }
  } else {
    window.hide();
    window.webContents.send('overlay:hide');
  }
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    const shouldShow = !overlayWindow || !overlayWindow.isVisible();
    toggleOverlay(shouldShow);
  });

  globalShortcut.register('Escape', () => {
    toggleOverlay(false);
  });
}

function attachCommandDetection(window) {
  if (window.__wainaoCommandDetectionAttached) {
    return;
  }
  window.__wainaoCommandDetectionAttached = true;

  let commandTimer = null;
  let overlayShownFromHold = false;

  const clearTimer = () => {
    if (commandTimer) {
      clearTimeout(commandTimer);
      commandTimer = null;
    }
  };

  const hideOverlay = () => {
    if (overlayShownFromHold) {
      console.info('[overlay] hiding overlay after Command release');
      toggleOverlay(false);
      overlayShownFromHold = false;
    }
  };

  window.on('blur', () => {
    clearTimer();
    hideOverlay();
  });

  window.webContents.on('before-input-event', (_event, input) => {
    const isCommandKey =
      input.key === 'Meta' || input.code === 'MetaLeft' || input.code === 'MetaRight';
    if (!isCommandKey) {
      return;
    }

    if (input.type === 'keyDown') {
      if (overlayShownFromHold || commandTimer || input.isAutoRepeat) {
        return;
      }
      commandTimer = setTimeout(() => {
        commandTimer = null;
        overlayShownFromHold = true;
        console.info('[overlay] Command long press detected, showing overlay');
        toggleOverlay(true);
      }, LONG_PRESS_THRESHOLD_MS);
      return;
    }

    if (input.type === 'keyUp') {
      clearTimer();
      hideOverlay();
    }
  });
}

function createMenu() {
  const menuTemplate = [
    {
      label: app.name,
      submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }]
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '打开快捷键中心',
          accelerator: 'CommandOrControl+Shift+O',
          click: () => {
            const window = createStableWindow();
            window.show();
            window.focus();
          }
        },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

function ensureWindowLoaded(window, hash, options = {}) {
  let retryCount = 0;
  let fellBackToBundle = Boolean(options.forceFileInitial);

  const attemptLoad = () => {
    loadWindow(window, hash, { forceFile: fellBackToBundle });
  };

  window.webContents.on('did-finish-load', () => {
    console.info(`[window] loaded ${hash || '/'} (retries: ${retryCount})`);
  });

  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    retryCount += 1;
    console.error(
      `[window] load failed (#${retryCount})`,
      { errorCode, errorDescription, validatedURL, hash }
    );
    if (isDev && retryCount >= 25 && !fellBackToBundle) {
      console.error('[window] dev server unreachable after ~5s, falling back to built assets');
      fellBackToBundle = true;
      loadWindow(window, hash, { forceFile: true });
      return;
    }
    setTimeout(attemptLoad, 200);
  });

  attemptLoad();
}

app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';

  startIpcServer();

  await startDevServer();

  const window = createStableWindow();
  attachCommandDetection(window);
  window.show();
  window.focus();
  registerShortcuts();
  createMenu();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (ipcServer) {
    ipcServer.close(() => {
      ipcServer = null;
    });
  }
  if (devServer) {
    logBoot('shutting down Vite dev server');
    devServer
      .close()
      .catch((error) => console.error('[boot] failed to stop Vite dev server', error))
      .finally(() => {
        devServer = null;
      });
  }
});

app.on('activate', () => {
  const window = createStableWindow();
  attachCommandDetection(window);
  window.show();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
