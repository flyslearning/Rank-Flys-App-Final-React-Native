import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("app.db");

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ebook_series (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      explore_text TEXT,
      image_url TEXT,
      created_at TEXT,
      goal_class_id TEXT,
      price REAL,
      price_paise INTEGER,
      has_access INTEGER,
      is_free INTEGER,
      files_count INTEGER,
      cached_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS ebook_nodes (
      id TEXT PRIMARY KEY NOT NULL,
      series_id TEXT,
      name TEXT,
      title TEXT,
      type TEXT,
      parent_id TEXT,
      file_url TEXT,
      node_order INTEGER,
      sort_order INTEGER,
      has_children INTEGER,
      created_at TEXT,
      cached_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS test_series (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  description TEXT,
  explore_text TEXT,
  image_url TEXT,
  created_at TEXT,
  price REAL,
  price_paise INTEGER,
  has_access INTEGER,
  is_free INTEGER,
  tests_count INTEGER,
  cached_at INTEGER
);

CREATE TABLE IF NOT EXISTS test_items (
  id TEXT PRIMARY KEY NOT NULL,
  series_id TEXT,
  title TEXT,
  description TEXT,
  duration_minutes INTEGER,
  total_questions INTEGER,
  cached_at INTEGER
);

CREATE TABLE IF NOT EXISTS test_questions (
  id TEXT PRIMARY KEY NOT NULL,
  test_id TEXT,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  cached_at INTEGER
);

    CREATE INDEX IF NOT EXISTS idx_ebook_nodes_series_parent
    ON ebook_nodes(series_id, parent_id);
  `);
}