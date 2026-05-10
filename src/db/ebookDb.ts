import { db, initDatabase } from "./database";

export type CachedEbookSeries = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  explore_text?: string | null;
  created_at?: string | null;
  goal_class_id?: string | null;
  price?: number;
  price_paise?: number;
  original_price_paise?: number;
  discount_price_paise?: number;
  discount_percent?: number;
  is_free?: boolean;
  has_access?: boolean;
  filesCount?: number;
};

export type CachedEbookNode = {
  id: string;
  series_id: string;
  name: string;
  title?: string | null;
  type: string;
  parent_id?: string | null;
  file_url?: string | null;
  is_demo?: boolean;
  order?: number;
  sort_order?: number;
  created_at?: string | null;
  has_children?: boolean;
};

export const EbookDb = {
  init() {
    initDatabase();
  },

  saveSeries(items: CachedEbookSeries[]) {
  this.init();

  db.withTransactionSync(() => {
    const ids = items.map((item) => item.id).filter(Boolean);

    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");

      db.runSync(
        `
        DELETE FROM ebook_nodes
        WHERE series_id NOT IN (${placeholders})
        `,
        ids
      );

      db.runSync(
        `
        DELETE FROM ebook_series
        WHERE id NOT IN (${placeholders})
        `,
        ids
      );
    } else {
      db.runSync(`DELETE FROM ebook_nodes`);
      db.runSync(`DELETE FROM ebook_series`);
    }

        const stmt = db.prepareSync(`
      INSERT OR REPLACE INTO ebook_series
      (
        id,
        title,
        description,
        explore_text,
        image_url,
        created_at,
        goal_class_id,
        price,
        price_paise,
        original_price_paise,
        discount_price_paise,
        discount_percent,
        has_access,
        is_free,
        files_count,
        cached_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      items.forEach((item) => {
        stmt.executeSync([
        item.id,
        item.title || "",
        item.description || "",
        item.explore_text || "",
        item.image_url || "",
        item.created_at || "",
        item.goal_class_id || "",
        item.price || 0,
        item.price_paise || 0,

        item.original_price_paise || item.price_paise || 0,
        item.discount_price_paise || item.price_paise || 0,
        item.discount_percent || 0,

        item.has_access ? 1 : 0,
        item.is_free ? 1 : 0,
        item.filesCount || 0,
        Date.now(),
      ]);
      });
    } finally {
      stmt.finalizeSync();
    }
  });
},

  getSeries(): CachedEbookSeries[] {
    this.init();

    const rows = db.getAllSync<any>(`
      SELECT * FROM ebook_series
      ORDER BY datetime(created_at) DESC
    `);

    return rows.map((row) => ({
      id: row.id,
      title: row.title || "",
      description: row.description || "",
      explore_text: row.explore_text || "",
      image_url: row.image_url || "",
      created_at: row.created_at || "",
      goal_class_id: row.goal_class_id || "",
      price: Number(row.price || 0),
      price_paise: Number(row.price_paise || 0),
      original_price_paise: Number(row.original_price_paise || row.price_paise || 0),
      discount_price_paise: Number(row.discount_price_paise || row.price_paise || 0),
      discount_percent: Number(row.discount_percent || 0),
      has_access: row.has_access === 1,
      is_free: row.is_free === 1,
      filesCount: Number(row.files_count || 0),
    }));
  },

saveNodes(seriesId: string, parentId: string | null, items: CachedEbookNode[]) {
  this.init();

  const safeParentId = parentId || null;

  if (safeParentId) {
    db.runSync(
      `
      DELETE FROM ebook_nodes
      WHERE series_id = ?
      AND parent_id = ?
      `,
      [seriesId, safeParentId]
    );
  } else {
    db.runSync(
      `
      DELETE FROM ebook_nodes
      WHERE series_id = ?
      AND (parent_id IS NULL OR parent_id = '')
      `,
      [seriesId]
    );
  }

  const stmt = db.prepareSync(`
    INSERT OR REPLACE INTO ebook_nodes
    (
      id, series_id, name, title, type, parent_id,
      file_url, is_demo, node_order, sort_order, has_children,
      created_at, cached_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    items.forEach((item: any) => {
      const nodeOrder = Number(item.order ?? item.sort_order ?? 0);

      const finalParentId =
        item.parent_id === undefined || item.parent_id === ""
          ? safeParentId
          : item.parent_id;

      stmt.executeSync([
        item.id,
        item.series_id || seriesId,
        item.name || item.title || "",
        item.title || item.name || "",
        item.type || "file",
        finalParentId,
        item.file_url || null,
        item.is_demo === true || item.is_demo === 1 || item.is_demo === "true" ? 1 : 0,
        nodeOrder,
        Number(item.sort_order ?? nodeOrder),
        item.has_children === true || item.type === "folder" ? 1 : 0,
        item.created_at || "",
        Date.now(),
      ]);
    });
  } finally {
    stmt.finalizeSync();
  }
},

getNodes(seriesId: string, parentId: string | null): CachedEbookNode[] {
  this.init();

  const safeParentId = parentId || null;

  const rows = safeParentId
    ? db.getAllSync<any>(
        `
        SELECT * FROM ebook_nodes
        WHERE series_id = ?
        AND parent_id = ?
        ORDER BY node_order ASC, sort_order ASC, datetime(created_at) ASC
        `,
        [seriesId, safeParentId]
      )
    : db.getAllSync<any>(
        `
        SELECT * FROM ebook_nodes
        WHERE series_id = ?
        AND (parent_id IS NULL OR parent_id = '')
        ORDER BY node_order ASC, sort_order ASC, datetime(created_at) ASC
        `,
        [seriesId]
      );

  return rows.map((row) => ({
    id: row.id,
    series_id: row.series_id,
    name: row.name || "",
    title: row.title || "",
    type: row.type || "file",
    parent_id: row.parent_id || null,
    file_url: row.file_url || null,
    is_demo: row.is_demo === 1,
    order: Number(row.node_order || 0),
    sort_order: Number(row.sort_order || 0),
    created_at: row.created_at || "",
    has_children: row.has_children === 1,
  }));
},

  clearSeries() {
    this.init();
    db.runSync(`DELETE FROM ebook_series`);
  },

  clearNodes(seriesId?: string) {
    this.init();

    if (seriesId) {
      db.runSync(`DELETE FROM ebook_nodes WHERE series_id = ?`, [seriesId]);
    } else {
      db.runSync(`DELETE FROM ebook_nodes`);
    }
  },
  saveSeriesAccess(seriesId: string, hasAccess: boolean, isFree: boolean) {
  this.init();

  db.runSync(
    `
    UPDATE ebook_series
    SET has_access = ?, is_free = ?, cached_at = ?
    WHERE id = ?
    `,
    [hasAccess ? 1 : 0, isFree ? 1 : 0, Date.now(), seriesId]
  );
},

getSeriesAccess(seriesId: string) {
  this.init();

  const row = db.getFirstSync<any>(
    `
    SELECT has_access, is_free
    FROM ebook_series
    WHERE id = ?
    `,
    [seriesId]
  );

  return {
    hasAccess: row?.has_access === 1,
    isFree: row?.is_free === 1,
  };
},
};