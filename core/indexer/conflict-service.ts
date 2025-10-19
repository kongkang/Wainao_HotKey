import { getDb } from '../storage/index.js';
import { ConflictGroup } from '../types/shortcuts.js';

export function listConflicts(level?: string): ConflictGroup[] {
  const db = getDb();
  let stmt;
  if (level) {
    stmt = db.prepare('SELECT * FROM conflict_groups WHERE level = @level');
    return stmt.all({ level }).map(mapRow);
  }
  stmt = db.prepare('SELECT * FROM conflict_groups');
  return stmt.all().map(mapRow);
}

function mapRow(row: any): ConflictGroup {
  return {
    id: row.id,
    normalizedCombo: row.normalized_combo,
    level: row.level,
    entryIds: JSON.parse(row.entry_ids ?? '[]'),
    firstDetectedAt: row.first_detected_at ?? undefined,
    notes: row.notes ?? undefined
  };
}
