import { create } from "zustand";
import { mentorshipApi } from "../api/mentorship.api";
import { mentorshipDb, Mentorship } from "../db/mentorshipDb";

type MentorshipStore = {
  mentorships: Mentorship[];
  syncing: boolean;
  loadLocal: () => void;
  syncMentorships: () => Promise<void>;
  forceRefreshFromApi: () => Promise<void>;
};

const hasPrice = (data: any[]) => {
  return data.some(
    (x) =>
      Number(x.price_paise || 0) > 0 ||
      Number(x.price_rupees || 0) > 0 ||
      x.is_free === true
  );
};

export const useMentorshipStore = create<MentorshipStore>((set) => ({
  mentorships: [],
  syncing: false,

  loadLocal: () => {
    set({ mentorships: mentorshipDb.getAll() });
  },

  syncMentorships: async () => {
    try {
      set({ syncing: true });

      let finalData: any[] = [];

      try {
        const localVersion = mentorshipDb.getLocalVersion();
        const check = await mentorshipApi.syncCheck(localVersion);

        if (check.update_available) {
          const full = await mentorshipApi.syncFull();
          finalData = full?.data?.mentorships ?? [];

          if (full?.server_version) {
            mentorshipDb.setLocalVersion(Number(full.server_version));
          }
        }
      } catch (syncError) {
        console.log("Sync API failed, using mentorship/my fallback");
      }

      if (!finalData.length || !hasPrice(finalData)) {
        finalData = await mentorshipApi.getMyMentorships();
      }

      mentorshipDb.saveAll(finalData);
      set({ mentorships: mentorshipDb.getAll() });
    } catch (error) {
      console.log("Mentorship sync error:", error);
      set({ mentorships: mentorshipDb.getAll() });
    } finally {
      set({ syncing: false });
    }
  },

  forceRefreshFromApi: async () => {
    try {
      set({ syncing: true });

      const apiData = await mentorshipApi.getMyMentorships();
      mentorshipDb.saveAll(apiData);

      set({ mentorships: mentorshipDb.getAll() });
    } catch (error) {
      console.log("Mentorship refresh error:", error);
    } finally {
      set({ syncing: false });
    }
  },
}));