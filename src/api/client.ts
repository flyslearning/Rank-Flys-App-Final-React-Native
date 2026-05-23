import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/auth.store";

export const AUTH_BASE_URL = process.env.EXPO_PUBLIC_AUTH_API;
export const TEST_BASE_URL = process.env.EXPO_PUBLIC_TEST_API;
export const EBOOK_BASE_URL = process.env.EXPO_PUBLIC_EBOOK_API;
export const PAYMENT_BASE_URL = process.env.EXPO_PUBLIC_PAYMENT_API;
export const TOOL_BASE_URL = process.env.EXPO_PUBLIC_TOOL_API;
export const MENTORSHIP_BASE_URL = process.env.EXPO_PUBLIC_MENTORSHIP_API;
export const CHAT_BASE_URL = process.env.EXPO_PUBLIC_CHAT_API;

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set<T>(key: string, value: T) {
    if (typeof value === "string") {
      await AsyncStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  },

  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },

  async clear() {
    console.warn("storage.clear() disabled to protect intro_seen");
  },
};

export const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const toolClient = axios.create({
  baseURL: TOOL_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const mentorshipClient = axios.create({
  baseURL: MENTORSHIP_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const testClient = axios.create({
  baseURL: TEST_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ebookClient = axios.create({
  baseURL: EBOOK_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const paymentClient = axios.create({
  baseURL: PAYMENT_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const chatClient = axios.create({
  baseURL: CHAT_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Refresh ke liye raw client, isme interceptor nahi lagana
const refreshClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _client?: AxiosInstance;
};

let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

const attachToken = (
  config: InternalAxiosRequestConfig,
  client: AxiosInstance
) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  (config as RetryConfig)._client = client;

  return config;
};

const setDefaultAuthorizationHeader = (accessToken: string) => {
  authClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  testClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  ebookClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  paymentClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  toolClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  mentorshipClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  chatClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
};

const refreshTokenAndRetry = async (error: AxiosError) => {
  const originalRequest = error.config as RetryConfig | undefined;

  if (!originalRequest || originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;

          const client = originalRequest._client || authClient;
          resolve(client(originalRequest));
        },
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    const { refreshToken, setTokens } = useAuthStore.getState();

    if (!refreshToken) {
      return Promise.reject(error);
    }

    const response = await refreshClient.post("/auth/refresh", {
      refresh_token: refreshToken,
    });

    const newAccessToken =
    response.data.access_token || response.data.accessToken;

  const newRefreshToken =
    response.data.refresh_token ||
    response.data.refreshToken ||
    refreshToken;

  if (!newAccessToken) {
    return Promise.reject(error);
  }

    await setTokens(newAccessToken, newRefreshToken);

    setDefaultAuthorizationHeader(newAccessToken);

    processQueue(null, newAccessToken);

   originalRequest.headers = originalRequest.headers || {};
   originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    const client = originalRequest._client || authClient;

    return client(originalRequest);
  } catch (refreshError) {
  processQueue(refreshError, null);

  console.log("REFRESH TOKEN ERROR", refreshError);

  return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
  };

export const setAuthToken = async (
  accessToken: string,
  refreshToken?: string
) => {
  if (refreshToken) {
    await useAuthStore.getState().setTokens(accessToken, refreshToken);
  }

  setDefaultAuthorizationHeader(accessToken);
};

const attachRefreshInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const message = JSON.stringify(error.response?.data || "").toLowerCase();

      if (
        status === 401 ||
        status === 403 ||
        (
          status === 400 &&
          (
            message.includes("token") ||
            message.includes("jwt") ||
            message.includes("expired") ||
            message.includes("unauthorized")
          )
        )
      ) {
        return refreshTokenAndRetry(error);
      }

      return Promise.reject(error);
    }
  );
};

authClient.interceptors.request.use((config) =>
  attachToken(config, authClient)
);

testClient.interceptors.request.use((config) =>
  attachToken(config, testClient)
);

ebookClient.interceptors.request.use((config) =>
  attachToken(config, ebookClient)
);

paymentClient.interceptors.request.use((config) =>
  attachToken(config, paymentClient)
);

toolClient.interceptors.request.use((config) =>
  attachToken(config, toolClient)
);

mentorshipClient.interceptors.request.use((config) =>
  attachToken(config, mentorshipClient)
);

chatClient.interceptors.request.use((config) =>
  attachToken(config, chatClient)
);

attachRefreshInterceptor(authClient);
attachRefreshInterceptor(testClient);
attachRefreshInterceptor(ebookClient);
attachRefreshInterceptor(paymentClient);
attachRefreshInterceptor(toolClient);
attachRefreshInterceptor(mentorshipClient);
attachRefreshInterceptor(chatClient);