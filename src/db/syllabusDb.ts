import { db } from "./database";

const MODULE = "syllabus";

export function getSyncMeta(goalClassID: string) {
  return db.getFirstSync<any>(
    `
    SELECT *
    FROM sync_meta
    WHERE module = ?
    AND goal_class_id = ?
    `,
    [MODULE, goalClassID]
  );
}

export function saveSyncMeta(goalClassID: string, version: number) {
  db.runSync(
    `
    INSERT OR REPLACE INTO sync_meta
    (module, goal_class_id, version, last_sync_time)
    VALUES (?, ?, ?, ?)
    `,
    [MODULE, goalClassID, version, Date.now()]
  );

  console.log("SYNC META SAVED:", version);
}

export function updateLastSyncOnly(goalClassID: string) {
  const old = getSyncMeta(goalClassID);

  db.runSync(
    `
    INSERT OR REPLACE INTO sync_meta
    (module, goal_class_id, version, last_sync_time)
    VALUES (?, ?, ?, ?)
    `,
    [MODULE, goalClassID, old?.version ?? 0, Date.now()]
  );
}

export function clearSyllabus(goalClassID: string) {
  const subjects = db.getAllSync<any>(
    `SELECT id FROM tool_subjects WHERE goal_class_id = ?`,
    [goalClassID]
  );

  for (const subject of subjects) {
    const chapters = db.getAllSync<any>(
      `SELECT id FROM tool_chapters WHERE subject_id = ?`,
      [subject.id]
    );

    for (const chapter of chapters) {
      db.runSync(`DELETE FROM tool_topics WHERE chapter_id = ?`, [chapter.id]);
    }

    db.runSync(`DELETE FROM tool_chapters WHERE subject_id = ?`, [subject.id]);
  }

  db.runSync(`DELETE FROM tool_subjects WHERE goal_class_id = ?`, [
    goalClassID,
  ]);
}

export function replaceSyllabus(goalClassID: string, raw: any) {
  const rawLog = JSON.stringify(raw ?? null);
  console.log("SYNC FULL RAW:", rawLog.slice(0, 1000));

  if (!raw) {
    console.log("SYNC FULL EMPTY RESPONSE");
    return false;
  }

  const subjects =
    raw?.subjects ??
    raw?.data?.subjects ??
    raw?.syllabus?.subjects ??
    raw?.data ??
    raw;

  if (!Array.isArray(subjects)) {
    console.log("SYNC ERROR: subjects array missing");
    console.log("SYNC RESPONSE KEYS:", Object.keys(raw ?? {}));
    return false;
  }

  db.withTransactionSync(() => {
    clearSyllabus(goalClassID);

    for (const subject of subjects) {
      db.runSync(
        `
        INSERT OR REPLACE INTO tool_subjects
        (id, goal_class_id, name, description, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          subject.id,
          subject.goal_class_id ?? goalClassID,
          subject.name ?? "",
          subject.description ?? "",
          subject.sort_order ?? 0,
          subject.is_active === false ? 0 : 1,
        ]
      );

      const chapters = subject.chapters ?? subject.Chapters ?? [];

      for (const chapter of chapters) {
        db.runSync(
          `
          INSERT OR REPLACE INTO tool_chapters
          (id, subject_id, name, sort_order, is_active)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            chapter.id,
            chapter.subject_id ?? subject.id,
            chapter.name ?? "",
            chapter.sort_order ?? 0,
            chapter.is_active === false ? 0 : 1,
          ]
        );

        const topics = chapter.topics ?? chapter.Topics ?? [];

        for (const topic of topics) {
          db.runSync(
            `
            INSERT OR REPLACE INTO tool_topics
            (id, chapter_id, name, sort_order, status, confidence, notes, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              topic.id,
              topic.chapter_id ?? chapter.id,
              topic.name ?? "",
              topic.sort_order ?? 0,
              topic.status ?? "not_started",
              topic.confidence ?? 0,
              topic.notes ?? "",
              topic.is_active === false ? 0 : 1,
            ]
          );
        }
      }
    }
  });

  console.log("LOCAL SUBJECTS:", getSubjects(goalClassID).length);
  return true;
}

export function getSubjects(goalClassID: string) {
  return db.getAllSync<any>(
    `
    SELECT *
    FROM tool_subjects
    WHERE goal_class_id = ?
    AND is_active = 1
    ORDER BY sort_order ASC
    `,
    [goalClassID]
  );
}

export function getChapters(subjectID: string) {
  return db.getAllSync<any>(
    `
    SELECT *
    FROM tool_chapters
    WHERE subject_id = ?
    AND is_active = 1
    ORDER BY sort_order ASC
    `,
    [subjectID]
  );
}

export function getTopics(chapterID: string) {
  return db.getAllSync<any>(
    `
    SELECT *
    FROM tool_topics
    WHERE chapter_id = ?
    AND is_active = 1
    ORDER BY sort_order ASC
    `,
    [chapterID]
  );
}

export function updateLocalTopic(
  topicID: string,
  status: string,
  confidence: number,
  notes = ""
) {
  db.runSync(
    `
    UPDATE tool_topics
    SET status = ?, confidence = ?, notes = ?
    WHERE id = ?
    `,
    [status, confidence, notes, topicID]
  );
}