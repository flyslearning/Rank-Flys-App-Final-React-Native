import { create } from "zustand";
import { storage } from "../utils/storage";

type AppState = {
  isAppReady: boolean;
  hasSeenIntro: boolean;
  loadApp: () => Promise<void>;
  completeIntro: () => Promise<void>;
};

export const useAppStore = create<AppState>((set) => ({
  isAppReady: false,
  hasSeenIntro: false,

  loadApp: async () => {
    try {
      const seen = await storage.get<string | boolean>("has_seen_intro");

      const hasSeenIntro = seen === true || seen === "true";

      console.log("Stored intro value:", seen);
      console.log("Intro seen:", hasSeenIntro);

      set({
        hasSeenIntro,
        isAppReady: true,
      });
    } catch (error) {
      console.log("App load error:", error);

      set({
        hasSeenIntro: false,
        isAppReady: true,
      });
    }
  },

  completeIntro: async () => {
    await storage.set("has_seen_intro", true);

    set({
      hasSeenIntro: true,
    });
  },
}));