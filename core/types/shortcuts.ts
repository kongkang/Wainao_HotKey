export type ShortcutScope = 'system' | 'app' | 'web';
export type ConflictLevel = 'none' | 'intra-app' | 'inter-app' | 'system-vs-app' | 'web-vs-app';
export type FocusedElementType = 'menu' | 'text-input' | 'editor' | 'browser' | 'other';

export interface ShortcutEntry {
  id: string;
  scope: ShortcutScope;
  bundleId?: string;
  appName?: string;
  rawCombo: string;
  normalizedCombo: string;
  humanLabel?: string;
  target: string;
  sourceFile?: string;
  editable: boolean;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ConflictGroup {
  id: string;
  normalizedCombo: string;
  level: ConflictLevel;
  entryIds: string[];
  firstDetectedAt?: string;
  notes?: string;
}

export interface ContextSnapshot {
  appName: string;
  bundleId: string;
  windowTitle: string;
  focusedElementType: FocusedElementType;
  timestamp: string;
  keyProbe?: Record<string, unknown>;
}

export interface OverlayPayload {
  shortcuts: ShortcutEntry[];
  conflicts: ConflictGroup[];
  recommendations?: string[];
  latencyBudgetMs?: number;
}
