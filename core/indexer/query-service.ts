import { getDb } from '../storage/index.js';
import { ContextSnapshot, ShortcutEntry } from '../types/shortcuts.js';

export interface ShortcutQuery {
  bundleId?: string;
  scope?: string;
  normalizedCombo?: string;
  conflictLevel?: string;
}

export function findShortcutsForContext(context: ContextSnapshot): ShortcutEntry[] {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT * FROM shortcut_entries WHERE bundle_id = @bundleId OR scope = 'system' ORDER BY app_name`
  );
  const rows = stmt.all({ bundleId: context.bundleId });
  return decorateWithConflicts(rows).map((row) => mapRowToEntry(row));
}

export function queryShortcuts(filters: ShortcutQuery = {}): ShortcutEntry[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.bundleId) {
    clauses.push('bundle_id = @bundleId');
    params.bundleId = filters.bundleId;
  }
  if (filters.scope) {
    clauses.push('scope = @scope');
    params.scope = filters.scope;
  }
  if (filters.normalizedCombo) {
    clauses.push('normalized_combo = @normalizedCombo');
    params.normalizedCombo = filters.normalizedCombo;
  }
  if (filters.conflictLevel) {
    clauses.push(
      `id IN (
        SELECT json_each.value
        FROM conflict_groups, json_each(conflict_groups.entry_ids)
        WHERE conflict_groups.level = @conflictLevel
      )`
    );
    params.conflictLevel = filters.conflictLevel;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const stmt = db.prepare(`SELECT * FROM shortcut_entries ${where} ORDER BY app_name, normalized_combo`);
  const rows = stmt.all(params);
  return decorateWithConflicts(rows).map((row) => mapRowToEntry(row));
}

function decorateWithConflicts(rows: any[]): any[] {
  const db = getDb();
  const conflictStmt = db.prepare('SELECT entry_ids, level FROM conflict_groups');
  const conflicts = conflictStmt.all();

  const conflictMap = new Map<string, string>();
  conflicts.forEach((row: any) => {
    const ids: string[] = JSON.parse(row.entry_ids ?? '[]');
    ids.forEach((id) => conflictMap.set(id, row.level));
  });

  return rows.map((row) => {
    if (conflictMap.has(row.id)) {
      const metadata = row.metadata ? JSON.parse(row.metadata) : {};
      metadata.conflictLevel = conflictMap.get(row.id);
      return { ...row, metadata: JSON.stringify(metadata) };
    }
    return row;
  });
}

function mapRowToEntry(row: any): ShortcutEntry {
  return {
    id: row.id,
    scope: row.scope,
    bundleId: row.bundle_id ?? undefined,
    appName: row.app_name ?? undefined,
    rawCombo: row.raw_combo,
    normalizedCombo: row.normalized_combo,
    humanLabel: row.human_label ?? undefined,
    target: row.target,
    sourceFile: row.source_file ?? undefined,
    editable: Boolean(row.editable),
    lastSeenAt: row.last_seen_at ?? undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined
  };
}
