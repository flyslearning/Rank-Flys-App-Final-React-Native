import { create } from "zustand";
import { storage } from "../utils/storage";
import { clearAllCachedPdfs } from "../utils/pdfCache";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  isAuthenticated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  loadTokens: () => Promise<void>;
  clearTokens: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isReady: false,
  isAuthenticated: false,

  setTokens: async (accessToken, refreshToken) => {
    await storage.set("access_token", accessToken);
    await storage.set("refresh_token", refreshToken);

    set({
      accessToken,
      refreshToken,
      isReady: true,
      isAuthenticated: true,
    });
  },

  loadTokens: async () => {
    try {
      const accessToken = await storage.get<string>("access_token");
      const refreshToken = await storage.get<string>("refresh_token");

      set({
        accessToken,
        refreshToken,
        isReady: true,
        isAuthenticated: !!accessToken && !!refreshToken,
      });
    } catch (error) {
      console.log("Load tokens error:", error);

      set({
        accessToken: null,
        refreshToken: null,
        isReady: true,
        isAuthenticated: false,
      });
    }
  },

  clearTokens: async () => {
    await storage.remove("access_token");
    await storage.remove("refresh_token");

    set({
      accessToken: null,
      refreshToken: null,
      isReady: true,
      isAuthenticated: false,
    });
  },

  logout: async () => {
    await clearAllCachedPdfs();
    await storage.remove("access_token");
    await storage.remove("refresh_token");

    set({
      accessToken: null,
      refreshToken: null,
      isReady: true,
      isAuthenticated: false,
    });
  },
}));