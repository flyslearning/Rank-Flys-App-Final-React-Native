import { create } from "zustand";
import { storage } from "../utils/storage";
import { AUTH_BASE_URL } from "../api/client";
import { clearDataOnLogout } from "../utils/clearstorage";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  isReady: boolean;
  isAuthenticated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: any) => Promise<void>;
  loadUser: () => Promise<void>;
  loadTokens: () => Promise<void>;
  clearTokens: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isReady: false,
  isAuthenticated: false,

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
    storage.set("access_token", accessToken),
    storage.set("refresh_token", refreshToken),
  ]);

    set({
      accessToken,
      refreshToken,
      isReady: true,
      isAuthenticated: true,
    });
  },

  setUser: async (user) => {
  set((state) => {
    const mergedUser = {
      ...state.user,
      ...user,
    };

    storage.set("user", mergedUser).catch(console.log);

    return {
      user: mergedUser,
      };
    });
  },

  loadUser: async () => {
    const user = await storage.get<any>("user");

    set({
      user: user || null,
    });
  },

  loadTokens: async () => {
    try {
      const accessToken = await storage.get<string>("access_token");
      const refreshToken = await storage.get<string>("refresh_token");
      const user = await storage.get<any>("user");

      set({
        accessToken,
        refreshToken,
        user: user || null,
        isReady: true,
        isAuthenticated: !!accessToken && !!refreshToken,
      });
    } catch (error) {
      console.log("Load tokens error:", error);

      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isReady: true,
        isAuthenticated: false,
      });
    }
  },

  clearTokens: async () => {
    await storage.remove("access_token");
    await storage.remove("refresh_token");
    await storage.remove("user");

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isReady: true,
      isAuthenticated: false,
    });
  },

    logout: async () => {
    await clearDataOnLogout();

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isReady: true,
      isAuthenticated: false,
    });
    },

  refreshAccessToken: async () => {
    const refreshToken = await storage.get<string>("refresh_token");

    if (!refreshToken) {
      return null;
    }

    try {
      const res = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
      await storage.remove("access_token");
      await storage.remove("refresh_token");

      set({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });

      return null;
    }

      const newAccessToken = data.access_token || data.accessToken;
      const newRefreshToken = data.refresh_token || data.refreshToken;

      if (!newAccessToken || !newRefreshToken) {
      await storage.remove("access_token");
      await storage.remove("refresh_token");

      set({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });

      return null;
    }

      await Promise.all([
      storage.set("access_token", newAccessToken),
      storage.set("refresh_token", newRefreshToken),
    ]);

      set({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        isReady: true,
        isAuthenticated: true,
      });

      return newAccessToken;
    } catch {
      return null;
    }
  },
}));