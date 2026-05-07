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
  hasSeenIntro: true,

  loadApp: async () => {
    try {
      // 🔹 intro flag
      const seen = await storage.get<string>("has_seen_intro");

      // 🔹 check if user already logged in
      const accessToken = await storage.get<string>("access_token");

      // 🔥 IMPORTANT LOGIC
      const shouldMarkIntroSeen = seen === "true" || !!accessToken;

      // 🔹 if user logged in but intro not saved → save it
      if (shouldMarkIntroSeen && seen !== "true") {
        await storage.set("has_seen_intro", "true");
      }

      set({
        hasSeenIntro: shouldMarkIntroSeen,
        isAppReady: true,
      });
    } catch (error) {
      console.log("App load error:", error);

      set({
        hasSeenIntro: true,
        isAppReady: true,
      });
    }
  },

  completeIntro: async () => {
    await storage.set("has_seen_intro", "true");

    set({
      hasSeenIntro: true,
    });
  },
}));