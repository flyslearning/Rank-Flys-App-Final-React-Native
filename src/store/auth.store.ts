import { create } from "zustand";
import { storage } from "../utils/storage";
import { AUTH_BASE_URL, clearDefaultAuthorizationHeader, setDefaultAuthorizationHeader } from "../api/client";
import { clearDataOnLogout } from "../utils/clearstorage";
import { recordError, clearCrashUser } from "../utils/crashlytics";

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

export const useAuthStore = create<AuthState>((set, get) => ({
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

  setDefaultAuthorizationHeader(accessToken);

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

      if (accessToken) {
        setDefaultAuthorizationHeader(accessToken);
      }

      set({
        accessToken,
        refreshToken,
        user: user || null,
        isReady: true,
        isAuthenticated: !!accessToken && !!refreshToken,
      });
       } catch (error) {
      console.log("Load tokens error:", error);
      recordError(error, "auth.store.ts: Load tokens error");

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

    clearDefaultAuthorizationHeader();

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
    clearCrashUser();

    clearDefaultAuthorizationHeader();

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
        if (res.status === 401 || res.status === 403) {
          await get().clearTokens();
        }

        return null;
      }

      const newAccessToken = data.access_token || data.accessToken;
      const newRefreshToken = data.refresh_token || data.refreshToken;

      if (!newAccessToken || !newRefreshToken) {
        recordError(data, "auth.store.ts: Refresh response missing tokens");
        return null;
      }

     await get().setTokens(newAccessToken, newRefreshToken);

    return newAccessToken;
    } catch (error) {
      recordError(error, "auth.store.ts: Refresh Access Token Error");
      return null;
    }
      },
    }));