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

  const ebook = db.getFirstSync<any>(
    `SELECT has_access, is_free FROM ebook_series WHERE id = ?`,
    [seriesId]
  );

  if (ebook) {
    return {
      hasAccess: ebook.has_access === 1,
      isFree: ebook.is_free === 1,
    };
  }

  const study = db.getFirstSync<any>(
    `SELECT has_access, is_free FROM study_material_series WHERE id = ?`,
    [seriesId]
  );

  if (study) {
    return {
      hasAccess: study.has_access === 1,
      isFree: study.is_free === 1,
    };
  }

  return {
    hasAccess: false,
    isFree: false,
  };
},
updateStudyMaterialAccess(seriesId: string, hasAccess: boolean, isFree: boolean) {
  this.init();

  db.runSync(
    `
    UPDATE study_material_series
    SET has_access = ?, is_free = ?
    WHERE id = ?
    `,
    [hasAccess ? 1 : 0, isFree ? 1 : 0, seriesId]
  );
},
saveStudyMaterial(items: CachedEbookSeries[]) {
  this.init();

  db.withTransactionSync(() => {
    const stmt = db.prepareSync(`
      INSERT OR REPLACE INTO study_material_series
      (
        id, title, description, explore_text,
        image_url, created_at, goal_class_id,
        price, price_paise, original_price_paise,
        discount_price_paise, discount_percent,
        has_access, is_free, files_count, cached_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      items.forEach((item) => {
        const old = db.getFirstSync<any>(
          `SELECT has_access, is_free FROM study_material_series WHERE id = ?`,
          [item.id]
        );

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

          old?.has_access === 1 || item.has_access === true
            ? 1
            : 0,

          old?.is_free === 1 || item.is_free === true
            ? 1
            : 0,

          item.filesCount || 0,
          Date.now(),
        ]);
      });
    } finally {
      stmt.finalizeSync();
    }
  });
},
getStudyMaterial(): CachedEbookSeries[] {
  this.init();

  const rows = db.getAllSync<any>(`
    SELECT * FROM study_material_series
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
saveBooks(items: any[]) {
  this.init();

  const stmt = db.prepareSync(`
    INSERT OR REPLACE INTO books
    (
      id, title, description, cover_image_url,
      visibility, status, total_pages, free_pages,
      price_paise, price_rupees,
      has_access, access_type,
      last_page_no, created_at, updated_at, cached_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    items.forEach((item) => {
      const old = db.getFirstSync<any>(
        `SELECT has_access, access_type, last_page_no FROM books WHERE id = ?`,
        [item.id]
      );

      const finalHasAccess = old?.has_access === 1 || item.has_access === true;
      const finalAccessType = finalHasAccess
        ? old?.access_type || item.access_type || "purchased"
        : item.access_type || "locked";

      stmt.executeSync([
        item.id,
        item.title || "",
        item.description || "",
        item.cover_image_url || "",
        item.visibility || "public",
        item.status || "published",
        Number(item.total_pages || 0),
        Number(item.free_pages || 0),
        Number(item.price_paise || 0),
        Number(item.price_rupees || 0),
        finalHasAccess ? 1 : 0,
        finalAccessType,
        Number(item.last_page_no || old?.last_page_no || 1),
        item.created_at || "",
        item.updated_at || "",
        Date.now(),
      ]);
    });
  } finally {
    stmt.finalizeSync();
  }
},

getBooks() {
  this.init();

  return db.getAllSync<any>(`
    SELECT * FROM books
    ORDER BY datetime(created_at) DESC
  `);
},

saveBookDetail(data: any) {
  this.init();

  const book = data.book;
  const access = data.access || {};
  const progress = data.progress || {};

  db.runSync(
    `
    INSERT OR REPLACE INTO books
    (
      id, title, description, cover_image_url,
      visibility, status, total_pages, free_pages,
      price_paise, price_rupees,
      has_access, access_type,
      last_page_no, created_at, updated_at, cached_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      book.id,
      book.title || "",
      book.description || "",
      book.cover_image_url || "",
      book.visibility || "public",
      book.status || "",
      Number(book.total_pages || 0),
      Number(book.free_pages || 0),
      Number(access.price_paise || 0),
      Number(access.price_rupees || 0),
      access.has_access ? 1 : 0,
      access.access_type || "locked",
      Number(progress.last_page_no || 1),
      book.created_at || "",
      book.updated_at || "",
      Date.now(),
    ]
  );
},

getBookDetail(bookId: string) {
  this.init();

  const row = db.getFirstSync<any>(
    `SELECT * FROM books WHERE id = ?`,
    [bookId]
  );

  if (!row) return null;

  return {
    book: {
      ...row,
      has_access: row.has_access === 1,
    },
    access: {
      has_access: row.has_access === 1,
      has_book_access: row.has_access === 1,
      access_type: row.access_type || "locked",
      price_paise: Number(row.price_paise || 0),
      price_rupees: Number(row.price_rupees || 0),
    },
    progress: {
      last_page_no: Number(row.last_page_no || 1),
    },
  };
},

saveBookPages(bookId: string, pages: any[]) {
  this.init();

  const stmt = db.prepareSync(`
    INSERT OR REPLACE INTO book_pages
    (
      book_id, page_no, image_url, locked, cached_at
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  try {
    pages.forEach((page) => {
      stmt.executeSync([
        bookId,
        Number(page.page_no),
        page.image_url || "",
        page.locked ? 1 : 0,
        Date.now(),
      ]);
    });
  } finally {
    stmt.finalizeSync();
  }
},

getBookPages(bookId: string, from: number, limit: number) {
  this.init();

  return db.getAllSync<any>(
    `
    SELECT * FROM book_pages
    WHERE book_id = ?
    AND page_no >= ?
    ORDER BY page_no ASC
    LIMIT ?
    `,
    [bookId, from, limit]
  );
},

saveLibraryPassPlans(items: any[]) {
  this.init();

  const stmt = db.prepareSync(`
    INSERT OR REPLACE INTO library_pass_plans
(
  pricing_id, goal_class_id, title, duration_days,
  price_paise, price_rupees,
  original_price_paise, discount_price_paise,
  is_purchased, has_access, expires_at,
  cached_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    items.forEach((item) => {
      stmt.executeSync([
      item.pricing_id,
      item.goal_class_id || "",
      item.title || "",
      Number(item.duration_days || 0),
      Number(item.price_paise || 0),
      Number(item.price_rupees || 0),
      Number(item.original_price_paise || 0),
      Number(item.discount_price_paise || 0),
      item.is_purchased ? 1 : 0,
      item.has_access ? 1 : 0,
      item.expires_at || null,
      Date.now(),
    ]);
    });
  } finally {
    stmt.finalizeSync();
  }
},

markLibraryPassPurchased(pricingId: string, goalClassId?: string, expiresAt?: string) {
  this.init();

  db.runSync(
    `
    UPDATE library_pass_plans
    SET is_purchased = 1,
        has_access = 1,
        expires_at = ?,
        cached_at = ?
    WHERE pricing_id = ?
    `,
    [expiresAt || null, Date.now(), pricingId]
  );
},

getLibraryPassPlans(goalClassId?: string) {
  this.init();

  const rows = goalClassId
    ? db.getAllSync<any>(
        `SELECT * FROM library_pass_plans WHERE goal_class_id = ?`,
        [goalClassId]
      )
    : db.getAllSync<any>(`SELECT * FROM library_pass_plans`);

  return rows.map((row) => ({
    ...row,
    is_purchased: row.is_purchased === 1,
    has_access: row.has_access === 1,
  }));
},

};
