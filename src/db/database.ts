import * as SQLite from "expo-sqlite";
import { initStudySessionTable } from "./studySessionDb";

export const db = SQLite.openDatabaseSync("app.db");

const DB_SCHEMA_VERSION = 4;

function safeExec(sql: string) {
  try {
    db.execSync(sql);
  } catch (error) {
    console.log("DB exec error:", sql);
    console.log(error);
    throw error;
  }
}

function getDbVersion() {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = ?`,
    ["db_schema_version"]
  );

  return row?.value ? Number(row.value) : 0;
}

function setDbVersion(version: number) {
  db.runSync(
    `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
    ["db_schema_version", String(version)]
  );
}

function resetDatabaseTables() {
  safeExec(`DROP TABLE IF EXISTS ebook_series;`);
  safeExec(`DROP TABLE IF EXISTS study_material_series;`);
  safeExec(`DROP TABLE IF EXISTS ebook_nodes;`);
  safeExec(`DROP TABLE IF EXISTS test_series;`);
  safeExec(`DROP TABLE IF EXISTS test_items;`);
  safeExec(`DROP TABLE IF EXISTS test_questions;`);
  safeExec(`DROP TABLE IF EXISTS sync_meta;`);
  safeExec(`DROP TABLE IF EXISTS tool_subjects;`);
  safeExec(`DROP TABLE IF EXISTS tool_chapters;`);
  safeExec(`DROP TABLE IF EXISTS tool_topics;`);
  safeExec(`DROP TABLE IF EXISTS mentorships;`);
  safeExec(`DROP TABLE IF EXISTS mentorship_items;`);
  safeExec(`DROP TABLE IF EXISTS chat_messages;`);
  safeExec(`DROP TABLE IF EXISTS mentorship_booking_plans;`);
  safeExec(`DROP TABLE IF EXISTS books;`);
  safeExec(`DROP TABLE IF EXISTS book_pages;`);
  safeExec(`DROP TABLE IF EXISTS library_pass_plans;`);
}

function runDbMigrations() {
  const oldVersion = getDbVersion();

  if (oldVersion >= DB_SCHEMA_VERSION) {
    return;
  }

  db.withTransactionSync(() => {
    resetDatabaseTables();
    setDbVersion(DB_SCHEMA_VERSION);
  });
}

export function initDatabase() {
  safeExec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  runDbMigrations();

  safeExec(`
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
  `);

  safeExec(`
    CREATE TABLE IF NOT EXISTS study_material_series (
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
      has_access INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 0,
      files_count INTEGER,
      cached_at INTEGER
    );
  `);

  safeExec(`
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
  `);

  safeExec(`
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
  `);

  safeExec(`
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
  `);

  safeExec(`
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
  `);

  safeExec(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      module TEXT NOT NULL,
      goal_class_id TEXT NOT NULL DEFAULT '',
      version INTEGER DEFAULT 0,
      last_sync_time INTEGER DEFAULT 0,
      PRIMARY KEY (module, goal_class_id)
    );
  `);

  safeExec(`
    CREATE TABLE IF NOT EXISTS tool_subjects (
      id TEXT PRIMARY KEY NOT NULL,
      goal_class_id TEXT,
      name TEXT,
      description TEXT,
      sort_order INTEGER,
      is_active INTEGER DEFAULT 1
    );
  `);

  safeExec(`
    CREATE TABLE IF NOT EXISTS tool_chapters (
      id TEXT PRIMARY KEY NOT NULL,
      subject_id TEXT,
      name TEXT,
      sort_order INTEGER,
      is_active INTEGER DEFAULT 1
    );
  `);

  safeExec(`
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
  `);

  safeExec(`
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
  `);

  safeExec(`
    CREATE TABLE IF NOT EXISTS mentorship_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentorship_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      content_type TEXT NOT NULL
    );
  `);

  safeExec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY NOT NULL,
    goal_class_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    user_avatar TEXT,
    body TEXT,
    type TEXT DEFAULT 'text',
    reply_to_message_id TEXT,
    reply_to_body TEXT,
    reply_to_user_name TEXT,
    poll_id TEXT,
    poll_json TEXT,
    is_pinned INTEGER DEFAULT 0,
    pinned_at TEXT,
    pinned_by TEXT,
    created_at TEXT,
    cached_at INTEGER
  );
  `);

  safeExec(`
    CREATE TABLE IF NOT EXISTS mentorship_booking_plans (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      duration_minutes INTEGER DEFAULT 0,
      price_paise INTEGER DEFAULT 0,
      cached_at INTEGER
    );
  `);

  safeExec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT,
    description TEXT,
    cover_image_url TEXT,
    visibility TEXT,
    status TEXT,
    total_pages INTEGER DEFAULT 0,
    free_pages INTEGER DEFAULT 0,
    price_paise INTEGER DEFAULT 0,
    price_rupees INTEGER DEFAULT 0,
    has_access INTEGER DEFAULT 0,
    access_type TEXT DEFAULT 'locked',
    last_page_no INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    cached_at INTEGER
  );
`);

safeExec(`
  CREATE TABLE IF NOT EXISTS book_pages (
    book_id TEXT NOT NULL,
    page_no INTEGER NOT NULL,
    image_url TEXT,
    locked INTEGER DEFAULT 0,
    cached_at INTEGER,
    PRIMARY KEY (book_id, page_no)
  );
`);

safeExec(`
  CREATE TABLE IF NOT EXISTS library_pass_plans (
    pricing_id TEXT PRIMARY KEY NOT NULL,
    goal_class_id TEXT,
    title TEXT,
    duration_days INTEGER DEFAULT 0,
    price_paise INTEGER DEFAULT 0,
    price_rupees INTEGER DEFAULT 0,
    original_price_paise INTEGER DEFAULT 0,
    discount_price_paise INTEGER DEFAULT 0,
    is_purchased INTEGER DEFAULT 0,
    has_access INTEGER DEFAULT 0,
    expires_at TEXT,
    cached_at INTEGER
  );
`);

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_ebook_nodes_series_parent
    ON ebook_nodes(series_id, parent_id);
  `);

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_goal_created
    ON chat_messages(goal_class_id, created_at);
  `);

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_tool_subjects_goal
    ON tool_subjects(goal_class_id);
  `);

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_tool_chapters_subject
    ON tool_chapters(subject_id);
  `);

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_tool_topics_chapter
    ON tool_topics(chapter_id);
  `);

  safeExec(`
  CREATE INDEX IF NOT EXISTS idx_books_status
  ON books(status);
  `);

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_book_pages_book
    ON book_pages(book_id, page_no);
  `);

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_library_pass_goal
    ON library_pass_plans(goal_class_id);
  `);

  initStudySessionTable();
}