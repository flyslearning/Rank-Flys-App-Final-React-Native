import { db, initDatabase } from "./database";

function safeParseJSON(value: any) {
  try {
    if (!value) return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeMessage(msg: any) {
  return {
    ...msg,
    poll: safeParseJSON(msg.poll_json),
    is_pinned: Boolean(msg.is_pinned),
  };
}

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
            reply_to_message_id,
            reply_to_body,
            reply_to_user_name,
            poll_id,
            poll_json,
            is_pinned,
            pinned_at,
            pinned_by,
            created_at,
            cached_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            id,
            goalClassID,
            String(msg.user_id || msg.sender_id || ""),
            String(msg.user_name || msg.name || "Student"),
            String(msg.user_avatar || msg.avatar || ""),
            String(msg.body || msg.message || ""),
            String(msg.type || "text"),

            String(msg.reply_to_message_id || ""),
            String(msg.reply_to_body || ""),
            String(msg.reply_to_user_name || ""),

            String(msg.poll_id || msg.poll?.id || ""),
            msg.poll ? JSON.stringify(msg.poll) : "",

            msg.is_pinned ? 1 : 0,
            String(msg.pinned_at || ""),
            String(msg.pinned_by || ""),

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

    return rows.reverse().map(normalizeMessage);
  },

  savePinnedMessages(goalClassID: string, messages: any[]) {
    this.saveMessages(goalClassID, messages);
  },

  getPinnedMessages(goalClassID: string) {
    this.init();

    const rows = db.getAllSync<any>(
      `
      SELECT *
      FROM chat_messages
      WHERE goal_class_id = ?
      AND is_pinned = 1
      ORDER BY datetime(pinned_at) DESC
      `,
      [goalClassID]
    );

    return rows.map(normalizeMessage);
  },

  updatePoll(goalClassID: string, poll: any) {
    this.init();

    if (!goalClassID || !poll?.id) return;

    db.runSync(
      `
      UPDATE chat_messages
      SET poll_json = ?
      WHERE goal_class_id = ?
      AND poll_id = ?
      `,
      [JSON.stringify(poll), goalClassID, String(poll.id)]
    );
  },

  closePoll(goalClassID: string, pollID: string) {
    this.init();

    if (!goalClassID || !pollID) return;

    const row = db.getFirstSync<any>(
      `
      SELECT *
      FROM chat_messages
      WHERE goal_class_id = ?
      AND poll_id = ?
      LIMIT 1
      `,
      [goalClassID, pollID]
    );

    if (!row) return;

    const poll = safeParseJSON(row.poll_json) || {};
    poll.is_active = false;

    db.runSync(
      `
      UPDATE chat_messages
      SET poll_json = ?
      WHERE goal_class_id = ?
      AND poll_id = ?
      `,
      [JSON.stringify(poll), goalClassID, pollID]
    );
  },

  setPinned(goalClassID: string, messageID: string, pinned: boolean) {
    this.init();

    if (!goalClassID || !messageID) return;

    db.runSync(
      `
      UPDATE chat_messages
      SET is_pinned = ?,
          pinned_at = ?
      WHERE goal_class_id = ?
      AND id = ?
      `,
      [
        pinned ? 1 : 0,
        pinned ? new Date().toISOString() : "",
        goalClassID,
        messageID,
      ]
    );
  },

  clearGroup(goalClassID: string) {
    this.init();

    db.runSync(`DELETE FROM chat_messages WHERE goal_class_id = ?`, [
      goalClassID,
    ]);
  },

  clearAll() {
    this.init();
    db.runSync(`DELETE FROM chat_messages`);
  },
};