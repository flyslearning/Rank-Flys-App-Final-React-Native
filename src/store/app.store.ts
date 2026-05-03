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
    const seen = await storage.get<string>("has_seen_intro");

    set({
      hasSeenIntro: seen === "true",
      isAppReady: true,
    });
  },

  completeIntro: async () => {
    await storage.set("has_seen_intro", "true");

    set({
      hasSeenIntro: true,
    });
  },
}));