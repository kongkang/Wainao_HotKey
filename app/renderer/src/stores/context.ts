import { defineStore } from 'pinia';
import type { ContextSnapshot, OverlayPayload, ShortcutEntry } from '@core/types/shortcuts';

type OverlayState = {
  context: ContextSnapshot | null;
  shortcuts: ShortcutEntry[];
  isVisible: boolean;
  latencyBudgetMs: number;
};

export const useContextStore = defineStore('context', {
  state: (): OverlayState => ({
    context: null,
    shortcuts: [],
    isVisible: false,
    latencyBudgetMs: 1000
  }),
  actions: {
    setOverlay(payload: { context: ContextSnapshot; data: OverlayPayload }) {
      this.context = payload.context;
      this.shortcuts = payload.data.shortcuts;
      this.latencyBudgetMs = payload.data.latencyBudgetMs ?? 1000;
      this.isVisible = true;
    },
    hideOverlay() {
      this.isVisible = false;
    }
  }
});
