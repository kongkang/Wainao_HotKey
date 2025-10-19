export interface LogEntry {
  message: string;
  context?: Record<string, unknown>;
}

export function logInfo(entry: LogEntry): void {
  console.log(`[info] ${entry.message}`, entry.context ?? '');
}

export function logError(entry: LogEntry & { error: unknown }): void {
  console.error(`[error] ${entry.message}`, entry.context ?? '', entry.error);
}
