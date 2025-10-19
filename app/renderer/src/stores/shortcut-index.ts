import { defineStore } from 'pinia';
import type { ShortcutEntry } from '../../../core/types/shortcuts';

interface Filters {
  bundleId?: string;
  scope?: 'system' | 'app' | 'web';
  normalizedCombo?: string;
  conflict?: string;
}

interface ShortcutIndexState {
  filters: Filters;
  items: ShortcutEntry[];
  total: number;
  isLoading: boolean;
}

export const useShortcutIndexStore = defineStore('shortcut-index', {
  state: (): ShortcutIndexState => ({
    filters: {},
    items: [],
    total: 0,
    isLoading: false
  }),
  actions: {
    setFilters(filters: Filters) {
      this.filters = { ...filters };
    },
    async fetch() {
      this.isLoading = true;
      const url = new URL('http://127.0.0.1:65321/shortcuts');
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, String(value));
        }
      });
      const response = await fetch(url);
      const data = await response.json();
      this.items = data.items;
      this.total = data.total;
      this.isLoading = false;
    }
  }
});
