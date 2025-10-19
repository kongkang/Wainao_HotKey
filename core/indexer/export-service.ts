import fs from 'node:fs';
import path from 'node:path';
import { queryShortcuts } from './query-service';
import { listConflicts } from './conflict-service';

interface ExportPayload {
  format?: 'json' | 'csv';
  includeConflicts?: boolean;
}

export async function exportIndex(options: ExportPayload = {}): Promise<{ filePath: string; generatedAt: string }> {
  const { format = 'json', includeConflicts = true } = options;
  const items = queryShortcuts();
  const conflicts = includeConflicts ? listConflicts() : [];
  const generatedAt = new Date().toISOString();
  const outDir = path.join(process.cwd(), 'exports');
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `hotkeys-${Date.now()}.${format}`);

  if (format === 'csv') {
    const header = 'id,normalizedCombo,target,scope,conflictLevel';
    const conflictMap = new Map<string, string>();
    conflicts.forEach((conflict) => {
      conflict.entryIds.forEach((id) => conflictMap.set(id, conflict.level));
    });
    const body = items
      .map((item) => {
        const conflictLevel = conflictMap.get(item.id) ?? '';
        return `${item.id},${item.normalizedCombo},${JSON.stringify(item.target)},${item.scope},${conflictLevel}`;
      })
      .join('\n');
    fs.writeFileSync(filePath, `${header}\n${body}`, 'utf-8');
  } else {
    fs.writeFileSync(
      filePath,
      JSON.stringify({ generatedAt, items, conflicts: includeConflicts ? conflicts : undefined }, null, 2),
      'utf-8'
    );
  }

  return { filePath, generatedAt };
}
