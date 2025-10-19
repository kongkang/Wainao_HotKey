import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database, { Database as BetterSqliteDatabase } from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

let dbInstance: BetterSqliteDatabase | null = null;

export type MigrationOptions = {
  databasePath?: string;
};

export function initDatabase(options: MigrationOptions = {}): BetterSqliteDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  const { databasePath = path.join(process.cwd(), 'data', 'hotkeys.sqlite') } = options;
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  dbInstance = new Database(databasePath);
  runMigrations(dbInstance);
  return dbInstance;
}

export function runMigrations(database: BetterSqliteDatabase = initDatabase()): void {
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  database.exec(schemaSql);
}

export function getDb(): BetterSqliteDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialised. Call initDatabase() first.');
  }
  return dbInstance;
}
