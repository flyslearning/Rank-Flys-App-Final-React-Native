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
      original_price_paise INTEGER DEFAULT 0,
      discount_price_paise INTEGER DEFAULT 0,
      discount_percent INTEGER DEFAULT 0,
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
      is_demo INTEGER DEFAULT 0,
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
  original_price_paise INTEGER DEFAULT 0,
  discount_price_paise INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
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
  is_demo INTEGER DEFAULT 0,
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

     CREATE TABLE IF NOT EXISTS sync_meta (
      module TEXT NOT NULL,
      goal_class_id TEXT NOT NULL DEFAULT '',
      version INTEGER DEFAULT 0,
      last_sync_time INTEGER DEFAULT 0,
      PRIMARY KEY (module, goal_class_id)
    );

    CREATE TABLE IF NOT EXISTS tool_subjects (
      id TEXT PRIMARY KEY NOT NULL,
      goal_class_id TEXT,
      name TEXT,
      description TEXT,
      sort_order INTEGER,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tool_chapters (
      id TEXT PRIMARY KEY NOT NULL,
      subject_id TEXT,
      name TEXT,
      sort_order INTEGER,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tool_topics (
      id TEXT PRIMARY KEY NOT NULL,
      chapter_id TEXT,
      name TEXT,
      sort_order INTEGER,
      status TEXT DEFAULT 'not_started',
      confidence INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1
    );
       CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS mentorships (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      image_url TEXT,
      explore_text TEXT,
      goal_class_id TEXT,
      visibility TEXT,
      created_at TEXT,
      price_paise INTEGER DEFAULT 0,
      price_rupees INTEGER DEFAULT 0,
      original_price_paise INTEGER DEFAULT 0,
      discount_price_paise INTEGER DEFAULT 0,
      discount_percent INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 0,
      has_access INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS mentorship_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentorship_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      content_type TEXT NOT NULL
    );
    

    CREATE INDEX IF NOT EXISTS idx_tool_subjects_goal
    ON tool_subjects(goal_class_id);

    CREATE INDEX IF NOT EXISTS idx_tool_chapters_subject
    ON tool_chapters(subject_id);

    CREATE INDEX IF NOT EXISTS idx_tool_topics_chapter
    ON tool_topics(chapter_id);
  `);
}