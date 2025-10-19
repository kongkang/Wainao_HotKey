import { onMounted, onUnmounted } from 'vue';
import { useContextStore } from '../stores/context';
import type { ContextSnapshot, OverlayPayload } from '@core/types/shortcuts';

declare global {
  interface Window {
    process?: { type?: string };
  }
}

type FetchOverlayOptions = {
  context: ContextSnapshot;
};

const LONG_PRESS_THRESHOLD_MS = 450;

const fallbackContext: ContextSnapshot = {
  appName: '演示应用 DemoApp',
  bundleId: 'com.example.demoapp',
  windowTitle: '演示窗口',
  focusedElementType: 'editor',
  timestamp: new Date().toISOString()
};

const fallbackPayload: OverlayPayload = {
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
      sourceFile: '~/Library/Preferences/com.example.demoapp.plist',
      editable: true,
      lastSeenAt: new Date().toISOString(),
      metadata: { conflictLevel: 'inter-app' }
    },
    {
      id: 'demo-2',
      scope: 'system',
      rawCombo: '⌘Space',
      normalizedCombo: 'Command + Space',
      humanLabel: '聚焦 Spotlight 搜索',
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
      entryIds: ['demo-1', 'demo-spotlight'],
      firstDetectedAt: new Date().toISOString()
    }
  ],
  recommendations: ['尝试改用 Command + Option + P 以避免与 Spotlight 冲突']
};

async function fetchOverlayPayload(options: FetchOverlayOptions): Promise<OverlayPayload> {
  try {
    const response = await fetch('http://127.0.0.1:65321/overlay/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.context)
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = (await response.json()) as OverlayPayload;
    return data;
  } catch (error) {
    console.info('[overlay] 使用演示数据渲染浮动层', error);
    return fallbackPayload;
  }
}

export function useCommandOverlay() {
  const store = useContextStore();
  let timer: number | null = null;
  const isElectron = typeof window !== 'undefined' && Boolean(window.process?.type);

  const handleCommandPressStart = () => {
    if (isElectron) {
      return;
    }
    timer = window.setTimeout(async () => {
      const context: ContextSnapshot = {
        ...fallbackContext,
        timestamp: new Date().toISOString()
      };
      const payload = await fetchOverlayPayload({ context });
      store.setOverlay({ context, data: payload });
    }, LONG_PRESS_THRESHOLD_MS);
  };

  const handleCommandRelease = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    store.hideOverlay();
    if (!isElectron) {
      void fetch('http://127.0.0.1:65321/overlay/hide', { method: 'POST' }).catch(() => {
        /* 本地演示模式，无需处理 */
      });
    }
  };

  const keyDownListener = (event: KeyboardEvent) => {
    if (event.metaKey && event.key === 'Meta' && timer === null) {
      handleCommandPressStart();
    }
  };

  const keyUpListener = (event: KeyboardEvent) => {
    if (event.key === 'Meta') {
      handleCommandRelease();
    }
  };

  onMounted(() => {
    if (isElectron) {
      return;
    }
    window.addEventListener('keydown', keyDownListener);
    window.addEventListener('keyup', keyUpListener);
  });

  onUnmounted(() => {
    if (!isElectron) {
      window.removeEventListener('keydown', keyDownListener);
      window.removeEventListener('keyup', keyUpListener);
    }
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  });
}
