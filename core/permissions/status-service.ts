import { spawnSync } from 'node:child_process';

export interface PermissionStatus {
  accessibility: 'granted' | 'denied' | 'unknown';
  automation: 'granted' | 'denied' | 'unknown';
  preferencesReadable: boolean;
  lastCheckedAt: string;
}

function checkTccService(service: string): 'granted' | 'denied' | 'unknown' {
  try {
    const result = spawnSync('tccutil', ['check', service], { encoding: 'utf-8' });
    if (result.status === 0) {
      const outcome = result.stdout.trim().toLowerCase();
      if (outcome.includes('granted')) {
        return 'granted';
      }
      if (outcome.includes('denied')) {
        return 'denied';
      }
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getPermissionStatus(): PermissionStatus {
  const accessibility = checkTccService('accessibility');
  const automation = checkTccService('automation');
  const preferencesReadable = true; // TODO: 实际读取 plist 验证

  return {
    accessibility,
    automation,
    preferencesReadable,
    lastCheckedAt: new Date().toISOString()
  };
}
