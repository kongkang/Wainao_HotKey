import { ContextSnapshot } from '../types/shortcuts';
import { getPermissionStatus } from '../permissions/status-service';

export interface ContextCaptureOptions {
  bundleId?: string;
  appName?: string;
  windowTitle?: string;
  focusedElementType?: ContextSnapshot['focusedElementType'];
}

export function captureContext(options: ContextCaptureOptions = {}): ContextSnapshot {
  const permissions = getPermissionStatus();
  if (permissions.accessibility !== 'granted') {
    throw new Error('Accessibility permission required to capture context');
  }

  const now = new Date().toISOString();
  return {
    appName: options.appName ?? 'Unknown App',
    bundleId: options.bundleId ?? 'unknown.bundle',
    windowTitle: options.windowTitle ?? 'Untitled Window',
    focusedElementType: options.focusedElementType ?? 'other',
    timestamp: now
  };
}
