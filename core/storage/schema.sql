PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS shortcut_entries (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('system', 'app', 'web')),
  bundle_id TEXT,
  app_name TEXT,
  raw_combo TEXT NOT NULL,
  normalized_combo TEXT NOT NULL,
  human_label TEXT,
  target TEXT NOT NULL,
  source_file TEXT,
  editable INTEGER NOT NULL DEFAULT 0 CHECK (editable IN (0, 1)),
  last_seen_at TEXT,
  metadata TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shortcut_entries_bundle_combo
  ON shortcut_entries (bundle_id, normalized_combo);

CREATE TABLE IF NOT EXISTS conflict_groups (
  id TEXT PRIMARY KEY,
  normalized_combo TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('none', 'intra-app', 'inter-app', 'system-vs-app', 'web-vs-app')),
  entry_ids TEXT NOT NULL,
  first_detected_at TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_conflict_groups_level
  ON conflict_groups (level);

CREATE TABLE IF NOT EXISTS scan_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  completed_at TEXT NOT NULL,
  duration_ms INTEGER,
  source TEXT
);
