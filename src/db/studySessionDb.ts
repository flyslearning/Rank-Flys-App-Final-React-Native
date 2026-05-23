import { db } from "./database";

export type StudySession = {
  id?: number;
  date: string;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  total_pause_seconds?: number;
  created_at?: number;
};

export function initStudySessionTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      total_pause_seconds INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT 0
    );
  `);

  try {
    db.execSync(`ALTER TABLE study_sessions ADD COLUMN total_pause_seconds INTEGER DEFAULT 0;`);
  } catch {}

  try {
    db.execSync(`ALTER TABLE study_sessions ADD COLUMN created_at INTEGER DEFAULT 0;`);
  } catch {}
}

export function saveStudySession(session: StudySession) {
  db.runSync(
    `
    INSERT INTO study_sessions
    (date, start_time, end_time, duration_seconds, total_pause_seconds, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      session.date,
      session.start_time,
      session.end_time,
      session.duration_seconds,
      session.total_pause_seconds || 0,
      Date.now(),
    ]
  );
}

export function getTodayStudySeconds() {
  const today = new Date().toISOString().slice(0, 10);

  const row = db.getFirstSync<{ total: number }>(
    `
    SELECT COALESCE(SUM(duration_seconds), 0) as total
    FROM study_sessions
    WHERE date = ?
    `,
    [today]
  );

  return row?.total || 0;
}

export function getAllStudySessions() {
  return db.getAllSync<StudySession>(`
    SELECT * FROM study_sessions
    ORDER BY start_time DESC
  `);
}

export function getStudyStats() {
  const row = db.getFirstSync<{
    total_seconds: number;
    total_sessions: number;
    best_session: number;
  }>(`
    SELECT
      COALESCE(SUM(duration_seconds), 0) as total_seconds,
      COUNT(*) as total_sessions,
      COALESCE(MAX(duration_seconds), 0) as best_session
    FROM study_sessions
  `);

  return {
    total_seconds: row?.total_seconds || 0,
    total_sessions: row?.total_sessions || 0,
    best_session: row?.best_session || 0,
  };
}

export function clearStudySessions() {
  db.runSync(`DELETE FROM study_sessions`);
}