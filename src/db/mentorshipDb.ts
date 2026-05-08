import { db } from "./database";

export type MentorshipItem = {
  content_id: string;
  content_type: "ebook_series" | "test_series";
};

export type Mentorship = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  explore_text: string;
  goal_class_id: string;
  visibility: string;
  created_at: string;
  price_paise: number;
  price_rupees: number;
  is_free: boolean;
  has_access: boolean;
  items: MentorshipItem[];
};

const normalizeMentorship = (m: any): Mentorship => {
  const pricePaise = Number(m.price_paise ?? 0);
  const priceRupees =
    Number(m.price_rupees ?? 0) > 0
      ? Number(m.price_rupees)
      : Math.round(pricePaise / 100);

  return {
    id: String(m.id),
    title: m.title ?? "",
    description: m.description ?? "",
    image_url: m.image_url ?? "",
    explore_text: m.explore_text ?? "",
    goal_class_id: m.goal_class_id ?? "",
    visibility: m.visibility ?? "public",
    created_at: m.created_at ?? "",
    price_paise: pricePaise,
    price_rupees: priceRupees,
    is_free: Boolean(m.is_free),
    has_access: Boolean(m.has_access),
    items: Array.isArray(m.items) ? m.items : [],
  };
};

export const mentorshipDb = {
  getLocalVersion() {
    const row = db.getFirstSync<{ value: string }>(
      `SELECT value FROM app_meta WHERE key = ?`,
      ["mentorship_version"]
    );

    return row?.value ? Number(row.value) : 0;
  },

  setLocalVersion(version: number) {
    db.runSync(
      `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
      ["mentorship_version", String(version)]
    );
  },

  clearAll() {
    db.execSync(`
      DELETE FROM mentorship_items;
      DELETE FROM mentorships;
    `);
  },

  saveAll(rawMentorships: any[]) {
    const mentorships = rawMentorships.map(normalizeMentorship);

    db.withTransactionSync(() => {
      this.clearAll();

      mentorships.forEach((m) => {
        db.runSync(
          `
          INSERT OR REPLACE INTO mentorships (
            id, title, description, image_url, explore_text,
            goal_class_id, visibility, created_at,
            price_paise, price_rupees, is_free, has_access
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            m.id,
            m.title,
            m.description,
            m.image_url,
            m.explore_text,
            m.goal_class_id,
            m.visibility,
            m.created_at,
            m.price_paise,
            m.price_rupees,
            m.is_free ? 1 : 0,
            m.has_access ? 1 : 0,
          ]
        );

        m.items.forEach((item) => {
          db.runSync(
            `
            INSERT INTO mentorship_items (
              mentorship_id,
              content_id,
              content_type
            ) VALUES (?, ?, ?)
            `,
            [m.id, item.content_id, item.content_type]
          );
        });
      });
    });
  },

  getAll(): Mentorship[] {
    const rows = db.getAllSync<any>(
      `SELECT * FROM mentorships ORDER BY created_at DESC`
    );

    return rows.map((row) => {
      const items = db.getAllSync<MentorshipItem>(
        `
        SELECT content_id, content_type
        FROM mentorship_items
        WHERE mentorship_id = ?
        `,
        [row.id]
      );

      return normalizeMentorship({
        ...row,
        is_free: Boolean(row.is_free),
        has_access: Boolean(row.has_access),
        items,
      });
    });
  },
};