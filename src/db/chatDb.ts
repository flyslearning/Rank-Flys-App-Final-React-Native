import { db, initDatabase } from "./database";

export const ChatDb = {
  init() {
    initDatabase();
  },

  saveMessages(goalClassID: string, messages: any[]) {
    this.init();

    if (!goalClassID || !Array.isArray(messages)) return;

    db.withTransactionSync(() => {
      messages.forEach((msg) => {
        if (!msg) return;

        const id = String(
          msg.id ||
          msg.message_id ||
          `${goalClassID}_${Date.now()}_${Math.random()}`
        );

        db.runSync(
          `
          INSERT OR REPLACE INTO chat_messages
          (
            id,
            goal_class_id,
            user_id,
            user_name,
            user_avatar,
            body,
            type,
            created_at,
            cached_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            id,
            goalClassID,
            String(msg.user_id || msg.sender_id || ""),
            String(msg.user_name || msg.name || "Student"),
            String(msg.user_avatar || msg.avatar || ""),
            String(msg.body || msg.message || ""),
            String(msg.type || "text"),
            String(msg.created_at || new Date().toISOString()),
            Date.now(),
          ]
        );
      });
    });
  },

  getMessages(goalClassID: string, limit = 50) {
    this.init();

    const rows = db.getAllSync<any>(
      `
      SELECT *
      FROM chat_messages
      WHERE goal_class_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
      `,
      [goalClassID, limit]
    );

    return rows.reverse();
  },

  clearGroup(goalClassID: string) {
    this.init();

    db.runSync(
      `DELETE FROM chat_messages WHERE goal_class_id = ?`,
      [goalClassID]
    );
  },

  clearAll() {
    this.init();
    db.runSync(`DELETE FROM chat_messages`);
  },
};