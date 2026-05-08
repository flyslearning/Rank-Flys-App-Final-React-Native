import { db } from "./database";

function getImageUrl(image: any) {
  if (!image) return "";

  if (typeof image === "string") return image;

  if (image.Valid && image.String) return image.String;

  return "";
}

export function getTestSeriesLocal() {
  return db.getAllSync(`
    SELECT
      id,
      title,
      description,
      explore_text,
      image_url,
      created_at,
      price,
      price_paise,
      has_access = 1 AS has_access,
      is_free = 1 AS is_free,
      tests_count AS testsCount,
      cached_at
    FROM test_series
    ORDER BY datetime(created_at) DESC
  `);
}

export function saveTestSeries(series: any[]) {
  db.withTransactionSync(() => {
    const ids = series.map((item) => item.id).filter(Boolean);

    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");

      db.runSync(
        `
        DELETE FROM test_questions
        WHERE test_id IN (
          SELECT id FROM test_items
          WHERE series_id NOT IN (${placeholders})
        )
        `,
        ids
      );

      db.runSync(
        `
        DELETE FROM test_items
        WHERE series_id NOT IN (${placeholders})
        `,
        ids
      );

      db.runSync(
        `
        DELETE FROM test_series
        WHERE id NOT IN (${placeholders})
        `,
        ids
      );
    } else {
      db.runSync(`DELETE FROM test_questions`);
      db.runSync(`DELETE FROM test_items`);
      db.runSync(`DELETE FROM test_series`);
    }

    for (const item of series) {
      db.runSync(
        `
        INSERT OR REPLACE INTO test_series
        (
          id, title, description, explore_text, image_url,
          created_at, price, price_paise, has_access,
          is_free, tests_count, cached_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          item.id,
          item.title ?? "",
          item.description ?? "",
          item.explore_text ?? "",
          getImageUrl(item.image_url),
          item.created_at ?? "",
          item.price ?? 0,
          item.price_paise ?? 0,
          item.has_access ? 1 : 0,
          item.is_free ? 1 : 0,
          item.testsCount ?? item.tests_count ?? 0,
          Date.now(),
        ]
      );
    }
  });
}

export function getTestsLocal(seriesId: string) {
  return db.getAllSync(
    `
    SELECT *
    FROM test_items
    WHERE series_id = ?
    `,
    [seriesId]
  );
}

export function saveTests(seriesId: string, tests: any[]) {
  db.runSync(`DELETE FROM test_items WHERE series_id = ?`, [seriesId]);

  for (const test of tests) {
    db.runSync(
      `
      INSERT OR REPLACE INTO test_items
      (
        id, series_id, title, description,
        duration_minutes, total_questions, cached_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        test.id,
        test.series_id ?? seriesId,
        test.title ?? "",
        test.description ?? "",
        test.duration_minutes ?? 0,
        test.total_questions ?? 0,
        Date.now(),
      ]
    );
  }
}

export function updateTestSeriesAccess(
  seriesId: string,
  hasAccess: boolean,
  isFree: boolean
) {
  db.runSync(
    `
    UPDATE test_series
    SET has_access = ?, is_free = ?, cached_at = ?
    WHERE id = ?
    `,
    [hasAccess ? 1 : 0, isFree ? 1 : 0, Date.now(), seriesId]
  );
}

export function updateTestSeriesCount(seriesId: string, testsCount: number) {
  db.runSync(
    `
    UPDATE test_series
    SET tests_count = ?, cached_at = ?
    WHERE id = ?
    `,
    [testsCount, Date.now(), seriesId]
  );
}

export function getQuestionsLocal(testId: string) {
  return db.getAllSync(
    `
    SELECT *
    FROM test_questions
    WHERE test_id = ?
    `,
    [testId]
  );
}
export function getTestSeriesAccessLocal(seriesId: string) {
  const row: any = db.getFirstSync(
    `
    SELECT
      has_access = 1 AS has_access,
      is_free = 1 AS is_free
    FROM test_series
    WHERE id = ?
    `,
    [seriesId]
  );

  return {
    has_access: row?.has_access === 1 || row?.has_access === true,
    is_free: row?.is_free === 1 || row?.is_free === true,
  };
}

export function saveQuestions(testId: string, questions: any[]) {
  db.runSync(`DELETE FROM test_questions WHERE test_id = ?`, [testId]);

  for (const q of questions) {
    db.runSync(
      `
      INSERT OR REPLACE INTO test_questions
      (
        id, test_id, question_text,
        option_a, option_b, option_c, option_d,
        correct_answer, cached_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        q.id,
        testId,
        q.question_text ?? q.question ?? q.title ?? "",
        q.option_a ?? q.options?.[0] ?? "",
        q.option_b ?? q.options?.[1] ?? "",
        q.option_c ?? q.options?.[2] ?? "",
        q.option_d ?? q.options?.[3] ?? "",
        q.correct_answer ?? "",
        Date.now(),
      ]
    );
  }
}