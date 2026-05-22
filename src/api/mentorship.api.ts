import { mentorshipClient } from "./client";

export type MentorshipPlan = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price_paise: number;
};

export type MentorshipSlot = {
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

export const mentorshipApi = {
  getMyMentorships: async () => {
    const res = await mentorshipClient.get("/api/tools/mentorship/my");
    return res.data?.data ?? [];
  },

  getFullDetails: async (mentorshipId: string) => {
    const res = await mentorshipClient.get(`/api/tools/mentorship/${mentorshipId}/full`);
    return res.data;
  },

  syncCheck: async (localVersion: number) => {
    const res = await mentorshipClient.get(
      `/api/tools/sync/check?module=mentorship&local_version=${localVersion}`
    );
    return res.data;
  },

  syncFull: async () => {
    const res = await mentorshipClient.get("/api/tools/sync/full?module=mentorship");
    return res.data;
  },
  getAnnouncements: async (mentorshipId: string) => {
  const res = await mentorshipClient.get(
    `/api/tools/mentorship/mentorship/${mentorshipId}/announcements`
  );
  return res.data;
},

getLiveSessions: async (mentorshipId: string) => {
  const res = await mentorshipClient.get(
    `/api/tools/mentorship/mentorship/${mentorshipId}/live-sessions`
  );
  return res.data;
},
  getBookingHome: async () => {
    const res = await mentorshipClient.get("/api/tools/mentorship/booking-home");
    return res.data?.data ?? { plans: [] };
  },

  getSlots: async (date: string, planId: string) => {
    const res = await mentorshipClient.get(
      `/api/tools/mentorship/slots?date=${date}&plan_id=${planId}`
    );
    return res.data?.data ?? [];
  },

  createBookingOrder: async (body: {
    plan_id: string;
    booking_date: string;
    start_time: string;
    student_note?: string;
  }) => {
    const res = await mentorshipClient.post(
      "/api/tools/mentorship/bookings/create-order",
      body
    );
    return res.data?.data;
  },

    verifyBookingPayment: async (body: {
  booking_id: string;
  provider_order_id: string;
  provider_payment_id: string;
  provider_signature: string;
  signature?: string;
  meeting_link?: string;
  }) => {
    const res = await mentorshipClient.post(
      "/api/tools/mentorship/bookings/verify",
      body
    );
    return res.data;
  },
  getMyBookings: async () => {
    const res = await mentorshipClient.get("/api/tools/mentorship/bookings/my");
    return res.data?.data ?? [];
  },
};