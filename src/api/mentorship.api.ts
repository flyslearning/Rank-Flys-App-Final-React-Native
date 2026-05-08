import { mentorshipClient } from "./client";

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
};