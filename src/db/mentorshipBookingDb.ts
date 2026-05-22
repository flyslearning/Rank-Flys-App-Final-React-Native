import { db } from "./database";
import { MentorshipPlan } from "../api/mentorship.api";

export const mentorshipBookingDb = {
  savePlans(plans: MentorshipPlan[]) {
    const now = Date.now();

    db.withTransactionSync(() => {
      db.runSync(`DELETE FROM mentorship_booking_plans`);

      plans.forEach((p) => {
        db.runSync(
          `
          INSERT OR REPLACE INTO mentorship_booking_plans (
            id, title, description, duration_minutes, price_paise, cached_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            p.id,
            p.title ?? "",
            p.description ?? "",
            Number(p.duration_minutes ?? 0),
            Number(p.price_paise ?? 0),
            now,
          ]
        );
      });
    });
  },

  getPlans(): MentorshipPlan[] {
    return db.getAllSync<MentorshipPlan>(
      `SELECT id, title, description, duration_minutes, price_paise
       FROM mentorship_booking_plans
       ORDER BY price_paise ASC`
    );
  },
};