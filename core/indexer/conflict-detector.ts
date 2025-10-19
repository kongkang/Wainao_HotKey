import { getDb } from '../storage/index.js';
import { ConflictLevel, ConflictGroup } from '../types/shortcuts.js';

export function recomputeConflicts(): ConflictGroup[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT normalized_combo, json_group_array(id) AS entryIds
       FROM shortcut_entries
       GROUP BY normalized_combo
       HAVING COUNT(*) > 1`
    )
    .all();

  const groups: ConflictGroup[] = rows.map((row: any) => {
    const entryIds: string[] = JSON.parse(row.entryIds);
    const level: ConflictLevel = determineLevel(entryIds.length);
    return {
      id: `conflict-${row.normalized_combo}`,
      normalizedCombo: row.normalized_combo,
      level,
      entryIds,
      firstDetectedAt: new Date().toISOString()
    };
  });

  const insert = db.prepare(
    `REPLACE INTO conflict_groups (id, normalized_combo, level, entry_ids, first_detected_at)
     VALUES (@id, @normalizedCombo, @level, json(@entryIds), @firstDetectedAt)`
  );
  const tx = db.transaction((items: ConflictGroup[]) => {
    items.forEach((item) => {
      insert.run({
        id: item.id,
        normalizedCombo: item.normalizedCombo,
        level: item.level,
        entryIds: item.entryIds,
        firstDetectedAt: item.firstDetectedAt
      });
    });
  });
  tx(groups);

  return groups;
}

function determineLevel(count: number): ConflictLevel {
  if (count <= 1) return 'none';
  if (count === 2) return 'inter-app';
  return 'system-vs-app';
}
