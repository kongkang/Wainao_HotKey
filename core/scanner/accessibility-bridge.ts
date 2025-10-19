import { spawnSync } from 'node:child_process';

export interface AccessibilityResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type DefaultsResult = Record<string, unknown>;

export function readDefaults(domain: string): AccessibilityResult<DefaultsResult> {
  const result = spawnSync('defaults', ['read', domain, 'NSUserKeyEquivalents'], {
    encoding: 'utf-8'
  });
  if (result.status !== 0) {
    return { ok: false, error: result.stderr?.trim() ?? 'Unknown defaults error' };
  }
  try {
    return { ok: true, data: JSON.parse(result.stdout || '{}') };
  } catch (error) {
    return { ok: false, error: `Failed to parse defaults output: ${String(error)}` };
  }
}

export function queryAccessibilityTree(): AccessibilityResult<Record<string, unknown>> {
  // TODO: 使用 Node-API 或 objc bindings 获取 AXUIElement 结构
  return {
    ok: false,
    error: 'Accessibility bridge not yet implemented'
  };
}
