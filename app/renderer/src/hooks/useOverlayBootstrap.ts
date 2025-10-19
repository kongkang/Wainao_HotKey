import { onMounted } from 'vue';
import { useContextStore } from '../stores/context';
import type { OverlayPayload, ContextSnapshot } from '@core/types/shortcuts';

const fallbackContext: ContextSnapshot = {
  appName: 'DemoApp',
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

declare global {
  interface Window {
    wainao?: {
      on: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

export function useOverlayBootstrap() {
  const store = useContextStore();

  const applyPayload = (context: ContextSnapshot, data: OverlayPayload) => {
    store.setOverlay({ context, data });
  };

  onMounted(() => {
    applyPayload({ ...fallbackContext, timestamp: new Date().toISOString() }, fallbackPayload);

    if (window.wainao?.on) {
      window.wainao.on('overlay:show', (payload: { context?: ContextSnapshot; data?: OverlayPayload }) => {
        const context = payload?.context ?? { ...fallbackContext, timestamp: new Date().toISOString() };
        const data = payload?.data ?? fallbackPayload;
        applyPayload(context, data);
      });
      window.wainao.on('overlay:hide', () => {
        store.hideOverlay();
      });
    }
  });
}
